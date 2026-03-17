'use client'

import React, { useState } from 'react'
import { colors, radius, typography, animation, shadows } from '@/design-system'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'

interface InviteEmployeeSheetProps {
    isOpen: boolean
    onClose: () => void
}

export function InviteEmployeeSheet({ isOpen, onClose }: InviteEmployeeSheetProps) {
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<'employee' | 'manager'>('employee')

    if (!isOpen) return null

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
        }} onClick={onClose}>
            <div
                style={{
                    width: '100%',
                    maxWidth: '480px',
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: radius['2xl'],
                    padding: '32px',
                    boxShadow: shadows.cardHover,
                    animation: 'modalSlideUp 0.3s cubic-bezier(0.22, 0.68, 0, 1) both'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: colors.text, marginBottom: '8px', letterSpacing: '-0.3px' }}>Invite a Team Member</h2>
                    <p style={{ fontSize: '14px', color: colors.text3, lineHeight: 1.5 }}>They'll receive an email with a link to set up their account and start submitting reports.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Email Field */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: colors.text3,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '8px'
                        }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            placeholder="colleague@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                background: colors.surface2,
                                border: `1px solid ${colors.border}`,
                                borderRadius: radius.lg,
                                fontSize: '14px',
                                color: colors.text,
                                outline: 'none',
                                transition: `all ${animation.fast}`
                            }}
                        />
                    </div>

                    {/* Role Selection */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: colors.text3,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '8px'
                        }}>
                            Role
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div
                                onClick={() => setRole('employee')}
                                style={{
                                    padding: '16px',
                                    background: role === 'employee' ? colors.accentGlow : colors.surface2,
                                    border: `1px solid ${role === 'employee' ? colors.accent : colors.border}`,
                                    borderRadius: radius.xl,
                                    cursor: 'pointer',
                                    transition: `all ${animation.fast}`
                                }}
                            >
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    color: role === 'employee' ? colors.accent : colors.text,
                                    marginBottom: '4px'
                                }}>
                                    Employee
                                </div>
                                <div style={{ fontSize: '11.5px', color: colors.text3, lineHeight: 1.4 }}>
                                    Submits weekly reports. Sees their own scores only.
                                </div>
                            </div>
                            <div
                                onClick={() => setRole('manager')}
                                style={{
                                    padding: '16px',
                                    background: role === 'manager' ? colors.accentGlow : colors.surface2,
                                    border: `1px solid ${role === 'manager' ? colors.accent : colors.border}`,
                                    borderRadius: radius.xl,
                                    cursor: 'pointer',
                                    transition: `all ${animation.fast}`
                                }}
                            >
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    color: role === 'manager' ? colors.accent : colors.text,
                                    marginBottom: '4px'
                                }}>
                                    Manager
                                </div>
                                <div style={{ fontSize: '11.5px', color: colors.text3, lineHeight: 1.4 }}>
                                    Reviews team reports. Can override scores and set goals.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" icon="mail">Send Invite</Button>
                </div>
            </div>

            <style jsx>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    )
}
