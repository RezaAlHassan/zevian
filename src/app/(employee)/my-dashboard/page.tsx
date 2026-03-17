'use client'

import React, { useState, useEffect } from 'react'
import { colors, typography, radius, animation, getScoreColor, layout } from '@/design-system'
import { KPICard, Card, SkillSpider, SkillList, Sparkline, SectionLabel } from '@/components/molecules'
import { Icon, Button, Badge } from '@/components/atoms'
import { getDashboardDataAction } from '../../actions/dashboardActions'

export default function EmployeeDashboardPage() {
    const [openGoal, setOpenGoal] = useState<number | null>(null)
    const [openOrg, setOpenOrg] = useState<number | null>(null)
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadData() {
            try {
                const res: any = await getDashboardDataAction()
                if (res.error) {
                    setError(res.error)
                } else {
                    setData(res)
                }
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    if (loading) {
        return (
            <div style={{ padding: layout.contentPadding, textAlign: 'center', color: colors.text3 }}>
                Loading your dashboard...
            </div>
        )
    }

    // If error or no data, use an empty state fallback
    const displayData = data && !error ? data : {
        me: { initials: 'NA', name: 'No Data Available', role: '', team: '', currentScore: 0, delta: 0, trend: [], weeks: [] },
        kpis: [
            { label: "Reports Completed", value: 0, icon: "goals", meta: "No data" },
            { label: "On-time Delivery", value: 0, icon: "clock", meta: "No data" },
            { label: "Overall Score", value: 0, icon: "star", meta: "No data" },
            { label: "Late Items", value: 0, icon: "alert", meta: "No data" }
        ],
        goals: [],
        skills: [],
        history: [],
        manager: null
    }

    const { me, kpis, goals, skills, history, manager } = displayData


    return (
        <div style={{ padding: layout.contentPadding, width: '100%', animation: animation.keyframes.fadeUp }}>

            {/* ── Hero Banner ──────────────────────── */}
            <div style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: radius['3xl'],
                padding: '24px 28px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{
                    width: '56px', height: '56px', borderRadius: '14px',
                    background: `linear-gradient(135deg, ${colors.accent}, ${colors.purple})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', fontWeight: 800, color: '#fff',
                    boxShadow: '0 0 24px rgba(91,127,255,0.3)',
                }}>
                    {me.initials}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: colors.text3, marginBottom: '3px' }}>Welcome back 👋</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.15, marginBottom: '4px' }}>{me.name}</div>
                    <div style={{ fontSize: '12.5px', color: colors.text2 }}>{me.role} · {me.team}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Average score</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, color: getScoreColor(me.currentScore) }}>{me.currentScore}</span>
                        <span style={{ fontSize: '16px', fontWeight: 600, color: colors.text3 }}>/10</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '12px', fontWeight: 700, color: me.delta >= 0 ? colors.green : colors.warn, justifyContent: 'flex-end' }}>
                        <Icon name={me.delta >= 0 ? "chevronUp" : "chevronDown"} size={11} />
                        {me.delta >= 0 ? `+${me.delta}` : me.delta} vs last report
                    </div>
                </div>
            </div>

            {/* ── KPI Grid ─────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {kpis.map((kpi: any, i: number) => (
                    <KPICard
                        key={i}
                        label={kpi.label}
                        icon={kpi.icon as any}
                        value={kpi.value}
                        deltaLabel={kpi.meta}
                        variant={i === 0 ? 'accent' : (i === 1 ? 'accent' : i === 2 ? 'green' : 'warn')}
                    />
                ))}
            </div>

            {/* ── Main Content Grid ─────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', alignItems: 'start' }}>

                {/* LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Trend Card */}
                    <Card title="Score trend" subtitle={`${me.trend.length} reports`} icon="chart">
                        <div style={{ padding: '0 4px 10px' }}>
                            <Sparkline scores={me.trend} weeks={me.weeks} />
                        </div>
                    </Card>

                    {/* Goals & Skills Tabs Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                        <Card title="Skill Analysis" icon="target">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'center' }}>
                                <SkillSpider skills={skills} size={240} />
                                <div style={{ borderLeft: `1px solid ${colors.border}`, paddingLeft: '24px' }}>
                                    <SectionLabel>Skill Breakdown</SectionLabel>
                                    <SkillList skills={skills} />
                                </div>
                            </div>
                        </Card>

                        <Card title="Goals & Criteria" icon="target" action={<span style={{ fontSize: '12px', color: colors.accent, cursor: 'pointer' }}>View all →</span>}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {goals.map((goal: any, i: number) => (
                                    <div key={i} style={{ borderBottom: i === goals.length - 1 ? 'none' : `1px solid ${colors.border}`, paddingBottom: '16px', marginBottom: '8px' }}>
                                        <div
                                            onClick={() => setOpenGoal(openGoal === i ? null : i)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                                                padding: '12px', borderRadius: radius.lg, background: colors.surface2,
                                                border: `1px solid ${openGoal === i ? colors.borderHover : colors.border}`
                                            }}
                                        >
                                            <div style={{ width: '36px', height: '36px', borderRadius: radius.md, background: colors.surface3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                                {goal.icon}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '14px', fontWeight: 600 }}>{goal.name}</div>
                                                <div style={{ fontSize: '12px', color: colors.text3 }}>{goal.project}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '18px', fontWeight: 800, color: getScoreColor(goal.score) }}>{goal.score.toFixed(1)}</div>
                                                <div style={{ fontSize: '11px', color: colors.text3 }}>{goal.reports} reports</div>
                                            </div>
                                        </div>
                                        {openGoal === i && (
                                            <div style={{ marginTop: '10px', padding: '12px', background: colors.surface3, borderRadius: radius.md, animation: animation.keyframes.fadeUp }}>
                                                {goal.criteria.map((c: any, ci: number) => (
                                                    <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: ci === goal.criteria.length - 1 ? 0 : '10px' }}>
                                                        <span style={{ fontSize: '12px', color: colors.text2, flex: 1 }}>{c.name} <span style={{ color: colors.text3, fontSize: '10px' }}>{c.w}%</span></span>
                                                        <div style={{ width: '80px', height: '4px', background: colors.surface2, borderRadius: '2px', overflow: 'hidden' }}>
                                                            <div style={{ height: '100%', width: `${c.score * 10}%`, background: getScoreColor(c.score) }} />
                                                        </div>
                                                        <span style={{ fontSize: '12px', fontWeight: 800, color: getScoreColor(c.score), minWidth: '24px', textAlign: 'right' }}>{c.score.toFixed(1)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* History Card */}
                    <Card title="Report history" icon="clock" action={<span style={{ fontSize: '12px', color: colors.accent, cursor: 'pointer' }}>View all →</span>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {history.map((report: any, i: number) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 14px', borderRadius: radius.md, borderBottom: `1px solid ${colors.border}` }}>
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: colors.text2, width: '100px' }}>{report.date}</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text, flex: 1 }}>{report.goal}</span>
                                    <span style={{ fontSize: '14px', fontWeight: 800, color: getScoreColor(report.score) }}>{report.score.toFixed(1)}</span>
                                    <Badge variant="green">Reviewed</Badge>
                                </div>
                            ))}
                        </div>
                    </Card>

                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: layout.headerHeight }}>

                    {/* Upcoming Card */}
                    <Card title="Upcoming reports" icon="clock">
                        {kpis.find((k: any) => k.label === 'Next report due')?.value !== 'N/A' && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                                background: colors.warnGlow, border: `1px solid ${colors.warn}30`, borderRadius: radius.xl,
                                marginBottom: '16px'
                            }}>
                                <Icon name="calendar" size={14} color={colors.warn} />
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: colors.warn }}>Next report due</div>
                                    <div style={{ fontSize: '11px', color: `${colors.warn}90` }}>In {kpis.find((k: any) => k.label === 'Next report due')?.value}</div>
                                </div>
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {goals.slice(0, 2).map((goal: any, i: number) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: colors.surface2, borderRadius: radius.lg }}>
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{goal.name.length > 20 ? goal.name.substring(0, 17) + '...' : goal.name}</span>
                                    <Badge variant="accent">Active</Badge>
                                </div>
                            ))}
                        </div>
                    </Card>


                    {/* Manager Card */}
                    <Card title="Reports to" icon="user">
                        {manager ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: colors.surface2, borderRadius: radius.xl }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: radius.lg,
                                    background: `linear-gradient(135deg, ${colors.accent}, ${colors.purple})`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '14px', fontWeight: 800, color: '#fff'
                                }}>
                                    {manager.initials}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13.5px', fontWeight: 700 }}>{manager.name}</div>
                                    <div style={{ fontSize: '11px', color: colors.text3 }}>{manager.title}</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ fontSize: '12px', color: colors.text3, padding: '10px' }}>No manager assigned</div>
                        )}
                    </Card>

                </div>
            </div>
        </div>
    )
}
