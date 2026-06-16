import type { Metadata } from 'next'
import { EmployeesView } from '@/components/organisms/EmployeesView'
import { getEmployeesAction } from '@/app/actions/employeeActions'
import { getCachedUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Employees' }
export const dynamic = 'force-dynamic'

export default async function EmployeesPage({
    searchParams
}: {
    searchParams: { view?: string }
}) {
    const user = await getCachedUser()

    if (!user) {
        redirect('/login')
    }

    const view = searchParams.view as 'org' | 'direct' | undefined
    const result = await getEmployeesAction(view)
    const employees = result.employees ?? []

    return (
        <EmployeesView
            employees={employees}
            effectiveView={result.effectiveView}
        />
    )
}
