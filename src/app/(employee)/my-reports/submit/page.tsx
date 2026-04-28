import { getSubmitReportDataAction } from '@/app/actions/reportActions'
import { SubmitReportClient } from '@/components/organisms/SubmitReportClient'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Submit Report | Zevian' }
export const dynamic = 'force-dynamic'

export default async function SubmitReportPage({
    searchParams,
}: {
    searchParams: Promise<{ goalId?: string; projectId?: string; dates?: string; dueToday?: string }>
}) {
    const result = await getSubmitReportDataAction()

    if ('error' in result || !result.data) {
        redirect('/my-dashboard')
    }

    const { projects, goals, metrics, employeeId, aiConfig, goalWeight, backdateSettings, pendingPeriods } = result.data

    const sp = await searchParams
    const prefillDates = sp.dates ? sp.dates.split(',').filter(Boolean) : undefined

    return (
        <SubmitReportClient
            initialProjects={projects}
            initialGoals={goals}
            initialMetrics={metrics}
            employeeId={employeeId}
            aiConfig={aiConfig}
            goalWeight={goalWeight}
            backdateSettings={backdateSettings}
            pendingPeriods={pendingPeriods}
            prefillGoalId={sp.goalId}
            prefillProjectId={sp.projectId}
            prefillDates={prefillDates}
            prefillIsDueToday={sp.dueToday === '1'}
        />
    )
}
