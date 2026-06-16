import { cache } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { dbEmployeeToEmployee } from '@/../databaseService2'
import type { Employee, Organization, CustomMetric } from '@/types'

/**
 * Request-scoped session helpers.
 *
 * Why this exists: a single page render fans out into the layout AND one or more
 * server actions, and each one independently called `auth.getUser()` (a ~0.4s
 * round-trip to the Supabase Auth server) plus a fresh employee/org/custom-metric
 * lookup. That's several redundant sequential round-trips per navigation.
 *
 * `cache()` memoizes per request: the auth validation and the identity query run
 * once and are shared by the layout and every action in the same render. The
 * identity query also folds employee + permissions + organization + custom
 * metrics into ONE round-trip via nested embeds (was 3 sequential queries).
 */

/** Validated auth user — runs `auth.getUser()` at most once per request. */
export const getCachedUser = cache(async () => {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export interface SessionContext {
  userId: string
  employee: Employee
  /** Full organization with active custom metrics already attached. */
  organization: Organization
}

function mapOrganization(org: any): Organization {
  const activeMetrics: CustomMetric[] = (org.organization_custom_metrics || [])
    .filter((m: any) => m.is_active)
    .map((m: any) => ({
      id: m.id,
      organizationId: m.organization_id,
      name: m.name,
      description: m.description,
      isActive: m.is_active,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }))

  return {
    id: org.id,
    name: org.name,
    planTier: org.plan_tier,
    selectedMetrics: org.selected_metrics,
    goalWeight: org.goal_weight,
    workingDays: org.working_days ?? [1, 2, 3, 4, 5],
    aiConfig: org.ai_config,
    createdAt: org.created_at,
    customMetrics: activeMetrics,
  }
}

/**
 * The caller's identity for this request: validated user + employee profile +
 * organization (with active custom metrics). Fetched in one joined round-trip
 * and memoized, so the layout and all actions share a single resolution.
 */
export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  const user = await getCachedUser()
  if (!user) return null

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('employees')
    .select('*, employee_permissions(*), organizations(*, organization_custom_metrics(*))')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (error || !data) return null

  const orgRaw = Array.isArray((data as any).organizations)
    ? (data as any).organizations[0]
    : (data as any).organizations

  return {
    userId: user.id,
    employee: dbEmployeeToEmployee(data),
    organization: orgRaw ? mapOrganization(orgRaw) : (null as any),
  }
})
