'use client'

import { colors, radius, animation, typography, getScoreColor, getScoreBarFill } from '@/design-system'
import { StatusPill } from '@/components/atoms/StatusPill'
import { Icon } from '@/components/atoms/Icon'
import React from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface SlimProjectCardProps {
  id: string
  name: string
  category: string
  status: any
  score: number | null
  reportCount: number
  emoji?: string
  basePath?: string
  isLast?: boolean
}

export function SlimProjectCard({
  id,
  name,
  category,
  status,
  score,
  reportCount,
  emoji,
  basePath = '/projects',
  isLast = false,
}: SlimProjectCardProps) {
  const searchParams = useSearchParams()
  const [hovered, setHovered] = React.useState(false)
  const emojiValue = emoji || '🖥️'
  const scoreColor = getScoreColor(score)

  return (
    <Link href={`${basePath}/${id}?${searchParams.toString()}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: '14px 10px',
          margin: '0 -10px',
          borderRadius: 8,
          borderBottom: isLast ? 'none' : `1px solid ${colors.border}`,
          boxShadow: hovered ? 'inset 0 0 0 1px rgba(255,255,255,0.09)' : 'none',
          transition: `box-shadow ${animation.fast}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
        }}
      >
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: radius.md,
          background: colors.surface2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          flexShrink: 0
        }}>
          {emojiValue}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: typography.fonts.display,
            fontSize: '13px',
            fontWeight: 700,
            color: colors.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: '2px'
          }}>
            {name}
          </div>
          <div style={{ fontSize: '11px', color: colors.text3, fontWeight: 500 }}>
            {category} · {reportCount} reports
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {typeof score === 'number' && !isNaN(score) && (
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: typography.fonts.numeric,
                fontSize: '14px',
                fontWeight: 900,
                color: scoreColor,
                lineHeight: 1
              }}>
                {score.toFixed(1)}
              </div>
              <div style={{
                height: '3px',
                width: '32px',
                background: colors.surface3,
                borderRadius: '2px',
                marginTop: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${score * 10}%`,
                  background: getScoreBarFill(score)
                }} />
              </div>
            </div>
          )}
          <StatusPill status={status} />
          <div style={{ color: colors.text3, opacity: 0.5 }}>
            <Icon name="chevronRight" size={14} />
          </div>
        </div>
      </div>
    </Link>
  )
}
