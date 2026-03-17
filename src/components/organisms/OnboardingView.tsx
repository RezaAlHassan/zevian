'use client'

import React, { useState } from 'react'
import { colors, radius, typography, animation, layout, shadows } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { completeOnboardingAction } from '@/app/actions/onboardingActions'
import { generateGoalWithAI } from '@/lib/api/ai'

type OnboardingStep = 1 | 2 | 3 | 4 | 5

/* ═══════════════════════════════════════════════════════════════
   TEMPLATES
═══════════════════════════════════════════════════════════════ */

interface ProjectTemplate {
    id: string
    name: string
    category: string
    description: string
    reportFrequency: 'weekly' | 'bi-weekly' | 'monthly'
}

interface GoalTemplate {
    name: string
    instructions: string
    criteria: { name: string; weight: number }[]
}

interface TemplateCard {
    id: string
    emoji: string
    label: string
    color: string
}

const PROJECT_TEMPLATES: Record<string, ProjectTemplate> = {
    eng: {
        id: 'eng',
        name: 'Engineering Sprint',
        category: 'Engineering',
        description: 'Track delivery, code quality, and cross-team collaboration.',
        reportFrequency: 'weekly',
    },
    prod: {
        id: 'prod',
        name: 'Product Roadmap',
        category: 'Product',
        description: 'Manage prioritized features and stakeholder alignment.',
        reportFrequency: 'bi-weekly',
    },
    mktg: {
        id: 'mktg',
        name: 'Marketing Campaign',
        category: 'Marketing',
        description: 'Run campaigns with clear KPIs and weekly tracking.',
        reportFrequency: 'weekly',
    },
    design: {
        id: 'design',
        name: 'Design Sprint',
        category: 'Design',
        description: 'Coordinate research, prototyping, and handoff.',
        reportFrequency: 'bi-weekly',
    },
    cs: {
        id: 'cs',
        name: 'Customer Success',
        category: 'Support',
        description: 'Monitor CSAT, SLAs, and account health.',
        reportFrequency: 'monthly',
    },
    other: {
        id: 'other',
        name: 'Custom Project',
        category: 'Custom',
        description: '',
        reportFrequency: 'weekly',
    },
}

const GOAL_TEMPLATES: Record<string, GoalTemplate> = {
    eng: {
        name: 'Deliver Core API',
        instructions: 'Deliver robust, well-tested API endpoints with strong documentation and adherence to sprint timelines.',
        criteria: [
            { name: 'Code Quality', weight: 40 },
            { name: 'On-time Delivery', weight: 35 },
            { name: 'Collaboration', weight: 25 },
        ],
    },
    prod: {
        name: 'Ship Product Milestone',
        instructions: 'Ensure roadmap clarity, fast execution pace, and full stakeholder alignment on key features.',
        criteria: [
            { name: 'Roadmap Clarity', weight: 35 },
            { name: 'Execution Pace', weight: 35 },
            { name: 'Stakeholder Alignment', weight: 30 },
        ],
    },
    mktg: {
        name: 'Launch Growth Campaign',
        instructions: 'Execute marketing campaigns with measurable reach, lead generation, and high-quality content.',
        criteria: [
            { name: 'Campaign Reach', weight: 35 },
            { name: 'Lead Gen', weight: 35 },
            { name: 'Content Quality', weight: 30 },
        ],
    },
    design: {
        name: 'Complete Design Sprint',
        instructions: 'Deliver strong design concepts through rapid iteration, user research, and polished developer handoffs.',
        criteria: [
            { name: 'Concept Strength', weight: 35 },
            { name: 'Iteration Speed', weight: 30 },
            { name: 'Handoff Quality', weight: 35 },
        ],
    },
    cs: {
        name: 'Hit Support Targets',
        instructions: 'Maintain high CSAT scores, fast response times, and strong resolution rates across all support channels.',
        criteria: [
            { name: 'CSAT Score', weight: 35 },
            { name: 'Response Time', weight: 35 },
            { name: 'Resolution Rate', weight: 30 },
        ],
    },
    other: {
        name: 'Custom Goal',
        instructions: 'Define your own performance criteria and evaluation standards.',
        criteria: [],
    },
}

const TEMPLATE_CARDS: TemplateCard[] = [
    { id: 'eng', emoji: '⚡', label: 'Engineering Sprint', color: colors.accent },
    { id: 'prod', emoji: '🚀', label: 'Product Roadmap', color: colors.purple },
    { id: 'mktg', emoji: '📢', label: 'Marketing Campaign', color: colors.warn },
    { id: 'design', emoji: '🎨', label: 'Design Sprint', color: colors.teal },
    { id: 'cs', emoji: '💬', label: 'Customer Success', color: colors.green },
    { id: 'other', emoji: '✨', label: 'Something Else', color: colors.text3 },
]

/* ═══════════════════════════════════════════════════════════════
   SHARED STYLES
═══════════════════════════════════════════════════════════════ */

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 18px',
    background: colors.surface2,
    border: `1.5px solid ${colors.border}`,
    borderRadius: '12px',
    color: colors.text,
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    color: colors.text2,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px',
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */

export function OnboardingView() {
    const [step, setStep] = useState<OnboardingStep>(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Step 1
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
    const [customGoalText, setCustomGoalText] = useState('')
    const [aiGenerating, setAiGenerating] = useState(false)

    // Step 2
    const [projName, setProjName] = useState('')
    const [projDesc, setProjDesc] = useState('')

    // Step 3
    const [emails, setEmails] = useState<string[]>([''])

    // Step 4
    const [frequency, setFrequency] = useState<'weekly' | 'bi-weekly' | 'monthly'>('weekly')

    // Org name (collected from step 1 context or defaulted)
    const [orgName, setOrgName] = useState('')

    const totalSteps = 5

    // Resolved template data
    const projTemplate = selectedTemplateId ? PROJECT_TEMPLATES[selectedTemplateId] : null
    const goalTemplate = selectedTemplateId ? GOAL_TEMPLATES[selectedTemplateId] : null

    /* ── Step handlers ────────────────────────────────────── */

    const selectTemplate = (id: string) => {
        setSelectedTemplateId(id)
        const pTpl = PROJECT_TEMPLATES[id]
        if (pTpl) {
            setProjName(pTpl.name)
            setProjDesc(pTpl.description)
            setFrequency(pTpl.reportFrequency)
        }
        // Auto-advance except "Something Else"
        if (id !== 'other') {
            setStep(2)
        }
    }

    const handleAiGenerate = async () => {
        if (!customGoalText.trim() || customGoalText.trim().length < 10) return
        setAiGenerating(true)
        try {
            const result = await generateGoalWithAI(customGoalText)
            if (result.error || !result.data) {
                alert(result.error || 'Failed to generate. Please try again.')
                return
            }
            // Fill in the custom goal text with AI-generated instructions
            setCustomGoalText(result.data.instructions)
            // Also update the GOAL_TEMPLATES['other'] with generated data
            GOAL_TEMPLATES['other'] = {
                name: result.data.name,
                instructions: result.data.instructions,
                criteria: result.data.criteria.map(c => ({ name: c.name, weight: c.weight })),
            }
            // Pre-fill project name from AI goal name
            setProjName(result.data.name + ' Project')
        } catch (err) {
            console.error('AI generation error:', err)
            alert('Failed to generate. Please try again.')
        } finally {
            setAiGenerating(false)
        }
    }

    const addEmailRow = () => {
        if (emails.length < 10) setEmails([...emails, ''])
    }

    const updateEmail = (idx: number, value: string) => {
        const next = [...emails]
        next[idx] = value
        setEmails(next)
    }

    const removeEmailRow = (idx: number) => {
        const next = emails.filter((_, i) => i !== idx)
        if (next.length === 0) next.push('')
        setEmails(next)
    }

    const finishSetup = async () => {
        setLoading(true)
        setError(null)
        try {
            await completeOnboardingAction({
                orgName: orgName || `${projName} Workspace`,
                projName,
                projDesc,
                frequency,
                emails: emails.filter(e => e.includes('@')).join(','),
                origin: window.location.origin,
                // New: goal data
                goalName: goalTemplate?.name || 'Custom Goal',
                goalInstructions: selectedTemplateId === 'other'
                    ? (customGoalText || 'Custom goal instructions')
                    : (goalTemplate?.instructions || ''),
                criteria: goalTemplate?.criteria || [],
            })
            setStep(5)
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps) as OnboardingStep)
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1) as OnboardingStep)

    const isNextDisabled = () => {
        if (step === 1 && !selectedTemplateId) return true
        if (step === 1 && selectedTemplateId === 'other' && !customGoalText.trim()) return true
        if (step === 2 && !projName.trim()) return true
        return false
    }

    /* ── Header + progress ────────────────────────────────── */

    const renderHeader = () => (
        <header style={{
            height: '60px', padding: '0 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${colors.border}`, background: colors.surface,
            position: 'sticky', top: 0, zIndex: 10,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', background: colors.accent, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>Z</div>
                <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.5px' }}>Zevian</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '4px 12px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '20px', fontSize: '12px', fontWeight: 700, color: colors.text3 }}>
                    Step {step} of {totalSteps}
                </div>
            </div>
        </header>
    )

    const renderProgress = () => (
        <div style={{ height: '2px', background: colors.border, width: '100%', position: 'relative' }}>
            <div style={{
                height: '100%',
                background: `linear-gradient(90deg, ${colors.accent}, ${colors.teal})`,
                width: `${(step / totalSteps) * 100}%`,
                transition: 'width 0.4s ease',
                boxShadow: `0 0 10px ${colors.accent}40`,
            }} />
        </div>
    )

    /* ═══════════════════════════════════════════════════════
       STEP 1 — Template Selection
    ═══════════════════════════════════════════════════════ */

    const renderStep1 = () => (
        <div style={{ maxWidth: '720px', margin: '0 auto', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.accent, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
                <Icon name="target" size={14} /> Step 1: What are we tracking?
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>Choose a template</h1>
            <p style={{ color: colors.text3, fontSize: '15px', marginBottom: '32px', lineHeight: 1.6 }}>Pick the type of work you want to track. This pre-fills your project and goal settings — you can customize everything later.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {TEMPLATE_CARDS.map(card => {
                    const isSelected = selectedTemplateId === card.id
                    const goalTpl = GOAL_TEMPLATES[card.id]
                    return (
                        <div
                            key={card.id}
                            onClick={() => selectTemplate(card.id)}
                            style={{
                                padding: '24px 20px',
                                background: isSelected ? `${card.color}10` : colors.surface,
                                border: `1.5px solid ${isSelected ? card.color : colors.border}`,
                                borderRadius: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                position: 'relative',
                            }}
                        >
                            <div style={{ fontSize: '32px', marginBottom: '14px' }}>{card.emoji}</div>
                            <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '8px', color: isSelected ? card.color : colors.text }}>{card.label}</div>
                            {/* Criteria tags */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                {goalTpl.criteria.length > 0 ? goalTpl.criteria.map((c, i) => (
                                    <span key={i} style={{
                                        fontSize: '10px', fontWeight: 600, padding: '3px 8px',
                                        borderRadius: '20px', background: colors.surface2,
                                        color: colors.text3, border: `1px solid ${colors.border}`,
                                    }}>{c.name}</span>
                                )) : (
                                    <span style={{
                                        fontSize: '10px', fontWeight: 600, padding: '3px 8px',
                                        borderRadius: '20px', background: colors.surface2,
                                        color: colors.text3, border: `1px solid ${colors.border}`,
                                    }}>Custom criteria</span>
                                )}
                            </div>
                            {isSelected && (
                                <div style={{ position: 'absolute', top: '12px', right: '12px', width: '20px', height: '20px', background: card.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon name="check" size={12} color="#fff" />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* "Something Else" expanded area */}
            {selectedTemplateId === 'other' && (
                <div style={{ marginTop: '20px', padding: '24px', background: colors.surface, border: `1.5px solid ${colors.border}`, borderRadius: '16px', animation: 'fadeUp 0.3s ease' }}>
                    <label style={labelStyle}>Describe what you want to track</label>
                    <textarea
                        placeholder="e.g. Weekly check-ins for our freelance team tracking deliverables and communication..."
                        value={customGoalText}
                        onChange={e => setCustomGoalText(e.target.value)}
                        style={{ ...inputStyle, height: '100px', resize: 'none', marginBottom: '12px' }}
                    />
                    <button
                        onClick={handleAiGenerate}
                        disabled={aiGenerating}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 18px', borderRadius: '10px',
                            background: `linear-gradient(135deg, ${colors.accent}15, ${colors.teal}10)`,
                            border: `1px solid ${colors.accent}40`,
                            color: colors.accent, fontSize: '13px', fontWeight: 700,
                            cursor: aiGenerating ? 'wait' : 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        <Icon name="sparkles" size={14} color={colors.accent} />
                        {aiGenerating ? 'Generating...' : 'Generate with AI'}
                    </button>

                    <div style={{ marginTop: '16px' }}>
                        <Button variant="primary" disabled={!customGoalText.trim()} onClick={() => setStep(2)}>
                            Continue <Icon name="chevronRight" size={16} />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )

    /* ═══════════════════════════════════════════════════════
       STEP 2 — Project Name + Description
    ═══════════════════════════════════════════════════════ */

    const renderStep2 = () => (
        <div style={{ maxWidth: '580px', margin: '0 auto', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.accent, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
                <Icon name="fileText" size={14} /> Step 2: Project Details
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>Name your project</h1>
            <p style={{ color: colors.text3, fontSize: '15px', marginBottom: '32px', lineHeight: 1.6 }}>Give your project a name and optional description. This is pre-filled from the template — feel free to change it.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                    <label style={labelStyle}>Organization Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Acme Corp"
                        value={orgName}
                        onChange={e => setOrgName(e.target.value)}
                        style={inputStyle}
                    />
                </div>
                <div>
                    <label style={labelStyle}>Project Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Q1 Engineering Sprint"
                        value={projName}
                        onChange={e => setProjName(e.target.value)}
                        style={inputStyle}
                        autoFocus
                    />
                </div>
                <div>
                    <label style={labelStyle}>Description (Optional)</label>
                    <textarea
                        placeholder="What outcomes does this project track?"
                        value={projDesc}
                        onChange={e => setProjDesc(e.target.value)}
                        style={{ ...inputStyle, height: '120px', resize: 'none' }}
                    />
                </div>
            </div>
        </div>
    )

    /* ═══════════════════════════════════════════════════════
       STEP 3 — Invite Members
    ═══════════════════════════════════════════════════════ */

    const renderStep3 = () => (
        <div style={{ maxWidth: '580px', margin: '0 auto', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.accent, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
                <Icon name="users" size={14} /> Step 3: Your Team
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>Invite team members</h1>
            <p style={{ color: colors.text3, fontSize: '15px', marginBottom: '32px', lineHeight: 1.6 }}>Add their email addresses. They'll receive an invitation to join Zevian and this project.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {emails.map((email, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '8px',
                            background: colors.surface2, border: `1px solid ${colors.border}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 700, color: colors.text3, flexShrink: 0,
                        }}>{idx + 1}</div>
                        <input
                            type="email"
                            placeholder="colleague@company.com"
                            value={email}
                            onChange={e => updateEmail(idx, e.target.value)}
                            style={{ ...inputStyle, padding: '12px 16px', fontSize: '14px' }}
                        />
                        {emails.length > 1 && (
                            <button onClick={() => removeEmailRow(idx)} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: colors.text3, flexShrink: 0, padding: '4px',
                            }}>
                                <Icon name="x" size={14} color={colors.text3} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {emails.length < 10 && (
                <button onClick={addEmailRow} style={{
                    background: 'none', border: 'none', color: colors.accent,
                    fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px',
                }}>
                    <Icon name="plus" size={14} color={colors.accent} />
                    Add another
                </button>
            )}

            <div style={{
                padding: '16px 20px', background: colors.surface2,
                border: `1px solid ${colors.border}`, borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ fontSize: '13px', color: colors.text2 }}>Not ready to invite people yet?</div>
                <button
                    onClick={nextStep}
                    style={{
                        background: 'none', border: 'none', color: colors.accent,
                        fontWeight: 700, cursor: 'pointer', fontSize: '13px',
                    }}
                >
                    Skip for now
                </button>
            </div>
        </div>
    )

    /* ═══════════════════════════════════════════════════════
       STEP 4 — Report Frequency
    ═══════════════════════════════════════════════════════ */

    const renderStep4 = () => (
        <div style={{ maxWidth: '640px', margin: '0 auto', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.accent, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
                <Icon name="clock" size={14} /> Step 4: Reporting Cadence
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>How often should the team report?</h1>
            <p style={{ color: colors.text3, fontSize: '15px', marginBottom: '32px', lineHeight: 1.6 }}>Set how frequently your team submits their AI-assisted reports. You can change this later.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {([
                    { id: 'weekly', name: 'Weekly', desc: 'Best for fast-moving sprints.' },
                    { id: 'bi-weekly', name: 'Bi-Weekly', desc: 'The most popular balance.' },
                    { id: 'monthly', name: 'Monthly', desc: 'Ideal for strategic long-term goals.' },
                ] as const).map(freq => (
                    <div
                        key={freq.id}
                        onClick={() => setFrequency(freq.id)}
                        style={{
                            padding: '28px 20px',
                            textAlign: 'center',
                            background: frequency === freq.id ? colors.accentGlow : colors.surface,
                            border: `2px solid ${frequency === freq.id ? colors.accent : colors.border}`,
                            borderRadius: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        <div style={{ fontWeight: 800, fontSize: '18px', marginBottom: '8px', color: frequency === freq.id ? colors.accent : colors.text }}>{freq.name}</div>
                        <div style={{ fontSize: '12px', color: colors.text3, lineHeight: 1.5 }}>{freq.desc}</div>
                    </div>
                ))}
            </div>

            {error && (
                <div style={{ padding: '12px 16px', background: colors.dangerGlow, border: `1px solid ${colors.danger}20`, borderRadius: '12px', color: colors.danger, fontSize: '13px', fontWeight: 600 }}>
                    {error}
                </div>
            )}
        </div>
    )

    /* ═══════════════════════════════════════════════════════
       STEP 5 — Summary & Completion
    ═══════════════════════════════════════════════════════ */

    const renderStep5 = () => {
        const criteria = goalTemplate?.criteria || []
        return (
            <div style={{ maxWidth: '540px', margin: '0 auto', animation: 'fadeUp 0.4s ease', textAlign: 'center' }}>
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: colors.greenGlow, border: `2px solid ${colors.green}`,
                    margin: '0 auto 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px',
                }}>🎉</div>
                <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.8px' }}>All set!</h1>
                <p style={{ color: colors.text3, fontSize: '16px', marginBottom: '40px', lineHeight: 1.6 }}>Your organization, project, and first goal are ready.</p>

                {/* Summary card */}
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', overflow: 'hidden', textAlign: 'left', marginBottom: '32px' }}>
                    <div style={{ padding: '12px 20px', background: colors.surface2, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon name="check" size={12} color={colors.green} />
                        <span style={{ fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase' }}>Setup Summary</span>
                    </div>
                    <div style={{ padding: '20px' }}>
                        <SummaryRow label="Project" value={projName} />
                        <SummaryRow label="Goal" value={goalTemplate?.name || 'Custom Goal'} />
                        <SummaryRow label="Cadence" value={frequency} accent />

                        {criteria.length > 0 && (
                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
                                <div style={{ fontSize: '10px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', marginBottom: '10px' }}>Scoring Criteria</div>
                                {criteria.map((c, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '13px', color: colors.text2 }}>{c.name}</span>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: colors.accent }}>{c.weight}%</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <Button variant="primary" style={{ width: '100%', padding: '16px' }} onClick={() => window.location.href = '/dashboard'}>
                    Go to my dashboard <Icon name="chevronRight" size={16} />
                </Button>
            </div>
        )
    }

    /* ── Summary row helper ───────────────────────────────── */

    function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: colors.text3 }}>{label}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: accent ? colors.accent : colors.text, textTransform: accent ? 'capitalize' : undefined }}>{value}</span>
            </div>
        )
    }

    /* ═══════════════════════════════════════════════════════
       RENDER
    ═══════════════════════════════════════════════════════ */

    const renderCurrentStep = () => {
        switch (step) {
            case 1: return renderStep1()
            case 2: return renderStep2()
            case 3: return renderStep3()
            case 4: return renderStep4()
            case 5: return renderStep5()
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: colors.bg, overflowY: 'auto' }}>
            {renderHeader()}
            {renderProgress()}

            {/* Background Effects */}
            <div style={{ position: 'fixed', top: '-10%', right: '-10%', width: '600px', height: '600px', background: `radial-gradient(circle, ${colors.accent}10 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'fixed', bottom: '-10%', left: '-10%', width: '600px', height: '600px', background: `radial-gradient(circle, ${colors.teal}05 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />

            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px 120px', position: 'relative', zIndex: 1 }}>
                {renderCurrentStep()}
            </main>

            {step > 1 && step < 5 && (
                <footer style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    height: '80px', padding: '0 32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: `${colors.bg}ee`, backdropFilter: 'blur(12px)',
                    borderTop: `1px solid ${colors.border}`, zIndex: 10,
                }}>
                    <div>
                        <Button variant="secondary" onClick={prevStep}>Back</Button>
                    </div>
                    {step === 4 ? (
                        <Button variant="primary" disabled={loading} onClick={finishSetup}>
                            {loading ? 'Processing...' : 'Finish Setup'} <Icon name="chevronRight" size={16} />
                        </Button>
                    ) : (
                        <Button variant="primary" disabled={isNextDisabled()} onClick={nextStep}>
                            Continue <Icon name="chevronRight" size={16} />
                        </Button>
                    )}
                </footer>
            )}

            <style jsx global>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}
