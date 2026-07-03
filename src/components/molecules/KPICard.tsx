'use client'

import { colors, radius, animation, typography, getScoreColor } from '@/design-system'
import { Icon, IconName } from '@/components/atoms'
import React from 'react'

interface KPICardProps {
  label: string
  icon: IconName
  value?: React.ReactNode
  delta?: { value: number; direction: 'up' | 'down' }
  deltaLabel?: React.ReactNode
  variant?: 'default' | 'green' | 'warn' | 'danger' | 'accent'
  isScore?: boolean
  scoreValue?: number | null
  showBar?: boolean
}

export function KPICard({
  label,
  icon,
  value,
  delta,
  deltaLabel = 'vs. last period',
  variant = 'default',
  isScore = false,
  scoreValue,
  showBar = false,
}: KPICardProps) {
  const valueColor = variant !== 'default'
    ? colors[variant]
    : (scoreValue != null ? getScoreColor(scoreValue) : colors.accent)

  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        padding: '16px 18px',
        transition: `border-color ${animation.fast}`,
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <Icon name={icon} size={12} color={colors.text3} />
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          color: colors.text3,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
      </div>

      {isScore ? (
        scoreValue != null ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
            <span className="font-numeric" style={{
              fontSize: '28px',
              fontWeight: 800,
              letterSpacing: '-1px',
              lineHeight: 1,
              color: valueColor,
            }}>
              {scoreValue.toFixed(1)}
            </span>
            <span className="font-numeric" style={{ fontSize: '14px', color: colors.text3, fontWeight: typography.weight.semibold }}>/10</span>
          </div>
        ) : (
          <div className="font-numeric" style={{
            fontSize: '28px',
            fontWeight: 800,
            letterSpacing: '-1px',
            lineHeight: 1,
            marginBottom: '6px',
            color: colors.text3,
          }}>
            N/A
          </div>
        )
      ) : (
        <div className="font-numeric" style={{
          fontSize: '28px',
          fontWeight: 800,
          letterSpacing: '-1px',
          lineHeight: 1,
          marginBottom: '6px',
          color: valueColor,
        }}>
          {value}
        </div>
      )}

      {showBar && scoreValue != null && (
        <div style={{ height: '4px', background: colors.surface3, borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '2px', width: `${scoreValue * 10}%`, background: valueColor, transition: 'width 1s ease' }} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: colors.text3 }}>
        {delta && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '11px',
            fontWeight: typography.weight.semibold,
            padding: '2px 7px',
            borderRadius: '5px',
            color: delta.direction === 'up' ? colors.green : colors.danger,
            background: delta.direction === 'up' ? colors.greenGlow : colors.dangerGlow,
          }}>
            {delta.direction === 'up' ? '↑' : '↓'} <span className="font-numeric" style={{ fontWeight: typography.weight.black }}>{Math.abs(delta.value)}</span>
          </span>
        )}
        {deltaLabel}
      </div>
    </div>
  )
}