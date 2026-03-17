'use client'

import React from 'react'
import { colors, typography, animation } from '@/design-system'

interface SparklineProps {
    scores: number[]
    weeks: string[]
    height?: number
}

export function Sparkline({ scores, weeks, height = 60 }: SparklineProps) {
    const max = Math.max(...scores, 10)
    const min = 0

    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: `${height}px`, width: '100%' }}>
            {scores.map((score, i) => {
                const percentage = (score / max) * 100
                const color = score >= 7.5 ? colors.green : score >= 6 ? colors.warn : colors.danger

                return (
                    <div
                        key={i}
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            height: '100%'
                        }}
                    >
                        <div style={{ fontSize: '10px', fontWeight: 700, color: color, marginBottom: 'auto' }}>
                            {score.toFixed(1)}
                        </div>
                        <div
                            style={{
                                width: '100%',
                                height: `${percentage}%`,
                                background: color,
                                borderRadius: '4px 4px 0 0',
                                opacity: 0.85,
                                transition: `height ${animation.slow} ${animation.easeOut}`,
                            }}
                        />
                        <div style={{ fontSize: '9px', fontWeight: 700, color: colors.text3, marginTop: '4px' }}>
                            {weeks[i]}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
