import type { Metadata } from 'next'
import { employeeService, organizationService, customMetricService, managerSettingsService } from '@/../databaseService2'
import { OrganizationView } from '@/components/organisms/OrganizationView'
import { getSessionContext } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: 'Organization Settings' }
export const dynamic = 'force-dynamic'

export default async function OrganizationPage({
    searchParams
}: {
    searchParams: { view?: string; tab?: string }
}) {
    // Reuses the (app) layout's request-cached identity — no extra auth or employee hop.
    const ctx = await getSessionContext()

    if (!ctx) {
        redirect('/login')
    }

    const employee = ctx.employee

    const canViewOrg = employee.isAccountOwner ||
        employee.role === 'admin' ||
        (employee.permissions?.canViewOrganizationWide ?? false)
    const effectiveView = searchParams.view ?? (canViewOrg ? 'org' : 'direct')

    const [organization, allEmployees, customMetrics, managerSettings] = await Promise.all([
        employee.organizationId ? organizationService.getById(employee.organizationId) : null,
        employee.organizationId ? employeeService.getByOrganizationId(employee.organizationId) : [],
        employee.organizationId ? customMetricService.getByOrganizationId(employee.organizationId) : [],
        managerSettingsService.getByManagerId(employee.id).catch(() => null),
    ])

    // Filter employees based on view: direct shows only direct reports
    const employees = (canViewOrg && effectiveView === 'org')
        ? allEmployees
        : allEmployees.filter((e: any) => e.managerId === employee.id || e.id === employee.id)

    const currentUserPermissions = {
        canInviteUsers: employee.isAccountOwner || (employee.permissions?.canInviteUsers ?? false),
        canManageSettings: employee.isAccountOwner || (employee.permissions?.canManageSettings ?? false),
        canSetGlobalFrequency: employee.isAccountOwner || (employee.permissions?.canSetGlobalFrequency ?? false),
        isAccountOwner: employee.isAccountOwner ?? false,
    }

    return (
        <OrganizationView
            organization={organization ?? undefined}
            employees={employees}
            customMetrics={customMetrics}
            currentUserPermissions={currentUserPermissions}
            managerSettings={managerSettings}
        />
    )
}
