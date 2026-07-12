import { getAuthUser, getCachedEmployee } from '@/lib/auth/session'
import { EmployeeShellServer } from '@/components/organisms/EmployeeShellServer'
import { redirect } from 'next/navigation'

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
    // Request-cached: auth (local JWT verification) + employee lookup run once and
    // are shared with every (employee) page in the same render.
    const user = await getAuthUser()

    if (!user) {
        redirect('/login')
    }

    const employee = await getCachedEmployee()

    if (employee?.isActive === false) {
        redirect('/login')
    }

    const organization = employee?.organizationId ? { name: 'Zevian' } : null // Using a default for now if org fetch is separate, but shells expect organizations object

    // Shell expects a specific profile structure
    const profile = employee ? {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        organization_id: employee.organizationId,
        organizations: organization,
        avatar_url: employee.avatarUrl ?? null
    } : null

    return <EmployeeShellServer profile={profile as any}>{children}</EmployeeShellServer>
}
