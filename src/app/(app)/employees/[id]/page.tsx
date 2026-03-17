'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { colors, radius, typography, animation, getAvatarGradient, getInitials, getScoreColor, shadows } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms'
import { ScoreDisplay, MiniBar, ScoreBar } from '@/components/atoms/Score'
import { StatusPill } from '@/components/atoms/StatusPill'
import { SkillSpider, DateRangeSelector } from '@/components/molecules'

// This would normally come from an API or shared store
const mockEmployees: any[] = [
    {
        id: 'e1',
        name: 'James Mitchell',
        initials: 'JM',
        title: 'Engineering Manager',
        dept: 'Engineering',
        role: 'owner',
        online: true,
        manager: null,
        joined: 'Jan 2023',
        email: 'james@acme.io',
        avgScore: 8.4,
        trend: 0.3,
        scores: [7.8, 8.0, 8.1, 8.3, 8.4],
        reportCount: 18,
        goalCount: 3,
        lastReport: 'Mar 6, 2026',
        summary: 'James is a consistently high performer who balances technical leadership with strong team development. Code review velocity and architecture documentation are standout strengths this quarter.',
        goals: [
            {
                name: 'Eng Team Leadership',
                project: 'Sprint Alpha v2',
                icon: '&#9889;',
                score: 8.6,
                criteria: [
                    { name: 'Code Review Velocity', weight: 30, score: 9.1 },
                    { name: 'Team Unblocking', weight: 35, score: 8.4 },
                    { name: 'Documentation', weight: 20, score: 8.8 },
                    { name: '1:1 Effectiveness', weight: 15, score: 8.0 }
                ]
            }
        ],
        reports: [
            { date: 'Mar 6, 2026', goal: 'Eng Team Leadership', score: 8.8, status: 'reviewed' },
            { date: 'Feb 27, 2026', goal: 'Eng Team Leadership', score: 8.4, status: 'reviewed' }
        ],
        activity: [
            { dot: '#10b981', text: '<strong>James Mitchell</strong> submitted Eng Leadership report', time: '2d ago' },
            { dot: '#5b7fff', text: '<strong>Zevian AI</strong> scored report &mdash; overall 8.8', time: '2d ago' }
        ]
    },
    {
        id: 'e2',
        name: 'Sofia Mercer',
        initials: 'SM',
        title: 'Senior Engineer',
        dept: 'Engineering',
        role: 'employee',
        online: true,
        manager: 'James Mitchell',
        joined: 'Mar 2023',
        email: 'sofia@acme.io',
        avgScore: 8.6,
        trend: 0.4,
        scores: [7.9, 8.1, 8.3, 8.5, 8.6],
        reportCount: 16,
        goalCount: 2,
        lastReport: 'Mar 5, 2026',
        summary: 'Sofia is the strongest individual contributor on the engineering team this week. Exceptional code quality and test coverage. Delivery speed is the one area with room for improvement.',
        goals: [
            {
                name: 'Code Quality & Delivery',
                project: 'Sprint Alpha v2',
                icon: '&#9889;',
                score: 8.6,
                criteria: [
                    { name: 'Code Quality', weight: 35, score: 9.1 },
                    { name: 'Test Coverage', weight: 30, score: 8.8 }
                ]
            }
        ],
        reports: [
            { date: 'Mar 5, 2026', goal: 'Code Quality', score: 8.6, status: 'scored' }
        ],
        activity: [
            { dot: '#10b981', text: '<strong>Sofia Mercer</strong> submitted Code Quality report', time: '2d ago' }
        ]
    },
    {
        id: 'e5',
        name: 'Lucas Park',
        initials: 'LP',
        title: 'Backend Engineer',
        dept: 'Engineering',
        role: 'employee',
        online: false,
        manager: 'James Mitchell',
        joined: 'Nov 2023',
        email: 'lucas@acme.io',
        avgScore: 5.3,
        trend: -0.8,
        scores: [6.8, 6.4, 6.1, 5.7, 5.3],
        reportCount: 10,
        goalCount: 1,
        lastReport: 'Mar 3, 2026',
        summary: 'Lucas is struggling with test coverage and documentation standards. Three consecutive weekly declines have triggered an at-risk flag.',
        goals: [
            {
                name: 'Code Quality & Delivery',
                project: 'Backend Refactor',
                icon: '&#128295;',
                score: 5.3,
                criteria: [
                    { name: 'Code Quality', weight: 35, score: 5.8 },
                    { name: 'Test Coverage', weight: 30, score: 4.2 }
                ]
            }
        ],
        reports: [],
        activity: []
    }
]

export default function EmployeeDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id
    const employee = mockEmployees.find(e => e.id === id)

    const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'reports' | 'activity'>('overview')
    const [isAnalysisGenerated, setIsAnalysisGenerated] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)

    if (!employee) return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2>Employee not found</h2>
            <Button variant="secondary" onClick={() => router.push('/employees')}>Back to List</Button>
        </div>
    )

    const handleGenerateAnalysis = () => {
        setIsGenerating(true)
        setTimeout(() => {
            setIsGenerating(false)
            setIsAnalysisGenerated(true)
        }, 1500)
    }

    const mockSkills: { name: string; score: number; maxScore: number; category: 'strength' | 'weakness' | 'neutral' }[] = [
        { name: 'Strategic Thinking', score: 8.5, maxScore: 10, category: 'strength' },
        { name: 'Collaboration', score: 9.0, maxScore: 10, category: 'strength' },
        { name: 'Technical Depth', score: 7.2, maxScore: 10, category: 'neutral' },
        { name: 'Mentorship', score: 6.5, maxScore: 10, category: 'weakness' },
        { name: 'Project Delivery', score: 8.8, maxScore: 10, category: 'strength' },
        { name: 'Agile Process', score: 5.8, maxScore: 10, category: 'weakness' },
    ]

    return (
        <div className="fade-in" style={{ background: colors.bg, minHeight: '100vh' }}>
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
                </div>
                <div style={{ flex: 1 }} />
            </header>

            <div style={{ padding: '0 28px 60px' }}>
                {/* Page Header / Hero Component */}
                <div style={{
                    margin: '0 -28px 28px',
                    padding: '32px 28px',
                    background: `linear-gradient(135deg, ${colors.accentGlow}, ${colors.tealGlow})`,
                    borderBottom: `1px solid ${colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '16px',
                            background: getAvatarGradient(employee.name),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            fontWeight: 800,
                            color: '#fff',
                            boxShadow: shadows.cardHover
                        }}>
                            {getInitials(employee.name)}
                        </div>
                        <div>
                            <h1 style={{ fontSize: '28px', fontWeight: 800, color: colors.text, marginBottom: '4px', letterSpacing: '-0.5px' }}>{employee.name}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ fontSize: '14px', color: colors.text2 }}>{employee.title}</div>
                                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: colors.border }} />
                                <div style={{
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    background: employee.role === 'owner' ? colors.purpleGlow : colors.accentGlow,
                                    color: employee.role === 'owner' ? colors.purple : colors.accent
                                }}>
                                    {employee.role}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: '12px 16px', textAlign: 'center', minWidth: '100px' }}>
                                <div style={{ fontSize: '9px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', marginBottom: '2px' }}>Avg Score</div>
                                <div style={{ fontSize: '20px', fontWeight: 800, color: getScoreColor(employee.avgScore) }}>{employee.avgScore.toFixed(1)}</div>
                            </div>
                            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.lg, padding: '12px 16px', textAlign: 'center', minWidth: '100px' }}>
                                <div style={{ fontSize: '9px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', marginBottom: '2px' }}>Goals</div>
                                <div style={{ fontSize: '20px', fontWeight: 800, color: colors.text }}>{employee.goalCount}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '28px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '32px', borderBottom: `1px solid ${colors.border}` }}>
                            {[
                                { id: 'overview', label: 'Overview', icon: 'sparkles' },
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
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                                    {/* AI Summary */}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Icon name="sparkles" size={14} color={colors.accent} />
                                                <span style={{ fontSize: '10.5px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Performance Summary</span>
                                            </div>
                                            <DateRangeSelector />
                                        </div>
                                        <div style={{
                                            background: colors.accentGlow,
                                            border: `1px solid ${colors.accent}20`,
                                            borderRadius: radius.xl,
                                            padding: '24px',
                                            fontSize: '14.5px',
                                            lineHeight: 1.6,
                                            color: colors.text2
                                        }}>
                                            {employee.summary}
                                        </div>
                                    </div>

                                    {/* Skills Section */}
                                    <div style={{ background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: radius.xl, padding: '32px' }}>
                                        {!isAnalysisGenerated ? (
                                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                                <Icon name="sparkles" size={32} color={`${colors.accent}40`} style={{ marginBottom: '16px' }} />
                                                <div style={{ fontSize: '16px', fontWeight: 700, color: colors.text, marginBottom: '8px' }}>Detailed Skill Mapping</div>
                                                <div style={{ fontSize: '14px', color: colors.text3, marginBottom: '24px', maxWidth: '360px', margin: '0 auto 24px' }}>
                                                    Generate an AI-powered skill analysis based on recent goal completions and organizational metrics.
                                                </div>
                                                <Button variant="primary" loading={isGenerating} onClick={handleGenerateAnalysis} icon="sparkles">
                                                    {isGenerating ? 'Analyzing...' : 'Generate Skill Analysis'}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="fade-in">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px', justifyContent: 'center' }}>
                                                    <Icon name="sparkles" size={16} color={colors.accent} />
                                                    <span style={{ fontSize: '12px', fontWeight: 800, color: colors.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Skill Analysis</span>
                                                </div>
                                                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                                                    <SkillSpider skills={mockSkills} size={320} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'goals' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    {employee.goals.map((goal: any, i: number) => (
                                        <div key={i} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.xl, padding: '20px' }}>
                                            <div style={{ fontSize: '14px', fontWeight: 700, color: colors.text, marginBottom: '4px' }}>{goal.name}</div>
                                            <div style={{ fontSize: '12px', color: colors.text3, marginBottom: '16px' }}>{goal.project}</div>
                                            <div style={{ fontSize: '10px', color: colors.text3, textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Overall Progress</div>
                                            <ScoreBar score={goal.score} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius.xl, padding: '24px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '20px' }}>Employee Information</div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <div style={{ fontSize: '9px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', marginBottom: '4px' }}>Reporting To</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: colors.accentGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: colors.accent }}>JM</div>
                                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: colors.text }}>{employee.manager || 'James Mitchell'}</div>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '9px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', marginBottom: '4px' }}>Contact Email</div>
                                    <div style={{ fontSize: '13px', color: colors.text2 }}>{employee.email}</div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '9px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', marginBottom: '4px' }}>Joined Date</div>
                                    <div style={{ fontSize: '13px', color: colors.text2 }}>{employee.joined}</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <style jsx>{`
                .fade-in {
                    animation: fadeIn 0.5s ease both;
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
