'use client'

import { colors, radius, typography, animation, layout, shadows, getAvatarGradient, getInitials, getScoreColor } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { StatusPill } from '@/components/atoms/StatusPill'
import { ScoreDisplay, MiniBar } from '@/components/atoms/Score'
import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Report } from '@/types'

interface ReportsViewProps {
  initialReports: any[]
  role?: 'manager' | 'employee'
  kpiData: {
    totalReports: number
    avgScore: number
    pendingReview: number
    overrides: number
  }
}

export function ReportsView({ initialReports, kpiData, role = 'manager' }: ReportsViewProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [scoreFilter, setScoreFilter] = useState('all')

  const filteredReports = useMemo(() => {
    return initialReports.filter(report => {
      const employeeName = report.employees?.name || 'Unknown'
      const goalName = report.goals?.name || 'Unknown'
      const projectName = report.goals?.projects?.name || 'Unknown'

      const matchesSearch = employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        projectName.toLowerCase().includes(searchQuery.toLowerCase())

      const status = report.reviewedBy ? 'reviewed' : (report.evaluationScore !== null ? 'scored' : 'pending')
      const matchesStatus = statusFilter === 'all' || status === statusFilter

      const effectiveScore = report.managerOverallScore ?? report.evaluationScore
      let matchesScore = true
      if (scoreFilter === 'high') matchesScore = !!effectiveScore && effectiveScore >= 7.5
      if (scoreFilter === 'mid') matchesScore = !!effectiveScore && effectiveScore >= 6 && effectiveScore < 7.5
      if (scoreFilter === 'low') matchesScore = !!effectiveScore && effectiveScore < 6

      return matchesSearch && matchesStatus && matchesScore
    })
  }, [searchQuery, statusFilter, scoreFilter, initialReports])

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
          </select>

          <select
            style={{ background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: '7px 12px', color: colors.text2, fontSize: '12.5px', outline: 'none', cursor: 'pointer', fontFamily: typography.fonts.body }}
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
          >
            <option value="all">All Scores</option>
            <option value="high">On Track (7.5+)</option>
            <option value="mid">Needs Review (6-7.4)</option>
            <option value="low">At Risk (&lt;6)</option>
          </select>
        </div>

        {/* Right: Count & View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="font-numeric" style={{ fontSize: '12.5px', color: colors.text3, fontWeight: 500 }}>
            {filteredReports.length} reports
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
      {viewMode === 'table' ? (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.xl, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}`, background: 'rgba(255,255,255,0.02)' }}>
                {role === 'manager' && <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Employee</th>}
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Goal</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Project</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score</th>
                <th style={{ padding: '10px 20px', textAlign: 'right', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(report => {
                const employeeName = report.employees?.name || 'Unknown'
                const goalName = report.goals?.name || 'Unknown'
                const projectName = report.goals?.projects?.name || 'Unknown'
                const score = report.managerOverallScore ?? report.evaluationScore
                const status = report.reviewedBy ? 'reviewed' : (report.evaluationScore !== null ? 'scored' : 'pending')

                return (
                  <tr
                    key={report.id}
                    onClick={() => router.push(role === 'manager' ? `/reports/${report.id}` : `/my-reports/${report.id}`)}
                    style={{
                      borderBottom: `1px solid ${colors.border}`,
                      cursor: 'pointer',
                      transition: `background ${animation.fast}`,
                      background: (score || 10) < 6 ? 'rgba(240,68,56,0.02)' : 'transparent'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = (score || 10) < 6 ? 'rgba(240,68,56,0.04)' : colors.surface2}
                    onMouseLeave={(e) => e.currentTarget.style.background = (score || 10) < 6 ? 'rgba(240,68,56,0.02)' : 'transparent'}
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
                      <Button variant="secondary" size="sm">
                        {role === 'manager' ? 'Review' : 'View'} <Icon name="chevronRight" size={10} style={{ marginLeft: '4px' }} />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
          {filteredReports.map(report => {
            const employeeName = report.employees?.name || 'Unknown'
            const goalName = report.goals?.name || 'Unknown'
            const projectName = report.goals?.projects?.name || 'Unknown'
            const score = report.managerOverallScore ?? report.evaluationScore
            const status = report.reviewedBy ? 'reviewed' : (report.evaluationScore !== null ? 'scored' : 'pending')

            return (
              <div
                key={report.id}
                onClick={() => router.push(role === 'manager' ? `/reports/${report.id}` : `/my-reports/${report.id}`)}
                style={{
                  background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.xl, padding: '18px',
                  cursor: 'pointer', transition: `all ${animation.base}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.borderHover
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border
                  e.currentTarget.style.transform = 'translateY(0)'
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
                  <div style={{ fontSize: '11px', color: colors.text3 }}>
                    {new Date(report.submissionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
