'use client'

import { colors, radius, animation, typography, getScoreColor } from '@/design-system'
import { Avatar, StatusPill, MiniBar } from '@/components/atoms'
import React from 'react'

interface EmployeeRowProps {
  name: string
  role: string
  score: number
  status?: 'on-track' | 'review' | 'at-risk' | 'no-data'
}

export function EmployeeRow({ name, role, score, status }: EmployeeRowProps) {
  const scoreColor = getScoreColor(score)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 0',
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <Avatar name={name} size="lg" />

      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: typography.fonts.display, fontSize: '13.5px', fontWeight: typography.weight.medium, color: colors.text }}>
          {name}
        </div>
        <div style={{ fontFamily: typography.fonts.display, fontSize: '11.5px', color: colors.text3 }}>
          {role}
        </div>
      </div>

      <div style={{ width: '80px' }}>
        <MiniBar score={score} />
      </div>

      <div
        className="font-numeric"
        style={{
          fontWeight: typography.weight.black,
          fontSize: '18px',
          letterSpacing: '-0.5px',
          color: scoreColor,
          minWidth: '36px',
          textAlign: 'right',
        }}
      >
        {typeof score === 'number' && !isNaN(score) ? score.toFixed(1) : '—'}
      </div>

      <StatusPill score={score} status={status} />
    </div>
  )
}