import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute = ['/login', '/signup', '/verify-email'].some(p => pathname.startsWith(p))
  const isCallbackRoute = pathname.startsWith('/auth')
  const isPublicAsset = pathname.includes('.')

  // HELPER: Essential for auth stability - copies ALL cookies to the redirect
  // This ensures that if Supabase set cookies during getUser(), they survive the redirect.
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
