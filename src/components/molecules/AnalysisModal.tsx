'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { colors, radius, animation, getScoreColor, typography } from '@/design-system'
import { Icon, Button, Badge } from '@/components/atoms'

interface Criterion {
    name: string
    score: number
    reason: string
    evidence?: string
}

interface GoalResult {
    name: string
    score: number
    reason: string
    criteria: Criterion[]
}

interface AnalysisModalProps {
    isOpen: boolean
    isAnalyzing: boolean
    onClose: () => void
    onConfirm: () => void
    goals: GoalResult[]
    orgMetrics: { name: string; score: number; emo: string; reason: string }[]
    weights?: { goalWeight: number; orgWeight: number; kbWeight: number }
    summary?: string
}

export function AnalysisModal({ isOpen, isAnalyzing, onClose, onConfirm, goals, orgMetrics, weights, summary }: AnalysisModalProps) {
    const [minTimeElapsed, setMinTimeElapsed] = useState(false)
    const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

    useEffect(() => {
        if (isOpen && isAnalyzing) {
            setMinTimeElapsed(false)
            const timer = setTimeout(() => setMinTimeElapsed(true), 1200)
            return () => clearTimeout(timer)
        }
    }, [isOpen, isAnalyzing])

    // Expand first goal's first criterion by default when results arrive
    useEffect(() => {
        if (!isAnalyzing && minTimeElapsed && goals.length > 0) {
            setExpandedCards({ 'goal-0-crit-0': true })
        }
    }, [isAnalyzing, minTimeElapsed, goals.length])

    const analyzing = isAnalyzing || !minTimeElapsed

    const { finalScore, goalAvg, orgAvg } = useMemo(() => {
        if (!goals.length) return { finalScore: 0, goalAvg: 0, orgAvg: 0 }
        
        const gAvg = goals.reduce((acc, g) => acc + g.score, 0) / goals.length
        const oAvg = orgMetrics.reduce((acc, m) => acc + m.score, 0) / (orgMetrics.length || 1)
        
        const gW = weights?.goalWeight ?? 70
        const oW = weights?.orgWeight ?? 30
        
        const fScore = (gAvg * (gW / 100)) + (oAvg * (oW / 100))
        
        return { 
            finalScore: Number(fScore.toFixed(1)), 
            goalAvg: Number(gAvg.toFixed(1)), 
            orgAvg: Number(oAvg.toFixed(1)) 
        }
    }, [goals, orgMetrics, weights])

    const toggleCard = (id: string) => {
        setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }))
    }

    if (!isOpen) return null

    return (
        <div
            style={{
                position: 'fixed', inset: 0, background: 'rgba(5, 7, 10, 0.85)', backdropFilter: 'blur(12px)',
                zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
                animation: `fadeIn ${animation.fast}`
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '24px',
                    width: '100%', maxWidth: '780px', maxHeight: '92vh', display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.6)', 
                    animation: `scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)`
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', color: colors.text2, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                        <Icon name="chevronDown" size={14} style={{ transform: 'rotate(90deg)' }} />
                        Reports
                    </button>
                    <div style={{ width: '1px', height: '18px', background: colors.borderHover }} />
                    <h1 style={{ fontSize: '15px', fontWeight: 700, color: colors.text, fontFamily: typography.fonts.display }}>AI Evaluation</h1>
                    {!analyzing && (
                        <span style={{ fontSize: '13px', color: colors.text3, marginLeft: 'auto' }}>
                            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                    )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
                    {analyzing ? (
                        <div style={{ textAlign: 'center', padding: '80px 0' }}>
                            <div style={{ position: 'relative', width: '64px', height: '64px', margin: '0 auto 32px' }}>
                                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${colors.border}`, borderTopColor: colors.accent, animation: 'spin 1s linear infinite' }} />
                                <div style={{ position: 'absolute', inset: '12px', borderRadius: '50%', border: `2px solid ${colors.border}`, borderBottomColor: colors.teal, animation: 'spin 1.5s linear reverse infinite' }} />
                            </div>
                            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px', fontFamily: typography.fonts.display }}>Scoring your report...</h2>
                            <p style={{ fontSize: '14px', color: colors.text3 }}>Evaluating project context, goals, and organizational metrics.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            
                            {/* Final Score Hero */}
                            <div style={{
                                background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '20px',
                                padding: '32px', marginBottom: '16px', position: 'relative', overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`, opacity: 0.5 }} />
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '32px' }}>
                                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.text3, marginBottom: '6px' }}>Final Score</span>
                                        <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                            <span style={{ fontSize: '72px', fontWeight: 800, color: colors.teal, letterSpacing: '-3px', fontFamily: typography.fonts.display }}>{finalScore.toFixed(1).split('.')[0]}</span>
                                            <span style={{ fontSize: '56px', fontWeight: 700, color: colors.teal, letterSpacing: '-2px', fontFamily: typography.fonts.display }}>.{finalScore.toFixed(1).split('.')[1]}</span>
                                            <span style={{ fontSize: '22px', fontWeight: 500, color: colors.text3, marginLeft: '6px' }}>/10</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 9px', borderRadius: '20px', background: `${colors.accent}15`, color: colors.accent, border: `1px solid ${colors.accent}25` }}>Goals {weights?.goalWeight}%</span>
                                            <span style={{ color: colors.text3, fontSize: '13px', fontWeight: 600, alignSelf: 'center' }}>+</span>
                                            <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 9px', borderRadius: '20px', background: `${colors.teal}15`, color: colors.teal, border: `1px solid ${colors.teal}25` }}>Org {weights?.orgWeight}%</span>
                                        </div>
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: '14px', fontWeight: 400, lineHeight: 1.75, color: colors.text2,
                                            background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '12px',
                                            padding: '16px 18px', position: 'relative'
                                        }}>
                                            <span style={{ position: 'absolute', top: '10px', left: '14px', fontSize: '28px', color: colors.accent, opacity: 0.4, fontWeight: 800 }}>"</span>
                                            <p style={{ paddingLeft: '18px' }}>{summary}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.accent }} />
                                                <span style={{ fontSize: '12px', color: colors.text2, fontWeight: 500 }}>Goal criteria avg: {goalAvg}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.teal }} />
                                                <span style={{ fontSize: '12px', color: colors.text2, fontWeight: 500 }}>Org metrics avg: {orgAvg}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Goal Criteria Breakdown */}
                            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.text3, padding: '0 4px', marginBottom: '10px', marginTop: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Goal criteria · {weights?.goalWeight}% of score
                                <div style={{ flex: 1, height: '1px', background: colors.border }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {goals.flatMap((goal, gi) => goal.criteria.map((crit, ci) => {
                                    const cardId = `goal-${gi}-crit-${ci}`
                                    const isExpanded = expandedCards[cardId]
                                    const scoreColor = getScoreColor(crit.score)
                                    const weightLabel = goal.criteria.length > 1 ? `Weight ${(100/goal.criteria.length).toFixed(0)}%` : 'Target Goal'
                                    
                                    return (
                                        <div key={cardId} style={{ background: colors.surface, border: `1px solid ${isExpanded ? colors.borderHover : colors.border}`, borderRadius: '14px', overflow: 'hidden', transition: 'border-color 0.15s' }}>
                                            <div 
                                                onClick={() => toggleCard(cardId)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer' }}
                                            >
                                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${scoreColor}15`, color: scoreColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, flexShrink: 0 }}>
                                                    <span style={{ margin: 'auto' }}>
                                                        {crit.score.toFixed(1).split('.')[0]}<span style={{ fontSize: '0.8em', opacity: 0.9 }}>.{crit.score.toFixed(1).split('.')[1]}</span>
                                                    </span>
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '14px', fontWeight: 700, color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{crit.name}</div>
                                                    <div style={{ fontSize: '11px', color: colors.text3, fontWeight: 500, marginTop: '2px' }}>{weightLabel} · {goal.name}</div>
                                                </div>
                                                <div style={{ width: '120px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                                                    <div style={{ width: '100%', height: '4px', background: colors.surface3, borderRadius: '2px', overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${crit.score * 10}%`, background: scoreColor, borderRadius: '2px', transition: 'width 0.4s ease' }} />
                                                    </div>
                                                    <span style={{ fontSize: '11px', fontWeight: 600, color: colors.text3 }}>{Math.round(crit.score * 10)} / 100</span>
                                                </div>
                                                <Icon name="chevronDown" size={14} style={{ color: colors.text3, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
                                            </div>
                                            {isExpanded && (
                                                <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${colors.border}`, animation: `fadeIn ${animation.fast}` }}>
                                                    <div style={{ marginTop: '14px' }}>
                                                        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.text3, marginBottom: '8px' }}>AI Reasoning</div>
                                                        <p style={{ fontSize: '13px', lineHeight: 1.7, color: colors.text2 }}>{crit.reason}</p>
                                                    </div>
                                                    {crit.evidence && (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                                                            {crit.evidence.split(',').map((ev, i) => (
                                                                <span key={i} style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: `${colors.green}10`, color: colors.green, border: `1px solid ${colors.green}20` }}>
                                                                    {ev.trim()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                }))}
                            </div>

                            {/* Org Metrics Breakdown */}
                            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.text3, padding: '0 4px', marginBottom: '10px', marginTop: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Org metrics · {weights?.orgWeight}% of score
                                <div style={{ flex: 1, height: '1px', background: colors.border }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                                {orgMetrics.map((m, mi) => (
                                    <div key={mi} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '16px', transition: 'border-color 0.15s' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text }}>{m.name}</div>
                                            <div style={{ fontSize: '18px', fontWeight: 800, color: getScoreColor(m.score) }}>
                                                {m.score.toFixed(1).split('.')[0]}<span style={{ fontSize: '0.8em', opacity: 0.9 }}>.{m.score.toFixed(1).split('.')[1]}</span>
                                            </div>
                                        </div>
                                        <div style={{ width: '100%', height: '3px', background: colors.surface3, borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
                                            <div style={{ height: '100%', width: `${m.score * 10}%`, background: getScoreColor(m.score), borderRadius: '2px' }} />
                                        </div>
                                        <div style={{ fontSize: '12px', lineHeight: 1.6, color: colors.text2 }}>{m.reason}</div>
                                    </div>
                                ))}
                            </div>

                            {/* KB Grounding Strip */}
                            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.text3, padding: '0 4px', marginBottom: '10px', marginTop: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                Knowledge base influence
                                <div style={{ flex: 1, height: '1px', background: colors.border }} />
                            </div>
                            
                            <div style={{
                                background: colors.surface, border: `1px solid ${colors.border}`, borderLeft: `3px solid ${colors.purple}`,
                                borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '12px'
                            }}>
                                <div style={{ width: '28px', height: '28px', flexShrink: 0, background: `${colors.purple}15`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.purple, fontSize: '14px' }}>
                                    ⬡
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.purple, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>Grounding context applied</div>
                                    <p style={{ fontSize: '12px', color: colors.text2, lineHeight: 1.6 }}>
                                        Evaluations are calibrated against the project knowledgebase: async-first standards, documented benchmarks, and REST conventions. These informed scoring thresholds across all metrics.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {!analyzing && (
                    <div style={{ padding: '16px 24px', borderTop: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '10px', background: colors.bg }}>
                        <Button variant="secondary" onClick={onClose} style={{ flex: 0.4 }}>Revise Report</Button>
                        <div style={{ flex: 1 }} />
                        <Button variant="primary" onClick={onConfirm} style={{ flex: 0.6 }}>Approve & Finalize</Button>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { 
                    from { transform: scale(0.96) translateY(10px); opacity: 0; } 
                    to { transform: scale(1) translateY(0); opacity: 1; } 
                }
            `}</style>
        </div>
    )
}
