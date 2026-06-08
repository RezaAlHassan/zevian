'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { colors, layout, radius, typography, getScoreColor, getScoreBarFill, shadows, animation } from '@/design-system'
import { Avatar, StatusPill } from '@/components/atoms'
import { Icon } from '@/components/atoms/Icon'
import { Card } from '@/components/molecules/Card'
import { DateRangeSelector } from '@/components/molecules/DateRangeSelector'
import { AIOrganizationSummaryCard } from '@/components/molecules/AIOrganizationSummaryCard'
import { SlimProjectCard } from '@/components/molecules/SlimProjectCard'
import { RecentReportItem } from '@/components/molecules/RecentReportItem'
import { Organization } from '@/types'
import { ComposedChart, Line, Area, ReferenceArea, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  teamStats: any
  recentReports: any[]
  projects: any[]
  lateSubmissions: any[]
  organization?: Organization
}

type ReportFilter = 'all' | 'needs-review' | 'flagged' | 'late' | 'missed'

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

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.xl,
        padding: '18px 20px',
        cursor: onClick ? 'pointer' : 'default',
        boxSizing: 'border-box',
      }}
    >
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

function FilterChip({ active, label, onClick, count }: { active: boolean; label: string; onClick: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '7px 12px',
        borderRadius: '999px',
        border: `1px solid ${active ? colors.accent : colors.border}`,
        background: active ? colors.accentGlow : colors.surface2,
        color: active ? colors.accent : colors.text3,
        fontSize: '12px',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {label}
      {count != null && count > 0 && (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '16px',
          height: '16px',
          padding: '0 5px',
          borderRadius: '999px',
          fontSize: '10px',
          fontWeight: 800,
          lineHeight: 1,
          color: active ? colors.accent : colors.text2,
          background: active ? 'rgba(91,127,255,0.18)' : colors.surface3,
        }}>
          {count}
        </span>
      )}
    </button>
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

function ActionLink({ href, label, muted = false }: { href: string; label: string; muted?: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 12px',
        borderRadius: radius.md,
        textDecoration: 'none',
        fontSize: '12px',
        fontWeight: 700,
        color: muted ? colors.text2 : '#fff',
        background: muted ? colors.surface2 : colors.accent,
        border: muted ? `1px solid ${colors.border}` : '1px solid transparent',
      }}
    >
      {label} <span aria-hidden="true">→</span>
    </Link>
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
      return { label: 'Declining ↓', tone: 'amber' as const }
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


function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1A1F2E', border: '1px solid #2A3045', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: '#8892A4', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: '#8892A4', minWidth: 80 }}>{p.name}</span>
          <span style={{ color: '#F1F5F9', fontWeight: 700, fontFamily: 'monospace' }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function DashboardView({ teamStats, organization }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const recentReportsRef = React.useRef<HTMLDivElement | null>(null)
  const [reportFilter, setReportFilter] = React.useState<ReportFilter>('needs-review')
  const [showAiSummary, setShowAiSummary] = React.useState(false)
  const [aiSummaryOpened, setAiSummaryOpened] = React.useState(false)
  const [orgMetricsExpanded, setOrgMetricsExpanded] = React.useState(
    (teamStats?.metricStats || []).some((metric: any) => (metric.avg ?? 10) < 7)
  )
  const [hoveredPerfId, setHoveredPerfId] = React.useState<string | null>(null)
  const [unscoredGoalsOpen, setUnscoredGoalsOpen] = React.useState(false)

  const paramsString = searchParams.toString()
  const appendParams = React.useCallback((href: string) => {
    if (!paramsString) return href
    return href.includes('?') ? `${href}&${paramsString}` : `${href}?${paramsString}`
  }, [paramsString])

  const needsAttention = teamStats?.needsAttention || []
  const kpis = teamStats?.kpis || {}
  const recentReports = teamStats?.recentReports || []
  const reportingPeriods = teamStats?.reportingPeriods || []
  const teamPerformance = teamStats?.teamPerformance || []
  const goals = teamStats?.goals || []
  const projects = teamStats?.projects || []
  const metricStats = teamStats?.metricStats || []
  const trendScores = teamStats?.trendScores || []
  const orgTrendScores = teamStats?.orgTrendScores || []
  const targetMin = teamStats?.targetMin ?? null
  const targetMax = teamStats?.targetMax ?? null

  React.useEffect(() => {
    setOrgMetricsExpanded(metricStats.some((metric: any) => (metric.avg ?? 10) < 7))
  }, [metricStats])

  const filteredReportRows = React.useMemo(() => {
    if (reportFilter === 'missed') {
      return reportingPeriods
        .filter((period: any) => period.status === 'missed')
        .sort((a: any, b: any) => new Date(b.dueDate || b.period_end).getTime() - new Date(a.dueDate || a.period_end).getTime())
        .slice(0, 8)
        .map((period: any) => ({
          type: 'missed' as const,
          id: period.id,
          employeeName: period.employeeName,
          employeeTitle: period.employeeTitle,
          goalName: period.goalName,
          projectName: period.projectName,
          date: period.dueDate,
        }))
    }

    const filtered = recentReports.filter((report: any) => {
      const tags: string[] = report.tags ?? []
      if (reportFilter === 'needs-review') return !report.reviewed
      if (reportFilter === 'flagged') return tags.some(t => ['PROMPT_INJECTION', 'ESCALATING_CLAIMS', 'STAGNANT_LANGUAGE', 'KEYWORD_STUFFING', 'PADDING'].includes(t))
      if (reportFilter === 'late') return tags.includes('LATE')
      return true
    })

    if (reportFilter === 'all') {
      return [...filtered].sort((a: any, b: any) => {
        if (!a.reviewed && b.reviewed) return -1
        if (a.reviewed && !b.reviewed) return 1
        return new Date(b.date ?? b.submissionDate).getTime() - new Date(a.date ?? a.submissionDate).getTime()
      }).slice(0, 8)
    }

    return filtered.slice(0, 8)
  }, [recentReports, reportFilter, reportingPeriods])

  const reportFilterCounts = React.useMemo(() => {
    const FLAG_TYPES = ['PROMPT_INJECTION', 'ESCALATING_CLAIMS', 'STAGNANT_LANGUAGE', 'KEYWORD_STUFFING', 'PADDING']
    return {
      'needs-review': recentReports.filter((r: any) => !r.reviewed).length,
      flagged: recentReports.filter((r: any) => (r.tags ?? []).some((t: string) => FLAG_TYPES.includes(t))).length,
      late: recentReports.filter((r: any) => (r.tags ?? []).includes('LATE')).length,
      missed: reportingPeriods.filter((p: any) => p.status === 'missed').length,
    }
  }, [recentReports, reportingPeriods])

  const scoredGoals = goals.filter((g: any) => (g.reports ?? 0) > 0)
  const unscoredGoals = goals.filter((g: any) => (g.reports ?? 0) === 0)

  const unhealthyMetrics = metricStats.filter((metric: any) => (metric.avg ?? 10) < 7)
  const showOrgMetrics = metricStats.length > 0

  const chartData = trendScores.map((score: number, i: number) => ({
    week: `W${i + 1}`,
    avg: score,
    org: orgTrendScores[i] ?? null,
  }))
  const hasOrgMetrics = orgTrendScores.length > 1

  return (
    <div style={{ padding: layout.contentPadding, width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        {organization?.id && (
          <button
            onClick={() => {
              const opening = !showAiSummary
              setShowAiSummary(opening)
              if (opening && !aiSummaryOpened) setAiSummaryOpened(true)
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 14px',
              borderRadius: radius.lg,
              border: `1px solid ${showAiSummary ? colors.accent : colors.border}`,
              background: showAiSummary ? colors.accentGlow : colors.surface2,
              color: showAiSummary ? colors.accent : colors.text2,
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '14px' }}>✦</span>
            Summary
            <span style={{ fontSize: '11px', opacity: 0.7 }}>{showAiSummary ? '▴' : '▾'}</span>
          </button>
        )}
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

      {showAiSummary && organization?.id && (
        <AIOrganizationSummaryCard
          organizationId={organization.id}
          organizationName={organization.name}
          startDate={searchParams.get('start') === 'all' ? undefined : (searchParams.get('start') || undefined)}
          endDate={searchParams.get('start') === 'all' ? undefined : (searchParams.get('end') || undefined)}
          autoGenerate={aiSummaryOpened}
        />
      )}

      {needsAttention.length > 0 && (
        <Card title="Needs Attention" icon="alert" chip={<InlineTag label={`${needsAttention.length} employees`} tone="amber" />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {needsAttention.map((employee: any) => (
              <Link key={employee.id} href={appendParams(employee.reviewHref)} className="attention-card" style={{ border: `1px solid ${colors.border}`, borderRadius: radius.xl, padding: '16px', background: colors.surface2, display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center', textDecoration: 'none', transition: `all ${animation.base}`, cursor: 'pointer' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Avatar name={employee.name} size="xl" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: colors.text }}>{employee.name} <span style={{ color: colors.text3, fontWeight: 500 }}>· {employee.title}</span></div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {employee.tags.map((tag: any, index: number) => {
                        const formatted = formatAttentionTag(tag)
                        return <InlineTag key={`${employee.id}-${index}`} label={formatted.label} tone={formatted.tone} />
                      })}
                    </div>
                    {employee.reason && (
                      <div style={{ fontSize: '12px', color: colors.text3, marginTop: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {'criterionName' in employee.reason ? (
                          <>
                            Lowest: {employee.reason.criterionName}{' '}
                            <span style={{ fontFamily: typography.fonts.numeric, fontWeight: 700, color: getScoreColor(employee.reason.score) }}>{employee.reason.score.toFixed(1)}</span>
                            <span style={{ color: colors.text3 }}> · {new Date(employee.reason.reportDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </>
                        ) : (
                          employee.reason.text
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    {typeof employee.latestDrop === 'number' && (
                      <span style={{ fontFamily: typography.fonts.numeric, fontWeight: 900, color: getScoreColor(employee.latestDrop), fontSize: '22px', lineHeight: 1 }}>
                        {employee.latestDrop.toFixed(1)}
                      </span>
                    )}
                    <StatusPill status="review" />
                  </div>
                  <div style={{ color: colors.text3, opacity: 0.5, display: 'flex' }}>
                    <Icon name="chevronRight" size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

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
        />
        <KpiCard
          label="Team Avg Score"
          value={kpis.teamAvgScore != null ? kpis.teamAvgScore.toFixed(1) : '—'}
          subtitle="out of 10"
          delta={kpis.teamAvgDelta}
          tone={scoreBand(kpis.teamAvgScore)}
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
        />
        <KpiCard
          label="Needs Review"
          value={kpis.needsReviewCount ?? 0}
          subtitle={(kpis.needsReviewCount ?? 0) > 0 ? 'awaiting your review' : 'all caught up'}
          tone={(kpis.needsReviewCount ?? 0) > 0 ? 'amber' : 'neutral'}
          onClick={() => recentReportsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(320px, 1fr)', gap: '16px', alignItems: 'start' }}>
        <div ref={recentReportsRef}>
          <Card
            className="hoverable-card"
            title="Recent Reports"
            icon="reports"
            action={<Link href={appendParams('/reports')} style={{ fontSize: '12px', color: colors.accent, textDecoration: 'none', fontWeight: 700 }}>View All</Link>}
          >
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <FilterChip active={reportFilter === 'all'} label="All" onClick={() => setReportFilter('all')} />
              <FilterChip active={reportFilter === 'needs-review'} label="Needs Review" count={reportFilterCounts['needs-review']} onClick={() => setReportFilter('needs-review')} />
              <FilterChip active={reportFilter === 'flagged'} label="Flagged" count={reportFilterCounts.flagged} onClick={() => setReportFilter('flagged')} />
              <FilterChip active={reportFilter === 'late'} label="Late" count={reportFilterCounts.late} onClick={() => setReportFilter('late')} />
              <FilterChip active={reportFilter === 'missed'} label="Missed" count={reportFilterCounts.missed} onClick={() => setReportFilter('missed')} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredReportRows.length > 0 ? filteredReportRows.map((item: any, index: number) => (
                item.type === 'missed' ? (
                  <RecentReportItem
                    key={item.id}
                    variant="missed"
                    employeeName={item.employeeName}
                    employeeTitle={item.employeeTitle}
                    goalName={item.goalName}
                    projectName={item.projectName}
                    date={item.date}
                    isLast={index === filteredReportRows.length - 1}
                  />
                ) : (
                  <RecentReportItem
                    key={item.id}
                    variant="report"
                    id={item.id}
                    href={appendParams(`/reports/${item.id}`)}
                    employeeId={item.employeeId}
                    employeeName={item.employeeName}
                    employeeTitle={item.employeeTitle}
                    goalName={item.goalName}
                    projectName={item.projectName}
                    date={item.date}
                    timestamp={item.submittedAt}
                    score={item.score}
                    tags={item.tags}
                    reviewed={item.reviewed}
                    overridden={item.overridden}
                    isLast={index === filteredReportRows.length - 1}
                  />
                )
              )) : reportFilter === 'needs-review' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', gap: 8 }}>
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none"><path d="M2.5 8.5l3.5 3.5 7-7" stroke="#00D4AA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>All reports reviewed</span>
                  <span style={{ fontSize: 12, color: '#8892A4', textAlign: 'center' }}>No reports waiting for your review right now.</span>
                </div>
              ) : (
                <div style={{ padding: '20px 0', color: colors.text3, fontSize: '13px' }}>No items in this filter.</div>
              )}
            </div>
          </Card>
        </div>

        <Card className="hoverable-card" title="Team Performance" icon="people">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {teamPerformance.map((employee: any, index: number) => {
              const isNoData = employee.status === 'no-data' || (employee.reportCount ?? 0) === 0
              const scoreColor = employee.score != null ? getScoreColor(employee.score) : colors.text3
              const trendArrow = employee.scoreDirection === 'up' ? '↑' : employee.scoreDirection === 'down' ? '↓' : employee.scoreDirection === 'flat' ? '→' : null
              const trendColor = employee.scoreDirection === 'up' ? colors.green : employee.scoreDirection === 'down' ? colors.danger : colors.text3
              const reportCount = employee.reportCount ?? 0
              const submissionRate = employee.submissionRate
              const metaLine = reportCount > 0
                ? submissionRate != null
                  ? `${reportCount} report${reportCount === 1 ? '' : 's'} · ${submissionRate}% submission rate`
                  : `${reportCount} report${reportCount === 1 ? '' : 's'} submitted`
                : 'No reports yet'
              return (
                <Link
                  key={employee.id}
                  href={appendParams(`/employees/${employee.id}`)}
                  onMouseEnter={() => setHoveredPerfId(employee.id)}
                  onMouseLeave={() => setHoveredPerfId(null)}
                  style={{
                    textDecoration: 'none',
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
                    opacity: isNoData ? 0.5 : 1,
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <Avatar name={employee.name} size="lg" style={{ background: getPerfAvatarBg(employee.name), color: '#C8D4E8' }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: colors.text }}>{employee.name}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: colors.text3, marginTop: '3px' }}>{employee.role}</div>
                      <div style={{ fontSize: '12px', color: colors.text3, marginTop: '4px' }}>{metaLine}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      {employee.score != null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontFamily: typography.fonts.numeric, fontWeight: 900, color: scoreColor, fontSize: '15px', lineHeight: 1 }}>{employee.score.toFixed(1)}</span>
                          {trendArrow && <span style={{ fontSize: '11px', fontWeight: 700, color: trendColor, lineHeight: 1 }}>{trendArrow}</span>}
                        </div>
                      )}
                      <StatusPill status={employee.status}>
                        {employee.status === 'no-data' ? 'Building Baseline' : undefined}
                      </StatusPill>
                      {employee.trustSignal?.label && <InlineTag label={employee.trustSignal.label} tone={employee.trustSignal.color === 'green' ? 'green' : employee.trustSignal.color === 'amber' ? 'amber' : 'neutral'} />}
                    </div>
                    <div style={{ color: colors.text3, opacity: hoveredPerfId === employee.id ? 0.9 : 0.4, transition: `opacity ${animation.base}`, display: 'flex' }}>
                      <Icon name="chevronRight" size={14} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </Card>
      </div>

      <Card title="Team Score Trend" icon="chart">
        {trendScores.length > 1 ? (
          <>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '14px', fontSize: '12px', color: colors.text3 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#5B7FFF' }} />
                Avg Score
              </span>
              {hasOrgMetrics && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '14px', height: '2px', borderTop: `2px dashed #00D4AA`, display: 'inline-block' }} />
                  Org Metrics Score
                </span>
              )}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '8px', background: 'rgba(0,212,170,0.07)', border: '1px dashed rgba(0,212,170,0.2)', display: 'inline-block', borderRadius: 2 }} />
                Target Zone
              </span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5B7FFF" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#5B7FFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#2A3045" />
                <XAxis dataKey="week" tick={{ fill: '#8892A4', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: '#8892A4', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2A3045', strokeWidth: 1 }} />
                <ReferenceArea
                  y1={targetMin ?? 7.5} y2={targetMax ?? 9.5}
                  fill="#00D4AA" fillOpacity={0.07}
                  stroke="#00D4AA" strokeOpacity={0.2} strokeDasharray="4 4"
                  label={{ value: 'Target Zone', position: 'insideTopRight', fill: '#00D4AA', fontSize: 11, opacity: 0.6 }}
                />
                <Area
                  type="monotone" dataKey="avg" name="Avg Score"
                  stroke="#5B7FFF" strokeWidth={2}
                  fill="url(#avgGradient)"
                  dot={{ fill: '#5B7FFF', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                {hasOrgMetrics && (
                  <Line
                    type="monotone" dataKey="org" name="Org Metrics"
                    stroke="#00D4AA" strokeWidth={1.5} strokeDasharray="5 4"
                    dot={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div style={{ color: colors.text3, fontSize: '13px' }}>Trend appears after at least two scored reports.</div>
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: showOrgMetrics ? 'minmax(0, 1fr) minmax(0, 1fr)' : '1fr', gap: '16px', alignItems: 'start' }}>
        {showOrgMetrics && (
          <Card
            title="Org Metrics"
            icon="chart"
            chip={
              unhealthyMetrics.length === 0
                ? <InlineTag label="● All healthy" tone="green" />
                : <InlineTag label={`⚠ ${unhealthyMetrics.length} metric${unhealthyMetrics.length === 1 ? '' : 's'} need attention`} tone="amber" />
            }
            action={
              <button onClick={() => setOrgMetricsExpanded((v: boolean) => !v)} style={{ background: 'transparent', border: 'none', color: colors.text3, cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}>
                {orgMetricsExpanded ? 'collapse ▴' : 'expand ▾'}
              </button>
            }
          >
            {orgMetricsExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {metricStats.map((metric: any) => {
                  const color = getScoreColor(metric.avg)
                  const trendLabel = metric.trend === 'up' ? '↑ improving' : metric.trend === 'down' ? '↓ declining' : '→ stable'
                  return (
                    <div key={metric.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{metric.name}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span style={{ fontFamily: typography.fonts.numeric, fontWeight: 900, color }}>{metric.avg?.toFixed(1)}</span>
                          <span style={{ fontSize: '11px', color: metric.trend === 'down' ? colors.warn : colors.text3 }}>{trendLabel}</span>
                        </span>
                      </div>
                      <div style={{ height: '7px', borderRadius: '999px', background: colors.surface2, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max(0, Math.min(100, (metric.avg ?? 0) * 10))}%`, height: '100%', background: getScoreBarFill(metric.avg) }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        )}

        <Card title="Scorecard Alignment" icon="target">
          {scoredGoals.length > 0 || unscoredGoals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {scoredGoals.map((goal: any) => {
                const color = getScoreColor(goal.score)
                return (
                  <div key={goal.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>{goal.name}</span>
                      <span style={{ fontFamily: typography.fonts.numeric, fontWeight: 900, color }}>{goal.score.toFixed(1)}</span>
                    </div>
                    <div style={{ height: '7px', background: colors.surface2, borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${goal.score * 10}%`, height: '100%', background: getScoreBarFill(goal.score) }} />
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '12px', color: colors.text3 }}>{goal.owner} · {goal.reports} reports</div>
                  </div>
                )
              })}
              {scoredGoals.length === 0 && (
                <div style={{ color: colors.text3, fontSize: '13px' }}>No scored scorecards in this range yet.</div>
              )}
              {unscoredGoals.length > 0 && (
                <div style={{ borderTop: scoredGoals.length > 0 ? `1px solid ${colors.border}` : 'none', paddingTop: scoredGoals.length > 0 ? '14px' : 0 }}>
                  <button
                    onClick={() => setUnscoredGoalsOpen(v => !v)}
                    style={{ background: 'transparent', border: 'none', color: colors.text3, cursor: 'pointer', fontSize: '12px', fontWeight: 700, padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    Not yet scored ({unscoredGoals.length}) {unscoredGoalsOpen ? '▴' : '▾'}
                  </button>
                  {unscoredGoalsOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                      {unscoredGoals.map((goal: any) => (
                        <div key={goal.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{goal.name}</span>
                          <span style={{ fontSize: '12px', color: colors.text3, flexShrink: 0 }}>{goal.owner} · No reports yet</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: colors.text3, fontSize: '13px' }}>No scorecard alignment data in this range.</div>
          )}
        </Card>
      </div>

      <Card title="Ongoing Projects" icon="projects">
        {projects.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {projects.slice(0, 3).map((project: any, index: number, arr: any[]) => <SlimProjectCard key={project.id} {...project} isLast={index === arr.length - 1} />)}
          </div>
        ) : (
          <div style={{ color: colors.text3, fontSize: '13px' }}>No active projects to show.</div>
        )}
      </Card>

      <style jsx>{`
        .hoverable-card {
          transition: border-color 0.15s ease;
        }
        .hoverable-card:hover {
          border-color: ${colors.borderHover} !important;
        }
        .attention-card:hover {
          border-color: ${colors.borderHover} !important;
          transform: translateY(-1px);
          box-shadow: ${shadows.cardHover};
        }
      `}</style>
    </div>
  )
}
