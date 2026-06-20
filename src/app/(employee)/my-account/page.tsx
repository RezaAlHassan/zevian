import type { Metadata } from 'next'
import { AccountView } from '@/components/organisms/AccountView'
import { getAuthUser, getCachedEmployee } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Account Settings | Zevian' }

export default async function EmployeeAccountPage() {
    const user = await getAuthUser()

    if (!user) {
        redirect('/login')
    }

    const employee = await getCachedEmployee()

    return <AccountView role="employee" initialEmployee={employee} />
}
