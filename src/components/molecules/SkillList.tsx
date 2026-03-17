'use client'

import React from 'react'
import { colors, typography, radius, animation } from '@/design-system'

interface SkillItem {
    name: string
    score: number
    maxScore: number
    category: 'strength' | 'weakness' | 'neutral'
}

interface SkillListProps {
    skills: SkillItem[]
}

export function SkillList({ skills }: SkillListProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {skills.map((skill, i) => {
                const percentage = (skill.score / skill.maxScore) * 100
                const color = skill.category === 'strength' ? colors.green : skill.category === 'weakness' ? colors.danger : colors.accent

                return (
                    <div
                        key={i}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 14px',
                            background: colors.surface2,
                            border: `1px solid ${colors.border}`,
                            borderRadius: radius.lg,
                            transition: `all ${animation.fast}`,
                        }}
                    >
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text }}>{skill.name}</span>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: color }}>{skill.score.toFixed(1)}</span>
                            </div>
                            <div style={{ height: '4px', background: colors.surface3, borderRadius: '2px', overflow: 'hidden' }}>
                                <div
                                    style={{
                                        height: '100%',
                                        width: `${percentage}%`,
                                        background: color,
                                        borderRadius: '2px',
                                        transition: `width ${animation.slow} ease-out`
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
