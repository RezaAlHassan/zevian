import { OrganizationView } from '@/components/organisms/OrganizationView'
import { getOrganizationAction, getOrganizationEmployeesAction, getCustomMetricsAction } from '@/app/actions/organizationActions'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { employeeService } from '@/../databaseService2'

export const metadata = {
    title: 'Organization — Zevian',
    description: 'Manage your organization settings, metrics, and team hierarchy.',
}

export default async function OrganizationPage() {
    const { data: organization, error: orgError } = await getOrganizationAction()
    const { data: employees, error: empError } = await getOrganizationEmployeesAction()
    const { data: customMetrics, error: customMetricsError } = await getCustomMetricsAction()
    const { data: managerSettings } = await (await import('@/app/actions/managerSettingsActions')).getManagerSettingsAction()

    if (orgError || !organization) {
        console.error('Organization fetch error:', orgError)
    }

    // Get current user permissions
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    let currentUserPermissions = { isAccountOwner: true, canInviteUsers: true, canManageSettings: true, canSetGlobalFrequency: true }
    if (user) {
        const currentEmployee = await employeeService.getByAuthId(user.id)
        if (currentEmployee) {
            currentUserPermissions = {
                isAccountOwner: !!currentEmployee.isAccountOwner,
                canInviteUsers: !!currentEmployee.isAccountOwner || !!currentEmployee.permissions?.canInviteUsers,
                canManageSettings: !!currentEmployee.isAccountOwner || !!currentEmployee.permissions?.canManageSettings,
                canSetGlobalFrequency: !!currentEmployee.isAccountOwner || !!currentEmployee.permissions?.canSetGlobalFrequency,
            }
        }
    }

    return <OrganizationView 
        organization={organization} 
        employees={employees || []} 
        customMetrics={customMetrics || []} 
        currentUserPermissions={currentUserPermissions} 
        managerSettings={managerSettings}
    />
}
