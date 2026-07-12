'use client'

import { badgeTones, radius, typography } from '@/design-system'
import React from 'react'

interface ChipProps {
  children: React.ReactNode
  variant?: 'default' | 'blue' | 'teal'
  style?: React.CSSProperties
}

// The canonical number/count badge: rounded square (radius.sm) with a soft-badge tone — a light
// tint fill + darker same-hue text (badgeTones, ≥4.4:1). The style guide for count badges across
// the detail pages (project / KPI / employee).
export function Chip({ children, variant = 'default', style }: ChipProps) {
  const tone = { default: badgeTones.neutral, blue: badgeTones.accent, teal: badgeTones.teal }[variant]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '18px',
        padding: '2px 7px',
        borderRadius: radius.sm,
        fontSize: '11px',
        fontWeight: typography.weight.bold,
        background: tone.bg,
        color: tone.text,
        ...style,
      }}
    >
      {children}
    </span>
  )
}