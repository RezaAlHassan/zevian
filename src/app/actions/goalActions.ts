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
        if (!employee || employee.role !== 'manager') {
            return { error: 'Unauthorized: Only managers can manage goals' }
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
                weight: c.weight
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
        return { success: true }
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
        if (!employee || employee.role !== 'manager') {
            return { error: 'Unauthorized' }
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
        return { success: true, data: goals }
    } catch (error: any) {
        console.error('getEmployeeGoalsAction Error:', error)
        return { success: false, error: error.message }
    }
}
