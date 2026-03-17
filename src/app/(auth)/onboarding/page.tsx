import { OnboardingView } from '@/components/organisms/OnboardingView'
import { ensureProfileExists } from '@/app/actions/onboardingActions'
import { redirect } from 'next/navigation'

export default async function OnboardingPage() {
    // 1. Ensure profile exists before even showing the page
    // This is the "Self-Healing" step that fixes the missing profile loop
    let needsDashboardRedirect = false;

    try {
        const { onboardingCompleted } = await ensureProfileExists()

        // If they already finished onboarding, send them to dashboard
        if (onboardingCompleted) {
            needsDashboardRedirect = true;
        }
    } catch (error) {
        console.error('Onboarding initialization failed:', error)
        // If we can't even ensure a profile, send back to login
        redirect('/login?error=profile_init_failed')
    }

    if (needsDashboardRedirect) {
        redirect('/dashboard')
    }

    return <OnboardingView />
}
