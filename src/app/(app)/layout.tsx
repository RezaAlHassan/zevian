import { AppShellServer } from '@/components/organisms/AppShellServer'
import { getCachedUser, getSessionContext } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCachedUser()

  if (!user) {
    redirect('/login')
  }

  // Cached, request-shared identity lookup (employee + permissions + organization).
  // The page's server action resolves the same context, so this round-trip runs once.
  const ctx = await getSessionContext()

  if (!ctx) {
    return <AppShellServer profile={null}>{children}</AppShellServer>
  }

  const { employee, organization } = ctx

  if (employee.isActive === false) {
    redirect('/login')
  }

  if (employee.role === 'employee') {
    redirect('/my-dashboard')
  }

  const profile = {
    id: employee.id,
    full_name: employee.name,
    role: employee.role ?? 'employee',
    organization_id: employee.organizationId || '',
    organizations: organization ? { name: organization.name } : null,
    canManageSettings: employee.isAccountOwner || (employee.permissions?.canManageSettings ?? false),
    canViewOrganizationWide: employee.isAccountOwner || (employee.permissions?.canViewOrganizationWide ?? false),
  }

  return <AppShellServer profile={profile}>{children}</AppShellServer>
}
