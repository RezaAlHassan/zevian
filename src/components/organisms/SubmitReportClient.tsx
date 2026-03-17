'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { colors, radius, typography, animation, layout, shadows, getScoreColor } from '@/design-system'
import { Icon, Button, Badge } from '@/components/atoms'
import { StepTracker, AnalysisModal } from '@/components/molecules'
import { analyzeReportAction, submitReportAction } from '@/app/actions/reportActions'

const STEPS = [
    { id: 1, label: 'Project' },
    { id: 2, label: 'Goals' },
    { id: 3, label: 'Write' },
    { id: 4, label: 'Review' },
]

interface Props {
    initialProjects: any[]
    initialGoals: any[]
    initialMetrics: any[]
    employeeId: string
}

export function SubmitReportClient({ initialProjects, initialGoals, initialMetrics, employeeId }: Props) {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
    const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([])
    const [reportText, setReportText] = useState('')
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisResults, setAnalysisResults] = useState<any>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const selectedProject = initialProjects.find(p => p.id === selectedProjectId)
    const availableGoals = initialGoals.filter(g => g.projectId === selectedProjectId)

    const canGoToWrite = selectedProjectId && selectedGoalIds.length > 0
    const canAnalyze = reportText.trim().length >= 50

    const handleProjectSelect = (id: string) => {
        setSelectedProjectId(id)
        setSelectedGoalIds([])
        setCurrentStep(2)
    }

    const toggleGoal = (id: string) => {
        const newGoals = selectedGoalIds.includes(id)
            ? selectedGoalIds.filter(gid => gid !== id)
            : [...selectedGoalIds, id]
        setSelectedGoalIds(newGoals)
        if (newGoals.length > 0) setCurrentStep(3)
        else setCurrentStep(2)
    }

    const handleAnalyze = async () => {
        setIsAnalyzing(true)
        setError(null)
        setIsModalOpen(true) // Open immediately to show the loading state

        const goalsToAnalyze = initialGoals.filter(g => selectedGoalIds.includes(g.id))
        
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
            // setIsModalOpen(true) // Already open
        } catch (err: any) {
            setError(err.message || 'Analysis failed')
            setIsModalOpen(false)
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleConfirmSubmit = async () => {
        if (!analysisResults) return
        
        setIsSubmitting(true)
        setError(null)

        // 1. Calculate weighted averages
        const goalAvg = analysisResults.goals.reduce((acc: number, g: any) => acc + g.score, 0) / (analysisResults.goals.length || 1)
        const orgAvg = analysisResults.orgMetrics.reduce((acc: number, m: any) => acc + m.score, 0) / (analysisResults.orgMetrics.length || 1)

        // 2. Apply weights
        // Total = (GoalAvg * goalWeight/100) + (OrgAvg * orgWeight/100)
        // Values from analyzeReportAction already sum to 100 (e.g., 75 + 25)
        const weights = analysisResults.weights || { goalWeight: 75, orgWeight: 25, kbWeight: 0 }
        
        const finalScore = (goalAvg * (weights.goalWeight / 100)) + 
                           (orgAvg * (weights.orgWeight / 100))

        const totalReasoning = [
            ...analysisResults.goals.map((g: any) => g.reason),
            ...analysisResults.orgMetrics.map((m: any) => m.reason)
        ].filter(Boolean).join(' ')

        // Map criteria scores for each goal
        const allCriterionScores = analysisResults.goals.flatMap((g: any) => 
            g.criteria.map((c: any) => ({
                criterionName: c.name,
                score: c.score,
                reasoning: c.reason,
                evidence: c.evidence
            }))
        )

        const result = await submitReportAction({
            goalId: selectedGoalIds[0], // For now, we associate it with the first goal if multiple (system limitation or UI choice)
            reportText,
            employeeId,
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
            router.push('/my-dashboard')
        }, 2000)
    }

    // ── Due Date Logic ────────────────────────
    const dueInfo = useMemo(() => {
        console.log('[DueInfo] Processing goals. available:', availableGoals.length, 'initial:', initialGoals.length)
        const goalsToConsider = availableGoals.length > 0 ? availableGoals : initialGoals
        if (goalsToConsider.length === 0) {
            console.log('[DueInfo] No goals to consider')
            return null
        }

        // Find earliest deadline
        const earliestGoal = goalsToConsider.reduce((earliest, current) => {
            if (!current.deadline) return earliest
            if (!earliest || !earliest.deadline) return current
            return new Date(current.deadline) < new Date(earliest.deadline) ? current : earliest
        }, null as any)

        if (!earliestGoal || !earliestGoal.deadline) {
            console.log('[DueInfo] No earliest goal with deadline found. Showing fallback.')
            const firstGoal = goalsToConsider[0]
            const project = initialProjects.find(p => p.id === firstGoal.projectId)
            const freqText = project?.reportFrequency || project?.frequency || 'Weekly'
            
            return {
                label: "No deadline set",
                sublabel: "",
                color: colors.text3,
                freqText: freqText.charAt(0).toUpperCase() + freqText.slice(1),
                goalName: firstGoal.name,
                projectName: project?.name || 'General'
            }
        }

        const deadline = new Date(earliestGoal.deadline)
        const now = new Date()
        const diffMs = deadline.getTime() - now.getTime()
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
        const isToday = deadline.toDateString() === now.toDateString()
        const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === deadline.toDateString()

        let label = ""
        let sublabel = ""
        let color: string = colors.warn

        if (diffMs < 0) {
            const overdueDays = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)))
            label = overdueDays === 0 ? "Overdue today" : `Overdue by ${overdueDays}d`
            color = colors.danger
        } else if (isToday) {
            const timeStr = deadline.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
            label = "Due today"
            sublabel = `Today · ${timeStr}`
        } else if (isTomorrow) {
            label = "Due tomorrow"
            sublabel = "Tomorrow"
        } else {
            label = `Due in ${diffDays} days`
            sublabel = deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }

        // Frequency (from project if available)
        const project = initialProjects.find(p => p.id === earliestGoal.projectId)
        const freqText = project?.reportFrequency || project?.frequency || 'Weekly'

        return { 
            label, 
            sublabel, 
            color, 
            freqText: freqText.charAt(0).toUpperCase() + freqText.slice(1),
            goalName: earliestGoal.name,
            projectName: project?.name || 'General'
        }
    }, [availableGoals, initialGoals, initialProjects])

    // ── Mapping Results ───────────────────────
    const analysisResultsGoals = useMemo(() => {
        if (analysisResults) return analysisResults.goals
        return selectedGoalIds.map(gid => {
            const g = initialGoals.find(ig => ig.id === gid)
            if (!g) return null
            return {
                name: g.name,
                score: 0,
                reason: 'Awaiting analysis...',
                criteria: (g.criteria || []).map((c: any) => ({
                    name: c.name,
                    score: 0,
                    reason: '',
                    evidence: ''
                }))
            }
        }).filter((g): g is any => g !== null)
    }, [selectedGoalIds, initialGoals, analysisResults])

    const analysisResultsOrg = useMemo(() => {
        if (analysisResults) return analysisResults.orgMetrics.map((m: any) => ({ ...m, emo: '🎯' }))
        return initialMetrics.map(m => ({
            name: m.name,
            score: 0,
            emo: '🎯',
            reason: m.description || 'Org metric evaluation.'
        }))
    }, [initialMetrics, analysisResults])

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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>

            {/* ── Main Flow ───────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                <StepTracker steps={STEPS} currentStep={currentStep} />

                {/* Project Selection */}
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: `1px solid ${colors.border}` }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.accent }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text2 }}>Select Project</span>
                    </div>
                    <div style={{ padding: '18px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {initialProjects.map(p => (
                            <div
                                key={p.id}
                                onClick={() => handleProjectSelect(p.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: radius.lg,
                                    background: selectedProjectId === p.id ? `${colors.accent}12` : colors.surface2,
                                    border: `1.5px solid ${selectedProjectId === p.id ? colors.accent : colors.border}`,
                                    cursor: 'pointer', transition: `all ${animation.fast}`,
                                    color: selectedProjectId === p.id ? colors.accent : colors.text2,
                                    fontWeight: 700, fontSize: '13px'
                                }}
                            >
                                <Icon name="briefcase" size={14} />
                                {p.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Goal Selection */}
                {selectedProjectId && (
                    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', overflow: 'hidden', animation: `fadeIn ${animation.base}` }}>
                        <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: `1px solid ${colors.border}` }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.purple }} />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text2 }}>Select Goals</span>
                            <span style={{ marginLeft: 'auto', fontSize: '11px', color: colors.text3 }}>Step 2 of 4</span>
                        </div>
                        <div style={{ padding: '18px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {availableGoals.map(g => (
                                <div
                                    key={g.id}
                                    onClick={() => toggleGoal(g.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: radius.lg,
                                        background: selectedGoalIds.includes(g.id) ? `${colors.purple}12` : colors.surface2,
                                        border: `1.5px solid ${selectedGoalIds.includes(g.id) ? colors.purple : colors.border}`,
                                        cursor: 'pointer', transition: `all ${animation.fast}`,
                                        color: selectedGoalIds.includes(g.id) ? colors.purple : colors.text2,
                                        fontWeight: 700, fontSize: '13px'
                                    }}
                                >
                                    <Icon name="target" size={14} />
                                    {g.name}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Report Editor */}
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: `1px solid ${colors.border}` }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.teal }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text2 }}>Write Report</span>
                        <span style={{ marginLeft: 'auto', fontSize: '11px', color: colors.text3 }}>Min. 50 characters</span>
                    </div>

                    {selectedGoalIds.length > 0 && (
                        <div style={{ padding: '10px 18px', background: colors.surface2, borderBottom: `1px solid ${colors.border}`, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: colors.text3, textTransform: 'uppercase', marginRight: '6px', alignSelf: 'center' }}>Criteria</span>
                            {selectedGoalIds.flatMap(gid => {
                                const g = initialGoals.find(ig => ig.id === gid)
                                return g?.criteria || []
                            }).map((c: any, i) => (
                                <span key={i} style={{ padding: '3px 8px', borderRadius: '4px', background: `${colors.purple}15`, color: colors.purple, fontSize: '11px', fontWeight: 700, border: `1px solid ${colors.purple}30` }}>
                                    {c.name} <span style={{ opacity: 0.6, fontSize: '9px' }}>{c.weight}%</span>
                                </span>
                            ))}
                            <div style={{ width: '1px', background: colors.border, margin: '0 4px' }} />
                            {initialMetrics.map(m => (
                                <span key={m.id} style={{ padding: '3px 8px', borderRadius: '4px', background: `${colors.accent}15`, color: colors.accent, fontSize: '11px', fontWeight: 700, border: `1px solid ${colors.accent}30` }}>
                                    🎯 {m.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {!canGoToWrite ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: colors.text3 }}>
                            <Icon name="edit" size={32} color={colors.border} style={{ marginBottom: '16px' }} />
                            <div style={{ fontWeight: 800, fontSize: '16px', color: colors.text2, marginBottom: '6px' }}>Select project & goals first</div>
                            <div style={{ fontSize: '13.5px' }}>Then write your report here. AI will score it against your criteria.</div>
                        </div>
                    ) : (
                        <div style={{ padding: '0' }}>
                            {error && (
                                <div style={{ margin: '20px 24px 0 24px', padding: '12px 16px', background: `${colors.warn}10`, border: `1px solid ${colors.warn}30`, borderRadius: radius.lg, color: colors.warn, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Icon name="alert" size={16} color={colors.warn} />
                                    {error}
                                </div>
                            )}
                            <textarea
                                value={reportText}
                                onChange={e => {
                                    setReportText(e.target.value)
                                    if (e.target.value.length >= 50 && currentStep === 3) {
                                        // Keep step 3 active while writing
                                    }
                                }}
                                placeholder="Describe your work, results, and impact. Evidence and metrics strengthen your score..."
                                style={{
                                    width: '100%', minHeight: '320px', background: 'transparent', border: 'none', padding: '24px',
                                    color: colors.text, fontSize: '15px', fontFamily: typography.fonts.body, outline: 'none', resize: 'none', lineHeight: 1.7
                                }}
                            />
                            <div style={{ padding: '14px 20px', borderTop: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Button variant="secondary" size="sm" icon="linkExternal">Attach files</Button>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: reportText.length >= 50 ? colors.green : colors.text3 }} className="font-numeric">
                                        {reportText.length} / 3,000
                                    </span>
                                    <Button
                                        variant="primary"
                                        disabled={!canAnalyze || isAnalyzing || isSubmitting}
                                        icon="sparkles"
                                        onClick={handleAnalyze}
                                        style={{ boxShadow: canAnalyze ? `0 4px 12px ${colors.accent}40` : 'none' }}
                                    >
                                        {isAnalyzing ? 'Analysing...' : 'Analyse & Submit'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Sidebar Context ─────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '80px' }}>

                {/* Due Card */}
                {dueInfo && (
                    <div style={{ background: `${dueInfo.color}10`, border: `1px solid ${dueInfo.color}30`, borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', animation: `fadeIn ${animation.base}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Icon name="clock" color={dueInfo.color} size={16} />
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: dueInfo.color }}>{dueInfo.label}</div>
                                <div style={{ fontSize: '11px', color: `${dueInfo.color}80` }}>{dueInfo.freqText} {dueInfo.sublabel ? `· ${dueInfo.sublabel}` : ''}</div>
                            </div>
                        </div>
                        <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: colors.text3, textTransform: 'uppercase', marginBottom: '2px' }}>{dueInfo.projectName}</div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text2 }}>{dueInfo.goalName}</div>
                        </div>
                    </div>
                )}

                {/* Goal Guidelines */}
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ padding: '14px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon name="list" size={13} color={colors.text3} />
                        <span style={{ fontSize: '10px', fontWeight: 800, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Goal Guidelines</span>
                    </div>
                    <div style={{ padding: '16px' }}>
                        {selectedGoalIds.length === 0 ? (
                            <div style={{ fontSize: '12.5px', color: colors.text3, textAlign: 'center', padding: '20px 0' }}>Select goals to see specific instructions.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {selectedGoalIds.map(gid => {
                                    const g = initialGoals.find(ig => ig.id === gid)
                                    if (!g) return null
                                    return (
                                        <div key={gid} style={{ padding: '12px', background: colors.surface2, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
                                            <div style={{ fontSize: '11.5px', fontWeight: 800, color: colors.purple, marginBottom: '6px' }}>{g.name}</div>
                                            <div style={{ fontSize: '12px', color: colors.text2, lineHeight: 1.6 }}>{g.instructions}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Org Metrics Sidebar */}
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ padding: '14px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon name="users" size={13} color={colors.text3} />
                        <span style={{ fontSize: '10px', fontWeight: 800, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Org Metrics</span>
                        <Badge variant="accent" style={{ marginLeft: 'auto', fontSize: '9px' }}>
                            {analysisResults?.weights ? `${analysisResults.weights.orgWeight}%` : '25%'}
                        </Badge>
                    </div>
                    <div style={{ padding: '12px' }}>
                        <div style={{ fontSize: '11px', color: colors.text3, marginBottom: '12px', lineHeight: 1.5 }}>AI evaluates these dimensions across every report you submit.</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {initialMetrics.map(m => (
                                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: colors.surface2, borderRadius: radius.lg, border: `1px solid ${colors.border}` }}>
                                    <span style={{ fontSize: '14px' }}>🎯</span>
                                    <span style={{ fontSize: '12.5px', fontWeight: 600, flex: 1 }}>{m.name}</span>
                                    <div style={{ width: '40px', height: '2px', background: colors.surface3, borderRadius: '1px' }}>
                                        <div style={{ width: '70%', height: '100%', background: colors.accent }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

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
