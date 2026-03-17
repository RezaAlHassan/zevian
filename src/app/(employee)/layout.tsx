import { createServerClient } from '@/lib/supabase/server'
import { employeeService } from '@/../databaseService2'
import { EmployeeShellServer } from '@/components/organisms/EmployeeShellServer'
import { redirect } from 'next/navigation'

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const employee = await employeeService.getByAuthId(user.id)
    const organization = employee?.organizationId ? { name: 'Zevian' } : null // Using a default for now if org fetch is separate, but shells expect organizations object

    // Shell expects a specific profile structure
    const profile = employee ? {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        organization_id: employee.organizationId,
        organizations: organization 
    } : null

    return <EmployeeShellServer profile={profile as any}>{children}</EmployeeShellServer>
}
