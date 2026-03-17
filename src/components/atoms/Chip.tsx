'use client'

import { colors, radius, typography } from '@/design-system'
import React from 'react'

interface ChipProps {
  children: React.ReactNode
  variant?: 'default' | 'blue' | 'teal'
  style?: React.CSSProperties
}

export function Chip({ children, variant = 'default', style }: ChipProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: { background: colors.surface3, color: colors.text2 },
    blue:   { background: colors.accentGlow, color: colors.accent },
    teal:   { background: colors.tealGlow, color: colors.teal },
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: typography.weight.semibold,
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </span>
  )
}