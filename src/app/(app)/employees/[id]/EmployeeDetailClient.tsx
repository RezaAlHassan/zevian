'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { colors, animation, shadows, radius, typography } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { ScoreDisplay, ScoreBar, MiniBar } from '@/components/atoms/Score'
import { StatusPill } from '@/components/atoms/StatusPill'
import { DateRangeSelector } from '@/components/molecules/DateRangeSelector'
import { EmployeeDashboardView } from '@/components/organisms/EmployeeDashboardView'
import { calculateReportStatus, isLateSubmission } from '@/lib/utils/reportStatus'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'

const ApproveLeaveModal = dynamic(
  () => import('@/components/organisms/ApproveLeaveModal').then(m => ({ default: m.ApproveLeaveModal })),
  { ssr: false }
)

interface Props {
  pageData: any
  id: string
  startDate: string | undefined
  endDate: string | undefined
  selectedGoalId: string | null
}

export function EmployeeDetailClient({ pageData, id, startDate, endDate, selectedGoalId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'reports' | 'activity'>('overview')
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)

  const { dashboardData, allGoals, allReports, allActivity, trustSignal } = pageData
  const employee = dashboardData.me
  const [reportSearch, setReportSearch] = useState('')
  const [reportStatusFilter, setReportStatusFilter] = useState('all')

  const filteredReports = useMemo(() => {
    return allReports.filter((r: any) => {
      const goalName = r.goals?.name || ''
      const projectName = r.goals?.projects?.name || ''
      const matchesSearch = !reportSearch ||
        goalName.toLowerCase().includes(reportSearch.toLowerCase()) ||
        projectName.toLowerCase().includes(reportSearch.toLowerCase())
      if (!matchesSearch) return false
      if (reportStatusFilter === 'all') return true
      if (reportStatusFilter === 'late') return isLateSubmission(r)
      if (r.isOnLeave) return reportStatusFilter === 'on-leave'
      return calculateReportStatus(r) === reportStatusFilter
    })
  }, [allReports, reportSearch, reportStatusFilter])

  return (
    <div className="fade-in" style={{ background: colors.bg, minHeight: '100vh', animation: animation.keyframes.fadeUp }}>
      {/* Sticky Header */}
      <header style={{
        position: 'sticky', top: 0, height: '56px',
        background: 'rgba(10,12,16,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex', alignItems: 'center', padding: '0 24px', gap: '10px', zIndex: 90,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: colors.text3 }}>
          <Link href="/employees" style={{ color: colors.text2, textDecoration: 'none' }}>Employees</Link>
          <span style={{ color: colors.text3 }}>/</span>
          <span style={{ color: colors.text, fontWeight: 500 }}>{employee.name}</span>
          {trustSignal?.label && (() => {
            const bgMap: Record<string, string> = { green: 'rgba(34,197,94,0.12)', amber: 'rgba(245,158,11,0.12)', neutral: 'rgba(255,255,255,0.06)' }
            const textMap: Record<string, string> = { green: colors.green, amber: colors.warn, neutral: colors.text3 }
            const tooltip = `Based on ${trustSignal.total} reviewed reports. Adjustments: ${trustSignal.downs} down · ${trustSignal.ups} up · ${trustSignal.agrees} agreed.`
            return (
              <span title={tooltip} style={{
                padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                background: bgMap[trustSignal.color ?? 'neutral'],
                color: textMap[trustSignal.color ?? 'neutral'],
                letterSpacing: '0.03em', cursor: 'default',
              }}>
                {trustSignal.label}
              </span>
            )
          })()}
        </div>
        <div style={{ flex: 1 }} />
        {pageData.permissions?.canApproveLeave && (
          <Button variant="secondary" onClick={() => setIsLeaveModalOpen(true)}>Approve Leave</Button>
        )}
        {pageData.dashboardData?.goals?.length > 0 && (
          <select
            value={selectedGoalId ?? ''}
            onChange={e => {
              const params = new URLSearchParams(searchParams.toString())
              const nextGoalId = e.target.value || null
              if (nextGoalId) params.set('goal', nextGoalId)
              else params.delete('goal')
              router.push(`?${params.toString()}`)
            }}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px', color: selectedGoalId ? colors.accent : colors.text3,
              fontSize: '12px', fontWeight: 600, padding: '5px 28px 5px 10px',
              cursor: 'pointer', outline: 'none', appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
            }}
          >
            <option value="">All Scorecards</option>
            {pageData.dashboardData.goals.filter((g: any) => g.status === 'active').map((g: any) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        )}
        <DateRangeSelector
          startDate={startDate}
          endDate={endDate}
          onRangeChange={(start, end) => {
            const params = new URLSearchParams(searchParams.toString())
            if (start && end) { params.set('start', start); params.set('end', end) }
            else { params.delete('start'); params.delete('end') }
            router.push(`?${params.toString()}`)
          }}
        />
      </header>

      <div style={{ padding: '24px 28px 60px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ display: 'flex', gap: '32px', borderBottom: `1px solid ${colors.border}` }}>
            {([
              { id: 'overview', label: 'Overview', icon: 'chart' },
              { id: 'goals', label: 'Scorecards', icon: 'target' },
              { id: 'reports', label: 'Reports', icon: 'fileText' },
              { id: 'activity', label: 'Activity', icon: 'clock' },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                paddingBottom: '12px', fontSize: '13px',
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? colors.accent : colors.text3,
                border: 'none', background: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? colors.accent : 'transparent'}`,
                cursor: 'pointer', transition: `all ${animation.fast}`, marginBottom: '-1px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <Icon name={tab.icon as any} size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ minHeight: '400px' }}>
            {activeTab === 'overview' && (
              <EmployeeDashboardView
                data={dashboardData}
                showDateSelector={false}
                allReports={allReports}
                selectedGoalId={selectedGoalId}
                onGoalChange={(goalId) => {
                  const params = new URLSearchParams(searchParams.toString())
                  if (goalId) params.set('goal', goalId)
                  else params.delete('goal')
                  router.push(`?${params.toString()}`)
                }}
                orgMetricNames={(pageData.organization?.customMetrics || []).map((m: any) => m.name)}
                viewMode="detail"
                employeeId={id}
                employeeName={employee.name}
              />
            )}

            {activeTab === 'goals' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                {allGoals.map((goal: any, i: number) => (
                  <div key={i} className="goal-card" style={{
                    background: colors.surface, border: `1px solid ${colors.border}`,
                    borderRadius: radius.xl, padding: '24px', transition: `all ${animation.fast}`, cursor: 'pointer',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: colors.text, marginBottom: '4px' }}>{goal.name}</div>
                        <div style={{ fontSize: '12px', color: colors.text3 }}>{goal.project?.name || 'No Project'}</div>
                      </div>
                      <StatusPill status={goal.status} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '10px', color: colors.text3, textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Progress</span>
                          <span>{goal.avgScore || 0}%</span>
                        </div>
                        <ScoreBar score={goal.avgScore || 0} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reports' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Control bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.md, width: '240px' }}>
                    <Icon name="search" size={14} color={colors.text3} />
                    <input
                      placeholder="Search by goal or project..."
                      value={reportSearch}
                      onChange={e => setReportSearch(e.target.value)}
                      style={{ background: 'none', border: 'none', outline: 'none', color: colors.text, fontSize: '13px', width: '100%', fontFamily: typography.fonts.body }}
                    />
                  </div>
                  <select
                    value={reportStatusFilter}
                    onChange={e => setReportStatusFilter(e.target.value)}
                    style={{ background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: '7px 12px', color: colors.text2, fontSize: '12.5px', outline: 'none', cursor: 'pointer', fontFamily: typography.fonts.body }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="scored">Scored</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="late">Late</option>
                    <option value="on-leave">On Leave</option>
                  </select>
                  <div className="font-numeric" style={{ marginLeft: 'auto', fontSize: '12.5px', color: colors.text3, fontWeight: 500 }}>
                    {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Table */}
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.xl, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${colors.border}`, background: 'rgba(255,255,255,0.02)' }}>
                        <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Goal</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Project</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score</th>
                        <th style={{ padding: '10px 20px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.map((report: any, i: number) => {
                        const goalName = report.goals?.name || 'Report'
                        const projectName = report.goals?.projects?.name || '—'
                        const score = report.managerOverallScore ?? report.evaluationScore
                        const status = report.isOnLeave ? 'on-leave' : calculateReportStatus(report)
                        const isLate = isLateSubmission(report)
                        const dateStr = report.submittedForDate || report.submissionDate
                        const dateDisplay = new Date(typeof dateStr === 'string' && !dateStr.includes('T') ? `${dateStr}T12:00:00` : dateStr)
                          .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

                        return (
                          <tr
                            key={report.id || i}
                            onClick={() => !report.isOnLeave && router.push(`/reports/${report.id}`)}
                            style={{
                              borderBottom: i === filteredReports.length - 1 ? 'none' : `1px solid ${colors.border}`,
                              cursor: report.isOnLeave ? 'default' : 'pointer',
                              transition: `background ${animation.fast}`,
                              background: (score || 10) < 6 && !report.isOnLeave ? 'rgba(240,68,56,0.02)' : 'transparent',
                              opacity: report.isOnLeave ? 0.7 : 1,
                            }}
                            onMouseEnter={e => { if (!report.isOnLeave) e.currentTarget.style.background = (score || 10) < 6 ? 'rgba(240,68,56,0.04)' : colors.surface2 }}
                            onMouseLeave={e => { if (!report.isOnLeave) e.currentTarget.style.background = (score || 10) < 6 ? 'rgba(240,68,56,0.02)' : 'transparent' }}
                          >
                            <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 500, color: colors.text2 }}>{goalName}</td>
                            <td style={{ padding: '14px 14px' }}>
                              <span style={{ padding: '3px 8px', background: colors.surface3, borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: colors.text2 }}>{projectName}</span>
                            </td>
                            <td style={{ padding: '14px 14px' }}>
                              <div style={{ fontSize: '12.5px', color: colors.text, fontWeight: 500 }}>{dateDisplay}</div>
                              {isLate && (
                                <div style={{ fontSize: '11px', color: colors.warn, marginTop: '2px' }}>Late submission</div>
                              )}
                            </td>
                            <td style={{ padding: '14px 14px' }}>
                              <StatusPill status={status as any} score={score} />
                            </td>
                            <td style={{ padding: '14px 14px' }}>
                              {score !== null && score !== undefined ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <ScoreDisplay score={score} size="sm" showBar={false} />
                                  <div style={{ width: '60px' }}>
                                    <MiniBar score={score ?? 0} />
                                  </div>
                                  {report.managerOverallScore !== null && report.managerOverallScore !== undefined && (
                                    <Icon name="edit" size={10} color={colors.accent} />
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: colors.text3, fontSize: '13px' }}>—</span>
                              )}
                            </td>
                            <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                              {!report.isOnLeave && (
                                <Button variant="secondary" size="sm" onClick={e => { e.stopPropagation(); router.push(`/reports/${report.id}`) }}>
                                  Review <Icon name="chevronRight" size={10} style={{ marginLeft: '4px' }} />
                                </Button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                      {filteredReports.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: colors.text3, fontSize: '13px' }}>
                            No reports found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {allActivity.map((act: any, i: number) => {
                  const type = act.type || 'alert'
                  const iconMap: any = {
                    report: { name: 'fileText', color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
                    goal: { name: 'target', color: colors.accent, bg: colors.accentGlow },
                    leave: { name: 'calendar', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                    alert: { name: 'bell', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
                    info: { name: 'bell', color: colors.text3, bg: colors.border },
                  }
                  const icon = iconMap[type] || iconMap.info
                  return (
                    <div key={i} style={{
                      background: colors.surface, border: `1px solid ${colors.border}`,
                      borderRadius: radius.lg, padding: '16px 20px',
                      display: 'flex', alignItems: 'center', gap: '16px', transition: 'transform 0.2s',
                    }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: icon.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={icon.name} size={18} color={icon.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>{act.title}</div>
                        <div style={{ fontSize: '13px', color: colors.text2 }}>{act.message}</div>
                      </div>
                      <div style={{ fontSize: '11px', color: colors.text3, fontWeight: 500, textAlign: 'right' }}>
                        <div>{new Date(act.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        <div style={{ marginTop: '2px', opacity: 0.8 }}>{new Date(act.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  )
                })}
                {allActivity.length === 0 && (
                  <div style={{ padding: '40px', textAlign: 'center', color: colors.text3 }}>No recent activity</div>
                )}
              </div>
            )}
          </div>
        </div>

        <ApproveLeaveModal
          isOpen={isLeaveModalOpen}
          onClose={() => setIsLeaveModalOpen(false)}
          employeeId={id}
          employeeName={employee.name}
        />

        <style jsx>{`
          .fade-in { animation: fadeIn 0.5s ease both; }
          .goal-card:hover { transform: translateY(-2px); border-color: ${colors.accent} !important; box-shadow: ${shadows.cardHover}; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    </div>
  )
}
