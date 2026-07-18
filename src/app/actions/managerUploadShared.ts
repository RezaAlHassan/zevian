/**
 * Shared types + constants for the Manager Data Upload feature.
 *
 * Kept out of managerUploadActions.ts because Next.js `'use server'` files are
 * only allowed to export async functions — re-exporting these from the action
 * file would break the build with "Only async functions are allowed to be
 * exported in a 'use server' file."
 */

export const SKIP_COLUMN = '__skip__'

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers (no server-only deps) — kept here so they can be unit tested.
// The action file (`'use server'`) can't export non-async functions, and
// importing it from a test would pull in Supabase/Gemini.
// ─────────────────────────────────────────────────────────────────────────────

export function kindFromFrequency(freq: string | null | undefined): 'tangible' | 'intangible' {
    return (freq || '').toLowerCase() === 'monthly' ? 'intangible' : 'tangible'
}

/**
 * Human-readable cadence label for row messages ("weekly" / "bi-weekly" /
 * "monthly"), or null if the goal's frequency isn't one we can name confidently.
 */
export function frequencyLabel(freq: string | null | undefined): string | null {
    const f = (freq || '').toLowerCase().replace(/[\s_]/g, '-')
    if (f === 'weekly') return 'weekly'
    if (f === 'biweekly' || f === 'bi-weekly') return 'bi-weekly'
    if (f === 'monthly') return 'monthly'
    return null
}

/**
 * Parse the period column. Accepts:
 *   - YYYY-MM-DD
 *   - DD/MM/YYYY or MM/DD/YYYY (assume ISO if dashed)
 *   - A range like "YYYY-MM-DD to YYYY-MM-DD" or "YYYY-MM-DD - YYYY-MM-DD" — use the START
 * Returns a Date at UTC midnight, or null if unparseable.
 */
export function parsePeriodDate(raw: string): Date | null {
    if (!raw) return null
    const trimmed = raw.trim()
    if (!trimmed) return null

    const firstChunk = trimmed.split(/\s+(?:to|-|–|—)\s+/i)[0].trim()

    // ISO
    const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(firstChunk)
    if (iso) {
        const d = new Date(`${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}T00:00:00Z`)
        return isNaN(d.getTime()) ? null : d
    }

    // Slash format: prefer DD/MM/YYYY if first chunk > 12
    const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(firstChunk)
    if (slash) {
        const a = parseInt(slash[1], 10)
        const b = parseInt(slash[2], 10)
        const y = parseInt(slash[3], 10)
        const day = a > 12 ? a : b
        const month = a > 12 ? b : a
        const d = new Date(Date.UTC(y, month - 1, day))
        return isNaN(d.getTime()) ? null : d
    }

    const native = new Date(firstChunk)
    return isNaN(native.getTime()) ? null : native
}

/**
 * Human-readable label for a reporting-period window, in UTC.
 *   • same month  → "Jul 6 – 10"
 *   • spans months → "Jun 29 – Jul 3"
 */
export function formatPeriodWindow(startIso: string, endIso: string): string {
    const s = new Date(startIso)
    const e = new Date(endIso)
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return ''
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    const sameMonth = s.getUTCFullYear() === e.getUTCFullYear() && s.getUTCMonth() === e.getUTCMonth()
    return sameMonth ? `${fmt(s)} – ${e.getUTCDate()}` : `${fmt(s)} – ${fmt(e)}`
}

export interface UploadGoalSummary {
    id: string
    name: string
    projectName: string
    reportFrequency: string                    // weekly | bi-weekly | monthly | daily
    kind: 'tangible' | 'intangible'            // weekly/bi-weekly = tangible, monthly = intangible
    criteria: { id: string; name: string; weight: number }[]
    savedMapping: SavedMapping | null
}

export interface SavedMapping {
    columns: { header: string; criterion: string }[]   // criterion may be SKIP_COLUMN
    savedAt: string
}

export interface MappingSuggestion {
    header: string
    suggestedCriterion: string                          // criterion name or SKIP_COLUMN
}

/** An employee who still owes a report for a given period window. */
export interface OpenPeriodEmployee {
    id: string
    name: string
    avatarUrl: string | null
}

/** An open reporting-period window the manager can upload numbers into. */
export interface UploadPeriod {
    key: string                 // window identifier = period_start's UTC date (YYYY-MM-DD)
    periodStart: string         // ISO
    periodEnd: string           // ISO
    label: string               // human-readable, e.g. "Jul 6 – 10"
    openCount: number           // employees in this window with no report yet
    totalCount: number          // employees with a period in this window
    openEmployees: OpenPeriodEmployee[]  // the specific employees still owing a report, for display
}

export interface RowResult {
    rowIndex: number                                    // 1-based, matching CSV row number after header
    agentIdentifier: string                             // raw value from the CSV's first column
    assignedName?: string                               // the employee the row was actually assigned to (matched or manually overridden)
    periodInput: string                                 // the selected period's label (same for every row)
    status: 'created' | 'skipped'
    reportId?: string
    score?: number
    reason?: string                                     // why skipped
}

export interface ProcessUploadResult {
    success: boolean
    created: number
    skipped: number
    rows: RowResult[]
    /** Human-readable label of the reporting period this upload targeted. */
    processedPeriodLabel: string | null
    error?: string
}

/** A roster member eligible to receive a row via manual override — i.e. has an open, unreported period in the selected window. */
export interface UploadRosterEmployee {
    id: string
    name: string
    email: string
}

/**
 * Per-row preflight result, computed right after the CSV is parsed and before
 * any row is scored — lets the manager fix identifier mismatches before
 * committing the batch instead of discovering them in the results screen.
 */
export interface RowMatchPreview {
    rowIndex: number                 // 0-based index into the CSV data rows array (same key used for identifierOverrides)
    displayRow: number                // 1-based row number as it appears in the CSV (header = row 1)
    agentIdentifier: string
    status: 'ok' | 'no-period' | 'already-reported' | 'unmatched'
    matchedEmployeeId: string | null
    matchedEmployeeName: string | null
    reason: string | null
}
