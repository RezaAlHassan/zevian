'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { colors, typography, radius, shadows, animation } from '@/design-system'
import { Icon } from '@/components/atoms/Icon'

export function RegisterForm() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const supabase = createClient()

        // 1. Sign up on the CLIENT so cookies are set in the browser
        const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                },
            },
        })

        if (authError) {
            setError(authError.message)
            setLoading(false)
            return
        }

        if (!data.user) {
            setError('Signup failed. Please try again.')
            setLoading(false)
            return
        }

        console.log('Signup success:', {
            hasUser: !!data.user,
            hasSession: !!data.session,
            userId: data.user.id
        })

        // 2. If we have a session (email confirm OFF), create the profile
        if (data.session) {
            try {
                const orgId = `org-${data.user.id.substring(0, 8)}`
                const empId = `emp-${data.user.id.substring(0, 8)}`
                const userName = name || email.split('@')[0]

                // Create org
                await supabase.from('organizations').upsert({
                    id: orgId,
                    name: `${userName}'s Workspace`,
                    plan_tier: 'free'
                } as any)

                // Create employee profile
                await supabase.from('employees').upsert({
                    id: empId,
                    organization_id: orgId,
                    auth_user_id: data.user.id,
                    name: userName,
                    email: email,
                    role: 'manager',
                    is_account_owner: true,
                    onboarding_completed: false,
                    join_date: new Date().toISOString().split('T')[0]
                } as any)

                console.log('Profile created successfully')
            } catch (err) {
                console.error('Profile creation error (non-fatal):', err)
            }
        }

        // 3. Hard redirect to onboarding (ensures fresh server request with cookies)
        window.location.href = '/onboarding'
    }

    return (
        <div style={{ width: '100%', maxWidth: '420px', padding: '0 16px', animation: 'fadeUp 0.4s ease both' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px', justifyContent: 'center' }}>
                <div style={{ width: '36px', height: '36px', background: colors.accent, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff' }}>Z</div>
                <span style={{ fontWeight: 700, fontSize: '22px' }}>Zevian</span>
            </div>

            <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius['2xl'], padding: '32px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>Create account</h1>
                <p style={{ fontSize: '13.5px', color: colors.text3, marginBottom: '28px' }}>Join Zevian to start tracking your projects.</p>

                {error && (
                    <div style={{ padding: '10px 14px', borderRadius: radius.lg, background: '#ff4d4f12', border: '1px solid #ff4d4f30', color: '#ff4d4f', fontSize: '13px', marginBottom: '20px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister}>
                    <div style={{ marginBottom: '18px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: colors.text2 }}>Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Your full name"
                            required
                            style={{ width: '100%', padding: '10px 14px', borderRadius: radius.lg, border: `1px solid ${colors.border}`, background: colors.bg, fontSize: '14px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div style={{ marginBottom: '18px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: colors.text2 }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            required
                            style={{ width: '100%', padding: '10px 14px', borderRadius: radius.lg, border: `1px solid ${colors.border}`, background: colors.bg, fontSize: '14px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: colors.text2 }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: radius.lg, border: `1px solid ${colors.border}`, background: colors.bg, fontSize: '14px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', padding: '12px', borderRadius: radius.lg, background: colors.accent, color: '#fff', fontWeight: 700, fontSize: '14px', border: 'none', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1, transition: animation.fast }}
                    >
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>
            </div>

            <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13.5px', color: colors.text3 }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: colors.accent, fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
        </div>
    )
}
