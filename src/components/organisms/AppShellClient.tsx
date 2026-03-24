'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { colors, layout, componentTokens, typography, animation, radius } from '@/design-system'
import { Header } from '@/components/atoms/Header'
import { Icon } from '@/components/atoms/Icon'
import { useState } from 'react'
import { InviteModal } from '@/components/molecules/InviteModal'
import Image from 'next/image'

interface Props {
  userName: string
  orgName: string
  userRole: string
  canManageSettings: boolean
  canViewOrganizationWide: boolean
  children: React.ReactNode
}

const NAV_ITEMS = [
  {
    id: 'dashboard', label: 'Dashboard', href: '/dashboard',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1" y="1" width="6" height="6" rx="1.5" /><rect x="9" y="1" width="6" height="6" rx="1.5" /><rect x="1" y="9" width="6" height="6" rx="1.5" /><rect x="9" y="9" width="6" height="6" rx="1.5" /></svg>,
  },
  {
    id: 'projects', label: 'Projects', href: '/projects',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1" y="3" width="14" height="10" rx="2" /><path d="M5 3V1h6v2" /></svg>,
  },
  {
    id: 'goals', label: 'Goals', href: '/goals',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><polygon points="8,1 15,5 15,11 8,15 1,11 1,5" /></svg>,
  },
  {
    id: 'reports', label: 'Reports', href: '/reports',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="1" width="12" height="14" rx="2" /><path d="M5 5h6M5 8h6M5 11h4" /></svg>,
  },
  {
    id: 'employees', label: 'Employees', href: '/employees',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="6" cy="5" r="3" /><path d="M1 14c0-3 2-5 5-5s5 2 5 5" /><circle cx="12" cy="5" r="2" /><path d="M14 14c0-2-1-3.5-2-4" /></svg>,
  },
]

const SETTINGS_ITEMS = [
  {
    id: 'organization', label: 'Organization', href: '/organization',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1" y="3" width="14" height="10" rx="2" /><circle cx="6" cy="8" r="2" /><path d="M10 6h3M10 10h3" /></svg>,
  },
  {
    id: 'account', label: 'Account', href: '/account',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="5" r="3" /><path d="M2 14c0-4 2-6 6-6s6 2 6 6" /></svg>,
  },
]

export function AppShellClient({ userName, orgName, userRole, canManageSettings, canViewOrganizationWide, children }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const view = searchParams.get('view') || 'org'
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const t = componentTokens.sidebar
  const subtitle = view === 'direct' ? '— Direct Reports' : '— Organization'

  const getPageTitle = () => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard'
    if (pathname.startsWith('/projects')) return 'Projects'
    if (pathname.startsWith('/goals')) return 'Goals'
    if (pathname.startsWith('/reports')) return 'Reports'
    if (pathname.startsWith('/employees')) return 'Employees'
    if (pathname.startsWith('/knowledge-base')) return 'Knowledge Base'
    if (pathname.startsWith('/organization')) return 'Organization'
    if (pathname.startsWith('/account')) return 'Account'
    return 'Dashboard'
  }

  const pageTitle = getPageTitle()

  return (
    <>
      {/* ── Sidebar ──────────────────────────── */}
      <aside style={t.root}>
        {/* Logo */}
        <div style={{ ...t.logo, padding: '9px 16px' }}>
          <Image src="/logo.png" alt="Zevian" height={36} width={100} style={{ width: 'auto', display: 'block' }} priority />
        </div>

        {/* Org name */}
        <div style={{ padding: '10px 20px 4px', fontSize: '11px', fontWeight: 600, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${colors.border}` }}>
          {orgName}
        </div>

        {/* Main nav */}
        <nav style={t.nav}>
          <div style={t.navLabel}>Workspace</div>
          {NAV_ITEMS.filter(item => userRole !== 'employee' || item.id !== 'employees').map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const params = new URLSearchParams(searchParams.toString());
            params.set('view', view);
            const href = `${item.href}?${params.toString()}`
            return (
              <Link key={item.id} href={href} style={{ textDecoration: 'none' }}>
                <div
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  style={{
                    ...t.navItem.base,
                    ...(isActive ? t.navItem.active : {}),
                  }}
                >
                  <span style={{ width: '16px', height: '16px', display: 'flex', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  {item.label}
                </div>
              </Link>
            )
          })}

          <div style={{ ...t.navLabel, marginTop: '24px' }}>Settings</div>
          {SETTINGS_ITEMS.filter(item => {
            if (item.id === 'organization') {
              return userRole !== 'employee' && canManageSettings
            }
            return true
          }).map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const params = new URLSearchParams(searchParams.toString());
            params.set('view', view);
            const href = `${item.href}?${params.toString()}`
            return (
              <Link key={item.id} href={href} style={{ textDecoration: 'none' }}>
                <div
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  style={{
                    ...t.navItem.base,
                    ...(isActive ? t.navItem.active : {}),
                  }}
                >
                  <span style={{ width: '16px', height: '16px', display: 'flex', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Invite CTA */}
        <div style={{ padding: '0 10px', marginBottom: '16px' }}>
          <button
            onClick={() => setIsInviteOpen(true)}
            style={t.ctaButton}
          >
            <Icon name="plus" size={14} color="#fff" />
            Invite Member
          </button>
        </div>
      </aside>

      <div style={{ marginLeft: layout.sidebarWidth, minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header title={pageTitle} subtitle={subtitle} userName={userName} showViewSwitcher={canViewOrganizationWide} />
        <div style={{ paddingTop: layout.headerHeight, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>
            {children}
          </div>
        </div>
      </div>

      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        orgName={orgName}
      />

      <style jsx>{`
        .nav-item {
          transition: all ${animation.fast};
        }
        .nav-item:hover:not(.active) {
          background: ${colors.surface2} !important;
          color: ${colors.text} !important;
        }
      `}</style>
    </>
  )
}
