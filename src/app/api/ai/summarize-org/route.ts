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

    // Fetch all active employees in the org
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, role, dept')
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (empError) {
      console.error('[summarize-org] Employees query error:', empError)
      return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
    }

    const employeeIds = (employees ?? []).map((e: any) => e.id)
    const employeeMap = Object.fromEntries((employees ?? []).map((e: any) => [e.id, e]))

    if (employeeIds.length === 0) {
      return NextResponse.json({ error: 'No employees found in organization' }, { status: 404 })
    }

    // Fetch reports for all org employees in the period
    let reportsQuery = supabase
      .from('reports')
      .select(`
        id, employee_id, submission_date,
        evaluation_score, manager_overall_score,
        goals(name)
      `)
      .in('employee_id', employeeIds)
      .order('submission_date', { ascending: false })

    if (startDate) reportsQuery = reportsQuery.gte('submission_date', startDate)
    if (endDate) reportsQuery = reportsQuery.lte('submission_date', endDate)

    const { data: reports, error: reportsError } = await reportsQuery
    if (reportsError) {
      console.error('[summarize-org] Reports query error:', reportsError)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    // Fetch criterion scores for those reports
    const reportIds = (reports ?? []).map((r: any) => r.id)
    let criterionScores: any[] = []
    if (reportIds.length > 0) {
      const { data: cs } = await supabase
        .from('report_criterion_scores')
        .select('report_id, criterion_name, score')
        .in('report_id', reportIds)
      criterionScores = cs ?? []
    }

    // Build period label
    const fmt = (iso: string) =>
      new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    const periodLabel = startDate && endDate
      ? `${fmt(startDate)} – ${fmt(endDate)}`
      : startDate
        ? `From ${fmt(startDate)}`
        : endDate
          ? `Up to ${fmt(endDate)}`
          : 'All time'

    // Aggregate per-employee stats
    const employeeStats: Record<string, { name: string; role: string; dept?: string; scores: number[]; reportCount: number }> = {}
    for (const r of (reports ?? [])) {
      const emp = employeeMap[r.employee_id]
      if (!emp) continue
      if (!employeeStats[r.employee_id]) {
        employeeStats[r.employee_id] = { name: emp.name, role: emp.role, dept: emp.dept, scores: [], reportCount: 0 }
      }
      const score = r.manager_overall_score ?? r.evaluation_score
      if (score != null) employeeStats[r.employee_id].scores.push(Number(score))
      employeeStats[r.employee_id].reportCount++
    }

    // Aggregate per-criterion averages across the org
    const criterionTotals: Record<string, { total: number; count: number }> = {}
    for (const cs of criterionScores) {
      if (!criterionTotals[cs.criterion_name]) criterionTotals[cs.criterion_name] = { total: 0, count: 0 }
      criterionTotals[cs.criterion_name].total += Number(cs.score)
      criterionTotals[cs.criterion_name].count++
    }
    const criterionAverages = Object.entries(criterionTotals)
      .map(([name, { total, count }]) => `  - ${name}: ${(total / count).toFixed(2)}/10`)
      .join('\n')

    // Build per-employee summary lines
    const employeeSummaryLines = Object.values(employeeStats).map(e => {
      const avg = e.scores.length > 0
        ? (e.scores.reduce((a, b) => a + b, 0) / e.scores.length).toFixed(2)
        : 'N/A'
      return `  - ${e.name} (${e.role}${e.dept ? `, ${e.dept}` : ''}): ${e.reportCount} report(s), avg score ${avg}/10`
    })

    const totalReports = (reports ?? []).length
    const allScores = Object.values(employeeStats).flatMap(e => e.scores)
    const orgAvg = allScores.length > 0
      ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2)
      : 'N/A'

    const systemPrompt = `You are a performance analytics assistant for Zevian, a team performance platform used by managers.

Given an organization's aggregated report data for a specific period, produce a concise but insightful organization-wide performance summary.

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
- All values must be plain strings with no special characters that would break JSON
- Focus on organizational patterns, not individual employees`

    const userPrompt = `Organization: ${organizationName ?? organizationId}
Period: ${periodLabel}
Total employees: ${employeeIds.length}
Total reports submitted: ${totalReports}
Organization average score: ${orgAvg}/10

EMPLOYEE BREAKDOWN:
${employeeSummaryLines.length > 0 ? employeeSummaryLines.join('\n') : 'No reports in this period.'}

CRITERION AVERAGES (org-wide):
${criterionAverages || 'No criterion scores available.'}

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
    const parsed = JSON.parse(raw)

    return NextResponse.json({
      summary: parsed,
      meta: {
        organizationName: organizationName ?? organizationId,
        periodLabel,
        reportCount: totalReports,
        employeeCount: employeeIds.length,
        orgAvgScore: orgAvg,
        generatedAt: new Date().toISOString(),
      }
    })
  } catch (err: any) {
    console.error('[summarize-org]', err)
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}
