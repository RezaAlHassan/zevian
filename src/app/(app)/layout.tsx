import { AppShellServer } from '@/components/organisms/AppShellServer'
import { createServerClient } from '@/lib/supabase/server'
import { employeeService, organizationService } from '@/../databaseService2'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const employee = await employeeService.getByAuthId(user.id)
  if (!employee) {
    // If no employee record yet, we might need to redirect to onboarding or just show shell with null profile
    return <AppShellServer profile={null}>{children}</AppShellServer>
  }

  // RBAC Check: Only managers and admins can access routes in (app)
  if (employee.role === 'employee') {
    redirect('/my-dashboard')
  }

  const organization = employee.organizationId 
    ? await organizationService.getById(employee.organizationId)
    : null

  // Map to the profile structure expected by AppShellServer
  const profile = {
    id: employee.id,
    full_name: employee.name,
    role: employee.role ?? 'employee',
    organization_id: employee.organizationId || '',
    organizations: organization ? { name: organization.name } : null
  }

  return <AppShellServer profile={profile}>{children}</AppShellServer>
}