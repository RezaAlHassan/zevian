import React, { Suspense } from 'react'
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

export function AppShellServer({ profile, children }: Props) {
  return (
    <Suspense fallback={<div style={{ background: '#0a0c10', minHeight: '100vh' }} />}>
      <AppShellClient
        userName={profile?.full_name ?? 'User'}
        orgName={profile?.organizations?.name ?? 'My Org'}
        userRole={profile?.role ?? 'employee'}
        canManageSettings={profile?.canManageSettings ?? false}
        canViewOrganizationWide={profile?.canViewOrganizationWide ?? false}
      >
        {children}
      </AppShellClient>
    </Suspense>
  )
}
