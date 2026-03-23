'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { applyGlobalFrequencyUpdate } from '@/lib/reportingPeriods'

export async function getManagerSettingsAction() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('manager_settings')
    .select('*')
    .eq('manager_id', user.id)
    .maybeSingle()

  if (error) return { error: error.message }
  return { data }
}

export async function updateManagerSettingsAction(updates: {
  allow_late_submissions?: boolean;
  backdate_limit_days?: number | null;
  grace_period_days?: number;
  global_frequency?: boolean;
}) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('manager_settings')
    .upsert({
      manager_id: user.id,
      ...updates
    })

  if (error) return { error: error.message }
  
  // TRIGGER A: Frequency or settings changed on manager_settings
  try {
    await applyGlobalFrequencyUpdate(user.id)
  } catch (err) {
    console.error('Error applying global frequency update:', err)
  }
  
  revalidatePath('/organization')
  revalidatePath('/dashboard')
  return { success: true }
}
