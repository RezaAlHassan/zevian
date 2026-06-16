'use server'

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
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
    type UploadGoalSummary,
    type SavedMapping,
    type MappingSuggestion,
    type RowResult,
    type ProcessUploadResult,
} from './managerUploadShared'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function kindFromFrequency(freq: string | null | undefined): 'tangible' | 'intangible' {
    return (freq || '').toLowerCase() === 'monthly' ? 'intangible' : 'tangible'
}

/**
 * Human-readable cadence label for row messages ("weekly" / "bi-weekly" /
 * "monthly"), or null if the goal's frequency isn't one we can name confidently.
 */
function frequencyLabel(freq: string | null | undefined): string | null {
    const f = (freq || '').toLowerCase().replace(/[\s_]/g, '-')
    if (f === 'weekly') return 'weekly'
    if (f === 'biweekly' || f === 'bi-weekly') return 'bi-weekly'
    if (f === 'monthly') return 'monthly'
    return null
}

/** Format a period date for row messages, e.g. "June 15". */
function formatRowDate(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })
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
 * Parse an identifier from the agent column. Tries email then name.
 * Match is case-insensitive on email and on normalized name (collapsed whitespace).
 */
async function matchEmployee(
    organizationId: string,
    identifier: string,
): Promise<{ id: string; name: string; email: string } | null> {
    const trimmed = (identifier || '').trim()
    if (!trimmed) return null

    const employees = await employeeService.getByOrganizationId(organizationId)
    const active = employees.filter((e: any) => e.isActive !== false)

    if (trimmed.includes('@')) {
        const lower = trimmed.toLowerCase()
        const byEmail = active.find((e: any) => (e.email || '').toLowerCase() === lower)
        if (byEmail) return { id: byEmail.id, name: byEmail.name, email: byEmail.email }
        return null
    }

    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
    const target = normalize(trimmed)
    const byName = active.find((e: any) => normalize(e.name || '') === target)
    if (byName) return { id: byName.id, name: byName.name, email: byName.email }
    return null
}

/**
 * Parse the period column. Accepts:
 *   - YYYY-MM-DD
 *   - DD/MM/YYYY or MM/DD/YYYY (assume ISO if dashed)
 *   - A range like "YYYY-MM-DD to YYYY-MM-DD" or "YYYY-MM-DD - YYYY-MM-DD" — use the START
 * Returns a Date at UTC midnight, or null if unparseable.
 */
function parsePeriodDate(raw: string): Date | null {
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
 * Find an existing reporting_period for this (goal, employee, date) using the
 * admin client — we're writing on another employee's behalf, so RLS on the
 * regular client would hide the row.
 *
 * Returns { id, isLate, reportId } or null if no period covers the date.
 */
async function findPeriodForRow(
    admin: any,
    goalId: string,
    employeeId: string,
    date: Date,
): Promise<{ id: string; isLate: boolean; reportId: string | null } | null> {
    const ts = date.toISOString()
    const { data: onTime } = await admin
        .from('reporting_periods')
        .select('id, period_end, report_id')
        .eq('goal_id', goalId)
        .eq('employee_id', employeeId)
        .lte('period_start', ts)
        .gt('period_end', ts)
        .neq('status', 'void')
        .order('period_end', { ascending: true })
        .limit(1)
        .maybeSingle()

    if (onTime) return { id: onTime.id, isLate: false, reportId: onTime.report_id }

    // For uploaded historical data, also accept the most recent past period whose
    // end is just before the provided date (one cycle late max). This mirrors
    // findMatchingPeriod's late-match behaviour without grace.
    const { data: late } = await admin
        .from('reporting_periods')
        .select('id, period_end, report_id')
        .eq('goal_id', goalId)
        .eq('employee_id', employeeId)
        .in('status', ['pending', 'missed'])
        .lt('period_end', ts)
        .order('period_end', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (!late) return null
    return { id: late.id, isLate: true, reportId: late.report_id }
}

/**
 * Whether this employee has *any* reporting cycle on this goal. Lets us tell
 * "no cycles exist at all" apart from "the date falls outside existing cycles"
 * — different problems for the manager to fix.
 */
async function hasAnyPeriod(admin: any, goalId: string, employeeId: string): Promise<boolean> {
    const { count } = await admin
        .from('reporting_periods')
        .select('id', { count: 'exact', head: true })
        .eq('goal_id', goalId)
        .eq('employee_id', employeeId)
        .neq('status', 'void')
    return (count || 0) > 0
}

function buildReportText(
    headers: string[],
    row: string[],
    mapping: { header: string; criterion: string }[],
): string {
    const pairs: string[] = []
    for (let i = 2; i < headers.length; i++) {
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
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!authError && user) {
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

        // Reserved columns: index 0 (agent), index 1 (period). Map remaining only.
        const dataHeaders = input.headers.slice(2)
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
// Action: process the CSV rows and create reports
// ─────────────────────────────────────────────────────────────────────────────

export async function processUploadAction(input: {
    goalId: string
    headers: string[]
    rows: string[][]
    mapping: { header: string; criterion: string }[]   // for columns 2..N only
}): Promise<ProcessUploadResult> {
    const auth = await requireManager()
    if ('error' in auth) {
        return { success: false, created: 0, skipped: 0, rows: [], periodsDetected: 0, processedPeriodLabel: null, error: auth.error }
    }
    const { employee } = auth

    try {
        const goal = await goalService.getById(input.goalId)
        if (!goal) return { success: false, created: 0, skipped: 0, rows: [], periodsDetected: 0, processedPeriodLabel: null, error: 'Goal not found' }

        const goalFreqLabel = frequencyLabel(
            (goal as any).project?.reportFrequency || (goal as any).project?.report_frequency,
        )

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

        // ── Single-period enforcement ───────────────────────────────────────
        // Spec: limit each upload to a single reporting period. Walk the rows
        // once to lock onto the first parseable period date, count distinct
        // periods seen, and mark rows that belong to other periods as skipped
        // before we touch the DB.
        const dateKey = (d: Date) => d.toISOString().slice(0, 10)
        let canonicalPeriodKey: string | null = null
        const distinctPeriodKeys = new Set<string>()
        const offPeriodRowIndexes = new Set<number>()

        for (let i = 0; i < input.rows.length; i++) {
            const row = input.rows[i]
            if (row.every(c => !c?.trim())) continue
            const d = parsePeriodDate((row[1] ?? '').trim())
            if (!d) continue
            const key = dateKey(d)
            distinctPeriodKeys.add(key)
            if (canonicalPeriodKey === null) canonicalPeriodKey = key
            else if (key !== canonicalPeriodKey) offPeriodRowIndexes.add(i)
        }

        const results: RowResult[] = []

        for (let i = 0; i < input.rows.length; i++) {
            const row = input.rows[i]
            const agentIdentifier = (row[0] ?? '').trim()
            const periodInput = (row[1] ?? '').trim()
            const rowIndex = i + 2 // header is row 1

            if (!agentIdentifier && !periodInput && row.every(c => !c?.trim())) continue

            if (offPeriodRowIndexes.has(i)) {
                results.push({
                    rowIndex, agentIdentifier, periodInput,
                    status: 'skipped',
                    reason: `Belongs to a different reporting cycle (${canonicalPeriodKey} processed). Upload this cycle separately.`,
                })
                continue
            }

            if (!agentIdentifier) {
                results.push({
                    rowIndex, agentIdentifier, periodInput,
                    status: 'skipped', reason: 'Missing agent identifier',
                })
                continue
            }

            const matched = await matchEmployee(employee.organizationId!, agentIdentifier)
            if (!matched) {
                results.push({
                    rowIndex, agentIdentifier, periodInput,
                    status: 'skipped', reason: 'No matching employee',
                })
                continue
            }

            const periodDate = parsePeriodDate(periodInput)
            if (!periodDate) {
                results.push({
                    rowIndex, agentIdentifier, periodInput,
                    status: 'skipped', reason: 'Could not parse period date',
                })
                continue
            }

            const periodMatch = await findPeriodForRow(admin, input.goalId, matched.id, periodDate)
            if (!periodMatch) {
                // Distinguish "no cycles at all" from "date outside existing cycles" —
                // they point the manager at different fixes.
                const anyPeriod = await hasAnyPeriod(admin, input.goalId, matched.id)
                const dateLabel = formatRowDate(periodDate)
                const cadence = goalFreqLabel ? `${goalFreqLabel} ` : ''
                const reason = anyPeriod
                    ? `${matched.name} doesn't have a ${cadence}cycle that covers ${dateLabel} yet`
                    : `${matched.name} has no ${cadence}cycles set up for this goal yet`
                results.push({
                    rowIndex, agentIdentifier, periodInput,
                    status: 'skipped', reason,
                })
                continue
            }
            if (periodMatch.reportId) {
                results.push({
                    rowIndex, agentIdentifier, periodInput,
                    status: 'skipped', reason: 'Report already exists for this period',
                })
                continue
            }

            const reportText = buildReportText(input.headers, row, sanitizedMapping)

            // Score via Gemini synchronously so the report lands fully scored,
            // matching the self-submission UX.
            const scoring = await scoreUploadedReport({
                reportText,
                goal,
                orgMetrics,
                goalWeight,
            })
            if (!scoring.ok) {
                results.push({
                    rowIndex, agentIdentifier, periodInput,
                    status: 'skipped', reason: scoring.error,
                })
                continue
            }

            try {
                const reportId = `report-${input.goalId}-${matched.id}-${Date.now()}-${i}`
                const nowIso = new Date().toISOString()

                const { error: insertErr } = await (admin as any).from('reports').insert({
                    id: reportId,
                    goal_id: input.goalId,
                    employee_id: matched.id,
                    report_text: reportText,
                    submission_date: nowIso,
                    submitted_for_date: periodDate.toISOString().slice(0, 10),
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
                        late_submitted: periodMatch.isLate,
                    })
                    .eq('id', periodMatch.id)
                if (periodErr) throw periodErr

                results.push({
                    rowIndex, agentIdentifier, periodInput,
                    status: 'created', reportId,
                    score: Number(scoring.evaluationScore.toFixed(1)),
                })
            } catch (writeErr: any) {
                // Log the real error for debugging, but never surface raw DB text
                // to the manager.
                console.error('[processUploadAction] insert failed for row', rowIndex, writeErr)
                results.push({
                    rowIndex, agentIdentifier, periodInput,
                    status: 'skipped',
                    reason: "Couldn't save this one — try again",
                })
            }
        }

        const created = results.filter(r => r.status === 'created').length
        const skipped = results.filter(r => r.status === 'skipped').length

        revalidatePath('/reports')
        revalidatePath('/dashboard')
        revalidatePath(`/goals/${input.goalId}`)
        revalidatePath('/upload')

        return {
            success: true,
            created,
            skipped,
            rows: results,
            periodsDetected: distinctPeriodKeys.size,
            processedPeriodLabel: canonicalPeriodKey,
        }
    } catch (err: any) {
        console.error('processUploadAction Error:', err)
        return { success: false, created: 0, skipped: 0, rows: [], periodsDetected: 0, processedPeriodLabel: null, error: err?.message || 'Upload processing failed' }
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
        name: c.name, weight: c.weight,
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
${goalCriteria.map((c: any) => `- ${c.name} (weight ${c.weight}%)`).join('\n')}

ORG METRICS (score each 1.0–10.0 with one decimal):
${args.orgMetrics.map(m => `- ${m.name}: ${m.description || ''}`).join('\n') || 'None'}

SCORING RULES:
- Score on the numeric evidence shown. Higher numbers on positive metrics score higher; higher numbers on negative metrics (e.g. cancellations) score lower.
- If a criterion has no matching KPI value in the report, score it 5.0 and say so in reasoning.
- For criteria scoring below 7.0, write one sentence of actionable coaching for the manager. Otherwise coaching_note is null.

Return ONLY this JSON (no markdown, no preamble):
{
  "criteria_scores": [
    { "name": "<criterion name>", "score": 7.5, "evidence": "<KPI line referenced>", "reasoning": "<2 sentences>", "coaching_note": null }
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
                    maxOutputTokens: 4096,
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

        const goalAvg = criteriaScores.reduce((s: number, c: any) => s + Number(c.score || 0), 0) / criteriaScores.length
        const orgAvg = orgScores.length
            ? orgScores.reduce((s: number, m: any) => s + Number(m.score || 0), 0) / orgScores.length
            : 0
        const finalScore = args.orgMetrics.length === 0
            ? goalAvg
            : (goalAvg * (args.goalWeight / 100)) + (orgAvg * ((100 - args.goalWeight) / 100))

        const criterionScores = [
            ...criteriaScores.map((c: any) => ({
                goalId: args.goal.id,
                criterionName: c.name,
                score: Number(c.score),
                reasoning: c.reasoning || '',
                evidence: c.evidence || undefined,
                coachingNote: c.coaching_note || null,
            })),
            ...orgScores.map((m: any) => ({
                goalId: args.goal.id,
                criterionName: m.name,
                score: Number(m.score),
                reasoning: m.reasoning || '',
                evidence: undefined,
            })),
        ]

        return {
            ok: true,
            evaluationScore: Number(finalScore.toFixed(2)),
            evaluationReasoning: parsed.overall_reasoning || 'Scored from manager-uploaded KPI data.',
            criterionScores,
        }
    } catch (err: any) {
        return { ok: false, error: err?.message || 'AI scoring failed' }
    }
}
