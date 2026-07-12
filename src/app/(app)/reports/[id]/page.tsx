import { getReportDetailAction } from '@/app/actions/reportActions'
import { ReportDetailView } from '@/components/organisms/ReportDetailView'
import { notFound } from 'next/navigation'
import { getSessionContext } from '@/lib/auth/session'
import { isSeededReport } from '@/utils/seededReport'

export const metadata = {
    title: 'Report Detail | Zevian',
    description: 'Detailed performance breakdown and scoring.',
}

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
    // The report (+ its own permission check) and the caller's identity for the
    // override gate are independent, so resolve them together instead of back-to-back.
    // Shared auth is request-cached, so this adds no extra round-trip.
    const [result, ctx] = await Promise.all([
        getReportDetailAction(params.id),
        getSessionContext(),
    ])

    if ('error' in result) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Error loading report</h1>
                <p style={{ color: '#8b93a8' }}>{result.error}</p>
            </div>
        )
    }

    if (!result.report) {
        notFound()
    }

    // Check permissions — reuse the (app) layout's request-cached identity.
    let canOverride = true
    if (ctx) {
        const currentEmployee = ctx.employee
        if (currentEmployee && currentEmployee.role === 'manager' && !currentEmployee.isAccountOwner) {
            canOverride = !!currentEmployee.permissions?.canOverrideAIScores
        }
    }

    // Re-score is available to override-capable managers on seeded/demo reports
    // (always) or on real reports that never finished scoring (retry). Changing a
    // completed real score stays in the override channel — see rescoreReportAction.
    const neverScored = !result.report.aiSummary
    const canRescore = canOverride && (isSeededReport(result.report.id) || neverScored)

    return <ReportDetailView report={result.report} canOverride={canOverride} canRescore={canRescore} />
}
