import type { Metadata } from 'next'
import { NotificationsView } from '@/components/organisms/NotificationsView'

export const metadata: Metadata = { title: 'My Notifications' }

export default async function EmployeeNotificationsPage() {
    return <NotificationsView />
}
