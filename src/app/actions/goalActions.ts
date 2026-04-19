'use server'

import { createServerClient } from '@/lib/supabase/server'
import { goalService, employeeService } from '@/../databaseService2'
import { revalidatePath } from 'next/cache'

export async function upsertGoalAction(formData: any) {
    try {
        const supabase = createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Not authenticated' }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee || (employee.role !== 'manager' && !employee.isAccountOwner)) {
            return { error: 'Unauthorized: Only managers can manage goals' }
        }

        if (!employee.isAccountOwner && !employee.permissions?.canCreateGoals) {
            return { error: 'Unauthorized: You do not have permission to manage goals' }
        }

        const goalData = {
            id: formData.id || `goal-${Math.random().toString(36).substring(2, 9)}`,
            name: formData.name,
            projectId: formData.selectedProjectId,
            instructions: formData.instructions,
            deadline: formData.deadline || null,
            managerId: employee.id,
            createdBy: employee.id,
            status: formData.status || 'active',
            criteria: (formData.criteria || []).map((c: any) => ({
                id: c.id.startsWith('ai-') || c.id.startsWith('tmpl-') || !isNaN(Number(c.id)) ? `crit-${Math.random().toString(36).substring(2, 7)}` : c.id,
                name: c.name,
                weight: Number.isFinite(c.weight) ? c.weight : 0,
                target_description: c.target_description ?? null
            })),
            assignees: [] // Default for now
        }

        if (formData.id && !formData.id.startsWith('mock-')) {
            await goalService.update(formData.id, goalData as any)
        } else {
            await goalService.create(goalData as any)
        }

        revalidatePath('/goals')
        revalidatePath('/dashboard')
        revalidatePath(`/projects/${formData.selectedProjectId}`)
        return { success: true, goalId: goalData.id }
    } catch (error: any) {
        console.error('upsertGoalAction Error:', error)
        return { error: error.message || 'Failed to save goal' }
    }
}

export async function deleteGoalAction(goalId: string, projectId?: string) {
    try {
        const supabase = createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Not authenticated' }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee || (employee.role !== 'manager' && !employee.isAccountOwner)) {
            return { error: 'Unauthorized' }
        }

        if (!employee.isAccountOwner && !employee.permissions?.canCreateGoals) {
            return { error: 'Unauthorized: You do not have permission to manage goals' }
        }

        await goalService.delete(goalId)

        revalidatePath('/goals')
        revalidatePath('/dashboard')
        if (projectId) revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to delete goal' }
    }
}

export async function updateGoalStatusAction(goalId: string, status: string, projectId?: string) {
    try {
        const supabase = createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Not authenticated' }

        await goalService.update(goalId, { status } as any)

        revalidatePath('/goals')
        revalidatePath('/dashboard')
        if (projectId) revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to update goal status' }
    }
}

export async function getGoalsAction() {
    try {
        const supabase = createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Not authenticated' }

        const goals = await goalService.getAll()
        return { goals }
    } catch (error: any) {
        return { error: error.message || 'Failed to fetch goals' }
    }
}

export async function getEmployeeGoalsAction() {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Not authenticated' }
        }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee) {
            return { success: false, error: 'Employee not found' }
        }

        const goals = await goalService.getByEmployeeId(employee.id)

        // Fetch active reporting periods to calculate true next deadline in the UI
        const { data: periods } = await supabase
            .from('reporting_periods')
            .select('*')
            .eq('employee_id', employee.id)
            .in('status', ['pending', 'submitted', 'late'])
            
        // Attach periods to goals
        const enrichedGoals = goals.map((g: any) => ({
            ...g,
            reporting_periods: periods?.filter(p => p.goal_id === g.id) || []
        }))

        return { success: true, data: enrichedGoals }
    } catch (error: any) {
        console.error('getEmployeeGoalsAction Error:', error)
        return { success: false, error: error.message }
    }
}

export async function updateGoalMembersAction(goalId: string, memberIds: string[], projectId?: string) {
    try {
        const supabase = createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Not authenticated' }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee || (employee.role !== 'manager' && !employee.isAccountOwner)) {
            return { error: 'Unauthorized: Only managers can manage goal assignments' }
        }

        // Capture current assignees before the update so we can diff
        const { data: currentAssignees } = await supabase
            .from('goal_assignees')
            .select('assignee_id')
            .eq('goal_id', goalId)
        const previousIds = (currentAssignees || []).map((a: any) => a.assignee_id)

        await goalService.updateGoalAssignees(goalId, memberIds)

        // Generate reporting periods for any newly added employees
        const newlyAdded = memberIds.filter(id => !previousIds.includes(id))
        if (newlyAdded.length > 0) {
            const { setupPeriodsForNewAssignment } = await import('@/lib/reportingPeriods')
            for (const empId of newlyAdded) {
                await setupPeriodsForNewAssignment(empId, undefined, goalId).catch(err =>
                    console.error('[updateGoalMembersAction] setupPeriodsForNewAssignment failed for', empId, err)
                )
            }
        }

        revalidatePath('/goals')
        revalidatePath('/dashboard')
        if (projectId) revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: any) {
        console.error('updateGoalMembersAction Error:', error)
        return { error: error.message || 'Failed to update goal members' }
    }
}
