import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { GoalsView } from '@/components/organisms/GoalsView'
import { getEmployeeGoalsAction } from '@/app/actions/goalActions'

export const metadata: Metadata = { title: 'Goals | Zevian' }

export default async function EmployeeGoalsPage() {
    const supabase = createServerClient()

    const [goalsResult, { data: projects }, { data: employees }] = await Promise.all([
        getEmployeeGoalsAction(),
        supabase
            .from('projects')
            .select('id, name, category, report_frequency'),
        supabase
            .from('employees')
            .select('id, name, role'),
    ])

    const goals = goalsResult.success ? goalsResult.data : []

    return (
        <GoalsView
            goals={goals ?? []}
            projects={projects ?? []}
            employees={employees ?? []}
            readOnly={true}
            basePath="/my-goals"
        />
    )
}
