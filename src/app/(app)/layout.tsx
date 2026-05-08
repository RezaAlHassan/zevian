import { AppShellServer } from '@/components/organisms/AppShellServer'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Single query: employee + permissions + org name in one round trip
  const { data: row } = await supabase
    .from('employees')
    .select('id, name, role, organization_id, is_account_owner, is_active, employee_permissions(*), organizations(name)')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!row) {
    return <AppShellServer profile={null}>{children}</AppShellServer>
  }

  if (row.is_active === false) {
    redirect('/login')
  }

  if (row.role === 'employee') {
    redirect('/my-dashboard')
  }

  const perms = Array.isArray(row.employee_permissions) ? row.employee_permissions[0] : row.employee_permissions
  const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations

  const profile = {
    id: row.id,
    full_name: row.name,
    role: row.role ?? 'employee',
    organization_id: row.organization_id || '',
    organizations: org ? { name: org.name } : null,
    canManageSettings: row.is_account_owner || (perms?.can_manage_settings ?? false),
    canViewOrganizationWide: row.is_account_owner || (perms?.can_view_organization_wide ?? false),
  }

  return <AppShellServer profile={profile}>{children}</AppShellServer>
}