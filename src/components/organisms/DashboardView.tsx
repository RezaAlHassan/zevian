'use client'

import { colors, radius, animation, typography, layout } from '@/design-system'
import { Icon, Avatar, Chip } from '@/components/atoms'
import {
  KPICard,
  EmployeeRow,
  ProjectCard,
  SlimProjectCard,
  MetricCard,
  LateItem,
  AIBanner,
  Card,
  SectionLabel,
  RecentReportItem,
  DateRangeSelector
} from '@/components/molecules'
import { ApproveLeaveModal } from '@/components/organisms/ApproveLeaveModal'
import React from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

import { Organization } from '@/types'
import { updateOrganizationAction } from '@/app/actions/organizationActions'
import { DEFAULT_ORG_METRICS } from '@/constants/metrics'

interface Props {
  teamStats: any
  recentReports: any[]
  projects: any[]
  lateSubmissions: any[]
  organization?: Organization
}

/* ── Reusable empty-state sub-components ──────────────────────── */

function EmptyIconWrap({ variant = 'blue', size = 64, borderRadius = 16, children }: {
  variant?: 'blue' | 'teal' | 'amber' | 'green' | 'muted'
  size?: number
  borderRadius?: number
  children: React.ReactNode
}) {
  const bgMap: Record<string, string> = {
    blue: 'rgba(91,127,255,0.08)',
    teal: 'rgba(0,212,170,0.07)',
    amber: 'rgba(245,158,11,0.07)',
    green: 'rgba(16,185,129,0.12)',
    muted: colors.surface2,
  }
  const colorMap: Record<string, string> = {
    blue: colors.accent,
    teal: '#00d4aa',
    amber: colors.warn,
    green: colors.green,
    muted: colors.text3,
  }

  return (
    <div style={{
      width: size, height: size, borderRadius,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: bgMap[variant],
      position: 'relative',
      marginBottom: 16,
    }}>
      {/* Pulse ring */}
      <div style={{
        position: 'absolute', inset: -6, borderRadius: borderRadius + 6,
        border: `1px dashed rgba(255,255,255,0.1)`,
        animation: 'emptyPulse 2.4s ease-in-out infinite',
      }} />
      <div style={{ color: colorMap[variant], display: 'flex' }}>
        {children}
      </div>
    </div>
  )
}

function EmptyState({ children, padding = '40px 24px' }: { children: React.ReactNode, padding?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center', padding, gap: 0,
    }}>
      {children}
    </div>
  )
}

function EmptyTitle({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) {
  return (
    <div style={{
      fontFamily: typography.fonts.display, fontSize: 15, fontWeight: 700,
      color: colors.text, marginBottom: 6, letterSpacing: '-0.2px', ...style,
    }}>
      {children}
    </div>
  )
}

function EmptyDesc({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) {
  return (
    <div style={{
      fontSize: 13, color: colors.text3, maxWidth: 280, lineHeight: 1.6, marginBottom: 20, ...style,
    }}>
      {children}
    </div>
  )
}

function EmptyBtn({ variant = 'primary', href, children }: {
  variant?: 'primary' | 'secondary' | 'ghost'
  href?: string
  children: React.ReactNode
}) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s', border: 'none',
    textDecoration: 'none', fontFamily: typography.fonts.body,
  }
  const styles: Record<string, React.CSSProperties> = {
    primary: { ...baseStyle, background: colors.accent, color: '#fff', boxShadow: '0 0 18px rgba(91,127,255,0.25)' },
    secondary: { ...baseStyle, background: colors.surface2, border: `1px solid ${colors.border}`, color: colors.text2 },
    ghost: { ...baseStyle, background: 'transparent', color: colors.accent, border: '1px solid rgba(91,127,255,0.3)' },
  }

  if (href) {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
    const params = new URLSearchParams(searchParams.toString())
    const finalHref = href.includes('?') ? `${href}&${params.toString()}` : `${href}?${params.toString()}`
    return <Link href={finalHref} style={styles[variant]}>{children}</Link>
  }
  return <div style={styles[variant]}>{children}</div>
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      marginTop: 14, fontSize: '11.5px', color: colors.text3,
      display: 'flex', alignItems: 'center', gap: 5,
    }}>
      <Icon name="alert" size={12} color={colors.text3} />
      {children}
    </div>
  )
}

function EmptyActions({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>{children}</div>
}

/* ── Skeleton rows for team performance ────────────────────── */

function SkeletonRow({ opacity = 1 }: { opacity?: number }) {
  const skelStyle: React.CSSProperties = {
    background: colors.surface3, borderRadius: 5, position: 'relative', overflow: 'hidden',
  }
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
      borderBottom: `1px solid ${colors.border}`, opacity,
    }}>
      <div style={{ ...skelStyle, width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ ...skelStyle, height: 10, width: 140 }} />
        <div style={{ ...skelStyle, height: 10, width: 100 }} />
      </div>
      <div style={{ ...skelStyle, width: 30, height: 20 }} />
    </div>
  )
}

/* ── Dashed add-metric placeholder ─────────────────────────── */

function MetricCardEmpty() {
  return (
    <div style={{
      background: colors.surface2,
      border: `1.5px dashed rgba(255,255,255,0.1)`,
      borderRadius: 10, padding: 14,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: 80, gap: 6, cursor: 'pointer', transition: 'all 0.18s',
    }}>
      <Icon name="plus" size={16} color={colors.text3} />
      <span style={{ fontSize: '11.5px', color: colors.text3, fontWeight: 500 }}>Add metric</span>
    </div>
  )
}

/* ── Dashed empty container ──────────────────────────────── */

function DashedEmpty({ icon, title, desc, children }: {
  icon: React.ReactNode, title: string, desc: string, children?: React.ReactNode
}) {
  return (
    <div style={{
      border: `1.5px dashed rgba(255,255,255,0.1)`,
      borderRadius: 10, padding: '28px 20px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10,
    }}>
      {icon}
      <div style={{ fontSize: 13, fontWeight: 600, color: colors.text2 }}>{title}</div>
      <div style={{ fontSize: 12, color: colors.text3, maxWidth: 220, lineHeight: 1.5 }}>{desc}</div>
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */

export function DashboardView({ teamStats, recentReports, projects, lateSubmissions, organization }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const view = searchParams.get('view') || 'org'
  const [selectedMetrics, setSelectedMetrics] = React.useState<string[]>(organization?.selectedMetrics ?? [])
  const [isUpdatingMetrics, setIsUpdatingMetrics] = React.useState(false)
  const [leaveModalData, setLeaveModalData] = React.useState<{ isOpen: boolean; empId: string; empName: string }>({
    isOpen: false,
    empId: '',
    empName: ''
  })

  const toggleMetric = async (metricId: string) => {
    const newMetrics = selectedMetrics.includes(metricId)
      ? selectedMetrics.filter(id => id !== metricId)
      : [...selectedMetrics, metricId]

    setSelectedMetrics(newMetrics)
    setIsUpdatingMetrics(true)
    try {
      await updateOrganizationAction({ selectedMetrics: newMetrics })
    } catch (error) {
      console.error('Failed to update metrics:', error)
      setSelectedMetrics(selectedMetrics) // Rollback
    } finally {
      setIsUpdatingMetrics(false)
    }
  }

  const defaultMetrics = DEFAULT_ORG_METRICS.map(m => ({
    ...m,
    icon: (m.id === 'communication' ? 'reports' : 
           m.id === 'delivery' ? 'projects' : 
           m.id === 'quality' ? 'star' : 
           m.id === 'ownership' ? 'target' : 
           m.id === 'collaboration' ? 'people' : 
           m.id === 'initiative' ? 'zap' :
           m.id === 'problem_solving' ? 'target' :
           m.id === 'documentation' ? 'reports' :
           m.id === 'growth' ? 'star' : 'star') as any
  }))

  const customMetrics = organization?.customMetrics?.map(m => ({
    id: m.id,
    name: m.name,
    icon: 'star' // Default icon for custom metrics
  })) || []

  const allAvailableMetrics = [...defaultMetrics, ...customMetrics]

  const totalReports = teamStats?.totalReports || 0
  const avgScore = teamStats?.avgScore || 0
  const teamPerformance: any[] = teamStats?.teamPerformance || []
  const uiProjects: any[] = (teamStats?.projects || []).slice(0, 3)
  const uiLateSubmissions: any[] = teamStats?.lateSubmissions || lateSubmissions || []
  const goals: any[] = teamStats?.goals || []

  const hasTeam = teamPerformance.length > 0
  const hasReports = totalReports > 0
  const hasProjects = uiProjects.length > 0
  const hasOrgMetrics = selectedMetrics.length > 0 || customMetrics.length > 0
  const activeMetricsCount = selectedMetrics.length + customMetrics.length
  const hasGoals = goals.length > 0
  const showTrend = (teamStats?.trendScores?.length ?? 0) >= 2

  return (
    <div style={{ padding: layout.contentPadding, width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-4px' }}>
        <DateRangeSelector 
          startDate={searchParams.get('start') || undefined}
          endDate={searchParams.get('end') || undefined}
          onRangeChange={(start, end) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('start', start);
            params.set('end', end);
            router.push(`?${params.toString()}`);
          }}
        />
      </div>
      {/* Inject keyframe animation */}
      <style>{`@keyframes emptyPulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.04); } }`}</style>

      {/* ── AI Banner ─────────────────────────────────────── */}
      {hasReports ? (
        <AIBanner
          message={teamStats?.aiSummary || `Team average is ${avgScore}. ${totalReports} reports have been submitted.`}
          highlightedText={teamStats?.aiHighlight || `Team average is ${avgScore}.`}
        />
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '14px 20px', background: colors.surface,
          border: `1px solid ${colors.border}`, borderRadius: radius.xl,
          marginBottom: 24,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: radius.md,
            padding: '4px 10px', fontSize: 11, fontWeight: 600, color: colors.text3, whiteSpace: 'nowrap',
          }}>
            <Icon name="star" size={11} color={colors.text3} />
            Zevian AI
          </div>
          <div style={{ fontSize: 13, color: colors.text3, flex: 1 }}>
            <span style={{ color: colors.text2 }}>No data yet</span> — invite your team to unlock AI-powered performance summaries.
          </div>
          <div style={{
            padding: '7px 16px', background: colors.surface2,
            border: `1px solid ${colors.border}`, borderRadius: 7,
            fontSize: '12.5px', fontWeight: 600, color: colors.text3, cursor: 'not-allowed', whiteSpace: 'nowrap',
          }}>
            Generate Summary
          </div>
        </div>
      )}

      {/* ── Action Required (Late Submissions) ──────────── */}
      {uiLateSubmissions.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <SectionLabel>Requires Attention</SectionLabel>
          <Card
            title="Late Submissions"
            icon="alert"
            chip={<span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: colors.dangerGlow, color: colors.danger }}>{uiLateSubmissions.length} overdue</span>}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px 20px' }}>
              {uiLateSubmissions.map((item: any, i: number) => (
                <LateItem key={i} {...item} />
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── KPI Row ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {hasReports ? (
          <>
            <KPICard label="Total Reports" icon="reports" value={totalReports} variant="accent" />
            <KPICard label="Late Submissions" icon="goals" value={uiLateSubmissions.length} variant="danger" />
            <KPICard label="Avg Score (Org Metrics)" icon="star" isScore scoreValue={teamStats?.orgAvgScore || 0} showBar />
            <KPICard label="Average Score" icon="star" isScore scoreValue={avgScore} showBar variant="accent" />
          </>
        ) : (
          <>
            {[
              { label: 'Total Reports', icon: 'reports' as const, hint: 'No reports submitted' },
              { label: 'Late Submissions', icon: 'goals' as const, hint: 'No deadlines set yet' },
              { label: 'Avg Score (Org Metrics)', icon: 'star' as const, hint: '' },
              { label: 'Average Score', icon: 'star' as const, hint: '' },
            ].map((kpi, i) => (
              <div key={i} style={{
                background: colors.surface, border: `1px solid ${colors.border}`,
                borderRadius: radius.xl, padding: '18px 20px',
              }}>
                <div style={{
                  fontSize: '11.5px', fontWeight: 600, color: colors.text3,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Icon name={kpi.icon} size={13} color={colors.text3} />
                  {kpi.label}
                </div>
                <div style={{
                  fontFamily: typography.fonts.display, fontSize: 32, fontWeight: 700,
                  color: colors.surface3, lineHeight: 1, marginBottom: 8,
                }}>
                  —
                </div>
                {kpi.hint ? (
                  <div style={{ fontSize: '11.5px', color: colors.text3, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {kpi.hint}
                  </div>
                ) : (
                  <div style={{ height: 4, background: colors.surface3, borderRadius: 2 }} />
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {/* ── Chart + Team Performance Row ───────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Line Chart */}
        <Card
          title="Team Score Trend"
          icon="chart"
          chip={hasTeam ? <Chip variant="blue">{teamPerformance.length} members</Chip> : undefined}
        >
          {showTrend ? (
            <>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: colors.text2 }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.accent }} />
                  Avg Score
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: colors.text2 }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.teal }} />
                  Org Metrics Score
                </div>
              </div>
              <svg width="100%" height="160" viewBox="0 0 480 160" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5b7fff" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#5b7fff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="20" x2="480" y2="20" stroke="#1e2330" strokeWidth="1" />
                <line x1="0" y1="60" x2="480" y2="60" stroke="#1e2330" strokeWidth="1" />
                <line x1="0" y1="100" x2="480" y2="100" stroke="#1e2330" strokeWidth="1" />
                <line x1="0" y1="140" x2="480" y2="140" stroke="#1e2330" strokeWidth="1" />
                <text x="0" y="17" fill="#545d73" fontSize="9" fontFamily={typography.fonts.numeric} fontWeight={typography.weight.black}>10</text>
                <text x="0" y="57" fill="#545d73" fontSize="9" fontFamily={typography.fonts.numeric} fontWeight={typography.weight.black}>7.5</text>
                <text x="0" y="97" fill="#545d73" fontSize="9" fontFamily={typography.fonts.numeric} fontWeight={typography.weight.black}>5</text>
                <text x="0" y="137" fill="#545d73" fontSize="9" fontFamily={typography.fonts.numeric} fontWeight={typography.weight.black}>2.5</text>
                {/* Plot the actual data or a simple representation */}
                {(() => {
                  const scores = (teamStats?.trendScores || [avgScore]) as number[]
                  if (scores.length < 2) return null
                  const maxY = 140, minY = 20, range = maxY - minY
                  const step = 440 / (scores.length - 1)
                  const points = scores.map((s: number, i: number) => {
                    const x = 20 + i * step
                    const y = maxY - ((s / 10) * range)
                    return `${x},${y}`
                  }).join(' ')
                  const areaPath = `M${20},${maxY - ((scores[0] / 10) * range)} ` +
                    scores.map((s: number, i: number) => {
                      if (i === 0) return ''
                      return `L${20 + i * step},${maxY - ((s / 10) * range)}`
                    }).join(' ') +
                    ` L${20 + (scores.length - 1) * step},${maxY} L20,${maxY} Z`
                  return (
                    <>
                      <path d={areaPath} fill="url(#lineGrad)" />
                      <polyline points={points} fill="none" stroke="#5b7fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      {scores.map((s: number, i: number) => (
                        <circle key={i} cx={20 + i * step} cy={maxY - ((s / 10) * range)} r={i === scores.length - 1 ? 5 : 4} fill="#5b7fff" stroke="#0a0c10" strokeWidth="2" />
                      ))}
                    </>
                  )
                })()}
              </svg>
            </>
          ) : (
            <>
              {/* Ghost chart */}
              <div style={{ padding: '20px 20px 16px', opacity: 0.4 }}>
                <svg width="100%" height="170" viewBox="0 0 480 170" preserveAspectRatio="none">
                  <line x1="0" y1="28" x2="480" y2="28" stroke="#1e2330" strokeWidth="1" />
                  <line x1="0" y1="68" x2="480" y2="68" stroke="#1e2330" strokeWidth="1" />
                  <line x1="0" y1="108" x2="480" y2="108" stroke="#1e2330" strokeWidth="1" />
                  <line x1="0" y1="148" x2="480" y2="148" stroke="#1e2330" strokeWidth="1" />
                  <text x="0" y="25" fill="#1e2330" fontSize="9">10</text>
                  <text x="0" y="65" fill="#1e2330" fontSize="9">7.5</text>
                  <text x="0" y="105" fill="#1e2330" fontSize="9">5</text>
                  <text x="0" y="145" fill="#1e2330" fontSize="9">2.5</text>
                  <line x1="20" y1="108" x2="460" y2="108" stroke="#2a3040" strokeWidth="1.5" strokeDasharray="6,4" />
                </svg>
              </div>
              <EmptyState padding="0 24px 32px">
                <EmptyIconWrap variant="blue" size={48} borderRadius={12}>
                  <Icon name="chart" size={20} color={colors.accent} />
                </EmptyIconWrap>
                <EmptyTitle style={{ fontSize: 14 }}>No trend data yet</EmptyTitle>
                <EmptyDesc style={{ fontSize: 12, marginBottom: 16 }}>
                  Trend will show after at least 2 reports are submitted.
                </EmptyDesc>
                <EmptyBtn variant="ghost" href="/employees">
                  <Icon name="users" size={14} color={colors.accent} />
                  Invite Team
                </EmptyBtn>
              </EmptyState>
            </>
          )}
        </Card>

        {/* Team Performance */}
        <Card
          title="Team Performance"
          icon="people"
          action={hasTeam ? <span style={{ fontSize: '12px', color: colors.accent, fontWeight: 500, cursor: 'pointer' }}>See All</span> : undefined}
        >
          {hasTeam ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {teamPerformance.map((emp: any, i: number) => (
                <EmployeeRow 
                  key={i} 
                  {...emp} 
                />
              ))}
            </div>
          ) : (
            <>
              <div style={{ padding: '12px 20px 8px' }}>
                <SkeletonRow opacity={1} />
                <SkeletonRow opacity={0.6} />
                <SkeletonRow opacity={0.35} />
              </div>
              <EmptyState padding="12px 24px 28px">
                <EmptyTitle style={{ fontSize: '13.5px' }}>No team members yet</EmptyTitle>
                <EmptyDesc style={{ fontSize: 12, marginBottom: 14 }}>
                  Invite employees or freelancers to start tracking their performance.
                </EmptyDesc>
                <EmptyBtn variant="primary" href="/employees">
                  <Icon name="users" size={14} color="#fff" />
                  Invite First Member
                </EmptyBtn>
              </EmptyState>
            </>
          )}
        </Card>
      </div>


      {/* ── Org Metrics + Projects + Late ─────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Organizational Metrics */}
        <Card
          title="Organizational Metrics"
          icon="chart"
          chip={<Chip variant="teal">{hasOrgMetrics ? `${activeMetricsCount} Active` : '0 Active'}</Chip>}
        >
          <div style={{ padding: '16px 20px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: hasOrgMetrics ? '0px' : '20px' }}>
              {allAvailableMetrics
                .filter((metric: any) => selectedMetrics.includes(metric.id) || customMetrics.some(cm => cm.id === metric.id))
                .map((metric: any) => {
                  const isActive = true
                  return (
                  <div
                    key={metric.id}
                    onClick={() => toggleMetric(metric.id)}
                    style={{
                      background: isActive ? colors.accentGlow : colors.surface2,
                      border: `1px solid ${isActive ? colors.accent : colors.border}`,
                      borderRadius: 10, padding: 14, cursor: 'pointer', transition: 'all 0.18s',
                      display: 'flex', flexDirection: 'column', gap: 8
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Icon name={metric.icon as any} size={16} color={isActive ? colors.accent : colors.text3} />
                      {isActive && <Icon name="check" size={12} color={colors.accent} />}
                    </div>
                    <div style={{ fontSize: '11.5px', color: isActive ? colors.text : colors.text3, fontWeight: 600 }}>{metric.name}</div>
                  </div>
                )
              })}
            </div>
            {!hasOrgMetrics && (
              <EmptyState padding="0">
                <EmptyIconWrap variant="teal" size={52} borderRadius={13}>
                  <Icon name="chart" size={22} color="#00d4aa" />
                </EmptyIconWrap>
                <EmptyTitle style={{ fontSize: 14 }}>Define your scoring vectors</EmptyTitle>
                <EmptyDesc style={{ fontSize: 12, marginBottom: 14 }}>
                  Choose which performance dimensions the AI evaluates. These become the foundation of every score.
                </EmptyDesc>
                <EmptyBtn variant="ghost" href="/organization?tab=metrics">
                  <Icon name="plus" size={14} color={colors.accent} />
                  Add Metrics
                </EmptyBtn>
              </EmptyState>
            )}
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Recent Reports */}
          <Card
            title="Recent Reports"
            icon="reports"
            action={recentReports.length > 0 ? <Link href={`/reports?${searchParams.toString()}`} style={{ fontSize: '12px', color: colors.accent, fontWeight: 500, textDecoration: 'none' }}>View All</Link> : undefined}
          >
            {recentReports.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentReports.map((report: any, i: number) => (
                  <RecentReportItem 
                    key={i} 
                    {...report} 
                    id={report.id} 
                    isLast={i === recentReports.length - 1} 
                  />
                ))}
              </div>
            ) : (
              <div style={{ padding: '16px 20px 20px' }}>
                <DashedEmpty
                  icon={<Icon name="reports" size={22} color={colors.text3} />}
                  title="No reports yet"
                  desc="Recent activity from your team will appear here once they start submitting reports."
                >
                  <EmptyBtn variant="primary" href="/employees">
                    <Icon name="users" size={14} color="#fff" />
                    Remind Team to Submit
                  </EmptyBtn>
                </DashedEmpty>
              </div>
            )}
          </Card>

        </div>
      </div>

      <SectionLabel>Goal Alignment & Projects</SectionLabel>

      {/* ── Goal Alignment & Projects Row ────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Goal Alignment */}
        <Card
          title="Goal Alignment"
          icon="target"
          chip={<Chip>{hasGoals ? 'Quality distribution' : `0 goals`}</Chip>}
          action={hasGoals ? <span style={{ fontSize: '12px', color: colors.accent, fontWeight: 500, cursor: 'pointer' }}>See All</span> : undefined}
        >
          {hasGoals ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {goals.map((goal: any, i: number) => {
                const scoreColor = goal.score >= 7.5 ? colors.green : goal.score >= 6.0 ? colors.warn : colors.danger
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontFamily: typography.fonts.display, fontSize: '12.5px', fontWeight: 500, color: colors.text }}>{goal.name}</span>
                      <span style={{ fontFamily: typography.fonts.numeric, fontSize: '12px', color: scoreColor, fontWeight: typography.weight.black, fontVariantNumeric: 'tabular-nums lining-nums' }}>
                        {typeof goal.score === 'number' && !isNaN(goal.score) ? goal.score.toFixed(1) : '—'}
                      </span>
                    </div>
                    <div style={{ height: '6px', background: colors.surface3, borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '3px',
                        width: `${goal.score * 10}%`,
                        background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}80)`
                      }} />
                    </div>
                    <div style={{ fontFamily: typography.fonts.display, fontSize: '11px', color: colors.text3, marginTop: '4px' }}>
                      {goal.owner} · <span style={{ fontFamily: typography.fonts.numeric, fontWeight: typography.weight.heavy, fontVariantNumeric: 'tabular-nums lining-nums' }}>{goal.reports}</span> reports submitted
                      {goal.overdue && <span style={{ color: colors.danger }}> · Report overdue</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState padding="40px 24px">
              <EmptyIconWrap variant="blue">
                <Icon name="target" size={26} color={colors.accent} />
              </EmptyIconWrap>
              <EmptyTitle>No goals defined</EmptyTitle>
              <EmptyDesc>Goals give the AI evaluation context. Without them, reports can't be scored against your team's objectives.</EmptyDesc>
              <EmptyActions>
                <EmptyBtn variant="primary" href="/goals?new=true">
                  <Icon name="plus" size={14} color="#fff" />
                  Create Goal
                </EmptyBtn>
              </EmptyActions>
              <EmptyHint>Goals can be assigned to specific employees or the whole team</EmptyHint>
            </EmptyState>
          )}
        </Card>

        {/* Ongoing Projects */}
        <Card
          title="Ongoing Projects"
          icon="projects"
          action={hasProjects ? <span style={{ fontSize: '12px', color: colors.accent, fontWeight: 500, cursor: 'pointer' }}>View All</span> : undefined}
        >
          {hasProjects ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {uiProjects.map((proj: any, i: number) => (
                <SlimProjectCard key={i} {...proj} />
              ))}
            </div>
          ) : (
            <div style={{ padding: '0px' }}>
              <DashedEmpty
                icon={<Icon name="projects" size={22} color={colors.text3} />}
                title="No projects yet"
                desc="Projects group your team's goals and reports. Create your first one to get started."
              >
                <EmptyBtn variant="primary" href="/projects">
                  <Icon name="plus" size={14} color="#fff" />
                  Create Project
                </EmptyBtn>
              </DashedEmpty>
            </div>
          )}
        </Card>
      </div>

      <ApproveLeaveModal 
        isOpen={leaveModalData.isOpen}
        onClose={() => setLeaveModalData({ ...leaveModalData, isOpen: false })}
        employeeId={leaveModalData.empId}
        employeeName={leaveModalData.empName}
      />
      <div style={{ height: '32px' }} />
    </div>
  )
}