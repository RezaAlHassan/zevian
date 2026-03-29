import { createServerClient } from '@/lib/supabase/server'
import { OnboardingView } from '@/components/organisms/OnboardingView'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return <OnboardingView />
}
