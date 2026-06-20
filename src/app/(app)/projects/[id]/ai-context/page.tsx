import { projectService } from '@/../databaseService2'
import { AIContextView } from '@/components/organisms/AIContextView'
import { getSessionContext } from '@/lib/auth/session'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Project Memory' }

export default async function ProjectMemoryPage({ params }: { params: { id: string } }) {
    const projectData = await projectService.getById(params.id)
    if (!projectData) notFound()

    // Reuse the (app) layout's request-cached identity for the permission check.
    const ctx = await getSessionContext()
    let readOnly = false
    if (ctx) {
        const employee = ctx.employee
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
