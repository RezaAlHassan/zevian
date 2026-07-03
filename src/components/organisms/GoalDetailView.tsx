'use client'

import { colors, radius, typography, animation, getScoreColor } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { StatusPill } from '@/components/atoms/StatusPill'
import { ScoreDisplay } from '@/components/atoms/Score'
import { Avatar, Chip } from '@/components/atoms'
import { Card } from '@/components/molecules/Card'
import React, { useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { updateGoalMembersAction, updateGoalStatusAction } from '@/app/actions/goalActions'

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
    const router = useRouter()
    const searchParams = useSearchParams()
    const view = searchParams.get('view') || 'org'
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isManageTeamOpen, setIsManageTeamOpen] = useState(false)
    const [currentGoal, setCurrentGoal] = useState(goal)
    const [isSavingMembers, setIsSavingMembers] = useState(false)
    const [showFullInstructions, setShowFullInstructions] = useState(false)

    const INSTRUCTIONS_MAX = 180

    if (!currentGoal) return null

    const reports = currentGoal.reports || []
    const members = currentGoal.goal_members || []

    const handleComplete = async () => {
        if (confirm('Mark this goal as completed?')) {
            const result = await updateGoalStatusAction(currentGoal.id, 'completed', currentGoal.projectId || currentGoal.project?.id)
            if (result.error) {
                alert('Failed to complete goal: ' + result.error)
                return
            }
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
                    <Link href={`${basePath}?${searchParams.toString()}`} style={{ color: colors.text2, textDecoration: 'none' }}>KPIs</Link>
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
                            >Complete KPI</Button>
                        )}
                        <Button
                            variant="secondary"
                            size="sm"
                            icon="edit"
                            onClick={() => setIsEditOpen(true)}
                        >Edit KPI</Button>
                    </div>
                )}
            </header>

            <div style={{ padding: '24px', maxWidth: '1180px', margin: '0 auto' }}>
                {/* Hero */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '20px',
                    marginBottom: '28px',
                    padding: '24px',
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.lg
                }}>
                    <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: radius.lg,
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
                            {(() => {
                                const text = goal.instructions || 'Standard tracking goal for objective performance measurement across specific criteria dimensions.'
                                const truncated = !showFullInstructions && text.length > INSTRUCTIONS_MAX
                                return (
                                    <>
                                        {truncated ? text.slice(0, INSTRUCTIONS_MAX) + '…' : text}
                                        {text.length > INSTRUCTIONS_MAX && (
                                            <span
                                                onClick={() => setShowFullInstructions(v => !v)}
                                                style={{ cursor: 'pointer', color: colors.accent, fontWeight: 600, marginLeft: '4px', fontSize: '12px' }}
                                            >
                                                {showFullInstructions ? 'See less' : 'See more'}
                                            </span>
                                        )}
                                    </>
                                )
                            })()}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                            <StatusPill status={goal.status} />
                            <div style={{ display: 'flex', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, color: colors.text2 }}>
                                {goal.project?.emoji} {goal.project?.name}
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: colors.text3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>KPI Score</div>
                        <ScoreDisplay score={goal.avgScore} size="lg" />
                    </div>
                </div>

                {/* KPI Strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }}>
                    {[
                        { label: 'Total Reports', value: reports.length, icon: 'fileText' as const, meta: 'Submissions' },
                        { label: 'Criteria', value: goal.criteria?.length || 0, icon: 'list' as const, meta: 'Dimensions' },
                        { label: 'Assigned To', value: members.length, icon: 'users' as const, meta: 'Members' },
                        { label: 'Deadline', value: goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No limit', icon: 'calendar' as const, meta: 'Target date' },
                    ].map(kpi => (
                        <div key={kpi.label} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: '16px 18px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Icon name={kpi.icon} size={12} color={colors.text3} />
                                {kpi.label}
                            </div>
                            <div className="font-numeric" style={{ fontSize: '28px', fontWeight: 800, color: colors.text, letterSpacing: '-1px', lineHeight: 1, marginBottom: '6px' }}>
                                {kpi.value}
                            </div>
                            <div style={{ fontSize: '11px', color: colors.text3 }}>{kpi.meta}</div>
                        </div>
                    ))}
                </div>

                {/* Grid Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Criteria Breakdown — one bar per criterion: weight label + a completion bar
                            (the criterion's average score out of 10) coloured by its score band. */}
                        <Card
                            dense
                            title="Criteria Breakdown"
                            icon="list"
                            chip={<Chip variant="default">{goal.criteria?.length || 0}</Chip>}
                        >
                            {goal.criteria && goal.criteria.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {goal.criteria.map((crit: any, i: number) => {
                                        // Average for this specific criterion across all reports.
                                        const criterionScores = reports.flatMap((r: any) =>
                                            (r.criterionScores || []).filter((s: any) => s.criterionName === crit.name)
                                        ).map((s: any) => Number(s.score));

                                        const criteriaAvg = criterionScores.length > 0
                                            ? criterionScores.reduce((a: number, b: number) => a + b, 0) / criterionScores.length
                                            : null;

                                        const hasScore = criteriaAvg !== null && !isNaN(criteriaAvg);
                                        const pct = hasScore ? Math.max(0, Math.min(100, (criteriaAvg! / 10) * 100)) : 0;
                                        const barColor = hasScore ? getScoreColor(criteriaAvg!) : colors.text3;

                                        return (
                                            <div key={crit.id} style={{ padding: '12px', borderBottom: i === goal.criteria.length - 1 ? 'none' : `1px solid ${colors.border}` }}>
                                                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: 0 }}>
                                                        <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{crit.name}</span>
                                                        <span style={{ fontSize: '11px', color: colors.text3, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                            Weight <span className="font-numeric" style={{ fontWeight: typography.weight.heavy, color: colors.text2 }}>{crit.weight}%</span>
                                                        </span>
                                                    </div>
                                                    <span className="font-numeric" style={{ display: 'inline-flex', alignItems: 'baseline', gap: '2px', flexShrink: 0 }}>
                                                        <span style={{ fontSize: '15px', fontWeight: 800, color: barColor, lineHeight: 1 }}>{hasScore ? criteriaAvg!.toFixed(1) : '—'}</span>
                                                        <span style={{ fontSize: '11px', fontWeight: 600, color: colors.text3 }}>/10</span>
                                                    </span>
                                                </div>
                                                <div style={{ position: 'relative', height: '6px', background: colors.surface3, borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${pct}%`, background: barColor, borderRadius: '3px', transition: `width ${animation.base} ease` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ padding: '24px 8px', textAlign: 'center', color: colors.text3, fontSize: '13px' }}>No criteria defined.</div>
                            )}
                        </Card>

                        {/* Recent Reports */}
                        <Card
                            dense
                            title="Recent Reports"
                            icon="fileText"
                            chip={<Chip variant="default">{reports.length}</Chip>}
                            action={reports.length > 3 ? (
                                <Link href={`/reports?search=${encodeURIComponent(goal.name)}`} style={{ textDecoration: 'none', fontSize: '12px', color: colors.accent, fontWeight: typography.weight.medium }}>
                                    View all
                                </Link>
                            ) : undefined}
                        >
                            {reports.length > 0 ? (
                                reports.slice(0, 3).map((report: any) => (
                                    <Link key={report.id} href={`${basePath.includes('my-') ? '/my-reports' : '/reports'}/${report.id}?${searchParams.toString()}`} style={{ textDecoration: 'none', display: 'block' }}>
                                        <div
                                            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: radius.md, marginBottom: '2px', cursor: 'pointer', transition: `background ${animation.fast}`, background: 'transparent' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = colors.surface2}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <Avatar name={report.employees?.name || 'Unknown'} size="md" style={{ flexShrink: 0 }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: colors.text }}>
                                                    {(() => { const d = report.submittedForDate || report.submissionDate; return new Date(d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) })()}
                                                </div>
                                                <div style={{ fontSize: '12px', color: colors.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>by {report.employees?.name || 'Unknown'}</div>
                                            </div>
                                            <ScoreDisplay score={report.managerOverallScore ?? report.evaluationScore} size="sm" />
                                            <Icon name="chevronRight" size={14} color={colors.text3} style={{ flexShrink: 0 }} />
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div style={{ padding: '24px 8px', textAlign: 'center', color: colors.text3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 500 }}>No reports yet.</div>
                                    {!readOnly && (
                                        <Button variant="primary" size="sm" icon="users" onClick={() => router.push('/employees')}>
                                            Remind Assignees
                                        </Button>
                                    )}
                                </div>
                            )}
                        </Card>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* KPI Info */}
                        <Card dense title="KPI Info">
                            {[
                                { k: 'Frequency', v: goal.project?.reportFrequency || (goal.project as any)?.frequency || goal.project?.report_frequency || 'Weekly', i: 'clock' },
                                { k: 'Created', v: goal.createdAt ? new Date(goal.createdAt).toLocaleDateString() : '—', i: 'calendar' },
                            ].map(item => (
                                <div key={item.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
                                    <div style={{ fontSize: '12px', color: colors.text3, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Icon name={item.i as any} size={13} /> {item.k}
                                    </div>
                                    <div style={{ fontSize: '12px', fontWeight: 500, color: colors.text2 }}>{item.v}</div>
                                </div>
                            ))}
                        </Card>

                        {/* Assigned Members */}
                        <Card
                            dense
                            title="Assigned Members"
                            icon="people"
                            chip={<Chip variant="default">{members.length}</Chip>}
                            action={!readOnly ? (
                                <span onClick={() => setIsManageTeamOpen(true)} style={{ fontSize: '12px', color: colors.accent, fontWeight: typography.weight.medium, cursor: 'pointer' }}>
                                    Assign employees
                                </span>
                            ) : undefined}
                        >
                            {members.length > 0 ? members.map((m: any, i: number) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: radius.md, marginBottom: '2px' }}>
                                    <Avatar name={m.employee.full_name} size="md" style={{ flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: colors.text }}>{m.employee.full_name}</div>
                                        {m.employee.role && <div style={{ fontSize: '12px', color: colors.text3, textTransform: 'capitalize' }}>{m.employee.role}</div>}
                                    </div>
                                </div>
                            )) : (
                                <div style={{ padding: '20px 8px', textAlign: 'center', color: colors.text3, fontSize: '13px' }}>No members assigned.</div>
                            )}
                        </Card>
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
