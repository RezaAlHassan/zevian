import { EmployeeShellClient } from './EmployeeShellClient'

interface Props {
    profile: {
        id: string
        name: string
        role: string
        organization_id: string
        organizations: { name: string } | null
    } | null
    children: React.ReactNode
}

export function EmployeeShellServer({ profile, children }: Props) {
    return (
        <EmployeeShellClient
            userName={profile?.name ?? 'User'}
            employeeId={profile?.id ?? 'N/A'}
            orgName={profile?.organizations?.name ?? 'My Org'}
            userRole={profile?.role ?? 'employee'}
        >
            {children}
        </EmployeeShellClient>
    )
}
