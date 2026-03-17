'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { colors, layout, componentTokens, typography, animation, radius } from '@/design-system'
import { Header, EmployeeHeader } from '@/components/atoms'
import { Icon } from '@/components/atoms/Icon'
import { useState } from 'react'

interface Props {
    userName: string
    employeeId: string
    orgName: string
    userRole: string
    children: React.ReactNode
}

const NAV_ITEMS = [
    {
        id: 'dashboard', label: 'Dashboard', href: '/my-dashboard',
        icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1" y="1" width="6" height="6" rx="1.5" /><rect x="9" y="1" width="6" height="6" rx="1.5" /><rect x="1" y="9" width="6" height="6" rx="1.5" /><rect x="9" y="9" width="6" height="6" rx="1.5" /></svg>,
    },
    {
        id: 'projects', label: 'Projects', href: '/my-projects',
        icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1" y="3" width="14" height="10" rx="2" /><path d="M5 3V1h6v2" /></svg>,
    },
    {
        id: 'goals', label: 'Goals', href: '/my-goals',
        icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><polygon points="8,1 15,5 15,11 8,15 1,11 1,5" /></svg>,
    },
    {
        id: 'reports', label: 'My Reports', href: '/my-reports',
        icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 4h12M2 8h8M2 12h6" /><circle cx="13" cy="12" r="2.5" /><path d="M13 9.5V11" /></svg>,
    },
]

const SETTINGS_ITEMS = [
    {
        id: 'account', label: 'Account', href: '/my-account',
        icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="5" r="3" /><path d="M2 14c0-4 2-6 6-6s6 2 6 6" /></svg>,
    },
]

export function EmployeeShellClient({ userName, employeeId, orgName, children }: Props) {
    const pathname = usePathname()
    const t = componentTokens.sidebar

    const getPageTitle = () => {
        if (pathname.startsWith('/my-dashboard')) return 'My Dashboard'
        if (pathname.startsWith('/my-projects')) return 'Projects'
        if (pathname.startsWith('/my-goals')) return 'Goals'
        if (pathname.startsWith('/my-reports/submit')) return 'Submit Report'
        if (pathname.startsWith('/my-reports')) return 'My Reports'
        if (pathname.startsWith('/my-account')) return 'Account'
        return 'Dashboard'
    }

    const pageTitle = getPageTitle()

    return (
        <>
            {/* ── Sidebar ──────────────────────────── */}
            <aside style={t.root}>
                {/* Logo */}
                <div style={t.logo}>
                    <div style={t.logoMark}>Z</div>
                    <span style={t.logoText}>Zevian</span>
                </div>

                {/* Org name */}
                <div style={{ padding: '10px 20px 4px', fontSize: '11px', fontWeight: 600, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${colors.border}` }}>
                    {orgName}
                </div>

                {/* Main nav */}
                <nav style={t.nav}>
                    <div style={t.navLabel}>Workspace</div>
                    {NAV_ITEMS.map(item => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        return (
                            <Link key={item.id} href={item.href} style={{ textDecoration: 'none' }}>
                                <div
                                    className={`nav-item ${isActive ? 'active' : ''}`}
                                    style={{
                                        ...t.navItem.base,
                                        ...(isActive ? t.navItem.active : {}),
                                        position: 'relative'
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
                    {SETTINGS_ITEMS.map(item => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        return (
                            <Link key={item.id} href={item.href} style={{ textDecoration: 'none' }}>
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

                {/* User Footer */}
                <div style={t.footer}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 9px', borderRadius: '7px', cursor: 'pointer' }}>
                        <div style={{
                            width: '26px', height: '26px', borderRadius: '50%',
                            background: `linear-gradient(135deg, ${colors.accent}, ${colors.purple})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '10px', fontWeight: 800, color: '#fff', flexShrink: 0
                        }}>
                            {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, lineHeight: 1.2, color: colors.text }}>{userName}</div>
                            <div style={{ fontSize: '10px', color: colors.text3 }}>Employee</div>
                        </div>
                    </div>
                </div>
            </aside>

            <div style={{ marginLeft: layout.sidebarWidth, minHeight: '100vh', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
                <EmployeeHeader title={pageTitle} userName={userName} employeeId={employeeId} />
                <div style={{ paddingTop: layout.headerHeight, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1 }}>
                        {children}
                    </div>
                </div>
            </div>

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
