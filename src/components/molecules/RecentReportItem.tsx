'use client'

import React from 'react'
import Link from 'next/link'
import { colors, radius, typography, getScoreColor } from '@/design-system'
import { Avatar } from '@/components/atoms'

interface BaseProps {
  isLast?: boolean
  employeeName: string
  employeeTitle?: string
  goalName?: string
  projectName?: string
  date: string
}

interface MissedProps extends BaseProps {
  variant: 'missed'
}

interface ReportProps extends BaseProps {
  variant: 'report'
  id: string
  href: string
  score?: number | null
  tags?: string[]
  reviewed?: boolean
  overridden?: boolean
}

type Props = MissedProps | ReportProps

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

type Tone = 'red' | 'amber' | 'green' | 'neutral'

interface TagCfg { label: string; tone: Tone }

const TAG_CFG: Record<string, TagCfg> = {
  PROMPT_INJECTION:  { label: '● Prompt Injection',    tone: 'red'   },
  ESCALATING_CLAIMS: { label: '⚠ Escalating Claims',   tone: 'amber' },
  STAGNANT_LANGUAGE: { label: '⚠ Templated Reporting', tone: 'amber' },
  LATE:              { label: '● Late',                 tone: 'amber' },
  KEYWORD_STUFFING:  { label: '● Keyword Stuffing',     tone: 'amber' },
  PADDING:           { label: '● Padding',              tone: 'amber' },
}

const TAG_ORDER = ['PROMPT_INJECTION', 'ESCALATING_CLAIMS', 'STAGNANT_LANGUAGE', 'LATE', 'KEYWORD_STUFFING', 'PADDING']

function pillarStyle(tone: Tone) {
  const palettes: Record<Tone, { color: string; bg: string; border: string }> = {
    red:     { color: colors.danger, bg: colors.dangerGlow, border: 'rgba(240,68,56,0.24)' },
    amber:   { color: colors.warn,   bg: colors.warnGlow,   border: 'rgba(245,158,11,0.24)' },
    green:   { color: colors.green,  bg: colors.greenGlow,  border: 'rgba(16,185,129,0.25)' },
    neutral: { color: colors.text3,  bg: colors.surface2,   border: colors.border },
  }
  const p = palettes[tone]
  return {
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    padding: '3px 8px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 700,
    whiteSpace: 'nowrap' as const,
    color: p.color,
    background: p.bg,
    border: `1px solid ${p.border}`,
  }
}

export function RecentReportItem(props: Props) {
  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '12px',
    padding: '14px 0',
    alignItems: 'center',
    borderBottom: props.isLast ? 'none' : `1px solid ${colors.border}`,
  }

  if (props.variant === 'missed') {
    return (
      <div style={rowStyle}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <Avatar name={props.employeeName} size="md" />
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: colors.text }}>
              {props.employeeName}
              {props.employeeTitle && <span style={{ fontWeight: 400, color: colors.text3 }}> · {props.employeeTitle}</span>}
            </div>
            {(props.goalName || props.projectName) && (
              <div style={{ fontSize: '12px', color: colors.text3, marginTop: '3px' }}>
                {[props.goalName, props.projectName].filter(Boolean).join(' · ')}
              </div>
            )}
            <div style={{ marginTop: '6px' }}>
              <span style={pillarStyle('red')}>Missed</span>
            </div>
          </div>
        </div>
        <div style={{ fontSize: '12px', color: colors.text3, flexShrink: 0 }}>{fmtDate(props.date)}</div>
      </div>
    )
  }

  // Report variant
  const { href, score, tags = [], reviewed, overridden } = props

  const integrityTags = TAG_ORDER.filter(t => tags.includes(t)).slice(0, 4)
  const scoreColor = score != null ? getScoreColor(score) : colors.text3

  return (
    <div style={rowStyle}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', minWidth: 0 }}>
        <Avatar name={props.employeeName} size="md" />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: colors.text }}>{props.employeeName}</span>
            {score != null && (
              <span style={{ fontFamily: typography.fonts.numeric, fontWeight: 900, fontSize: '14px', color: scoreColor }}>
                {score.toFixed(1)}
              </span>
            )}
          </div>

          {(props.goalName || props.projectName) && (
            <div style={{ fontSize: '12px', color: colors.text3, marginTop: '3px' }}>
              {[props.goalName, props.projectName].filter(Boolean).join(' · ')}
            </div>
          )}

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
            {integrityTags.map(tag => {
              const cfg = TAG_CFG[tag]
              return cfg ? <span key={tag} style={pillarStyle(cfg.tone)}>{cfg.label}</span> : null
            })}
            {reviewed ? (
              <span style={pillarStyle('green')}>✓ Reviewed</span>
            ) : (
              <span style={pillarStyle('neutral')}>○ AI Scored</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
        {reviewed ? (
          <>
            <Link href={href} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 12px',
              borderRadius: radius.md,
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: 700,
              color: colors.text2,
              background: colors.surface2,
              border: `1px solid ${colors.border}`,
            }}>
              View →
            </Link>
            {overridden && (
              <span style={{ fontSize: '11px', color: colors.text3, fontWeight: 600 }}>Overridden</span>
            )}
          </>
        ) : (
          <Link href={href} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '7px 12px',
            borderRadius: radius.md,
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: 700,
            color: '#fff',
            background: colors.accent,
          }}>
            Review →
          </Link>
        )}
      </div>
    </div>
  )
}
