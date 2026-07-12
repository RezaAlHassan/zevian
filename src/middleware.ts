import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // getAll/setAll (rather than the removed per-cookie get/set/remove API) writes the whole
  // auth cookie set atomically. The old API could persist a partially-updated session
  // (new access token + stale refresh token) when a refresh raced a navigation, which
  // surfaced as users being randomly logged out mid-click.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Use getSession() (local cookie read, refreshes when expired) rather than getUser()
  // (a network round-trip to the Auth server on every request). This middleware only
  // decides redirects — actual data access in Server Components/Actions still validates
  // the JWT before reading anything.
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  const { pathname } = request.nextUrl
  const isAuthRoute = ['/login', '/signup', '/verify-email'].some(p => pathname.startsWith(p))
  const isCallbackRoute = pathname.startsWith('/auth')
  const isPublicAsset = pathname.includes('.')

  // HELPER: Essential for auth stability - copies ALL cookies to the redirect
  // This ensures that if Supabase set cookies during the session read, they survive the redirect.
  const createRedirect = (path: string) => {
    const redirectUrl = new URL(path, request.url)
    const redirectResponse = NextResponse.redirect(redirectUrl)

    // Copy cookies from our tracking 'response' object to the redirect
    response.cookies.getAll().forEach(c => {
      redirectResponse.cookies.set(c.name, c.value, c)
    })

    return redirectResponse
  }

  // Simple Redirect Logic
  if (!user && !isAuthRoute && !isCallbackRoute && !isPublicAsset && pathname !== '/') {
    // If it's an API route, return 401 JSON instead of redirecting (which returns HTML)
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return createRedirect('/login')
  }

  if (user && isAuthRoute && pathname !== '/onboarding') {
    return createRedirect('/onboarding')
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
