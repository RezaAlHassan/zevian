'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { colors, radius, typography, animation, layout, shadows, getAvatarGradient, getInitials } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { StatusPill } from '@/components/atoms/StatusPill'
import { ScoreDisplay } from '@/components/atoms/Score'
import { InviteModal } from '@/components/molecules'
import { ApproveLeaveModal } from '@/components/organisms/ApproveLeaveModal'

interface Employee {
    id: string
    name: string
    title: string
    role: 'manager' | 'employee'
    avatarUrl?: string
    managerId?: string | null
    managerName?: string | null
    joinDate?: string
    email: string
    avgScore: number
    trend: number
    reportCount: number
    goalCount: number
    lastReport: string
    organizationId?: string
}

interface EmployeesViewProps {
    employees: Employee[]
    effectiveView?: 'org' | 'direct'
}

export function EmployeesView({ employees: initialEmployees, effectiveView = 'org' }: EmployeesViewProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
    const [searchQuery, setSearchQuery] = useState('')
    const [perfFilter, setPerfFilter] = useState('')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>(
        searchParams.get('sort') === 'score-high' ? 'desc' : 'asc'
    )
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [leaveModalData, setLeaveModalData] = useState<{ isOpen: boolean; empId: string; empName: string }>({
        isOpen: false,
        empId: '',
        empName: ''
    })

    const PAGE_SIZE = 10
    const [page, setPage] = useState(1)

    const filteredEmployees = useMemo(() => {
        const filtered = initialEmployees.filter(emp => {
            if (emp.role === 'manager') return false
            const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (emp.title || '').toLowerCase().includes(searchQuery.toLowerCase())
            const matchesPerf = perfFilter ? (
                perfFilter === 'hi' ? emp.avgScore >= 7.5 :
                    perfFilter === 'mid' ? (emp.avgScore >= 6 && emp.avgScore < 7.5) :
                        emp.avgScore < 6
            ) : true
            return matchesSearch && matchesPerf
        })

        return [...filtered].sort((a, b) =>
            sortDir === 'desc' ? b.avgScore - a.avgScore : a.avgScore - b.avgScore
        )
    }, [initialEmployees, searchQuery, perfFilter, sortDir])

    useEffect(() => { setPage(1) }, [searchQuery, perfFilter, sortDir])

    const pagedEmployees = filteredEmployees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    const stats = useMemo(() => {
        const nonManagers = initialEmployees.filter(e => e.role !== 'manager')
        return {
            teamSize: nonManagers.length,
            avgScore: nonManagers.length ? (nonManagers.reduce((acc, curr) => acc + curr.avgScore, 0) / nonManagers.length).toFixed(1) : '0.0',
            onTrack: nonManagers.filter(e => e.avgScore >= 7.5).length,
            atRisk: nonManagers.filter(e => e.avgScore < 6.0).length,
            pending: nonManagers.filter(e => !e.lastReport || e.lastReport === 'Pending').length,
        }
    }, [initialEmployees])

    return (
        <div className="fade-in" style={{ padding: '28px 28px 60px' }}>
            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {[
                    { label: 'Team Size', value: stats.teamSize, meta: 'Active members', icon: 'users', color: colors.accent },
                    { label: 'Avg Score', value: stats.avgScore, meta: '+0.3 vs last week', icon: 'sparkles', color: colors.green },
                    { label: 'On Track', value: stats.onTrack, meta: 'Score ≥ 7.5', icon: 'check', color: colors.green },
                    { label: 'At Risk', value: stats.atRisk, meta: 'Requires action', icon: 'alert', color: colors.danger },
                    { label: 'Pending', value: stats.pending, meta: 'No report this week', icon: 'clock', color: colors.warn },
                ].map((kpi, i) => (
                    <div key={i} style={{
                        background: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.xl,
                        padding: '20px',
                        animation: `fadeUp 0.4s ease ${i * 0.05}s both`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <Icon name={kpi.icon as any} size={14} color={colors.text3} />
                            <span style={{ fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</span>
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: kpi.color, marginBottom: '4px', fontFamily: typography.fonts.numeric }}>{kpi.value}</div>
                        <div style={{ fontSize: '11.5px', color: colors.text3 }}>{kpi.meta}</div>
                    </div>
                ))}
            </div>

            {/* Standardized Control Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                padding: '0 4px'
            }}>
                {/* Left Side: Search & Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        position: 'relative',
                        width: '240px'
                    }}>
                        <Icon
                            name="search"
                            size={14}
                            color={colors.text3}
                            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                        />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px 10px 36px',
                                background: colors.surface,
                                border: `1px solid ${colors.border}`,
                                borderRadius: radius.lg,
                                fontSize: '13.5px',
                                color: colors.text,
                                outline: 'none',
                                transition: `all ${animation.fast}`
                            }}
                        />
                    </div>

                    <select
                        value={perfFilter}
                        onChange={(e) => setPerfFilter(e.target.value)}
                        style={selectStyle}
                    >
                        <option value="">All Performance</option>
                        <option value="hi">On Track (7.5+)</option>
                        <option value="mid">Needs Review (6-7.4)</option>
                        <option value="lo">At Risk (&lt;6)</option>
                    </select>

                    <button
                        onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                        style={{
                            padding: '8px 12px',
                            background: colors.surface2,
                            border: `1px solid ${colors.borderHover}`,
                            borderRadius: radius.lg,
                            fontSize: '12.5px',
                            fontWeight: 700,
                            color: colors.text,
                            cursor: 'pointer',
                            transition: `all ${animation.fast}`,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Score {sortDir === 'desc' ? '↓' : '↑'}
                    </button>

                    <Button variant="primary" size="sm" icon="plus" onClick={() => setShowInviteModal(true)}>Invite Member</Button>
                </div>

                {/* Right Side: Count & View Mode */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '12.5px', color: colors.text3, fontWeight: 500 }}>
                        <span className="font-numeric" style={{ fontWeight: 700, color: colors.text2 }}>{filteredEmployees.length}</span> members
                    </div>

                    <div style={{
                        display: 'flex',
                        background: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.lg,
                        padding: '3px',
                        gap: '2px'
                    }}>
                        <button
                            onClick={() => setViewMode('table')}
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
                                transition: `all ${animation.fast}`,
                            }}
                        >
                            <Icon name="list" size={14} />
                        </button>
                        <button
                            onClick={() => setViewMode('cards')}
                            style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '5px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                background: viewMode === 'cards' ? colors.surface2 : 'transparent',
                                color: viewMode === 'cards' ? colors.accent : colors.text3,
                                border: 'none',
                                transition: `all ${animation.fast}`,
                            }}
                        >
                            <Icon name="layoutGrid" size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content - Table View */}
            {viewMode === 'table' && (
                <div style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.xl,
                    overflow: 'hidden'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                                <th style={tableHeaderStyle}>Employee</th>
                                <th style={tableHeaderStyle}>Role</th>
                                {effectiveView === 'org' && <th style={tableHeaderStyle}>Reports To</th>}
                                <th style={tableHeaderStyle}>Avg Score</th>
                                <th style={tableHeaderStyle}>Goals</th>
                                <th style={tableHeaderStyle}>Last Report</th>
                                <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagedEmployees.map((emp, i) => (
                                <tr
                                    key={emp.id}
                                    onClick={() => router.push(`/employees/${emp.id}`)}
                                    style={{
                                        borderBottom: i === pagedEmployees.length - 1 ? 'none' : `1px solid ${colors.border}`,
                                        cursor: 'pointer',
                                        transition: `background ${animation.fast}`
                                    }}
                                    className="table-row-hover"
                                >
                                    <td style={{ padding: '14px 20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '10px',
                                                background: getAvatarGradient(emp.name),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                color: '#fff',
                                                position: 'relative'
                                            }}>
                                                {getInitials(emp.name)}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '13.5px', fontWeight: 600, color: colors.text }}>{emp.name}</div>
                                                <div style={{ fontSize: '11px', color: colors.text3 }}>{emp.title}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px' }}>
                                        <div style={{
                                            padding: '2px 8px',
                                            borderRadius: '5px',
                                            fontSize: '10.5px',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.04em',
                                            display: 'inline-block',
                                            background: emp.role === 'manager' ? colors.accentGlow : colors.surface3,
                                            color: emp.role === 'manager' ? colors.accent : colors.text3
                                        }}>
                                            {emp.role}
                                        </div>
                                    </td>
                                    {effectiveView === 'org' && (
                                        <td style={{ padding: '14px', fontSize: '12.5px', color: colors.text2 }}>
                                            {emp.managerName || <span style={{ color: colors.text3 }}>--</span>}
                                        </td>
                                    )}
                                    <td style={{ padding: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className="font-numeric" style={{ fontWeight: 700, fontSize: '15.5px', color: emp.avgScore >= 7.5 ? colors.green : emp.avgScore >= 6 ? colors.warn : colors.danger }}>
                                                {emp.avgScore.toFixed(1)}
                                            </span>
                                            <div style={{ width: '40px', height: '3px', background: colors.surface3, borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${(emp.avgScore / 10) * 100}%`,
                                                    background: emp.avgScore >= 7.5 ? colors.green : emp.avgScore >= 6 ? colors.warn : colors.danger
                                                }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px', fontSize: '12.5px', color: colors.text2 }}>
                                        <span className="font-numeric" style={{ fontWeight: 700 }}>{emp.goalCount}</span> goals
                                    </td>
                                    <td style={{ padding: '14px', fontSize: '12px', color: colors.text3 }}>{emp.lastReport}</td>
                                     <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <Button 
                                                variant="secondary" 
                                                size="sm" 
                                                icon="calendar" 
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setLeaveModalData({ isOpen: true, empId: emp.id, empName: emp.name })
                                                }}
                                            >
                                                Grant Leave
                                            </Button>
                                            <Button variant="secondary" size="sm" icon="chevronRight">View</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredEmployees.length > PAGE_SIZE && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: `1px solid ${colors.border}` }}>
                            <span style={{ fontSize: '12.5px', color: colors.text3 }}>
                                Showing <span style={{ fontWeight: 700, color: colors.text2 }}>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredEmployees.length)}</span> of <span style={{ fontWeight: 700, color: colors.text2 }}>{filteredEmployees.length}</span>
                            </span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={{ padding: '6px 14px', borderRadius: radius.lg, border: `1px solid ${colors.border}`, background: colors.surface2, color: colors.text, fontSize: '12.5px', fontWeight: 600, cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
                                <button onClick={() => setPage(p => p + 1)} disabled={page * PAGE_SIZE >= filteredEmployees.length} style={{ padding: '6px 14px', borderRadius: radius.lg, border: `1px solid ${colors.border}`, background: colors.surface2, color: colors.text, fontSize: '12.5px', fontWeight: 600, cursor: page * PAGE_SIZE >= filteredEmployees.length ? 'default' : 'pointer', opacity: page * PAGE_SIZE >= filteredEmployees.length ? 0.4 : 1 }}>Next →</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Content - Card View */}
            {viewMode === 'cards' && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '16px'
                }}>
                    {filteredEmployees.map(emp => (
                        <div
                            key={emp.id}
                            onClick={() => router.push(`/employees/${emp.id}`)}
                            style={{
                                background: colors.surface,
                                border: `1px solid ${colors.border}`,
                                borderRadius: radius.xl,
                                padding: '24px',
                                cursor: 'pointer',
                                transition: `all ${animation.fast}`,
                                boxShadow: shadows.cardHover
                            }}
                            className="card-hover"
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: getAvatarGradient(emp.name),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px',
                                    fontWeight: 800,
                                    color: '#fff'
                                }}>
                                    {getInitials(emp.name)}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '10px', color: colors.text3, textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>Avg Score</div>
                                    <div className="font-numeric" style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1, color: emp.avgScore >= 7.5 ? colors.green : emp.avgScore >= 6 ? colors.warn : colors.danger }}>
                                        {emp.avgScore.toFixed(1)}
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '15px', fontWeight: 700, color: colors.text, marginBottom: '2px' }}>{emp.name}</div>
                                <div style={{ fontSize: '12px', color: colors.text3 }}>{emp.title || 'Staff Member'}</div>
                                <div style={{ fontSize: '11.5px', color: colors.text3, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Icon name="clock" size={12} color={colors.text3} />
                                    Last report: {emp.lastReport}
                                </div>
                            </div>                             <div style={{ paddingTop: '16px', borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '11.5px', color: colors.text3 }}>
                                    <span className="font-numeric" style={{ fontWeight: 700, color: colors.text2 }}>{emp.reportCount}</span> reports
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setLeaveModalData({ isOpen: true, empId: emp.id, empName: emp.name })
                                        }}
                                        style={{ 
                                            padding: '6px 10px', 
                                            borderRadius: '6px', 
                                            border: `1px solid ${colors.border}`, 
                                            background: colors.surface2, 
                                            color: colors.text2, 
                                            fontSize: '11px', 
                                            fontWeight: 600, 
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <Icon name="calendar" size={12} />
                                        Grant Leave
                                    </button>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} style={{
                                                width: '4px',
                                                height: `${10 + Math.random() * 20}px`,
                                                background: emp.avgScore >= 7.5 ? colors.green : colors.accent,
                                                borderRadius: '2px'
                                            }} />
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            )}


            <style jsx>{`
        .fade-in {
          animation: fadeIn 0.4s ease both;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .table-row-hover:hover {
          background: ${colors.surface2} !important;
        }
        .card-hover:hover {
          border-color: ${colors.borderHover} !important;
          transform: translateY(-4px);
          box-shadow: ${shadows.cardHover} !important;
        }
      `}</style>
             <InviteModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
            />
            <ApproveLeaveModal 
                isOpen={leaveModalData.isOpen}
                onClose={() => setLeaveModalData({ ...leaveModalData, isOpen: false })}
                employeeId={leaveModalData.empId}
                employeeName={leaveModalData.empName}
            />
        </div>
    )
}

const selectStyle: React.CSSProperties = {
    padding: '8px 28px 8px 12px',
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    fontSize: '12.5px',
    color: colors.text2,
    fontFamily: 'inherit',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4' fill='none' stroke='%23545d73' stroke-width='2'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    transition: `border-color ${animation.fast}`
}

const tableHeaderStyle: React.CSSProperties = {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 700,
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
}
