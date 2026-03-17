'use server'

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { reportService, employeeService, projectService, goalService, customMetricService, organizationService } from '@/../databaseService2'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function getReportsByManagerAction() {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.error('Auth Error:', authError)
            return { error: 'Not authenticated' }
        }

        // Get employee by auth_user_id
        const employee = await employeeService.getByAuthId(user.id)
        if (!employee) {
            return { error: 'Employee record not found' }
        }

        if (employee.role !== 'manager') {
            // For non-managers, they might only see their own reports 
            // but the user's request specificially asked for "manager's direct report there"
            // So for now we focus on the manager view.
            return { reports: [], kpis: { totalReports: 0, avgScore: 0, pendingReview: 0, overrides: 0 } }
        }

        const reports: any[] = await reportService.getManagerReports(employee.id)

        // Calculate KPIs
        const totalReports = reports.length
        const scoredReports = reports.filter((r: any) => r.evaluationScore !== null)
        const avgScore = scoredReports.length > 0
            ? scoredReports.reduce((acc: number, r: any) => acc + (r.evaluationScore || 0), 0) / scoredReports.length
            : 0
        const pendingReview = reports.filter((r: any) => !r.reviewedBy).length
        const overrides = reports.filter((r: any) => r.managerOverallScore !== null).length

        return {
            reports,
            kpis: {
                totalReports,
                avgScore: Number(avgScore.toFixed(1)),
                pendingReview,
                overrides
            }
        }
    } catch (error) {
        console.error('getReportsByManagerAction Error:', error)
        return { error: 'Failed to fetch reports' }
    }
}

export async function getMyReportsAction() {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { error: 'Not authenticated' }
        }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee) {
            return { error: 'Employee record not found' }
        }

        const reports = await reportService.getEmployeeReports(employee.id)

        const scoredReports = reports.filter((r: any) => r.evaluationScore !== null)
        const avgScore = scoredReports.length > 0
            ? scoredReports.reduce((acc: number, r: any) => acc + (r.evaluationScore || 0), 0) / scoredReports.length
            : 0

        return {
            reports,
            kpis: {
                totalReports: reports.length,
                avgScore: Number(avgScore.toFixed(1)),
                pendingReview: reports.filter((r: any) => !r.reviewedBy).length,
                overrides: reports.filter((r: any) => r.managerOverallScore !== null).length
            }
        }
    } catch (error) {
        console.error('getMyReportsAction Error:', error)
        return { error: 'Failed to fetch your reports' }
    }
}

export async function getReportDetailAction(reportId: string) {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return { error: 'Not authenticated' }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee) return { error: 'Employee record not found' }

        const report = await reportService.getById(reportId)
        if (!report) return { error: 'Report not found' }

        // Check permission: manager of the employee or the employee themselves
        if (employee.role !== 'manager' && report.employeeId !== employee.id) {
             // Check if manager
             const reportEmployee = await employeeService.getById(report.employeeId!)
             if (reportEmployee.managerId !== employee.id) {
                 return { error: 'Unauthorized to view this report' }
             }
        }

        return { success: true, report }
    } catch (error) {
        console.error('getReportDetailAction Error:', error)
        return { error: 'Failed to fetch report detail' }
    }
}

export async function getSubmitReportDataAction() {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return { error: 'Not authenticated' }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee) return { error: 'Employee record not found' }

        if (!employee.organizationId) return { error: 'Employee organization not found' }

        const [projects, goals, customMetrics] = await Promise.all([
            projectService.getByEmployeeId(employee.id),
            goalService.getByEmployeeId(employee.id),
            customMetricService.getByOrganizationId(employee.organizationId)
        ])

        // Only include projects that actually have goals assigned to this employee
        const employeeGoalProjectIds = new Set(goals.map((g: any) => g.projectId))
        const filteredProjects = projects.filter((p: any) => employeeGoalProjectIds.has(p.id))

        return {
            success: true,
            data: {
                projects: filteredProjects,
                goals: goals,
                metrics: customMetrics,
                employeeId: employee.id
            }
        }
    } catch (error) {
        console.error('getSubmitReportDataAction Error:', error)
        return { error: 'Failed to fetch submission data' }
    }
}

export async function submitReportAction(reportData: {
    goalId: string,
    reportText: string,
    employeeId: string,
    evaluationScore: number,
    evaluationReasoning: string,
    criterionScores: any[]
}) {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return { error: 'Not authenticated' }

        const report = await reportService.create({
            id: `report-${Date.now()}`,
            goalId: reportData.goalId,
            employeeId: reportData.employeeId,
            reportText: reportData.reportText,
            submissionDate: new Date().toISOString(),
            evaluationScore: reportData.evaluationScore,
            evaluationReasoning: reportData.evaluationReasoning,
            criterionScores: reportData.criterionScores
        })

        return { success: true, report }
    } catch (error) {
        console.error('submitReportAction Error:', error)
        return { error: 'Failed to submit report' }
    }
}

export async function analyzeReportAction(data: {
    reportText: string,
    goals: any[],
    metrics: any[],
    projectId?: string
}) {
    try {
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) throw new Error('GEMINI_API_KEY is missing')

        const adminClient = createAdminClient()
        const authClient = createServerClient()

        // 1. Fetch Organization Weights
        let goalWeight = 70; // Default
        const employee = await (async () => {
            const { data: { user } } = await authClient.auth.getUser()
            if (!user) return null
            return await employeeService.getByAuthId(user.id)
        })()

        if (employee?.organizationId) {
            const org = await organizationService.getById(employee.organizationId)
            if (org.goalWeight !== undefined) {
                goalWeight = org.goalWeight
            }
        }

        // 2. Fetch Knowledgebase Context
        let kbContext = "";
        if (data.projectId) {
            const { data: pins } = await adminClient
                .from('knowledge_pins')
                .select('content, section')
                .eq('project_id', data.projectId);
            
            if (pins && pins.length > 0) {
                kbContext = (pins as any[]).map(p => `[${p.section.toUpperCase()}]: ${p.content}`).join('\n');
            } else {
                // Fallback to project description/context if no pins
                const project = await projectService.getById(data.projectId);
                kbContext = `Project Description: ${project.description || ''}\nAI Context: ${project.aiContext || ''}`;
            }
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        // Ensure consistent model use
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        // Build prompt
        const goalsJson = JSON.stringify(data.goals.map(g => ({
            id: g.id,
            name: g.name,
            instructions: g.instructions,
            criteria: g.criteria
        })))

        const metricsJson = JSON.stringify(data.metrics.map(m => ({
            name: m.name,
            description: m.description || m.desc
        })))

        const prompt = `You are an AI performance analyst. Analyze the following employee report and score it against the selected goals, organizational metrics, and project knowledgebase.

REPORT:
"${data.reportText}"

GOALS & CRITERIA:
${goalsJson}

ORG METRICS:
${metricsJson}

PROJECT KNOWLEDGEBASE CONTEXT (GROUNDING):
${kbContext}

EVALUATION RULES:
1. Score each goal's criteria (0-10) and each org metric (0-10) GROUNDED in the project knowledgebase context.
2. The Knowledgebase itself is NOT a separate score; it is the source of truth for lexicons, benchmarks, and constraints that calibrate the other scores.
3. Provide a brief reasoning for each criteria, the overall goal, and each org metric.
4. Weights for goal criteria are provided in the goals JSON.

Return ONLY a JSON object in this format:
{
  "goals": [
    {
      "id": "goal_id",
      "name": "goal_name",
      "score": 8.5,
      "reason": "Overall goal reasoning",
      "criteria": [
        { "name": "criterion_name", "score": 8.0, "reason": "Criterion reasoning", "evidence": "Short snippet from report" }
      ]
    }
  ],
  "orgMetrics": [
    { "name": "metric_name", "score": 7.5, "reason": "Metric reasoning" }
  ],
  "weights": {
    "goalWeight": ${goalWeight},
    "orgWeight": ${100 - goalWeight},
    "kbWeight": 0
  },
  "summary": "A 2-3 sentence AI summary of the overall performance."
}`

        let result: any;
        let retries = 3;
        let delay = 2000;

        while (retries > 0) {
            try {
                result = await model.generateContent(prompt);
                break; // Success
            } catch (err: any) {
                const isRateLimit = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('Too Many Requests');
                if (isRateLimit && retries > 1) {
                    console.warn(`[analyzeReportAction] Rate limit hit. Retrying in ${delay}ms... (${retries - 1} retries left)`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    retries--;
                    delay *= 2;
                } else {
                    throw err;
                }
            }
        }
        
        const response = await result.response
        const text = response.text()
        
        // Clean markdown if present
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const analysis = JSON.parse(cleanText)

        return { success: true, analysis }
    } catch (error: any) {
        console.error('analyzeReportAction Error:', error)
        const isRateLimit = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Too Many Requests') || error?.message?.includes('Quota');
        
        if (isRateLimit) {
            return { error: 'AI Analysis is currently busy due to high traffic or quota limits. Please try again in a minute.' }
        }
        
        return { error: 'Analysis failed' }
    }
}
