import { getReportDetailAction } from '@/app/actions/reportActions'
import { ReportDetailView } from '@/components/organisms/ReportDetailView'
import { notFound } from 'next/navigation'
import { getSessionContext } from '@/lib/auth/session'

export const metadata = {
    title: 'Report Detail | Zevian',
    description: 'Detailed performance breakdown and scoring.',
}

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
    const result = await getReportDetailAction(params.id)

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
    const ctx = await getSessionContext()
    let canOverride = true
    if (ctx) {
        const currentEmployee = ctx.employee
        if (currentEmployee && currentEmployee.role === 'manager' && !currentEmployee.isAccountOwner) {
            canOverride = !!currentEmployee.permissions?.canOverrideAIScores
        }
    }

    return <ReportDetailView report={result.report} canOverride={canOverride} />
}
