'use client'

import React, { useState, useMemo } from 'react'
import { colors, radius, animation, getScoreColor } from '@/design-system'
import { KPICard, Card, SkillSpider, SkillList, Sparkline, DateRangeSelector } from '@/components/molecules'
import { Icon } from '@/components/atoms'
import { useRouter, useSearchParams } from 'next/navigation'

interface Props {
    data: any
    showDateSelector?: boolean
    allReports?: any[]
}

export function EmployeeDashboardView({ data, showDateSelector = true, allReports }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)

    // Using provided data or providing empty state fallback
    const displayData = data ? data : {
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

    const { me, kpis, goals, skills, history, manager, soonestPeriod, upcomingPeriods, managerSettings } = displayData
    const gracePeriodDays = managerSettings?.gracePeriodDays ?? 0

    // Skill Analysis — filtered by selected goal
    const filteredSkills = useMemo(() => {
        if (!selectedGoalId || !allReports) return skills
        const goalReports = allReports.filter((r: any) => r.goalId === selectedGoalId && !r.isOnLeave)
        if (goalReports.length === 0) return []
        const averages: Record<string, { total: number; count: number }> = {}
        goalReports.forEach((r: any) => {
            ;(r.criterionScores || []).forEach((cs: any) => {
                if (!averages[cs.criterionName]) averages[cs.criterionName] = { total: 0, count: 0 }
                averages[cs.criterionName].total += Number(cs.score)
                averages[cs.criterionName].count += 1
            })
        })
        return Object.entries(averages).map(([name, data]) => {
            const score = data.total / data.count
            let category: 'strength' | 'neutral' | 'weakness' = 'neutral'
            if (score >= 8.5) category = 'strength'
            else if (score < 7.0) category = 'weakness'
            return { name, score: Number(score.toFixed(1)), maxScore: 10, category }
        }).sort((a, b) => b.score - a.score)
    }, [selectedGoalId, allReports, skills])

    const skillSummaryLabel = useMemo(() => {
        if (!selectedGoalId || !allReports) return null
        const goalReports = allReports.filter((r: any) => r.goalId === selectedGoalId && !r.isOnLeave)
        if (goalReports.length === 0) return null
        const count = goalReports.length
        const dates = goalReports.map((r: any) => new Date(r.submissionDate))
        const minDate = new Date(Math.min(...dates.map((d: Date) => d.getTime())))
        const maxDate = new Date(Math.max(...dates.map((d: Date) => d.getTime())))
        const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const dateRange = minDate.getTime() === maxDate.getTime() ? fmt(minDate) : `${fmt(minDate)} – ${fmt(maxDate)}`
        return `Showing skills from ${count} ${count === 1 ? 'report' : 'reports'} · ${dateRange}`
    }, [selectedGoalId, allReports])

    // Build the list of upcoming items: prefer period data, fall back to goals
    const upcomingItems = useMemo(() => {
        const items: { name: string; project: string; daysUntil: number | null; date: Date; isSubmitted: boolean; hasPeriod: boolean; status: string }[] = []
        const handledGoalIds = new Set<string>()

        const midnightToday = new Date()
        midnightToday.setHours(0,0,0,0)

        // 1. Process from reporting periods (most urgent per goal)
        if (upcomingPeriods && upcomingPeriods.length > 0) {
            const mostRelevantPerGoal: Record<string, any> = {}
            
            // Goals grouping logic - pending/late first, then submitted
            upcomingPeriods.forEach((p: any) => {
                const gid = p.goalId || p.goal_id
                if (!gid) return
                if (!mostRelevantPerGoal[gid]) {
                    mostRelevantPerGoal[gid] = p
                } else {
                    const existing = mostRelevantPerGoal[gid]
                    const pPending = p.status === 'pending' || p.status === 'late'
                    const ePending = existing.status === 'pending' || existing.status === 'late'
                    
                    if (pPending && !ePending) {
                        mostRelevantPerGoal[gid] = p
                    } else if (!pPending && !ePending) {
                        if (new Date(p.period_end || p.periodEnd).getTime() > new Date(existing.period_end || existing.periodEnd).getTime()) {
                            mostRelevantPerGoal[gid] = p // keep most recent submitted
                        }
                    }
                }
            })

            Object.values(mostRelevantPerGoal).forEach((p: any) => {
                const gid = p.goalId || p.goal_id
                const goal = goals?.find((g: any) => g.id === gid)
                if (!goal) return
                
                handledGoalIds.add(gid)
                const isSubmitted = p.status === 'submitted'
                const pEnd = p.periodEnd || p.period_end

                let dateToUse = new Date(typeof pEnd === 'string' && !pEnd.includes('T') ? pEnd + 'T12:00:00' : pEnd)
                const freq = goal.projectFrequency || goal.project?.reportFrequency || goal.project?.report_frequency || goal.project?.frequency || 'weekly'
                
                // If the most relevant period is already submitted, the *next* report is due one frequency after its end date.
                if (isSubmitted) {
                    if (freq === 'daily') dateToUse.setDate(dateToUse.getDate() + 1)
                    else if (freq === 'biweekly' || freq === 'bi-weekly') dateToUse.setDate(dateToUse.getDate() + 14)
                    else if (freq === 'monthly') dateToUse.setMonth(dateToUse.getMonth() + 1)
                    else dateToUse.setDate(dateToUse.getDate() + 7)
                }
                
                const midnightDeadline = new Date(dateToUse)
                midnightDeadline.setHours(0,0,0,0)
                
                const days = Math.round((midnightDeadline.getTime() - midnightToday.getTime()) / (1000 * 60 * 60 * 24))
                
                items.push({
                    name: goal.name,
                    project: goal.project || goal.projectName || '',
                    daysUntil: days,
                    date: dateToUse,
                    isSubmitted,
                    hasPeriod: true,
                    status: goal.status
                })
            })
        }

        // 2. Fallback to goals with deadlines
        (goals || []).forEach((g: any) => {
            if (handledGoalIds.has(g.id) || !g.deadline) return
            
            const deadline = new Date(typeof g.deadline === 'string' && !g.deadline.includes('T') ? g.deadline + 'T12:00:00' : g.deadline)
            const midnightDeadline = new Date(deadline)
            midnightDeadline.setHours(0,0,0,0)
            
            const days = Math.round((midnightDeadline.getTime() - midnightToday.getTime()) / (1000 * 60 * 60 * 24))
            
            items.push({
                name: g.name,
                project: g.project || g.projectName || '',
                daysUntil: days,
                date: deadline,
                isSubmitted: false,
                hasPeriod: false,
                status: g.status
            })
        })

        // Filter out completed/archived goals from showing up unless they have a pending period
        return items.filter(item => item.status === 'active' || item.daysUntil !== null)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
    }, [upcomingPeriods, goals, gracePeriodDays])

    // Update nextDueLabel based on our refined upcoming items
    const nextDueLabel = useMemo(() => {
        if (upcomingItems.length > 0) {
            const soonest = upcomingItems[0]
            if (soonest.daysUntil !== null) {
                if (soonest.daysUntil < 0 && !soonest.isSubmitted) return `Overdue by ${Math.abs(soonest.daysUntil)}d`
                if (soonest.daysUntil === 0) return 'Due Today'
                if (soonest.isSubmitted) return soonest.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                return `${soonest.daysUntil}d`
            }
        }
        
        // Fallback to KPI value from dashboard service
        const kpiValue = kpis?.find((k: any) => k.label?.toLowerCase() === 'next report due')?.value
        if (kpiValue && kpiValue !== 'N/A') return kpiValue
        
        return 'N/A'
    }, [upcomingItems, kpis])

    return (
        <div style={{ width: '100%', animation: animation.keyframes.fadeUp, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {showDateSelector && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>
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
                </div>
            )}

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
                    <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.15, marginBottom: '4px' }}>{me.name}</div>
                    <div style={{ fontSize: '12.5px', color: colors.text2, marginBottom: '3px' }}>
                        {goals.length} {goals.length === 1 ? 'Goal' : 'Goals'} · {new Set(goals.map((g: any) => g.project).filter(Boolean)).size} {new Set(goals.map((g: any) => g.project).filter(Boolean)).size === 1 ? 'Project' : 'Projects'}
                    </div>
                    {manager && (
                        <div style={{ fontSize: '12px', color: colors.text3 }}>
                            Reports to <span style={{ color: colors.text2, fontWeight: 600 }}>{manager.name}</span>
                        </div>
                    )}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Average score</div>
                    {me.baselineRequired ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', height: '100%' }}>
                            <span style={{ fontSize: '15px', fontWeight: 700, color: colors.text2, background: colors.surface2, padding: '4px 12px', borderRadius: '20px', border: `1px solid ${colors.border}` }}>
                                Building Baseline
                            </span>
                            <span style={{ fontSize: '10.5px', color: colors.text3, marginTop: '8px' }}>Requires 3+ reports</span>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', justifyContent: 'flex-end' }}>
                                <span style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, color: getScoreColor(me.currentScore) }}>{me.currentScore}</span>
                                <span style={{ fontSize: '16px', fontWeight: 600, color: colors.text3 }}>/10</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '12px', fontWeight: 700, color: me.delta >= 0 ? colors.green : colors.warn, justifyContent: 'flex-end' }}>
                                <Icon name={me.delta >= 0 ? "chevronUp" : "chevronDown"} size={11} />
                                {Math.abs(me.delta)} vs last report
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── KPI Grid ─────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {kpis.map((kpi: any, i: number) => {
                    // Accuracy fix: if this is the "Next report due" card, use our computed label
                    const displayValue = kpi.label?.toLowerCase() === 'next report due' ? nextDueLabel : kpi.value
                    
                    return (
                        <KPICard
                            key={i}
                            label={kpi.label}
                            icon={kpi.icon as any}
                            value={displayValue}
                            deltaLabel={kpi.meta}
                            variant={i === 0 ? 'accent' : (i === 1 ? 'accent' : i === 2 ? 'green' : 'warn')}
                        />
                    )
                })}
            </div>

            {/* ── Main Content Grid ─────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', alignItems: 'start' }}>

                {/* LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Trend Card */}
                    <Card title="Score trend" subtitle={`${me.trend.length} reports`} icon="chart">
                        <div style={{ padding: '0 4px 10px' }}>
                            {me.baselineRequired ? (
                                <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.text3, fontSize: '12px', background: colors.surface2, borderRadius: radius.md, margin: '0 10px' }}>
                                    Trend requires 3+ reports
                                </div>
                            ) : (
                                <Sparkline scores={me.trend} weeks={me.weeks} />
                            )}
                        </div>
                    </Card>

                    {/* Skill Analysis Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                        <Card
                            title="Skill Analysis"
                            icon="target"
                            action={
                                goals.length > 0 ? (
                                    <select
                                        value={selectedGoalId ?? ''}
                                        onChange={e => setSelectedGoalId(e.target.value || null)}
                                        style={{
                                            background: colors.surface2,
                                            border: `1px solid ${colors.border}`,
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
                                        {goals.filter((g: any) => g.status === 'active').map((g: any) => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                ) : undefined
                            }
                        >
                            {skillSummaryLabel && (
                                <div style={{
                                    fontSize: '11.5px',
                                    color: colors.text3,
                                    marginBottom: '16px',
                                    padding: '6px 10px',
                                    background: colors.surface2,
                                    borderRadius: '8px',
                                    border: `1px solid ${colors.border}`,
                                    display: 'inline-block',
                                }}>
                                    {skillSummaryLabel}
                                </div>
                            )}
                            {me.baselineRequired ? (
                                <div style={{ padding: '40px 20px', textAlign: 'center', color: colors.text3, fontSize: '13px' }}>
                                    Skill breakdown requires at least 3 reports to establish a baseline.
                                </div>
                            ) : filteredSkills.length === 0 ? (
                                <div style={{ padding: '40px 20px', textAlign: 'center', color: colors.text3, fontSize: '13px' }}>
                                    No reports with skill data found for this goal.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '28px', alignItems: 'start' }}>
                                    <SkillSpider skills={filteredSkills} size={240} />
                                    <div style={{ borderLeft: `1px solid ${colors.border}`, paddingLeft: '28px' }}>
                                        <SkillList skills={filteredSkills} />
                                    </div>
                                </div>
                            )}
                        </Card>

                    </div>

                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: 56 }}>

                    {/* Upcoming Card */}
                    <Card title="Upcoming reports" icon="clock">
                        {(() => {
                            if (nextDueLabel === 'N/A') return null
                            const isOverdue = nextDueLabel === 'Overdue'
                            return (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
                                    background: isOverdue ? colors.dangerGlow : colors.warnGlow,
                                    border: `1px solid ${isOverdue ? colors.danger : colors.warn}30`,
                                    borderRadius: radius.xl,
                                    marginBottom: '16px'
                                }}>
                                    <Icon name={isOverdue ? "alert" : "calendar"} size={14} color={isOverdue ? colors.danger : colors.warn} />
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 800, color: isOverdue ? colors.danger : colors.warn }}>Next report due</div>
                                        <div style={{ fontSize: '11px', color: isOverdue ? `${colors.danger}90` : `${colors.warn}90` }}>
                                            {nextDueLabel === 'Today' || nextDueLabel === 'Overdue' ? nextDueLabel : `In ${nextDueLabel}`}
                                        </div>
                                    </div>
                                </div>
                            )
                        })()}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {upcomingItems.slice(0, 3).map((item: any, i: number) => {
                                const d = item.daysUntil
                                return (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: colors.surface2, borderRadius: radius.lg }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 600, textDecoration: item.isSubmitted ? 'line-through' : 'none', opacity: item.isSubmitted ? 0.7 : 1 }}>
                                                {item.name.length > 24 ? item.name.substring(0, 21) + '...' : item.name}
                                            </span>
                                            <span style={{ fontSize: '11px', color: colors.text3 }}>{item.project}</span>
                                        </div>
                                        {item.isSubmitted ? (
                                            <div style={{
                                                fontSize: '11px', fontWeight: 800, color: colors.green, background: colors.greenGlow, padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px'
                                            }}>
                                                <Icon name="check" size={10} /> Submitted
                                            </div>
                                        ) : d !== null ? (
                                            <div style={{
                                                fontSize: '11px',
                                                fontWeight: 800,
                                                color: d < 0 ? colors.danger : (d === 0 ? colors.warn : colors.text3),
                                                background: d < 0 ? colors.dangerGlow : (d === 0 ? colors.warnGlow : colors.surface3),
                                                padding: '2px 8px',
                                                borderRadius: '12px'
                                            }}>
                                                {d < 0 ? 'Overdue' : d === 0 ? 'Today' : `${d}d`}
                                            </div>
                                        ) : (
                                            <Badge variant="accent">Active</Badge>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </Card>


                </div>
            </div>
        </div>
    )
}
