import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createAdminClient } from '@/lib/supabase/server'
import { withRetry } from '@/lib/ai/withRetry'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

/**
 * POST /api/ai/summarize-employee
 * Generates an AI performance summary for an employee over a selected period.
 *
 * Body: { employeeId: string, startDate?: string, endDate?: string }
 */
export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured.' }, { status: 500 })
  }

  try {
    const { employeeId, startDate, endDate } = await req.json()
    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Fetch employee profile
    const { data: employeeRaw, error: empError } = await supabase
      .from('employees')
      .select('id, name, role, dept')
      .eq('id', employeeId)
      .single()

    if (empError || !employeeRaw) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const employee = employeeRaw as any

    // Fetch reports in the period
    let reportsQuery = supabase
      .from('reports')
      .select(`
        id, report_text, submission_date,
        evaluation_score, manager_overall_score,
        goals(name)
      `)
      .eq('employee_id', employeeId)
      .order('submission_date', { ascending: false })

    if (startDate) reportsQuery = reportsQuery.gte('submission_date', startDate)
    if (endDate) reportsQuery = reportsQuery.lte('submission_date', endDate)

    const { data: reports, error: reportsError } = await reportsQuery
    if (reportsError) {
      console.error('[summarize-employee] Reports query error:', reportsError)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    // Fetch goals
    const { data: goals } = await supabase
      .from('goals')
      .select('id, name, status, project:projects(name)')
      .eq('employee_id', employeeId)
      .eq('is_active', true)

    // Fetch criterion scores for the reports
    const reportIds = (reports ?? []).map((r: any) => r.id)
    let criterionScores: any[] = []
    if (reportIds.length > 0) {
      const { data: cs } = await supabase
        .from('report_criterion_scores')
        .select('report_id, criterion_name, score, evidence')
        .in('report_id', reportIds)
      criterionScores = cs ?? []
    }

    // Build structured data for the prompt
    const fmt = (iso: string) =>
      new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    const periodLabel = startDate && endDate
      ? `${fmt(startDate)} – ${fmt(endDate)}`
      : startDate
        ? `From ${fmt(startDate)}`
        : endDate
          ? `Up to ${fmt(endDate)}`
          : 'All time'

    const reportSummaries = (reports ?? []).map((r: any) => {
      const goal = Array.isArray(r.goals) ? r.goals[0] : r.goals
      const score = r.manager_overall_score ?? r.evaluation_score
      const scores = criterionScores
        .filter((cs: any) => cs.report_id === r.id)
        .map((cs: any) => `  - ${cs.criterion_name}: ${cs.score}/10${cs.evidence ? ` — "${cs.evidence}"` : ''}`)
        .join('\n')
      return `Report (${r.submission_date}) — Goal: "${goal?.name ?? 'N/A'}" — Score: ${score ?? 'N/A'}\n${scores}`
    })

    const goalSummaries = (goals ?? []).map((g: any) => {
      const project = Array.isArray(g.project) ? g.project[0] : g.project
      return `- ${g.name} [${g.status}]${project ? ` (${project.name})` : ''}`
    })

    const systemPrompt = `You are a performance analytics assistant for Zevian, a team performance platform used by managers.

Given an employee's reports and goals data for a specific period, produce a concise but insightful performance summary.

Respond ONLY with valid JSON. No markdown, no code blocks, no extra text.

Use exactly this structure:
{
  "headline": "One sentence capturing the overall performance tone",
  "overall_rating": "strong",
  "highlights": ["specific positive observation 1", "specific positive observation 2"],
  "concerns": ["specific area of concern 1"],
  "trend": "improving",
  "recommendation": "1-2 sentence coaching recommendation for the manager"
}

Rules:
- overall_rating must be exactly one of: strong, good, average, needs_improvement
- trend must be exactly one of: improving, stable, declining, insufficient_data
- highlights: 1-3 items, empty array if none
- concerns: 0-3 items, empty array if none
- All values must be plain strings with no special characters that would break JSON`

    const userPrompt = `Employee: ${employee.name} (${employee.role}${employee.dept ? `, ${employee.dept}` : ''})
Period: ${periodLabel}
Total reports: ${(reports ?? []).length}

REPORTS:
${reportSummaries.length > 0 ? reportSummaries.join('\n\n') : 'No reports in this period.'}

ACTIVE GOALS:
${goalSummaries.length > 0 ? goalSummaries.join('\n') : 'No active goals.'}

Generate a performance summary based on the above data.`

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await withRetry('summarize-employee', () => model.generateContent({
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
        employeeName: employee.name,
        periodLabel,
        reportCount: (reports ?? []).length,
        generatedAt: new Date().toISOString(),
      }
    })
  } catch (err: any) {
    console.error('[summarize-employee]', err)
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}
