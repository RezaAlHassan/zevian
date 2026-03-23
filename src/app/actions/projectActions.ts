'use server'

import { createServerClient } from '@/lib/supabase/server'
import { projectService, employeeService } from '@/../databaseService2'
import { revalidatePath } from 'next/cache'

export async function upsertProjectAction(formData: any) {
    try {
        const supabase = createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Not authenticated' }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee || (employee.role !== 'manager' && !employee.isAccountOwner)) {
            return { error: 'Unauthorized: Only managers can manage projects' }
        }

        if (!employee.isAccountOwner && !employee.permissions?.canCreateProjects) {
            return { error: 'Unauthorized: You do not have permission to manage projects' }
        }

        const projectData = {
            id: formData.id || `proj-${Math.random().toString(36).substring(2, 9)}`,
            organizationId: employee.organizationId,
            name: formData.name,
            description: formData.description,
            category: formData.category,
            reportFrequency: formData.frequency.toLowerCase(),
            createdBy: employee.id,
            status: formData.status || 'active',
            assignees: [] // Default empty, can be updated later
        }

        if (formData.id && !formData.id.startsWith('mock-')) {
            await projectService.update(formData.id, projectData)
        } else {
            await projectService.create(projectData)
        }

        revalidatePath('/dashboard')
        revalidatePath('/projects')
        return { success: true }
    } catch (error: any) {
        console.error('upsertProjectAction Error:', error)
        return { error: error.message || 'Failed to save project' }
    }
}

export async function deleteProjectAction(projectId: string) {
    try {
        const supabase = createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Not authenticated' }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee || (employee.role !== 'manager' && !employee.isAccountOwner)) {
            return { error: 'Unauthorized' }
        }

        if (!employee.isAccountOwner && !employee.permissions?.canCreateProjects) {
            return { error: 'Unauthorized: You do not have permission to manage projects' }
        }

        await projectService.delete(projectId)

        revalidatePath('/dashboard')
        revalidatePath('/projects')
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to delete project' }
    }
}

export async function updateProjectStatusAction(projectId: string, status: string) {
    try {
        const supabase = createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Not authenticated' }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee || (employee.role !== 'manager' && !employee.isAccountOwner)) return { error: 'Unauthorized' }

        if (!employee.isAccountOwner && !employee.permissions?.canCreateProjects) {
            return { error: 'Unauthorized: You do not have permission to manage projects' }
        }

        await projectService.update(projectId, { status } as any)
        
        // Cascading completion: If project is completed, mark all its goals as completed
        if (status === 'completed') {
            const { goalService } = await import('@/../databaseService2')
            const projectGoals = await goalService.getByProjectId(projectId)
            const activeGoals = projectGoals.filter((g: any) => g.status !== 'completed')
            
            await Promise.all(activeGoals.map((g: any) => 
                goalService.update(g.id, { status: 'completed' })
            ))
        }

        revalidatePath('/dashboard')
        revalidatePath('/projects')
        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to update status' }
    }
}

export async function getProjectsAction() {
    try {
        const supabase = createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Not authenticated' }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee) return { error: 'Employee not found' }

        let projects
        if (employee.role === 'manager' && !employee.isAccountOwner && !employee.permissions?.canViewOrganizationWide) {
            projects = await projectService.getByEmployeeId(employee.id)
        } else {
            projects = await projectService.getAll()
        }
        
        return { projects }
    } catch (error: any) {
        return { error: error.message || 'Failed to fetch projects' }
    }
}

export async function getEmployeeProjectsAction() {
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

        const projects = await projectService.getByEmployeeId(employee.id)
        return { success: true, data: projects }
    } catch (error: any) {
        console.error('getEmployeeProjectsAction Error:', error)
        return { success: false, error: error.message }
    }
}
