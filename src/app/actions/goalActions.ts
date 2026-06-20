'use server'

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { goalService, employeeService } from '@/../databaseService2'
import { revalidatePath } from 'next/cache'

export async function upsertGoalAction(formData: any) {
    try {
        const supabase = createServerClient()
        const user = await getAuthUser()
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
        const user = await getAuthUser()
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
        const user = await getAuthUser()
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
        const user = await getAuthUser()
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
        const user = await getAuthUser()

        if (!user) {
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

export async function addCriterionToGoalAction(input: {
    goalId: string
    name: string
    importance: 'low' | 'medium' | 'high' | 'critical'
}): Promise<{ success: true; criteria: { id: string; name: string; weight: number; target_description: string | null }[] } | { error: string }> {
    try {
        const supabase = createServerClient()
        const user = await getAuthUser()
        if (!user) return { error: 'Not authenticated' }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee || (employee.role !== 'manager' && !employee.isAccountOwner)) {
            return { error: 'Unauthorized: Only managers can manage goals' }
        }

        // Use admin client to read/write criteria directly — avoids the goalService.update
        // no-op problem where passing only criteria leaves dbUpdates={} and .single() returns PGRST116.
        const admin = createAdminClient()

        const { data: existingRows, error: fetchErr } = await (admin as any)
            .from('criteria')
            .select('id, name, weight, target_description')
            .eq('goal_id', input.goalId)
            .order('display_order', { ascending: true })
        if (fetchErr) throw fetchErr
        console.log('[addCriterionToGoalAction] existing criteria count:', (existingRows || []).length, 'goalId:', input.goalId)

        // New KPI takes a fixed share based on importance; existing KPIs scale down proportionally.
        const importanceTargetWeight: Record<string, number> = {
            low: 10, medium: 15, high: 22, critical: 33,
        }
        const newCritWeight = importanceTargetWeight[input.importance] ?? 15
        const scaleRatio = (100 - newCritWeight) / 100

        const existing = (existingRows || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            weight: Math.round((c.weight || 0) * scaleRatio),
            target_description: c.target_description ?? null,
        }))

        const newCrit = {
            id: `crit-${Math.random().toString(36).slice(2, 7)}`,
            name: input.name.trim(),
            weight: newCritWeight,
            target_description: null,
        }

        const all = [...existing, newCrit]
        const sum = all.reduce((s, c) => s + c.weight, 0)
        if (sum !== 100 && all.length > 0) {
            all[all.length - 1].weight += (100 - sum)
        }

        // Delete existing and re-insert (same pattern goalService.update uses for criteria).
        const { error: deleteErr } = await (admin as any)
            .from('criteria')
            .delete()
            .eq('goal_id', input.goalId)
        if (deleteErr) throw deleteErr

        const { error: insertErr } = await (admin as any)
            .from('criteria')
            .insert(all.map((c, idx) => ({
                id: c.id,
                goal_id: input.goalId,
                name: c.name,
                weight: c.weight,
                display_order: idx,
                target_description: c.target_description,
            })))
        if (insertErr) throw insertErr

        console.log('[addCriterionToGoalAction] saved', all.length, 'criteria, new KPI:', input.name)
        revalidatePath('/goals')
        revalidatePath('/upload')

        return { success: true, criteria: all }
    } catch (error: any) {
        console.error('addCriterionToGoalAction Error:', error)
        return { error: error.message || 'Failed to add criterion' }
    }
}

export async function updateGoalMembersAction(goalId: string, memberIds: string[], projectId?: string) {
    try {
        const supabase = createServerClient()
        const user = await getAuthUser()
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
