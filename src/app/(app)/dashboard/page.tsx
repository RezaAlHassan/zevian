import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
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

  // Never render a zeroed dashboard on failure — that reads as "all my data vanished".
  // An auth failure goes back to login; anything else surfaces the error boundary,
  // which offers a retry.
  if (dashboardData?.error === 'Not authenticated') {
    redirect('/login')
  }
  if (dashboardData?.error || !dashboardData) {
    throw new Error(dashboardData?.error || 'Failed to load dashboard data')
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