import { layout } from '@/design-system'
import { EmployeeDashboardView } from '@/components/organisms/EmployeeDashboardView'
import { getDashboardDataAction } from '../../actions/dashboardActions'

export default async function EmployeeDashboardPage({
  searchParams,
}: {
  searchParams: { start?: string; end?: string; goal?: string }
}) {
  const data: any = await getDashboardDataAction(undefined, searchParams.start, searchParams.end)

  return (
    <div style={{ padding: layout.contentPadding, maxWidth: '1180px', margin: '0 auto' }}>
      <EmployeeDashboardView
        data={data?.error ? null : data}
        allReports={data?.allReports || []}
        selectedGoalId={searchParams.goal || null}
        orgMetricNames={(data?.organization?.customMetrics || []).map((m: any) => m.name)}
      />
    </div>
  )
}
