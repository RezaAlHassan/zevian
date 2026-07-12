'use client'

import React, { useState } from 'react'
import { colors, typography, animation, radius, getScoreColor, getScoreBarColor } from '@/design-system'

interface TooltipData {
    score: number
    goalName: string
    date: string
}

interface SparklineProps {
    scores: number[]
    weeks: string[]
    height?: number
    tooltips?: TooltipData[]
    onBarClick?: (index: number) => void
}

export function Sparkline({ scores, weeks, height = 60, tooltips, onBarClick }: SparklineProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const max = Math.max(...scores, 10)

    if (scores.length === 0) {
        return (
            <div style={{
                height: `${height}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.text3,
                fontSize: '13px',
                background: colors.surface2,
                borderRadius: radius.md,
                margin: '0 10px',
            }}>
                No reports found for this goal in the selected period.
            </div>
        )
    }

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: `${height}px`, width: '100%' }}>
                {scores.map((score, i) => {
                    const percentage = (score / max) * 100
                    // Same bands as everywhere else (getScoreColor): the number label carries the
                    // legible band color, the bar itself uses the quieter getScoreBarColor (grey in
                    // the neutral 5–7 band, muted red below 5) so the trend reads calm, not alarmed.
                    const color = getScoreColor(score)
                    const barColor = getScoreBarColor(score)
                    const isHovered = hoveredIndex === i
                    const tip = tooltips?.[i]

                    return (
                        <div
                            key={i}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                height: '100%',
                                cursor: onBarClick ? 'pointer' : 'default',
                                position: 'relative',
                            }}
                            onClick={() => onBarClick?.(i)}
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <div style={{ fontSize: '10px', fontWeight: 700, color, marginBottom: 'auto' }}>
                                {score.toFixed(1)}
                            </div>
                            <div
                                style={{
                                    width: '100%',
                                    height: `${percentage}%`,
                                    background: barColor,
                                    borderRadius: '4px 4px 0 0',
                                    opacity: isHovered ? 1 : 0.85,
                                    outline: isHovered ? `2px solid ${barColor}` : 'none',
                                    outlineOffset: '2px',
                                    transition: `height ${animation.slow} ${animation.easeOut}, opacity 0.15s`,
                                }}
                            />
                            <div style={{ fontSize: '9px', fontWeight: 700, color: colors.text3, marginTop: '4px' }}>
                                {weeks[i]}
                            </div>

                            {isHovered && tip && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: `calc(${Math.min(percentage, 80)}% + 44px)`,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: colors.surface,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: radius.md,
                                    padding: '8px 12px',
                                    fontSize: '11px',
                                    whiteSpace: 'nowrap',
                                    zIndex: 100,
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                                    pointerEvents: 'none',
                                }}>
                                    <div style={{ fontWeight: 800, color, marginBottom: '4px', fontSize: '13px' }}>
                                        Score: {score.toFixed(1)}
                                    </div>
                                    <div style={{ color: colors.text2, marginBottom: '2px' }}>
                                        {tip.goalName}
                                    </div>
                                    <div style={{ color: colors.text3 }}>
                                        {tip.date}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
