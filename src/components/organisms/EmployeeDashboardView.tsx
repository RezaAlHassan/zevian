'use client'

import React, { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { colors, radius, animation, getScoreColor } from '@/design-system'
import { KPICard, Card, SkillSpider, SkillList, Sparkline, DateRangeSelector, Modal } from '@/components/molecules'
import { getSkillCategory } from '@/lib/skillThresholds'
import { Icon, Badge } from '@/components/atoms'
import { useRouter, useSearchParams } from 'next/navigation'

interface Props {
    data: any
    showDateSelector?: boolean
    allReports?: any[]
    selectedGoalId?: string | null
    onGoalChange?: (id: string | null) => void
    orgMetricNames?: string[]
    viewMode?: 'self' | 'detail'
}

export function EmployeeDashboardView({ data, showDateSelector = true, allReports, selectedGoalId: externalGoalId, onGoalChange, orgMetricNames: propOrgMetricNames, viewMode = 'self' }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const isControlled = externalGoalId !== undefined

    const [internalGoalId, setInternalGoalId] = useState<string | null>(null)
    const [showAllTrend, setShowAllTrend] = useState(false)
    const [selectedReport, setSelectedReport] = useState<any>(null)

    const effectiveGoalId = isControlled ? externalGoalId : internalGoalId
    const handleGoalChange = isControlled
        ? (id: string | null) => onGoalChange?.(id)
        : setInternalGoalId

    const displayData = data ? data : {
        me: { initials: 'NA', name: 'No Data Available', role: '', team: '', currentScore: 0, delta: 0, trend: [], weeks: [] },
        kpis: [],
        goals: [],
        skills: [],
        history: [],
        manager: null
    }

    const { me, kpis, goals, skills: rawSkills, history, manager, soonestPeriod, upcomingPeriods, managerSettings } = displayData
    const gracePeriodDays = managerSettings?.gracePeriodDays ?? 0
    const activeGoals = useMemo(() => goals.filter((g: any) => g.status === 'active'), [goals])
    const filteredGoals = useMemo(
        () => effectiveGoalId ? goals.filter((g: any) => g.id === effectiveGoalId) : goals,
        [goals, effectiveGoalId]
    )
    const filteredReports = useMemo(() => {
        const reports = (allReports || []).filter((r: any) => !r.isOnLeave)
        const scoped = effectiveGoalId ? reports.filter((r: any) => r.goalId === effectiveGoalId) : reports
        return [...scoped].sort((a: any, b: any) =>
            new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()
        )
    }, [allReports, effectiveGoalId])
    const filteredScoredReports = useMemo(
        () => filteredReports.filter((r: any) => (r.managerOverallScore ?? r.evaluationScore) != null),
        [filteredReports]
    )
    const filteredUpcomingPeriods = useMemo(
        () => effectiveGoalId
            ? (upcomingPeriods || []).filter((p: any) => (p.goalId || p.goal_id) === effectiveGoalId)
            : (upcomingPeriods || []),
        [upcomingPeriods, effectiveGoalId]
    )

    const orgMetricSet = useMemo(() => {
        const names = propOrgMetricNames
            ?? (displayData.organization?.customMetrics || []).map((m: any) => m.name)
        return new Set<string>(names)
    }, [propOrgMetricNames, displayData.organization])

    const skills = useMemo(
        () => rawSkills.filter((s: any) => !orgMetricSet.has(s.name)),
        [rawSkills, orgMetricSet]
    )

    const trendData = useMemo(() => {
        if (filteredScoredReports.length === 0) {
            return {
                reports: [],
                scores: effectiveGoalId ? [] : (me.trend || []),
                dates: effectiveGoalId ? [] : (me.weeks || []),
                tooltips: undefined,
                total: effectiveGoalId ? 0 : (me.trend || []).length,
            }
        }

        const total = filteredScoredReports.length
        const sliced = showAllTrend ? filteredScoredReports : filteredScoredReports.slice(0, 8)
        const chronological = [...sliced].reverse()

        const scores = chronological.map((r: any) =>
            Number(Number(r.managerOverallScore ?? r.evaluationScore).toFixed(1))
        )

        const dates = chronological.map((r: any) => {
            const d = r.submittedForDate || r.submissionDate
            try { return format(new Date(d.length === 10 ? d + 'T12:00:00' : d), 'MMM d') } catch { return '?' }
        })

        const tooltips = chronological.map((r: any) => ({
            score: Number(Number(r.managerOverallScore ?? r.evaluationScore).toFixed(1)),
            goalName: r.goals?.name || 'Unknown Goal',
            date: (() => {
                const d = r.submittedForDate || r.submissionDate
                try { return format(new Date(d.length === 10 ? d + 'T12:00:00' : d), 'MMMM d, yyyy') } catch { return d }
            })(),
        }))
        return { reports: chronological, scores, dates, tooltips, total }
    }, [filteredScoredReports, effectiveGoalId, showAllTrend, me.trend, me.weeks])

    const filteredSkills = useMemo(() => {
        if (!effectiveGoalId || !allReports) return skills
        if (filteredReports.length === 0) return []
        const averages: Record<string, { total: number; count: number }> = {}
        filteredReports.forEach((r: any) => {
            ;(r.criterionScores || []).forEach((cs: any) => {
                if (!averages[cs.criterionName]) averages[cs.criterionName] = { total: 0, count: 0 }
                averages[cs.criterionName].total += Number(cs.score)
                averages[cs.criterionName].count += 1
            })
        })
        return Object.entries(averages)
            .filter(([name]) => !orgMetricSet.has(name))
            .map(([name, data]) => {
                const score = data.total / data.count
                return { name, score: Number(score.toFixed(1)), maxScore: 10, category: getSkillCategory(score) }
            }).sort((a, b) => b.score - a.score)
    }, [effectiveGoalId, allReports, filteredReports, skills, orgMetricSet])

    const skillSummaryLabel = useMemo(() => {
        if (!effectiveGoalId || filteredReports.length === 0) return null
        const count = filteredReports.length
        const dates = filteredReports.map((r: any) => {
            const d = r.submittedForDate || r.submissionDate
            return new Date(d.length === 10 ? d + 'T12:00:00' : d)
        })
        const minDate = new Date(Math.min(...dates.map((d: Date) => d.getTime())))
        const maxDate = new Date(Math.max(...dates.map((d: Date) => d.getTime())))
        const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const dateRange = minDate.getTime() === maxDate.getTime() ? fmt(minDate) : `${fmt(minDate)} – ${fmt(maxDate)}`
        return `Showing skills from ${count} ${count === 1 ? 'report' : 'reports'} · ${dateRange}`
    }, [effectiveGoalId, filteredReports])

    const scopedAverageScore = useMemo(() => {
        if (!effectiveGoalId || filteredScoredReports.length === 0) return me.currentScore
        const total = filteredScoredReports.reduce((sum: number, report: any) =>
            sum + Number(report.managerOverallScore ?? report.evaluationScore ?? 0), 0
        )
        return Number((total / filteredScoredReports.length).toFixed(1))
    }, [effectiveGoalId, filteredScoredReports, me.currentScore])

    const scopedDelta = useMemo(() => {
        if (!effectiveGoalId || filteredScoredReports.length === 0) return me.delta
        const latest = Number(filteredScoredReports[0].managerOverallScore ?? filteredScoredReports[0].evaluationScore ?? 0)
        const previous = filteredScoredReports.length > 1
            ? Number(filteredScoredReports[1].managerOverallScore ?? filteredScoredReports[1].evaluationScore ?? 0)
            : latest
        return Number((latest - previous).toFixed(1))
    }, [effectiveGoalId, filteredScoredReports, me.delta])

    const upcomingItems = useMemo(() => {
        const items: { name: string; project: string; daysUntil: number | null; date: Date; isSubmitted: boolean; hasPeriod: boolean; status: string }[] = []
        const handledGoalIds = new Set<string>()

        const midnightToday = new Date()
        midnightToday.setHours(0,0,0,0)

        if (filteredUpcomingPeriods.length > 0) {
            const mostRelevantPerGoal: Record<string, any> = {}

            filteredUpcomingPeriods.forEach((p: any) => {
                const gid = p.goalId || p.goal_id
                if (!gid) return
                if (!mostRelevantPerGoal[gid]) {
                    mostRelevantPerGoal[gid] = p
                } else {
                    const existing = mostRelevantPerGoal[gid]
                    const pPending = p.status === 'pending' || p.status === 'missed'
                    const ePending = existing.status === 'pending' || existing.status === 'missed'

                    if (pPending && !ePending) {
                        mostRelevantPerGoal[gid] = p
                    } else if (!pPending && !ePending) {
                        if (new Date(p.period_end || p.periodEnd).getTime() > new Date(existing.period_end || existing.periodEnd).getTime()) {
                            mostRelevantPerGoal[gid] = p
                        }
                    }
                }
            })

            Object.values(mostRelevantPerGoal).forEach((p: any) => {
                const gid = p.goalId || p.goal_id
                const goal = filteredGoals?.find((g: any) => g.id === gid)
                if (!goal) return

                handledGoalIds.add(gid)
                const isSubmitted = p.status === 'submitted'
                const pEnd = p.periodEnd || p.period_end

                let dateToUse = new Date(typeof pEnd === 'string' && !pEnd.includes('T') ? pEnd + 'T12:00:00' : pEnd)
                const freq = goal.projectFrequency || goal.project?.reportFrequency || goal.project?.report_frequency || goal.project?.frequency || 'weekly'

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

        filteredGoals.forEach((g: any) => {
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

        return items.filter(item => item.status === 'active' || item.daysUntil !== null)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
    }, [filteredUpcomingPeriods, filteredGoals, gracePeriodDays])

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

        if (effectiveGoalId) return 'N/A'

        const kpiValue = kpis?.find((k: any) => k.label?.toLowerCase() === 'next report due')?.value
        if (kpiValue && kpiValue !== 'N/A') return kpiValue

        return 'N/A'
    }, [upcomingItems, kpis, effectiveGoalId])

    // ── Detail-view computed values ─────────────────────────────────────────

    const { submittedCount, missedCount, totalCount } = useMemo(() => {
        if (viewMode !== 'detail') return { submittedCount: 0, missedCount: 0, totalCount: 0 }
        const submitted = filteredReports.length
        const missed = filteredUpcomingPeriods.filter((p: any) =>
            p.status === 'missed' || (p.status === 'pending' && new Date(p.period_end ?? p.periodEnd) < new Date())
        ).length
        return { submittedCount: submitted, missedCount: missed, totalCount: submitted + missed }
    }, [viewMode, filteredReports, filteredUpcomingPeriods])

    const trendDirection = useMemo<'Improving' | 'Declining' | 'Stable' | null>(() => {
        if (viewMode !== 'detail') return null
        const scores = trendData.scores
        if (scores.length < 2) return null
        const last4 = scores.slice(-4)
        const mid = Math.ceil(last4.length / 2)
        const avgFirst = last4.slice(0, mid).reduce((a: number, b: number) => a + b, 0) / mid
        const avgSecond = last4.slice(mid).reduce((a: number, b: number) => a + b, 0) / (last4.length - mid)
        const diff = avgSecond - avgFirst
        if (diff > 0.3) return 'Improving'
        if (diff < -0.3) return 'Declining'
        return 'Stable'
    }, [viewMode, trendData.scores])

    const reportTimeline = useMemo(() => {
        if (viewMode !== 'detail') return []
        const items: any[] = []

        filteredReports.forEach((r: any) => {
            const d = r.submittedForDate || r.submissionDate
            items.push({
                type: 'submitted',
                date: new Date(d.length === 10 ? d + 'T12:00:00' : d),
                goalName: r.goals?.name || 'Report',
                score: r.managerOverallScore ?? r.evaluationScore,
                reportId: r.id,
                rawReport: r,
            })
        })

        filteredUpcomingPeriods.filter((p: any) =>
            p.status === 'missed' || (p.status === 'pending' && new Date(p.period_end ?? p.periodEnd) < new Date())
        ).forEach((p: any) => {
            const goalId = p.goal_id || p.goalId
            const goal = filteredGoals?.find((g: any) => g.id === goalId)
            const end = p.period_end || p.periodEnd
            items.push({
                type: 'missed',
                date: new Date(end && !end.includes('T') ? end + 'T12:00:00' : end),
                goalName: goal?.name || 'Unknown goal',
            })
        })

        return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 15)
    }, [viewMode, filteredReports, filteredUpcomingPeriods, filteredGoals])

    // ── Self-view computed values ───────────────────────────────────────────

    const currentStreak = useMemo(() => {
        if (viewMode !== 'self') return 0
        if (filteredUpcomingPeriods.length === 0) return 0
        const now = new Date()
        const pastPeriods = [...filteredUpcomingPeriods]
            .filter((p: any) => {
                const end = p.period_end || p.periodEnd
                return end && new Date(end) <= now
            })
            .sort((a: any, b: any) => {
                const aEnd = new Date(a.period_end || a.periodEnd).getTime()
                const bEnd = new Date(b.period_end || b.periodEnd).getTime()
                return bEnd - aEnd
            })
        let count = 0
        for (const p of pastPeriods) {
            if (p.status === 'submitted') count++
            else break
        }
        return count
    }, [viewMode, filteredUpcomingPeriods])

    const bestCriterionKpi = kpis?.find((k: any) => k.label?.toLowerCase().includes('best criterion') || k.label?.toLowerCase().includes('criterion'))
    const scopedBestCriterion = useMemo(() => {
        if (!effectiveGoalId) {
            return {
                name: bestCriterionKpi?.meta || 'N/A',
                score: bestCriterionKpi ? Number(bestCriterionKpi.value) : 0,
            }
        }

        const averages: Record<string, { total: number; count: number }> = {}
        filteredReports.forEach((report: any) => {
            ;(report.criterionScores || []).forEach((score: any) => {
                if (!averages[score.criterionName]) averages[score.criterionName] = { total: 0, count: 0 }
                averages[score.criterionName].total += Number(score.score)
                averages[score.criterionName].count += 1
            })
        })

        let strongest = { name: 'N/A', score: 0 }
        Object.entries(averages).forEach(([name, value]) => {
            const average = value.total / value.count
            if (average > strongest.score) strongest = { name, score: Number(average.toFixed(1)) }
        })
        return strongest
    }, [effectiveGoalId, filteredReports, bestCriterionKpi])

    const lastManagerFeedback = useMemo(() => {
        if (viewMode !== 'self') return null
        if (!effectiveGoalId) return displayData.lastManagerFeedback || null
        const latestFeedback = filteredReports.find((report: any) =>
            typeof report.managerFeedback === 'string' && report.managerFeedback.trim().length > 0
        )
        if (!latestFeedback) return null
        return {
            text: latestFeedback.managerFeedback,
            date: latestFeedback.submissionDate,
            goalName: latestFeedback.goals?.name || null,
        }
    }, [viewMode, effectiveGoalId, filteredReports, displayData.lastManagerFeedback])

    const isBaselineRequired = effectiveGoalId
        ? trendData.scores.length < 3
        : (me.baselineRequired || (trendData.scores.length < 3 && !allReports?.length))

    // ── KPI arrays ──────────────────────────────────────────────────────────

    const selfKpis = useMemo(() => [
        {
            label: 'Average score',
            value: scopedAverageScore,
            meta: scopedDelta >= 0 ? `+${scopedDelta} vs last report` : `${scopedDelta} vs last report`,
            icon: 'star',
            variant: 'accent' as const,
        },
        {
            label: 'Strongest area',
            value: scopedBestCriterion.name,
            meta: scopedBestCriterion.score > 0 ? `Score: ${scopedBestCriterion.score}` : 'No data yet',
            icon: 'target',
            variant: 'green' as const,
        },
        {
            label: 'Next report due',
            value: nextDueLabel,
            meta: upcomingItems[0]?.name ? upcomingItems[0].name.substring(0, 28) : 'No active goals',
            icon: 'clock',
            variant: (nextDueLabel.startsWith('Overdue') ? 'warn' : 'accent') as any,
        },
        {
            label: 'Current streak',
            value: currentStreak === 0 ? '—' : `${currentStreak}`,
            meta: currentStreak === 1 ? '1 consecutive submission' : currentStreak > 1 ? `${currentStreak} consecutive submissions` : 'No streak yet',
            icon: 'chart',
            variant: currentStreak >= 4 ? 'green' as const : 'accent' as const,
        },
    ], [scopedAverageScore, scopedDelta, scopedBestCriterion, nextDueLabel, upcomingItems, currentStreak])

    const detailKpis = useMemo(() => [
        {
            label: 'Reports submitted',
            value: totalCount > 0 ? `${submittedCount} of ${totalCount}` : `${submittedCount}`,
            meta: totalCount > 0 ? `${Math.round((submittedCount / totalCount) * 100)}% submission rate` : 'No periods tracked',
            icon: 'fileText',
            variant: 'accent' as const,
        },
        {
            label: 'Missed reports',
            value: missedCount,
            meta: missedCount === 0 ? 'All periods submitted' : missedCount === 1 ? '1 period not submitted' : `${missedCount} periods not submitted`,
            icon: 'alert',
            variant: missedCount === 0 ? 'green' as const : 'warn' as const,
        },
    ], [submittedCount, missedCount, totalCount])

    const activeKpis = viewMode === 'detail' ? detailKpis : selfKpis

    return (
        <div style={{ width: '100%', animation: animation.keyframes.fadeUp, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {showDateSelector && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '-10px', flexWrap: 'wrap' }}>
                    {activeGoals.length > 0 && (
                        <select
                            value={effectiveGoalId ?? ''}
                            onChange={e => handleGoalChange(e.target.value || null)}
                            style={{
                                background: colors.surface2,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '8px',
                                color: effectiveGoalId ? colors.accent : colors.text3,
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
                            {activeGoals.map((g: any) => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    )}
                    {showDateSelector && (
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
                    )}
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
                        {filteredGoals.length} {filteredGoals.length === 1 ? 'Goal' : 'Goals'} · {new Set(filteredGoals.map((g: any) => g.project).filter(Boolean)).size} {new Set(filteredGoals.map((g: any) => g.project).filter(Boolean)).size === 1 ? 'Project' : 'Projects'}
                    </div>
                    {manager && (
                        <div style={{ fontSize: '12px', color: colors.text3 }}>
                            Reports to <span style={{ color: colors.text2, fontWeight: 600 }}>{manager.name}</span>
                        </div>
                    )}
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Average score</div>
                    {isBaselineRequired ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', height: '100%' }}>
                            <span style={{ fontSize: '15px', fontWeight: 700, color: colors.text2, background: colors.surface2, padding: '4px 12px', borderRadius: '20px', border: `1px solid ${colors.border}` }}>
                                Building Baseline
                            </span>
                            <span style={{ fontSize: '10.5px', color: colors.text3, marginTop: '8px' }}>Requires 3+ reports</span>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', justifyContent: 'flex-end' }}>
                                <span style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, color: getScoreColor(scopedAverageScore) }}>{scopedAverageScore}</span>
                                <span style={{ fontSize: '16px', fontWeight: 600, color: colors.text3 }}>/10</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '12px', fontWeight: 700, color: scopedDelta >= 0 ? colors.green : colors.warn, justifyContent: 'flex-end' }}>
                                <Icon name={scopedDelta >= 0 ? "chevronUp" : "chevronDown"} size={11} />
                                {Math.abs(scopedDelta)} vs last report
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── KPI Grid ─────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'detail' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {activeKpis.map((kpi, i) => (
                    <KPICard
                        key={i}
                        label={kpi.label}
                        icon={kpi.icon as any}
                        value={kpi.value}
                        deltaLabel={kpi.meta}
                        variant={kpi.variant}
                    />
                ))}
            </div>

            {/* ── Last Manager Feedback (self view only) ── */}
            {viewMode === 'self' && lastManagerFeedback && (
                <div style={{
                    background: colors.surface,
                    border: `1px solid ${colors.accentBorder}`,
                    borderRadius: radius.xl,
                    padding: '16px 20px',
                    display: 'flex',
                    gap: '14px',
                    alignItems: 'flex-start',
                }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: colors.accentGlow, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <Icon name="bell" size={16} color={colors.accent} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: colors.accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Last Manager Feedback
                            </span>
                            {lastManagerFeedback.goalName && (
                                <span style={{ fontSize: '11px', color: colors.text3 }}>· {lastManagerFeedback.goalName}</span>
                            )}
                            {lastManagerFeedback.date && (
                                <span style={{ fontSize: '11px', color: colors.text3, marginLeft: 'auto' }}>
                                    {(() => {
                                        try {
                                            const d = lastManagerFeedback.date
                                            return format(new Date(d.length === 10 ? d + 'T12:00:00' : d), 'MMM d, yyyy')
                                        } catch { return '' }
                                    })()}
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: '13.5px', color: colors.text2, lineHeight: 1.65 }}>
                            {lastManagerFeedback.text}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Main Content Grid ─────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', alignItems: 'start' }}>

                {/* LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Trend Card */}
                    <Card
                        title="Score trend"
                        subtitle={`${trendData.total} report${trendData.total !== 1 ? 's' : ''}`}
                        icon="chart"
                        action={viewMode === 'detail' && trendDirection ? (
                            <Badge variant={trendDirection === 'Improving' ? 'green' : trendDirection === 'Declining' ? 'danger' : 'default'}>
                                {trendDirection === 'Improving' ? '↑' : trendDirection === 'Declining' ? '↓' : '→'} {trendDirection}
                            </Badge>
                        ) : undefined}
                    >
                        <div style={{ padding: '0 4px 10px' }}>
                            {isBaselineRequired ? (
                                <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.text3, fontSize: '12px', background: colors.surface2, borderRadius: radius.md, margin: '0 10px' }}>
                                    Trend requires 3+ reports
                                </div>
                            ) : (
                                <>
                                    <Sparkline
                                        scores={trendData.scores}
                                        weeks={trendData.dates}
                                        tooltips={trendData.tooltips}
                                        onBarClick={(i) => setSelectedReport(trendData.reports[i])}
                                    />
                                    {trendData.total > 8 && (
                                        <div style={{ textAlign: 'center', marginTop: '12px' }}>
                                            <button
                                                onClick={() => setShowAllTrend(v => !v)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: colors.accent,
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    padding: '4px 8px',
                                                    borderRadius: radius.sm,
                                                    transition: `opacity ${animation.fast}`,
                                                }}
                                            >
                                                {showAllTrend ? 'Show less' : `Show all ${trendData.total}`}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </Card>

                    {/* Skill Analysis */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                        <Card
                            title="Skill Analysis"
                            icon="target"
                            action={undefined}
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
                            {isBaselineRequired ? (
                                <div style={{ padding: '40px 20px', textAlign: 'center', color: colors.text3, fontSize: '13px' }}>
                                    Skill breakdown requires at least 3 reports to establish a baseline.
                                </div>
                            ) : filteredSkills.length === 0 ? (
                                <div style={{ padding: '40px 20px', textAlign: 'center', color: colors.text3, fontSize: '13px' }}>
                                    No reports with skill data found for this goal.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '40% 60%', gap: '12px', alignItems: 'start' }}>
                                    <SkillSpider skills={filteredSkills} size={240} />
                                    <div style={{ borderLeft: `1px solid ${colors.border}`, paddingLeft: '20px' }}>
                                        <SkillList skills={filteredSkills} />
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: 56 }}>

                    {viewMode === 'detail' ? (
                        /* Report History Timeline */
                        <Card title="Report history" icon="clock">
                            {reportTimeline.length === 0 ? (
                                <div style={{ padding: '24px', textAlign: 'center', color: colors.text3, fontSize: '13px' }}>
                                    No report history yet
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {reportTimeline.map((item: any, i: number) => {
                                        const isLast = i === reportTimeline.length - 1
                                        return (
                                            <div key={i} style={{ display: 'flex', gap: '12px', paddingBottom: isLast ? 0 : '2px' }}>
                                                {/* Timeline spine */}
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '28px', flexShrink: 0 }}>
                                                    <div style={{
                                                        width: '22px', height: '22px', borderRadius: '50%',
                                                        background: item.type === 'submitted' ? colors.greenGlow : colors.dangerGlow,
                                                        border: `2px solid ${item.type === 'submitted' ? colors.green : colors.danger}`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}>
                                                        <Icon
                                                            name={item.type === 'submitted' ? 'check' : 'alert'}
                                                            size={10}
                                                            color={item.type === 'submitted' ? colors.green : colors.danger}
                                                        />
                                                    </div>
                                                    {!isLast && (
                                                        <div style={{ width: '1px', flex: 1, minHeight: '16px', background: colors.border, margin: '3px 0' }} />
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div
                                                    style={{
                                                        flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : '12px', cursor: item.rawReport ? 'pointer' : 'default',
                                                    }}
                                                    onClick={() => item.rawReport && setSelectedReport(item.rawReport)}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: colors.text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.goalName}
                                                        </span>
                                                        {item.type === 'submitted' && item.score != null ? (
                                                            <span style={{ fontSize: '12px', fontWeight: 800, color: getScoreColor(item.score), flexShrink: 0 }}>
                                                                {Number(item.score).toFixed(1)}
                                                            </span>
                                                        ) : item.type === 'missed' ? (
                                                            <Badge variant="danger">Missed</Badge>
                                                        ) : null}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: colors.text3, marginTop: '2px' }}>
                                                        {(() => {
                                                            try { return format(item.date, 'MMM d, yyyy') } catch { return '' }
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </Card>
                    ) : (
                        /* Upcoming Reports (self view) */
                        <Card title="Upcoming reports" icon="clock">
                            {(() => {
                                if (nextDueLabel === 'N/A') return null
                                const isOverdue = nextDueLabel.startsWith('Overdue')
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
                                                {nextDueLabel}
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
                                                <div style={{ fontSize: '11px', fontWeight: 800, color: colors.green, background: colors.greenGlow, padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                    )}

                </div>
            </div>

            {/* Report Detail Modal */}
            <Modal
                isOpen={!!selectedReport}
                onClose={() => setSelectedReport(null)}
                title="Report Details"
                maxWidth="620px"
            >
                {selectedReport && <ReportDetailContent report={selectedReport} />}
            </Modal>
        </div>
    )
}

function ReportDetailContent({ report }: { report: any }) {
    const overallScore = report.managerOverallScore ?? report.evaluationScore
    const scoreColor = overallScore >= 7.5 ? colors.green : overallScore >= 6 ? colors.warn : colors.danger
    const reportForDate = report.submittedForDate || report.submissionDate
    const submissionDate = (() => {
        const d = reportForDate.length === 10 ? reportForDate + 'T12:00:00' : reportForDate
        try { return format(new Date(d), 'EEEE, MMMM d, yyyy') } catch { return reportForDate }
    })()

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ fontSize: '13px', color: colors.text3, marginBottom: '4px' }}>{submissionDate}</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: colors.text }}>{report.goals?.name || 'Unknown Goal'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', marginBottom: '4px' }}>
                        {report.managerOverallScore != null ? 'Manager Score' : 'AI Score'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                        <span style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, color: scoreColor }}>
                            {Number(overallScore).toFixed(1)}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: colors.text3 }}>/10</span>
                    </div>
                    {report.managerOverallScore != null && report.evaluationScore != null && (
                        <div style={{ fontSize: '11px', color: colors.text3, marginTop: '2px' }}>
                            AI: {Number(report.evaluationScore).toFixed(1)}
                        </div>
                    )}
                </div>
            </div>

            {report.managerOverrideReasoning && (
                <div style={{
                    background: colors.accentGlow,
                    border: `1px solid ${colors.accent}30`,
                    borderRadius: radius.lg,
                    padding: '12px 16px',
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.accent, textTransform: 'uppercase', marginBottom: '6px' }}>
                        Manager Override
                    </div>
                    <div style={{ fontSize: '13px', color: colors.text2, lineHeight: 1.6 }}>
                        {report.managerOverrideReasoning}
                    </div>
                </div>
            )}

            {report.evaluationReasoning && (
                <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                        AI Evaluation
                    </div>
                    <div style={{ fontSize: '13.5px', color: colors.text2, lineHeight: 1.7 }}>
                        {report.evaluationReasoning}
                    </div>
                </div>
            )}

            {report.criterionScores && report.criterionScores.length > 0 && (
                <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                        Criterion Breakdown
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {report.criterionScores.map((cs: any, i: number) => {
                            const csScore = Number(cs.score)
                            const csColor = csScore >= 7.5 ? colors.green : csScore >= 6 ? colors.warn : colors.danger
                            return (
                                <div key={i} style={{
                                    background: colors.surface2,
                                    borderRadius: radius.lg,
                                    padding: '12px 14px',
                                    border: `1px solid ${colors.border}`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: cs.reasoning ? '8px' : 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: colors.text }}>{cs.criterionName}</div>
                                        <div style={{ fontSize: '14px', fontWeight: 800, color: csColor }}>{csScore.toFixed(1)}</div>
                                    </div>
                                    {cs.reasoning && (
                                        <div style={{ fontSize: '12.5px', color: colors.text3, lineHeight: 1.6 }}>
                                            {cs.reasoning}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {report.managerFeedback && (
                <div style={{
                    background: colors.surface2,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius.lg,
                    padding: '14px 16px',
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                        Manager Feedback
                    </div>
                    <div style={{ fontSize: '13.5px', color: colors.text2, lineHeight: 1.7 }}>
                        {report.managerFeedback}
                    </div>
                </div>
            )}
        </div>
    )
}
