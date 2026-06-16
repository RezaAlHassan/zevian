'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { colors, layout, radius, typography, getScoreColor, shadows, animation } from '@/design-system'
import { Avatar, StatusPill, Button } from '@/components/atoms'
import { Icon } from '@/components/atoms/Icon'
import { Card } from '@/components/molecules/Card'
import { DateRangeSelector } from '@/components/molecules/DateRangeSelector'
import { Organization } from '@/types'

interface Props {
  teamStats: any
  recentReports: any[]
  projects: any[]
  lateSubmissions: any[]
  organization?: Organization
}

function KpiCard({
  label,
  value,
  subtitle,
  delta,
  tone = 'neutral',
  onClick,
  info,
}: {
  label: string
  value: string | number
  subtitle?: string
  delta?: { value: number; direction: 'up' | 'down' | 'flat' } | null
  tone?: 'neutral' | 'green' | 'amber' | 'red'
  onClick?: () => void
  info?: string
}) {
  const valueColor =
    tone === 'green' ? colors.green :
    tone === 'amber' ? colors.warn :
    tone === 'red' ? colors.danger :
    colors.text

  const [hovered, setHovered] = React.useState(false)
  const clickable = !!onClick

  return (
    <div
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick!() } } : undefined}
      onMouseEnter={clickable ? () => setHovered(true) : undefined}
      onMouseLeave={clickable ? () => setHovered(false) : undefined}
      onFocus={clickable ? () => setHovered(true) : undefined}
      onBlur={clickable ? () => setHovered(false) : undefined}
      style={{
        position: 'relative',
        background: colors.surface,
        border: `1px solid ${clickable && hovered ? colors.borderHover : colors.border}`,
        borderRadius: radius.xl,
        padding: '18px 20px',
        cursor: clickable ? 'pointer' : 'default',
        boxSizing: 'border-box',
        transition: `border-color ${animation.fast}`,
        outline: 'none',
      }}
    >
      {clickable && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: '14px',
            right: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10.5px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: colors.accent,
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateX(0)' : 'translateX(2px)',
            transition: `opacity ${animation.fast}, transform ${animation.fast}`,
            pointerEvents: 'none',
          }}
        >
          <Icon name="sparkles" size={11} />
          Ask
        </span>
      )}
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: colors.text3,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        {label}
        {info && (
          <span
            title={info}
            style={{ cursor: 'help', opacity: 0.6, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}
            aria-label={info}
          >
            ⓘ
          </span>
        )}
      </div>
      <div style={{
        fontFamily: typography.fonts.numeric,
        fontSize: '28px',
        fontWeight: 900,
        lineHeight: 1,
        color: valueColor,
        marginBottom: '10px',
      }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minHeight: '20px' }}>
        {delta != null && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 700,
            color: delta.direction === 'up' ? colors.green : delta.direction === 'down' ? colors.danger : colors.text3,
            background: delta.direction === 'up' ? colors.greenGlow : delta.direction === 'down' ? colors.dangerGlow : colors.surface2,
          }}>
            {delta.direction === 'up' ? '↑' : delta.direction === 'down' ? '↓' : '→'} {Math.abs(delta.value).toFixed(1)}
          </span>
        )}
        {subtitle && <span style={{ fontSize: '12px', color: colors.text3 }}>{subtitle}</span>}
      </div>
    </div>
  )
}

function InlineTag({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'green' | 'amber' | 'red' }) {
  const palette = {
    neutral: { color: colors.text3, background: colors.surface2, border: colors.border },
    green: { color: colors.green, background: colors.greenGlow, border: 'rgba(34,197,94,0.25)' },
    amber: { color: colors.warn, background: colors.warnGlow, border: 'rgba(245,158,11,0.24)' },
    red: { color: colors.danger, background: colors.dangerGlow, border: 'rgba(240,68,56,0.24)' },
  }[tone]

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 8px',
      borderRadius: '999px',
      fontSize: '11px',
      fontWeight: 700,
      color: palette.color,
      background: palette.background,
      border: `1px solid ${palette.border}`,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

// An action (not a status). Rendered as the design system's outline button with a
// question icon so it reads as "do something" rather than another badge in the row.
function AskWhyButton({ label = 'Ask why', onClick }: { label?: string; onClick: (e: React.MouseEvent) => void }) {
  return (
    <Button variant="secondary" size="sm" icon="help" onClick={onClick} style={{ whiteSpace: 'nowrap', borderRadius: radius.full }}>
      {label}
    </Button>
  )
}

function formatAttentionTag(tag: any) {
  switch (tag.type) {
    case 'ESCALATING_CLAIMS':
      return { label: '⚠ Escalating Claims', tone: 'amber' as const }
    case 'STAGNANT_LANGUAGE':
      return { label: '⚠ Templated Reporting', tone: 'amber' as const }
    case 'MISSED':
      return { label: `${tag.count} Missed`, tone: 'amber' as const }
    case 'UNREVIEWED_AGE':
      return { label: `Unreviewed ${tag.days}d ago`, tone: 'amber' as const }
    case 'DECLINING':
      return { label: 'Declining', tone: 'amber' as const }
    default:
      return { label: tag.type, tone: 'neutral' as const }
  }
}

function scoreBand(score: number | null | undefined) {
  if (score == null) return 'neutral' as const
  if (score >= 7.5) return 'green' as const
  if (score >= 6) return 'amber' as const
  return 'red' as const
}

const PERF_AVATAR_PALETTE = ['#2A3A5A', '#2E3A4A', '#3A2A5A', '#2A4A3A', '#4A3A2A', '#3A2A4A']
function getPerfAvatarBg(name: string): string {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return PERF_AVATAR_PALETTE[h % PERF_AVATAR_PALETTE.length]
}

// Status label shown in the Team card. teamPerformance.status is one of
// 'no-data' | 'on-track' | 'review' | 'at-risk'; 'no-data' reads as "Building Baseline".
function teamStatusLabel(status: string): string | undefined {
  return status === 'no-data' ? 'Building Baseline' : undefined
}

// Short label shown inside the risk-flag badge — the employee's primary attention tag.
function flagLabel(entry: any): string {
  const tags = entry?.tags || []
  return tags.length ? formatAttentionTag(tags[0]).label : 'Flagged'
}

// One-line reason shown in the flag's tooltip/popover. Prefers the lowest-scoring
// criterion (e.g. "Lowest: user research quality 0.0, Jun 13"), then a trend sentence,
// then the attention tags as a fallback.
function flagReason(entry: any): string {
  const r = entry?.reason
  if (r) {
    if ('criterionName' in r) {
      const d = new Date(r.reportDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      return `Lowest: ${r.criterionName} ${Number(r.score).toFixed(1)}, ${d}`
    }
    if ('text' in r && r.text) return r.text
  }
  const tags = entry?.tags || []
  return tags.length ? tags.map((t: any) => formatAttentionTag(t).label).join(', ') : 'Flagged'
}

// Risk flag badge for a Team row. Hover shows the reason as a tooltip; tap (touch)
// pins it open as a small popover. Stops click propagation so it doesn't trigger the
// row's navigation. Styled as a darker secondary variant so it stands out in the row.
function RiskFlag({ label, reason, trend }: { label: string; reason: string; trend?: 'up' | 'down' | null }) {
  const [pinned, setPinned] = React.useState(false)
  const [hovered, setHovered] = React.useState(false)
  const show = pinned || hovered

  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        aria-label={reason}
        onClick={(e) => { e.stopPropagation(); setPinned(p => !p) }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onBlur={() => setPinned(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 9px',
          borderRadius: '999px',
          background: 'rgba(120,30,30,0.45)',
          border: '1px solid rgba(240,68,56,0.35)',
          color: colors.danger,
          fontSize: '11px',
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <span aria-hidden="true">⚑</span>{label}
        {trend && <span aria-hidden="true">{trend === 'up' ? '↑' : '↓'}</span>}
      </button>
      {show && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 60,
            background: colors.surface3,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            padding: '6px 10px',
            fontSize: '11px',
            fontWeight: 500,
            color: colors.text2,
            whiteSpace: 'nowrap',
            boxShadow: shadows.cardHover,
            pointerEvents: 'none',
          }}
        >
          {reason}
        </span>
      )}
    </span>
  )
}

export function DashboardView({ teamStats }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [hoveredPerfId, setHoveredPerfId] = React.useState<string | null>(null)
  const [askInput, setAskInput] = React.useState('')

  const paramsString = searchParams.toString()
  const appendParams = React.useCallback((href: string) => {
    if (!paramsString) return href
    return href.includes('?') ? `${href}&${paramsString}` : `${href}?${paramsString}`
  }, [paramsString])

  // ── Ask hand-off ───────────────────────────────────────────────────────
  // Build a deep link into Ask carrying the typed/suggested question plus whatever
  // scope the dashboard already knows (current date range, optional employee), so
  // Ask doesn't have to re-resolve it.
  const startParam = searchParams.get('start')
  const endParam = searchParams.get('end')
  const viewParam = searchParams.get('view')
  const buildAskHref = React.useCallback((question: string, opts?: { employeeId?: string }) => {
    const p = new URLSearchParams()
    p.set('q', question)
    if (opts?.employeeId) p.set('employee', opts.employeeId)
    if (startParam && startParam !== 'all') {
      p.set('start', startParam)
      if (endParam) p.set('end', endParam)
    }
    if (viewParam) p.set('view', viewParam)
    return `/ask?${p.toString()}`
  }, [startParam, endParam, viewParam])
  const goToAsk = React.useCallback((question: string, opts?: { employeeId?: string }) => {
    router.push(buildAskHref(question, opts))
  }, [router, buildAskHref])

  const needsAttention = teamStats?.needsAttention || []
  const kpis = teamStats?.kpis || {}
  const teamPerformance = teamStats?.teamPerformance || []
  const goals = teamStats?.goals || []

  // Risk-flag lookup: an employee is flagged on their Team row iff they "previously
  // triggered Needs Attention" — i.e. they appear in needsAttention, which is the only
  // source of the per-person reason line (lowest-scoring criterion).
  const needsAttentionById = React.useMemo(
    () => new Map((needsAttention as any[]).map((e) => [e.id, e])),
    [needsAttention]
  )

  // Suggested Ask questions generated from the current dashboard data. We carry along
  // the scope the dashboard already knows (employee for a flagged person, plus the date
  // range via goToAsk) so Ask lands pre-scoped.
  const askSuggestions = React.useMemo(() => {
    const out: { label: string; question: string; employeeId?: string }[] = []
    const flagged = needsAttention[0]
    if (flagged) {
      out.push({
        label: `Why is ${flagged.name} declining?`,
        question: `Why is ${flagged.name} declining?`,
        employeeId: flagged.id,
      })
    }
    const avg = kpis.teamAvgScore
    if (avg != null && avg < 7) {
      out.push({
        label: `Why is the team average ${avg.toFixed(1)}?`,
        question: `Why is the team average ${avg.toFixed(1)} this period?`,
      })
    }
    if (out.length < 2) out.push({ label: 'Give me a team overview', question: 'Give me an overview of team performance.' })
    if (out.length < 2) out.push({ label: 'Who needs coaching right now?', question: 'Who might benefit most from coaching right now?' })
    return out.slice(0, 3)
  }, [needsAttention, kpis])

  // Team Avg Score coverage: scorecards scored = distinct goals with ≥1 scored report in
  // range; KPIs scored = total criteria across those scorecards. Same scoredGoals basis the
  // old "More" Scorecards tile used, extended with each goal's criteria count.
  const scoredGoals = goals.filter((g: any) => (g.reports ?? 0) > 0)
  const kpisScored = scoredGoals.reduce((a: number, g: any) => a + (g.criteriaCount ?? 0), 0)
  const avgScoreSubtitle = scoredGoals.length > 0
    ? `${scoredGoals.length} scorecard${scoredGoals.length === 1 ? '' : 's'} scored, ${kpisScored} KPI${kpisScored === 1 ? '' : 's'} scored`
    : 'no scores yet'

  return (
    <div style={{ padding: layout.contentPadding, width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Ask bar ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <form
          onSubmit={(e) => { e.preventDefault(); const q = askInput.trim(); if (q) goToAsk(q) }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.xl,
            padding: '8px 8px 8px 16px',
          }}
        >
          <span style={{ color: colors.accent, display: 'flex', flexShrink: 0 }}>
            <svg viewBox="0 0 16 16" fill="none" width={18} height={18} stroke="currentColor" strokeWidth="1.6">
              <circle cx="8" cy="8" r="6.5" />
              <path d="M6 6c0-1.1.9-2 2-2s2 .9 2 2c0 1.2-1.2 1.6-2 2.2" strokeLinecap="round" />
              <circle cx="8" cy="12" r="0.7" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <input
            value={askInput}
            onChange={(e) => setAskInput(e.target.value)}
            placeholder="Ask Zevian about your team"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: colors.text,
              fontSize: typography.size.base,
              fontFamily: 'inherit',
            }}
          />
          <button
            type="submit"
            disabled={!askInput.trim()}
            aria-label="Ask"
            style={{
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: radius.md,
              background: askInput.trim() ? colors.accent : colors.surface3,
              border: 'none',
              cursor: askInput.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg viewBox="0 0 16 16" fill="none" width={16} height={16}>
              <path d="M2 8h12M8 2l6 6-6 6" stroke={askInput.trim() ? '#fff' : colors.text3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {askSuggestions.map((s) => (
            <button
              key={s.label}
              onClick={() => goToAsk(s.question, s.employeeId ? { employeeId: s.employeeId } : undefined)}
              style={{
                padding: '7px 14px',
                borderRadius: '999px',
                border: `1px solid ${colors.border}`,
                background: colors.surface2,
                color: colors.text2,
                fontSize: typography.size.sm,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
        <DateRangeSelector
          startDate={searchParams.get('start') || undefined}
          endDate={searchParams.get('end') || undefined}
          defaultRangeDays={7}
          onRangeChange={(start, end) => {
            const params = new URLSearchParams(searchParams.toString())
            if (start === 'all') {
              params.set('start', 'all')
              params.delete('end')
            } else if (start && end) {
              params.set('start', start)
              params.set('end', end)
            } else {
              params.delete('start')
              params.delete('end')
            }
            router.push(`?${params.toString()}`)
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
        <KpiCard
          label="Reports Submitted"
          value={kpis.reportsThisPeriod ?? 0}
          subtitle={
            kpis.contributorCount
              ? `across ${kpis.contributorCount} team member${kpis.contributorCount === 1 ? '' : 's'}`
              : 'no reports yet'
          }
          delta={kpis.reportsDelta}
          onClick={() => goToAsk('How many reports has the team submitted this period, and who contributed?')}
        />
        <KpiCard
          label="Team Avg Score"
          value={kpis.teamAvgScore != null ? kpis.teamAvgScore.toFixed(1) : '—'}
          subtitle={avgScoreSubtitle}
          delta={kpis.teamAvgDelta}
          tone={scoreBand(kpis.teamAvgScore)}
          onClick={() => goToAsk(
            kpis.teamAvgScore != null
              ? `Why is the team average ${kpis.teamAvgScore.toFixed(1)} this period?`
              : 'How is the team performing this period?'
          )}
        />
        <KpiCard
          label="Submission Rate"
          value={kpis.submissionRate?.pct != null ? `${kpis.submissionRate.pct}%` : '—'}
          subtitle={
            kpis.submissionRate?.expected
              ? `${kpis.submissionRate.expected} report${kpis.submissionRate.expected === 1 ? '' : 's'} due`
              : 'none due yet'
          }
          info="Of every report due in the selected date range, the share that was submitted. Excludes periods not yet due and approved leave."
          tone={
            kpis.submissionRate?.pct == null ? 'neutral'
              : kpis.submissionRate.pct >= 80 ? 'green'
              : kpis.submissionRate.pct >= 50 ? 'amber'
              : 'red'
          }
          onClick={() => goToAsk(
            kpis.submissionRate?.pct != null
              ? `Why is our submission rate ${kpis.submissionRate.pct}% this period, and who is behind?`
              : 'What is our submission rate this period?'
          )}
        />
        <KpiCard
          label="Needs Review"
          value={kpis.needsReviewCount ?? 0}
          subtitle={(kpis.needsReviewCount ?? 0) > 0 ? 'awaiting your review' : 'all caught up'}
          tone={(kpis.needsReviewCount ?? 0) > 0 ? 'amber' : 'neutral'}
          onClick={() => goToAsk('Which reports still need my review, and what was flagged in them?')}
        />
      </div>

      {/* ── Team card ─────────────────────────────────────────── */}
      <Card className="hoverable-card" title="Team" icon="people" chip={<InlineTag label={`${teamPerformance.length} ${teamPerformance.length === 1 ? 'member' : 'members'}`} />}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {teamPerformance.map((employee: any, index: number) => {
            const isNoData = employee.status === 'no-data' || (employee.reportCount ?? 0) === 0
            const scoreColor = employee.score != null ? getScoreColor(employee.score) : colors.text3
            const isDeclining = employee.scoreDirection === 'down'
            // Per-person trend arrow: scoreDirection is only set ('up'/'down'/'flat') when the
            // employee has ≥2 scored reports in range, so <2 reports → null → no arrow. We only
            // surface up/down (a flat run shows no arrow).
            const trendArrow = employee.scoreDirection === 'up' ? '↑' : isDeclining ? '↓' : null
            const trendColor = employee.scoreDirection === 'up' ? colors.green : colors.danger
            const showAskWhy = employee.status === 'at-risk' || isDeclining
            // Risk flag: present iff this employee previously triggered Needs Attention.
            const flagEntry = needsAttentionById.get(employee.id)
            return (
              <div
                key={employee.id}
                onClick={() => router.push(appendParams(`/employees/${employee.id}`))}
                role="button"
                tabIndex={0}
                onMouseEnter={() => setHoveredPerfId(employee.id)}
                onMouseLeave={() => setHoveredPerfId(null)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '12px',
                  padding: '14px 10px',
                  margin: '0 -10px',
                  borderRadius: 8,
                  borderBottom: index === teamPerformance.length - 1 ? 'none' : `1px solid ${colors.border}`,
                  boxShadow: hoveredPerfId === employee.id ? 'inset 0 0 0 1px rgba(255,255,255,0.09)' : 'none',
                  transition: `box-shadow ${animation.base}`,
                  cursor: 'pointer',
                  opacity: isNoData ? 0.55 : 1,
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Avatar name={employee.name} size="lg" style={{ background: getPerfAvatarBg(employee.name), color: '#C8D4E8' }} />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: colors.text }}>{employee.name}</div>
                    <div style={{ fontSize: '12px', color: colors.text3, marginTop: '3px' }}>{employee.role}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Status group: one status badge + score, kept tight together. When the row is
                      flagged, the flag badge carries the trend arrow so we don't repeat it next to
                      the score or duplicate it with a second status pill. */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {flagEntry ? (
                      <RiskFlag
                        label={flagLabel(flagEntry)}
                        reason={flagReason(flagEntry)}
                        trend={employee.scoreDirection === 'up' ? 'up' : isDeclining ? 'down' : null}
                      />
                    ) : (
                      <StatusPill status={employee.status}>
                        {teamStatusLabel(employee.status)}
                      </StatusPill>
                    )}
                    {employee.score != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontFamily: typography.fonts.numeric, fontWeight: 900, color: scoreColor, fontSize: '15px', lineHeight: 1 }}>{employee.score.toFixed(1)}</span>
                        {!flagEntry && trendArrow && <span style={{ fontSize: '11px', fontWeight: 700, color: trendColor, lineHeight: 1 }}>{trendArrow}</span>}
                      </div>
                    )}
                  </div>
                  {showAskWhy && (
                    <AskWhyButton onClick={(e) => { e.stopPropagation(); goToAsk(`Why is ${employee.name} ${isDeclining ? 'declining' : 'at risk'}?`, { employeeId: employee.id }) }} />
                  )}
                  <div style={{ color: colors.text3, opacity: hoveredPerfId === employee.id ? 0.9 : 0.4, transition: `opacity ${animation.base}`, display: 'flex' }}>
                    <Icon name="chevronRight" size={14} />
                  </div>
                </div>
              </div>
            )
          })}
          {teamPerformance.length === 0 && (
            <div style={{ padding: '20px 0', color: colors.text3, fontSize: '13px' }}>No team members to show.</div>
          )}
        </div>
      </Card>

      <style jsx>{`
        .hoverable-card {
          transition: border-color 0.15s ease;
        }
        .hoverable-card:hover {
          border-color: ${colors.borderHover} !important;
        }
      `}</style>
    </div>
  )
}
