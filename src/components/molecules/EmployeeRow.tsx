'use client'

import { colors, radius, animation, typography, getScoreColor } from '@/design-system'
import { Avatar, StatusPill, MiniBar, Icon } from '@/components/atoms'
import React from 'react'
import { Button } from '@/components/atoms/Button'

interface EmployeeRowProps {
  name: string
  role: string
  score?: number | null
  status?: 'on-track' | 'review' | 'at-risk' | 'no-data' | string
  baselineRequired?: boolean
  compliance?: any
  onGrantLeave?: () => void
}

export function EmployeeRow({ name, role, score, status, baselineRequired, compliance, onGrantLeave }: EmployeeRowProps) {
  const scoreColor = getScoreColor(score || 0)

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
          <div style={{ fontFamily: typography.fonts.display, fontSize: '11.5px', color: colors.text3 }}>
            {role}
          </div>
          {compliance && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: colors.border }} />
              <span style={{ color: colors.text3, fontWeight: 500 }}>{compliance.streakLabel}</span>
              {compliance.currentMissStreak > 0 && (
                <span style={{ 
                  padding: '2px 6px', 
                  borderRadius: '4px', 
                  background: compliance.isDanger ? colors.dangerGlow : colors.warnGlow, 
                  color: compliance.isDanger ? colors.danger : colors.warn,
                  fontWeight: 600
                }}>
                  {compliance.isDanger ? `${compliance.currentMissStreak} consecutive missed` : 'First missed report'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ width: '80px', display: 'flex', alignItems: 'center' }}>
        {!baselineRequired && <MiniBar score={score || 0} />}
      </div>

      <div
        className="font-numeric"
        style={{
          fontWeight: baselineRequired ? 600 : typography.weight.black,
          fontSize: baselineRequired ? '10.5px' : '18px',
          letterSpacing: baselineRequired ? '0.5px' : '-0.5px',
          color: baselineRequired ? colors.text3 : scoreColor,
          minWidth: baselineRequired ? 'auto' : '36px',
          textAlign: 'right',
          textTransform: baselineRequired ? 'uppercase' : 'none'
        }}
      >
        {baselineRequired ? 'Building Baseline' : (typeof score === 'number' && !isNaN(score) ? score.toFixed(1) : '—')}
      </div>

      <div style={{ minWidth: '70px', display: 'flex', justifyContent: 'flex-end' }}>
        {!baselineRequired && <StatusPill score={score || 0} status={status as any} />}
      </div>

      {onGrantLeave && (
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation()
            onGrantLeave()
          }}
          style={{ padding: '6px 10px', marginLeft: '8px' }}
        >
          <Icon name="calendar" size={14} style={{ marginRight: '6px' }} />
          Grant Leave
        </Button>
      )}
    </div>
  )
}