'use server'

import { createServerClient } from '@/lib/supabase/server'
import { employeeService } from '@/../databaseService2'
import { revalidatePath } from 'next/cache'

type Section = 'lexicon' | 'priorities' | 'benchmarks' | 'constraints' | 'general'

async function getAuthorizedEmployee() {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' as const, employee: null, supabase: null }
    const employee = await employeeService.getByAuthId(user.id)
    if (!employee || (employee.role !== 'manager' && !employee.isAccountOwner)) {
        return { error: 'Unauthorized' as const, employee: null, supabase: null }
    }
    return { error: null, employee, supabase }
}

export async function createKnowledgePinAction(data: {
    projectId: string
    section: Section
    content: string
}) {
    const { error, employee, supabase } = await getAuthorizedEmployee()
    if (error || !supabase || !employee) return { error }

    const { error: dbError } = await supabase
        .from('knowledge_pins')
        .insert({ project_id: data.projectId, section: data.section, content: data.content, created_by: employee.id })

    if (dbError) return { error: dbError.message }
    revalidatePath(`/projects/${data.projectId}/ai-context`)
    return { success: true }
}

export async function updateKnowledgePinAction(data: {
    id: string
    projectId: string
    section: Section
    content: string
}) {
    const { error, supabase } = await getAuthorizedEmployee()
    if (error || !supabase) return { error }

    const { error: dbError } = await supabase
        .from('knowledge_pins')
        .update({ section: data.section, content: data.content, updated_at: new Date().toISOString() })
        .eq('id', data.id)

    if (dbError) return { error: dbError.message }
    revalidatePath(`/projects/${data.projectId}/ai-context`)
    return { success: true }
}

export async function deleteKnowledgePinAction(id: string, projectId: string) {
    const { error, supabase } = await getAuthorizedEmployee()
    if (error || !supabase) return { error }

    const { error: dbError } = await supabase
        .from('knowledge_pins')
        .delete()
        .eq('id', id)

    if (dbError) return { error: dbError.message }
    revalidatePath(`/projects/${projectId}/ai-context`)
    return { success: true }
}
