import { ReportsView } from '@/components/organisms/ReportsView'
import { getMyReportsAction } from '@/app/actions/reportActions'

export const metadata = { title: 'My Reports | Zevian' }

export default async function EmployeeReportsPage({ searchParams }: { searchParams: { start?: string, end?: string } }) {
    const data = await getMyReportsAction(searchParams.start, searchParams.end)

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
            role="employee"
            initialReports={data.reports}
            kpiData={data.kpis || { totalReports: 0, avgScore: 0, pendingReview: 0, overrides: 0 }}
        />
    )
}
