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

    // Guard: users who have already onboarded should never see the wizard again.
    // Without this, any auth entry point that lands here (auth callback default,
    // middleware bouncing logged-in users off /login etc.) re-shows onboarding
    // to existing accounts — and finishing it would duplicate their org/project.
    const { data: employee } = await supabase
        .from('employees')
        .select('role, onboarding_completed')
        .eq('auth_user_id', user.id)
        .maybeSingle()

    if (employee && (employee as any).onboarding_completed) {
        redirect((employee as any).role === 'employee' ? '/my-dashboard' : '/dashboard')
    }

    return <OnboardingView />
}
