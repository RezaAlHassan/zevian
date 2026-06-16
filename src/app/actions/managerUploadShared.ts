/**
 * Shared types + constants for the Manager Data Upload feature.
 *
 * Kept out of managerUploadActions.ts because Next.js `'use server'` files are
 * only allowed to export async functions — re-exporting these from the action
 * file would break the build with "Only async functions are allowed to be
 * exported in a 'use server' file."
 */

export const SKIP_COLUMN = '__skip__'

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

export interface RowResult {
    rowIndex: number                                    // 1-based, matching CSV row number after header
    agentIdentifier: string
    periodInput: string
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
    /** Number of distinct period dates detected in the CSV. */
    periodsDetected: number
    /** Date-only label (YYYY-MM-DD) of the single period this upload processed, or null if no parseable dates were found. */
    processedPeriodLabel: string | null
    error?: string
}
