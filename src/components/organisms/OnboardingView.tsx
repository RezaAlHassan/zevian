'use client'

import React, { useState } from 'react'
import { colors, radius, typography, animation, layout, shadows } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { completeOnboardingAction } from '@/app/actions/onboardingActions'
import { generateGoalWithAI } from '@/lib/api/ai'

type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6

/* ═══════════════════════════════════════════════════════════════
   NO TEMPLATES - Custom flow
═══════════════════════════════════════════════════════════════ */

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

    // Step 1: Org
    const [orgName, setOrgName] = useState('')

    // Step 2: Project
    const [projName, setProjName] = useState('')
    const [projDesc, setProjDesc] = useState('')

    // Step 3: Goal
    const [customGoalText, setCustomGoalText] = useState('')
    const [aiGenerating, setAiGenerating] = useState(false)
    const [goalName, setGoalName] = useState('')
    const [goalInstructions, setGoalInstructions] = useState('')
    const [goalCriteria, setGoalCriteria] = useState<{ name: string; weight: number }[]>([])
    const [goalGenerated, setGoalGenerated] = useState(false)

    // Step 4: Employees
    const [emails, setEmails] = useState<string[]>([''])

    // Step 5: Frequency + Working Days
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'bi-weekly'>('weekly')
    const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5])

    const toggleWorkingDay = (day: number) => {
        setWorkingDays(prev =>
            prev.includes(day)
                ? prev.length > 1 ? prev.filter(d => d !== day) : prev
                : [...prev, day].sort((a, b) => a - b)
        )
    }

    const totalSteps = 6

    /* ── Step handlers ────────────────────────────────────── */

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
            setGoalName(result.data.name)
            setGoalInstructions(result.data.instructions)
            setGoalCriteria(result.data.criteria.map(c => ({ name: c.name, weight: c.weight })))
            setGoalGenerated(true)
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
                workingDays: frequency === 'daily' ? workingDays : [1, 2, 3, 4, 5],
                emails: emails.filter(e => e.includes('@')).join(','),
                origin: window.location.origin,
                // goal data
                goalName: goalName || 'Custom Goal',
                goalInstructions: goalInstructions || customGoalText || 'Custom goal instructions',
                criteria: goalCriteria || [],
            })
            setStep(6)
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps) as OnboardingStep)
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1) as OnboardingStep)

    const isNextDisabled = () => {
        if (step === 1 && !orgName.trim()) return true
        if (step === 2 && !projName.trim()) return true
        if (step === 3 && !goalGenerated && !customGoalText.trim()) return true
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
       STEP 1 — Setup Organization
    ═══════════════════════════════════════════════════════ */

    const renderStep1 = () => (
        <div style={{ maxWidth: '580px', margin: '0 auto', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.accent, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
                <Icon name="target" size={14} /> Step 1: Organization
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>Setup Organization</h1>
            <p style={{ color: colors.text3, fontSize: '15px', marginBottom: '32px', lineHeight: 1.6 }}>Let's start by naming your workspace.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                    <label style={labelStyle}>Organization Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Acme Corp"
                        value={orgName}
                        onChange={e => setOrgName(e.target.value)}
                        style={inputStyle}
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && orgName.trim() && nextStep()}
                    />
                </div>
            </div>
        </div>
    )

    /* ═══════════════════════════════════════════════════════
       STEP 2 — Create First Project
    ═══════════════════════════════════════════════════════ */

    const renderStep2 = () => (
        <div style={{ maxWidth: '580px', margin: '0 auto', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.accent, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
                <Icon name="fileText" size={14} /> Step 2: First Project
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>Create your First Project</h1>
            <p style={{ color: colors.text3, fontSize: '15px', marginBottom: '32px', lineHeight: 1.6 }}>Give your project a name and an optional description.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                    <label style={labelStyle}>Project Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Q1 Engineering Sprint"
                        value={projName}
                        onChange={e => setProjName(e.target.value)}
                        style={inputStyle}
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && projName.trim() && nextStep()}
                    />
                </div>
                <div>
                    <label style={labelStyle}>Description (Optional)</label>
                    <textarea
                        placeholder="What are the process, outcomes, and deliverables for this project?"
                        value={projDesc}
                        onChange={e => setProjDesc(e.target.value)}
                        style={{ ...inputStyle, height: '120px', resize: 'none' }}
                    />
                </div>
            </div>
        </div>
    )

    /* ═══════════════════════════════════════════════════════
       STEP 3 — Create Goal
    ═══════════════════════════════════════════════════════ */

    const renderStep3 = () => (
        <div style={{ maxWidth: '720px', margin: '0 auto', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.accent, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
                <Icon name="target" size={14} /> Step 3: Create Goal
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>Create goal for {projName || 'this project'}</h1>
            <p style={{ color: colors.text3, fontSize: '15px', marginBottom: '32px', lineHeight: 1.6 }}>Goals give the evaluation context. Describe what you want to track, and it will build the criteria.</p>

            <div style={{ padding: '24px', background: colors.surface, border: `1.5px solid ${colors.border}`, borderRadius: '16px' }}>
                <label style={labelStyle}>Describe what you want to track. The more specific you are the better Zevian will be able to evaluate.</label>
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

                {goalGenerated && (
                    <div style={{ marginTop: '20px', padding: '16px', background: colors.surface2, borderRadius: '12px', animation: 'fadeUp 0.3s ease' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text, marginBottom: '10px' }}>Generated Goal: {goalName}</div>
                        <div style={{ fontSize: '12px', color: colors.text3, marginBottom: '16px' }}>{goalInstructions}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                            {goalCriteria.map((c, i) => (
                                <span key={i} style={{
                                    fontSize: '10px', fontWeight: 600, padding: '3px 8px',
                                    borderRadius: '20px', background: colors.surface,
                                    color: colors.text2, border: `1px solid ${colors.border}`,
                                }}>{c.name} ({c.weight}%)</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )

    /* ═══════════════════════════════════════════════════════
       STEP 4 — Invite team members
    ═══════════════════════════════════════════════════════ */

    const renderStep4 = () => (
        <div style={{ maxWidth: '580px', margin: '0 auto', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.accent, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
                <Icon name="users" size={14} /> Step 4: Your Team
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>Invite employees</h1>
            <p style={{ color: colors.text3, fontSize: '15px', marginBottom: '32px', lineHeight: 1.6 }}>Add their email addresses. They'll be automatically assigned to your project and goal.</p>

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
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    if (idx === emails.length - 1 && email.trim()) addEmailRow();
                                    else if (email.trim()) nextStep();
                                }
                            }}
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
       STEP 5 — Report Cadence
    ═══════════════════════════════════════════════════════ */

    const renderStep5 = () => (
        <div style={{ maxWidth: '640px', margin: '0 auto', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.accent, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
                <Icon name="clock" size={14} /> Step 5: Reporting Cadence
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>How often should the team report?</h1>
            <p style={{ color: colors.text3, fontSize: '15px', marginBottom: '32px', lineHeight: 1.6 }}>Set how frequently your team submits their reports. You can change this later.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {([
                    { id: 'daily', name: 'Daily', desc: 'Best for high-intensity tracking.' },
                    { id: 'weekly', name: 'Weekly', desc: 'The most popular balance.' },
                    { id: 'bi-weekly', name: 'Bi-Weekly', desc: 'Best for longer sprints.' },
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

            {frequency === 'daily' && (
                <div style={{ marginTop: '24px', padding: '20px', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text, marginBottom: '4px' }}>
                        Which days does your team work?
                    </div>
                    <div style={{ fontSize: '12px', color: colors.text3, marginBottom: '14px' }}>
                        Reports will be expected on these days.
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {([
                            { label: 'Sun', value: 0 }, { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 },
                            { label: 'Wed', value: 3 }, { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 },
                            { label: 'Sat', value: 6 },
                        ] as const).map(({ label, value }) => {
                            const active = workingDays.includes(value)
                            return (
                                <div
                                    key={value}
                                    onClick={() => toggleWorkingDay(value)}
                                    style={{
                                        flex: 1, height: '44px', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', borderRadius: '10px', cursor: 'pointer',
                                        fontWeight: 700, fontSize: '12px',
                                        background: active ? colors.accentGlow : colors.surface2,
                                        border: `2px solid ${active ? colors.accent : colors.border}`,
                                        color: active ? colors.accent : colors.text3,
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {label}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {error && (
                <div style={{ padding: '12px 16px', background: colors.dangerGlow, border: `1px solid ${colors.danger}20`, borderRadius: '12px', color: colors.danger, fontSize: '13px', fontWeight: 600 }}>
                    {error}
                </div>
            )}
        </div>
    )

    /* ═══════════════════════════════════════════════════════
       COMPLETION PANEL
    ═══════════════════════════════════════════════════════ */

    const renderStep6 = () => {
        const criteria = goalCriteria || []
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
                        <SummaryRow label="Goal" value={goalName || 'Custom Goal'} />
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
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '13px', color: colors.text3, flexShrink: 0 }}>{label}</span>
                <span style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: accent ? colors.accent : colors.text,
                    textTransform: accent ? 'capitalize' : undefined,
                    textAlign: 'right',
                    lineHeight: 1.4,
                }}>{value}</span>
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
            case 6: return renderStep6()
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

            {step >= 1 && step < 6 && (
                <footer style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    height: '80px', padding: '0 32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: `${colors.bg}ee`, backdropFilter: 'blur(12px)',
                    borderTop: `1px solid ${colors.border}`, zIndex: 10,
                }}>
                    <div>
                        {step > 1 && <Button variant="secondary" onClick={prevStep}>Back</Button>}
                    </div>
                    {step === 5 ? (
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
