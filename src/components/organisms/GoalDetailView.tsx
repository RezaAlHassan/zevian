'use client'

import { colors, radius, typography, animation, layout, shadows, getAvatarGradient, getInitials } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { StatusPill } from '@/components/atoms/StatusPill'
import { ScoreDisplay } from '@/components/atoms/Score'
import React, { useState } from 'react'
import Link from 'next/link'
import { MetaSection } from '@/components/molecules'
import { useSearchParams } from 'next/navigation'
import { updateGoalMembersAction } from '@/app/actions/goalActions'

import { AddGoalSheet } from './AddGoalSheet'
import { ManageGoalTeamSheet } from './ManageGoalTeamSheet'

interface Props {
    goal: any
    projects: any[]
    employees: any[]
    readOnly?: boolean
    basePath?: string
}

export function GoalDetailView({ goal, projects, employees, readOnly = false, basePath = '/goals' }: Props) {
    const searchParams = useSearchParams()
    const view = searchParams.get('view') || 'org'
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isManageTeamOpen, setIsManageTeamOpen] = useState(false)
    const [currentGoal, setCurrentGoal] = useState(goal)
    const [isSavingMembers, setIsSavingMembers] = useState(false)

    if (!currentGoal) return null

    const reports = currentGoal.reports || []
    const members = currentGoal.goal_members || []

    const handleComplete = () => {
        if (confirm('Mark this goal as completed?')) {
            setCurrentGoal({ ...currentGoal, status: 'completed' })
        }
    }

    return (
        <div style={{ minHeight: '100vh', background: colors.bg }}>
            {/* Header */}
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
                    <Link href={`${basePath}?${searchParams.toString()}`} style={{ color: colors.text2, textDecoration: 'none' }}>Goals</Link>
                    <span style={{ color: colors.text3 }}>/</span>
                    <span style={{ color: colors.text, fontWeight: 500 }}>{goal.name}</span>
                </div>
                <div style={{ flex: 1 }} />
                {!readOnly && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {currentGoal.status !== 'completed' && (
                            <Button
                                variant="primary"
                                size="sm"
                                icon="check"
                                style={{ background: colors.green }}
                                onClick={handleComplete}
                            >Complete Goal</Button>
                        )}
                        <Button
                            variant="secondary"
                            size="sm"
                            icon="edit"
                            onClick={() => setIsEditOpen(true)}
                        >Edit Goal</Button>
                    </div>
                )}
            </header>

            <div style={{ padding: '28px 28px 60px' }}>
                {/* Hero */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '20px',
                    marginBottom: '28px',
                    padding: '24px',
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius['3xl']
                }}>
                    <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: radius['2xl'],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        background: colors.surface2,
                        border: `1px solid ${colors.border}`,
                        flexShrink: 0
                    }}>
                        <Icon name="target" size={26} color={colors.accent} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontFamily: typography.fonts.display, fontSize: '21px', fontWeight: 800, color: colors.text, letterSpacing: '-0.5px', marginBottom: '4px' }}>
                            {goal.name}
                        </h1>
                        <p style={{ fontSize: '13px', color: colors.text2, lineHeight: 1.6, maxWidth: '520px', marginBottom: '12px' }}>
                            {goal.instructions || 'Standard tracking goal for objective performance measurement across specific criteria dimensions.'}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                            <StatusPill status={goal.status} />
                            <div style={{ display: 'flex', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, color: colors.text2 }}>
                                {goal.project?.emoji} {goal.project?.name}
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: colors.text3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Goal Score</div>
                        <ScoreDisplay score={goal.avgScore} size="lg" />
                    </div>
                </div>

                {/* KPI Strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
                    {[
                        { label: 'Total Reports', value: reports.length, icon: 'fileText' as const, meta: 'Submissions' },
                        { label: 'Scoring Criteria', value: goal.criteria?.length || 0, icon: 'list' as const, meta: 'Dimensions' },
                        { label: 'Assigned To', value: members.length, icon: 'users' as const, meta: 'Members' },
                        { label: 'Deadline', value: goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No limit', icon: 'calendar' as const, meta: 'Target date' },
                    ].map(kpi => (
                        <div key={kpi.label} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: '14px 16px' }}>
                            <div style={{ fontSize: '10.5px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Icon name={kpi.icon} size={12} />
                                {kpi.label}
                            </div>
                            <div className="font-numeric" style={{ fontSize: '24px', fontWeight: typography.weight.black, color: colors.text, letterSpacing: '-0.5px', lineHeight: 1 }}>
                                {kpi.value}
                            </div>
                            <div style={{ fontSize: '11px', color: colors.text3, marginTop: '5px' }}>{kpi.meta}</div>
                        </div>
                    ))}
                </div>

                {/* Grid Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* Criteria Analysis */}
                        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.xl, overflow: 'hidden' }}>
                            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, fontWeight: 600, fontSize: '14px', color: colors.text }}>
                                Criteria Breakdown
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '20px' }}>
                                {goal.criteria?.map((crit: any, i: number) => {
                                    // Calculate average for this specific criterion
                                    const criterionScores = reports.flatMap((r: any) => 
                                        (r.criterionScores || []).filter((s: any) => s.criterionName === crit.name)
                                    ).map((s: any) => Number(s.score));

                                    const criteriaAvg = criterionScores.length > 0 
                                        ? criterionScores.reduce((a: number, b: number) => a + b, 0) / criterionScores.length 
                                        : null;

                                    return (
                                        <div key={crit.id} style={{ background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: '16px', position: 'relative' }}>
                                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: i === 0 ? colors.accent : i === 1 ? colors.teal : colors.purple }} />
                                            <div style={{ fontWeight: 600, fontSize: '13px', color: colors.text, marginBottom: '2px' }}>{crit.name}</div>
                                            <div style={{ fontSize: '11px', color: colors.text3, marginBottom: '12px' }}>Weight: <span className="font-numeric" style={{ fontWeight: typography.weight.heavy }}>{crit.weight}%</span></div>
                                            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                                <div className="font-numeric" style={{ fontSize: '28px', fontWeight: typography.weight.black, color: colors.text, letterSpacing: '-1px', lineHeight: 1 }}>
                                                    {criteriaAvg !== null && !isNaN(criteriaAvg) ? criteriaAvg.toFixed(1) : '—'}
                                                </div>
                                                {/* Mini Sparkline placeholder */}
                                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '24px' }}>
                                                    {[4, 7, 5, 8, 6, 9].map((h, j) => (
                                                        <div key={j} style={{ width: '5px', height: `${h * 10}%`, background: colors.accentGlow, borderRadius: '2px 2px 0 0' }} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recent Reports */}
                        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.xl, overflow: 'hidden' }}>
                            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ fontWeight: 600, fontSize: '14px', color: colors.text }}>Recent Reports ({reports.length})</div>
                            </div>
                            <div style={{ padding: '0px' }}>
                                {reports.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {reports.map((report: any, i: number) => (
                                            <div key={report.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderBottom: i === reports.length - 1 ? 'none' : `1px solid ${colors.border}` }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '8px',
                                                    background: getAvatarGradient(report.employees?.name || 'Unknown'),
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    fontSize: '11px',
                                                    color: '#fff'
                                                }}>
                                                    {getInitials(report.employees?.name || 'Unknown')}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: colors.text }}>
                                                        {new Date(report.submissionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </div>
                                                    <div style={{ fontSize: '11.5px', color: colors.text3 }}>by {report.employees?.name || 'Unknown'}</div>
                                                </div>
                                                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <ScoreDisplay score={report.managerOverallScore ?? report.evaluationScore} size="sm" />
                                                    <Link href={`${basePath.includes('my-') ? '/my-reports' : '/reports'}/${report.id}?${searchParams.toString()}`}>
                                                        <Button variant="secondary" size="sm" icon="chevronRight">
                                                            View
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '40px 20px', textAlign: 'center', color: colors.text3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 500 }}>No reports yet.</div>
                                        <Button variant="primary" size="sm" icon="users" onClick={() => router.push('/employees')}>
                                            Remind Assignees
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Sidebar Info */}
                        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.xl, overflow: 'hidden' }}>
                            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Goal Info
                            </div>
                             {[
                                 { k: 'Frequency', v: goal.project?.reportFrequency || (goal.project as any)?.frequency || goal.project?.report_frequency || 'Weekly', i: 'clock' },
                                 { k: 'Created', v: goal.createdAt ? new Date(goal.createdAt).toLocaleDateString() : '—', i: 'calendar' },
                             ].map(item => (
                                 <div key={item.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${colors.border}` }}>
                                     <div style={{ fontSize: '12.5px', color: colors.text3, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                         <Icon name={item.i as any} size={13} /> {item.k}
                                     </div>
                                     <div style={{ fontSize: '12.5px', fontWeight: 500, color: colors.text2 }}>{item.v}</div>
                                 </div>
                             ))}
                        </div>

                        {/* Assigned Members */}
                        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.xl, overflow: 'hidden' }}>
                            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span>Assigned Members (<span className="font-numeric" style={{ fontWeight: typography.weight.black }}>{members.length}</span>)</span>
                                {!readOnly && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        icon="users"
                                        onClick={() => setIsManageTeamOpen(true)}
                                        style={{
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            padding: '4px 8px',
                                            height: '24px'
                                        }}
                                    >
                                        Manage
                                    </Button>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {members.length > 0 ? members.map((m: any, i: number) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderBottom: i === members.length - 1 ? 'none' : `1px solid ${colors.border}` }}>
                                        <div style={{
                                            width: '30px',
                                            height: '30px',
                                            borderRadius: '7px',
                                            background: getAvatarGradient(m.employee.full_name),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            fontSize: '10px',
                                            color: '#fff'
                                        }}>
                                            {getInitials(m.employee.full_name)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 500, color: colors.text }}>{m.employee.full_name}</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ padding: '24px 16px', textAlign: 'center', color: colors.text3, fontSize: '12px' }}>No members assigned.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AddGoalSheet
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                projects={projects}
                employees={employees}
                goal={currentGoal}
            />

            <ManageGoalTeamSheet
                isOpen={isManageTeamOpen}
                onClose={() => setIsManageTeamOpen(false)}
                goal={currentGoal}
                employees={employees}
                isSaving={isSavingMembers}
                onSave={async (newMembers) => {
                    setIsSavingMembers(true)
                    const memberIds = newMembers.map((m) => m.employee.id)
                    const result = await updateGoalMembersAction(
                        currentGoal.id,
                        memberIds,
                        currentGoal.projectId || currentGoal.project?.id
                    )
                    setIsSavingMembers(false)
                    if (result.error) {
                        console.error('Failed to save goal members:', result.error)
                        return
                    }
                    setCurrentGoal({ ...currentGoal, goal_members: newMembers })
                    setIsManageTeamOpen(false)
                }}
            />
        </div>
    )
}
