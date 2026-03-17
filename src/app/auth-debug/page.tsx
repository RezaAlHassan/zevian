import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import AuthClientDebug from '@/app/auth-debug/AuthClientDebug'

export default async function AuthDebugPage() {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
            },
        }
    )

    const { data: { session } } = await supabase.auth.getSession()
    const { data: { user } } = await supabase.auth.getUser()
    const allCookies = cookieStore.getAll()

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
            <h1>Auth Debugger</h1>

            <section style={{ marginBottom: '40px' }}>
                <h2>Server Side</h2>
                <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
                    <p><strong>User:</strong> {user ? user.email : 'NULL'}</p>
                    <p><strong>Session:</strong> {session ? 'EXIST' : 'NULL'}</p>
                    <h3>Cookies found:</h3>
                    <ul>
                        {allCookies.map(c => (
                            <li key={c.name}>{c.name}: {c.value.substring(0, 20)}...</li>
                        ))}
                    </ul>
                </div>
            </section>

            <section>
                <h2>Client Side</h2>
                <AuthClientDebug />
            </section>
        </div>
    )
}
