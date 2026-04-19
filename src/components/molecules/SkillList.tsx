'use client'

import React from 'react'
import { colors, radius, animation } from '@/design-system'
import type { SkillItem } from '@/lib/skillThresholds'

function SkillBar({ skill }: { skill: SkillItem }) {
    const percentage = (skill.score / skill.maxScore) * 100
    const color = skill.category === 'strength' ? colors.green
        : skill.category === 'weakness' ? colors.danger
        : colors.accent

    return (
        <div style={{ padding: '5px 8px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: radius.md }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, marginRight: '6px' }}>{skill.name}</span>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color, flexShrink: 0 }}>{skill.score.toFixed(1)}</span>
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

interface SkillListProps {
    skills: SkillItem[]
}

export function SkillList({ skills }: SkillListProps) {
    const strengths = [...skills.filter(s => s.category === 'strength')]
        .sort((a, b) => b.score / b.maxScore - a.score / a.maxScore)
    const developing = [...skills.filter(s => s.category === 'developing')]
        .sort((a, b) => b.score / b.maxScore - a.score / a.maxScore)
    const growth = [...skills.filter(s => s.category === 'weakness')]
        .sort((a, b) => b.score / b.maxScore - a.score / a.maxScore)

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: colors.green, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Strengths
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {strengths.length > 0
                        ? strengths.map((s, i) => <SkillBar key={i} skill={s} />)
                        : <div style={{ fontSize: '11px', color: colors.text3 }}>None detected</div>
                    }
                </div>
            </div>
            <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: colors.accent, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Developing
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {developing.length > 0
                        ? developing.map((s, i) => <SkillBar key={i} skill={s} />)
                        : <div style={{ fontSize: '11px', color: colors.text3 }}>None detected</div>
                    }
                </div>
            </div>
            <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: colors.danger, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Growth Areas
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {growth.length > 0
                        ? growth.map((s, i) => <SkillBar key={i} skill={s} />)
                        : <div style={{ fontSize: '11px', color: colors.text3 }}>None detected</div>
                    }
                </div>
            </div>
        </div>
    )
}
