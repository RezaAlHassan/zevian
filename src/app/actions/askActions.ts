'use server'

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/session'
import { employeeService, goalService, reportService } from '@/../databaseService2'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import { withRetry } from '@/lib/ai/withRetry'

export interface AskScope {
    employeeIds: string[]   // [] = all employees in scope
    startDate: string       // YYYY-MM-DD
    endDate: string         // YYYY-MM-DD
    goalId: string | null
}

export interface AskCitation {
    reportId: string
    employeeName: string
    goalName: string
    date: string
}

export interface AskMessage {
    role: 'user' | 'model'
    text: string
    resolvedScope?: AskScope
    citations?: AskCitation[]
    scopeChanged?: boolean   // UI-only: did the resolve step differ from the filters at ask time
}

export interface AskContext {
    employees: { id: string; name: string; title?: string | null }[]
    goals: { id: string; name: string }[]
    managerId: string
    organizationId: string
    isSenior: boolean
}

// How far back a logged answer stays eligible for cache reuse / session restore.
const ASK_SESSION_WINDOW_MS = 30 * 60 * 1000

function scopesEqual(a: AskScope, b: AskScope): boolean {
    return a.startDate === b.startDate &&
        a.endDate === b.endDate &&
        (a.goalId ?? null) === (b.goalId ?? null) &&
        a.employeeIds.length === b.employeeIds.length &&
        a.employeeIds.every(id => b.employeeIds.includes(id))
}

// Rebuild the display fields for a set of cited report ids (employee, scorecard, date).
// ask_queries stores only the bare ids, so we re-hydrate from reports for cached answers.
// Returns citations in the same order as the incoming id list.
async function hydrateCitations(reportIds: string[]): Promise<AskCitation[]> {
    if (reportIds.length === 0) return []
    try {
        const { data } = await (createAdminClient() as any)
            .from('reports')
            .select('id, submitted_for_date, submission_date, goals(name), employees:employees!reports_employee_id_fkey(name)')
            .in('id', reportIds)
        const byId = new Map<string, any>((data || []).map((r: any) => [r.id, r]))
        return reportIds
            .filter(id => byId.has(id))
            .map(id => {
                const r = byId.get(id)
                return {
                    reportId: id,
                    employeeName: r.employees?.name || 'Unknown',
                    goalName: r.goals?.name || 'Unknown KPI',
                    date: r.submitted_for_date || r.submission_date?.slice(0, 10) || 'unknown date',
                }
            })
    } catch (err) {
        console.error('hydrateCitations failed:', err)
        return []
    }
}

// This manager's logged Ask queries within the reuse window, oldest first.
async function getRecentAskRows(managerId: string): Promise<any[]> {
    const since = new Date(Date.now() - ASK_SESSION_WINDOW_MS).toISOString()
    const { data, error } = await (createAdminClient() as any)
        .from('ask_queries')
        .select('question_text, resolved_scope, answer_text, cited_report_ids, created_at')
        .eq('manager_id', managerId)
        .gte('created_at', since)
        .order('created_at', { ascending: true })
    if (error) {
        console.error('getRecentAskRows failed:', error)
        return []
    }
    return data || []
}

export interface AskSession {
    scope: AskScope
    messages: AskMessage[]
}

// Restore the most recent Ask thread for the current manager (filters + chat) when they
// re-open Ask with no incoming question. Returns null when nothing recent exists, so the
// page falls back to default filters and an empty thread.
export async function getAskSessionAction(): Promise<AskSession | null> {
    try {
        const supabase = createServerClient()
        const user = await getAuthUser()
        if (!user) return null

        const me = await employeeService.getByAuthId(user.id)
        if (!me) return null
        if (me.role !== 'manager' && !me.isAccountOwner) return null

        const rows = await getRecentAskRows(me.id)
        if (rows.length === 0) return null

        // Hydrate every cited report across the thread in one round-trip.
        const allIds = Array.from(new Set(rows.flatMap((r: any) =>
            Array.isArray(r.cited_report_ids) ? r.cited_report_ids.map(String) : []
        )))
        const citationById = new Map((await hydrateCitations(allIds)).map(c => [c.reportId, c]))

        const messages: AskMessage[] = []
        let prevScope: AskScope | null = null
        for (const row of rows) {
            const resolvedScope = row.resolved_scope as AskScope
            messages.push({ role: 'user', text: row.question_text })
            const ids: string[] = Array.isArray(row.cited_report_ids) ? row.cited_report_ids.map(String) : []
            messages.push({
                role: 'model',
                text: row.answer_text,
                resolvedScope,
                citations: ids.map(id => citationById.get(id)).filter(Boolean) as AskCitation[],
                scopeChanged: prevScope ? !scopesEqual(prevScope, resolvedScope) : false,
            })
            prevScope = resolvedScope
        }

        return { scope: prevScope as AskScope, messages }
    } catch (error) {
        console.error('getAskSessionAction Error:', error)
        return null
    }
}

export async function getAskContextAction(): Promise<{ success: true; data: AskContext } | { error: string }> {
    try {
        const supabase = createServerClient()
        const user = await getAuthUser()
        if (!user) return { error: 'Not authenticated' }

        const me = await employeeService.getByAuthId(user.id)
        if (!me) return { error: 'Employee record not found' }
        if (me.role !== 'manager' && !me.isAccountOwner) return { error: 'Unauthorized' }

        const isSenior = me.isAccountOwner ||
            me.role === 'admin' ||
            (me.permissions?.canViewOrganizationWide ?? false)

        let employees: { id: string; name: string; title?: string | null }[] = []

        if (isSenior && me.organizationId) {
            const all = await employeeService.getAll()
            employees = all
                .filter((e: any) => e.organizationId === me.organizationId && e.isActive && e.role === 'employee')
                .map((e: any) => ({ id: e.id, name: e.name, title: e.title ?? null }))
        } else {
            const { data } = await (supabase as any)
                .from('employees')
                .select('id, name, title')
                .eq('manager_id', me.id)
                .eq('is_active', true)
            employees = (data || []).map((e: any) => ({ id: e.id, name: e.name, title: e.title ?? null }))
        }

        const allGoals = await goalService.getAll()
        const goals = allGoals.map((g: any) => ({ id: g.id, name: g.name }))

        return {
            success: true,
            data: {
                employees,
                goals,
                managerId: me.id,
                organizationId: me.organizationId || '',
                isSenior,
            },
        }
    } catch (error: any) {
        console.error('getAskContextAction Error:', error)
        return { error: error.message || 'Failed to load context' }
    }
}

export async function askQuestionAction(input: {
    question: string
    history: AskMessage[]
    scope: AskScope
    context: AskContext
}): Promise<{ success: true; answer: string; resolvedScope: AskScope; citations: AskCitation[] } | { error: string }> {
    try {
        const supabase = createServerClient()
        const user = await getAuthUser()
        if (!user) return { error: 'Not authenticated' }

        // ── Cache: serve a recent identical question without re-calling Gemini ──
        // Key = same question text + same scope (vs. the resolved_scope we logged), within
        // the reuse window, for this manager. Covers re-entering Ask via an "Ask why" link or
        // the browser Back button, where the page auto-submits the same question again.
        const questionKey = input.question.trim().toLowerCase()
        try {
            const recent = await getRecentAskRows(input.context.managerId)
            const hit = recent
                .slice()
                .reverse() // most recent first
                .find((r: any) =>
                    String(r.question_text).trim().toLowerCase() === questionKey &&
                    scopesEqual(input.scope, r.resolved_scope as AskScope))
            if (hit) {
                const ids: string[] = Array.isArray(hit.cited_report_ids) ? hit.cited_report_ids.map(String) : []
                return {
                    success: true,
                    answer: hit.answer_text,
                    resolvedScope: hit.resolved_scope as AskScope,
                    citations: await hydrateCitations(ids),
                }
            }
        } catch (cacheErr) {
            console.error('ask cache lookup failed:', cacheErr)
        }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) return { error: 'AI is not configured' }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        // ── Step 1: Scope resolution ──────────────────────────────────────────
        const today = new Date().toISOString().slice(0, 10)

        const resolvePrompt = `You are a scope resolver for a manager analytics platform.

Available employees:
${input.context.employees.map(e => `- "${e.name}" (id: ${e.id})`).join('\n') || '(none)'}

Available scorecards/goals:
${input.context.goals.map(g => `- "${g.name}" (id: ${g.id})`).join('\n') || '(none)'}

Current scope:
- employeeIds: ${JSON.stringify(input.scope.employeeIds)} (empty array = all employees)
- startDate: ${input.scope.startDate}
- endDate: ${input.scope.endDate}
- goalId: ${input.scope.goalId ?? 'null'}

Today's date: ${today}

Manager's question: "${input.question}"

Determine if the question implies a scope adjustment. Rules:
1. If a specific employee is named, set employeeIds to [their id]. Use ONLY ids from the list above. If the name is unrecognized, keep employeeIds unchanged.
2. If "everyone", "all", "the team", or "my team" is mentioned → set employeeIds to [].
3. If a time reference like "last month", "this week", "past 30 days", "Q1 2026", etc. → adjust startDate/endDate. Dates must be YYYY-MM-DD.
4. If a specific scorecard/goal is named, set goalId to its id. Use ONLY ids from the list above. If unrecognized, keep goalId unchanged.
5. If no scope change is implied by the question, return the current scope values unchanged.

Respond with ONLY valid JSON, no markdown fences:
{"employeeIds":[],"startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","goalId":null}`

        let resolvedScope: AskScope = { ...input.scope }

        try {
            const resolveResult = await withRetry('askScopeResolve', () => model.generateContent(resolvePrompt))
            const raw = resolveResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim()
            const parsed = JSON.parse(raw)

            const validEmployeeIds = new Set(input.context.employees.map(e => e.id))
            const validGoalIds = new Set(input.context.goals.map(g => g.id))
            const dateRe = /^\d{4}-\d{2}-\d{2}$/

            resolvedScope = {
                employeeIds: Array.isArray(parsed.employeeIds)
                    ? parsed.employeeIds.filter((id: string) => validEmployeeIds.has(id))
                    : input.scope.employeeIds,
                startDate: dateRe.test(parsed.startDate) ? parsed.startDate : input.scope.startDate,
                endDate: dateRe.test(parsed.endDate) ? parsed.endDate : input.scope.endDate,
                goalId: parsed.goalId && validGoalIds.has(parsed.goalId) ? parsed.goalId : input.scope.goalId,
            }
        } catch {
            // Fall back to provided scope on Gemini parse failure
        }

        // ── Step 2: Fetch reports ─────────────────────────────────────────────
        const { managerId, organizationId, isSenior } = input.context
        let reports: any[] = []

        if (resolvedScope.employeeIds.length === 1) {
            reports = await reportService.getEmployeeReports(
                resolvedScope.employeeIds[0],
                resolvedScope.startDate,
                resolvedScope.endDate,
            )
        } else {
            reports = await reportService.getManagerReports(
                managerId,
                isSenior ? 'org' : 'direct',
                organizationId,
                resolvedScope.startDate,
                resolvedScope.endDate,
            )
            if (resolvedScope.employeeIds.length > 1) {
                const ids = new Set(resolvedScope.employeeIds)
                reports = reports.filter((r: any) => ids.has(r.employeeId))
            }
        }

        if (resolvedScope.goalId) {
            reports = reports.filter((r: any) => r.goalId === resolvedScope.goalId)
        }

        // ── Step 3: Compute aggregations in code (pre-calculated facts) ───────
        const employeeNameMap = Object.fromEntries(input.context.employees.map(e => [e.id, e.name]))
        const scoreOf = (r: any): number | null => {
            const v = r.managerOverallScore ?? r.evaluationScore
            return v == null ? null : Number(v)
        }
        const dateMsOf = (r: any): number => new Date(r.submittedForDate || r.submissionDate).getTime()

        // Employees the resolved scope actually covers (specific selection, or everyone visible).
        const scopedEmployees = resolvedScope.employeeIds.length > 0
            ? input.context.employees.filter(e => resolvedScope.employeeIds.includes(e.id))
            : input.context.employees

        // Midpoint of the resolved date range — splits each employee's reports into a first
        // and second half so we can read a trend direction (same ±0.2 threshold the dashboard
        // metricStats uses).
        const midMs = (new Date(resolvedScope.startDate).getTime() + new Date(resolvedScope.endDate).getTime()) / 2

        const perEmployee = scopedEmployees.map(emp => {
            const empReports = reports.filter((r: any) => r.employeeId === emp.id)
            const scored = empReports
                .map((r: any) => ({ score: scoreOf(r), dateMs: dateMsOf(r) }))
                .filter((x: { score: number | null }) => x.score != null) as { score: number; dateMs: number }[]

            const avg = scored.length
                ? scored.reduce((a, x) => a + x.score, 0) / scored.length
                : null

            const firstHalf = scored.filter(x => x.dateMs < midMs)
            const secondHalf = scored.filter(x => x.dateMs >= midMs)
            const fhAvg = firstHalf.length ? firstHalf.reduce((a, x) => a + x.score, 0) / firstHalf.length : null
            const shAvg = secondHalf.length ? secondHalf.reduce((a, x) => a + x.score, 0) / secondHalf.length : null

            let trend: 'up' | 'down' | 'stable' | 'n/a' = 'n/a'
            if (fhAvg != null && shAvg != null) {
                trend = shAvg > fhAvg + 0.2 ? 'up' : shAvg < fhAvg - 0.2 ? 'down' : 'stable'
            }

            return { id: emp.id, name: emp.name, reportCount: empReports.length, avg, trend }
        })

        const withData = perEmployee.filter(e => e.reportCount > 0)
        const noData = perEmployee.filter(e => e.reportCount === 0)

        const computedSummaryBlock = withData.length
            ? withData.map(e =>
                `- ${e.name}: average ${e.avg != null ? `${e.avg.toFixed(1)}/10` : 'N/A'} across ${e.reportCount} report${e.reportCount !== 1 ? 's' : ''}, trend ${e.trend}`
            ).join('\n')
            : '(no scored reports in scope)'

        const incompleteDataBlock = noData.length
            ? `No reports found for: ${noData.map(e => e.name).join(', ')}.`
            : ''

        // ── Step 4: Build answer with structured citations ────────────────────
        const reportContext = reports.slice(0, 60).map((r: any) => {
            const empName = r.employees?.name || employeeNameMap[r.employeeId] || r.employeeId
            const goalName = r.goals?.name || r.goalId || 'Unknown scorecard'
            const kpis = (r.criterionScores || []).map((s: any) => `${s.criterionName}: ${s.score}/10`).join(', ')
            const date = r.submittedForDate || r.submissionDate?.slice(0, 10) || 'unknown date'
            const score = scoreOf(r)
            return `(report id: ${r.id}) [${date}] ${empName} — ${goalName} — Score: ${score ?? 'N/A'}/10${kpis ? ` — KPIs: ${kpis}` : ''}${r.reportText ? `\nReport: ${r.reportText.slice(0, 300)}` : ''}`
        }).join('\n\n---\n\n')

        const historyBlock = input.history.slice(-8).map(m =>
            `${m.role === 'user' ? 'Manager' : 'AI'}: ${m.text}`
        ).join('\n')

        const answerPrompt = `You are a performance analytics assistant for a manager on Zevian, a performance management platform.

COMPUTED SUMMARY (pre-calculated facts — these were computed in code from the data, use these numbers directly for any averages or trends, do NOT recompute them from the raw list):
${computedSummaryBlock}
${incompleteDataBlock ? `\nINCOMPLETE DATA (employees in scope with zero reports in this range):\n${incompleteDataBlock}` : ''}

${reportContext
    ? `REPORT DATA (${reports.length} report${reports.length !== 1 ? 's' : ''} in scope, ${resolvedScope.startDate} → ${resolvedScope.endDate}):\n${reportContext}`
    : `No reports found for the selected scope (${resolvedScope.startDate} → ${resolvedScope.endDate}).`}

${historyBlock ? `\nPREVIOUS CONVERSATION:\n${historyBlock}` : ''}

Manager's question: "${input.question}"

HOW TO ANSWER:
Write the way a sharp manager talks about their own team — plain, direct, about the work. Not like a report that reads scores back.

- Lead with what's actually going on. Open with the substance — what was or wasn't done and why it matters for this person's project or role — never with an average score.
- Calibrate length to the question. A "why" question earns a short explanation: two compact paragraphs at most. A status question like "how is X doing" gets one or two sentences when nothing is wrong. Always put the headline first, so a manager scanning quickly gets the gist from the very first sentence.
- Don't list every item with its score in parentheses. Avoid constructions like "Initiative (9/10), On-time Delivery (8/10), Work Quality (9/10)." Group related strengths or gaps in plain language instead.
- Use numbers sparingly, as support and not as structure. A specific number can appear when it adds something a description can't, but don't build the answer sentence by sentence around scores. If everything in one area came back at zero, say that plainly ("nothing was recorded on the research or the prototype") rather than listing each item at 0/10. When you do state a figure, use the COMPUTED SUMMARY value — never recompute it from the raw list.
- Describe patterns and groups, not score-per-report lists. If someone has been sliding across several reports, say "this has been the trend for a few weeks" rather than reciting each report. For team-wide questions, group people by what's actually true of them (who's leading, who's steady, who needs a look) instead of naming everyone with a number attached.
- Avoid Zevian's internal terminology. Words like "criteria," "scorecard," "criterion," and "key performance indicators (KPIs)" are our internal labels, not how a manager describes their team. Refer to what these represent for that project or person directly — the research, the prototype, the architecture, the booking numbers, the call handling — without the category label.
- If an employee in scope has no reports (see INCOMPLETE DATA), say so when it's relevant (e.g. a team overview) rather than silently omitting them. If no reports are available at all, say so plainly and suggest broadening the date range or checking the scope. Never fabricate — only use what's provided above.

EXAMPLES (these show the voice and shape to aim for, not content to copy):

Example A — a "why is X flagged / at risk" question.
✗ Weak (do NOT write like this — it just recites scores): "Alex Price is at risk due to an average score of 2.6/10 across one report. The specific report for 'User Research to Prototype and MVP Plan' shows a score of 2.63/10, significantly impacted by 0/10 scores in User Research Quality, Prototype Integration, Architecture Definition, and MVP Plan Readiness. While Alex scored well in areas like Initiative (9/10), On-time Delivery (8/10), Work Quality (9/10), and Problem Solving (9/10), these did not compensate for the low scores in the aforementioned key performance indicators."
✓ Strong (write like this): "Alex is flagged because the foundational work on the User Research to Prototype and MVP Plan project hasn't been done. The research, the prototype integration, the architecture, and the plan itself all came back with nothing recorded, and those are the pieces everything else on this project builds on.

This isn't an effort problem. The same report shows strong initiative, on time delivery, solid work quality, and good problem solving. The work is happening, it's just not landing on the parts of this project that matter most right now."

Example B — a team-wide "how is the team trending" question, most steady, one person down.
✓ Strong: "Overall the team's moved up a bit this period. Mehedi continues to lead the way, and most of the group is holding steady around where they were.

Tanvir's the one to watch, his numbers dropped noticeably this period after a strong run before. Worth checking in with him."

Example C — a simple status question ("how is Tanvir doing") where nothing's wrong.
✓ Strong (short): "Tanvir's having a strong run. He's been consistently hitting his booking numbers, and his call handling has held up well even when prospects push back. Nothing here needs your attention right now."

CITATIONS (required): every specific claim — a score, an average, a trend, a comparison — must be backed by at least one report. Put the "report id" values of the reports that support your answer into citedReportIds. Use ONLY ids that appear in the REPORT DATA above. If the answer makes no specific data claim (e.g. no reports exist), citedReportIds may be empty.

Respond with the structured fields: "answer" (the answer text) and "citedReportIds" (the supporting report ids).`

        const answerResult = await withRetry('askAnswer', () => model.generateContent({
            contents: [{ role: 'user', parts: [{ text: answerPrompt }] }],
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        answer: { type: SchemaType.STRING },
                        citedReportIds: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    },
                    required: ['answer', 'citedReportIds'],
                },
            },
        }))

        let answer = ''
        let citedReportIds: string[] = []
        try {
            const parsed = JSON.parse(answerResult.response.text())
            answer = String(parsed.answer ?? '').trim()
            citedReportIds = Array.isArray(parsed.citedReportIds) ? parsed.citedReportIds.map(String) : []
        } catch {
            // Fall back to raw text if structured parsing fails
            answer = answerResult.response.text().trim()
        }

        // Validate cited ids against reports actually in scope, dedupe, and shape for the UI.
        const reportById = new Map(reports.map((r: any) => [r.id, r]))
        const seen = new Set<string>()
        const citations: AskCitation[] = citedReportIds
            .filter(id => reportById.has(id) && !seen.has(id) && (seen.add(id), true))
            .map(id => {
                const r = reportById.get(id)
                return {
                    reportId: id,
                    employeeName: r.employees?.name || employeeNameMap[r.employeeId] || r.employeeId,
                    goalName: r.goals?.name || 'Unknown KPI',
                    date: r.submittedForDate || r.submissionDate?.slice(0, 10) || 'unknown date',
                }
            })

        // ── Step 5: Log the query (best-effort, not shown in UI) ──────────────
        // Service-role insert: ask_queries has RLS enabled with no policies, so it's
        // unreadable/unwritable by anon or user-session clients. Only the admin client
        // (which bypasses RLS) can write to this write-only audit log.
        try {
            await (createAdminClient() as any).from('ask_queries').insert({
                organization_id: organizationId || null,
                manager_id: managerId,
                question_text: input.question,
                resolved_scope: resolvedScope,
                answer_text: answer,
                cited_report_ids: citations.map(c => c.reportId),
            })
        } catch (logErr) {
            console.error('ask_queries insert failed:', logErr)
        }

        return { success: true, answer, resolvedScope, citations }
    } catch (error: any) {
        console.error('askQuestionAction Error:', error)
        return { error: error.message || 'Failed to get answer' }
    }
}
