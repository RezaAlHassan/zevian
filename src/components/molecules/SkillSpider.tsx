'use client'

import React, { useState } from 'react'
import { colors, typography, animation, radius } from '@/design-system'

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

function truncate(name: string, max = 12) {
    return name.length > max ? name.slice(0, max - 1) + '\u2026' : name
}

function buildDefaultSelection(skills: SkillData[]): Set<string> {
    // Show skills with scores in the mid range (20%–90% of maxScore)
    const inRange = skills.filter(s => {
        const pct = s.score / s.maxScore
        return pct >= 0.2 && pct <= 0.9
    })
    const picks = inRange.length >= 3 ? inRange : skills
    return new Set(picks.slice(0, Math.max(3, picks.length)).map(s => s.name))
}

export function SkillSpider({ skills, size = 280 }: SkillSpiderProps) {
    const [selectedNames, setSelectedNames] = useState<Set<string>>(() => buildDefaultSelection(skills))
    const [customising, setCustomising] = useState(false)

    const displaySkills = skills.filter(s => selectedNames.has(s.name))
    const chartSkills = displaySkills.length >= 3 ? displaySkills : skills.slice(0, 3)

    const center = size / 2
    const r = (size / 2) * 0.72
    const angleStep = (Math.PI * 2) / chartSkills.length

    const getCoords = (index: number, value: number, max: number) => {
        const angle = index * angleStep - Math.PI / 2
        const dist = (value / max) * r
        return { x: center + dist * Math.cos(angle), y: center + dist * Math.sin(angle) }
    }

    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1]
    const gridPaths = gridLevels.map(level =>
        chartSkills.map((_, i) => {
            const { x, y } = getCoords(i, level, 1)
            return `${x},${y}`
        }).join(' ')
    )
    const dataPath = chartSkills.map((s, i) => {
        const { x, y } = getCoords(i, s.score, s.maxScore)
        return `${x},${y}`
    }).join(' ')

    const toggleSkill = (name: string) => {
        setSelectedNames(prev => {
            const next = new Set(prev)
            if (next.has(name)) {
                if (next.size <= 3) return prev
                next.delete(name)
            } else {
                next.add(name)
            }
            return next
        })
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={() => setCustomising(c => !c)}
                    style={{
                        background: 'none',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: customising ? colors.accent : colors.text3,
                        borderColor: customising ? colors.accent : colors.border,
                        padding: '4px 10px',
                        transition: `all ${animation.fast}`,
                    }}
                >
                    {customising ? 'Done' : 'Customise'}
                </button>
            </div>

            {customising ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '12px',
                    background: colors.surface2,
                    borderRadius: radius.lg,
                    border: `1px solid ${colors.border}`,
                }}>
                    <div style={{ fontSize: '11px', color: colors.text3, marginBottom: '8px' }}>
                        Select skills to display on chart (min 3)
                    </div>
                    {skills.map(skill => (
                        <label
                            key={skill.name}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                cursor: 'pointer',
                                padding: '7px 8px',
                                borderRadius: '6px',
                                background: selectedNames.has(skill.name) ? `${colors.accent}12` : 'transparent',
                                transition: `background ${animation.fast}`,
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={selectedNames.has(skill.name)}
                                onChange={() => toggleSkill(skill.name)}
                                style={{ accentColor: colors.accent, flexShrink: 0 }}
                            />
                            <span style={{ fontSize: '13px', color: colors.text, flex: 1 }}>{skill.name}</span>
                            <span style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                color: skill.category === 'strength' ? colors.green
                                    : skill.category === 'weakness' ? colors.danger
                                    : colors.accent,
                            }}>
                                {skill.score.toFixed(1)}
                            </span>
                        </label>
                    ))}
                </div>
            ) : (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
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
                            const { x, y } = getCoords(i, 1, 1)
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
                            const { x, y } = getCoords(i, s.score, s.maxScore)
                            const color = s.category === 'strength' ? colors.green
                                : s.category === 'weakness' ? colors.danger
                                : colors.accent
                            return (
                                <circle key={i} cx={x} cy={y} r="4" fill={color} stroke={colors.surface} strokeWidth="2">
                                    <title>{s.name}</title>
                                </circle>
                            )
                        })}
                        {chartSkills.map((s, i) => {
                            const { x, y } = getCoords(i, 1.2, 1)
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
            )}
        </div>
    )
}
