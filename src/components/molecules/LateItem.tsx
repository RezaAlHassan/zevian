'use client'

import { colors, radius, animation, typography } from '@/design-system'
import { Avatar } from '@/components/atoms'
import React from 'react'

interface LateItemProps {
  name: string
  project: string
  daysLate: number
}

export function LateItem({ name, project, daysLate }: LateItemProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        background: colors.dangerGlow,
        border: '1px solid rgba(240,68,56,0.15)',
        borderRadius: radius.md,
      }}
    >
      <Avatar name={name} size="sm" />
      
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: typography.fonts.display, fontSize: '13px', fontWeight: typography.weight.medium, color: colors.text }}>
          {name}
        </div>
        <div style={{ fontFamily: typography.fonts.display, fontSize: '11px', color: colors.text3 }}>
          {project}
        </div>
      </div>

      <div style={{
        fontFamily: typography.fonts.display,
        fontSize: '11.5px',
        color: colors.danger,
        fontWeight: typography.weight.semibold,
      }}>
        {daysLate} {daysLate === 1 ? 'day' : 'days'} late
      </div>
    </div>
  )
}