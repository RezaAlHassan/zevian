import { ReportsView } from '@/components/organisms/ReportsView'
import { getReportsByManagerAction } from '@/app/actions/reportActions'

export const metadata = {
  title: 'Reports | Zevian',
  description: 'Track employee performance and AI-scored reports.',
}

export default async function ReportsPage() {
  const data = await getReportsByManagerAction()

  if (data.error || !data.reports) {
    return (
      <ReportsView
        initialReports={[]}
        kpiData={{ totalReports: 0, avgScore: 0, pendingReview: 0, overrides: 0 }}
      />
    )
  }

  return (
    <ReportsView
      initialReports={data.reports}
      kpiData={data.kpis || { totalReports: 0, avgScore: 0, pendingReview: 0, overrides: 0 }}
    />
  )
}
