import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createAdminClient } from '@/lib/supabase/server'
import { withRetry } from '@/lib/ai/withRetry'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

/**
 * POST /api/ai/summarize-org
 * Generates an AI performance summary for an entire organization over a selected period.
 *
 * Body: { organizationId: string, organizationName?: string, startDate?: string, endDate?: string }
 */
export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured.' }, { status: 500 })
  }

  try {
    const { organizationId, organizationName, startDate, endDate } = await req.json()
    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Fetch active employee IDs + dept only (names not needed for AI)
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, dept')
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (empError) {
      console.error('[summarize-org] Employees query error:', empError)
      return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
    }

    const employeeIds = (employees ?? []).map((e: any) => e.id)
    const employeeDeptMap = Object.fromEntries((employees ?? []).map((e: any) => [e.id, e.dept]))

    if (employeeIds.length === 0) {
      return NextResponse.json({ error: 'No employees found in organization' }, { status: 404 })
    }

    // Fetch scores only — no joins
    let reportsQuery = supabase
      .from('reports')
      .select('id, employee_id, evaluation_score, manager_overall_score')
      .in('employee_id', employeeIds)

    if (startDate) reportsQuery = reportsQuery.gte('submission_date', startDate)
    if (endDate) reportsQuery = reportsQuery.lte('submission_date', endDate)

    const { data: reports, error: reportsError } = await reportsQuery
    if (reportsError) {
      console.error('[summarize-org] Reports query error:', reportsError)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    const reportList = (reports ?? []) as any[]
    const reportIds = reportList.map((r) => r.id)

    // Fetch criterion scores only if there are reports
    let criterionScores: any[] = []
    if (reportIds.length > 0) {
      const { data: cs } = await supabase
        .from('report_criterion_scores')
        .select('criterion_name, score')
        .in('report_id', reportIds)
      criterionScores = cs ?? []
    }

    // --- Aggregate in JS, send compact stats to AI ---

    const empScores: Record<string, number[]> = {}
    for (const r of reportList) {
      const score = r.manager_overall_score ?? r.evaluation_score
      if (score == null) continue
      if (!empScores[r.employee_id]) empScores[r.employee_id] = []
      empScores[r.employee_id].push(Number(score))
    }

    const empAvgs = Object.entries(empScores).map(([id, scores]) => ({
      dept: employeeDeptMap[id],
      avg: scores.reduce((a, b) => a + b, 0) / scores.length,
    }))

    const allScores = empAvgs.map((e) => e.avg)
    const orgAvg = allScores.length > 0
      ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2)
      : 'N/A'

    // Score distribution bands
    const bands = { strong: 0, good: 0, average: 0, needs_improvement: 0 }
    for (const avg of allScores) {
      if (avg >= 8) bands.strong++
      else if (avg >= 6) bands.good++
      else if (avg >= 4) bands.average++
      else bands.needs_improvement++
    }
    const total = allScores.length || 1
    const distLines = [
      `8-10 (strong): ${bands.strong} (${Math.round((bands.strong / total) * 100)}%)`,
      `6-7.9 (good): ${bands.good} (${Math.round((bands.good / total) * 100)}%)`,
      `4-5.9 (average): ${bands.average} (${Math.round((bands.average / total) * 100)}%)`,
      `0-3.9 (needs improvement): ${bands.needs_improvement} (${Math.round((bands.needs_improvement / total) * 100)}%)`,
    ].join(', ')

    // Dept breakdown
    const deptStats: Record<string, number[]> = {}
    for (const e of empAvgs) {
      if (!e.dept) continue
      if (!deptStats[e.dept]) deptStats[e.dept] = []
      deptStats[e.dept].push(e.avg)
    }
    const deptLines = Object.entries(deptStats)
      .map(([dept, scores]) => `${dept}: ${(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)}/10 (${scores.length} employees)`)
      .join(', ')

    // Top 3 and bottom 3 criteria
    const criterionTotals: Record<string, { total: number; count: number }> = {}
    for (const cs of criterionScores) {
      if (!criterionTotals[cs.criterion_name]) criterionTotals[cs.criterion_name] = { total: 0, count: 0 }
      criterionTotals[cs.criterion_name].total += Number(cs.score)
      criterionTotals[cs.criterion_name].count++
    }
    const sortedCriteria = Object.entries(criterionTotals)
      .map(([name, { total, count }]) => ({ name, avg: total / count }))
      .sort((a, b) => b.avg - a.avg)
    const topCriteria = sortedCriteria.slice(0, 3).map((c) => `${c.name} (${c.avg.toFixed(1)})`).join(', ')
    const weakCriteria = sortedCriteria.slice(-3).reverse().map((c) => `${c.name} (${c.avg.toFixed(1)})`).join(', ')

    // Build period label
    const fmt = (iso: string) =>
      new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    const periodLabel = startDate && endDate
      ? `${fmt(startDate)} – ${fmt(endDate)}`
      : startDate ? `From ${fmt(startDate)}`
        : endDate ? `Up to ${fmt(endDate)}`
          : 'All time'

    const systemPrompt = `You are a performance analytics assistant for Zevian, a team performance platform used by managers.

Given an organization's aggregated performance data for a specific period, produce a concise but insightful organization-wide summary.

Respond ONLY with valid JSON. No markdown, no code blocks, no extra text.

Use exactly this structure:
{
  "headline": "One sentence capturing the overall organizational performance tone",
  "overall_rating": "good",
  "highlights": ["org-level strength 1", "org-level strength 2"],
  "concerns": ["org-level concern 1"],
  "trend": "stable",
  "recommendation": "1-2 sentence strategic recommendation for leadership"
}

Rules:
- overall_rating must be exactly one of: strong, good, average, needs_improvement
- trend must be exactly one of: improving, stable, declining, insufficient_data
- highlights: 1-3 items focused on team-wide positives, empty array if none
- concerns: 0-3 items focused on team-wide risks or gaps, empty array if none
- All values must be plain strings — no quotes, backslashes, or curly braces inside string values
- Focus on organizational patterns, not individual employees`

    const userPrompt = `Organization: ${organizationName ?? organizationId}
Period: ${periodLabel}
Total employees: ${employeeIds.length}
Employees with reports: ${allScores.length}
Total reports submitted: ${reportList.length}
Organization average score: ${orgAvg}/10

SCORE DISTRIBUTION:
${distLines}
${deptLines ? `\nDEPARTMENT BREAKDOWN:\n${deptLines}` : ''}
${topCriteria ? `\nSTRONGEST CRITERIA: ${topCriteria}` : ''}
${weakCriteria && weakCriteria !== topCriteria ? `WEAKEST CRITERIA: ${weakCriteria}` : ''}

Generate an organization-wide performance summary based on the above data.`

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await withRetry('summarize-org', () => model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    }))

    const raw = result.response.text().trim()
    let parsed: any
    try {
      parsed = JSON.parse(raw)
    } catch {
      const stripped = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      const start = stripped.indexOf('{')
      const end = stripped.lastIndexOf('}')
      if (start === -1 || end === -1) {
        console.error('[summarize-org] Unparseable response:', stripped.slice(0, 300))
        throw new Error('AI returned an unparseable response. Please try again.')
      }
      parsed = JSON.parse(stripped.slice(start, end + 1))
    }

    return NextResponse.json({
      summary: parsed,
      meta: {
        organizationName: organizationName ?? organizationId,
        periodLabel,
        reportCount: reportList.length,
        employeeCount: employeeIds.length,
        orgAvgScore: orgAvg,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (err: any) {
    console.error('[summarize-org]', err)
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}
