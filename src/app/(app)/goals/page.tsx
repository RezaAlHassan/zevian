import type { Metadata } from 'next'
import { GoalsView } from '@/components/organisms/GoalsView'
import { goalService, projectService, employeeService } from '@/../databaseService2'

import { getSessionContext } from '@/lib/auth/session'

export const metadata: Metadata = { title: 'KPIs' }

export default async function GoalsPage({ searchParams }: { searchParams: { view?: string } }) {
  // Reuses the (app) layout's request-cached identity — no extra auth or employee hop.
  const ctx = await getSessionContext()
  if (!ctx) return null

  const employee = ctx.employee

  const canViewOrg = employee.isAccountOwner || employee.permissions?.canViewOrganizationWide || employee.role === 'admin'
  const effectiveView = searchParams.view ?? (canViewOrg ? 'org' : 'direct')

  let [goals, projects, employees] = await Promise.all([
    goalService.getAll(),
    projectService.getAll(),
    employeeService.getAll()
  ])

  if (!(canViewOrg && effectiveView === 'org')) {
    // Filter to Direct Reports only using centralized service logic
    [goals, projects] = await Promise.all([
      goalService.getByEmployeeId(employee.id),
      projectService.getByEmployeeId(employee.id)
    ])
    
    // Filter employees: direct reports only
    employees = employees.filter((e: any) => e.managerId === employee.id)
  }

  // Enrich each goal with the full project object
  const formattedGoals = goals.map((g: any) => ({
    ...g,
    project: projects.find((p: any) => p.id === g.projectId) || g.project || { name: 'Unknown', emoji: '⚙️' },
  }))

  return (
    <GoalsView
      goals={formattedGoals}
      projects={projects ?? []}
      employees={employees ?? []}
      showDeadlineOnly={true}
    />
  )
}
