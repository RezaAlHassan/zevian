'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { colors, animation } from '@/design-system'
import { Icon } from '@/components/atoms'

export function Breadcrumbs() {
    const pathname = usePathname()
    const pathSegments = pathname.split('/').filter(Boolean)

    if (pathSegments.length === 0) return null

    // Helper to format segment names
    const formatSegment = (segment: string) => {
        // Handle UUIDs or IDs (simplistic check)
        if (segment.length > 20 || /\d/.test(segment)) {
            return 'Detail'
        }
        return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
    }

    return (
        <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 28px',
            background: colors.surface,
            borderBottom: `1px solid ${colors.border}`,
            zIndex: 10
        }}>
            <Link href="/dashboard" style={linkStyle}>
                <Icon name="dashboard" size={12} />
                <span>Dashboard</span>
            </Link>

            {pathSegments.map((segment, index) => {
                const href = `/${pathSegments.slice(0, index + 1).join('/')}`
                const isLast = index === pathSegments.length - 1
                const label = formatSegment(segment)

                if (segment === 'dashboard') return null

                return (
                    <React.Fragment key={href}>
                        <div style={{ color: colors.text3, fontSize: '10px' }}>
                            <Icon name="chevronDown" size={8} style={{ transform: 'rotate(-90deg)' }} />
                        </div>
                        {isLast ? (
                            <span style={{ ...linkStyle, color: colors.text, cursor: 'default', fontWeight: 600 }}>
                                {label}
                            </span>
                        ) : (
                            <Link href={href} style={linkStyle}>
                                {label}
                            </Link>
                        )}
                    </React.Fragment>
                )
            })}

            <style jsx>{`
                a:hover {
                    color: ${colors.accent} !important;
                    background: ${colors.accentGlow} !important;
                }
            `}</style>
        </nav>
    )
}

const linkStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11.5px',
    fontWeight: 500,
    color: colors.text3,
    textDecoration: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: `all ${animation.fast}`,
}
