'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { colors, radius, typography, animation, layout, shadows } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { ScoreDisplay } from '@/components/atoms/Score'
import { Accordion } from '@/components/molecules/Accordion'

type SubmissionStep = 1 | 2 | 3 | 4

interface Goal {
    id: string
    name: string
    project: string
    projectEmoji: string
    criteria: {
        id: string
        name: string
        weight: number
    }[]
}

const MOCK_GOALS: Goal[] = [
    {
        id: 'goal-1',
        name: 'Code Quality & Delivery',
        project: 'Sprint Alpha v2',
        projectEmoji: '⚡',
        criteria: [
            { id: 'c1', name: 'Clean Architecture', weight: 40 },
            { id: 'c2', name: 'Unit Test Coverage', weight: 30 },
            { id: 'c3', name: 'Performance Budget', weight: 30 }
        ]
    },
    {
        id: 'goal-2',
        name: 'Design Execution & Handoff',
        project: 'Design Sprint Q1',
        projectEmoji: '🎨',
        criteria: [
            { id: 'c4', name: 'Visual Fidelity', weight: 50 },
            { id: 'c5', name: 'Documentation quality', weight: 50 }
        ]
    },
    {
        id: 'goal-3',
        name: 'Knowledge Base Expansion',
        project: 'CS Operations',
        projectEmoji: '📚',
        criteria: [
            { id: 'c6', name: 'Article Clarity', weight: 60 },
            { id: 'c7', name: 'Total Volume', weight: 40 }
        ]
    }
]

export function SubmitReportView() {
    const router = useRouter()
    const [step, setStep] = useState<SubmissionStep>(1)
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
    const [accomplishments, setAccomplishments] = useState('')
    const [blockers, setBlockers] = useState('')
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [scores, setScores] = useState<Record<string, number>>({})

    const selectedGoal = MOCK_GOALS.find(g => g.id === selectedGoalId)
    const totalSteps = 4

    const nextStep = () => {
        if (step === 2) {
            handleAIAnalyze()
        } else {
            setStep(prev => Math.min(prev + 1, totalSteps) as SubmissionStep)
        }
    }
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1) as SubmissionStep)

    const handleAIAnalyze = () => {
        setIsAnalyzing(true)
        // Simulate AI analysis delay
        setTimeout(() => {
            const newScores: Record<string, number> = {}
            selectedGoal?.criteria.forEach(c => {
                newScores[c.id] = Math.floor(Math.random() * 4) + 6 // Random scores between 6-10 for realistic looks
            })
            setScores(newScores)
            setIsAnalyzing(false)
            setStep(3)
        }, 1500)
    }

    const calculateOverallScore = () => {
        if (!selectedGoal) return 0
        let total = 0
        selectedGoal.criteria.forEach(c => {
            total += (scores[c.id] || 0) * (c.weight / 100)
        })
        return total
    }

    const renderHeader = () => (
        <header style={{
            height: '60px',
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${colors.border}`,
            background: colors.surface,
            position: 'sticky',
            top: 0,
            zIndex: 10
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon name="reports" color={colors.accent} size={20} />
                <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.3px' }}>Submit Weekly Report</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: s === step ? colors.accent : (s < step ? colors.green : colors.border),
                            transition: 'all 0.3s ease'
                        }} />
                    ))}
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: colors.text3 }}>Step {step} of {totalSteps}</span>
            </div>
        </header>
    )

    const renderStep1 = () => (
        <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeUp 0.4s ease' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.5px' }}>Which goal are you reporting for?</h2>
            <p style={{ color: colors.text3, fontSize: '15px', marginBottom: '32px' }}>Select the primary objective you've been focused on this week.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {MOCK_GOALS.map(goal => (
                    <div
                        key={goal.id}
                        onClick={() => setSelectedGoalId(goal.id)}
                        style={{
                            padding: '24px',
                            background: selectedGoalId === goal.id ? colors.accentGlow : colors.surface,
                            border: `2px solid ${selectedGoalId === goal.id ? colors.accent : colors.border}`,
                            borderRadius: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ fontSize: '24px', marginBottom: '16px' }}>{goal.projectEmoji}</div>
                        <div style={{ fontWeight: 800, fontSize: '16px', marginBottom: '4px', color: selectedGoalId === goal.id ? colors.accent : colors.text }}>{goal.name}</div>
                        <div style={{ fontSize: '12px', color: colors.text3, fontWeight: 600 }}>{goal.project}</div>

                        {selectedGoalId === goal.id && (
                            <div style={{ position: 'absolute', top: '16px', right: '16px', color: colors.accent }}>
                                <Icon name="check" size={18} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )

    const renderStep2 = () => (
        <div style={{ maxWidth: '640px', margin: '0 auto', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.accent, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
                <Icon name="fileText" size={14} /> Tracking: {selectedGoal?.name}
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.5px' }}>What did you achieve?</h2>
            <p style={{ color: colors.text3, fontSize: '14px', marginBottom: '32px' }}>Be descriptive. Our AI will use this text to evaluate your progress against goal criteria.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: '40px', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.text2, textTransform: 'uppercase', marginBottom: '8px' }}>Accomplishments</label>
                        <textarea
                            placeholder="Describe your key wins, metrics achieved, or completed tasks..."
                            value={accomplishments}
                            onChange={(e) => setAccomplishments(e.target.value)}
                            style={{
                                width: '100%',
                                height: '220px',
                                padding: '16px',
                                background: colors.surface2,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '12px',
                                color: colors.text,
                                fontSize: '15px',
                                outline: 'none',
                                resize: 'none',
                                fontFamily: 'inherit',
                                lineHeight: 1.6
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.text2, textTransform: 'uppercase', marginBottom: '8px' }}>Blockers & Challenges (Optional)</label>
                        <textarea
                            placeholder="Anything slowing you down or requiring manager attention?"
                            value={blockers}
                            onChange={(e) => setBlockers(e.target.value)}
                            style={{
                                width: '100%',
                                height: '100px',
                                padding: '16px',
                                background: colors.surface2,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '12px',
                                color: colors.text,
                                fontSize: '15px',
                                outline: 'none',
                                resize: 'none',
                                fontFamily: 'inherit',
                                lineHeight: 1.6
                            }}
                        />
                    </div>
                </div>

                {/* Reports Due Section (Mock) */}
                <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
                    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon name="clock" size={13} color={colors.text3} />
                            <span style={{ fontSize: '10px', fontWeight: 800, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reports Due</span>
                        </div>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => router.push('/my-goals')}
                            style={{ fontSize: '10px', height: '24px', padding: '0 8px' }}
                        >
                            See all
                        </Button>
                    </div>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { id: 1, label: 'Due today', sublabel: 'Today · 17:00', color: colors.warn, projectName: 'Apollo Project', goalName: 'Increase Test Coverage' },
                            { id: 2, label: 'Due tomorrow', sublabel: 'Tomorrow', color: colors.warn, projectName: 'Zevian Core', goalName: 'Refactor Auth Module' }
                        ].map(item => (
                            <div 
                                key={item.id} 
                                style={{ 
                                    background: `${item.color}08`, 
                                    border: `1px solid ${item.color}20`, 
                                    borderRadius: '12px', 
                                    padding: '12px', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: '8px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '4px', height: '16px', borderRadius: '2px', background: item.color }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12.5px', fontWeight: 800, color: item.color }}>{item.label}</div>
                                        <div style={{ fontSize: '10.5px', color: colors.text3 }}>{item.sublabel}</div>
                                    </div>
                                </div>
                                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: `1px solid ${colors.border}` }}>
                                    <div style={{ fontSize: '9px', fontWeight: 800, color: colors.text3, textTransform: 'uppercase', marginBottom: '1px' }}>{item.projectName}</div>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.text2 }}>{item.goalName}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Guidelines Sidebar */}
                <Accordion 
                    allowMultiple={true}
                    initialOpenIndices={[0]}
                    items={[
                        {
                            title: "How to write a report that scores well",
                            content: (
                                <div style={{ paddingTop: '8px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: colors.text, marginBottom: '10px', lineHeight: 1.4 }}>
                                        The AI scores what you did, not what you say you did. Be specific.
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ fontSize: '11px', color: colors.text2, lineHeight: 1.6 }}>
                                            <div style={{ fontWeight: 800, color: colors.accent, marginBottom: '2px' }}>① Show your work</div>
                                            Don't say "I improved code quality."<br/>
                                            Say <strong>"Refactored the auth module, reducing API response time by 30%."</strong>
                                        </div>
                                        {/* ... other items (truncated for brevity but I will keep them) */}
                                        <div style={{ fontSize: '11px', color: colors.text2, lineHeight: 1.6 }}>
                                            <div style={{ fontWeight: 800, color: colors.accent, marginBottom: '2px' }}>② Address criteria directly</div>
                                            Your manager set specific criteria for this goal.
                                        </div>
                                        <div style={{ fontSize: '11px', color: colors.text2, lineHeight: 1.6 }}>
                                            <div style={{ fontWeight: 800, color: colors.accent, marginBottom: '2px' }}>③ Short and specific</div>
                                            A 3-sentence report with real evidence outscores filler.
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '12px', fontSize: '10px', color: colors.text3, textAlign: 'center', lineHeight: 1.3, fontStyle: 'italic' }}>
                                        Scores are based on evidence. Manager review follows.
                                    </div>
                                </div>
                            )
                        },
                        {
                            title: "Organizational Metrics",
                            content: (
                                <div style={{ paddingTop: '8px' }}>
                                    <div style={{ fontSize: '10.5px', color: colors.text3, marginBottom: '10px', lineHeight: 1.4 }}>
                                        AI evaluates these across all your reports.
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {['Team Collaboration', 'Documentation', 'Code Quality'].map((m, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: colors.surface2, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                                                <span style={{ fontSize: '12px', fontWeight: 600, flex: 1 }}>{m}</span>
                                                <div style={{ width: '30px', height: '2px', background: colors.surface3, borderRadius: '1px' }}>
                                                    <div style={{ width: '70%', height: '100%', background: colors.accent }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        }
                    ]}
                />
            </div>
        </div>
    )

    const renderStep3 = () => (
        <div style={{ maxWidth: '720px', margin: '0 auto', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: colors.accentGlow, borderRadius: '20px', border: `1px solid ${colors.accent}30`, color: colors.accent, fontSize: '13px', fontWeight: 700, marginBottom: '16px' }}>
                    <Icon name="sparkles" size={14} /> AI Analysis Complete
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.8px' }}>Suggested Evaluation</h2>
                <p style={{ color: colors.text3, fontSize: '15px' }}>Based on your accomplishments, here is how you track against your criteria.</p>
            </div>

            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '20px', padding: '32px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '24px', borderBottom: `1px solid ${colors.border}` }}>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', marginBottom: '4px' }}>Overall AI Score</div>
                        <div style={{ fontSize: '14px', color: colors.text2 }}>Calculated based on weighted criteria</div>
                    </div>
                    <ScoreDisplay score={calculateOverallScore()} size="lg" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {selectedGoal?.criteria.map(crit => (
                        <div key={crit.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div>
                                    <span style={{ fontSize: '15px', fontWeight: 700 }}>{crit.name}</span>
                                    <span style={{ fontSize: '12px', color: colors.text3, marginLeft: '8px' }}>Weight: {crit.weight}%</span>
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 900, color: colors.accent }}>{scores[crit.id] || 0} / 10</div>
                            </div>
                            <div style={{ height: '8px', background: colors.surface2, borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    background: colors.accent,
                                    width: `${(scores[crit.id] || 0) * 10}%`,
                                    transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ padding: '16px 20px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Icon name="alert" size={18} color={colors.text3} />
                <p style={{ fontSize: '12.5px', color: colors.text2, lineHeight: 1.5 }}>AI scores are suggestions based on your reported text. You can refine your report text and re-analyze, or submit if you agree with this evaluation.</p>
            </div>
        </div>
    )

    const renderStep4 = () => (
        <div style={{ maxWidth: '440px', margin: '0 auto', textAlign: 'center', animation: 'fadeUp 0.4s ease' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: colors.greenGlow, border: `2px solid ${colors.green}`, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.green }}>
                <Icon name="check" size={40} />
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.8px' }}>Report Submitted!</h2>
            <p style={{ color: colors.text3, fontSize: '16px', marginBottom: '40px', lineHeight: 1.6 }}>Excellent work this week. Your report has been sent to your manager for final review.</p>

            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '24px', textAlign: 'left', marginBottom: '32px' }}>
                <div style={{ fontSize: '12px', color: colors.text3, textTransform: 'uppercase', fontWeight: 700, marginBottom: '16px' }}>Summary</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', color: colors.text3 }}>AI Score</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: colors.green }}>{calculateOverallScore().toFixed(1)} / 10</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: colors.text3 }}>Status</span>
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>Awaiting Review</span>
                </div>
            </div>

            <Button variant="primary" style={{ width: '100%', padding: '16px' }} onClick={() => window.location.href = '/'}>
                Back to Dashboard
            </Button>
        </div>
    )

    const renderCurrentStep = () => {
        if (isAnalyzing) {
            return (
                <div style={{ textAlign: 'center', animation: 'pulse 2s infinite' }}>
                    <div style={{ marginBottom: '24px', color: colors.accent }}>
                        <Icon name="sparkles" size={64} />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800 }}>AI is evaluating your progress...</h2>
                    <p style={{ color: colors.text3 }}>Correlating accomplishments with goal criteria</p>
                </div>
            )
        }

        switch (step) {
            case 1: return renderStep1()
            case 2: return renderStep2()
            case 3: return renderStep3()
            case 4: return renderStep4()
        }
    }

    const isNextDisabled = () => {
        if (step === 1 && !selectedGoalId) return true
        if (step === 2 && !accomplishments.trim()) return true
        return false
    }

    return (
        <div style={{ minHeight: '100vh', background: colors.bg }}>
            {renderHeader()}

            {/* Dynamic Background Glow */}
            <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '600px', background: `radial-gradient(circle, ${colors.accent}08 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />

            <main style={{ padding: '60px 24px 120px', position: 'relative', zIndex: 1 }}>
                {renderCurrentStep()}
            </main>

            {!isAnalyzing && step < 4 && (
                <footer style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '80px',
                    padding: '0 32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: `${colors.bg}ee`,
                    backdropFilter: 'blur(12px)',
                    borderTop: `1px solid ${colors.border}`,
                    zIndex: 10
                }}>
                    <div>
                        {step > 1 && (
                            <Button variant="secondary" onClick={prevStep}>Back</Button>
                        )}
                    </div>
                    <Button
                        variant="primary"
                        disabled={isNextDisabled()}
                        onClick={nextStep}
                    >
                        {step === 2 ? 'Analyze with AI' : (step === 3 ? 'Submit Report' : 'Continue')}
                        <Icon name={step === 2 ? 'sparkles' : 'chevronRight'} size={14} style={{ marginLeft: '8px' }} />
                    </Button>
                </footer>
            )}

            <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
      `}</style>
        </div>
    )
}
