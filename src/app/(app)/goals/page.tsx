import type { Metadata } from 'next'
import { GoalsView } from '@/components/organisms/GoalsView'
import { goalService, projectService, employeeService } from '@/../databaseService2'

export const metadata: Metadata = { title: 'Goals' }

export default async function GoalsPage() {
  const [goals, projects, employees] = await Promise.all([
    goalService.getAll(),
    projectService.getAll(),
    employeeService.getAll()
  ])

  // Map database structures to UI expectations if necessary
  const formattedGoals = goals.map((g: any) => ({
    ...g,
    // Add any UI-specific formatting here if needed, 
    // although goalService.getAll() should return consistent types
    project: projects.find((p: any) => p.id === g.projectId) || { name: 'Unknown', emoji: '⚙️' },
    report_count: (g as any).report_count || 0, // Should be fetched by a specialized query or computed
    avg_score: (g as any).avg_score || 0,
    goal_members: (g as any).goal_members || []
  }))

  return (
    <GoalsView
      goals={formattedGoals}
      projects={projects ?? []}
      employees={employees ?? []}
    />
  )
}
