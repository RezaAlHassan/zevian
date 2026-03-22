'use client'

import { colors, radius, typography, getAvatarGradient, getInitials } from '@/design-system'
import { Icon } from '@/components/atoms/Icon'
import { ScoreDisplay } from '@/components/atoms/Score'
import { Button } from '@/components/atoms/Button'
import React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface RecentReportItemProps {
  id: string
  employeeName: string
  date: string
  score: number | null
  isLast?: boolean
}

export function RecentReportItem({ id, employeeName, date, score, isLast }: RecentReportItemProps) {
  const searchParams = useSearchParams()
  const view = searchParams.get('view') || 'org'
  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        padding: '16px 20px', 
        borderBottom: isLast ? 'none' : `1px solid ${colors.border}`,
        transition: 'background 0.2s ease'
      }}
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

      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <ScoreDisplay score={score ?? 0} size="sm" />
        <Link href={`/reports/${id}?${searchParams.toString()}`}>
          <Button variant="secondary" size="sm" icon="chevronRight">
            View
          </Button>
        </Link>
      </div>
    </div>
  )
}
