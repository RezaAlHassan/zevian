import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as any
    // Only honor an explicit `next`. When absent, we resolve the destination
    // from the user's onboarding state *after* auth (see resolveDestination),
    // so existing accounts aren't dumped back into the onboarding wizard.
    const explicitNext = searchParams.get('next')
    const next = explicitNext ?? '/onboarding'

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
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        try {
                            cookieStore.set(name, value, options)
                        } catch {
                            // `cookies().set()` can throw in Server Components
                        }
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // After successful auth, if no explicit `next` was requested, route the user
    // based on whether they've already onboarded — otherwise existing accounts get
    // sent back through the wizard. Returns a redirect that carries the auth cookies
    // Supabase just wrote onto `response`.
    const finalize = async () => {
        if (explicitNext) return response

        const { data: { user } } = await supabase.auth.getUser()
        let dest = '/onboarding'
        if (user) {
            const { data: employee } = await supabase
                .from('employees')
                .select('role, onboarding_completed')
                .eq('auth_user_id', user.id)
                .maybeSingle()
            if (employee && (employee as any).onboarding_completed) {
                dest = (employee as any).role === 'employee' ? '/my-dashboard' : '/dashboard'
            }
        }

        const finalResponse = NextResponse.redirect(new URL(dest, origin))
        response.cookies.getAll().forEach(c => finalResponse.cookies.set(c.name, c.value, c))
        return finalResponse
    }

    // Handle PKCE code exchange
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
            console.error('Code exchange failed:', error.message)
            return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
        }
        console.log('--- AUTH SUCCESS: Code exchanged ---')
        return finalize()
    }

    // Handle OTP/magic link
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type })
        if (error) {
            console.error('OTP verification failed:', error.message)
            return NextResponse.redirect(`${origin}/login?error=otp_failed`)
        }
        console.log('--- AUTH SUCCESS: OTP verified ---')
        return finalize()
    }

    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
