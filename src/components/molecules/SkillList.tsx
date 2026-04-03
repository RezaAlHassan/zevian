'use client'

import React from 'react'
import { colors, radius, animation } from '@/design-system'

interface SkillItem {
    name: string
    score: number
    maxScore: number
    category: 'strength' | 'weakness' | 'neutral'
}

interface SkillListProps {
    skills: SkillItem[]
}

function SkillBar({ skill }: { skill: SkillItem }) {
    const percentage = (skill.score / skill.maxScore) * 100
    const color = skill.category === 'strength' ? colors.green
        : skill.category === 'weakness' ? colors.danger
        : colors.accent

    return (
        <div style={{ padding: '7px 10px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: radius.md }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, marginRight: '6px' }}>{skill.name}</span>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color, flexShrink: 0 }}>{skill.score.toFixed(1)}</span>
            </div>
            <div style={{ height: '3px', background: colors.surface3, borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: color,
                    borderRadius: '2px',
                    transition: `width ${animation.slow} ease-out`,
                }} />
            </div>
        </div>
    )
}

export function SkillList({ skills }: SkillListProps) {
    const strengths = [...skills.filter(s => s.category === 'strength' || s.category === 'neutral')]
        .sort((a, b) => b.score / b.maxScore - a.score / a.maxScore)
    const growth = [...skills.filter(s => s.category === 'weakness')]
        .sort((a, b) => b.score / b.maxScore - a.score / a.maxScore)

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: colors.green, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Strengths
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {strengths.length > 0
                        ? strengths.map((s, i) => <SkillBar key={i} skill={s} />)
                        : <div style={{ fontSize: '12px', color: colors.text3 }}>None detected</div>
                    }
                </div>
            </div>
            <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: colors.danger, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Growth Areas
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {growth.length > 0
                        ? growth.map((s, i) => <SkillBar key={i} skill={s} />)
                        : <div style={{ fontSize: '12px', color: colors.text3 }}>None detected</div>
                    }
                </div>
            </div>
        </div>
    )
}
