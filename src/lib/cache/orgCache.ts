import { unstable_cache, revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Cross-request cache for organization reference data (org config + active custom
 * metrics). This data is identical for every member of an org and changes rarely,
 * so caching it across requests removes a Supabase round-trip from nearly every
 * authenticated navigation (it is read on every page via `getSessionContext`).
 *
 * Why the admin client: `unstable_cache` runs its callback OUTSIDE the request
 * scope, where `cookies()` is unavailable — so the request-scoped client can't be
 * used here. We only ever look up the *caller's own* `organizationId` (taken from
 * their authenticated employee row), so reading it with the service-role client
 * carries no cross-tenant exposure.
 *
 * Freshness: cached entries are tagged `org:<id>` and revalidated on every org /
 * custom-metric mutation via `revalidateOrgCache`, with a 5-minute safety TTL.
 */

const orgTag = (orgId: string) => `org:${orgId}`

async function fetchOrgRaw(orgId: string): Promise<any | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('organizations')
    .select('*, organization_custom_metrics(*)')
    .eq('id', orgId)
    .maybeSingle()
  if (error || !data) return null
  return data
}

/** Org row (with custom metrics embed) for the given id, cached across requests. */
export function getCachedOrgRaw(orgId: string): Promise<any | null> {
  return unstable_cache(
    () => fetchOrgRaw(orgId),
    ['org-raw', orgId],
    { tags: [orgTag(orgId)], revalidate: 300 }
  )()
}

/** Invalidate the cached org reference data after a mutation. */
export function revalidateOrgCache(orgId: string) {
  revalidateTag(orgTag(orgId))
}
