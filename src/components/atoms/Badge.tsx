'use client'

import { colors, radius, animation, typography } from '@/design-system'
import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'accent' | 'teal' | 'green' | 'warn' | 'danger'
  style?: React.CSSProperties
}

export function Badge({ children, variant = 'default', style }: BadgeProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    default:  { background: colors.surface3, color: colors.text2 },
    accent:   { background: colors.accentGlow, color: colors.accent, border: `1px solid ${colors.accentBorder}` },
    teal:     { background: colors.tealGlow, color: colors.teal },
    green:    { background: colors.greenGlow, color: colors.green },
    warn:     { background: 'rgba(245,158,11,0.12)', color: colors.warn },
    danger:   { background: colors.dangerGlow, color: colors.danger },
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: radius.full,
        fontSize: '11px',
        fontWeight: typography.weight.semibold,
        whiteSpace: 'nowrap',
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </span>
  )
}

interface NavBadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'warn'
}

export function NavBadge({ children, variant = 'default' }: NavBadgeProps) {
  return (
    <span
      style={{
        marginLeft: 'auto',
        background: variant === 'warn' ? colors.warn : colors.danger,
        color: '#fff',
        fontSize: '10px',
        fontWeight: 700,
        padding: '1px 6px',
        borderRadius: '10px',
      }}
    >
      {children}
    </span>
  )
}