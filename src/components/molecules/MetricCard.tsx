'use client'

import { colors, radius, animation, typography, getScoreColor } from '@/design-system'
import React from 'react'

interface MetricCardProps {
  name: string
  subtitle: string
  score: number
  sparklineData?: number[]
  active?: boolean
  onClick?: () => void
}

export function MetricCard({ name, subtitle, score, sparklineData, active = false, onClick }: MetricCardProps) {
  const scoreColor = getScoreColor(score)
  const bars = sparklineData || [40, 60, 50, 80, 100]

  return (
    <div
      onClick={onClick}
      style={{
        background: active ? 'rgba(91,127,255,0.05)' : colors.surface2,
        border: `1px solid ${active ? 'rgba(91,127,255,0.35)' : colors.border}`,
        borderRadius: radius.lg,
        padding: '14px',
        cursor: onClick ? 'pointer' : 'default',
        transition: `all ${animation.fast}`,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = colors.borderHover
          e.currentTarget.style.background = colors.surface3
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = active ? 'rgba(91,127,255,0.35)' : colors.border
          e.currentTarget.style.background = active ? 'rgba(91,127,255,0.05)' : colors.surface2
        }
      }}
    >
      {active && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${colors.accent}, ${colors.teal})`,
        }} />
      )}

      <div style={{ fontFamily: typography.fonts.display, fontSize: '12.5px', fontWeight: typography.weight.semibold, color: colors.text, marginBottom: '2px' }}>
        {name}
      </div>
      <div style={{ fontFamily: typography.fonts.display, fontSize: '10.5px', color: colors.text3, marginBottom: '8px' }}>
        {subtitle}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="font-numeric" style={{
          fontSize: '22px',
          fontWeight: typography.weight.black,
          letterSpacing: '-0.5px',
          color: scoreColor,
        }}>
          {typeof score === 'number' && !isNaN(score) ? score.toFixed(1) : '—'}
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '20px' }}>
          {bars.map((height, i) => (
            <div
              key={i}
              style={{
                width: '4px',
                borderRadius: '2px 2px 0 0',
                background: i === bars.length - 1 ? scoreColor : colors.accent,
                height: `${height}%`,
                opacity: 0.5,
                transition: `opacity ${animation.fast}`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}