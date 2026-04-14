'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { colors, radius, typography, animation, layout, shadows } from '@/design-system'
import { Icon, Button, Badge } from '@/components/atoms'
import { StepTracker, AnalysisModal, Accordion, DatePicker } from '@/components/molecules'
import { analyzeReportAction, submitReportAction, getEligibleGoalsAction } from '@/app/actions/reportActions'

const STEPS = [
    { id: 1, label: 'Context' },
    { id: 2, label: 'Write' },
    { id: 3, label: 'Review' },
]

interface Props {
    initialProjects: any[]
    initialGoals: any[]
    initialMetrics: any[]
    employeeId: string
    goalWeight?: number
    aiConfig?: {
        allowLate?: boolean
        allowLateSubmissions?: boolean
        requireReport?: boolean
        notifyManager?: boolean
    }
    backdateSettings?: {
        allowLateSubmissions: boolean
        backdateLimitDays: number | null
        gracePeriodDays: number
    }
    pendingPeriods?: any[]
}

export function SubmitReportClient({ initialProjects, initialGoals, initialMetrics, employeeId, goalWeight = 70, aiConfig, backdateSettings, pendingPeriods }: Props) {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)

    // Backdate settings
    const isLateAllowed = backdateSettings?.allowLateSubmissions ?? aiConfig?.allowLateSubmissions ?? aiConfig?.allowLate ?? true
    const backdateLimitDays: number | null = backdateSettings?.backdateLimitDays ?? null

    const todayStr = new Date().toLocaleDateString('en-CA')  // YYYY-MM-DD local
    const minDateStr = (() => {
        if (!isLateAllowed) return todayStr
        if (backdateLimitDays === null) {
            // Late submissions allowed but no explicit limit — default to 7 days back
            const d = new Date()
            d.setDate(d.getDate() - 7)
            return d.toLocaleDateString('en-CA')
        }
        if (backdateLimitDays === 0) return '2020-01-01'  // effectively unlimited
        const d = new Date()
        d.setDate(d.getDate() - backdateLimitDays)
        return d.toLocaleDateString('en-CA')
    })()

    // ── Wizard State ──────────────────────────────────────────
    // Step 1: Context (project + date + goal)
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
    const [selectedDate, setSelectedDate] = useState(todayStr)
    const isBackdatedSelection = selectedDate < todayStr

    // Goals (loaded dynamically when project or date changes)
    const [eligibleGoals, setEligibleGoals] = useState<any[]>([])
    const [isLoadingGoals, setIsLoadingGoals] = useState(false)
    const [goalsLoaded, setGoalsLoaded] = useState(false)
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)

    // Step 2: Write
    const [reportText, setReportText] = useState('')
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisResults, setAnalysisResults] = useState<any>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Load eligible goals whenever project or date changes
    useEffect(() => {
        if (!selectedProjectId) {
            setEligibleGoals([])
            setGoalsLoaded(false)
            setSelectedGoalId(null)
            return
        }

        let cancelled = false
        setIsLoadingGoals(true)
        setGoalsLoaded(false)
        setSelectedGoalId(null)
        setEligibleGoals([])

        getEligibleGoalsAction(employeeId, selectedProjectId, selectedDate).then(res => {
            if (cancelled) return
            if (res.success && res.data) {
                setEligibleGoals(res.data)
            } else {
                setEligibleGoals([])
            }
            setGoalsLoaded(true)
            setIsLoadingGoals(false)
        }).catch(() => {
            if (!cancelled) {
                setEligibleGoals([])
                setGoalsLoaded(true)
                setIsLoadingGoals(false)
            }
        })

        return () => { cancelled = true }
    }, [selectedProjectId, selectedDate, employeeId])

    // ── Navigation ────────────────────────────────────────────
    const handleContinueToWrite = () => {
        if (!selectedProjectId || !selectedGoalId) return
        setCurrentStep(2)
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100)
    }

    const goBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1)
    }

    // ── Actions ──────────────────────────────────────────────
    const handleAnalyze = async () => {
        setIsAnalyzing(true)
        setError(null)
        setIsModalOpen(true)

        const goalsToAnalyze = eligibleGoals.filter(g => g.id === selectedGoalId)

        try {
            const result = await analyzeReportAction({
                reportText,
                goals: goalsToAnalyze,
                metrics: initialMetrics,
                projectId: selectedProjectId || undefined
            })

            if ('error' in result) {
                setError(result.error as string)
                setIsAnalyzing(false)
                setIsModalOpen(false)
                return
            }

            setAnalysisResults(result.analysis)
        } catch (err: any) {
            setError(err.message || 'Analysis failed')
            setIsModalOpen(false)
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleConfirmSubmit = async () => {
        if (!analysisResults || !selectedGoalId) return

        setIsSubmitting(true)
        setError(null)

        const goalAvg = analysisResults.goals.reduce((acc: number, g: any) => acc + g.score, 0) / (analysisResults.goals.length || 1)
        const orgAvg = analysisResults.orgMetrics.reduce((acc: number, m: any) => acc + m.score, 0) / (analysisResults.orgMetrics.length || 1)

        const weights = analysisResults.weights || { goalWeight: 75, orgWeight: 25, kbWeight: 0 }
        const finalScore = (goalAvg * (weights.goalWeight / 100)) + (orgAvg * (weights.orgWeight / 100))

        const totalReasoning = [
            ...analysisResults.goals.map((g: any) => g.reason),
            ...analysisResults.orgMetrics.map((m: any) => m.reason)
        ].filter(Boolean).join(' ')

        const allCriterionScores = [
            ...analysisResults.goals.flatMap((g: any) =>
                g.criteria.map((c: any) => ({
                    goalId: g.id,
                    criterionName: c.name,
                    score: c.score,
                    reasoning: c.reason,
                    evidence: c.evidence
                }))
            ),
            ...(analysisResults.orgMetrics || []).map((m: any) => ({
                goalId: selectedGoalId,
                criterionName: m.name,
                score: m.score,
                reasoning: m.reason,
                evidence: undefined
            }))
        ]

        const result = await submitReportAction({
            goalIds: [selectedGoalId],
            reportText,
            employeeId,
            submissionDate: selectedDate,
            evaluationScore: finalScore,
            evaluationReasoning: totalReasoning,
            criterionScores: allCriterionScores
        })

        if ('error' in result) {
            setError(result.error as string)
            setIsSubmitting(false)
            return
        }

        setIsSubmitting(false)
        setIsModalOpen(false)
        setIsSuccess(true)
        setTimeout(() => {
            router.refresh()
            router.push('/my-reports')
        }, 2000)
    }

    // ── Mapping Results for Modal ─────────────────────────
    const analysisResultsGoals = useMemo(() => {
        if (analysisResults) return analysisResults.goals
        return eligibleGoals.filter(g => g.id === selectedGoalId).map(g => ({
            name: g.name,
            score: 0,
            reason: 'Awaiting analysis...',
            criteria: (g.criteria || []).map((c: any) => ({
                name: c.name,
                score: 0,
                reason: '',
                evidence: ''
            }))
        }))
    }, [selectedGoalId, eligibleGoals, analysisResults])

    const analysisResultsOrg = useMemo(() => {
        if (analysisResults) return analysisResults.orgMetrics.map((m: any) => ({ ...m, emo: '🎯' }))
        return initialMetrics.map(m => ({
            name: m.name,
            score: 0,
            emo: '🎯',
            reason: m.description || 'Org metric evaluation.'
        }))
    }, [initialMetrics, analysisResults])

    const canAnalyze = reportText.trim().length >= 50

    // ── Urgent Goals Sidebar ────────────────────────────
    const urgentGoals = useMemo(() => {
        if (!initialGoals || initialGoals.length === 0) return []

        const now = new Date()

        const mapped = initialGoals.map((goal: any) => {
            const project = initialProjects.find(p => p.id === goal.projectId)

            const goalPeriods = (pendingPeriods || []).filter((p: any) => p.goal_id === goal.id)

            let relevantPeriod = goalPeriods.find((p: any) => p.status === 'pending' || p.status === 'late')

            let isSubmitted = false
            let hasPeriod = false
            if (!relevantPeriod) {
                const submittedPeriods = goalPeriods.filter((p: any) => p.status === 'submitted')
                if (submittedPeriods.length > 0) {
                    submittedPeriods.sort((a: any, b: any) => new Date(b.period_end).getTime() - new Date(a.period_end).getTime())
                    relevantPeriod = submittedPeriods[0]
                    isSubmitted = true
                }
            }
            if (relevantPeriod) hasPeriod = true

            let diffDays = 0
            let endDate = new Date()
            let nextDueDate = new Date()

            if (relevantPeriod) {
                endDate = new Date(relevantPeriod.period_end)
                nextDueDate = new Date(endDate)

                if (isSubmitted) {
                    const freq = project?.frequency || 'weekly'
                    if (freq === 'daily') nextDueDate.setDate(nextDueDate.getDate() + 1)
                    else if (freq === 'biweekly') nextDueDate.setDate(nextDueDate.getDate() + 14)
                    else if (freq === 'monthly') nextDueDate.setMonth(nextDueDate.getMonth() + 1)
                    else nextDueDate.setDate(nextDueDate.getDate() + 7)
                }

                const diffTime = (isSubmitted ? nextDueDate : endDate).getTime() - now.getTime()
                diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            }

            return {
                id: goal.id,
                goalName: goal.name,
                projectName: project?.name || 'Unknown Project',
                daysDue: diffDays,
                isLate: diffDays < 0 && !isSubmitted,
                isSubmitted,
                hasPeriod,
                endDate,
                nextDueDate
            }
        })

        mapped.sort((a, b) => {
            if (a.isSubmitted !== b.isSubmitted) return a.isSubmitted ? 1 : -1
            return a.daysDue - b.daysDue
        })

        return mapped.slice(0, 3)
    }, [pendingPeriods, initialGoals, initialProjects])

    const renderUrgentGoals = () => {
        if (urgentGoals.length === 0) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', marginLeft: '4px' }}>
                        Urgent Goals
                    </div>
                    <div style={{
                        padding: '16px',
                        background: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: radius.lg,
                        textAlign: 'center'
                    }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${colors.green}15`, color: colors.green, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                            <Icon name="check" size={20} />
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text, marginBottom: '4px' }}>All Caught Up</div>
                        <div style={{ fontSize: '11.5px', color: colors.text3 }}>No upcoming deadlines</div>
                    </div>
                </div>
            )
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', marginLeft: '4px' }}>
                    Urgent Goals
                </div>
                {urgentGoals.map(ug => (
                    <div key={ug.id} style={{
                        padding: '14px',
                        background: ug.isLate ? colors.dangerGlow : colors.surface,
                        border: `1px solid ${ug.isLate ? 'rgba(240,68,56,0.15)' : colors.border}`,
                        borderRadius: radius.lg,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: ug.isSubmitted ? colors.text3 : colors.text, lineHeight: 1.3, textDecoration: ug.isSubmitted ? 'line-through' : 'none' }}>{ug.goalName}</div>

                            {ug.isSubmitted ? (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    fontSize: '10px', fontWeight: 800, color: colors.green,
                                    whiteSpace: 'nowrap', padding: '3px 6px',
                                    background: `${colors.green}15`, borderRadius: '4px'
                                }}>
                                    <Icon name="check" size={10} />
                                    Submitted
                                </div>
                            ) : ug.hasPeriod ? (
                                <div style={{
                                    fontSize: '10px', fontWeight: 800,
                                    color: ug.isLate ? colors.danger : colors.warn,
                                    whiteSpace: 'nowrap', padding: '3px 6px',
                                    background: ug.isLate ? 'rgba(240,68,56,0.1)' : 'rgba(245,158,11,0.12)',
                                    borderRadius: '4px'
                                }}>
                                    {ug.isLate ? `${Math.abs(ug.daysDue)}d late` : `Due in ${ug.daysDue}d`}
                                </div>
                            ) : null}
                        </div>
                        <div style={{ fontSize: '11px', color: colors.text3, fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{ug.projectName}</span>
                            {ug.hasPeriod && (
                                <span style={{ opacity: 0.7 }}>
                                    {ug.isSubmitted ? `Next: ${ug.nextDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ug.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (isSuccess) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center', animation: `fadeIn ${animation.base}` }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: colors.green, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: `0 0 20px ${colors.green}40` }}>
                    <Icon name="check" size={32} />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Report Submitted!</h2>
                <p style={{ color: colors.text3 }}>Redirecting to your dashboard...</p>
            </div>
        )
    }

    const selectedGoal = eligibleGoals.find(g => g.id === selectedGoalId) ?? null

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '24px', alignItems: 'start', padding: layout.contentPadding, paddingBottom: '120px' }}>
            {/* ── Main Flow ───────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                <StepTracker steps={STEPS} currentStep={currentStep} />

                {error && (
                    <div style={{ padding: '12px 16px', background: `${colors.warn}10`, border: `1px solid ${colors.warn}30`, borderRadius: radius.lg, color: colors.warn, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon name="alert" size={16} color={colors.warn} />
                        {error}
                    </div>
                )}

                {/* ── STEP 1: Context (Project + Date + Goal) ── */}
                {currentStep === 1 && (
                    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', overflow: 'visible', animation: `fadeIn ${animation.fast}` }}>

                        {/* Project selection */}
                        <div style={{ padding: '24px 24px 16px 24px', borderBottom: `1px solid ${colors.border}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${colors.accent}15`, color: colors.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon name="briefcase" size={16} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px', margin: 0, color: colors.text }}>Project Context</h2>
                                    <p style={{ fontSize: '13px', color: colors.text3, margin: '2px 0 0 0' }}>Select the project and goal you are reporting on.</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                            {initialProjects.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: colors.text3, fontSize: '13px', gridColumn: '1 / -1' }}>
                                    No projects assigned. Contact your manager.
                                </div>
                            ) : initialProjects.map(p => (
                                <div
                                    key={p.id}
                                    onClick={() => setSelectedProjectId(p.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderRadius: radius.lg,
                                        background: selectedProjectId === p.id ? `${colors.accent}12` : colors.bg,
                                        border: `1.5px solid ${selectedProjectId === p.id ? colors.accent : colors.border}`,
                                        cursor: 'pointer', transition: `all ${animation.fast}`,
                                        color: selectedProjectId === p.id ? colors.accent : colors.text2,
                                        fontWeight: 700, fontSize: '14px',
                                        boxShadow: selectedProjectId === p.id ? `0 4px 12px ${colors.accent}15` : 'none'
                                    }}
                                >
                                    <Icon name={selectedProjectId === p.id ? 'check' : 'briefcase'} size={16} />
                                    {p.name}
                                </div>
                            ))}
                        </div>

                        {/* Date selector */}
                        {isLateAllowed && (
                            <div style={{ padding: '20px 24px', background: colors.surface2, borderTop: `1px solid ${colors.border}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <Icon name="calendar" size={14} color={colors.accent} />
                                            <span style={{ fontSize: '14px', fontWeight: 800, color: colors.text }}>Submission Date</span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: colors.text3, maxWidth: '300px' }}>
                                            What date are you submitting this report for?
                                            {backdateLimitDays !== null && backdateLimitDays > 0 ? ` You can backdate up to ${backdateLimitDays} days.` : ''}
                                        </div>
                                    </div>
                                    <DatePicker
                                        selectedDate={selectedDate}
                                        onDateChange={setSelectedDate}
                                        minDate={new Date(minDateStr + 'T12:00:00')}
                                        maxDate={new Date(todayStr + 'T12:00:00')}
                                        hasWarning={isBackdatedSelection}
                                    />
                                </div>

                                {isBackdatedSelection && (
                                    <div style={{
                                        marginTop: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px',
                                        padding: '14px 16px', background: `${colors.warn}12`, border: `1px solid ${colors.warn}30`, borderRadius: '10px',
                                    }}>
                                        <Icon name="alert" size={16} color={colors.warn} />
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 800, color: colors.warn, marginBottom: '2px' }}>
                                                You are submitting for {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </div>
                                            <div style={{ fontSize: '12.5px', color: `${colors.warn}dd` }}>
                                                This will be marked as a late submission.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Goal selection — appears once a project is chosen */}
                        {selectedProjectId && (
                            <div style={{ borderTop: `1px solid ${colors.border}` }}>
                                <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${colors.purple}15`, color: colors.purple, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon name="target" size={14} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '15px', fontWeight: 800, color: colors.text, letterSpacing: '-0.2px' }}>Select Goal</div>
                                        <div style={{ fontSize: '12px', color: colors.text3, marginTop: '1px' }}>Choose one active goal to report on for this period.</div>
                                    </div>
                                </div>

                                {isLoadingGoals ? (
                                    <div style={{ padding: '32px', textAlign: 'center', color: colors.text3, fontSize: '13px' }}>
                                        Loading eligible goals...
                                    </div>
                                ) : !goalsLoaded ? null : eligibleGoals.length === 0 ? (
                                    <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: `${colors.green}15`, color: colors.green, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                            <Icon name="check" size={22} />
                                        </div>
                                        <div style={{ fontSize: '15px', fontWeight: 800, color: colors.text, marginBottom: '6px' }}>All Caught Up!</div>
                                        <p style={{ fontSize: '13px', color: colors.text3, maxWidth: '380px', margin: '0 auto', lineHeight: 1.5 }}>
                                            You have already submitted reports for all active goals in this project for the period covering <strong>{selectedDate}</strong>.
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ padding: '0 24px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                                        {eligibleGoals.map(goal => {
                                            const isSelected = selectedGoalId === goal.id
                                            return (
                                                <div
                                                    key={goal.id}
                                                    onClick={() => setSelectedGoalId(goal.id)}
                                                    style={{
                                                        background: isSelected ? `${colors.accent}10` : colors.bg,
                                                        border: `1.5px solid ${isSelected ? colors.accent : colors.border}`,
                                                        borderRadius: '14px', padding: '18px', cursor: 'pointer',
                                                        transition: `all ${animation.fast}`,
                                                        boxShadow: isSelected ? `0 4px 16px ${colors.accent}20` : 'none',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                                                        <div style={{ fontSize: '14px', fontWeight: 800, color: isSelected ? colors.accent : colors.text, lineHeight: 1.3 }}>{goal.name}</div>
                                                        {isSelected && (
                                                            <div style={{ flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%', background: colors.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <Icon name="check" size={11} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: colors.text3, marginBottom: goal.description ? '8px' : '0' }}>
                                                        {goal.criteria?.length || 0} criteria attached
                                                    </div>
                                                    {goal.description && (
                                                        <p style={{ fontSize: '12.5px', color: colors.text2, lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                            {goal.description}
                                                        </p>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Continue button */}
                        <div style={{
                            padding: '20px 24px',
                            borderTop: `1px solid ${colors.border}`,
                            display: 'flex',
                            justifyContent: 'flex-end',
                            borderBottomLeftRadius: '16px',
                            borderBottomRightRadius: '16px'
                        }}>
                            <Button
                                variant="primary"
                                icon="chevronRight"
                                onClick={handleContinueToWrite}
                                disabled={!selectedProjectId || !selectedGoalId}
                            >
                                Continue to Write
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: Write Report ── */}
                {currentStep === 2 && selectedGoalId && (
                    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', overflow: 'hidden', animation: `fadeIn ${animation.fast}`, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: `1px solid ${colors.border}` }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors.teal }} />
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: colors.text }}>Write Report</div>
                                <div style={{ fontSize: '12px', color: colors.text3, marginTop: '2px' }}>
                                    {eligibleGoals.find(g => g.id === selectedGoalId)?.name} • {selectedDate}
                                </div>
                            </div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <textarea
                                autoFocus
                                value={reportText}
                                onChange={e => setReportText(e.target.value)}
                                placeholder="Describe your work, results, and impact. Evidence and metrics strengthen your score..."
                                style={{
                                    width: '100%', minHeight: '360px', background: 'transparent', border: 'none', padding: '24px',
                                    color: colors.text, fontSize: '15px', fontFamily: typography.fonts.body, outline: 'none', resize: 'vertical', lineHeight: 1.7
                                }}
                            />
                        </div>

                        <div style={{ padding: '16px 20px', background: colors.surface2, borderTop: `1px solid ${colors.border}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: reportText.length >= 50 ? colors.green : colors.text3 }} className="font-numeric">
                                        {reportText.length} / 3,000 chars
                                    </span>
                                    <Button
                                        variant="primary"
                                        disabled={!canAnalyze || isAnalyzing || isSubmitting}
                                        icon="sparkles"
                                        onClick={handleAnalyze}
                                        style={{ boxShadow: canAnalyze ? `0 4px 12px ${colors.accent}40` : 'none' }}
                                    >
                                        {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
                                    </Button>
                                </div>
                            </div>
                            {reportText.length > 0 && reportText.length < 50 && (
                                <div style={{ fontSize: '12px', color: colors.warn, textAlign: 'right', marginTop: '8px', fontWeight: 600 }}>
                                    Add at least {50 - reportText.length} more characters to analyze.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Sidebar ─────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '80px' }}>
                {currentStep === 1 && renderUrgentGoals()}
                <Accordion
                    allowMultiple={true}
                    initialOpenIndices={currentStep === 2 ? [0, 1] : [0]}
                    items={[
                        ...(currentStep === 2 ? [{
                            title: "How are reports scored",
                            content: (
                                <div style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ fontSize: '12px', color: colors.text3, lineHeight: 1.6 }}>
                                        AI reads your report against your goal's criteria &amp; instructions, your org's metrics, and past submission history to produce a score.
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <div style={{ flex: 1, background: `${colors.accent}12`, border: `1px solid ${colors.accent}30`, borderRadius: radius.lg, padding: '10px 12px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '20px', fontWeight: 900, color: colors.accent, lineHeight: 1 }}>{goalWeight}%</div>
                                            <div style={{ fontSize: '10px', fontWeight: 700, color: colors.accent, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Goal Alignment</div>
                                            <div style={{ fontSize: '10.5px', color: colors.text3, marginTop: '4px', lineHeight: 1.4 }}>Criteria &amp; instructions</div>
                                        </div>
                                        <div style={{ flex: 1, background: `${colors.purple}12`, border: `1px solid ${colors.purple}30`, borderRadius: radius.lg, padding: '10px 12px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '20px', fontWeight: 900, color: colors.purple, lineHeight: 1 }}>{100 - goalWeight}%</div>
                                            <div style={{ fontSize: '10px', fontWeight: 700, color: colors.purple, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Org Metrics</div>
                                            <div style={{ fontSize: '10.5px', color: colors.text3, marginTop: '4px', lineHeight: 1.4 }}>{initialMetrics.length} metric{initialMetrics.length !== 1 ? 's' : ''} active</div>
                                        </div>
                                    </div>
                                    <div style={{ borderTop: `1px solid ${colors.border}` }} />
                                    <div>
                                        <div style={{ fontSize: '11px', fontWeight: 800, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Tips to score higher</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ fontSize: '12px', color: colors.text2, lineHeight: 1.5 }}>
                                                <div style={{ fontWeight: 800, color: colors.accent, marginBottom: '3px' }}>① Be specific</div>
                                                <span style={{ color: colors.danger, opacity: 0.8 }}>✗ "Worked on the app"</span><br />
                                                <span style={{ color: colors.green }}>✓ "Fixed login bug, cut load time by 40%"</span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: colors.text2, lineHeight: 1.5 }}>
                                                <div style={{ fontWeight: 800, color: colors.accent, marginBottom: '3px' }}>② Explain what you did and why</div>
                                                Don't just list tasks — say what changed or improved as a result.
                                            </div>
                                            <div style={{ fontSize: '12px', color: colors.text2, lineHeight: 1.5 }}>
                                                <div style={{ fontWeight: 800, color: colors.accent, marginBottom: '3px' }}>③ Cover your goal and org metrics</div>
                                                Touch on both — the AI only scores what it sees in your report.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        }] : []),
                        {
                            title: "Selected Context",
                            content: (() => {
                                return (
                                    <div style={{ paddingTop: '8px' }}>
                                        {selectedProjectId ? (
                                            <div style={{ fontSize: '13px', color: colors.text2, marginBottom: '8px' }}>
                                                <strong>Project:</strong> <br />
                                                {initialProjects.find(p => p.id === selectedProjectId)?.name || 'Unknown'}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '12px', color: colors.text3 }}>No project selected.</div>
                                        )}
                                        {selectedDate && (
                                            <div style={{ fontSize: '13px', color: colors.text2, marginTop: '8px' }}>
                                                <strong>Submission Date:</strong> <br />
                                                {selectedDate}
                                                {isBackdatedSelection && <span style={{ color: colors.warn, marginLeft: '4px', fontSize: '11px', fontWeight: 800 }}>(LATE)</span>}
                                            </div>
                                        )}
                                        {selectedGoal && (
                                            <>
                                                <div style={{ borderTop: `1px solid ${colors.border}`, margin: '12px 0' }} />
                                                <div style={{ fontSize: '13px', color: colors.text2, marginBottom: '10px' }}>
                                                    <strong>Goal:</strong> <br />
                                                    {selectedGoal.name}
                                                </div>
                                                <div style={{ fontSize: '11.5px', fontWeight: 800, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Instructions</div>
                                                <div style={{ fontSize: '12.5px', color: colors.text2, lineHeight: 1.6, marginBottom: '12px' }}>
                                                    {selectedGoal.instructions || 'No instructions provided.'}
                                                </div>
                                                {selectedGoal.criteria && selectedGoal.criteria.length > 0 && (
                                                    <>
                                                        <div style={{ fontSize: '11.5px', fontWeight: 800, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Evaluation Criteria</div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            {selectedGoal.criteria.map((c: any, i: number) => (
                                                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px', color: colors.text2, padding: '4px 0', borderBottom: `1px solid ${colors.border}` }}>
                                                                    <span>{c.name}</span>
                                                                    {c.weight != null && (
                                                                        <span style={{ fontSize: '11px', fontWeight: 700, color: colors.accent, background: `${colors.accent}18`, borderRadius: '4px', padding: '1px 6px', marginLeft: '8px', flexShrink: 0 }}>
                                                                            {c.weight}%
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )
                            })()
                        },
                        ...(currentStep === 2 ? [{
                            title: "Organisation Metrics",
                            content: (
                                <div style={{ paddingTop: '8px' }}>
                                    {initialMetrics.length === 0 ? (
                                        <div style={{ fontSize: '12px', color: colors.text3 }}>No metrics configured.</div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            {initialMetrics.map((m: any, i: number) => (
                                                <div key={m.id || i} style={{ paddingTop: i === 0 ? '0' : '10px', paddingBottom: '10px', borderBottom: i < initialMetrics.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                                                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: colors.text2, marginBottom: '2px' }}>{m.name}</div>
                                                    <div style={{ fontSize: '12px', color: colors.text3, lineHeight: 1.5 }}>{m.description || 'No description.'}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        }] : []),
                    ]}
                />
            </div>

            {/* Footer — back button */}
            {currentStep > 1 && (
                <footer style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0, height: '80px', padding: '0 32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
                    background: `${colors.bg}ee`, backdropFilter: 'blur(12px)', borderTop: `1px solid ${colors.border}`, zIndex: 10
                }}>
                    <Button variant="secondary" onClick={goBack}>
                        Back to Step {currentStep - 1}
                    </Button>
                </footer>
            )}

            <AnalysisModal
                isOpen={isModalOpen}
                isAnalyzing={isAnalyzing}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmSubmit}
                goals={analysisResultsGoals}
                orgMetrics={analysisResultsOrg}
                weights={analysisResults?.weights}
                summary={analysisResults?.summary}
            />
        </div>
    )
}
