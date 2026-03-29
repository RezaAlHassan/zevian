'use client'

import { colors, radius, typography, animation, layout, zIndex, shadows } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import React, { useState, useEffect, useRef } from 'react'
import { upsertGoalAction } from '@/app/actions/goalActions'
import { generateGoalWithAI } from '@/lib/api/ai'

interface Criterion {
    id: string
    name: string
    importance: 'low' | 'medium' | 'high' | 'critical'
    weight: number
}

interface Props {
    isOpen: boolean
    onClose: () => void
    projects: any[]
    employees: any[]
    goal?: any
    onCreated?: (goalId: string) => void
}

const importanceWeights = { low: 1, medium: 2, high: 3, critical: 5 }
const importanceColors = {
    low: { bg: 'rgba(84,93,115,.2)', text: colors.text2, label: 'Low' },
    medium: { bg: 'rgba(245,158,11,.12)', text: '#f59e0b', label: 'Medium' },
    high: { bg: colors.accentGlow, text: colors.accent, label: 'High' },
    critical: { bg: 'rgba(240,68,56,.15)', text: '#f04438', label: 'Critical' },
}

const templates = {
    engineer: {
        name: 'Code Quality & Delivery',
        instructions: 'All code changes must include inline comments.\nPull requests must include a description of what changed and why.\nUnit tests must cover all new functions.\nNo merges without a passing CI build.',
        criteria: [
            { name: 'Code Quality', importance: 'critical' },
            { name: 'Test Coverage', importance: 'high' },
            { name: 'Delivery Speed', importance: 'medium' },
            { name: 'Documentation', importance: 'low' },
        ] as const
    },
    designer: {
        name: 'Design Execution & Handoff',
        instructions: 'All designs must use the approved design system tokens.\nEvery screen must include mobile and desktop variants.\nHandoff files must include annotated specs.\nAccessibility contrast ratios must meet WCAG AA.',
        criteria: [
            { name: 'Visual Quality', importance: 'critical' },
            { name: 'Usability', importance: 'high' },
            { name: 'Handoff Quality', importance: 'high' },
            { name: 'Delivery Speed', importance: 'medium' },
        ] as const
    },
    marketer: {
        name: 'Campaign Execution',
        instructions: 'All copy must be approved by the brand team before publishing.\nReports must include performance metrics (CTR, opens, conversions).\nContent must align with the current messaging guide.\nDeadlines must be met without exception.',
        criteria: [
            { name: 'Creativity', importance: 'high' },
            { name: 'On-brand Accuracy', importance: 'critical' },
            { name: 'Performance Impact', importance: 'high' },
            { name: 'Delivery Speed', importance: 'medium' },
        ] as const
    }
}

export function AddGoalSheet({ isOpen, onClose, projects, employees, goal, onCreated }: Props) {
    const [name, setName] = useState('')
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [deadline, setDeadline] = useState('')
    const [instructions, setInstructions] = useState('')
    const [status, setStatus] = useState('active')
    const [criteria, setCriteria] = useState<Criterion[]>([])
    const [loading, setLoading] = useState(false)

    // UI Local State
    const [aiPrompt, setAiPrompt] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [isTemplateLoading, setIsTemplateLoading] = useState<string | null>(null)
    const [newCritName, setNewCritName] = useState('')
    const [newCritImportance, setNewCritImportance] = useState<'low' | 'medium' | 'high' | 'critical'>('high')
    const [showWeightsDetail, setShowWeightsDetail] = useState(true)
    const [showAiBadge, setShowAiBadge] = useState(false)

    useEffect(() => {
        if (goal) {
            setName(goal.name || '')
            setSelectedProjectId(goal.projectId || goal.project?.id || projects[0]?.id || '')
            setDeadline(goal.deadline ? new Date(goal.deadline).toISOString().slice(0, 16) : '')
            setInstructions(goal.instructions || '')
            setCriteria(goal.criteria || [])
            setStatus(goal.status || 'active')
            setShowAiBadge(false)
        } else {
            setName('')
            setSelectedProjectId(projects[0]?.id || '')
            setDeadline('')
            setInstructions('')
            setCriteria([])
            setStatus('active')
            setAiPrompt('')
            setShowAiBadge(false)
        }
    }, [goal, projects, isOpen])

    // Weight Calculation Logic
    useEffect(() => {
        if (criteria.length === 0) return

        const totalRelativeWeight = criteria.reduce((sum, c) => sum + (importanceWeights[c.importance as keyof typeof importanceWeights] || 0), 0)
        const updatedCriteria = criteria.map(c => ({
            ...c,
            weight: totalRelativeWeight > 0 ? Math.round((importanceWeights[c.importance as keyof typeof importanceWeights] / totalRelativeWeight) * 100) : 0
        }))

        // Ensure total is 100% due to rounding
        const currentSum = updatedCriteria.reduce((sum, c) => sum + c.weight, 0)
        if (currentSum !== 100 && updatedCriteria.length > 0) {
            updatedCriteria[updatedCriteria.length - 1].weight += (100 - currentSum)
        }

        // Only update if actually different to prevent infinite loops
        const weightsChanged = updatedCriteria.some((c, i) => c.weight !== criteria[i]?.weight)
        if (weightsChanged) {
            setCriteria(updatedCriteria)
        }
    }, [criteria.map(c => c.importance).join(','), criteria.length])

    const applyTemplate = (key: keyof typeof templates) => {
        setIsTemplateLoading(key)
        const t = templates[key]

        setTimeout(() => {
            setName(t.name)
            setInstructions(t.instructions)
            const newCriteria = t.criteria.map((c, i) => ({
                id: `tmpl-${key}-${i}-${Date.now()}`,
                name: c.name,
                importance: c.importance as any,
                weight: 0
            }))
            setCriteria(newCriteria)
            setIsTemplateLoading(null)
            setShowAiBadge(false)
        }, 500)
    }

    const typeIn = (text: string, setter: (val: string) => void, speed: number, onDone?: () => void) => {
        let i = 0
        setter('')
        const interval = setInterval(() => {
            setter(text.slice(0, i + 1))
            i++
            if (i >= text.length) {
                clearInterval(interval)
                if (onDone) onDone()
            }
        }, speed)
    }

    const generateWithAI = async () => {
        if (aiPrompt.length < 10) return
        setIsGenerating(true)
        setName('')
        setInstructions('')
        setCriteria([])

        try {
            const result = await generateGoalWithAI(aiPrompt)

            if (result.error || !result.data) {
                alert(result.error || 'Failed to generate goal')
                setIsGenerating(false)
                return
            }

            const output = result.data
            typeIn(output.name, setName, 40, () => {
                typeIn(output.instructions, setInstructions, 15, () => {
                    const newCriteria = output.criteria.map((c, i) => ({
                        id: `ai-${i}-${Date.now()}`,
                        name: c.name,
                        importance: c.importance as any,
                        weight: c.weight
                    }))
                    setCriteria(newCriteria)
                    setIsGenerating(false)
                    setShowAiBadge(true)
                })
            })
        } catch (err: any) {
            console.error('AI generation error:', err)
            alert('Failed to generate goal. Please try again.')
            setIsGenerating(false)
        }
    }

    const addCriterion = () => {
        if (!newCritName.trim()) return
        const newCrit: Criterion = {
            id: Date.now().toString(),
            name: newCritName,
            importance: newCritImportance,
            weight: 0
        }
        setCriteria([...criteria, newCrit])
        setNewCritName('')
    }

    const removeCriterion = (id: string) => {
        setCriteria(criteria.filter(c => c.id !== id))
    }

    const updateItemImportance = (id: string, importance: 'low' | 'medium' | 'high' | 'critical') => {
        setCriteria(criteria.map(c => c.id === id ? { ...c, importance } : c))
    }

    const handleSave = async () => {
        if (isSaveDisabled) return
        setLoading(true)
        try {
            const res = await upsertGoalAction({
                id: goal?.id,
                name,
                selectedProjectId,
                deadline,
                instructions,
                status,
                criteria
            })
            if (res.success) {
                const isNew = !goal?.id || goal.id.startsWith('mock-')
                onClose()
                if (isNew && res.goalId && onCreated) {
                    onCreated(res.goalId)
                }
            } else {
                alert(res.error || 'Failed to save goal')
            }
        } catch (err) {
            console.error('Error saving goal:', err)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    const isSaveDisabled = !name || instructions.length < 10 || !selectedProjectId || criteria.length === 0 || isGenerating || loading

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: zIndex.modal,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
        }}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 580,
                    height: '100vh',
                    background: colors.surface,
                    borderLeft: `1px solid ${colors.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideIn 0.28s cubic-bezier(.22,.68,0,1.2) both',
                }}
            >
                {/* Header */}
                <div style={{ padding: '22px 26px 18px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'flex-start', gap: '14px', flexShrink: 0, background: colors.surface, position: 'sticky', top: 0, zIndex: 10 }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: typography.fonts.display, fontSize: '18px', fontWeight: 800, color: colors.text, letterSpacing: '-0.4px' }}>
                            {goal ? 'Edit Global Goal' : 'Create New Goal'}
                        </div>
                        <div style={{ fontSize: '12px', color: colors.text3, marginTop: '2px' }}>
                            Define what success looks like — Zevian AI will use this to score every report
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            background: colors.surface2,
                            border: `1px solid ${colors.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: colors.text2,
                            transition: `all ${animation.fast}`,
                        }}
                    >
                        <Icon name="x" size={13} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>

                    {/* 1. Quick Start Templates */}
                    <div style={{ padding: '20px 26px', borderBottom: `1px solid ${colors.border}` }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                            <Icon name="clock" size={15} color={colors.accent} />
                            Quick Start Templates
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                            {(['engineer', 'designer', 'marketer'] as const).map(key => (
                                <button
                                    key={key}
                                    onClick={() => applyTemplate(key)}
                                    disabled={!!isTemplateLoading}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '7px',
                                        padding: '7px 13px',
                                        borderRadius: '8px',
                                        background: colors.surface2,
                                        border: `1.5px solid ${colors.border}`,
                                        fontSize: '12.5px',
                                        fontWeight: 600,
                                        color: colors.text2,
                                        cursor: 'pointer',
                                        transition: 'all 0.18s',
                                        opacity: isTemplateLoading === key ? 0.6 : 1
                                    }}
                                >
                                    <span style={{ fontSize: '14px' }}>{key === 'engineer' ? '🖥️' : key === 'designer' ? '🎨' : '📣'}</span>
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. AI Goal Builder */}
                    <div style={{ padding: '20px 26px', borderBottom: `1px solid ${colors.border}` }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                            <Icon name="sparkles" size={15} color={colors.accent} />
                            AI Goal Builder
                            <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px', background: colors.accentGlow, color: colors.accent }}>✦ AI</span>
                        </div>
                        <div style={{ background: colors.surface2, border: `1.5px solid ${colors.border}`, borderRadius: '12px', overflow: 'hidden' }}>
                            <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="Describe it, we'll structure it… (e.g. 'We are a specialized customer support team...')"
                                style={{ width: '100%', padding: '13px 14px', background: 'transparent', border: 'none', outline: 'none', fontFamily: typography.fonts.display, fontSize: '13.5px', color: colors.text, lineHeight: 1.65, resize: 'none', minHeight: '80px' }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px 10px', borderTop: `1px solid ${colors.border}` }}>
                                <span style={{ fontSize: '11.5px', color: colors.text3, fontStyle: 'italic' }}>Zevian will pre-fill name, criteria, and instructions.</span>
                                <button
                                    onClick={generateWithAI}
                                    disabled={aiPrompt.length < 10 || isGenerating}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '7px',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        background: isGenerating ? colors.accentGlow : colors.surface3,
                                        border: `1px solid ${isGenerating ? colors.accent : colors.border}`,
                                        fontSize: '12.5px',
                                        fontWeight: 700,
                                        color: isGenerating ? colors.accent : colors.text2,
                                        cursor: aiPrompt.length < 10 ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.18s',
                                        fontFamily: typography.fonts.display,
                                        opacity: aiPrompt.length < 10 ? 0.45 : 1
                                    }}
                                >
                                    <Icon name={isGenerating ? 'refresh' : 'sparkles'} size={13} className={isGenerating ? 'animate-spin' : ''} />
                                    {isGenerating ? 'Generating...' : 'Generate Tracker →'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 3. Goal Name */}
                    <div style={{ padding: '20px 26px', borderBottom: `1px solid ${colors.border}` }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: colors.text2, display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Goal <span style={{ color: colors.accent }}>*</span>
                                {showAiBadge && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '5px', fontSize: '11px', fontWeight: 600, background: 'rgba(0,212,170,.12)', color: '#00d4aa' }}>
                                        <Icon name="check" size={10} /> AI filled
                                    </span>
                                )}
                            </div>
                            <input
                                className="fi"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Improve Code Quality"
                                style={{ width: '100%', padding: '10px 13px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '9px', fontSize: '13.5px', color: colors.text, fontFamily: typography.fonts.display, outline: 'none' }}
                            />
                        </div>
                    </div>

                    {/* 4. Instructions */}
                    <div style={{ padding: '20px 26px', borderBottom: `1px solid ${colors.border}` }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <Icon name="list" size={16} color={colors.accent} />
                            Instructions
                        </div>
                        <p style={{ fontSize: '12.5px', color: colors.text3, marginBottom: '12px', lineHeight: 1.55 }}>Specific, objective instructions for Zevian to follow during evaluation.</p>
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="e.g. Ensure all code is commented..."
                            style={{ width: '100%', padding: '10px 13px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '9px', fontSize: '13.5px', color: colors.text, fontFamily: typography.fonts.display, outline: 'none', minHeight: '88px', lineBreak: 'anywhere' }}
                        />
                    </div>

                    {/* 5. Criteria */}
                    <div style={{ padding: '20px 26px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name="target" size={16} color={colors.accent} />
                                What matters for this goal?
                            </div>
                            {criteria.length > 0 && (
                                <div style={{ fontSize: '11px', fontWeight: 700, color: criteria.reduce((sum, c) => sum + c.weight, 0) === 100 ? colors.green : colors.accent, background: criteria.reduce((sum, c) => sum + c.weight, 0) === 100 ? `${colors.green}20` : colors.accentGlow, padding: '4px 8px', borderRadius: '12px' }}>
                                    {Math.abs(100 - criteria.reduce((sum, c) => sum + c.weight, 0))}% Remaining
                                </div>
                            )}
                        </div>
                        <p style={{ fontSize: '12.5px', color: colors.text3, marginBottom: '14px', lineHeight: 1.55 }}>Add criteria and mark their importance — weights are auto-calculated.</p>

                        {/* Add Crit Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', alignItems: 'center', padding: '12px', background: colors.surface2, border: `1.5px solid ${colors.border}`, borderRadius: '10px' }}>
                            <input
                                value={newCritName}
                                onChange={(e) => setNewCritName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addCriterion()}
                                placeholder="e.g., Code Quality..."
                                style={{ border: 'none', background: 'transparent', padding: '6px 2px', fontSize: '13.5px', color: colors.text, outline: 'none', fontFamily: typography.fonts.display }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: colors.surface3, borderRadius: '8px', padding: '3px', border: `1px solid ${colors.border}` }}>
                                {(['low', 'medium', 'high', 'critical'] as const).map(lvl => (
                                    <div
                                        key={lvl}
                                        onClick={() => setNewCritImportance(lvl)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            padding: '5px 8px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            color: newCritImportance === lvl ? '#fff' : colors.text3,
                                            background: newCritImportance === lvl ? (lvl === 'low' ? colors.text3 : lvl === 'medium' ? '#f59e0b' : lvl === 'high' ? colors.accent : '#f04438') : 'transparent',
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                                        {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={addCriterion}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: colors.accent, border: 'none', fontSize: '12.5px', fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: typography.fonts.display, boxShadow: '0 0 12px rgba(91,127,255,.2)' }}
                            >
                                <Icon name="plus" size={12} />
                                Add
                            </button>
                        </div>

                        {/* Criteria List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                            {criteria.map((c) => (
                                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 13px', background: colors.surface2, border: `1.5px solid ${colors.border}`, borderRadius: '9px' }}>
                                    <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: colors.text }}>{c.name}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        {(['low', 'medium', 'high', 'critical'] as const).map(l => (
                                            <div
                                                key={l}
                                                onClick={() => updateItemImportance(c.id, l)}
                                                style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '5px',
                                                    fontSize: '10px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    background: c.importance === l ? importanceColors[l as keyof typeof importanceColors].bg : 'transparent',
                                                    color: c.importance === l ? importanceColors[l as keyof typeof importanceColors].text : colors.text3,
                                                    transition: 'all 0.12s'
                                                }}
                                            >
                                                {importanceColors[l as keyof typeof importanceColors].label}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="font-numeric" style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '6px', background: colors.accentGlow, color: colors.accent, minWidth: '48px', textAlign: 'center' }}>
                                        {c.weight}%
                                    </div>
                                    <button
                                        onClick={() => removeCriterion(c.id)}
                                        style={{ width: '26px', height: '26px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: colors.text3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Icon name="trash" size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Weight Summary */}
                        {criteria.length > 0 && (
                            <div style={{ marginTop: '12px', padding: '12px 14px', background: colors.surface2, border: `1.5px solid ${colors.border}`, borderRadius: '9px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Icon name="check" size={14} />
                                        Weights auto-calculated ✓
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className="font-numeric" style={{ fontSize: '12px', color: colors.text3 }}>100%</div>
                                        <div onClick={() => setShowWeightsDetail(!showWeightsDetail)} style={{ fontSize: '11.5px', color: colors.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {showWeightsDetail ? 'Hide Details' : 'Show Details'}
                                            <Icon name={showWeightsDetail ? 'chevronUp' : 'chevronDown'} size={12} />
                                        </div>
                                    </div>
                                </div>
                                <div style={{ height: '5px', background: colors.surface3, borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
                                    <div style={{ height: '100%', width: '100%', background: '#10b981', borderRadius: '3px' }} />
                                </div>
                                {showWeightsDetail && (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '4px 0', textAlign: 'left' }}>Criterion</th>
                                                <th style={{ fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '4px 0', textAlign: 'right' }}>Weight</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {criteria.map((c, i) => (
                                                <tr key={c.id} style={{ borderBottom: i === criteria.length - 1 ? 'none' : `1px solid ${colors.border}` }}>
                                                    <td style={{ fontSize: '12.5px', padding: '5px 0', color: colors.text2 }}>{c.name}</td>
                                                    <td className="font-numeric" style={{ fontSize: '12.5px', padding: '5px 0', textAlign: 'right', fontWeight: 600, color: colors.accent }}>{c.weight}%</td>
                                                </tr>
                                            ))}
                                            <tr style={{ fontWeight: 700, color: colors.text }}>
                                                <td style={{ fontSize: '12.5px', padding: '5px 0' }}>Total</td>
                                                <td className="font-numeric" style={{ fontSize: '12.5px', padding: '5px 0', textAlign: 'right', color: colors.accent }}>100%</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 6. Parent Project */}
                    <div style={{ padding: '20px 26px', borderBottom: `1px solid ${colors.border}` }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: colors.text2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Parent Project <span style={{ color: colors.accent }}>*</span></div>
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                style={{ width: '100%', padding: '10px 13px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '9px', fontSize: '13.5px', color: colors.text, fontFamily: typography.fonts.display, outline: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4' fill='none' stroke='%23545d73' stroke-width='2'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                            >
                                <option value="">-- Select Project --</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name} · {p.category} · {p.report_frequency}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* 7. Deadline */}
                    <div style={{ padding: '20px 26px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: colors.text2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Deadline <span style={{ fontSize: '11px', fontWeight: 400, color: colors.text3, textTransform: 'none', letterSpacing: 0 }}>(Optional)</span>
                            </div>
                            <input
                                type="datetime-local"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                style={{ width: '100%', padding: '10px 13px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '9px', fontSize: '13.5px', color: colors.text, fontFamily: typography.fonts.display, outline: 'none' }}
                            />
                            <div style={{ fontSize: '11.5px', color: colors.text3, marginTop: '5px', lineHeight: 1.55 }}>
                                Optional: Set a target date. Evaluation scores will focus on progress up to this point.
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div style={{ padding: '16px 26px', borderTop: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, flexShrink: 0, background: colors.surface, position: 'sticky', bottom: 0, zIndex: 10 }}>
                    <Button variant="secondary" onClick={onClose} style={{ borderRadius: '9px', fontFamily: typography.fonts.display }}>Cancel</Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={isSaveDisabled}
                        style={{ borderRadius: '9px', fontFamily: typography.fonts.display, boxShadow: isSaveDisabled ? 'none' : '0 0 16px rgba(91,127,255,.25)' }}
                    >
                        <Icon name={loading ? 'refresh' : 'check'} size={14} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Saving...' : 'Save Goal'}
                    </Button>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideIn {
                    from { transform: translateX(48px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}
