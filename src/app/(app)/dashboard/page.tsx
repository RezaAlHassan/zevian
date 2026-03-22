import type { Metadata } from 'next'
import { DashboardView } from '@/components/organisms/DashboardView'
import { getDashboardDataAction } from '@/app/actions/dashboardActions'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage({
  searchParams
}: {
  searchParams: { view?: string; start?: string; end?: string }
}) {
  const view = (searchParams.view as 'org' | 'direct') || 'org'
  const startDate = searchParams.start
  const endDate = searchParams.end

  const dashboardData = await getDashboardDataAction(view, startDate, endDate)

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

  const dashboardDataResult = dashboardData as any
  return (
    <DashboardView
      teamStats={dashboardDataResult}
      recentReports={dashboardDataResult.recentReports || []}
      projects={dashboardDataResult.projects || []}
      lateSubmissions={dashboardDataResult.lateSubmissions || []}
      organization={dashboardDataResult.organization}
    />
  )
}