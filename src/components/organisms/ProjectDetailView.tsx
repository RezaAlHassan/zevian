'use client'

import { colors, radius, typography, animation } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { StatusPill } from '@/components/atoms/StatusPill'
import { ScoreDisplay } from '@/components/atoms/Score'
import { Avatar } from '@/components/atoms'
import { Card, ShowAllButton, CountLabel } from '@/components/molecules/Card'
import React, { useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

import { AddProjectSheet } from './AddProjectSheet'
import { ManageTeamSheet } from './ManageTeamSheet'
import { updateProjectMembersAction, upsertProjectAction } from '@/app/actions/projectActions'

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

    const handleSaveProject = async (updatedProject: any) => {
        const res = await upsertProjectAction(updatedProject)
        if (res.success) {
            setIsEditOpen(false)
            router.refresh()
        } else {
            alert(res.error || 'Failed to save project')
        }
    }

    const [isSavingMembers, setIsSavingMembers] = useState(false)
    const [showAllMembers, setShowAllMembers] = useState(false)

    // Cap the team panel so a large roster doesn't stretch the sidebar; the rest is one tap away.
    const MEMBER_PREVIEW = 5

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
                {!readOnly && (
                    <Link href={`/projects/${project.id}/ai-context`} style={{ textDecoration: 'none' }}>
                        <Button variant="secondary" size="sm" icon="sparkles">Project Memory</Button>
                    </Link>
                )}
                {!readOnly && <Button variant="secondary" size="sm" icon="settings" onClick={() => setIsEditOpen(true)}>Settings</Button>}
            </header>

            <div style={{ padding: '24px', maxWidth: '1180px', margin: '0 auto' }}>
                {/* Hero Section */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '24px',
                    marginBottom: '32px',
                    padding: '32px',
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.lg,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', alignItems: 'start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Active Goals */}
                        <Card
                            dense
                            title="Active Goals"
                            icon="target"
                            chip={<CountLabel>{goals.length}</CountLabel>}
                            action={!readOnly ? (
                                <Button variant="ghost" size="sm" icon="plus" onClick={() => router.push(`${goalBasePath}?new=true&project=${project.id}&view=${view}`)}>
                                    Add goal
                                </Button>
                            ) : undefined}
                        >
                            {goals.length > 0 ? (
                                goals.map((goal: any) => (
                                    <Link key={goal.id} href={`${goalBasePath}/${goal.id}?${searchParams.toString()}`} style={{ textDecoration: 'none', display: 'block' }}>
                                        <div
                                            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: radius.md, marginBottom: '2px', cursor: 'pointer', transition: `background ${animation.fast}`, background: 'transparent' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = colors.surface2}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: colors.text, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.name}</div>
                                                <div style={{ fontSize: '12px', color: colors.text3 }}>Deadline: {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline'}</div>
                                            </div>
                                            <StatusPill status={goal.status} />
                                            <Icon name="chevronRight" size={14} color={colors.text3} style={{ flexShrink: 0 }} />
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div style={{ padding: '24px 8px', textAlign: 'center', color: colors.text3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 500 }}>No goals defined yet.</div>
                                    <Button variant="primary" size="sm" icon="plus" onClick={() => router.push(`${goalBasePath}?new=true&project=${project.id}&view=${view}`)}>
                                        Create First Goal
                                    </Button>
                                </div>
                            )}
                        </Card>

                        {/* Latest Reports */}
                        <Card
                            dense
                            title="Latest Reports"
                            icon="fileText"
                            chip={<CountLabel>{reports.length}</CountLabel>}
                        >
                            {reports.length > 0 ? (
                                <>
                                {reports.slice(0, 3).map((report: any) => (
                                    <Link key={report.id} href={`${basePath.includes('my-') ? '/my-reports' : '/reports'}/${report.id}?${searchParams.toString()}`} style={{ textDecoration: 'none', display: 'block' }}>
                                        <div
                                            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: radius.md, marginBottom: '2px', cursor: 'pointer', transition: `background ${animation.fast}`, background: 'transparent' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = colors.surface2}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <Avatar name={report.employees?.name || 'Unknown'} src={report.employees?.avatar_url ?? null} size="md" style={{ flexShrink: 0 }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: colors.text }}>
                                                    {(() => { const d = report.submittedForDate || report.submissionDate; return new Date(d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) })()}
                                                </div>
                                                <div style={{ fontSize: '12px', color: colors.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{report.goals?.name || 'Goal Update'} · {report.employees?.name || 'Unknown'}</div>
                                            </div>
                                            <ScoreDisplay score={report.managerOverallScore ?? report.evaluationScore} size="sm" />
                                            <Icon name="chevronRight" size={14} color={colors.text3} style={{ flexShrink: 0 }} />
                                        </div>
                                    </Link>
                                ))}
                                {reports.length > 3 && (
                                    <ShowAllButton label="View all reports" onClick={() => router.push(`/reports?search=${encodeURIComponent(project.name)}`)} />
                                )}
                                </>
                            ) : (
                                <div style={{ padding: '24px 8px', textAlign: 'center', color: colors.text3, fontSize: '13px', fontWeight: 500 }}>No reports submitted yet.</div>
                            )}
                        </Card>
                    </div>

                    <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Project Info */}
                        <Card dense title="Project Info">
                            {[
                                { k: 'Frequency', v: project.reportFrequency || (project as any).frequency || project.report_frequency || 'Weekly', i: 'clock' },
                                { k: 'Created', v: project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '—', i: 'calendar' },
                            ].map(item => (
                                <div key={item.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
                                    <div style={{ fontSize: '12px', color: colors.text3, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Icon name={item.i as any} size={13} /> {item.k}
                                    </div>
                                    <div style={{ fontSize: '12px', fontWeight: 500, color: colors.text2 }}>{item.v}</div>
                                </div>
                            ))}
                        </Card>

                        {/* Team */}
                        <Card
                            dense
                            title="Team"
                            icon="people"
                            chip={<CountLabel>{members.length}</CountLabel>}
                            action={!readOnly ? (
                                <Button variant="ghost" size="sm" icon="settings" onClick={() => setIsManageTeamOpen(true)}>
                                    Manage team
                                </Button>
                            ) : undefined}
                        >
                            {members.length > 0 ? (
                                <>
                                {(showAllMembers ? members : members.slice(0, MEMBER_PREVIEW)).map((m: any, i: number) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: radius.md, marginBottom: '2px' }}>
                                        <Avatar name={m.employee.full_name} src={m.employee.avatar_url ?? null} size="md" style={{ flexShrink: 0 }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: colors.text }}>{m.employee.full_name}</div>
                                            <div style={{ fontSize: '12px', color: colors.text3, textTransform: 'capitalize' }}>{m.employee.role}</div>
                                        </div>
                                    </div>
                                ))}
                                {members.length > MEMBER_PREVIEW && (
                                    <ShowAllButton
                                        label={showAllMembers ? 'Show less' : `Show all ${members.length}`}
                                        onClick={() => setShowAllMembers(v => !v)}
                                    />
                                )}
                                </>
                            ) : (
                                <div style={{ padding: '20px 8px', textAlign: 'center', color: colors.text3, fontSize: '13px' }}>
                                    No team members assigned.
                                </div>
                            )}
                        </Card>

                        {/* Recent Activity */}
                        <Card dense title="Recent Activity">
                            {activity.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '4px 12px 6px' }}>
                                    {activity.slice(0, 5).map((act: any, i: number) => (
                                        <div key={act.id} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
                                            {i < activity.length - 1 && i < 4 && (
                                                <div style={{ position: 'absolute', left: '7px', top: '20px', bottom: '-20px', width: '1px', background: colors.border }} />
                                            )}
                                            <div style={{
                                                width: '15px',
                                                height: '15px',
                                                borderRadius: '50%',
                                                background: act.type === 'report' ? colors.teal : colors.text3,
                                                border: `3px solid ${colors.bg}`,
                                                boxShadow: `0 0 0 1px ${colors.border}`,
                                                flexShrink: 0,
                                                zIndex: 2,
                                                marginTop: '2px'
                                            }} />
                                            <div>
                                                <div style={{ fontSize: '12px', color: colors.text2, lineHeight: 1.5 }}>
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
                                <div style={{ textAlign: 'center', color: colors.text3, fontSize: '13px' }}>
                                    No recent activity.
                                </div>
                            )}
                        </Card>
                    </aside>
                </div>
            </div>

            {/* Sheets */}
            <AddProjectSheet
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                employees={employees}
                project={project}
                onSave={handleSaveProject}
            />
            <ManageTeamSheet
                isOpen={isManageTeamOpen}
                onClose={() => setIsManageTeamOpen(false)}
                project={project}
                employees={employees}
                isSaving={isSavingMembers}
                onSave={async (newMembers) => {
                    setIsSavingMembers(true)
                    const memberIds = newMembers.map((m: any) => m.employee.id)
                    await updateProjectMembersAction(project.id, memberIds)
                    setIsSavingMembers(false)
                    setIsManageTeamOpen(false)
                    router.refresh()
                }}
            />
        </div>
    )
}
