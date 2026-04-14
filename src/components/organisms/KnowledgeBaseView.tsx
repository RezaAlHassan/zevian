'use client'

import { colors, radius, typography, animation, layout, shadows } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import React, { useState } from 'react'
import Link from 'next/link'

interface KnowledgePin {
    id: string
    section: 'lexicon' | 'priorities' | 'benchmarks' | 'constraints' | 'general'
    content: string
}

interface Props {
    projectName?: string
    projectId?: string
    pins: KnowledgePin[]
}

export function KnowledgeBaseView({ projectName, projectId, pins }: Props) {
    const [activeTab, setActiveTab] = useState('All')

    const sections = [
        { id: 'All', label: 'All Knowledge', icon: 'fileText' },
        { id: 'lexicon', label: 'Lexicon', icon: 'box' },
        { id: 'priorities', label: 'Priorities', icon: 'target' },
        { id: 'benchmarks', label: 'Benchmarks', icon: 'chart' },
        { id: 'constraints', label: 'Constraints', icon: 'alert' },
    ]

    const filteredPins = activeTab === 'All'
        ? pins
        : pins.filter(p => p.section === activeTab)

    return (
        <div style={{ minHeight: '100vh', background: colors.bg }}>
            {/* Header */}
            <header style={{
                position: 'sticky',
                top: 0,
                height: '56px',
                background: 'rgba(10,12,16,0.9)',
                backdropFilter: 'blur(12px)',
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                padding: '0 24px',
                gap: '10px',
                zIndex: 90,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: colors.text3 }}>
                    <Link href="/projects" style={{ color: colors.text2, textDecoration: 'none' }}>Projects</Link>
                    <span style={{ color: colors.text3 }}>/</span>
                    {projectId && projectName ? (
                        <>
                            <Link href={`/projects/${projectId}`} style={{ color: colors.text2, textDecoration: 'none' }}>{projectName}</Link>
                            <span style={{ color: colors.text3 }}>/</span>
                        </>
                    ) : null}
                    <span style={{ color: colors.text, fontWeight: 500 }}>Knowledge Base</span>
                </div>
                <div style={{ flex: 1 }} />
                <Button variant="primary" size="sm" icon="plus">New Pin</Button>
            </header>

            <div style={{ padding: '28px 28px 60px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{
                        fontFamily: typography.fonts.display,
                        fontSize: '28px',
                        fontWeight: 800,
                        color: colors.text,
                        letterSpacing: '-0.5px',
                        marginBottom: '8px'
                    }}>
                        Project Knowledge Base
                    </h1>
                    <p style={{ fontSize: '14px', color: colors.text2, maxWidth: '600px', lineHeight: 1.6 }}>
                        Factual reference — terminology, norms, and benchmarks the AI uses to understand your project. For instructions on <em>how</em> the AI should score, use <strong>Scoring Instructions</strong> in the project header.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '32px' }}>
                    {/* Sidebar Tabs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {sections.map(s => (
                            <div
                                key={s.id}
                                onClick={() => setActiveTab(s.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px 12px',
                                    borderRadius: radius.md,
                                    cursor: 'pointer',
                                    fontSize: '13.5px',
                                    fontWeight: activeTab === s.id ? 600 : 500,
                                    color: activeTab === s.id ? colors.accent : colors.text2,
                                    background: activeTab === s.id ? colors.accentGlow : 'transparent',
                                    transition: `all ${animation.fast}`,
                                }}
                            >
                                <Icon name={s.id === 'All' ? 'fileText' : s.id === 'lexicon' ? 'box' : s.id === 'priorities' ? 'target' : s.id === 'benchmarks' ? 'chart' : 'alert'} size={14} />
                                {s.label}
                            </div>
                        ))}
                    </div>

                    {/* Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredPins.length > 0 ? (
                            filteredPins.map(pin => (
                                <div key={pin.id} style={{
                                    background: colors.surface,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: radius.xl,
                                    padding: '20px',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        display: 'inline-flex',
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        background: colors.surface2,
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        color: colors.text3,
                                        textTransform: 'uppercase',
                                        marginBottom: '12px'
                                    }}>
                                        {pin.section}
                                    </div>
                                    <div style={{ fontSize: '14.5px', color: colors.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                        {pin.content}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end', borderTop: `1px solid ${colors.border}`, paddingTop: '12px' }}>
                                        <Button variant="ghost" size="sm" icon="edit">Edit</Button>
                                        <Button variant="ghost" size="sm" icon="trash" style={{ color: colors.danger }}>Delete</Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{
                                border: `1.5px dashed ${colors.borderDashed}`,
                                borderRadius: radius.xl,
                                padding: '60px 20px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                gap: '16px'
                            }}>
                                <Icon name="fileText" size={32} color={colors.text3} />
                                <div>
                                    <div style={{ fontSize: '16px', fontWeight: 600, color: colors.text }}>No pins found in this section</div>
                                    <div style={{ fontSize: '14px', color: colors.text3, marginTop: '4px' }}>Add essential knowledge to help Zevian AI understand your project.</div>
                                </div>
                                <Button variant="primary">Add First Pin</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
