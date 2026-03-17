import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as any
    const next = searchParams.get('next') ?? '/onboarding'

    console.log('--- AUTH CALLBACK ---', {
        hasCode: !!code,
        hasTokenHash: !!token_hash,
        type,
    })

    if (!code && !token_hash) {
        console.error('CRITICAL: No code or token_hash in callback URL')
        return NextResponse.redirect(`${origin}/login?error=missing_params`)
    }

    const cookieStore = cookies()
    const redirectTo = new URL(next, origin)

    // We build the response FIRST, then create the supabase client
    // that writes cookies to BOTH the cookieStore AND the response.
    const response = NextResponse.redirect(redirectTo)

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options })
                    } catch {
                        // `cookies().set()` can throw in Server Components
                    }
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options })
                    } catch {
                        // `cookies().set()` can throw in Server Components
                    }
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    // Handle PKCE code exchange
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
            console.error('Code exchange failed:', error.message)
            return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
        }
        console.log('--- AUTH SUCCESS: Code exchanged, redirecting to', next, '---')
        return response
    }

    // Handle OTP/magic link
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type })
        if (error) {
            console.error('OTP verification failed:', error.message)
            return NextResponse.redirect(`${origin}/login?error=otp_failed`)
        }
        console.log('--- AUTH SUCCESS: OTP verified, redirecting to', next, '---')
        return response
    }

    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
