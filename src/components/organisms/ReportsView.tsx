'use client'

import { colors, radius, typography, animation, layout, shadows, getAvatarGradient, getInitials, getScoreColor } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { StatusPill } from '@/components/atoms/StatusPill'
import { ScoreDisplay, MiniBar } from '@/components/atoms/Score'
import { DateRangeSelector } from '@/components/molecules/DateRangeSelector'
import React, { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ApproveLeaveModal } from '@/components/organisms/ApproveLeaveModal'
import type { Report } from '@/types'
import { calculateReportStatus, isLateSubmission } from '@/lib/utils/reportStatus'

interface ReportsViewProps {
  initialReports: any[]
  role?: 'manager' | 'employee'
  initialSearch?: string
  periods?: any[]
  allowLateSubmissions?: boolean
  kpiData: {
    totalReports: number
    avgScore: number
    pendingReview: number
    overrides: number
  }
}

export function ReportsView({ initialReports, kpiData, role = 'manager', initialSearch = '', periods = [], allowLateSubmissions = true }: ReportsViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const view = searchParams.get('view') || 'org'
  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'due' | 'score'>('due')
  const [leaveModalData, setLeaveModalData] = useState<{ isOpen: boolean; empId: string; empName: string }>({
    isOpen: false,
    empId: '',
    empName: '',
  })

  const isPeriodFilter = statusFilter === 'missed'

  const filteredPeriods = useMemo(() => {
    if (!isPeriodFilter) return []
    return periods.filter((p: any) => p.isMissed).filter((p: any) => {
      if (!searchQuery) return true
      const employeeName = p.employeeName || p.employees?.name || ''
      const goalName = p.goals?.name || ''
      const projectName = p.goals?.projects?.name || ''
      return employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        projectName.toLowerCase().includes(searchQuery.toLowerCase())
    })
  }, [isPeriodFilter, periods, statusFilter, searchQuery])

  const filteredAndSortedReports = useMemo(() => {
    if (isPeriodFilter) return []
    let result = initialReports.filter(report => {
      const employeeName = report.employees?.name || 'Unknown'
      const goalName = report.goals?.name || 'Unknown'
      const projectName = report.goals?.projects?.name || 'Unknown'

      const matchesSearch = employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        projectName.toLowerCase().includes(searchQuery.toLowerCase())

      let matchesStatus: boolean
      if (statusFilter === 'late') {
        matchesStatus = isLateSubmission(report)
      } else {
        const status = calculateReportStatus(report)
        matchesStatus = statusFilter === 'all' || status === statusFilter
      }

      return matchesSearch && matchesStatus
    })

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'score') {
        const scoreA = a.managerOverallScore ?? a.evaluationScore ?? 0
        const scoreB = b.managerOverallScore ?? b.evaluationScore ?? 0
        return scoreB - scoreA
      } else {
        // Default: Sort by date (Submission date/Due date)
        return new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()
      }
    })

    return result
  }, [searchQuery, statusFilter, sortBy, initialReports])

  useEffect(() => { setPage(1) }, [searchQuery, statusFilter, sortBy])

  const totalFilteredCount = isPeriodFilter ? filteredPeriods.length : filteredAndSortedReports.length

  const pagedReports = filteredAndSortedReports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const kpis = [
    { label: role === 'manager' ? 'Total Reports' : 'My Reports', value: kpiData.totalReports.toString(), icon: 'fileText' as const, sub: role === 'manager' ? 'Direct reports total' : 'All your submissions', color: colors.accent },
    { label: 'Avg AI Score', value: kpiData.avgScore.toString(), icon: 'star' as const, sub: role === 'manager' ? 'Team performance' : 'Your performance trend', color: colors.green },
    { label: 'Pending Review', value: kpiData.pendingReview.toString(), icon: 'clock' as const, sub: role === 'manager' ? 'Awaiting your review' : 'Awaiting manager feedback', color: colors.warn },
    { label: 'Overrides', value: kpiData.overrides.toString(), icon: 'edit' as const, sub: role === 'manager' ? 'Manual adjustments' : 'Managed adjustments', color: colors.text3 },
  ]

  return (
    <div style={{ padding: layout.contentPadding }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {kpis.map(kpi => (
          <div key={kpi.label} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.xl, padding: '16px 18px', transition: `all ${animation.base}` }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon name={kpi.icon} size={12} color={colors.text3} />
              {kpi.label}
            </div>
            <div className="font-numeric" style={{ fontSize: '28px', fontWeight: 700, color: kpi.color, letterSpacing: '-1px', lineHeight: 1, marginBottom: '6px' }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: '11.5px', color: colors.text3 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '24px' }}>
        {/* Left: Search & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.md, width: '240px' }}>
            <Icon name="search" size={14} color={colors.text3} />
            <input
              placeholder="Search reports..."
              style={{ background: 'none', border: 'none', outline: 'none', color: colors.text, fontSize: '13px', width: '100%', fontFamily: typography.fonts.body }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            style={{ background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: '7px 12px', color: colors.text2, fontSize: '12.5px', outline: 'none', cursor: 'pointer', fontFamily: typography.fonts.body }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="scored">AI Scored</option>
            <option value="reviewed">Reviewed</option>
            <option value="late">Late</option>
            <option value="missed">Missed</option>
          </select>

          <div style={{ width: '1px', height: '24px', background: colors.border, margin: '0 4px' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase' }}>Sort:</span>
            <select
              style={{ background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: '7px 12px', color: colors.text2, fontSize: '12.5px', outline: 'none', cursor: 'pointer', fontFamily: typography.fonts.body }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="due">Most Recent</option>
              <option value="score">Avg Score (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Right: Count & View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <DateRangeSelector 
            startDate={searchParams.get('start') || undefined}
            endDate={searchParams.get('end') || undefined}
            onRangeChange={(start, end) => {
              const params = new URLSearchParams(searchParams.toString());
              if (start && end) {
                params.set('start', start);
                params.set('end', end);
              } else {
                params.delete('start');
                params.delete('end');
              }
              router.push(`?${params.toString()}`);
            }}
          />

          <div className="font-numeric" style={{ fontSize: '12.5px', color: colors.text3, fontWeight: 500 }}>
            {totalFilteredCount} {isPeriodFilter ? 'periods' : 'reports'}
          </div>

          <div style={{ display: 'flex', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: '2px', gap: '2px' }}>
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: viewMode === 'grid' ? colors.surface2 : 'transparent',
                color: viewMode === 'grid' ? colors.accent : colors.text3,
                border: 'none',
                transition: `all ${animation.fast}`
              }}
            >
              <Icon name="layoutGrid" size={14} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: viewMode === 'table' ? colors.surface2 : 'transparent',
                color: viewMode === 'table' ? colors.accent : colors.text3,
                border: 'none',
                transition: `all ${animation.fast}`
              }}
            >
              <Icon name="list" size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isPeriodFilter ? (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.xl, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}`, background: 'rgba(255,255,255,0.02)' }}>
                {role === 'manager' && <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Employee</th>}
                <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Goal</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Project</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Due Date</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Frequency</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                {role === 'manager' && (
                  <th style={{ padding: '10px 20px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredPeriods.length === 0 ? (
                <tr>
                  <td colSpan={role === 'manager' ? 6 : 5} style={{ padding: '40px 20px', textAlign: 'center', color: colors.text3, fontSize: '13px' }}>
                    No {statusFilter} periods found
                  </td>
                </tr>
              ) : filteredPeriods.map((period: any) => {
                const goalName = period.goals?.name || 'Unknown'
                const projectName = period.goals?.projects?.name || 'Unknown'
                const employeeName = period.employeeName || period.employees?.name || 'Unknown'
                const freq = period.goals?.projects?.report_frequency || 'weekly'
                const freqLabel = ({ daily: 'Daily', weekly: 'Weekly', biweekly: 'Biweekly', 'bi-weekly': 'Biweekly', monthly: 'Monthly' } as any)[freq] || 'Weekly'
                const dueRaw = period.dueDate || period.period_end
                const dueDate = new Date(typeof dueRaw === 'string' && !dueRaw.includes('T') ? `${dueRaw}T12:00:00` : dueRaw)
                const daysAgo = Math.round((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <tr key={period.id} style={{ borderBottom: `1px solid ${colors.border}`, background: 'rgba(120,30,30,0.06)', fontStyle: 'italic', opacity: 0.92 }}>
                    {role === 'manager' && (
                      <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 500, color: colors.text2 }}>{employeeName}</td>
                    )}
                    <td style={{ padding: '14px 20px', fontSize: '13px', fontWeight: 500, color: colors.text2 }}>{goalName}</td>
                    <td style={{ padding: '14px 14px' }}>
                      <span style={{ padding: '3px 8px', background: colors.surface3, borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: colors.text2 }}>{projectName}</span>
                    </td>
                    <td style={{ padding: '14px 14px' }}>
                      <div style={{ fontSize: '12.5px', color: colors.danger, fontWeight: 600 }}>
                        {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '11px', color: colors.text3, marginTop: '2px' }}>
                        {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                      </div>
                    </td>
                    <td style={{ padding: '14px 14px' }}>
                      <span style={{ fontSize: '11.5px', color: colors.text3, fontWeight: 600 }}>{freqLabel}</span>
                    </td>
                    <td style={{ padding: '14px 14px' }}>
                      <StatusPill status="missed" />
                    </td>
                    {role === 'manager' && (
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setLeaveModalData({ isOpen: true, empId: period.employeeId, empName: employeeName })}
                        >
                          Approve Leave
                        </Button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : viewMode === 'table' ? (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.xl, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}`, background: 'rgba(255,255,255,0.02)' }}>
                {role === 'manager' && <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Employee</th>}
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Goal</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Project</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score</th>
                <th style={{ padding: '10px 20px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedReports.map(report => {
                const employeeName = report.employees?.name || 'Unknown'
                const goalName = report.goals?.name || 'Unknown'
                const projectName = report.goals?.projects?.name || 'Unknown'
                const score = report.managerOverallScore ?? report.evaluationScore
                const status = calculateReportStatus(report)

                return (
                  <tr
                    key={report.id}
                    onClick={() => report.isOnLeave ? null : router.push(role === 'manager' ? `/reports/${report.id}?${searchParams.toString()}` : `/my-reports/${report.id}?${searchParams.toString()}`)}
                    style={{
                      borderBottom: `1px solid ${colors.border}`,
                      cursor: report.isOnLeave ? 'default' : 'pointer',
                      transition: `background ${animation.fast}`,
                      background: (score || 10) < 6 ? 'rgba(240,68,56,0.02)' : 'transparent'
                    }}
                    onMouseEnter={(e) => { if (!report.isOnLeave) e.currentTarget.style.background = (score || 10) < 6 ? 'rgba(240,68,56,0.04)' : colors.surface2; }}
                    onMouseLeave={(e) => { if (!report.isOnLeave) e.currentTarget.style.background = (score || 10) < 6 ? 'rgba(240,68,56,0.02)' : 'transparent'; }}
                  >
                    {role === 'manager' && (
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: getAvatarGradient(employeeName), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff' }}>
                            {getInitials(employeeName)}
                          </div>
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: typography.weight.semibold, color: colors.text }}>{employeeName}</div>
                            <div style={{ fontSize: '11px', color: colors.text3 }}>{report.employees?.title || 'Team Member'}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    <td style={{ padding: '14px 14px', fontSize: '13px', fontWeight: 500, color: colors.text2 }}>{goalName}</td>
                    <td style={{ padding: '14px 14px' }}>
                      <span style={{ padding: '3px 8px', background: colors.surface3, borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: colors.text2 }}>{projectName}</span>
                    </td>
                    <td style={{ padding: '14px 14px' }}>
                      <div style={{ fontSize: '12.5px', color: colors.text, fontWeight: 500 }}>
                        {new Date(report.submittedForDate || report.submissionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '11px', color: colors.text3, marginTop: '2px' }}>
                        {report.submittedForDate && report.submittedForDate !== report.submissionDate?.slice(0, 10)
                          ? 'Late submission'
                          : new Date(report.submissionDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td style={{ padding: '14px 14px' }}>
                      <StatusPill status={status} score={score} />
                    </td>
                    <td style={{ padding: '14px 14px' }}>
                      {score !== null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <ScoreDisplay
                            score={score}
                            size="sm"
                            showBar={false}
                          />
                          <div style={{ width: '60px' }}>
                            <MiniBar score={score ?? 0} />
                          </div>
                          {report.managerOverallScore !== null && (
                            <Icon name="edit" size={10} color={colors.accent} />
                          )}
                        </div>
                      ) : (
                        <span style={{ color: colors.text3, fontSize: '13px' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      {!report.isOnLeave && (
                          <Button variant="secondary" size="sm">
                            {role === 'manager' ? 'Review' : 'View'} <Icon name="chevronRight" size={10} style={{ marginLeft: '4px' }} />
                          </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredAndSortedReports.length > PAGE_SIZE && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: `1px solid ${colors.border}` }}>
              <span style={{ fontSize: '12.5px', color: colors.text3 }}>
                Showing <span style={{ fontWeight: 700, color: colors.text2 }}>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredAndSortedReports.length)}</span> of <span style={{ fontWeight: 700, color: colors.text2 }}>{filteredAndSortedReports.length}</span>
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={{ padding: '6px 14px', borderRadius: radius.md, border: `1px solid ${colors.border}`, background: colors.surface2, color: colors.text, fontSize: '12.5px', fontWeight: 600, cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page * PAGE_SIZE >= filteredAndSortedReports.length} style={{ padding: '6px 14px', borderRadius: radius.md, border: `1px solid ${colors.border}`, background: colors.surface2, color: colors.text, fontSize: '12.5px', fontWeight: 600, cursor: page * PAGE_SIZE >= filteredAndSortedReports.length ? 'default' : 'pointer', opacity: page * PAGE_SIZE >= filteredAndSortedReports.length ? 0.4 : 1 }}>Next →</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
          {filteredAndSortedReports.map(report => {
            const employeeName = report.employees?.name || 'Unknown'
            const goalName = report.goals?.name || 'Unknown'
            const projectName = report.goals?.projects?.name || 'Unknown'
            const score = report.managerOverallScore ?? report.evaluationScore
            const status = calculateReportStatus(report)

            return (
              <div
                key={report.id}
                onClick={() => report.isOnLeave ? null : router.push(role === 'manager' ? `/reports/${report.id}?${searchParams.toString()}` : `/my-reports/${report.id}?${searchParams.toString()}`)}
                style={{
                  background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.xl, padding: '18px',
                  cursor: report.isOnLeave ? 'default' : 'pointer', transition: `all ${animation.base}`,
                  opacity: report.isOnLeave ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!report.isOnLeave) {
                      e.currentTarget.style.borderColor = colors.borderHover
                      e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!report.isOnLeave) {
                      e.currentTarget.style.borderColor = colors.border
                      e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  {role === 'manager' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: getAvatarGradient(employeeName), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                        {getInitials(employeeName)}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: colors.text }}>{employeeName}</div>
                        <div style={{ fontSize: '11px', color: colors.text3 }}>{report.employees?.title || 'Team Member'}</div>
                      </div>
                    </div>
                  )}
                  <StatusPill status={status} score={score} />
                </div>

                <div style={{ fontSize: '13.5px', fontWeight: 600, color: colors.text2, marginBottom: '6px' }}>{goalName}</div>
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ padding: '3px 8px', background: colors.surface3, borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: colors.text3 }}>{projectName}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  {score !== null ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                      <span style={{ fontFamily: typography.fonts.numeric, fontSize: '24px', fontWeight: 900, color: getScoreColor(score) }}>{(score).toFixed(1)}</span>
                      <span style={{ fontSize: '12px', color: colors.text3, fontWeight: 700 }}>/10</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '13px', color: colors.text3 }}>Not scored</span>
                  )}
                  <div style={{ fontSize: '11px', color: colors.text3, textAlign: 'right' }}>
                    <div>{new Date(report.submittedForDate || report.submissionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div style={{ opacity: 0.8 }}>
                      {report.submittedForDate && report.submittedForDate !== report.submissionDate?.slice(0, 10)
                        ? 'Late submission'
                        : new Date(report.submissionDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {role === 'manager' && (
        <ApproveLeaveModal
          isOpen={leaveModalData.isOpen}
          onClose={() => setLeaveModalData({ ...leaveModalData, isOpen: false })}
          employeeId={leaveModalData.empId}
          employeeName={leaveModalData.empName}
        />
      )}
    </div>
  )
}
