'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { acceptInviteAction } from '@/app/actions/inviteActions'
import { Button } from '@/components/atoms/Button'
import { createClient } from '@/lib/supabase/client'

export default function AcceptInvitePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [formData, setFormData] = useState({
        name: '',
        title: '',
        dept: '',
        password: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing invitation token.')
        }
    }, [token])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!token) return

        if (!formData.name || !formData.password) {
            setError('Name and Password are required.')
            return
        }

        setError('')
        setLoading(true)

        const result = await acceptInviteAction(token, formData)

        if (result.success && result.email) {
            // Auto-login the user
            const supabase = createClient()
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: result.email,
                password: formData.password
            })

            setLoading(false)

            if (signInError) {
                router.push('/login?message=Account created! Please log in.')
            } else {
                if (result.role === 'employee') {
                    router.push('/my-dashboard')
                } else {
                    router.push('/dashboard')
                }
                router.refresh()
            }
        } else {
            setLoading(false)
            setError(result.error || 'Failed to accept invitation.')
        }
    }

    if (!token) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>Zevian</div>
                <h2 style={{ marginTop: '20px' }}>Invalid Link</h2>
                <p>This invitation link is invalid or missing the token.</p>
            </div>
        )
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--background)'
        }}>
            <form onSubmit={handleSubmit} style={{
                width: '100%',
                maxWidth: '400px',
                padding: '32px',
                backgroundColor: 'var(--card-bg)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>Zevian</div>
                    <h1 style={{ marginTop: '16px', fontSize: '24px', fontWeight: 600 }}>Accept Invitation</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                        Set up your profile and password to join your team.
                    </p>
                </div>

                {error && (
                    <div style={{ color: 'var(--colors-danger)', fontSize: '14px', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 500 }}>Full Name</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                        style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 500 }}>Job Title (Optional)</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 500 }}>Department (Optional)</label>
                    <input
                        type="text"
                        value={formData.dept}
                        onChange={e => setFormData({ ...formData, dept: e.target.value })}
                        style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 500 }}>New Password</label>
                    <input
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
                        style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent' }}
                    />
                </div>

                <Button variant="primary" type="submit" loading={loading} style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}>
                    Join Organization
                </Button>
            </form>
        </div>
    )
}
