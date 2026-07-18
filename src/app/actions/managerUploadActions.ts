'use server'

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import {
    employeeService,
    goalService,
    organizationService,
} from '@/../databaseService2'
import { DEFAULT_ORG_METRICS } from '@/constants/metrics'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { revalidatePath } from 'next/cache'
import { withRetry } from '@/lib/ai/withRetry'
import {
    SKIP_COLUMN,
    kindFromFrequency,
    formatPeriodWindow,
    type UploadGoalSummary,
    type SavedMapping,
    type MappingSuggestion,
    type UploadPeriod,
    type OpenPeriodEmployee,
    type RowResult,
    type ProcessUploadResult,
    type RowMatchPreview,
    type UploadRosterEmployee,
} from './managerUploadShared'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Window identifier for a reporting period = its period_start UTC date. */
function periodWindowKey(periodStartIso: string): string {
    return new Date(periodStartIso).toISOString().slice(0, 10)
}

// Max Gemini scoring calls in flight at once during an upload. Sequential calls
// made a 12-row batch exceed the function timeout; capped concurrency keeps
// wall-time low without bursting past the model's rate limit.
const SCORE_CONCURRENCY = 5

/** Run `worker` over `items` with at most `limit` in flight at once. */
async function mapWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
    let cursor = 0
    const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (cursor < items.length) {
            const idx = cursor++
            await worker(items[idx])
        }
    })
    await Promise.all(runners)
}

function readSavedMapping(aiConfig: any, goalId: string): SavedMapping | null {
    const mappings = aiConfig?.uploadMappings
    if (!mappings || typeof mappings !== 'object') return null
    const entry = mappings[goalId]
    if (!entry || !Array.isArray(entry.columns)) return null
    return entry as SavedMapping
}

async function writeSavedMapping(orgId: string, goalId: string, mapping: SavedMapping) {
    const org = await organizationService.getById(orgId)
    const existing = (org.aiConfig as any) || {}
    const existingMappings = existing.uploadMappings || {}
    const nextAiConfig = {
        ...existing,
        uploadMappings: {
            ...existingMappings,
            [goalId]: mapping,
        },
    }
    await organizationService.update(orgId, { aiConfig: nextAiConfig })
}

/**
 * Normalize an agent identifier into a stable alias key: emails lowercased,
 * names lowercased with whitespace collapsed. Mirrors the matching in
 * resolveIdentifier so a saved alias keys the same way its identifier resolves.
 */
function normalizeIdentifier(raw: string): string {
    const trimmed = (raw || '').trim()
    if (!trimmed) return ''
    if (trimmed.includes('@')) return trimmed.toLowerCase()
    return trimmed.toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Saved identifier→employee aliases are org-wide (an agent's spreadsheet name
 * maps to the same person regardless of goal), so unlike column mappings they
 * live under a single aiConfig.uploadAliases map keyed by normalized identifier.
 */
function readSavedAliases(aiConfig: any): Record<string, string> {
    const aliases = aiConfig?.uploadAliases
    return aliases && typeof aliases === 'object' ? aliases : {}
}

async function writeSavedAliases(orgId: string, newAliases: Record<string, string>) {
    if (Object.keys(newAliases).length === 0) return
    const org = await organizationService.getById(orgId)
    const existing = (org.aiConfig as any) || {}
    const nextAiConfig = {
        ...existing,
        uploadAliases: { ...(existing.uploadAliases || {}), ...newAliases },
    }
    await organizationService.update(orgId, { aiConfig: nextAiConfig })
}

/**
 * Match an identifier from the agent column against an already-loaded employee
 * list. Tries email then name. Match is case-insensitive on email and on
 * normalized name (collapsed whitespace) — exact match only, no fuzzy logic.
 * Pure so it can be reused for both the preflight preview and actual processing
 * without a DB round-trip per row.
 */
function resolveIdentifier(
    employees: { id: string; name: string; email: string }[],
    identifier: string,
    aliasMap?: Record<string, string>,
): { id: string; name: string; email: string } | null {
    const trimmed = (identifier || '').trim()
    if (!trimmed) return null

    // 1. Exact match (email, then normalized name) always wins over a saved alias.
    if (trimmed.includes('@')) {
        const lower = trimmed.toLowerCase()
        const byEmail = employees.find((e) => (e.email || '').toLowerCase() === lower)
        if (byEmail) return { id: byEmail.id, name: byEmail.name, email: byEmail.email }
    } else {
        const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
        const target = normalize(trimmed)
        const byName = employees.find((e) => normalize(e.name || '') === target)
        if (byName) return { id: byName.id, name: byName.name, email: byName.email }
    }

    // 2. Fall back to a previously saved manual resolution for this identifier.
    if (aliasMap) {
        const aliasId = aliasMap[normalizeIdentifier(trimmed)]
        if (aliasId) {
            const byAlias = employees.find((e) => e.id === aliasId)
            if (byAlias) return { id: byAlias.id, name: byAlias.name, email: byAlias.email }
        }
    }

    return null
}

function buildReportText(
    headers: string[],
    row: string[],
    mapping: { header: string; criterion: string }[],
): string {
    const pairs: string[] = []
    // Column 0 is the agent identifier; columns 1..N are criteria data.
    for (let i = 1; i < headers.length; i++) {
        const header = headers[i]
        const entry = mapping.find(m => m.header === header)
        if (!entry || entry.criterion === SKIP_COLUMN) continue
        const value = (row[i] ?? '').trim()
        if (!value) continue
        pairs.push(`${entry.criterion}: ${value}`)
    }
    return `[Manager upload]\n${pairs.join(', ')}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth + manager loader
// ─────────────────────────────────────────────────────────────────────────────

async function requireManager() {
    const supabase = createServerClient()

    // Try the network-validating getUser() first. If that fails (e.g. the access
    // token expired between page load and the action call and the silent refresh
    // couldn't write back new cookies), fall back to getSession() which reads the
    // JWT from the HttpOnly cookie — safe because middleware validates every request.
    let authUserId: string | null = null
    const user = await getAuthUser()
    if (user) {
        authUserId = user.id
    } else {
        const { data: { session } } = await supabase.auth.getSession()
        authUserId = session?.user?.id ?? null
    }

    if (!authUserId) return { error: 'Not authenticated' as const }

    const employee = await employeeService.getByAuthId(authUserId)
    if (!employee) return { error: 'Employee record not found' as const }
    if (employee.role !== 'manager' && employee.role !== 'admin' && !employee.isAccountOwner) {
        return { error: 'Unauthorized: manager role required' as const }
    }
    if (!employee.organizationId) return { error: 'Employee organization not found' as const }

    return { employee }
}

// ─────────────────────────────────────────────────────────────────────────────
// Action: list goals this manager can upload data for
// ─────────────────────────────────────────────────────────────────────────────

export async function getUploadGoalsAction(): Promise<
    { success: true; goals: UploadGoalSummary[] } | { error: string }
> {
    const auth = await requireManager()
    if ('error' in auth) return { error: auth.error as string }
    const { employee } = auth

    try {
        const orgGoals = await goalService.getAll()
        const org = await organizationService.getById(employee.organizationId!)
        const aiConfig = (org.aiConfig as any) || {}

        const visible = orgGoals.filter((g: any) => {
            // Limit to goals in the manager's org. goalService.getAll has no org filter,
            // so we infer org via the goal's project; managers see all goals in their org.
            const projectOrg = g.project?.organizationId
            return projectOrg ? projectOrg === employee.organizationId : true
        })

        const goals: UploadGoalSummary[] = visible
            .filter((g: any) => g.status === 'active')
            .map((g: any) => {
                const freq = g.project?.reportFrequency || g.project?.report_frequency || 'weekly'
                return {
                    id: g.id,
                    name: g.name,
                    projectName: g.project?.name || 'Unknown project',
                    reportFrequency: freq,
                    kind: kindFromFrequency(freq),
                    criteria: (g.criteria || []).map((c: any) => ({
                        id: c.id, name: c.name, weight: c.weight,
                    })),
                    savedMapping: readSavedMapping(aiConfig, g.id),
                }
            })

        return { success: true, goals }
    } catch (err: any) {
        console.error('getUploadGoalsAction Error:', err)
        return { error: err?.message || 'Failed to load goals' }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Action: ask Gemini to suggest a CSV-header → criterion mapping
// ─────────────────────────────────────────────────────────────────────────────

export async function suggestMappingAction(input: {
    goalId: string
    headers: string[]
}): Promise<{ success: true; suggestions: MappingSuggestion[] } | { error: string }> {
    const auth = await requireManager()
    if ('error' in auth) return { error: auth.error as string }

    try {
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) return { error: 'AI is not configured (missing GEMINI_API_KEY)' }

        const goal = await goalService.getById(input.goalId)
        if (!goal) return { error: 'Goal not found' }

        // Reserved column: index 0 (agent identifier). Map the rest.
        const dataHeaders = input.headers.slice(1)
        const criteriaNames = (goal.criteria || []).map((c: any) => c.name)

        if (dataHeaders.length === 0) {
            return { success: true, suggestions: [] }
        }

        const prompt = `You are mapping spreadsheet columns to evaluation criteria for a goal.

GOAL: ${goal.name}

AVAILABLE CRITERIA (use these exact names):
${criteriaNames.map(n => `- ${n}`).join('\n')}

CSV COLUMNS TO MAP:
${dataHeaders.map((h, i) => `${i + 1}. ${h}`).join('\n')}

For each CSV column, choose the single best-matching criterion from the list above, or "${SKIP_COLUMN}" if no criterion is a good fit. Do not invent new criterion names. Match on meaning, not just exact text — e.g. "Calls made" maps to a "Activity volume" criterion if that's what exists; "Conversion %" maps to a "Conversion rate" criterion.

Return ONLY a JSON array, one object per CSV column, in the same order:
[
  { "header": "<csv header>", "suggestedCriterion": "<criterion name or ${SKIP_COLUMN}>" }
]`

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const result = await withRetry(
            'suggest-upload-mapping',
            () => model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: 2048,
                    temperature: 0.1,
                    responseMimeType: 'application/json',
                },
            }),
        )

        const raw = result.response.text()
        let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
        const start = cleaned.indexOf('[')
        const end = cleaned.lastIndexOf(']')
        if (start === -1 || end === -1) return { error: 'AI returned an unparseable mapping' }
        cleaned = cleaned.slice(start, end + 1)

        let parsed: any
        try { parsed = JSON.parse(cleaned) }
        catch { return { error: 'AI returned malformed JSON for mapping' } }

        if (!Array.isArray(parsed)) return { error: 'AI did not return an array' }

        const validNames = new Set(criteriaNames)
        const suggestions: MappingSuggestion[] = dataHeaders.map((header, idx) => {
            const item = parsed[idx] || {}
            const candidate = typeof item.suggestedCriterion === 'string' ? item.suggestedCriterion : SKIP_COLUMN
            const final = candidate === SKIP_COLUMN || validNames.has(candidate) ? candidate : SKIP_COLUMN
            return { header, suggestedCriterion: final }
        })

        return { success: true, suggestions }
    } catch (err: any) {
        console.error('suggestMappingAction Error:', err)
        return { error: err?.message || 'Mapping suggestion failed' }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Action: list the open reporting-period windows a manager can upload into.
//
// Reporting periods are per (goal, employee). We group every non-void period on
// the goal into date windows (by period_start) and return only windows that
// still have at least one open slot (no report yet) — the only ones an upload
// can fill. Uses the admin client because RLS would hide other employees' rows.
// ─────────────────────────────────────────────────────────────────────────────

export async function getUploadPeriodsAction(
    goalId: string,
): Promise<{ success: true; periods: UploadPeriod[] } | { error: string }> {
    const auth = await requireManager()
    if ('error' in auth) return { error: auth.error as string }

    const { employee } = auth

    try {
        const admin = createAdminClient()
        const { data, error } = await (admin as any)
            .from('reporting_periods')
            .select('id, employee_id, period_start, period_end, status, report_id')
            .eq('goal_id', goalId)
            .neq('status', 'void')
        if (error) throw error

        // Look up names/avatars once so each window can list who still owes a report.
        const allEmployees = await employeeService.getByOrganizationId(employee.organizationId!)
        const employeeById = new Map<string, { name: string; avatarUrl: string | null }>(
            allEmployees.map((e: any) => [e.id, { name: e.name, avatarUrl: e.avatarUrl ?? null }]),
        )

        // You upload actuals for periods that have already started — never future
        // ones. A newly-assigned agent is scheduled 26 weeks forward; without this
        // the picker would list every one of those future windows as "open".
        const now = Date.now()

        type WindowAgg = { periodStart: string; periodEnd: string; open: number; total: number; openEmployees: OpenPeriodEmployee[] }
        const windows = new Map<string, WindowAgg>()
        for (const p of (data || [])) {
            // Skip windows that haven't begun yet, and excused periods (on-leave /
            // legitimately off) — neither is something to chase a report for.
            if (new Date(p.period_start).getTime() > now) continue
            if (p.status === 'excused') continue

            const key = periodWindowKey(p.period_start)
            const entry: WindowAgg = windows.get(key) || { periodStart: p.period_start, periodEnd: p.period_end, open: 0, total: 0, openEmployees: [] }
            entry.total++
            if (!p.report_id) {
                entry.open++
                const emp = employeeById.get(p.employee_id)
                entry.openEmployees.push({
                    id: p.employee_id,
                    name: emp?.name ?? 'Unknown',
                    avatarUrl: emp?.avatarUrl ?? null,
                })
            }
            windows.set(key, entry)
        }

        const periods: UploadPeriod[] = [...windows.entries()]
            .map(([key, v]) => ({
                key,
                periodStart: v.periodStart,
                periodEnd: v.periodEnd,
                label: formatPeriodWindow(v.periodStart, v.periodEnd),
                openCount: v.open,
                totalCount: v.total,
                openEmployees: v.openEmployees.sort((a, b) => a.name.localeCompare(b.name)),
            }))
            .filter(p => p.openCount > 0)
            .sort((a, b) => (a.key < b.key ? 1 : -1)) // newest window first

        return { success: true, periods }
    } catch (err: any) {
        console.error('getUploadPeriodsAction Error:', err)
        return { error: err?.message || 'Failed to load reporting periods' }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Action: preflight — resolve every row's agent identifier against the roster
// and the selected period's open slots *before* any row is scored, so mismatches
// surface immediately after upload instead of in the results screen after the
// batch has already run. Also returns the roster of still-open employees for
// this window, for the manual-resolve dropdown on unmatched rows.
// ─────────────────────────────────────────────────────────────────────────────

export async function getUploadMatchPreviewAction(input: {
    goalId: string
    periodKey: string
    headers: string[]
    rows: string[][]
}): Promise<{ success: true; matches: RowMatchPreview[]; roster: UploadRosterEmployee[] } | { error: string }> {
    const auth = await requireManager()
    if ('error' in auth) return { error: auth.error as string }
    const { employee } = auth

    try {
        const admin = createAdminClient()

        const allEmployees = await employeeService.getByOrganizationId(employee.organizationId!)
        const activeEmployees = allEmployees
            .filter((e: any) => e.isActive !== false)
            .map((e: any) => ({ id: e.id, name: e.name, email: e.email }))

        const org = await organizationService.getById(employee.organizationId!)
        const aliasMap = readSavedAliases((org.aiConfig as any) || {})

        const { data: periodRows } = await (admin as any)
            .from('reporting_periods')
            .select('id, employee_id, period_start, period_end, status, report_id')
            .eq('goal_id', input.goalId)
            .neq('status', 'void')

        const inWindow = (periodRows || []).filter((p: any) => periodWindowKey(p.period_start) === input.periodKey)
        // Excused periods (on-leave) aren't fillable — drop them so an excused
        // agent is neither offered as an override target nor silently backfilled.
        const byEmployee = new Map<string, any>(
            inWindow.filter((p: any) => p.status !== 'excused').map((p: any) => [p.employee_id, p]),
        )

        const roster: UploadRosterEmployee[] = activeEmployees.filter((e: UploadRosterEmployee) => {
            const period = byEmployee.get(e.id)
            return period && !period.report_id
        })

        const matches: RowMatchPreview[] = []
        for (let i = 0; i < input.rows.length; i++) {
            const row = input.rows[i]
            if (row.every(c => !c?.trim())) continue

            const agentIdentifier = (row[0] ?? '').trim()
            const displayRow = i + 2
            const matched = agentIdentifier ? resolveIdentifier(activeEmployees, agentIdentifier, aliasMap) : null

            if (!matched) {
                matches.push({
                    rowIndex: i, displayRow, agentIdentifier,
                    status: 'unmatched', matchedEmployeeId: null, matchedEmployeeName: null,
                    reason: agentIdentifier ? 'No matching employee' : 'Missing agent identifier',
                })
                continue
            }

            const period = byEmployee.get(matched.id)
            if (!period) {
                matches.push({
                    rowIndex: i, displayRow, agentIdentifier,
                    status: 'no-period', matchedEmployeeId: matched.id, matchedEmployeeName: matched.name,
                    reason: `${matched.name} isn't scheduled to report for this period on this goal`,
                })
                continue
            }
            if (period.report_id) {
                matches.push({
                    rowIndex: i, displayRow, agentIdentifier,
                    status: 'already-reported', matchedEmployeeId: matched.id, matchedEmployeeName: matched.name,
                    reason: 'Report already exists for this period',
                })
                continue
            }

            matches.push({
                rowIndex: i, displayRow, agentIdentifier,
                status: 'ok', matchedEmployeeId: matched.id, matchedEmployeeName: matched.name,
                reason: null,
            })
        }

        return { success: true, matches, roster }
    } catch (err: any) {
        console.error('getUploadMatchPreviewAction Error:', err)
        return { error: err?.message || 'Failed to check row matches' }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Action: process the CSV rows and create reports for the selected period
// ─────────────────────────────────────────────────────────────────────────────

export async function processUploadAction(input: {
    goalId: string
    periodKey: string                                   // selected window (period_start UTC date)
    headers: string[]
    rows: string[][]
    mapping: { header: string; criterion: string }[]   // for columns 1..N only
    identifierOverrides?: Record<number, string>       // rowIndex (0-based) -> employeeId, from the preflight match-check step
}): Promise<ProcessUploadResult> {
    const fail = (error: string): ProcessUploadResult =>
        ({ success: false, created: 0, skipped: 0, rows: [], processedPeriodLabel: null, error })

    const auth = await requireManager()
    if ('error' in auth) return fail(auth.error as string)
    const { employee } = auth

    try {
        const goal = await goalService.getById(input.goalId)
        if (!goal) return fail('Goal not found')

        const criteriaNames = new Set((goal.criteria || []).map((c: any) => c.name))
        const sanitizedMapping = input.mapping
            .filter(m => m.criterion === SKIP_COLUMN || criteriaNames.has(m.criterion))

        // Persist mapping for future uploads
        await writeSavedMapping(employee.organizationId!, input.goalId, {
            columns: sanitizedMapping,
            savedAt: new Date().toISOString(),
        })

        // Pull org metrics for scoring (mirrors analyzeReportAction's metric assembly)
        const org = await organizationService.getById(employee.organizationId!)
        const aliasMap = readSavedAliases((org.aiConfig as any) || {})
        const selectedMetricIds: string[] = org.selectedMetrics ?? []
        const activeDefaultMetrics = DEFAULT_ORG_METRICS
            .filter(m => selectedMetricIds.includes(m.id))
            .map(m => ({ name: m.name, description: m.desc }))

        const admin = createAdminClient()
        const { data: customMetricsData } = await (admin as any)
            .from('organization_custom_metrics')
            .select('name, description')
            .eq('organization_id', employee.organizationId!)
            .eq('is_active', true)
        const orgMetrics = [
            ...activeDefaultMetrics,
            ...((customMetricsData || []).map((m: any) => ({ name: m.name, description: m.description }))),
        ]
        const goalWeight = orgMetrics.length === 0 ? 100 : (org.goalWeight ?? 70)

        // ── Resolve the selected period window ──────────────────────────────
        // Load every non-void period on the goal, keep the ones in the chosen
        // window, and index them by employee so each row maps to its own slot.
        const { data: periodRows } = await (admin as any)
            .from('reporting_periods')
            .select('id, employee_id, period_start, period_end, status, report_id')
            .eq('goal_id', input.goalId)
            .neq('status', 'void')

        const inWindow = (periodRows || []).filter((p: any) => periodWindowKey(p.period_start) === input.periodKey)
        if (inWindow.length === 0) {
            return fail('That reporting period is no longer available. Reload and pick a period again.')
        }
        // Excused periods (on-leave) aren't fillable — drop them so an excused
        // agent is neither offered as an override target nor silently backfilled.
        const byEmployee = new Map<string, any>(
            inWindow.filter((p: any) => p.status !== 'excused').map((p: any) => [p.employee_id, p]),
        )
        const periodLabel = formatPeriodWindow(inWindow[0].period_start, inWindow[0].period_end)
        const submittedForDate = new Date(inWindow[0].period_end).toISOString().slice(0, 10)

        const allEmployees = await employeeService.getByOrganizationId(employee.organizationId!)
        const activeEmployees = allEmployees
            .filter((e: any) => e.isActive !== false)
            .map((e: any) => ({ id: e.id, name: e.name, email: e.email }))

        const results: RowResult[] = []

        // ── Phase 1: resolve every row (no AI). Skip the ones that can't be
        // scored now; collect the rest as tasks to score in parallel. ──────────
        type ScoreTask = {
            i: number
            rowIndex: number
            agentIdentifier: string
            matched: { id: string; name: string; email: string }
            period: any
            reportText: string
        }
        const tasks: ScoreTask[] = []

        for (let i = 0; i < input.rows.length; i++) {
            const row = input.rows[i]
            const agentIdentifier = (row[0] ?? '').trim()
            const rowIndex = i + 2 // header is row 1

            if (row.every(c => !c?.trim())) continue

            let matched = agentIdentifier ? resolveIdentifier(activeEmployees, agentIdentifier, aliasMap) : null
            const overrideId = input.identifierOverrides?.[i]
            if (!matched && overrideId) {
                matched = activeEmployees.find((e: { id: string }) => e.id === overrideId) ?? null
            }
            if (!matched) {
                results.push({
                    rowIndex, agentIdentifier, periodInput: periodLabel,
                    status: 'skipped', reason: agentIdentifier ? 'No matching employee' : 'Missing agent identifier',
                })
                continue
            }

            const period = byEmployee.get(matched.id)
            if (!period) {
                results.push({
                    rowIndex, agentIdentifier, assignedName: matched.name, periodInput: periodLabel,
                    status: 'skipped', reason: `${matched.name} isn't scheduled to report for ${periodLabel} on this goal`,
                })
                continue
            }
            if (period.report_id) {
                results.push({
                    rowIndex, agentIdentifier, assignedName: matched.name, periodInput: periodLabel,
                    status: 'skipped', reason: 'Report already exists for this period',
                })
                continue
            }

            tasks.push({ i, rowIndex, agentIdentifier, matched, period, reportText: buildReportText(input.headers, row, sanitizedMapping) })
        }

        // ── Phase 2: score + persist tasks concurrently (capped). ──────────────
        await mapWithConcurrency(tasks, SCORE_CONCURRENCY, async (t) => {
            const scoring = await scoreUploadedReport({ reportText: t.reportText, goal, orgMetrics, goalWeight })
            if (!scoring.ok) {
                results.push({
                    rowIndex: t.rowIndex, agentIdentifier: t.agentIdentifier, assignedName: t.matched.name, periodInput: periodLabel,
                    status: 'skipped', reason: scoring.error,
                })
                return
            }

            try {
                const reportId = `report-${input.goalId}-${t.matched.id}-${Date.now()}-${t.i}`
                const nowIso = new Date().toISOString()

                const { error: insertErr } = await (admin as any).from('reports').insert({
                    id: reportId,
                    goal_id: input.goalId,
                    employee_id: t.matched.id,
                    report_text: t.reportText,
                    submission_date: nowIso,
                    submitted_for_date: submittedForDate,
                    evaluation_score: scoring.evaluationScore,
                    evaluation_reasoning: scoring.evaluationReasoning,
                })
                if (insertErr) throw insertErr

                if (scoring.criterionScores.length > 0) {
                    const { error: scoreErr } = await (admin as any)
                        .from('report_criterion_scores')
                        .insert(scoring.criterionScores.map(cs => ({
                            report_id: reportId,
                            criterion_name: cs.criterionName,
                            score: cs.score,
                            evidence: cs.evidence ?? null,
                            reasoning: cs.reasoning ?? null,
                            coaching_note: cs.coachingNote ?? null,
                        })))
                    if (scoreErr) throw scoreErr
                }

                const { error: periodErr } = await (admin as any)
                    .from('reporting_periods')
                    .update({
                        status: 'submitted',
                        report_id: reportId,
                        late_submitted: t.period.status === 'missed',
                    })
                    .eq('id', t.period.id)
                if (periodErr) throw periodErr

                results.push({
                    rowIndex: t.rowIndex, agentIdentifier: t.agentIdentifier, assignedName: t.matched.name, periodInput: periodLabel,
                    status: 'created', reportId,
                    score: Number(scoring.evaluationScore.toFixed(1)),
                })
            } catch (writeErr: any) {
                // Log the real error for debugging, but never surface raw DB text
                // to the manager.
                console.error('[processUploadAction] insert failed for row', t.rowIndex, writeErr)
                results.push({
                    rowIndex: t.rowIndex, agentIdentifier: t.agentIdentifier, assignedName: t.matched.name, periodInput: periodLabel,
                    status: 'skipped',
                    reason: "Couldn't save this one — try again",
                })
            }
        })

        // Keep results in CSV row order despite concurrent completion.
        results.sort((a, b) => a.rowIndex - b.rowIndex)

        const created = results.filter(r => r.status === 'created').length
        const skipped = results.filter(r => r.status === 'skipped').length

        // Remember this run's manual resolutions so the same spreadsheet identifier
        // auto-matches next time. Keyed by the raw CSV value's normalized form.
        // Non-fatal: a failed alias write must not fail an otherwise-good upload.
        try {
            const newAliases: Record<string, string> = {}
            for (const [idxStr, empId] of Object.entries(input.identifierOverrides || {})) {
                const raw = (input.rows[Number(idxStr)]?.[0] ?? '').trim()
                const key = normalizeIdentifier(raw)
                if (key && empId) newAliases[key] = empId
            }
            await writeSavedAliases(employee.organizationId!, newAliases)
        } catch (aliasErr) {
            console.error('[processUploadAction] alias save failed (non-fatal):', aliasErr)
        }

        revalidatePath('/reports')
        revalidatePath('/dashboard')
        revalidatePath(`/goals/${input.goalId}`)
        revalidatePath('/upload')

        return {
            success: true,
            created,
            skipped,
            rows: results,
            processedPeriodLabel: periodLabel,
        }
    } catch (err: any) {
        console.error('processUploadAction Error:', err)
        return fail(err?.message || 'Upload processing failed')
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Scoring helper — Gemini call per row.
//
// Uses a focused prompt rather than reusing analyzeReportAction so we can keep
// the [Manager upload] prefix context out of the way and return exactly the
// shape reportService.create expects.
// ─────────────────────────────────────────────────────────────────────────────

interface ScoringSuccess {
    ok: true
    evaluationScore: number
    evaluationReasoning: string
    criterionScores: { goalId?: string; criterionName: string; score: number; reasoning: string; evidence?: string; coachingNote?: string | null }[]
}
interface ScoringFailure { ok: false; error: string }

async function scoreUploadedReport(args: {
    reportText: string
    goal: any
    orgMetrics: { name: string; description?: string }[]
    goalWeight: number
}): Promise<ScoringSuccess | ScoringFailure> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return { ok: false, error: 'AI is not configured (missing GEMINI_API_KEY)' }

    const goalCriteria = (args.goal.criteria || []).map((c: any) => ({
        name: c.name, weight: c.weight, target_description: c.target_description ?? null,
    }))

    if (goalCriteria.length === 0) {
        return { ok: false, error: 'Goal has no criteria to score against' }
    }

    const prompt = `You are Zevian's performance evaluation engine scoring a manager-uploaded KPI snapshot.

REPORT (structured KPI values, with "[Manager upload]" prefix indicating manager-imported data):
${args.reportText}

GOAL: ${args.goal.name}
GOAL INSTRUCTIONS: ${args.goal.instructions || 'None'}

GOAL CRITERIA (score each 1.0–10.0 with one decimal):
${goalCriteria.map((c: any) => `- ${c.name} (weight ${c.weight}%) — Target: ${c.target_description || 'No target set'}`).join('\n')}

ORG METRICS (score each 1.0–10.0 with one decimal):
${args.orgMetrics.map(m => `- ${m.name}: ${m.description || ''}`).join('\n') || 'None'}

SCORING RULES:
- Score against the stated Target for each criterion, not just the raw number in isolation. Work out from the target's wording whether higher or lower values are better (e.g. a handle-time or cancellation target is lower-is-better; a CSAT or resolution-rate target is higher-is-better).
- Meeting or beating the target → 8.0-10.0. Close but short of target → 5.0-7.9. Well short of target → below 5.0.
- If a criterion has a target but no matching KPI value in the report, score it 5.0 and say "no value provided against a set target" in reasoning.
- If a criterion has NO target set AND no matching KPI value in the report, do not guess a score — instead set "unscored": true and omit it from your judgement (it will be excluded from the average). Do not include unscored criteria in your reasoning as if they were evaluated.
- For criteria scoring below 7.0, write one sentence of actionable coaching for the manager. Otherwise coaching_note is null.

Return ONLY this JSON (no markdown, no preamble):
{
  "criteria_scores": [
    { "name": "<criterion name>", "score": 7.5, "unscored": false, "evidence": "<KPI line referenced>", "reasoning": "<2 sentences, reference the target explicitly if one was set>", "coaching_note": null }
  ],
  "org_metrics": [
    { "name": "<metric name>", "score": 7.0, "reasoning": "<1 sentence>" }
  ],
  "overall_reasoning": "<2 sentences summarising performance from the KPI values>"
}`

    try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
        const result = await withRetry(
            'score-manager-upload',
            () => model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    // Enough headroom for many criteria + org metrics + reasoning;
                    // 4096 truncated the JSON mid-object on 8-criteria goals, which
                    // then failed to parse and skipped the row.
                    maxOutputTokens: 8192,
                    temperature: 0.1,
                    responseMimeType: 'application/json',
                },
            }),
        )

        const raw = result.response.text()
        let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
        const start = cleaned.indexOf('{')
        const end = cleaned.lastIndexOf('}')
        if (start === -1 || end === -1) return { ok: false, error: 'AI returned unparseable scoring response' }
        cleaned = cleaned.slice(start, end + 1)

        let parsed: any
        try { parsed = JSON.parse(cleaned) }
        catch { return { ok: false, error: 'AI returned malformed JSON for scoring' } }

        const criteriaScores = Array.isArray(parsed.criteria_scores) ? parsed.criteria_scores : []
        const orgScores = Array.isArray(parsed.org_metrics) ? parsed.org_metrics : []

        if (criteriaScores.length === 0) {
            return { ok: false, error: 'AI returned no criterion scores' }
        }

        // The model occasionally omits/nulls a score (esp. an org metric). Coerce
        // to a finite number or null — null-scored entries are dropped so they
        // never hit report_criterion_scores.score (NOT NULL) and never poison an
        // average. Criteria the model marked `unscored` are also excluded.
        const finiteScore = (v: any): number | null => {
            const n = Number(v)
            return Number.isFinite(n) ? n : null
        }

        // Criteria with no target and no matching KPI value are excluded from
        // the average entirely, rather than floored at a guessed 5.0 — no
        // target + no data means "nothing to judge", not "mediocre".
        const scoredCriteria = criteriaScores
            .filter((c: any) => !c.unscored && finiteScore(c.score) !== null)
        const scoredOrg = orgScores.filter((m: any) => finiteScore(m.score) !== null)

        const goalAvg = scoredCriteria.length
            ? scoredCriteria.reduce((s: number, c: any) => s + finiteScore(c.score)!, 0) / scoredCriteria.length
            : 0
        const orgAvg = scoredOrg.length
            ? scoredOrg.reduce((s: number, m: any) => s + finiteScore(m.score)!, 0) / scoredOrg.length
            : 0
        const finalScore = args.orgMetrics.length === 0
            ? goalAvg
            : (goalAvg * (args.goalWeight / 100)) + (orgAvg * ((100 - args.goalWeight) / 100))

        const criterionScores = [
            ...scoredCriteria.map((c: any) => ({
                goalId: args.goal.id,
                criterionName: c.name,
                score: finiteScore(c.score)!,
                reasoning: c.reasoning || '',
                evidence: c.evidence || undefined,
                coachingNote: c.coaching_note || null,
            })),
            ...scoredOrg.map((m: any) => ({
                goalId: args.goal.id,
                criterionName: m.name,
                score: finiteScore(m.score)!,
                reasoning: m.reasoning || '',
                evidence: undefined,
            })),
        ]

        return {
            ok: true,
            evaluationScore: Number(finalScore.toFixed(2)),
            evaluationReasoning: parsed.overall_reasoning || 'Scored from manager-uploaded criteria data.',
            criterionScores,
        }
    } catch (err: any) {
        return { ok: false, error: err?.message || 'AI scoring failed' }
    }
}
