'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Browser-side Supabase client (singleton).
 * Use in Client Components for realtime, auth state, and client mutations.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
