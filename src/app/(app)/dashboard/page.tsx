import type { Metadata } from 'next'
import { DashboardView } from '@/components/organisms/DashboardView'
import { getDashboardDataAction } from '@/app/actions/dashboardActions'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage({
  searchParams
}: {
  searchParams: { view?: string; start?: string; end?: string }
}) {
  const view = searchParams.view as 'org' | 'direct' | undefined
  const dashboardData = await getDashboardDataAction(view, searchParams.start, searchParams.end)

  if (dashboardData?.error || !dashboardData) {
    return (
      <DashboardView
        teamStats={{ totalReports: 0, lateSubmissions: [], avgScore: 0, teamPerformance: [], projects: [] }}
        recentReports={[]}
        projects={[]}
        lateSubmissions={[]}
      />
    )
  }

  const d = dashboardData as any
  return (
    <DashboardView
      teamStats={d}
      recentReports={d.recentReports || []}
      projects={d.projects || []}
      lateSubmissions={d.lateSubmissions || []}
      organization={d.organization}
    />
  )
}