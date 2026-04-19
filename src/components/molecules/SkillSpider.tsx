'use client'

import React from 'react'
import { colors, typography, animation, radius } from '@/design-system'
import { Icon } from '@/components/atoms'
import type { SkillItem } from '@/lib/skillThresholds'

interface SkillSpiderProps {
    skills: SkillItem[]
    size?: number
}

function truncate(name: string, max = 18) {
    return name.length > max ? name.slice(0, max - 1) + '\u2026' : name
}

function computeStdDev(values: number[]): number {
    if (values.length < 2) return 0
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
    return Math.sqrt(variance)
}

export function SkillSpider({ skills, size = 280 }: SkillSpiderProps) {
    // ── Step 1: Separate zero-score criteria (not addressed) ────────────────
    const zeroSkills = skills.filter(s => s.score === 0)
    const nonZeroSkills = skills.filter(s => s.score !== 0)

    // ── Step 2: Compute stats on non-zero scores ────────────────────────────
    const scores = nonZeroSkills.map(s => s.score)
    const minScore = scores.length > 0 ? Math.min(...scores) : 0
    const sd = computeStdDev(scores)

    // ── Step 3: Classify states (evaluated on non-zero set) ─────────────────
    const allWeaknesses = scores.length > 0 && scores.every(s => s < 4)
    // Only fall back to bar chart when there's no categorical split — if both
    // strengths and weaknesses are present the radar is always meaningful.
    const hasCategoricalSplit = nonZeroSkills.some(s => s.category === 'strength') &&
        nonZeroSkills.some(s => s.category === 'weakness')
    const lowVariance = scores.length > 0 && sd < 1.5 && !hasCategoricalSplit

    // ── Step 4: Chart skill selection — top 3 strengths + bottom 3 weaknesses
    const topStrengths = nonZeroSkills
        .filter(s => s.category === 'strength')
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
    const bottomWeaknesses = nonZeroSkills
        .filter(s => s.category === 'weakness')
        .sort((a, b) => a.score - b.score)
        .slice(0, 3)
    const chartSkills = [...topStrengths, ...bottomWeaknesses]

    // ── Step 5: Dynamic floor based on the subset actually plotted ───────────
    const chartScores = chartSkills.map(s => s.score)
    const chartMin = chartScores.length > 0 ? Math.min(...chartScores) : minScore
    const floor = Math.max(0, chartMin - 1)
    const MAX_SCORE = 10

    // ── Geometry helpers ────────────────────────────────────────────────────
    const center = size / 2
    const r = (size / 2) * 0.72
    const n = Math.max(chartSkills.length, 3)
    const angleStep = (Math.PI * 2) / n

    // Grid rings are evenly spaced fractions [0.2…1] of the visual radius
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1]

    const getGridCoords = (index: number, level: number) => {
        const angle = index * angleStep - Math.PI / 2
        return { x: center + level * r * Math.cos(angle), y: center + level * r * Math.sin(angle) }
    }

    // Data points use dynamic floor so shape differences are preserved
    const getDataCoords = (index: number, score: number) => {
        const angle = index * angleStep - Math.PI / 2
        const range = MAX_SCORE - floor
        const norm = range === 0 ? 1 : Math.max(0, (score - floor) / range)
        return { x: center + norm * r * Math.cos(angle), y: center + norm * r * Math.sin(angle) }
    }

    // ── Bar chart renderer (low-variance fallback) ───────────────────────────
    const renderBarChart = () => {
        const sorted = [...nonZeroSkills].sort((a, b) => b.score - a.score)
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '11px', color: colors.text3, fontWeight: 500, letterSpacing: '0.01em' }}>
                    No significant variance — bar view shown
                </div>
                {sorted.map((s, i) => {
                    const color = s.category === 'strength' ? colors.green
                        : s.category === 'weakness' ? colors.danger
                        : colors.accent
                    return (
                        <div key={i}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: colors.text }}>{s.name}</span>
                                <span style={{ fontSize: '11px', fontWeight: 800, color }}>{s.score.toFixed(1)}</span>
                            </div>
                            <div style={{ height: '4px', background: colors.surface3, borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${(s.score / MAX_SCORE) * 100}%`,
                                    background: color,
                                    borderRadius: '2px',
                                    transition: `width ${animation.slow} ease-out`,
                                }} />
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    // ── Radar chart renderer ─────────────────────────────────────────────────
    const renderRadar = () => {
        if (chartSkills.length < 3) {
            return (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: `${size * 0.6}px`, fontSize: '12px', color: colors.text3, textAlign: 'center', padding: '0 12px' }}>
                    Not enough strength / growth data for chart
                </div>
            )
        }

        const gridPaths = gridLevels.map(level =>
            chartSkills.map((_, i) => {
                const { x, y } = getGridCoords(i, level)
                return `${x},${y}`
            }).join(' ')
        )

        const dataPath = chartSkills.map((s, i) => {
            const { x, y } = getDataCoords(i, s.score)
            return `${x},${y}`
        }).join(' ')

        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 20px' }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} overflow="visible">
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
                    {chartSkills.map((_, i) => {
                        const { x, y } = getGridCoords(i, 1)
                        return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke={colors.border} strokeWidth="1" />
                    })}
                    <polygon
                        points={dataPath}
                        fill={`${colors.accent}20`}
                        stroke={colors.accent}
                        strokeWidth="2"
                        strokeLinejoin="round"
                        style={{ transition: `all ${animation.base}` }}
                    />
                    {chartSkills.map((s, i) => {
                        const { x, y } = getDataCoords(i, s.score)
                        const color = s.category === 'strength' ? colors.green : colors.danger
                        return (
                            <circle key={i} cx={x} cy={y} r="4" fill={color} stroke={colors.surface} strokeWidth="2">
                                <title>{s.name}: {s.score.toFixed(1)}</title>
                            </circle>
                        )
                    })}
                    {chartSkills.map((s, i) => {
                        const { x, y } = getGridCoords(i, 1.3)
                        return (
                            <text
                                key={i}
                                x={x}
                                y={y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                style={{
                                    fill: s.category === 'strength' ? colors.green : colors.danger,
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.02em',
                                    fontFamily: typography.fonts.display,
                                }}
                            >
                                <title>{s.name}</title>
                                {truncate(s.name)}
                            </text>
                        )
                    })}
                </svg>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Weaknesses-only coaching note (mirrors the amber warning banner style) */}
            {allWeaknesses && (
                <div style={{
                    padding: '10px 12px',
                    background: `${colors.warn}12`,
                    border: `1px solid ${colors.warn}35`,
                    borderRadius: radius.md,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                }}>
                    <Icon name="alert" size={13} color={colors.warn} />
                    <span style={{ fontSize: '11.5px', color: colors.warn, fontWeight: 600, lineHeight: 1.5 }}>
                        All criteria scored below 4 — coaching recommended across all dimensions.
                    </span>
                </div>
            )}

            {/* Main chart — bar fallback when low variance, radar otherwise */}
            {nonZeroSkills.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: `${size * 0.5}px`, fontSize: '12px', color: colors.text3 }}>
                    No scoreable criteria
                </div>
            ) : lowVariance ? (
                renderBarChart()
            ) : (
                renderRadar()
            )}

            {/* Flagged zero-score criteria — rendered below chart, never plotted */}
            {zeroSkills.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: colors.danger, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                        Not addressed
                    </div>
                    {zeroSkills.map((s, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '7px 10px',
                            background: `${colors.danger}08`,
                            border: `1px solid ${colors.danger}30`,
                            borderRadius: radius.md,
                        }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 600, color: colors.text2 }}>{s.name}</span>
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: colors.danger,
                                background: `${colors.danger}15`,
                                border: `1px solid ${colors.danger}35`,
                                borderRadius: '4px',
                                padding: '2px 7px',
                                whiteSpace: 'nowrap',
                            }}>
                                Score: 0 — flagged for review
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
