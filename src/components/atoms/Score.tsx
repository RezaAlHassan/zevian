'use client'

import { colors, getScoreColor, getScoreBarColor, radius, typography } from '@/design-system'
import React from 'react'

interface ScoreDisplayProps {
  score: number
  maxScore?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showBar?: boolean
  animate?: boolean
}

export function ScoreDisplay({ score, maxScore = 10, size = 'md', showBar = false, animate = true }: ScoreDisplayProps) {
  const color = getScoreColor(score)

  const sizeStyles = {
    sm: { big: '20px', denom: '11px', fontWeight: typography.weight.heavy },
    md: { big: '22px', denom: '12px', fontWeight: typography.weight.heavy },
    lg: { big: '28px', denom: '14px', fontWeight: typography.weight.black },
    xl: { big: '36px', denom: '16px', fontWeight: typography.weight.black },
  }

  const s = sizeStyles[size]
  const percentage = (score / maxScore) * 100

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span
          className="font-numeric"
          style={{
            fontSize: s.big,
            fontWeight: s.fontWeight,
            letterSpacing: '-0.5px',
            color,
          }}
        >
          {typeof score === 'number' && !isNaN(score) ? (
            <>
              {score.toFixed(1).split('.')[0]}<span style={{ fontSize: '0.8em', opacity: 0.9 }}>.{score.toFixed(1).split('.')[1]}</span>
            </>
          ) : '—'}
        </span>
        <span
          className="font-numeric"
          style={{
            fontSize: s.denom,
            color: colors.text3,
            fontWeight: typography.weight.semibold,
          }}
        >
          /{maxScore}
        </span>
      </div>
      {showBar && (
        <div
          style={{
            height: '4px',
            background: colors.surface3,
            borderRadius: radius.sm,
            marginTop: '8px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: '100%',
              borderRadius: radius.sm,
              width: animate ? `${percentage}%` : `${percentage}%`,
              background: color,
              transition: animate ? 'width 1s ease' : 'none',
            }}
          />
        </div>
      )}
    </div>
  )
}

interface MiniBarProps {
  score: number
  maxScore?: number
}

export function MiniBar({ score, maxScore = 10 }: MiniBarProps) {
  const color = getScoreBarColor(score)
  const percentage = (score / maxScore) * 100

  return (
    <div style={{ height: '3px', background: colors.surface3, borderRadius: '2px', overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          borderRadius: '2px',
          width: `${percentage}%`,
          background: color,
        }}
      />
    </div>
  )
}

interface ScoreBarProps {
  score: number
  maxScore?: number
  height?: number
  gradient?: boolean
}

export function ScoreBar({ score, maxScore = 10, height = 4, gradient = false }: ScoreBarProps) {
  const color = getScoreBarColor(score)
  const percentage = (score / maxScore) * 100

  return (
    <div
      style={{
        height: `${height}px`,
        background: colors.surface3,
        borderRadius: '2px',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          height: '100%',
          borderRadius: '2px',
          width: `${percentage}%`,
          background: gradient
            ? `linear-gradient(90deg, ${color}, ${color}80)`
            : color,
          transition: 'width 1s ease',
        }}
      />
    </div>
  )
}