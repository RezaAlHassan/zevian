'use client'

import { colors, radius, typography, animation, layout, shadows, getAvatarGradient, getInitials, getScoreColor } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { StatusPill } from '@/components/atoms/StatusPill'
import { ScoreDisplay, MiniBar, ScoreBar } from '@/components/atoms/Score'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Report } from '@/types'
import { useScoreReport } from '@/hooks/useScoreReport'
import { overrideReportScoreAction } from '@/app/actions/reportActions'
import { calculateReportStatus } from '@/lib/utils/reportStatus'

interface ReportDetailProps {
    report: Report
    role?: 'manager' | 'employee'
    canOverride?: boolean
}

export function ReportDetailView({ report, role = 'manager', canOverride = true }: ReportDetailProps) {
    const router = useRouter()
    const { loading: isScoring, error: scoringError, scoreReport } = useScoreReport()
    
    const [activeTab, setActiveTab] = useState<'breakdown' | 'content' | 'override' | 'activity'>('breakdown')
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
                    weight: c.weight
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
        const result = await overrideReportScoreAction(report.id, numScore, overrideReason)
        setIsSavingOverride(false)

        if (result.success) {
            setOverrideScore('')
            setOverrideReason('')
            router.refresh()
        } else {
            alert(result.error || "Failed to save override")
        }
    }

    const hasScored = !!evaluationData
    const effectiveScore = report.managerOverallScore ?? evaluationData?.overall_score ?? report.evaluationScore
    const scoreColor = getScoreColor(effectiveScore ?? 0)
    const employeeName = report.employees?.name || 'Unknown'
    const goalName = report.goals?.name || 'Unknown Goal'
    const projectName = report.goals?.projects?.name || 'Unknown Project'
    const status = calculateReportStatus({
        isOnLeave: report.isOnLeave,
        reviewedBy: report.reviewedBy,
        evaluationScore: effectiveScore
    })

    return (
        <div style={{ background: colors.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
                <Button variant="secondary" size="sm" onClick={() => router.back()} icon="x">Close</Button>
            </header>

            {/* Score Section */}
            <div style={{ padding: '22px 26px', background: `linear-gradient(90deg, ${colors.accentGlow}, ${colors.tealGlow})`, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {report.managerOverallScore ? 'Manager Override' : 'AI Score'}
                    </div>
                    {hasScored ? (
                        <ScoreDisplay
                            score={effectiveScore ?? 0}
                            size="xl"
                            showBar={true}
                            animate={true}
                        />
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                            <span style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-3px', lineHeight: 1, color: colors.text3 }}>—</span>
                            <span style={{ fontSize: '18px', color: colors.text3 }}>/10</span>
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: colors.text2 }}>
                        <Icon name="goals" size={14} color={colors.text3} />
                        <strong>{goalName}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: colors.text2 }}>
                        <Icon name="projects" size={14} color={colors.text3} />
                        <strong>{projectName}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: colors.text2 }}>
                        <Icon name="clock" size={14} color={colors.text3} />
                        {report.submissionDate ? new Date(report.submissionDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    <StatusPill status={status as any} score={effectiveScore} />
                    {!hasScored && (
                        <Button
                            variant="primary"
                            size="sm"
                            icon="star"
                            onClick={handleScore}
                            disabled={isScoring}
                        >
                            {isScoring ? 'Scoring...' : 'Score with AI'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Manager Override Form (Prominent for Managers) */}
            {role === 'manager' && canOverride && (
                <div style={{ padding: '20px 26px', background: colors.surface, borderBottom: `1px solid ${colors.border}` }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <Icon name="edit" size={13} color={colors.accent} />
                        Manager Score Override
                    </div>

                    {report.managerOverallScore && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '16px', background: colors.surface2, borderRadius: '10px', marginBottom: '20px', border: `1px solid ${colors.border}` }}>
                            <span className="font-numeric" style={{ fontSize: '24px', fontWeight: 700, color: colors.text3, textDecoration: 'line-through' }}>{report.evaluationScore?.toFixed(1)}</span>
                            <Icon name="chevronRight" size={16} color={colors.text3} />
                            <span className="font-numeric" style={{ fontSize: '32px', fontWeight: 800, color: colors.accent }}>{report.managerOverallScore.toFixed(1)}</span>
                            <span style={{ padding: '3px 8px', background: colors.accentGlow, borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: colors.accent }}>Manager Override</span>
                        </div>
                    )}

                    <div style={{ background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.text2, marginBottom: '8px', textTransform: 'uppercase' }}>Override Score</label>
                                <input
                                    type="number"
                                    min="0" max="10" step="0.1"
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
                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="primary"
                                onClick={handleSaveOverride}
                                disabled={isSavingOverride || !overrideScore || !overrideReason}
                            >
                                {isSavingOverride ? 'Saving...' : 'Save Override'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Summary Section */}
            {hasScored && evaluationData?.summary && (() => {
                const summaryText = evaluationData.summary;
                const flagsMatch = summaryText.match(/^\[FLAGS:\s*(.*?)\]/);
                const flags = flagsMatch ? flagsMatch[1].split(',').map(f => f.trim()) : [];
                const cleanSummary = flagsMatch ? summaryText.replace(flagsMatch[0], '').trim() : summaryText;

                return (
                    <>
                        <div style={{ padding: '14px 26px', background: colors.tealGlow, borderBottom: `1px solid ${colors.border}`, display: 'flex', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: colors.tealGlow, border: `1px solid ${colors.teal}40`, borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, color: colors.teal, height: 'fit-content' }}>
                                <span style={{ fontSize: '14px' }}>✨</span>
                                Zevian AI
                            </div>
                            <div style={{ fontSize: '13px', color: colors.text2, lineHeight: 1.65 }}>{cleanSummary}</div>
                        </div>
                        {flags.length > 0 && (
                            <div style={{ padding: '12px 26px', background: `${colors.warn}10`, borderBottom: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: colors.warn, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Icon name="alert" size={14} color={colors.warn} />
                                    AI Evaluation Warnings
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {flags.map((flag, idx) => (
                                        <div key={idx} style={{ padding: '4px 10px', background: `${colors.warn}20`, border: `1px solid ${colors.warn}40`, borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: colors.warn, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {flag.replace(/_/g, ' ')}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )
            })()}

            {/* Manager Override Reasoning */}
            {report.managerOverrideReasoning && (
                <div style={{ padding: '16px 26px', background: colors.accentGlow, borderBottom: `1px solid ${colors.border}`, display: 'flex', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, color: colors.accent, height: 'fit-content' }}>
                        <Icon name="edit" size={13} color={colors.accent} />
                        Manager Override
                    </div>
                    <div style={{ fontSize: '13px', color: colors.text, lineHeight: 1.65, fontWeight: 500 }}>
                        {report.managerOverrideReasoning}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${colors.border}`, padding: '0 26px', background: colors.surface }}>
                {[
                    { id: 'breakdown', label: 'Analysis' },
                    { id: 'content', label: 'Report Content' },
                    { id: 'activity', label: 'Activity' }
                ].map(tab => (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                            padding: '12px 16px', fontSize: '13px', fontWeight: activeTab === tab.id ? 600 : 500,
                            color: activeTab === tab.id ? colors.accent : colors.text3,
                            cursor: 'pointer', borderBottom: `2px solid ${activeTab === tab.id ? colors.accent : 'transparent'}`,
                            marginBottom: '-1px', transition: `all ${animation.fast}`
                        }}
                    >
                        {tab.label}
                        {tab.id === 'override' && report.managerOverallScore && (
                            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: colors.accent, marginLeft: '6px', verticalAlign: 'middle' }} />
                        )}
                    </div>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px' }}>
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {evaluationData?.criterion_scores?.map((c: any, idx: number) => {
                                    const noEvidence = !c.evidence || c.evidence === 'No specific evidence found.'
                                    const confidenceColor = c.confidence === 'high' ? colors.green : c.confidence === 'medium' ? colors.warn : colors.danger
                                    return (
                                        <div key={idx} style={{ background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '16px' }}>
                                            {/* Header */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text }}>{c.criterionName || c.criterion_id || 'Criterion'}</span>
                                                {c.confidence && (
                                                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: `${confidenceColor}18`, color: confidenceColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        {c.confidence} confidence
                                                    </span>
                                                )}
                                            </div>
                                            {/* Score bar */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                                <ScoreDisplay score={c.score ?? 0} size="md" showBar={false} />
                                                <div style={{ flex: 1 }}>
                                                    <ScoreBar score={c.score ?? 0} />
                                                </div>
                                            </div>
                                            {/* Evidence */}
                                            {!noEvidence && (
                                                <div style={{ background: `${colors.teal}10`, borderLeft: `3px solid ${colors.teal}`, borderRadius: '0 6px 6px 0', padding: '8px 12px', marginBottom: '8px' }}>
                                                    <div style={{ fontSize: '10px', fontWeight: 700, color: colors.teal, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Evidence</div>
                                                    <div style={{ fontSize: '12.5px', color: colors.text2, lineHeight: 1.6, fontStyle: 'italic' }}>"{c.evidence}"</div>
                                                </div>
                                            )}
                                            {/* Reasoning */}
                                            {(c.reasoning || c.feedback) && (
                                                <div style={{ background: colors.surface3, padding: '10px 12px', borderRadius: '7px', fontSize: '12.5px', color: colors.text2, lineHeight: 1.6 }}>
                                                    {c.reasoning || c.feedback}
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {report.managerOverallScore && (
                                <div style={{ display: 'flex', gap: '15px', position: 'relative' }}>
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
                            <div style={{ display: 'flex', gap: '15px', position: 'relative' }}>
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
                            <div style={{ display: 'flex', gap: '15px', position: 'relative' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.green, marginTop: '6px', zIndex: 1 }} />
                                </div>
                                <div style={{ paddingBottom: '20px', flex: 1 }}>
                                    <div style={{ fontSize: '13px', color: colors.text2 }}><strong>{employeeName}</strong> submitted the report</div>
                                    <div style={{ fontSize: '11px', color: colors.text3, marginTop: '2px' }}>{report.submissionDate ? new Date(report.submissionDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Meta */}
            <div style={{ padding: '14px 26px', borderTop: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: colors.text3, background: colors.surface }}>
                <Icon name="clock" size={13} color={colors.text3} />
                Submitted {report.submissionDate ? new Date(report.submissionDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
            </div>
        </div>
    )
}
