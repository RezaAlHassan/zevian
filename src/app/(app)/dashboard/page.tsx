import React, { Suspense } from 'react'
import type { Metadata } from 'next'
import { DashboardView } from '@/components/organisms/DashboardView'
import { getDashboardDataAction } from '@/app/actions/dashboardActions'

export const metadata: Metadata = { title: 'Dashboard' }

function DashboardSkeleton() {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', opacity: 0.6 }}>
      <div style={{ height: '40px', background: '#1e2330', borderRadius: '8px', width: '200px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[1, 2, 3, 4].map(i => <div key={i} style={{ height: '120px', background: '#1e2330', borderRadius: '16px' }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ height: '300px', background: '#1e2330', borderRadius: '16px' }} />
        <div style={{ height: '300px', background: '#1e2330', borderRadius: '16px' }} />
      </div>
    </div>
  )
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams: { view?: string; start?: string; end?: string }
}) {
  const view = searchParams.view as 'org' | 'direct' | undefined
  const startDate = searchParams.start
  const endDate = searchParams.end

  const dashboardData = await getDashboardDataAction(view, startDate, endDate)

  if (dashboardData?.error || !dashboardData) {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardView
          teamStats={{ totalReports: 0, lateSubmissions: [], avgScore: 0, teamPerformance: [], projects: [] }}
          recentReports={[]}
          projects={[]}
          lateSubmissions={[]}
        />
      </Suspense>
    )
  }

  const dashboardDataResult = dashboardData as any
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardView
        teamStats={dashboardDataResult}
        recentReports={dashboardDataResult.recentReports || []}
        projects={dashboardDataResult.projects || []}
        lateSubmissions={dashboardDataResult.lateSubmissions || []}
        organization={dashboardDataResult.organization}
      />
    </Suspense>
  )
}