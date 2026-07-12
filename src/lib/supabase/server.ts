import { createServerClient as _createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Server-side Supabase client.
 * Use in Server Components, Route Handlers, and Server Actions.
 * Reads/writes auth cookies automatically via Next.js cookies().
 * Uses the getAll/setAll cookie API so the auth cookie set is always written
 * atomically — partial writes under the old per-cookie API could corrupt the
 * session and log users out.
 */
export function createServerClient() {
  const cookieStore = cookies()

  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // Called from a Server Component, where cookies are read-only.
            // Safe to ignore — the middleware refreshes sessions.
          }
        },
      },
    }
  )
}

/**
 * Admin client — uses the service role key.
 * ONLY use in API routes / Server Actions that need to bypass RLS.
 * NEVER import this in client components.
 */
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
