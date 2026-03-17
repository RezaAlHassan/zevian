import { getSubmitReportDataAction } from '@/app/actions/reportActions'
import { notFound } from 'next/navigation'
import { SubmitReportClient } from '@/components/organisms/SubmitReportClient'

export const metadata = {
    title: 'Submit Report | Zevian',
    description: 'Submit your progress report for AI analysis and scoring.',
}

export default async function SubmitReportPage() {
    const result = await getSubmitReportDataAction()

    if ('error' in result) {
        // Handle error or redirect
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Error loading submission data</h1>
                <p style={{ color: '#8b93a8' }}>{result.error}</p>
            </div>
        )
    }

    const { projects, goals, metrics, employeeId } = result.data

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px', letterSpacing: '-0.5px' }}>Submit Report</h1>
                <p style={{ color: '#8b93a8', fontSize: '14px' }}>AI-powered performance tracking</p>
            </div>
            <SubmitReportClient
                initialProjects={projects}
                initialGoals={goals}
                initialMetrics={metrics}
                employeeId={employeeId}
            />
        </div>
    )
}
