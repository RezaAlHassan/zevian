'use client'

import { colors, radius, typography, getScoreStatus } from '@/design-system'
import React from 'react'

interface StatusPillProps {
  status?: 'active' | 'at-risk' | 'review' | 'no-reports' | 'on-track' | 'no-data' | 'pending' | 'scored' | 'reviewed' | 'late' | 'on-leave'
  score?: number | null
  children?: React.ReactNode
  showDot?: boolean
}

export function StatusPill({ status: propStatus, score, children, showDot = true }: StatusPillProps) {
  const status = propStatus ?? getScoreStatus(score)

  const statusStyles: Record<string, React.CSSProperties> = {
    'active': { background: colors.greenGlow, color: colors.green },
    'on-track': { background: colors.greenGlow, color: colors.green },
    'review': { background: 'rgba(245,158,11,0.12)', color: colors.warn },
    'at-risk': { background: colors.dangerGlow, color: colors.danger },
    'no-reports': { background: colors.surface3, color: colors.text3 },
    'no-data': { background: colors.surface3, color: colors.text3 },
    'pending': { background: colors.surface3, color: colors.text2 },
    'scored': { background: colors.accentGlow, color: colors.accent },
    'reviewed': { background: colors.greenGlow, color: colors.green },
    'late': { background: colors.dangerGlow, color: colors.danger },
    'on-leave': { background: colors.surface3, color: colors.text2 },
  }

  const labels: Record<string, string> = {
    'active': 'Active',
    'on-track': 'On Track',
    'review': 'Review',
    'at-risk': 'At Risk',
    'no-reports': 'No Reports',
    'no-data': 'No Data',
    'pending': 'Pending',
    'scored': 'AI Scored',
    'reviewed': 'Reviewed',
    'late': 'Late',
    'on-leave': 'On Leave',
  }

  const dotColors: Record<string, string> = {
    'active': colors.green,
    'on-track': colors.green,
    'review': colors.warn,
    'at-risk': colors.danger,
    'no-reports': colors.text3,
    'no-data': colors.text3,
    'pending': colors.text3,
    'scored': colors.accent,
    'reviewed': colors.green,
    'late': colors.danger,
    'on-leave': colors.text3,
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '11px',
        fontWeight: typography.weight.semibold,
        padding: '3px 9px',
        borderRadius: '20px',
        whiteSpace: 'nowrap',
        ...statusStyles[status],
      }}
    >
      {showDot && (
        <span
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            flexShrink: 0,
            background: dotColors[status],
            boxShadow: (status === 'active' || status === 'on-track') ? `0 0 5px ${colors.green}` : 'none',
          }}
        />
      )}
      {children ?? labels[status]}
    </span>
  )
}