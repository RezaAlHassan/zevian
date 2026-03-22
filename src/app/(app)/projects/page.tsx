import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { ProjectsView } from '@/components/organisms/ProjectsView'

import { projectService, employeeService } from '@/../databaseService2'

export const metadata: Metadata = { title: 'Projects' }

export default async function ProjectsPage({ searchParams }: { searchParams: { view?: string } }) {
  const view = searchParams.view || 'org'
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const employee = await employeeService.getByAuthId(user.id)
  if (!employee) return null

  let projects
  const canViewOrg = employee.isAccountOwner || employee.permissions?.canViewOrganizationWide || employee.role === 'admin'
  
  if (canViewOrg && view === 'org') {
      projects = await projectService.getAll()
  } else {
      projects = await projectService.getByEmployeeId(employee.id)
  }

  const employees = await employeeService.getAll()
  const canCreate = employee.isAccountOwner || employee.permissions?.canCreateProjects || employee.role === 'admin'

  return (
    <ProjectsView
      projects={projects ?? []}
      employees={employees ?? []}
      readOnly={!canCreate}
    />
  )
}
