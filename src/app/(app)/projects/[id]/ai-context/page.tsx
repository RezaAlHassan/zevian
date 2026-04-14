import { createServerClient } from '@/lib/supabase/server'
import { projectService, employeeService } from '@/../databaseService2'
import { AIContextView } from '@/components/organisms/AIContextView'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Project Memory' }

export default async function ProjectMemoryPage({ params }: { params: { id: string } }) {
    const supabase = createServerClient()

    const projectData = await projectService.getById(params.id)
    if (!projectData) notFound()

    const { data: { user } } = await supabase.auth.getUser()
    let readOnly = false
    if (user) {
        const employee = await employeeService.getByAuthId(user.id)
        if (employee && employee.role === 'manager' && !employee.isAccountOwner) {
            readOnly = !employee.permissions?.canCreateProjects && !employee.permissions?.canCreateGoals
        }
    }

    return (
        <AIContextView
            project={projectData}
            readOnly={readOnly}
        />
    )
}
