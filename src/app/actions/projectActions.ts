'use server'

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { projectService, employeeService } from '@/../databaseService2'
import { revalidatePath } from 'next/cache'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { withRetry } from '@/lib/ai/withRetry'

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
        return { success: true, projectId: projectData.id }
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

export async function updateProjectMembersAction(projectId: string, memberIds: string[]) {
    try {
        const supabase = createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Not authenticated' }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee || (employee.role !== 'manager' && !employee.isAccountOwner)) {
            return { error: 'Unauthorized: Only managers can manage project assignments' }
        }

        // Delete existing assignees then insert new list
        await supabase.from('project_assignees').delete().eq('project_id', projectId)

        if (memberIds.length > 0) {
            const rows = memberIds.map(id => ({
                project_id: projectId,
                assignee_id: id,
                assignee_type: 'manager',
            }))
            const { error: insertError } = await supabase.from('project_assignees').insert(rows)
            if (insertError) throw insertError
        }

        revalidatePath('/projects')
        revalidatePath('/dashboard')
        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error: any) {
        console.error('updateProjectMembersAction Error:', error)
        return { error: error.message || 'Failed to update project members' }
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

export async function refreshProjectMemoryAction(projectId: string) {
    try {
        const supabase = createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Not authenticated' }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee || (employee.role !== 'manager' && !employee.isAccountOwner)) {
            return { error: 'Unauthorized' }
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY
        if (!GEMINI_API_KEY) return { error: 'GEMINI_API_KEY not configured' }

        // Fetch current ai_context
        const projectData = await projectService.getById(projectId)
        const existingMemory: string = (projectData as any)?.aiContext ?? ''

        // Fetch goal IDs for this project, then fetch last 10 scored reports
        const adminClient = createAdminClient()
        const { data: goals } = await (adminClient.from('goals') as any)
            .select('id')
            .eq('project_id', projectId)
        const goalIds = (goals ?? []).map((g: any) => g.id)

        if (goalIds.length === 0) {
            return { error: 'No scored reports found for this project yet.' }
        }

        const { data: scoredReports, error: reportsError } = await (adminClient.from('reports') as any)
            .select('report_text, evaluation_score, evaluation_reasoning')
            .in('goal_id', goalIds)
            .not('evaluation_score', 'is', null)
            .order('submission_date', { ascending: false })
            .limit(10)

        if (reportsError) {
            console.error('refreshProjectMemoryAction reports query error:', reportsError)
            return { error: 'Failed to fetch reports' }
        }

        if (!scoredReports || scoredReports.length === 0) {
            return { error: 'No scored reports found for this project yet.' }
        }

        const reportsSummary = scoredReports.map((r: any, i: number) =>
            `Report ${i + 1} (overall score: ${r.evaluation_score}):\n${r.report_text?.slice(0, 600) ?? '(no content)'}${r.evaluation_reasoning ? `\nAI reasoning: ${r.evaluation_reasoning.slice(0, 200)}` : ''}`
        ).join('\n\n---\n\n')

        const prompt = `Given these ${scoredReports.length} employee reports and their scores, extract 1-5 short facts, patterns, or definitions worth remembering for future scoring in this project. Only include things not already covered in the existing memory below. Return plain text bullet points only. If nothing new, return empty string.

Existing memory:
${existingMemory || '(none)'}

Reports:
${reportsSummary}`

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const result = await withRetry(
            'project-memory-refresh',
            () => model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 2048, temperature: 0.3 }
            })
        )

        const output = result.response.text().trim()
        if (!output) {
            return { success: true, memory: existingMemory, reportCount: scoredReports.length, noNewFacts: true }
        }

        const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        const updatedMemory = (existingMemory ? existingMemory + '\n\n' : '') + `[Auto-added ${dateStr}]:\n${output}`

        await projectService.update(projectId, { aiContext: updatedMemory } as any)
        revalidatePath(`/projects/${projectId}/ai-context`)

        return { success: true, memory: updatedMemory, reportCount: scoredReports.length }
    } catch (error: any) {
        console.error('refreshProjectMemoryAction Error:', error)
        return { error: error.message || 'Failed to update project memory' }
    }
}

export async function updateProjectMemoryAction(projectId: string, memory: string) {
    try {
        const supabase = createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Not authenticated' }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee || (employee.role !== 'manager' && !employee.isAccountOwner)) {
            return { error: 'Unauthorized' }
        }

        await projectService.update(projectId, { aiContext: memory } as any)

        revalidatePath(`/projects/${projectId}/ai-context`)
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to update project memory' }
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
