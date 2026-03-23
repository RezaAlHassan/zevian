import { getReportDetailAction } from '@/app/actions/reportActions'
import { ReportDetailView } from '@/components/organisms/ReportDetailView'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { employeeService } from '@/../databaseService2'

export const metadata = {
    title: 'Report Detail | Zevian',
    description: 'Detailed performance breakdown and AI scoring.',
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

    // Check permissions
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    let canOverride = true
    if (user) {
        const currentEmployee = await employeeService.getByAuthId(user.id)
        if (currentEmployee && currentEmployee.role === 'manager' && !currentEmployee.isAccountOwner) {
            canOverride = !!currentEmployee.permissions?.canOverrideAIScores
        }
    }

    return <ReportDetailView report={result.report} canOverride={canOverride} />
}
