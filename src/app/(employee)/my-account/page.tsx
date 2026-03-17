import type { Metadata } from 'next'
import { AccountView } from '@/components/organisms/AccountView'
import { createServerClient } from '@/lib/supabase/server'
import { employeeService } from '@/../databaseService2'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Account Settings | Zevian' }

export default async function EmployeeAccountPage() {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const employee = await employeeService.getByAuthId(user.id)

    return <AccountView role="employee" initialEmployee={employee} />
}
