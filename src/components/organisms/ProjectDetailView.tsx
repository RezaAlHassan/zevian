'use client'

import { colors, radius, typography, animation, getAvatarGradient, getInitials } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { StatusPill } from '@/components/atoms/StatusPill'
import { ScoreDisplay } from '@/components/atoms/Score'
import { MetaSection } from '@/components/molecules'
import React, { useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

import { AddProjectSheet } from './AddProjectSheet'
import { ManageTeamSheet } from './ManageTeamSheet'

interface Props {
    project: any
    employees: any[]
    readOnly?: boolean
    basePath?: string
    goalBasePath?: string
}

export function ProjectDetailView({ project, employees, readOnly = false, basePath = '/projects', goalBasePath = '/goals' }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const view = searchParams.get('view') || 'org'
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isManageTeamOpen, setIsManageTeamOpen] = useState(false)

    if (!project) return null

    const goals = project.goals || []
    const reports = project.reports || []
    const activity = project.activity || []
    const members = project.project_members || []

    return (
        <div style={{ minHeight: '100vh', background: colors.bg }}>
            {/* Header / Breadcrumb */}
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
                    <Link href={`${basePath}?${searchParams.toString()}`} style={{ color: colors.text2, textDecoration: 'none' }}>Projects</Link>
                    <span style={{ color: colors.text3 }}>/</span>
                    <span style={{ color: colors.text, fontWeight: 500 }}>{project.name}</span>
                </div>
                <div style={{ flex: 1 }} />
                {!readOnly && <Button variant="secondary" size="sm" icon="settings" onClick={() => setIsEditOpen(true)}>Settings</Button>}
            </header>

            <div style={{ padding: '28px 28px 60px' }}>
                {/* Hero Section */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '24px',
                    marginBottom: '32px',
                    padding: '32px',
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius['3xl'],
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: radius['2xl'],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        background: colors.surface2,
                        border: `1px solid ${colors.border}`,
                        flexShrink: 0
                    }}>
                        {project.emoji || '🖥️'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h1 style={{
                                fontFamily: typography.fonts.display,
                                fontSize: '24px',
                                fontWeight: 800,
                                color: colors.text,
                                letterSpacing: '-0.5px'
                            }}>
                                {project.name}
                            </h1>
                            <div style={{ padding: '2px 8px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase' }}>
                                {project.category || 'General'}
                            </div>
                        </div>
                        <p style={{ fontSize: '14px', color: colors.text2, lineHeight: 1.6, maxWidth: '640px', marginBottom: '16px' }}>
                            {project.description || 'No description provided.'}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <StatusPill status={project.status} />
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <div style={{ fontSize: '11px', color: colors.text3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Project Score
                        </div>
                        <ScoreDisplay score={project.avg_score} size="lg" />
                    </div>
                </div>

                {/* Main Content Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        {/* Goals Section */}
                        <section style={{
                            background: colors.surface,
                            border: `1px solid ${colors.border}`,
                            borderRadius: radius.xl,
                            overflow: 'hidden'
                        }}>
                            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ fontWeight: 600, fontSize: '15px', color: colors.text, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Icon name="target" size={16} color={colors.accent} />
                                    Active Goals ({goals.length})
                                </div>
                                {!readOnly && (
                                    <Link href={`${goalBasePath}/create?projectId=${project.id}&view=${view}`} style={{ textDecoration: 'none' }}>
                                        <Button variant="ghost" size="sm">Add Goal</Button>
                                    </Link>
                                )}
                            </div>
                            <div style={{ padding: '0px' }}>
                                {goals.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {goals.map((goal: any, i: number) => (
                                            <Link key={goal.id} href={`${goalBasePath}/${goal.id}?${searchParams.toString()}`} style={{ textDecoration: 'none' }}>
                                                <div style={{
                                                    padding: '16px 20px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '16px',
                                                    borderBottom: i === goals.length - 1 ? 'none' : `1px solid ${colors.border}`,
                                                    transition: `background ${animation.fast}`,
                                                    cursor: 'pointer'
                                                }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = colors.surface2}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '14px', fontWeight: 600, color: colors.text, marginBottom: '2px' }}>{goal.name}</div>
                                                        <div style={{ fontSize: '12px', color: colors.text3 }}>Deadline: {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline'}</div>
                                                    </div>
                                                    <StatusPill status={goal.status} />
                                                    <Icon name="chevronRight" size={16} color={colors.text3} />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '40px 20px', textAlign: 'center', color: colors.text3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 500 }}>No goals defined yet.</div>
                                        <Button variant="primary" size="sm" icon="plus" onClick={() => router.push(`/goals?new=true&project=${project.id}`)}>
                                            Create First Goal
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Recent Reports Section */}
                        <section style={{
                            background: colors.surface,
                            border: `1px solid ${colors.border}`,
                            borderRadius: radius.xl,
                            overflow: 'hidden'
                        }}>
                            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ fontWeight: 600, fontSize: '15px', color: colors.text, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Icon name="fileText" size={16} color={colors.accent} />
                                    Latest Reports ({reports.length})
                                </div>
                            </div>
                            <div style={{ padding: '0px' }}>
                                {reports.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {reports.slice(0, 10).map((report: any, i: number) => (
                                            <div key={report.id} style={{
                                                padding: '16px 20px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                borderBottom: i === reports.length - 1 || i === 9 ? 'none' : `1px solid ${colors.border}`
                                            }}>
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
                                                    <div style={{ fontSize: '11.5px', color: colors.text3 }}>Goal: {report.goals?.name || 'Goal Update'} • By {report.employees?.name || 'Unknown'}</div>
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
                                    <div style={{ padding: '40px 20px', textAlign: 'center', color: colors.text3 }}>
                                        <div style={{ fontSize: '14px', fontWeight: 500 }}>No reports submitted yet.</div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Project Info */}
                        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.xl, overflow: 'hidden' }}>
                            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Project Info
                            </div>
                            {[
                                { k: 'Frequency', v: project.reportFrequency || (project as any).frequency || project.report_frequency || 'Weekly', i: 'clock' },
                                { k: 'Created', v: project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—', i: 'calendar' },
                            ].map(item => (
                                <div key={item.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${colors.border}` }}>
                                    <div style={{ fontSize: '12.5px', color: colors.text3, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Icon name={item.i as any} size={13} /> {item.k}
                                    </div>
                                    <div style={{ fontSize: '12.5px', fontWeight: 500, color: colors.text2 }}>{item.v}</div>
                                </div>
                            ))}
                        </div>

                        {/* Team Section */}
                        <section style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.xl, overflow: 'hidden' }}>
                            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ fontWeight: 600, fontSize: '13px', color: colors.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Team Members ({members.length})
                                </div>
                                {!readOnly && (
                                    <Button variant="ghost" size="sm" onClick={() => setIsManageTeamOpen(true)}>Edit</Button>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {members.length > 0 ? members.map((m: any, i: number) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: i === members.length - 1 ? 'none' : `1px solid ${colors.border}` }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            background: getAvatarGradient(m.employee.full_name),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            fontSize: '11px',
                                            color: '#fff'
                                        }}>
                                            {getInitials(m.employee.full_name)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: colors.text }}>{m.employee.full_name}</div>
                                            <div style={{ fontSize: '11px', color: colors.text3, textTransform: 'capitalize' }}>{m.employee.role}</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ padding: '24px 16px', textAlign: 'center', color: colors.text3, fontSize: '12px' }}>
                                        No team members assigned.
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Recent Activity Section */}
                        <section style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.xl, overflow: 'hidden' }}>
                            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, fontSize: '13px', fontWeight: 600, color: colors.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Recent Activity
                            </div>
                            <div style={{ padding: '20px 16px' }}>
                                {activity.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {activity.slice(0, 5).map((act: any, i: number) => (
                                            <div key={act.id} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                                                {i < activity.length - 1 && i < 4 && (
                                                    <div style={{ position: 'absolute', left: '7px', top: '20px', bottom: '-20px', width: '1px', background: colors.border }} />
                                                )}
                                                <div style={{
                                                    width: '15px',
                                                    height: '15px',
                                                    borderRadius: '50%',
                                                    background: act.type === 'report' ? colors.teal : act.type === 'goal' ? colors.accent : colors.text3,
                                                    border: `3px solid ${colors.bg}`,
                                                    boxShadow: `0 0 0 1px ${colors.border}`,
                                                    flexShrink: 0,
                                                    zIndex: 2,
                                                    marginTop: '2px'
                                                }} />
                                                <div>
                                                    <div style={{ fontSize: '12.5px', color: colors.text2, lineHeight: 1.5 }}>
                                                        <span style={{ fontWeight: 600, color: colors.text }}>{act.user}</span> {act.action}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: colors.text3, marginTop: '4px' }}>
                                                        {new Date(act.timestamp).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', color: colors.text3, fontSize: '12px' }}>
                                        No recent activity.
                                    </div>
                                )}
                            </div>
                        </section>
                    </aside>
                </div>
            </div>

            {/* Sheets */}
            <AddProjectSheet
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                employees={employees}
                project={project}
            />
            <ManageTeamSheet
                isOpen={isManageTeamOpen}
                onClose={() => setIsManageTeamOpen(false)}
                project={project}
                employees={employees}
            />
        </div>
    )
}
