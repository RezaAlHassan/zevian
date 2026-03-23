'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { colors, radius, typography, animation, layout, shadows } from '@/design-system'
import { Icon, Button, Badge } from '@/components/atoms'
import { StepTracker, AnalysisModal, Accordion, DatePicker } from '@/components/molecules'
import { analyzeReportAction, submitReportAction, getEligibleGoalsAction } from '@/app/actions/reportActions'

const STEPS = [
    { id: 1, label: 'Context' },
    { id: 2, label: 'Goal' },
    { id: 3, label: 'Write' },
    { id: 4, label: 'Review' },
]

interface Props {
    initialProjects: any[]
    initialGoals: any[]
    initialMetrics: any[]
    employeeId: string
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

export function SubmitReportClient({ initialProjects, initialGoals, initialMetrics, employeeId, aiConfig, backdateSettings, pendingPeriods }: Props) {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)

    // Backdate settings
    const isLateAllowed = backdateSettings?.allowLateSubmissions ?? aiConfig?.allowLateSubmissions ?? aiConfig?.allowLate ?? true
    const backdateLimitDays: number | null = backdateSettings?.backdateLimitDays ?? null

    const todayStr = new Date().toLocaleDateString('en-CA')  // YYYY-MM-DD local
    const minDateStr = (() => {
        if (!isLateAllowed || backdateLimitDays === null) return todayStr
        if (backdateLimitDays === 0) return '2020-01-01'  // effectively unlimited
        const d = new Date()
        d.setDate(d.getDate() - backdateLimitDays)
        return d.toLocaleDateString('en-CA')
    })()

    // ── Wizard State ──────────────────────────────────────────
    // Step 1: Context
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
    const [selectedDate, setSelectedDate] = useState(todayStr)
    const isBackdatedSelection = selectedDate < todayStr

    // Step 2: Goals
    const [eligibleGoals, setEligibleGoals] = useState<any[]>([])
    const [isLoadingGoals, setIsLoadingGoals] = useState(false)
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
    
    // Step 3: Write & Submit
    const [reportText, setReportText] = useState('')
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisResults, setAnalysisResults] = useState<any>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Reset Step 2 if Step 1 changes
    useEffect(() => {
        setSelectedGoalId(null)
        setEligibleGoals([])
    }, [selectedProjectId, selectedDate])

    // ── Navigation Logic ──────────────────────────────────────
    const handleNextStep1 = async () => {
        if (!selectedProjectId) return
        
        setIsLoadingGoals(true)
        setCurrentStep(2) // Move to step 2 visually first for feedback
        
        try {
            const res = await getEligibleGoalsAction(employeeId, selectedProjectId, selectedDate)
            if (res.success && res.data) {
                setEligibleGoals(res.data)
            } else {
                setError(res.error || 'Failed to load goals.')
                setCurrentStep(1) // Fallback
            }
        } catch (err) {
            console.error(err)
            setError('Failed to fetch eligible goals.')
            setCurrentStep(1) // Fallback
        } finally {
            setIsLoadingGoals(false)
        }
    }

    const selectGoal = (id: string) => {
        setSelectedGoalId(id)
        setCurrentStep(3)
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
    }

    const goBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
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

        const allCriterionScores = analysisResults.goals.flatMap((g: any) => 
            g.criteria.map((c: any) => ({
                goalId: g.id,
                criterionName: c.name,
                score: c.score,
                reasoning: c.reason,
                evidence: c.evidence
            }))
        )

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

    // ── Urgent Goals Helper ─────────────────────────────
    const urgentGoals = useMemo(() => {
        if (!initialGoals || initialGoals.length === 0) return []

        const now = new Date()
        
        const mapped = initialGoals.map((goal: any) => {
            const project = initialProjects.find(p => p.id === goal.projectId)
            
            // Find all periods for this goal
            const goalPeriods = (pendingPeriods || []).filter((p: any) => p.goal_id === goal.id)
            
            // Find the most relevant period: First look for the earliest pending/late period.
            // If none, look for the most recent submitted period.
            let relevantPeriod = goalPeriods.find((p: any) => p.status === 'pending' || p.status === 'late')
            
            let isSubmitted = false
            let hasPeriod = false
            if (!relevantPeriod) {
                // Get the latest submitted period
                const submittedPeriods = goalPeriods.filter((p: any) => p.status === 'submitted')
                if (submittedPeriods.length > 0) {
                    // Sort by period_end descending to get the most recent
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
                    // Calculate next due date
                    const freq = project?.frequency || 'weekly'
                    if (freq === 'daily') nextDueDate.setDate(nextDueDate.getDate() + 1)
                    else if (freq === 'biweekly') nextDueDate.setDate(nextDueDate.getDate() + 14)
                    else if (freq === 'monthly') nextDueDate.setMonth(nextDueDate.getMonth() + 1)
                    else nextDueDate.setDate(nextDueDate.getDate() + 7) // weekly
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

        // Sort: pending/late first, submitted last
        // Among pending/late: lowest daysDue first
        // Among submitted: don't sort or sort by daysDue
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
                                    fontSize: '10px', 
                                    fontWeight: 800, 
                                    color: colors.green,
                                    whiteSpace: 'nowrap',
                                    padding: '3px 6px',
                                    background: `${colors.green}15`,
                                    borderRadius: '4px'
                                }}>
                                    <Icon name="check" size={10} />
                                    Submitted
                                </div>
                            ) : ug.hasPeriod ? (
                                <div style={{ 
                                    fontSize: '10px', 
                                    fontWeight: 800, 
                                    color: ug.isLate ? colors.danger : colors.warn,
                                    whiteSpace: 'nowrap',
                                    padding: '3px 6px',
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

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '24px', alignItems: 'start', paddingBottom: '120px' }}>
            {/* ── Main Flow ───────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                <StepTracker steps={STEPS} currentStep={currentStep} />
                
                {error && (
                    <div style={{ padding: '12px 16px', background: `${colors.warn}10`, border: `1px solid ${colors.warn}30`, borderRadius: radius.lg, color: colors.warn, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon name="alert" size={16} color={colors.warn} />
                        {error}
                    </div>
                )}

                {/* STEP 1: Context Selection */}
                {currentStep === 1 && (
                    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', overflow: 'visible', animation: `fadeIn ${animation.fast}` }}>
                        <div style={{ padding: '24px 24px 16px 24px', borderBottom: `1px solid ${colors.border}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${colors.accent}15`, color: colors.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon name="briefcase" size={16} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px', margin: 0, color: colors.text }}>Project Context</h2>
                                    <p style={{ fontSize: '13px', color: colors.text3, margin: '2px 0 0 0' }}>Select the specific project you are reporting on.</p>
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
                                    <Icon name={selectedProjectId === p.id ? "check" : "briefcase"} size={16} />
                                    {p.name}
                                </div>
                            ))}
                        </div>

                        {/* Date Selector */}
                        {isLateAllowed && (
                            <div style={{ padding: '24px', background: `${colors.surface2}`, borderTop: `1px solid ${colors.border}` }}>
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
                                    <div>
                                        <DatePicker
                                            selectedDate={selectedDate}
                                            onDateChange={setSelectedDate}
                                            minDate={new Date(minDateStr + 'T12:00:00')}
                                            maxDate={new Date(todayStr + 'T12:00:00')}
                                            hasWarning={isBackdatedSelection}
                                        />
                                    </div>
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
                        <div style={{ 
                            padding: '24px', 
                            borderTop: `1px solid ${colors.border}`, 
                            display: 'flex', 
                            justifyContent: 'flex-end',
                            borderBottomLeftRadius: '16px',
                            borderBottomRightRadius: '16px'
                        }}>
                            <Button variant="primary" icon="chevronRight" onClick={handleNextStep1} disabled={!selectedProjectId}>
                                Select Goals
                            </Button>
                        </div>
                    </div>
                )}

                {/* STEP 2: Goal Selection */}
                {currentStep === 2 && (
                    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', overflow: 'hidden', animation: `fadeIn ${animation.fast}` }}>
                        <div style={{ padding: '24px 24px 16px 24px', borderBottom: `1px solid ${colors.border}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${colors.purple}15`, color: colors.purple, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon name="target" size={16} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px', margin: 0, color: colors.text }}>Select Goal</h2>
                                    <p style={{ fontSize: '13px', color: colors.text3, margin: '2px 0 0 0' }}>Choose ONE active goal to report on for the selected period.</p>
                                </div>
                            </div>
                        </div>

                        {isLoadingGoals ? (
                            <div style={{ padding: '60px', textAlign: 'center', color: colors.text3 }}>Loading eligible goals...</div>
                        ) : eligibleGoals.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${colors.green}15`, color: colors.green, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <Icon name="check" size={24} />
                                </div>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: colors.text, marginBottom: '8px' }}>All Caught Up!</h3>
                                <p style={{ fontSize: '14px', color: colors.text3, maxWidth: '400px', margin: '0 auto', lineHeight: 1.5 }}>
                                    You have already submitted reports for all active goals in this project for the reporting period encompassing <strong>{selectedDate}</strong>.
                                </p>
                            </div>
                        ) : (
                            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                                {eligibleGoals.map(goal => {
                                    const isSelected = selectedGoalId === goal.id
                                    return (
                                        <div 
                                            key={goal.id} 
                                            onClick={() => selectGoal(goal.id)}
                                            style={{ 
                                                background: isSelected ? `${colors.accent}10` : colors.bg,
                                                border: `1.5px solid ${isSelected ? colors.accent : colors.border}`,
                                                borderRadius: '16px', padding: '20px', cursor: 'pointer',
                                                transition: `all ${animation.fast}`,
                                                boxShadow: isSelected ? `0 4px 16px ${colors.accent}20` : 'none',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '15px', fontWeight: 800, color: colors.text, marginBottom: '4px', lineHeight: 1.3 }}>{goal.name}</div>
                                                    <div style={{ fontSize: '12px', color: colors.text3 }}>
                                                        {goal.criteria?.length || 0} criteria attached
                                                    </div>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: '13px', color: colors.text2, lineHeight: 1.5, marginBottom: '0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {goal.description || 'No description provided.'}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3: Report Editor */}
                {currentStep === 3 && selectedGoalId && (
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
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Button variant="secondary" size="sm" icon="linkExternal">Attach evidence</Button>
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

            {/* ── Sidebar Context ─────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '80px' }}>
                {currentStep < 3 && renderUrgentGoals()}
                <Accordion 
                    allowMultiple={true}
                    initialOpenIndices={currentStep === 3 ? [0, 1] : [0]}
                    items={[
                        ...(currentStep === 3 ? [{
                            title: "How to write a report",
                            content: (
                                <div style={{ paddingTop: '8px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ fontSize: '12.5px', color: colors.text2, lineHeight: 1.6 }}>
                                            <div style={{ fontWeight: 800, color: colors.accent, marginBottom: '2px' }}>① Show your work</div>
                                            Say <strong>"Refactored the auth module, reducing API response time by 30%."</strong>
                                        </div>
                                        <div style={{ fontSize: '12.5px', color: colors.text2, lineHeight: 1.6 }}>
                                            <div style={{ fontWeight: 800, color: colors.accent, marginBottom: '2px' }}>② Address criteria directly</div>
                                            Scores are based exclusively on goal criteria and org metrics.
                                        </div>
                                    </div>
                                </div>
                            )
                        }] : []),
                        {
                            title: "Selected Context",
                            content: (
                                <div style={{ paddingTop: '8px' }}>
                                    {selectedProjectId ? (
                                        <div style={{ fontSize: '13px', color: colors.text2, marginBottom: '8px' }}>
                                            <strong>Project:</strong> <br/>
                                            {initialProjects.find(p => p.id === selectedProjectId)?.name || 'Unknown'}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '12px', color: colors.text3 }}>No project selected.</div>
                                    )}
                                    {selectedDate && (
                                        <div style={{ fontSize: '13px', color: colors.text2, marginTop: '8px' }}>
                                            <strong>Submission Date:</strong> <br/>
                                            {selectedDate}
                                            {isBackdatedSelection && <span style={{ color: colors.warn, marginLeft: '4px', fontSize: '11px', fontWeight: 800 }}>(LATE)</span>}
                                        </div>
                                    )}
                                </div>
                            )
                        }
                    ]}
                />
            </div>

            {/* Footer Navigation bar */}
            {!isAnalyzing && currentStep < 4 && (
                <footer style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0, height: '80px', padding: '0 32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
                    background: `${colors.bg}ee`, backdropFilter: 'blur(12px)', borderTop: `1px solid ${colors.border}`, zIndex: 10
                }}>
                    {currentStep > 1 && (
                        <Button variant="secondary" onClick={goBack}>
                            Back to Step {currentStep - 1}
                        </Button>
                    )}
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
