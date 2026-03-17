import type { Metadata } from 'next'
import { AccountView } from '@/components/organisms/AccountView'

export const metadata: Metadata = { title: 'Account Settings' }

export default async function AccountPage() {
    return <AccountView />
}
