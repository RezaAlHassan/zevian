'use client'

import React from 'react'
import { colors, typography, animation } from '@/design-system'

interface SkillData {
    name: string
    score: number
    maxScore: number
    category: 'strength' | 'weakness' | 'neutral'
}

interface SkillSpiderProps {
    skills: SkillData[]
    size?: number
}

export function SkillSpider({ skills, size = 280 }: SkillSpiderProps) {
    const center = size / 2
    const radius = (size / 2) * 0.8
    const angleStep = (Math.PI * 2) / skills.length

    // Helper to get coordinates
    const getCoords = (index: number, value: number, max: number) => {
        const angle = index * angleStep - Math.PI / 2
        const r = (value / max) * radius
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle)
        }
    }

    // Grid polygons
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1]
    const gridPaths = gridLevels.map(level => {
        return skills.map((_, i) => {
            const { x, y } = getCoords(i, level, 1)
            return `${x},${y}`
        }).join(' ')
    })

    // Data polygon
    const dataPath = skills.map((s, i) => {
        const { x, y } = getCoords(i, s.score, s.maxScore)
        return `${x},${y}`
    }).join(' ')

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Grid Lines */}
                {gridPaths.map((path, i) => (
                    <polygon
                        key={i}
                        points={path}
                        fill="none"
                        stroke={colors.border}
                        strokeWidth="1"
                        strokeDasharray={i === gridPaths.length - 1 ? '0' : '4,4'}
                    />
                ))}

                {/* Axis lines */}
                {skills.map((_, i) => {
                    const { x, y } = getCoords(i, 1, 1)
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={x}
                            y2={y}
                            stroke={colors.border}
                            strokeWidth="1"
                        />
                    )
                })}

                {/* Data Area */}
                <polygon
                    points={dataPath}
                    fill={`${colors.accent}20`}
                    stroke={colors.accent}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    style={{ transition: `all ${animation.base}` }}
                />

                {/* Data Points */}
                {skills.map((s, i) => {
                    const { x, y } = getCoords(i, s.score, s.maxScore)
                    return (
                        <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="4"
                            fill={s.category === 'strength' ? colors.green : s.category === 'weakness' ? colors.danger : colors.accent}
                            stroke={colors.surface}
                            strokeWidth="2"
                        />
                    )
                })}

                {/* Labels */}
                {skills.map((s, i) => {
                    const { x, y } = getCoords(i, 1.15, 1)
                    return (
                        <text
                            key={i}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{
                                fill: colors.text3,
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.02em',
                                fontFamily: typography.fonts.display
                            }}
                        >
                            {s.name}
                        </text>
                    )
                })}
            </svg>

            {/* Strengths & Weaknesses Legend */}
            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: colors.green, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Key Strengths</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {skills.filter(s => s.category === 'strength').map((s, i) => (
                            <div key={i} style={{ fontSize: '12.5px', color: colors.text2, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: colors.green }} />
                                {s.name}
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: colors.danger, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Growth Areas</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {skills.filter(s => s.category === 'weakness').map((s, i) => (
                            <div key={i} style={{ fontSize: '12.5px', color: colors.text2, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: colors.danger }} />
                                {s.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
