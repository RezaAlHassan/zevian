import { AppShellClient } from './AppShellClient'

interface Props {
  profile: {
    id:           string
    full_name:    string
    role:         string
    organization_id: string
    organizations: { name: string } | null
    canManageSettings: boolean
    canViewOrganizationWide: boolean
  } | null
  children: React.ReactNode
}

/**
 * AppShellServer — thin server wrapper that passes profile data
 * down to the client AppShellClient which renders the interactive
 * sidebar and header.
 *
 * Server/Client split:
 *   AppShellServer (server) → fetches auth/profile
 *   AppShellClient (client) → interactive sidebar nav, active states
 */
export function AppShellServer({ profile, children }: Props) {
  return (
    <AppShellClient
      userName={profile?.full_name ?? 'User'}
      orgName={profile?.organizations?.name ?? 'My Org'}
      userRole={profile?.role ?? 'employee'}
      canManageSettings={profile?.canManageSettings ?? false}
      canViewOrganizationWide={profile?.canViewOrganizationWide ?? false}
    >
      {children}
    </AppShellClient>
  )
}
