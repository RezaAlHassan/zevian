'use client'

import { colors, radius, animation, typography, getScoreColor, shadows } from '@/design-system'
import { StatusPill } from '@/components/atoms/StatusPill'
import { Icon } from '@/components/atoms/Icon'
import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
}

export function SlimProjectCard({
  id,
  name,
  category,
  status,
  score,
  reportCount,
  emoji,
  basePath = '/projects'
}: SlimProjectCardProps) {
  const searchParams = useSearchParams()
  const view = searchParams.get('view') || 'org'
  const emojiValue = emoji || '🖥️'
  const scoreColor = getScoreColor(score)

  return (
    <Link href={`${basePath}/${id}?${searchParams.toString()}`} style={{ textDecoration: 'none' }}>
      <div
        className="slim-project-card"
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.xl,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          transition: `all ${animation.base}`,
          minHeight: '64px',
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
          <div style={{ fontSize: '10.5px', color: colors.text3, fontWeight: 500 }}>
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
                  background: scoreColor 
                }} />
              </div>
            </div>
          )}
          <StatusPill status={status} />
          <div style={{ color: colors.text3, opacity: 0.5 }}>
            <Icon name="chevronRight" size={14} />
          </div>
        </div>

        <style jsx>{`
          .slim-project-card:hover {
            border-color: ${colors.accent}40 !important;
            background: ${colors.surface2} !important;
            transform: translateX(2px);
            box-shadow: ${shadows.cardHover};
          }
        `}</style>
      </div>
    </Link>
  )
}
