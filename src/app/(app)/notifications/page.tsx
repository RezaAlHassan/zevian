import type { Metadata } from 'next'
import { NotificationsView } from '@/components/organisms/NotificationsView'

export const metadata: Metadata = { title: 'Notifications' }

export default async function NotificationsPage() {
    return <NotificationsView />
}
