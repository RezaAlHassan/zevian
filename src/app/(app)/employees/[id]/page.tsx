'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { colors, animation, shadows, radius } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms'
import { ScoreDisplay, ScoreBar } from '@/components/atoms/Score'
import { StatusPill } from '@/components/atoms/StatusPill'
import { DateRangeSelector } from '@/components/molecules'
import { EmployeeDashboardView } from '@/components/organisms/EmployeeDashboardView'
import { getEmployeeDetailedDataAction } from '@/app/actions/dashboardActions'
import { ApproveLeaveModal } from '@/components/organisms/ApproveLeaveModal'
import { AISummaryCard } from '@/components/molecules/AISummaryCard'

import { useParams, useRouter, useSearchParams } from 'next/navigation'

export default function EmployeeDetailPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const id = params.id as string
    const startDate = searchParams.get('start') || undefined
    const endDate = searchParams.get('end') || undefined
    const selectedGoalId = searchParams.get('goal') || null
    
    const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'reports' | 'activity'>('overview')
    const [pageData, setPageData] = useState<any>(null)
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadData() {
            if (!id) return
            setLoading(true)
            try {
                const res: any = await getEmployeeDetailedDataAction(id, startDate, endDate)
                if (res.error) {
                    setError(res.error)
                } else {
                    setPageData(res)
                }
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [id, startDate, endDate])

    if (loading) return (
        <div style={{ padding: '100px', textAlign: 'center', color: colors.text3 }}>
            Loading employee details...
        </div>
    )

    if (error || !pageData) return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2 style={{ color: colors.text }}>{error || 'Employee not found'}</h2>
            <Button variant="secondary" onClick={() => router.push('/employees')}>Back to List</Button>
        </div>
    )

    const { dashboardData, allGoals, allReports, allActivity, trustSignal } = pageData
    const employee = dashboardData.me

    return (
        <div className="fade-in" style={{ background: colors.bg, minHeight: '100vh', animation: animation.keyframes.fadeUp }}>
            {/* Sticky Header with Breadcrumbs */}
            <header style={{
                position: 'sticky',
                top: 0,
                height: '56px',
                background: 'rgba(10,12,16,0.9)',
                backdropFilter: 'blur(12px)',
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                padding: '0 24px',
                gap: '10px',
                zIndex: 90,
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
                            <span
                                title={tooltip}
                                style={{
                                    padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700,
                                    background: bgMap[trustSignal.color ?? 'neutral'],
                                    color: textMap[trustSignal.color ?? 'neutral'],
                                    letterSpacing: '0.03em', cursor: 'default',
                                }}
                            >
                                {trustSignal.label}
                            </span>
                        )
                    })()}
                </div>
                <div style={{ flex: 1 }} />
                {pageData.permissions?.canApproveLeave && (
                    <Button variant="secondary" onClick={() => setIsLeaveModalOpen(true)}>
                        Approve Leave
                    </Button>
                )}
                {pageData && pageData.dashboardData?.goals?.length > 0 && (
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
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '8px',
                            color: selectedGoalId ? colors.accent : colors.text3,
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '5px 28px 5px 10px',
                            cursor: 'pointer',
                            outline: 'none',
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 8px center',
                        }}
                    >
                        <option value="">All Goals</option>
                        {pageData.dashboardData.goals.filter((g: any) => g.status === 'active').map((g: any) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                )}
                <DateRangeSelector
                    startDate={startDate}
                    endDate={endDate}
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
            </header>

            <div style={{ padding: '0 28px 60px' }}>
                <div style={{ padding: '24px 0 20px' }}>
                    <AISummaryCard
                        employeeId={id}
                        employeeName={employee.name}
                        startDate={startDate}
                        endDate={endDate}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '32px', borderBottom: `1px solid ${colors.border}` }}>
                        {[
                            { id: 'overview', label: 'Overview', icon: 'chart' },
                            { id: 'goals', label: 'Goals', icon: 'target' },
                            { id: 'reports', label: 'Reports', icon: 'fileText' },
                            { id: 'activity', label: 'Activity', icon: 'clock' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    paddingBottom: '12px',
                                    fontSize: '13px',
                                    fontWeight: activeTab === tab.id ? 700 : 500,
                                    color: activeTab === tab.id ? colors.accent : colors.text3,
                                    border: 'none',
                                    background: 'none',
                                    borderBottom: `2px solid ${activeTab === tab.id ? colors.accent : 'transparent'}`,
                                    cursor: 'pointer',
                                    transition: `all ${animation.fast}`,
                                    marginBottom: '-1px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Icon name={tab.icon as any} size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
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
                                        background: colors.surface, 
                                        border: `1px solid ${colors.border}`, 
                                        borderRadius: radius.xl, 
                                        padding: '24px',
                                        transition: `all ${animation.fast}`,
                                        cursor: 'pointer'
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
                                                    <span>Progess</span>
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
                            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.xl, overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.surface2 }}>
                                            <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase' }}>Date</th>
                                            <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase' }}>Goal</th>
                                            <th style={{ textAlign: 'center', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase' }}>Score</th>
                                            <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allReports.map((report: any, i: number) => (
                                            <tr key={i} style={{ borderBottom: i === allReports.length - 1 ? 'none' : `1px solid ${colors.border}`, transition: 'background 0.2s', cursor: 'pointer' }}>
                                                <td style={{ padding: '16px 24px', fontSize: '13.5px', color: colors.text2 }}>
                                                    {new Date(report.submissionDate).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: colors.text }}>{report.goals?.name || 'Report'}</div>
                                                </td>
                                                <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                    <ScoreDisplay score={report.managerOverallScore ?? report.evaluationScore} size="sm" />
                                                </td>
                                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                    <Link href={`/reports/${report.id}`}>
                                                        <Button variant="ghost" size="sm">View</Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                        {allReports.length === 0 && (
                                            <tr>
                                                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: colors.text3 }}>No reports found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
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
                                            background: colors.surface, 
                                            border: `1px solid ${colors.border}`, 
                                            borderRadius: radius.lg, 
                                            padding: '16px 20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                            transition: 'transform 0.2s',
                                        }}>
                                            <div style={{ 
                                                width: '40px', 
                                                height: '40px', 
                                                borderRadius: '12px', 
                                                background: icon.bg, 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center' 
                                            }}>
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
                .fade-in {
                    animation: fadeIn 0.5s ease both;
                }
                .goal-card:hover {
                    transform: translateY(-2px);
                    border-color: ${colors.accent} !important;
                    box-shadow: ${shadows.cardHover};
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
            </div>
        </div>
    )
}
