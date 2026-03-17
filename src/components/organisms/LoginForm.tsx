'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { colors, typography, radius, shadows, animation } from '@/design-system'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (user) {
      // Fetch user role to determine redirect path
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('role')
        .eq('auth_user_id', user.id)
        .single()

      if (employeeError) {
        console.error('Error fetching employee role:', employeeError)
        // Fallback to /dashboard if role cannot be determined
        router.push('/dashboard')
      } else {
        const role = employeeData?.role
        if (role === 'employee') {
          router.push('/my-dashboard')
        } else {
          router.push('/dashboard')
        }
      }
      
      router.refresh()
    }
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '400px',
      padding: '0 16px',
      animation: 'fadeUp 0.4s ease both',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px', justifyContent: 'center' }}>
        <div style={{ width: '36px', height: '36px', background: colors.accent, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: typography.fonts.display, fontWeight: 800, fontSize: '16px', color: '#fff', boxShadow: shadows.logoGlow }}>Z</div>
        <span style={{ fontFamily: typography.fonts.display, fontWeight: 700, fontSize: '22px', letterSpacing: '-0.3px' }}>Zevian</span>
      </div>

      <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: radius['2xl'], padding: '32px' }}>
        <h1 style={{ fontFamily: typography.fonts.display, fontSize: '20px', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.3px' }}>
          Welcome back
        </h1>
        <p style={{ fontSize: '13.5px', color: colors.text3, marginBottom: '28px' }}>
          Sign in to your workspace
        </p>

        <form onSubmit={handleLogin}>
          {/* Email */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: colors.text2, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Email
            </label>
            <input
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{ width: '100%', padding: '10px 12px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: radius.md, fontSize: '13.5px', color: colors.text, outline: 'none' }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: colors.text2, display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password
            </label>
            <input
              type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '10px 12px', background: colors.surface2, border: `1px solid ${colors.border}`, borderRadius: radius.md, fontSize: '13.5px', color: colors.text, outline: 'none' }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginBottom: '16px', padding: '10px 12px', background: colors.dangerGlow, border: `1px solid rgba(240,68,56,0.2)`, borderRadius: radius.md, fontSize: '13px', color: colors.danger }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{ width: '100%', padding: '11px', background: colors.accent, border: 'none', borderRadius: radius.md, fontSize: '13.5px', fontWeight: 700, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, transition: `all ${animation.fast}`, boxShadow: shadows.accentGlow, fontFamily: typography.fonts.body }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
