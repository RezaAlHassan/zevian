import { cache } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { dbEmployeeToEmployee, employeeService } from '@/../databaseService2'
import { getCachedOrgRaw } from '@/lib/cache/orgCache'
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
 *
 * Auth validation now uses `getClaims()` instead of `getUser()`. When the project
 * uses asymmetric JWT signing keys (ECC/RSA), `getClaims()` verifies the access
 * token's signature LOCALLY against a cached JWKS — no network round-trip, so the
 * ~0.4s Auth-server hop disappears from every navigation. If the project still
 * uses the legacy symmetric (HS256) secret, `getClaims()` transparently falls
 * back to a `getUser()` network call, so adopting it is safe before flipping the
 * Supabase dashboard setting (Project Settings → JWT Keys → migrate to ECC).
 */

/**
 * Minimal authenticated-user shape derived from the access-token claims.
 * `sub` is the auth user id; `email`/metadata mirror the fields call sites read
 * off the old `User` object.
 */
export interface AuthUser {
  id: string
  email?: string
  user_metadata: Record<string, any>
  app_metadata: Record<string, any>
}

/**
 * Authenticated user for this request, resolved from locally-verified JWT claims.
 * Runs at most once per request (memoized). Returns null when unauthenticated.
 */
export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = createServerClient()
  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims as any
  if (error || !claims?.sub) return null
  return {
    id: claims.sub,
    email: claims.email,
    user_metadata: claims.user_metadata ?? {},
    app_metadata: claims.app_metadata ?? {},
  }
})

/** Validated auth user — runs auth validation at most once per request. */
export const getCachedUser = cache(async () => {
  return getAuthUser()
})

/**
 * The caller's employee profile (with permissions), resolved once per request.
 * Pages and layouts that previously did `auth.getUser()` + `getByAuthId()` back
 * to back can share this single cached lookup instead of repeating both hops.
 * For the manager `(app)` section prefer `getSessionContext()`, which also folds
 * in the organization + custom metrics.
 */
export const getCachedEmployee = cache(async (): Promise<Employee | null> => {
  const user = await getAuthUser()
  if (!user) return null
  return employeeService.getByAuthId(user.id)
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
  // Employee + permissions stays a per-request, user-scoped read (RLS-validated,
  // identity-specific). The organization + custom metrics are org-scoped reference
  // data, so they come from the cross-request cache instead of a joined embed —
  // a cache hit removes that part of the round-trip entirely.
  const { data, error } = await supabase
    .from('employees')
    .select('*, employee_permissions(*)')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (error || !data) return null

  const employee = dbEmployeeToEmployee(data)
  const orgRaw = employee.organizationId ? await getCachedOrgRaw(employee.organizationId) : null

  return {
    userId: user.id,
    employee,
    organization: orgRaw ? mapOrganization(orgRaw) : (null as any),
  }
})
