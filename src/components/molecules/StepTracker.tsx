'use client'

import React from 'react'
import { colors, animation } from '@/design-system'

interface Step {
    id: number
    label: string
}

interface StepTrackerProps {
    steps: Step[]
    currentStep: number
}

export function StepTracker({ steps, currentStep }: StepTrackerProps) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', padding: '0 2px' }}>
            {steps.map((step, i) => {
                const isDone = currentStep > step.id
                const isActive = currentStep === step.id

                return (
                    <React.Fragment key={step.id}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <div
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    border: isDone ? `none` : `1.5px solid ${isActive ? colors.accent : colors.border}`,
                                    background: isDone ? colors.green : (isActive ? colors.accent : colors.surface2),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    color: (isDone || isActive) ? '#fff' : colors.text3,
                                    transition: `all ${animation.fast}`,
                                    boxShadow: isActive ? `0 0 12px ${colors.accent}40` : 'none'
                                }}
                            >
                                {isDone ? (
                                    <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '10px', height: '10px' }}>
                                        <path d="M1.5 5l2.5 2.5 4.5-4.5" />
                                    </svg>
                                ) : step.id}
                            </div>
                            <div
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: isDone ? colors.green : (isActive ? colors.accent : colors.text3),
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {step.label}
                            </div>
                        </div>

                        {i < steps.length - 1 && (
                            <div
                                style={{
                                    flex: 1,
                                    height: '2px',
                                    background: isDone ? colors.green : colors.border,
                                    margin: '0 10px 18px',
                                    transition: `background ${animation.base}`
                                }}
                            />
                        )}
                    </React.Fragment>
                )
            })}
        </div>
    )
}
