'use client'

import { colors, radius, typography, animation, shadows } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { StatusPill } from '@/components/atoms/StatusPill'
import { ScoreDisplay, ScoreBar } from '@/components/atoms/Score'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Report } from '@/types'
import { useScoreReport } from '@/hooks/useScoreReport'
import { overrideReportScoreAction, setCalibrationAction } from '@/app/actions/reportActions'
import { calculateReportStatus } from '@/lib/utils/reportStatus'

interface ReportDetailProps {
    report: Report
    role?: 'manager' | 'employee'
    canOverride?: boolean
}

const SUMMARY_MAX = 200

export function ReportDetailView({ report, role = 'manager', canOverride = true }: ReportDetailProps) {
    const router = useRouter()
    const { loading: isScoring, error: scoringError, scoreReport } = useScoreReport()

    const [activeTab, setActiveTab] = useState<'breakdown' | 'content' | 'activity'>('breakdown')
    const [evaluationData, setEvaluationData] = useState<{
        overall_score: number;
        criterion_scores: any[];
        summary: string;
    } | null>(report.evaluationScore ? {
        overall_score: report.evaluationScore,
        criterion_scores: (report as any).criterionScores || [],
        summary: report.aiSummary || report.evaluationReasoning || ''
    } : null)

    const [overrideScore, setOverrideScore] = useState<string>('')
    const [overrideReason, setOverrideReason] = useState<string>('')
    const [isSavingOverride, setIsSavingOverride] = useState(false)
    const [showOverrideModal, setShowOverrideModal] = useState(false)
    const [showFullSummary, setShowFullSummary] = useState(false)
    const [pendingCalibration, setPendingCalibration] = useState<'adjusted_up' | 'adjusted_down' | null>(null)
    const [localCalibration, setLocalCalibration] = useState<string | null | undefined>(report.managerCalibration)

    const handleScore = async () => {
        if (!report.id || evaluationData) return
        const result = await scoreReport(report.id)
        if (result) {
            setEvaluationData({
                overall_score: result.overall_score,
                criterion_scores: (result as any).criteria_scores?.map((c: any) => ({
                    criterionName: c.name,
                    score: c.score,
                    evidence: c.evidence,
                    reasoning: c.reasoning,
                    confidence: c.confidence,
                    weight: c.weight,
                    coachingNote: c.coaching_note || null
                })) || [],
                summary: result.summary
            })
        }
    }

    const handleSaveOverride = async () => {
        if (!report.id || !overrideScore || !overrideReason) return
        const numScore = parseFloat(overrideScore)
        if (isNaN(numScore) || numScore < 0 || numScore > 10) {
            alert("Please enter a valid score between 0 and 10.")
            return
        }
        setIsSavingOverride(true)
        const result = await overrideReportScoreAction(report.id, numScore, overrideReason, pendingCalibration ?? undefined)
        setIsSavingOverride(false)
        if (result.success) {
            if (pendingCalibration) setLocalCalibration(pendingCalibration)
            setPendingCalibration(null)
            setOverrideScore('')
            setOverrideReason('')
            setShowOverrideModal(false)
            router.refresh()
        } else {
            alert(result.error || "Failed to save override")
        }
    }

    const handleCalibrationAgree = async () => {
        if (!report.id) return
        setIsSavingOverride(true)
        const result = await setCalibrationAction(report.id, 'agree')
        setIsSavingOverride(false)
        if (result.success) {
            setLocalCalibration('agree')
            router.refresh()
        } else {
            alert(result.error || "Failed to save calibration")
        }
    }

    const handleCalibrationDown = () => {
        setPendingCalibration('adjusted_down')
        setShowOverrideModal(true)
    }

    const handleCalibrationUp = () => {
        setPendingCalibration('adjusted_up')
        setShowOverrideModal(true)
    }

    const hasScored = !!evaluationData
    const effectiveScore = report.managerOverallScore ?? evaluationData?.overall_score ?? report.evaluationScore
    const employeeName = report.employees?.name || 'Unknown'
    const goalName = report.goals?.name || 'Unknown Goal'
    const projectName = report.goals?.projects?.name || 'Unknown Project'
    const status = calculateReportStatus({
        isOnLeave: report.isOnLeave,
        reviewedBy: report.reviewedBy,
        evaluationScore: effectiveScore
    })

    const summaryText = evaluationData?.summary ?? ''
    const flagsMatch = summaryText.match(/^\[FLAGS:\s*(.*?)\]/)
    const flags = flagsMatch ? flagsMatch[1].split(',').map((f: string) => f.trim()) : []
    const cleanSummary = flagsMatch ? summaryText.replace(flagsMatch[0], '').trim() : summaryText
    const summaryTruncated = cleanSummary.length > SUMMARY_MAX && !showFullSummary
        ? cleanSummary.slice(0, SUMMARY_MAX) + '…'
        : cleanSummary

    const reportDate = report.submittedForDate
        ? new Date(report.submittedForDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : report.submissionDate
            ? new Date(report.submissionDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : 'N/A'

    return (
        <div style={{ background: colors.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Sticky Header */}
            <header style={{
                position: 'sticky', top: 0, height: '56px',
                background: 'rgba(10,12,16,0.9)', backdropFilter: 'blur(12px)',
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex', alignItems: 'center', padding: '0 24px', gap: '10px', zIndex: 90,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: colors.text3 }}>
                    <Link href="/reports" style={{ color: colors.text2, textDecoration: 'none' }}>Reports</Link>
                    <span style={{ color: colors.text3 }}>/</span>
                    <span style={{ color: colors.text, fontWeight: 500 }}>{employeeName}</span>
                </div>
                <div style={{ flex: 1 }} />
                {scoringError && (
                    <div style={{ fontSize: '12px', color: colors.warn, background: `${colors.warn}10`, padding: '4px 10px', borderRadius: '4px', border: `1px solid ${colors.warn}30` }}>
                        {scoringError}
                    </div>
                )}
                {role === 'manager' && canOverride && hasScored && (
                    localCalibration ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: colors.text2 }}>
                            {localCalibration === 'agree' && '✓ You agreed with this score'}
                            {localCalibration === 'adjusted_down' && '↓ You adjusted this score down'}
                            {localCalibration === 'adjusted_up' && '↑ You adjusted this score up'}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                                onClick={handleCalibrationAgree}
                                disabled={isSavingOverride}
                                style={{ padding: '5px 11px', borderRadius: '6px', border: `1px solid ${colors.border}`, background: colors.surface2, color: colors.green, fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                ✓ Looks Right
                            </button>
                            <button
                                onClick={handleCalibrationDown}
                                style={{ padding: '5px 11px', borderRadius: '6px', border: `1px solid ${colors.border}`, background: colors.surface2, color: colors.warn, fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                ↓ Too High
                            </button>
                            <button
                                onClick={handleCalibrationUp}
                                style={{ padding: '5px 11px', borderRadius: '6px', border: `1px solid ${colors.border}`, background: colors.surface2, color: colors.accent, fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                ↑ Too Low
                            </button>
                        </div>
                    )
                )}
                {role === 'manager' && canOverride && !hasScored && (
                    <Button variant="secondary" size="sm" icon="edit" onClick={() => setShowOverrideModal(true)}>
                        {report.managerOverallScore ? 'Edit Override' : 'Override Score'}
                    </Button>
                )}
            </header>

            <div style={{ padding: '28px 28px 0' }}>
                {/* Hero Card */}
                <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: '20px',
                    marginBottom: '24px', padding: '24px',
                    background: colors.surface, border: `1px solid ${colors.border}`,
                    borderRadius: radius['3xl'],
                }}>
                    {/* Icon */}
                    <div style={{
                        width: '52px', height: '52px', borderRadius: radius['2xl'],
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: colors.surface2, border: `1px solid ${colors.border}`, flexShrink: 0,
                    }}>
                        <Icon name="user" size={24} color={colors.accent} />
                    </div>

                    {/* Center */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h1 style={{ fontFamily: typography.fonts.display, fontSize: '21px', fontWeight: 800, color: colors.text, letterSpacing: '-0.5px', marginBottom: '6px' }}>
                            {employeeName}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: colors.text2, marginBottom: '4px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Icon name="goals" size={13} color={colors.text3} />{goalName}
                            </span>
                            <span style={{ color: colors.text3 }}>·</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Icon name="projects" size={13} color={colors.text3} />{projectName}
                            </span>
                            <span style={{ color: colors.text3 }}>·</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Icon name="clock" size={13} color={colors.text3} />{reportDate}
                            </span>
                        </div>

                        {hasScored && cleanSummary && (
                            <p style={{ fontSize: '13px', color: colors.text2, lineHeight: 1.6, marginTop: '10px', marginBottom: '0' }}>
                                {summaryTruncated}
                                {cleanSummary.length > SUMMARY_MAX && (
                                    <span
                                        onClick={() => setShowFullSummary(v => !v)}
                                        style={{ cursor: 'pointer', color: colors.accent, fontWeight: 600, marginLeft: '4px', fontSize: '12px' }}
                                    >
                                        {showFullSummary ? 'See less' : 'See more'}
                                    </span>
                                )}
                            </p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '14px' }}>
                            <StatusPill status={status as any} score={effectiveScore} />
                            <div style={{ display: 'flex', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, color: colors.text2 }}>
                                {projectName}
                            </div>
                            {report.managerOverrideReasoning && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: colors.accentGlow, border: `1px solid ${colors.accent}30`, borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, color: colors.accent }}>
                                    <Icon name="edit" size={10} color={colors.accent} />
                                    Overridden
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Score */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '11px', color: colors.text3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                            {hasScored ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '20px', padding: '3px 10px', fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {report.managerOverallScore ? 'Manager Override' : 'System Score'}
                                </span>
                            ) : 'Score'}
                        </div>
                        {hasScored ? (
                            <ScoreDisplay score={effectiveScore ?? 0} size="lg" showBar={true} animate={true} />
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                    <span style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, color: colors.text3 }}>—</span>
                                    <span style={{ fontSize: '15px', color: colors.text3 }}>/10</span>
                                </div>
                                <Button variant="primary" size="sm" icon="star" onClick={handleScore} disabled={isScoring}>
                                    {isScoring ? 'Scoring...' : 'Score with AI'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Flags */}
            {flags.length > 0 && (
                <div style={{ margin: '0 28px', padding: '12px 20px', background: `${colors.warn}10`, border: `1px solid ${colors.warn}20`, borderRadius: radius.lg, marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.warn, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Icon name="alert" size={14} color={colors.warn} />
                        AI Evaluation Warnings
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {flags.map((flag: string, idx: number) => (
                            <div key={idx} style={{ padding: '3px 10px', background: `${colors.warn}20`, border: `1px solid ${colors.warn}40`, borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: colors.warn }}>
                                {flag.replace(/_/g, ' ')}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Override reasoning */}
            {report.managerOverrideReasoning && (
                <div style={{ margin: '0 28px 16px', padding: '12px 20px', background: colors.accentGlow, border: `1px solid ${colors.accent}20`, borderRadius: radius.lg, display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '3px 9px', fontSize: '11px', fontWeight: 700, color: colors.accent, whiteSpace: 'nowrap' }}>
                        <Icon name="edit" size={12} color={colors.accent} />
                        Override
                    </div>
                    <div style={{ fontSize: '13px', color: colors.text, lineHeight: 1.65, fontWeight: 500 }}>
                        {report.managerOverrideReasoning}
                    </div>
                </div>
            )}

            {/* Consistency Flag — manager-only, non-STABLE */}
            {role === 'manager' && report.consistencyFlag && report.consistencyFlag !== 'STABLE' && (
                <div style={{
                    margin: '0 28px 16px',
                    padding: '16px 20px',
                    background: `${colors.warn}08`,
                    border: `1px solid ${colors.warn}`,
                    borderRadius: radius.lg,
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.warn, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Icon name="alert" size={13} color={colors.warn} />
                        Pattern Detected
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: colors.warn, marginBottom: '8px' }}>
                        {report.consistencyFlag === 'ESCALATING_CLAIMS' ? 'Escalating Claims' : 'Templated Reporting'}
                    </div>
                    {report.consistencyNote && (
                        <div style={{ fontSize: '13px', color: colors.text, lineHeight: 1.6 }}>
                            {report.consistencyNote}
                        </div>
                    )}
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${colors.border}`, padding: '0 28px', background: colors.surface }}>
                {[
                    { id: 'breakdown', label: 'Analysis' },
                    { id: 'content', label: 'Report Content' },
                    { id: 'activity', label: 'Activity' }
                ].map(tab => (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                            padding: '12px 16px', fontSize: '13px',
                            fontWeight: activeTab === tab.id ? 600 : 500,
                            color: activeTab === tab.id ? colors.accent : colors.text3,
                            cursor: 'pointer',
                            borderBottom: `2px solid ${activeTab === tab.id ? colors.accent : 'transparent'}`,
                            marginBottom: '-1px', transition: `all ${animation.fast}`
                        }}
                    >
                        {tab.label}
                    </div>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
                {activeTab === 'breakdown' && (
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <Icon name="target" size={13} color={colors.accent} />
                            Criteria Analysis
                        </div>
                        {!hasScored || !evaluationData?.criterion_scores?.length ? (
                            <div style={{ padding: '60px 0', textAlign: 'center' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: colors.accentGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <Icon name="star" size={26} color={colors.accent} />
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 800, color: colors.text, marginBottom: '8px' }}>Not yet scored</div>
                                <div style={{ fontSize: '13px', color: colors.text3, maxWidth: '260px', margin: '0 auto' }}>Click "Score with AI" to generate an objective breakdown against each criterion.</div>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                {evaluationData.criterion_scores.map((c: any, idx: number) => {
                                    const noEvidence = !c.evidence || c.evidence === 'No specific evidence found.'
                                    const confidenceColor = c.confidence === 'high' ? colors.green : c.confidence === 'medium' ? colors.warn : colors.danger
                                    return (
                                        <div key={idx} style={{ background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text, lineHeight: 1.3 }}>{c.criterionName || c.criterion_id || 'Criterion'}</span>
                                                {c.confidence && (
                                                    <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: `${confidenceColor}18`, color: confidenceColor, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>
                                                        {c.confidence}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <ScoreDisplay score={c.score ?? 0} size="sm" showBar={false} />
                                                <div style={{ flex: 1 }}>
                                                    <ScoreBar score={c.score ?? 0} />
                                                </div>
                                            </div>
                                            {!noEvidence && (
                                                <div style={{ background: `${colors.teal}10`, borderLeft: `2px solid ${colors.teal}`, borderRadius: '0 5px 5px 0', padding: '7px 10px' }}>
                                                    <div style={{ fontSize: '9px', fontWeight: 700, color: colors.teal, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Evidence</div>
                                                    <div style={{ fontSize: '12px', color: colors.text2, lineHeight: 1.5, fontStyle: 'italic' }}>"{c.evidence}"</div>
                                                </div>
                                            )}
                                            {(c.reasoning || c.feedback) && (
                                                <div style={{ background: colors.surface3, padding: '8px 10px', borderRadius: '6px', fontSize: '12px', color: colors.text2, lineHeight: 1.55 }}>
                                                    {c.reasoning || c.feedback}
                                                </div>
                                            )}
                                            {c.coachingNote && (
                                                <div style={{ borderLeft: '2px solid #f59e0b', background: 'rgba(245,158,11,0.08)', borderRadius: '0 5px 5px 0', padding: '7px 10px' }}>
                                                    <div style={{ fontSize: '9px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Coaching Note</div>
                                                    <div style={{ fontSize: '12px', color: colors.text2, lineHeight: 1.55 }}>{c.coachingNote}</div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'content' && (
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <Icon name="fileText" size={13} color={colors.accent} />
                            Submitted Content
                        </div>
                        <div style={{ background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '20px', fontSize: '13.5px', lineHeight: 1.8, color: colors.text, whiteSpace: 'pre-wrap' }}>
                            {report.reportText}
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <Icon name="clock" size={13} color={colors.accent} />
                            Activity Log
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {report.managerOverallScore && (
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.accent, marginTop: '6px', zIndex: 1 }} />
                                        <div style={{ width: '1px', flex: 1, background: colors.border, margin: '4px 0' }} />
                                    </div>
                                    <div style={{ paddingBottom: '20px', flex: 1 }}>
                                        <div style={{ fontSize: '13px', color: colors.text2 }}><strong>Manager</strong> overrode the score to <strong>{report.managerOverallScore.toFixed(1)}</strong></div>
                                        {report.managerOverrideReasoning && (
                                            <div style={{ marginTop: '6px', padding: '8px 12px', background: colors.surface2, borderRadius: '6px', fontSize: '12px', color: colors.text3, fontStyle: 'italic' }}>
                                                "{report.managerOverrideReasoning}"
                                            </div>
                                        )}
                                        <div style={{ fontSize: '11px', color: colors.text3, marginTop: '4px' }}>Overrides supersede AI evaluation</div>
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: report.managerOverallScore ? colors.text3 : colors.accent, marginTop: '6px', zIndex: 1 }} />
                                    <div style={{ width: '1px', flex: 1, background: colors.border, margin: '4px 0' }} />
                                </div>
                                <div style={{ paddingBottom: '20px', flex: 1 }}>
                                    <div style={{ fontSize: '13px', color: colors.text2 }}>
                                        <strong>Zevian AI</strong> scored this report — overall {report.evaluationScore?.toFixed(1) || '—'}
                                        {report.managerOverallScore && <span style={{ color: colors.text3, fontStyle: 'italic', marginLeft: '6px' }}>(Overridden)</span>}
                                    </div>
                                    <div style={{ fontSize: '11px', color: colors.text3, marginTop: '2px' }}>{report.submissionDate ? new Date(report.submissionDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.green, marginTop: '6px', zIndex: 1 }} />
                                </div>
                                <div style={{ paddingBottom: '20px', flex: 1 }}>
                                    <div style={{ fontSize: '13px', color: colors.text2 }}>
                                        <strong>{employeeName}</strong> submitted the report
                                        {report.submittedForDate && report.submittedForDate !== report.submissionDate?.slice(0, 10) && (
                                            <span style={{ color: colors.warn, fontWeight: 600, marginLeft: '6px', fontSize: '11px' }}>
                                                (for {new Date(report.submittedForDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '11px', color: colors.text3, marginTop: '2px' }}>{report.submissionDate ? new Date(report.submissionDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Manager Override Modal */}
            {showOverrideModal && (
                <div
                    onClick={() => setShowOverrideModal(false)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 200,
                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: colors.surface, border: `1px solid ${colors.border}`,
                            borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '520px',
                            boxShadow: shadows.cardHover,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="edit" size={15} color={colors.accent} />
                                <span style={{ fontSize: '14px', fontWeight: 700, color: colors.text }}>Manager Score Override</span>
                            </div>
                            <button
                                onClick={() => setShowOverrideModal(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                            >
                                <Icon name="x" size={18} color={colors.text3} />
                            </button>
                        </div>

                        {report.managerOverallScore && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '14px 16px', background: colors.surface2, borderRadius: '10px', marginBottom: '20px', border: `1px solid ${colors.border}` }}>
                                <span className="font-numeric" style={{ fontSize: '22px', fontWeight: 700, color: colors.text3, textDecoration: 'line-through' }}>{report.evaluationScore?.toFixed(1)}</span>
                                <Icon name="chevronRight" size={16} color={colors.text3} />
                                <span className="font-numeric" style={{ fontSize: '28px', fontWeight: 800, color: colors.accent }}>{report.managerOverallScore.toFixed(1)}</span>
                                <span style={{ padding: '3px 8px', background: colors.accentGlow, borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: colors.accent }}>Current Override</span>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.text2, marginBottom: '8px', textTransform: 'uppercase' }}>Override Score</label>
                                <input
                                    type="number" min="0" max="10" step="0.1"
                                    placeholder={report.evaluationScore?.toFixed(1) || '0.0'}
                                    value={overrideScore}
                                    onChange={(e) => setOverrideScore(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', background: colors.surface3, border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.text, fontSize: '15px', fontWeight: 600, outline: 'none' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.text2, marginBottom: '8px', textTransform: 'uppercase' }}>Reason (Required)</label>
                                <textarea
                                    placeholder="Explain why you're adjusting the score..."
                                    value={overrideReason}
                                    onChange={(e) => setOverrideReason(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', background: colors.surface3, border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.text, fontSize: '13px', lineHeight: 1.5, resize: 'none', minHeight: '80px', outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <Button variant="secondary" onClick={() => setShowOverrideModal(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleSaveOverride} disabled={isSavingOverride || !overrideScore || !overrideReason}>
                                {isSavingOverride ? 'Saving...' : 'Save Override'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
