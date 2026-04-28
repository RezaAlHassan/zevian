'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { colors, radius, animation } from '@/design-system'

interface CriterionBar {
    name: string
    score: number
    teamAvg?: number
}

interface AccordionEntry {
    date: string
    score: number
    reasoning: string
    evidence: string
}

interface Props {
    criteriaData: CriterionBar[]
    allReports: any[]
    viewMode: 'self' | 'detail'
    selectedGoalId: string | null
}

function barColor(score: number): string {
    if (score < 6) return '#f04438'
    if (score < 8) return '#f79009'
    return '#10b981'
}

function formatDate(raw: string): string {
    try {
        return format(new Date(raw.length === 10 ? raw + 'T12:00:00' : raw), 'MMM d, yyyy')
    } catch {
        return raw
    }
}

function getLastFive(allReports: any[], criterionName: string, selectedGoalId: string | null): AccordionEntry[] {
    return allReports
        .filter((r: any) => !r.isOnLeave && (!selectedGoalId || r.goalId === selectedGoalId))
        .flatMap((r: any) =>
            (r.criterionScores || [])
                .filter((cs: any) => cs.criterionName === criterionName)
                .map((cs: any) => ({
                    date: r.submittedForDate || r.submissionDate,
                    score: Number(cs.score),
                    reasoning: cs.reasoning || '',
                    evidence: cs.evidence || '',
                }))
        )
        .sort((a: AccordionEntry, b: AccordionEntry) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
}

export function SkillAnalysisBar({ criteriaData, allReports, viewMode, selectedGoalId }: Props) {
    const [openCriterion, setOpenCriterion] = useState<string | null>(null)
    const isManager = viewMode === 'detail'

    if (criteriaData.length === 0) {
        return (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: colors.text3, fontSize: '13px' }}>
                No reports yet for this goal.
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {isManager && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0 4px 14px',
                    fontSize: '11px',
                    color: colors.text3,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}>
                    <div style={{
                        width: '2px',
                        height: '12px',
                        background: 'rgba(255,255,255,0.6)',
                        borderRadius: '1px',
                        flexShrink: 0,
                    }} />
                    Team avg
                </div>
            )}

            {criteriaData.map((criterion, i) => {
                const isOpen = openCriterion === criterion.name
                const color = barColor(criterion.score)
                const entries = isOpen ? getLastFive(allReports, criterion.name, selectedGoalId) : []

                return (
                    <div key={criterion.name}>
                        {/* Bar row */}
                        <div
                            onClick={() => setOpenCriterion(isOpen ? null : criterion.name)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 4px',
                                cursor: 'pointer',
                                borderTop: i === 0 ? 'none' : `1px solid ${colors.border}`,
                            }}
                        >
                            <div style={{
                                minWidth: '160px',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: colors.text,
                                lineHeight: 1.3,
                            }}>
                                {criterion.name}
                            </div>

                            <div style={{
                                width: '32px',
                                flexShrink: 0,
                                fontSize: '13px',
                                fontWeight: 700,
                                color: color,
                                textAlign: 'right',
                            }}>
                                {criterion.score.toFixed(1)}
                            </div>

                            {/* Bar track */}
                            <div style={{
                                flex: 1,
                                position: 'relative',
                                height: '8px',
                                background: colors.surface2,
                                borderRadius: '99px',
                                overflow: 'visible',
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    height: '100%',
                                    width: `${(criterion.score / 10) * 100}%`,
                                    background: color,
                                    borderRadius: '99px',
                                    transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                                }} />
                                {isManager && criterion.teamAvg !== undefined && (
                                    <div style={{
                                        position: 'absolute',
                                        left: `${(criterion.teamAvg / 10) * 100}%`,
                                        top: '-3px',
                                        width: '2px',
                                        height: '14px',
                                        background: 'rgba(255,255,255,0.6)',
                                        borderRadius: '1px',
                                        transform: 'translateX(-1px)',
                                        flexShrink: 0,
                                    }} />
                                )}
                            </div>

                            <div style={{
                                width: '16px',
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <svg
                                    width="10"
                                    height="6"
                                    viewBox="0 0 10 6"
                                    fill="none"
                                    style={{
                                        transform: isOpen ? 'rotate(180deg)' : 'none',
                                        transition: `transform ${animation.fast}`,
                                        opacity: 0.4,
                                    }}
                                >
                                    <path d="M1 1l4 4 4-4" stroke={colors.text2} strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </div>
                        </div>

                        {/* Accordion */}
                        {isOpen && (
                            <div style={{
                                background: colors.bg,
                                border: `1px solid ${colors.border}`,
                                borderRadius: radius.lg,
                                margin: '2px 4px 8px',
                                overflow: 'hidden',
                            }}>
                                {entries.length === 0 ? (
                                    <div style={{
                                        padding: '24px',
                                        textAlign: 'center',
                                        color: colors.text3,
                                        fontSize: '13px',
                                    }}>
                                        No reports yet for this goal.
                                    </div>
                                ) : (
                                    entries.map((entry, j) => {
                                        const entryColor = barColor(entry.score)
                                        return (
                                            <div
                                                key={j}
                                                style={{
                                                    padding: '14px 16px',
                                                    borderBottom: j === entries.length - 1 ? 'none' : `1px solid ${colors.border}`,
                                                }}
                                            >
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    marginBottom: entry.reasoning ? '8px' : 0,
                                                }}>
                                                    <span style={{ fontSize: '12px', color: colors.text3 }}>
                                                        {formatDate(entry.date)}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '14px',
                                                        fontWeight: 700,
                                                        color: entryColor,
                                                    }}>
                                                        {entry.score.toFixed(1)}
                                                    </span>
                                                </div>

                                                {entry.reasoning && (
                                                    <div style={{
                                                        fontSize: '13px',
                                                        color: colors.text2,
                                                        lineHeight: 1.65,
                                                        marginBottom: isManager && entry.evidence ? '6px' : 0,
                                                    }}>
                                                        {entry.reasoning}
                                                    </div>
                                                )}

                                                {isManager && entry.evidence && (
                                                    <div style={{
                                                        fontSize: '12px',
                                                        color: colors.text3,
                                                        lineHeight: 1.6,
                                                    }}>
                                                        {entry.evidence}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
