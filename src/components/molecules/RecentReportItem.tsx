'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
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
  employeeId?: string
  score?: number | null
  tags?: string[]
  reviewed?: boolean
  overridden?: boolean
}

type Props = MissedProps | ReportProps

const AVATAR_PALETTE = ['#2A3A5A', '#2E3A4A', '#3A2A5A', '#2A4A3A', '#4A3A2A', '#3A2A4A']

function getAvatarBg(name: string): string {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length]
}


function relativeTime(iso: string): { label: string; color: string } {
  try {
    const date = new Date(iso)
    const diffMs = Date.now() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    let label: string
    if (diffMins < 1) label = 'just now'
    else if (diffMins < 60) label = `${diffMins}m ago`
    else if (diffHours < 24) label = `${diffHours}h ago`
    else if (diffDays < 7) label = `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    else if (diffDays < 30) label = `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? '' : 's'} ago`
    else label = `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) === 1 ? '' : 's'} ago`

    const color = diffDays >= 7 ? '#F59E0B' : '#5B7070'
    return { label, color }
  } catch {
    return { label: iso, color: '#5B7070' }
  }
}

function exactTime(iso: string): string {
  try {
    const date = new Date(iso)
    const diffHours = (Date.now() - date.getTime()) / 3600000
    const datePart = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    if (diffHours < 24) {
      const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      return `${datePart} · ${timePart}`
    }
    return datePart
  } catch {
    return iso
  }
}

function RelativeDate({ iso }: { iso: string }) {
  const [hovered, setHovered] = React.useState(false)
  const { label, color } = relativeTime(iso)
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', fontSize: '12px', color, cursor: 'default' }}
    >
      {label}
      {hovered && (
        <span style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1A1F2E',
          border: '1px solid #2A3045',
          borderRadius: 6,
          padding: '5px 9px',
          fontSize: '11px',
          fontWeight: 500,
          color: '#C8D4E8',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 50,
        }}>
          {exactTime(iso)}
        </span>
      )}
    </span>
  )
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

const BADGE = {
  'needs-review': { bg: '#3D2E0A', color: '#F59E0B', label: 'Needs Review' },
  'reviewed':     { bg: '#0A2E1A', color: '#00D4AA', label: 'Reviewed' },
  'scored':       { bg: '#1A2340', color: '#7C9CF8', label: 'Scored' },
}

export function RecentReportItem(props: Props) {
  const router = useRouter()
  const [nameHovered, setNameHovered] = React.useState(false)
  const [rowHovered, setRowHovered] = React.useState(false)

  const isReport = props.variant === 'report'

  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '12px',
    padding: '12px 10px',
    margin: '0 -10px',
    alignItems: 'center',
    borderBottom: props.isLast ? 'none' : `1px solid ${colors.border}`,
    borderRadius: 8,
    background: 'transparent',
    boxShadow: rowHovered && isReport ? 'inset 0 0 0 1px rgba(255,255,255,0.09)' : 'none',
    transition: 'box-shadow 0.15s ease',
    cursor: isReport ? 'pointer' : 'default',
  }

  if (props.variant === 'missed') {
    return (
      <div style={rowStyle}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <Avatar name={props.employeeName} size="md" style={{ background: getAvatarBg(props.employeeName), color: '#C8D4E8' }} />
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
        <div style={{ flexShrink: 0 }}><RelativeDate iso={props.date} /></div>
      </div>
    )
  }

  const { id, employeeId, score, tags = [], reviewed, overridden } = props

  const integrityTags = TAG_ORDER.filter(t => tags.includes(t)).slice(0, 4)
  const scoreColor = score != null ? getScoreColor(score) : colors.text3

  const badgeState = (reviewed ? 'reviewed' : score != null ? 'needs-review' : 'scored') as 'reviewed' | 'needs-review' | 'scored'
  const isNeedsReview = badgeState === 'needs-review'

  return (
    <div
      style={rowStyle}
      onClick={() => router.push(`/reports/${id}`)}
      onMouseEnter={() => setRowHovered(true)}
      onMouseLeave={() => setRowHovered(false)}
    >
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Employee zone */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Avatar
            name={props.employeeName}
            size="md"
            style={{ background: getAvatarBg(props.employeeName), color: '#C8D4E8' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
            <span
              onClick={e => { if (employeeId) { e.stopPropagation(); router.push(`/employees/${employeeId}`) } }}
              onMouseEnter={() => setNameHovered(true)}
              onMouseLeave={() => setNameHovered(false)}
              style={{
                fontSize: '13.5px',
                fontWeight: 700,
                color: colors.text,
                textDecoration: nameHovered && !!employeeId ? 'underline' : 'none',
                textUnderlineOffset: '3px',
                cursor: employeeId ? 'pointer' : 'default',
              }}
            >
              {props.employeeName}
            </span>
            {props.employeeTitle && (
              <span style={{ fontSize: '13.5px', fontWeight: 400, color: colors.text3 }}>· {props.employeeTitle}</span>
            )}
            {(() => {
              const badge = BADGE[badgeState]
              return (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '2px 7px', borderRadius: 4,
                  fontSize: 10, fontWeight: 700,
                  background: badge.bg, color: badge.color,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: badge.color, display: 'inline-block', flexShrink: 0 }} />
                  {badge.label}
                </span>
              )
            })()}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', paddingLeft: '40px', flexWrap: 'wrap' }}>
          {(props.goalName || props.projectName) && (
            <span style={{ fontSize: '12px', color: colors.text3 }}>
              {[props.goalName, props.projectName].filter(Boolean).join(' · ')}
            </span>
          )}
          {(props.goalName || props.projectName) && (
            <span style={{ fontSize: '12px', color: colors.text3 }}>·</span>
          )}
          <RelativeDate iso={props.date} />
        </div>

        {integrityTags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px', paddingLeft: '40px' }}>
            {integrityTags.map(tag => {
              const cfg = TAG_CFG[tag]
              return cfg ? <span key={tag} style={pillarStyle(cfg.tone)}>{cfg.label}</span> : null
            })}
          </div>
        )}
      </div>

      {/* Action zone */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0 }}>
        {score != null && (
          <span style={{
            fontFamily: typography.fonts.numeric,
            fontWeight: 900,
            fontSize: '14px',
            color: scoreColor,
          }}>
            {score.toFixed(1)}
          </span>
        )}

        {isNeedsReview ? (
          <button
            onClick={() => router.push(`/reports/${id}`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 12px',
              borderRadius: radius.md,
              border: `1px solid ${colors.border}`,
              fontSize: '12px',
              fontWeight: 700,
              color: colors.text2,
              background: colors.surface2,
              cursor: 'pointer',
            }}
          >
            Review Report →
          </button>
        ) : (
          <button
            onClick={() => router.push(`/reports/${id}`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 12px',
              borderRadius: radius.md,
              border: `1px solid ${colors.border}`,
              fontSize: '12px',
              fontWeight: 700,
              color: colors.text2,
              background: colors.surface2,
              cursor: 'pointer',
            }}
          >
            View →
          </button>
        )}

        {overridden && (
          <span style={{ fontSize: '11px', color: colors.text3, fontWeight: 600 }}>Overridden</span>
        )}
      </div>
    </div>
  )
}
