'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthClientDebug() {
    const [user, setUser] = useState<any>(null)
    const [session, setSession] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const supabase = createClient()
        async function check() {
            const { data: { session } } = await supabase.auth.getSession()
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            setSession(session)
            setLoading(false)
        }
        check()
    }, [])

    if (loading) return <div>Loading client auth...</div>

    return (
        <div style={{ background: '#eef2ff', padding: '20px', borderRadius: '8px' }}>
            <p><strong>User:</strong> {user ? user.email : 'NULL'}</p>
            <p><strong>Session:</strong> {session ? 'EXIST' : 'NULL'}</p>
            <h3>LocalStorage:</h3>
            <pre style={{ fontSize: '12px' }}>
                {typeof window !== 'undefined' ? JSON.stringify(Object.keys(localStorage), null, 2) : 'N/A'}
            </pre>
        </div>
    )
}
