import type { Metadata } from 'next'
import { ProjectsView } from '@/components/organisms/ProjectsView'

import { projectService, employeeService } from '@/../databaseService2'
import { getSessionContext } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'Projects' }

export default async function ProjectsPage({ searchParams }: { searchParams: { view?: string } }) {
  // Reuses the (app) layout's request-cached identity — no extra auth or employee hop.
  const ctx = await getSessionContext()
  if (!ctx) return null

  const employee = ctx.employee

  const canViewOrg = employee.isAccountOwner || employee.permissions?.canViewOrganizationWide || employee.role === 'admin'
  const effectiveView = searchParams.view ?? (canViewOrg ? 'org' : 'direct')

  const [projects, employees] = await Promise.all([
    canViewOrg && effectiveView === 'org'
      ? projectService.getAll()
      : projectService.getByEmployeeId(employee.id),
    employeeService.getAll(),
  ])
  const canCreate = employee.isAccountOwner || employee.permissions?.canCreateProjects || employee.role === 'admin'

  return (
    <ProjectsView
      projects={projects ?? []}
      employees={employees ?? []}
      readOnly={!canCreate}
    />
  )
}
