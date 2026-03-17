import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { ProjectsView } from '@/components/organisms/ProjectsView'

import { projectService, employeeService } from '@/../databaseService2'

export const metadata: Metadata = { title: 'Projects' }

export default async function ProjectsPage() {
  const projects = await projectService.getAll()
  const employees = await employeeService.getAll()

  return (
    <ProjectsView
      projects={projects ?? []}
      employees={employees ?? []}
    />
  )
}
