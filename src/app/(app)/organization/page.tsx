import { OrganizationView } from '@/components/organisms/OrganizationView'
import { getOrganizationAction, getOrganizationEmployeesAction, getCustomMetricsAction } from '@/app/actions/organizationActions'
import { redirect } from 'next/navigation'

export const metadata = {
    title: 'Organization — Zevian',
    description: 'Manage your organization settings, metrics, and team hierarchy.',
}

export default async function OrganizationPage() {
    const { data: organization, error: orgError } = await getOrganizationAction()
    const { data: employees, error: empError } = await getOrganizationEmployeesAction()
    const { data: customMetrics, error: customMetricsError } = await getCustomMetricsAction()

    if (orgError || !organization) {
        console.error('Organization fetch error:', orgError)
    }

    return <OrganizationView organization={organization} employees={employees || []} customMetrics={customMetrics || []} />
}
