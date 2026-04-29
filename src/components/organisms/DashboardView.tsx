'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { colors, layout, radius, typography, getScoreColor } from '@/design-system'
import { Avatar } from '@/components/atoms'
import {
  Card,
  DateRangeSelector,
  AIOrganizationSummaryCard,
  SlimProjectCard,
  RecentReportItem,
} from '@/components/molecules'
import { Organization } from '@/types'

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
}: {
  label: string
  value: string | number
  subtitle?: string
  delta?: { value: number; direction: 'up' | 'down' | 'flat' } | null
  tone?: 'neutral' | 'green' | 'amber' | 'red'
  onClick?: () => void
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
      }}>
        {label}
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

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
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

export function DashboardView({ teamStats, organization }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const recentReportsRef = React.useRef<HTMLDivElement | null>(null)
  const [reportFilter, setReportFilter] = React.useState<ReportFilter>('all')
  const [showAiSummary, setShowAiSummary] = React.useState(false)
  const [aiSummaryOpened, setAiSummaryOpened] = React.useState(false)
  const [orgMetricsExpanded, setOrgMetricsExpanded] = React.useState(
    (teamStats?.metricStats || []).some((metric: any) => (metric.avg ?? 10) < 7)
  )

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

    return recentReports.filter((report: any) => {
      const tags: string[] = report.tags ?? []
      if (reportFilter === 'needs-review') return !report.reviewed
      if (reportFilter === 'flagged') return tags.some(t => ['PROMPT_INJECTION', 'ESCALATING_CLAIMS', 'STAGNANT_LANGUAGE', 'KEYWORD_STUFFING', 'PADDING'].includes(t))
      if (reportFilter === 'late') return tags.includes('LATE')
      return true
    }).slice(0, 8)
  }, [recentReports, reportFilter, reportingPeriods])

  const unhealthyMetrics = metricStats.filter((metric: any) => (metric.avg ?? 10) < 7)
  const showOrgMetrics = metricStats.length > 0

  const seriesMax = 10
  const svgWidth = 760
  const svgHeight = 220
  const chartPadding = { left: 24, right: 72, top: 18, bottom: 26 }
  const plotWidth = svgWidth - chartPadding.left - chartPadding.right
  const plotHeight = svgHeight - chartPadding.top - chartPadding.bottom
  const pointsToPolyline = (values: number[]) => {
    if (values.length < 2) return ''
    return values.map((value, index) => {
      const x = chartPadding.left + (plotWidth * index) / (values.length - 1)
      const y = chartPadding.top + ((seriesMax - value) / seriesMax) * plotHeight
      return `${x},${y}`
    }).join(' ')
  }
  const bandTop = chartPadding.top + ((seriesMax - 8.5) / seriesMax) * plotHeight
  const bandBottom = chartPadding.top + ((seriesMax - 7.0) / seriesMax) * plotHeight

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
            AI Summary
            <span style={{ fontSize: '11px', opacity: 0.7 }}>{showAiSummary ? '▴' : '▾'}</span>
          </button>
        )}
        <DateRangeSelector
          startDate={searchParams.get('start') || undefined}
          endDate={searchParams.get('end') || undefined}
          onRangeChange={(start, end) => {
            const params = new URLSearchParams(searchParams.toString())
            if (start && end) {
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
          startDate={searchParams.get('start') || undefined}
          endDate={searchParams.get('end') || undefined}
          autoGenerate={aiSummaryOpened}
        />
      )}

      {needsAttention.length > 0 && (
        <Card title="Needs Attention" icon="alert" chip={<InlineTag label={`${needsAttention.length} employees`} tone="amber" />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {needsAttention.map((employee: any) => (
              <div key={employee.id} style={{ border: `1px solid ${colors.border}`, borderRadius: radius.xl, padding: '16px', background: colors.surface2, display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'center' }}>
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
                    {typeof employee.latestDrop === 'number' && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: colors.text3 }}>
                        Avg {employee.latestDrop.toFixed(1)} ↓
                      </div>
                    )}
                  </div>
                </div>
                <ActionLink href={appendParams(employee.reviewHref)} label="Review" />
              </div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
        <KpiCard
          label="Reports This Period"
          value={kpis.reportsThisPeriod ?? 0}
          subtitle="vs previous period"
          delta={kpis.reportsDelta}
        />
        <KpiCard
          label="Team Avg Score"
          value={kpis.teamAvgScore != null ? kpis.teamAvgScore.toFixed(1) : '—'}
          subtitle="vs previous period"
          delta={kpis.teamAvgDelta}
          tone={scoreBand(kpis.teamAvgScore)}
        />
        <KpiCard
          label="Submission Rate"
          value={`${kpis.submissionRate?.submitted ?? 0} / ${kpis.submissionRate?.expected ?? 0}`}
          subtitle="submitted"
        />
        <KpiCard
          label="Needs Review"
          value={kpis.needsReviewCount ?? 0}
          subtitle="older than 24h"
          tone={(kpis.needsReviewCount ?? 0) > 0 ? 'amber' : 'neutral'}
          onClick={() => recentReportsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(320px, 1fr)', gap: '16px', alignItems: 'start' }}>
        <div ref={recentReportsRef}>
          <Card
            title="Recent Reports"
            icon="reports"
            action={<Link href={appendParams('/reports')} style={{ fontSize: '12px', color: colors.accent, textDecoration: 'none', fontWeight: 700 }}>View All</Link>}
          >
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <FilterChip active={reportFilter === 'all'} label="All" onClick={() => setReportFilter('all')} />
              <FilterChip active={reportFilter === 'needs-review'} label="Needs Review" onClick={() => setReportFilter('needs-review')} />
              <FilterChip active={reportFilter === 'flagged'} label="Flagged" onClick={() => setReportFilter('flagged')} />
              <FilterChip active={reportFilter === 'late'} label="Late" onClick={() => setReportFilter('late')} />
              <FilterChip active={reportFilter === 'missed'} label="Missed" onClick={() => setReportFilter('missed')} />
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
                    employeeName={item.employeeName}
                    employeeTitle={item.employeeTitle}
                    goalName={item.goalName}
                    projectName={item.projectName}
                    date={item.date}
                    score={item.score}
                    tags={item.tags}
                    reviewed={item.reviewed}
                    overridden={item.overridden}
                    isLast={index === filteredReportRows.length - 1}
                  />
                )
              )) : (
                <div style={{ padding: '20px 0', color: colors.text3, fontSize: '13px' }}>No items in this filter.</div>
              )}
            </div>
          </Card>
        </div>

        <Card title="Team Performance" icon="people">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {teamPerformance.map((employee: any, index: number) => {
              const statusLabel = employee.status === 'at-risk' ? 'AT RISK' : employee.status === 'review' ? 'REVIEW' : employee.status === 'on-track' ? 'ON TRACK' : 'BUILDING BASELINE'
              const statusTone = employee.status === 'at-risk' ? 'red' : employee.status === 'review' ? 'amber' : employee.status === 'on-track' ? 'green' : 'neutral'
              const badgeHref = appendParams(`/employees/${employee.id}`)
              return (
                <div key={employee.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', padding: '14px 0', borderBottom: index === teamPerformance.length - 1 ? 'none' : `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <Avatar name={employee.name} size="lg" />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: colors.text }}>{employee.name}</span>
                        {employee.score != null && <span style={{ fontFamily: typography.fonts.numeric, fontWeight: 900, color: getScoreColor(employee.score), fontSize: '15px' }}>{employee.score.toFixed(1)}</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: colors.text3, marginTop: '3px' }}>{employee.role}</div>
                      <div style={{ fontSize: '12px', color: colors.text3, marginTop: '4px' }}>
                        {(employee.score != null || (employee.reportCount ?? 0) > 0)
                          ? `${employee.submittedPeriods ?? 0} of ${employee.periodCount ?? 0} periods · ${employee.reportCount ?? 0} report${(employee.reportCount ?? 0) === 1 ? '' : 's'}`
                          : 'No reports yet'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    {(employee.status === 'at-risk' || employee.status === 'review') ? (
                      <Link href={badgeHref} style={{ textDecoration: 'none' }}>
                        <InlineTag label={statusLabel} tone={statusTone as any} />
                      </Link>
                    ) : (
                      <InlineTag label={statusLabel} tone={statusTone as any} />
                    )}
                    {employee.trustSignal?.label && <InlineTag label={employee.trustSignal.label} tone={employee.trustSignal.color === 'green' ? 'green' : employee.trustSignal.color === 'amber' ? 'amber' : 'neutral'} />}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <Card title="Team Score Trend" icon="chart">
        {trendScores.length > 1 ? (
          <>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '14px', fontSize: '12px', color: colors.text3 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors.accent }} />Avg Score</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '14px', height: '2px', borderTop: `2px dashed ${colors.teal}`, display: 'inline-block' }} />Org Metrics Score</span>
            </div>
            <svg width="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" style={{ display: 'block' }}>
              <rect x={chartPadding.left} y={bandTop} width={plotWidth} height={bandBottom - bandTop} fill="rgba(34,197,94,0.06)" rx="8" />
              {[0, 1, 2, 3].map((row) => {
                const y = chartPadding.top + (plotHeight * row) / 3
                return <line key={row} x1={chartPadding.left} y1={y} x2={svgWidth - chartPadding.right} y2={y} stroke={colors.border} strokeWidth="1" />
              })}
              <polyline points={pointsToPolyline(trendScores)} fill="none" stroke={colors.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {orgTrendScores.length > 1 && <polyline points={pointsToPolyline(orgTrendScores)} fill="none" stroke={colors.teal} strokeWidth="2" strokeDasharray="7 6" strokeLinecap="round" strokeLinejoin="round" />}
              {trendScores.map((value: number, index: number) => {
                const x = chartPadding.left + (plotWidth * index) / (trendScores.length - 1)
                const y = chartPadding.top + ((seriesMax - value) / seriesMax) * plotHeight
                return <circle key={index} cx={x} cy={y} r={index === trendScores.length - 1 ? 5 : 4} fill={colors.accent} stroke={colors.bg} strokeWidth="2" />
              })}
              <text x={svgWidth - chartPadding.right + 8} y={bandTop + 12} fill={colors.text3} fontSize="10">Target Zone</text>
            </svg>
          </>
        ) : (
          <div style={{ color: colors.text3, fontSize: '13px' }}>Trend appears after at least two scored reports.</div>
        )}
      </Card>

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
                const tone = scoreBand(metric.avg)
                const color = tone === 'green' ? colors.green : tone === 'amber' ? colors.warn : tone === 'red' ? colors.danger : colors.text3
                const trendLabel = metric.trend === 'up' ? '↑ improving' : metric.trend === 'down' ? '↓ declining' : '→ stable'
                return (
                  <div key={metric.id} style={{ display: 'grid', gridTemplateColumns: '180px 52px 1fr 110px', gap: '12px', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', color: colors.text }}>{metric.name}</div>
                    <div style={{ fontFamily: typography.fonts.numeric, fontWeight: 900, color }}>{metric.avg?.toFixed(1)}</div>
                    <div style={{ height: '10px', borderRadius: '999px', background: colors.surface2, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.max(0, Math.min(100, (metric.avg ?? 0) * 10))}%`, height: '100%', background: color }} />
                    </div>
                    <div style={{ fontSize: '12px', color: metric.trend === 'down' ? colors.warn : colors.text3, textAlign: 'right' }}>{trendLabel}</div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', alignItems: 'start' }}>
        <Card title="Goal Alignment" icon="target">
          {goals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {goals.map((goal: any) => {
                const color = getScoreColor(goal.score)
                return (
                  <div key={goal.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>{goal.name}</span>
                      <span style={{ fontFamily: typography.fonts.numeric, fontWeight: 900, color }}>{goal.score.toFixed(1)}</span>
                    </div>
                    <div style={{ height: '7px', background: colors.surface2, borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${goal.score * 10}%`, height: '100%', background: color }} />
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '12px', color: colors.text3 }}>{goal.owner} · {goal.reports} reports</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ color: colors.text3, fontSize: '13px' }}>No goal alignment data in this range.</div>
          )}
        </Card>

        <Card title="Ongoing Projects" icon="projects">
          {projects.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {projects.slice(0, 3).map((project: any) => <SlimProjectCard key={project.id} {...project} />)}
            </div>
          ) : (
            <div style={{ color: colors.text3, fontSize: '13px' }}>No active projects to show.</div>
          )}
        </Card>
      </div>

    </div>
  )
}
