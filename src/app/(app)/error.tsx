'use client'

import { useEffect } from 'react'
import { colors, radius } from '@/design-system'
import { Button } from '@/components/atoms'

// Route-segment error boundary for the manager app. Catches errors thrown while
// loading a page (transient network / Supabase failures included) and offers a
// retry instead of a dead crash screen or a silently zeroed page.
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[AppError]', error)
  }, [error])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', gap: '14px', padding: '24px', textAlign: 'center',
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: radius.md, background: colors.surface2,
        border: `1px solid ${colors.borderStrong}`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '20px',
      }}>
        ⚠️
      </div>
      <div style={{ fontSize: '16px', fontWeight: 700, color: colors.text }}>
        Something went wrong loading this page
      </div>
      <div style={{ fontSize: '13px', color: colors.text3, maxWidth: '420px', lineHeight: 1.5 }}>
        This is usually a temporary connection issue. Your data is safe — try again.
      </div>
      <Button variant="primary" size="sm" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  )
}
