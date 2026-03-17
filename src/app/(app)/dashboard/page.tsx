import type { Metadata } from 'next'
import { DashboardView } from '@/components/organisms/DashboardView'
import { getDashboardDataAction } from '@/app/actions/dashboardActions'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const data: any = await getDashboardDataAction()

  if (data?.error || !data) {
    return (
      <DashboardView
        teamStats={{ totalReports: 0, lateSubmissions: [], avgScore: 0, teamPerformance: [], projects: [] }}
        recentReports={[]}
        projects={[]}
        lateSubmissions={[]}
      />
    )
  }

  return (
    <DashboardView
      teamStats={data}
      recentReports={data.recentReports || []}
      projects={data.projects || []}
      lateSubmissions={data.lateSubmissions || []}
      organization={data.organization}
    />
  )
}