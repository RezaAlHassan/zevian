import type { Metadata } from 'next'
import { AccountView } from '@/components/organisms/AccountView'
import { getSessionContext } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Account Settings' }

export default async function AccountPage() {
    // Reuses the request-cached identity already resolved by the (app) layout —
    // no extra auth round-trip or employee lookup on this navigation.
    const ctx = await getSessionContext()

    if (!ctx) {
        redirect('/login')
    }

    const employee = ctx.employee

    return <AccountView role={employee?.role || 'manager'} initialEmployee={employee} />
}
