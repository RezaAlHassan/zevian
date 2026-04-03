'use client'

import { colors, getAvatarGradient, getInitials } from '@/design-system'
import { ScoreDisplay } from '@/components/atoms/Score'
import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface RecentReportItemProps {
  id: string
  employeeName: string
  date: string
  score: number | null
  isLast?: boolean
}

export function RecentReportItem({ id, employeeName, date, score, isLast }: RecentReportItemProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <div
      onClick={() => router.push(`/reports/${id}?${searchParams.toString()}`)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px',
        borderBottom: isLast ? 'none' : `1px solid ${colors.border}`,
        transition: 'background 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = colors.surface2)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        background: getAvatarGradient(employeeName || 'Unknown'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '11px',
        color: '#fff',
        flexShrink: 0
      }}>
        {getInitials(employeeName || 'Unknown')}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13.5px',
          fontWeight: 600,
          color: colors.text,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {date}
        </div>
        <div style={{
          fontSize: '11.5px',
          color: colors.text3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          by {employeeName}
        </div>
      </div>

      <ScoreDisplay score={score ?? 0} size="sm" />
    </div>
  )
}
