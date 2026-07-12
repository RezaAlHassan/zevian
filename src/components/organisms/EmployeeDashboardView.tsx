'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { format } from 'date-fns'
import { colors, radius, animation, getScoreColor, getAvatarTones, typography } from '@/design-system'
import { KPICard } from '@/components/molecules/KPICard'
import { Card, ShowAllButton } from '@/components/molecules/Card'
import { SkillSpider } from '@/components/molecules/SkillSpider'
import { SkillList } from '@/components/molecules/SkillList'
import { Sparkline } from '@/components/molecules/Sparkline'
import { DateRangeSelector } from '@/components/molecules/DateRangeSelector'
import { Modal } from '@/components/molecules/Modal'
import { Accordion } from '@/components/molecules/Accordion'
import { getSkillCategory } from '@/lib/skillThresholds'
import { Icon, NoDataPill } from '@/components/atoms'
import { useRouter, useSearchParams } from 'next/navigation'
import { getNextDueDate, normalizeFrequency, resolveWorkingDays } from '@/utils/reportScheduling'
import { computeGoalSubmissionStates } from '@/utils/goalSubmissionState'
import { GoalSubmissionCards } from '@/components/organisms/GoalSubmissionCards'
import { isLateSubmission } from '@/lib/utils/reportStatus'
import { SkillAnalysisBar } from '@/components/organisms/SkillAnalysisBar'
import { getTeamCriterionAvgsAction } from '@/app/actions/dashboardActions'

interface Props {
    data: any
    showDateSelector?: boolean
    allReports?: any[]
    selectedGoalId?: string | null
    onGoalChange?: (id: string | null) => void
    orgMetricNames?: string[]
    viewMode?: 'self' | 'detail'
    /** Employee ID — required in detail mode for the Approve Leave button */
    employeeId?: string
    employeeName?: string
}

export function EmployeeDashboardView({ data, showDateSelector = true, allReports, selectedGoalId: externalGoalId, onGoalChange, orgMetricNames: propOrgMetricNames, viewMode = 'self', employeeId, employeeName }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const isControlled = externalGoalId !== undefined

    const [internalGoalId, setInternalGoalId] = useState<string | null>(null)
    const [showAllTrend, setShowAllTrend] = useState(false)
    const [selectedReport, setSelectedReport] = useState<any>(null)
    const [teamAvgsMap, setTeamAvgsMap] = useState<Record<string, number>>({})

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

    useEffect(() => {
        if (viewMode !== 'detail' || !employeeId) return
        setTeamAvgsMap({})
        getTeamCriterionAvgsAction(employeeId, effectiveGoalId).then(res => {
            if (res.teamAvgs) {
                const map: Record<string, number> = {}
                res.teamAvgs.forEach(t => { map[t.criterionName] = t.teamAvg })
                setTeamAvgsMap(map)
            }
        })
    }, [viewMode, employeeId, effectiveGoalId])

    // Every criterion in filteredSkills has ≥1 score (unscored criteria produce no criterionScores
    // and never reach this list), so a 0 here is a genuine "no evidence / not addressed" score, not a
    // missing one. Weakest-first so those zeros surface at the top as the real focus areas they are.
    const criteriaForBar = useMemo(() =>
        filteredSkills
            .map((s: any) => ({
                name: s.name as string,
                score: s.score as number,
                teamAvg: viewMode === 'detail' ? teamAvgsMap[s.name] : undefined,
            }))
            .sort((a: { score: number }, b: { score: number }) => a.score - b.score),
        [filteredSkills, teamAvgsMap, viewMode]
    )

    const formatFreq = (f: string) => ({ daily: 'Daily', weekly: 'Weekly', biweekly: 'Biweekly', 'bi-weekly': 'Biweekly', monthly: 'Monthly' } as Record<string, string>)[f?.toLowerCase()] ?? 'Weekly'

    const upcomingItems = useMemo(() => {
        const items: { name: string; project: string; daysUntil: number | null; date: Date; isSubmitted: boolean; hasPeriod: boolean; status: string; frequency: string }[] = []
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
                    status: goal.status,
                    frequency: freq,
                })
            })
        }

        filteredGoals.forEach((g: any) => {
            if (handledGoalIds.has(g.id)) return

            const freq = normalizeFrequency(g.projectFrequency || 'weekly')
            const workingDays = resolveWorkingDays(
                { valid_report_days: g.validReportDays },
                displayData.organization,
            )
            const lastReport = (allReports || [])
                .filter((r: any) => r.goalId === g.id && !r.isOnLeave)
                .sort((a: any, b: any) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())[0]
            const goalStart = g.startDate || g.start_date
            const joinDate = me.joinDate || me.join_date
            const nextDue = getNextDueDate(
                lastReport?.submissionDate ?? null,
                goalStart || new Date().toISOString(),
                joinDate || new Date().toISOString(),
                freq,
                workingDays,
            )

            const midnightDeadline = new Date(nextDue)
            midnightDeadline.setHours(0, 0, 0, 0)
            const days = Math.round((midnightDeadline.getTime() - midnightToday.getTime()) / (1000 * 60 * 60 * 24))

            items.push({
                name: g.name,
                project: g.project || g.projectName || '',
                daysUntil: days,
                date: nextDue,
                isSubmitted: false,
                hasPeriod: false,
                status: g.status,
                frequency: g.projectFrequency || 'weekly',
            })
        })

        return items.filter(item => item.status === 'active' || item.daysUntil !== null)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
    }, [filteredUpcomingPeriods, filteredGoals, gracePeriodDays, allReports, me])

    // ── Goal-centric submission states ──────────────────────────────────────────
    const goalStates = useMemo(
        () => computeGoalSubmissionStates(
            filteredGoals,
            filteredUpcomingPeriods,
            allReports || [],
            displayData.organization?.working_days,
        ),
        [filteredGoals, filteredUpcomingPeriods, allReports, displayData.organization],
    )

    const allowLateSubmissions = displayData.managerSettings?.allowLateSubmissions ?? true

    const nextDueLabel = useMemo(() => {
        const attention = goalStates.filter(g => g.lateCount > 0)
        if (attention.length > 0) return 'Late'
        const dueToday = goalStates.filter(g => g.isDueToday)
        if (dueToday.length > 0) return 'Due Today'
        const upcoming = [...goalStates]
            .filter(g => g.nextDueDate && !g.isDueToday && g.lateCount === 0)
            .sort((a, b) => a.nextDueDate!.getTime() - b.nextDueDate!.getTime())[0]
        if (!upcoming?.nextDueDate) {
            const kpiValue = kpis?.find((k: any) => k.label?.toLowerCase() === 'next report due')?.value
            if (kpiValue && kpiValue !== 'N/A') return kpiValue
            return 'N/A'
        }
        const todayMs = new Date().setHours(0, 0, 0, 0)
        const daysUntil = Math.round((upcoming.nextDueDate.getTime() - todayMs) / 86400000)
        return daysUntil <= 0 ? 'Due Today' : `${daysUntil}d`
    }, [goalStates, kpis])

    // ── Detail-view computed values ─────────────────────────────────────────

    const { submittedCount, missedCount, totalCount } = useMemo(() => {
        if (viewMode !== 'detail') return { submittedCount: 0, missedCount: 0, totalCount: 0 }
        const submitted = filteredReports.length
        const missed = filteredUpcomingPeriods.filter((p: any) =>
            p.status === 'missed' || (p.status === 'pending' && new Date(p.period_end ?? p.periodEnd) < new Date())
        ).length
        return { submittedCount: submitted, missedCount: missed, totalCount: submitted + missed }
    }, [viewMode, filteredReports, filteredUpcomingPeriods])

    // Late-submitted reports (submitted after the deadline) — powers the On-Time Rate KPI.
    const lateCount = useMemo(
        () => (viewMode !== 'detail' ? 0 : filteredReports.filter((r: any) => isLateSubmission(r)).length),
        [viewMode, filteredReports]
    )

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
            // No scored reports yet → show the absence pill instead of a misleading "0".
            // (1–2 scored reports still show their real average; the trend card separately
            // notes a baseline needs 3+.)
            value: filteredScoredReports.length === 0
                ? <NoDataPill reportCount={filteredReports.length} />
                : scopedAverageScore,
            meta: filteredScoredReports.length === 0
                ? 'No scored reports yet'
                : scopedDelta >= 0 ? `+${scopedDelta} vs last report` : `${scopedDelta} vs last report`,
            icon: 'trendingUp',
            variant: 'accent' as const,
            // Average IS a score → grade it. Neutral when there's no scored data to grade.
            valueColor: filteredScoredReports.length > 0 ? getScoreColor(Number(scopedAverageScore)) : undefined,
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
            meta: goalStates[0]?.goalName ? goalStates[0].goalName.substring(0, 28) : 'No active goals',
            icon: 'clock',
            variant: (nextDueLabel.startsWith('Overdue') ? 'warn' : 'accent') as any,
        },
        {
            label: 'Current streak',
            value: currentStreak === 0 ? '—' : `${currentStreak}`,
            meta: currentStreak === 1 ? '1 consecutive submission' : currentStreak > 1 ? `${currentStreak} consecutive submissions` : 'No streak yet',
            icon: 'reports',
            variant: currentStreak >= 4 ? 'green' as const : 'accent' as const,
        },
    ], [scopedAverageScore, scopedDelta, scopedBestCriterion, nextDueLabel, upcomingItems, currentStreak, filteredScoredReports.length, filteredReports.length])

    const detailKpis = useMemo(() => {
        // On-time rate = share of submitted reports that beat their deadline.
        const onTimeRate = submittedCount > 0 ? Math.round(((submittedCount - lateCount) / submittedCount) * 100) : null
        const atRisk = goalStates.filter(g => g.lateCount > 0).length
        return [
            {
                label: 'Reports',
                icon: 'reports',
                value: submittedCount,
                meta: 'submitted',
                variant: 'accent' as const,
            },
            {
                // Avg score lives in the hero now; surface missed periods here instead.
                label: 'Missed',
                icon: 'alertTriangle',
                value: missedCount,
                meta: missedCount === 0 ? 'none missed' : missedCount === 1 ? '1 period' : `${missedCount} periods`,
                variant: (missedCount === 0 ? 'green' : 'warn') as 'green' | 'warn',
            },
            {
                label: 'On-Time Rate',
                icon: 'checkCircle',
                value: onTimeRate != null ? `${onTimeRate}%` : 'N/A',
                meta: onTimeRate != null ? 'of submissions' : 'No reports yet',
                // Below-target on-time reads amber (attention), never saturated red — a rate isn't
                // a genuine at-risk state. Good rate stays neutral (color = meaning).
                variant: (onTimeRate == null || onTimeRate >= 90 ? 'default' : 'warn') as 'default' | 'warn',
            },
            {
                label: 'Open KPIs',
                icon: 'target',
                value: activeGoals.length,
                meta: atRisk > 0 ? `${atRisk} at risk` : '0 at risk',
                variant: 'accent' as const,
            },
        ]
    }, [submittedCount, missedCount, lateCount, goalStates, activeGoals.length])

    const activeKpis = viewMode === 'detail' ? detailKpis : selfKpis

    // ── Hero (detail view) ──────────────────────────────────────────────────
    const managerName = typeof manager === 'string' ? manager : (manager?.name || null)
    const heroTones = getAvatarTones(me.name || me.initials || '')
    const heroScore = (filteredScoredReports.length > 0 && scopedAverageScore != null && Number(scopedAverageScore) > 0)
        ? Number(scopedAverageScore)
        : null
    const heroDelta = scopedDelta != null ? Number(scopedDelta) : 0
    // Trend compressed to the most recent 4 reports; each bar links to its own report detail.
    const HERO_TREND_N = 4
    const heroTrend: number[] = trendData.scores.slice(-HERO_TREND_N)
    const heroWeeks: string[] = trendData.dates.slice(-HERO_TREND_N)
    const heroTooltips = trendData.tooltips?.slice(-HERO_TREND_N)
    const heroReports = (trendData.reports || []).slice(-HERO_TREND_N)
    const openHeroReport = (i: number) => {
        const r = heroReports[i]
        if (r?.id) router.push(`/reports/${r.id}`)
    }

    return (
        <div style={{ width: '100%', animation: animation.keyframes.fadeUp, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {showDateSelector && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '-10px', flexWrap: 'wrap' }}>
                    {activeGoals.length > 0 && (
                        <select
                            className="zv-select"
                            value={effectiveGoalId ?? ''}
                            onChange={e => handleGoalChange(e.target.value || null)}
                            style={{ color: effectiveGoalId ? colors.text : colors.text3 }}
                        >
                            <option value="">All KPIs</option>
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

            {/* ── Hero (detail view) — identity + current score + 8-week trend ── */}
            {viewMode === 'detail' && (
                <div style={{
                    background: colors.surface,
                    border: `1px solid ${colors.borderStrong}`,
                    borderRadius: radius.lg,
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                    flexWrap: 'wrap',
                }}>
                    {/* Identity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '240px' }}>
                        <div style={{
                            width: '52px', height: '52px', borderRadius: radius.md, flexShrink: 0,
                            background: heroTones.bg, position: 'relative', overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: typography.fonts.display,
                            fontSize: '18px', fontWeight: 600, color: heroTones.fg, letterSpacing: '-0.02em',
                            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                        }}>
                            {me.avatarUrl && <img src={me.avatarUrl} alt={me.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                            {(me.initials || me.name?.slice(0, 2) || '').toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '22px', fontWeight: 800, color: colors.text, lineHeight: 1.2 }}>{me.name}</div>
                            {(me.role || me.team) && (
                                <div style={{ fontSize: '13px', color: colors.text2, marginTop: '3px' }}>
                                    {[me.role, me.team].filter(Boolean).join(' · ')}
                                </div>
                            )}
                            {managerName && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: colors.text3, marginTop: '5px' }}>
                                    <Icon name="person" size={12} color={colors.text3} />
                                    Reports to {managerName}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right group — Current score + trend, top-aligned so the "Current" and
                        "N-Week Trend" eyebrow labels sit on the same baseline. */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '36px', flexShrink: 0, flexWrap: 'wrap' }}>
                        {/* Current score + delta pill */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: colors.text3 }}>Current</span>
                            {heroScore != null ? (
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                    <span className="font-numeric" style={{ fontSize: '30px', fontWeight: 900, lineHeight: 1, color: getScoreColor(heroScore) }}>{heroScore.toFixed(1)}</span>
                                    <span className="font-numeric" style={{ fontSize: '14px', fontWeight: 600, color: colors.text3 }}>/10</span>
                                </div>
                            ) : (
                                <span style={{ fontSize: '22px', fontWeight: 800, color: colors.text3 }}>N/A</span>
                            )}
                            {heroScore != null && heroDelta !== 0 && (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start',
                                    padding: '2px 8px', borderRadius: '6px',
                                    background: heroDelta >= 0 ? colors.greenGlow : colors.dangerGlow,
                                    color: heroDelta >= 0 ? colors.green : colors.danger,
                                    fontSize: '11px', fontWeight: 700,
                                }}>
                                    {heroDelta >= 0 ? '↑' : '↓'}
                                    <span className="font-numeric" style={{ fontWeight: 800 }}>{Math.abs(heroDelta).toFixed(1)}</span>
                                    <span style={{ color: colors.text3, fontWeight: 500 }}>vs prior</span>
                                </span>
                            )}
                        </div>

                        {/* Trend — hoverable; each bar is a report, clicking opens its detail. */}
                        {heroTrend.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '300px', flex: 1 }}>
                                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: colors.text3 }}>{heroTrend.length}-Week Trend</span>
                                <Sparkline
                                    scores={heroTrend}
                                    weeks={heroWeeks}
                                    tooltips={heroTooltips}
                                    height={72}
                                    onBarClick={openHeroReport}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── KPI Grid ─────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {activeKpis.map((kpi, i) => (
                    <KPICard
                        key={i}
                        label={kpi.label}
                        icon={kpi.icon as any}
                        value={(kpi as any).value}
                        deltaLabel={kpi.meta}
                        variant={kpi.variant}
                        valueColor={(kpi as any).valueColor}
                    />
                ))}
            </div>

            {/* ── Last Manager Feedback (self view only) ── */}
            {viewMode === 'self' && lastManagerFeedback && (
                <div style={{
                    background: colors.surface,
                    border: `1px solid ${colors.accentBorder}`,
                    borderRadius: radius.md,
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
                        <Icon name="bell" size={16} color={colors.text3} />
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
                        <div style={{ fontSize: '13px', color: colors.text2, lineHeight: 1.65 }}>
                            {lastManagerFeedback.text}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Main Content Grid ─────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '65fr 35fr', gap: '16px', alignItems: 'start' }}>

                {/* LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Trend Card — self view only; the detail view shows the trend in the hero. */}
                    {viewMode === 'self' && (
                    <Card
                        title="Score trend"
                        subtitle={`${trendData.total} report${trendData.total !== 1 ? 's' : ''}`}
                        icon="chart"
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
                    )}

                    {/* Skill Analysis */}
                    <Card
                        title="Skill Analysis"
                        icon="target"
                        action={skillSummaryLabel ? (
                            <span style={{
                                fontSize: '11px',
                                color: colors.text3,
                                padding: '3px 8px',
                                background: colors.surface2,
                                borderRadius: '6px',
                                border: `1px solid ${colors.border}`,
                            }}>
                                {skillSummaryLabel}
                            </span>
                        ) : undefined}
                    >
                        <div style={{ padding: '4px 0' }}>
                            <SkillAnalysisBar
                                criteriaData={criteriaForBar}
                                allReports={allReports || []}
                                viewMode={viewMode}
                                selectedGoalId={effectiveGoalId}
                            />
                        </div>
                    </Card>

                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: 56 }}>

                    {viewMode === 'detail' ? (
                        /* Goal submission state — manager read-only view */
                        <Card title="Report status" icon="clock">
                            <GoalSubmissionCards
                                goalStates={goalStates}
                                allowLateSubmissions={allowLateSubmissions}
                                viewMode="manager"
                                employeeId={employeeId}
                                employeeName={employeeName ?? me?.name ?? ''}
                            />
                        </Card>
                    ) : (
                        /* Upcoming Reports (self view) */
                        <Card
                            title="Reports"
                            icon="clock"
                        >
                            <GoalSubmissionCards
                                goalStates={goalStates}
                                allowLateSubmissions={allowLateSubmissions}
                                viewMode="employee"
                            />
                            <ShowAllButton label="View all reports" onClick={() => router.push('/my-reports')} />
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
    const scoreColor = getScoreColor(overallScore)
    const reportForDate = report.submittedForDate || report.submissionDate
    const submissionDate = (() => {
        const d = reportForDate.length === 10 ? reportForDate + 'T12:00:00' : reportForDate
        try { return format(new Date(d), 'EEEE, MMMM d, yyyy') } catch { return reportForDate }
    })()

    return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ fontSize: '13px', color: colors.text3, marginBottom: '4px' }}>{submissionDate}</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: colors.text }}>{report.goals?.name || 'Unknown Goal'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', marginBottom: '4px' }}>
                        {report.managerOverallScore != null ? 'Manager Score' : 'Score'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                        <span style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, color: scoreColor }}>
                            {Number(overallScore).toFixed(1)}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: colors.text3 }}>/10</span>
                    </div>
                    {report.managerOverallScore != null && report.evaluationScore != null && (
                        <div style={{ fontSize: '11px', color: colors.text3, marginTop: '2px' }}>
                            System: {Number(report.evaluationScore).toFixed(1)}
                        </div>
                    )}
                </div>
            </div>

            {report.managerOverrideReasoning && (
                <div style={{
                    background: colors.accentGlow,
                    border: `1px solid ${colors.accent}30`,
                    borderRadius: radius.md,
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
                        Evaluation
                    </div>
                    <div style={{ fontSize: '13px', color: colors.text2, lineHeight: 1.7 }}>
                        {report.evaluationReasoning}
                    </div>
                </div>
            )}

            {report.criterionScores && report.criterionScores.length > 0 && (
                <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                        Criteria Breakdown
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {report.criterionScores.map((cs: any, i: number) => {
                            const csScore = Number(cs.score)
                            const csColor = getScoreColor(csScore)
                            return (
                                <div key={i} style={{
                                    background: colors.surface2,
                                    borderRadius: radius.md,
                                    padding: '12px 14px',
                                    border: `1px solid ${colors.border}`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: cs.reasoning ? '8px' : 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: colors.text }}>{cs.criterionName}</div>
                                        <div style={{ fontSize: '14px', fontWeight: 800, color: csColor }}>{csScore.toFixed(1)}</div>
                                    </div>
                                    {cs.reasoning && (
                                        <div style={{ fontSize: '12px', color: colors.text3, lineHeight: 1.6 }}>
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
                    borderRadius: radius.md,
                    padding: '14px 16px',
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                        Manager Feedback
                    </div>
                    <div style={{ fontSize: '13px', color: colors.text2, lineHeight: 1.7 }}>
                        {report.managerFeedback}
                    </div>
                </div>
            )}
        </div>
    )
}
