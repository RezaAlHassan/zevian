'use client'

import React from 'react'
import { colors, typography, radius, shadows, animation } from '@/design-system'
import { Icon } from '@/components/atoms/Icon'
import { Button } from '@/components/atoms/Button'

export default function VerifyEmailPage() {
    return (
        <div style={{
            width: '100%',
            maxWidth: '440px',
            padding: '0 16px',
            textAlign: 'center',
            animation: 'fadeUp 0.4s ease both',
        }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '48px', justifyContent: 'center' }}>
                <div style={{ width: '36px', height: '36px', background: colors.accent, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: typography.fonts.display, fontWeight: 800, fontSize: '16px', color: '#fff', boxShadow: shadows.logoGlow }}>Z</div>
                <span style={{ fontFamily: typography.fonts.display, fontWeight: 700, fontSize: '22px', letterSpacing: '-0.3px' }}>Zevian</span>
            </div>

            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius['2xl'], padding: '48px 32px' }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: colors.accentGlow,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.accent,
                    margin: '0 auto 24px',
                    border: `1px solid ${colors.accent}20`
                }}>
                    <Icon name="mail" size={32} />
                </div>

                <h1 style={{ fontFamily: typography.fonts.display, fontSize: '24px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-0.5px' }}>
                    Check your email
                </h1>
                <p style={{ fontSize: '15px', color: colors.text3, marginBottom: '32px', lineHeight: 1.6 }}>
                    We've sent a verification link to your email address. Please click the link to activate your account.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Button variant="primary" style={{ width: '100%' }} onClick={() => window.location.href = 'https://mail.google.com'}>
                        Open Gmail
                    </Button>
                    <Button variant="secondary" style={{ width: '100%' }}>
                        Resend Email
                    </Button>
                </div>

                <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: `1px solid ${colors.border}` }}>
                    <p style={{ fontSize: '13px', color: colors.text3 }}>
                        Mistake in your email? <a href="/signup" style={{ color: colors.accent, fontWeight: 700, textDecoration: 'none' }}>Go back</a>
                    </p>
                </div>
            </div>

            <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    )
}
