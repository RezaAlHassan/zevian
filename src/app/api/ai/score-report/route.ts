import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createAdminClient } from '@/lib/supabase/server'
import { DEFAULT_ORG_METRICS } from '@/constants/metrics'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

/**
 * POST /api/ai/score-report
 * Server-side only — Gemini API key never reaches the browser.
 *
 * Body: { reportId: string }
 *
 * Flow:
 *  1. Fetch report + goal + criteria from Supabase
 *  2. Build prompt with goal instructions + criteria weights
 *  3. Call Gemini 2.5 Flash
 *  4. Parse JSON scores
 *  5. Write criterion_scores + overall score back to Supabase
 *  6. Return scores to client
 */
export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing from environment variables.")
    }

    const { reportId } = await req.json()
    if (!reportId) return NextResponse.json({ error: 'reportId required' }, { status: 400 })

    const supabase = createAdminClient()

    // 1. Fetch report data
    const { data: report, error } = await supabase
      .from('reports')
      .select(`
        id, content,
        employee_id,
        goal:goals(
          id, name, instructions, project_id,
          criteria(id, name, weight)
        )
      `)
      .eq('id', reportId)
      .single()

    if (error || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const r = report as any;
    const goal = Array.isArray(r.goal) ? r.goal[0] : r.goal;
    const criteria = goal?.criteria ?? [];
    const projectId = goal?.project_id;

    // 1.5 Fetch Org Weights & KB Context
    let goalWeight = 70;
    let selectedMetricIds: string[] = [];
    let kbContext = "";

    const { data: employee } = await supabase.from('employees').select('organization_id').eq('id', r.employee_id).single();
    if (employee && (employee as any).organization_id) {
        const orgId = (employee as any).organization_id;
        const { data: org } = await supabase.from('organizations').select('goal_weight, selected_metrics').eq('id', orgId).single();
        if (org) {
            if ((org as any).goal_weight !== undefined) goalWeight = (org as any).goal_weight;
            if ((org as any).selected_metrics) selectedMetricIds = (org as any).selected_metrics;
        }
    }

    // Fetch metric details (descriptions)
    const activeMetrics = DEFAULT_ORG_METRICS.filter(m => selectedMetricIds.includes(m.id));
    
    // Also fetch custom metrics
    const { data: customMetrics } = await supabase
        .from('organization_custom_metrics')
        .select('name, description')
        .eq('organization_id', (employee as any).organization_id)
        .eq('is_active', true);
    
    const allOrgMetrics = [
        ...activeMetrics.map(m => ({ name: m.name, description: m.desc })),
        ...(customMetrics || []).map((m: any) => ({ name: m.name, description: m.description }))
    ];

    const metricsList = allOrgMetrics.map(m => `- ${m.name}: ${m.description}`).join('\n');

    if (projectId) {
        const { data: pins } = await supabase.from('knowledge_pins').select('content, section').eq('project_id', projectId);
        if (pins && pins.length > 0) {
            kbContext = (pins as any[]).map(p => `[${p.section.toUpperCase()}]: ${p.content}`).join('\n');
        }
    }

    // 2. Build scoring prompt
    const criteriaList = criteria
      .map((c: any) => `- ${c.name} (weight: ${c.weight}%)`)
      .join('\n')

    const promptText = `You are an objective performance evaluator for a remote team manager.

GOAL: ${goal?.name}

EVALUATION INSTRUCTIONS:
${goal?.instructions}

CRITERIA TO SCORE (weights must sum to 100%):
${criteriaList}

ORGANIZATIONAL METRICS:
${metricsList}

PROJECT KNOWLEDGEBASE CONTEXT (GROUNDING):
${kbContext}

EMPLOYEE REPORT:
${r.content}

EVALUATION RULES:
1. Score each criterion (0-10) based on the report content and goal instructions, GROUNDED in the project knowledgebase context.
2. Score each organizational metric (0-10) listed above, referencing the KB standards where applicable.
3. Be objective, consistent, and specific.
4. The Knowledgebase itself is NOT a separate score; it is the source of truth for lexicons, benchmarks, and constraints that calibrate the other scores.

Respond ONLY with valid JSON in this exact format:
{
  "criterion_scores": [
    { "criterion_id": "<id>", "score": 8.5, "feedback": "One sentence explanation" }
  ],
  "org_metrics": [
    { "name": "metric_name", "score": 7.5, "reason": "..." }
  ],
  "overall_score": 0.0, 
  "summary": "2-3 sentence AI summary of overall performance, highlighting KB alignment or deviations"
}`

    // 3. Call Gemini with retry logic for 429 Too Many Requests
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    let result: any;
    let retries = 3;
    let delay = 2000;

    while (retries > 0) {
      try {
        result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.1, // Low temp for consistent scoring
            responseMimeType: "application/json" // Force JSON response if supported
          }
        })
        break; // Success, exit retry loop
      } catch (err: any) {
        // Check for 429 status or Too Many Requests in message
        const isRateLimit = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('Too Many Requests');
        
        if (isRateLimit && retries > 1) {
          console.warn(`[score-report] Rate limit hit. Retrying in ${delay}ms... (${retries - 1} retries left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries--;
          delay *= 2; // Exponential backoff
        } else {
          throw err; // Re-throw if it's not a 429 or we ran out of retries
        }
      }
    }

    // 4. Parse response
    const raw = result.response.text()
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())

    // Recalculate overall_score with org weights
    const { criterion_scores, org_metrics, summary } = parsed
    let overall_score = 0;
    
    // 1. Goal Average
    const goalAvg = (criterion_scores?.length) 
        ? criterion_scores.reduce((acc: number, cs: any) => acc + cs.score, 0) / criterion_scores.length
        : 0;

    // 2. Org Metrics Average
    const orgAvg = (org_metrics?.length)
        ? org_metrics.reduce((acc: number, m: any) => acc + m.score, 0) / org_metrics.length
        : 0;

    // 3. Apply Weights: Goal(G%) + Org(100-G%)
    const orgWeight = 100 - goalWeight;
    const finalScore = (goalAvg * (goalWeight / 100)) + (orgAvg * (orgWeight / 100));
    
    overall_score = Number(finalScore.toFixed(2));

    // Insert per-criterion scores
    if (criterion_scores?.length) {
      await supabase.from('criterion_scores').upsert(
        criterion_scores.map((cs: any) => ({
          report_id: reportId,
          criterion_id: cs.criterion_id,
          score: cs.score,
          ai_feedback: cs.feedback,
        }))
      )
    }

    // Update overall report score
    const updatePayload: any = { evaluation_score: overall_score, ai_summary: summary, status: 'reviewed' };
    await (supabase.from('reports') as any)
      .update(updatePayload)
      .eq('id', reportId)

    return NextResponse.json({ overall_score, criterion_scores, summary })

  } catch (err: any) {
    console.error('[score-report]', err)
    const isRateLimit = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('Too Many Requests') || err?.message?.includes('Quota');
    
    if (isRateLimit) {
      return NextResponse.json({ error: 'AI Evaluation is currently busy due to high traffic or quota limits. Please try again in a minute.' }, { status: 429 })
    }
    
    return NextResponse.json({ error: 'Scoring failed' }, { status: 500 })
  }
}
