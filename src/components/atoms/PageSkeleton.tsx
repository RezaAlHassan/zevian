/**
 * Lightweight route-level loading skeletons.
 *
 * Rendered as the Suspense fallback that Next.js mounts from each route's
 * `loading.tsx` while the async page component resolves its data. This lets the
 * app shell (nav + chrome from the layout) paint immediately on navigation while
 * the page's Supabase queries stream in — the page never blocks on a blank frame.
 */

const BLOCK = '#1e2330'

function Bar({ width = '100%', height = 16, radius = 8 }: { width?: string | number; height?: number; radius?: number }) {
  return <div style={{ width, height, background: BLOCK, borderRadius: radius }} />
}

export type PageSkeletonVariant = 'detail' | 'cards' | 'list' | 'grid'

export function PageSkeleton({ variant = 'list' }: { variant?: PageSkeletonVariant }) {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', opacity: 0.6 }}>
      <Bar width="220px" height={40} />

      {variant === 'detail' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[0, 1, 2, 3].map(i => <Bar key={i} height={120} radius={16} />)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <Bar height={340} radius={16} />
            <Bar height={340} radius={16} />
          </div>
        </>
      )}

      {variant === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[0, 1, 2, 3].map(i => <Bar key={i} height={120} radius={16} />)}
        </div>
      )}

      {variant === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {[0, 1, 2, 3, 4, 5].map(i => <Bar key={i} height={180} radius={16} />)}
        </div>
      )}

      {variant === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[0, 1, 2, 3, 4, 5].map(i => <Bar key={i} height={64} radius={12} />)}
        </div>
      )}
    </div>
  )
}
