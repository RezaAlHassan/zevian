import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { ProjectsView } from '@/components/organisms/ProjectsView'
import { getEmployeeProjectsAction } from '@/app/actions/projectActions'

export const metadata: Metadata = { title: 'Projects | Zevian' }

export default async function EmployeeProjectsPage() {
    const supabase = createServerClient()

    const [projectsResult, { data: employees }] = await Promise.all([
        getEmployeeProjectsAction(),
        supabase
            .from('employees')
            .select('id, name, role'),
    ])

    const projects = projectsResult.success ? projectsResult.data : []

    return (
        <ProjectsView
            projects={projects ?? []}
            employees={employees ?? []}
            readOnly={true}
            basePath="/my-projects"
        />
    )
}
