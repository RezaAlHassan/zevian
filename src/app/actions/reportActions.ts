'use server'

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { reportService, employeeService, projectService, goalService, customMetricService, organizationService, notificationService } from '@/../databaseService2'
import { DEFAULT_ORG_METRICS } from '@/constants/metrics'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { revalidatePath } from 'next/cache'
import { getPeriodKey } from '@/utils/reportPeriod'
import { withRetry } from '@/lib/ai/withRetry'

export async function getReportsByManagerAction(view: 'org' | 'direct' = 'org', startDate?: string, endDate?: string) {
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

        if (employee.role !== 'manager' && employee.role !== 'admin' && !employee.isAccountOwner) {
            // For non-managers, they might only see their own reports
            return { reports: [], kpis: { totalReports: 0, avgScore: 0, pendingReview: 0, overrides: 0 } }
        }

        // Enforce: non-senior managers cannot use org view
        const isSenior = employee.isAccountOwner ||
            employee.role === 'admin' ||
            (employee.permissions?.canViewOrganizationWide ?? false)
        const safeView = (!isSenior && view === 'org') ? 'direct' : view

        const reports: any[] = await reportService.getManagerReports(employee.id, safeView, employee.organizationId, startDate, endDate)

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

export async function getMyReportsAction(startDate?: string, endDate?: string) {
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

        const reports = await reportService.getEmployeeReports(employee.id, startDate, endDate)

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

export async function getEligibleGoalsAction(employeeId: string, projectId: string, submissionDate: string) {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return { error: 'Not authenticated' }

        // 1. Get all assigned goals for this employee
        const allGoals = await goalService.getByEmployeeId(employeeId)
        
        // 2. Filter by project and active status
        const projectGoals = allGoals.filter((g: any) => g.projectId === projectId && g.status === 'active')
        if (projectGoals.length === 0) return { success: true, data: [] }

        // 3. Find if any reports exist for these goals on this exact submittedForDate
        const { data: existingReports } = await (supabase as any)
            .from('reports')
            .select('goal_id')
            .eq('employee_id', employeeId)
            .in('goal_id', projectGoals.map((g: any) => g.id))
            .eq('submitted_for_date', submissionDate)

        const submittedForDateGoalIds = new Set(existingReports?.map((r: any) => r.goal_id) || [])

        // 4. Determine if it's backdated (using exact boundary logic from submitReportAction)
        const nowIso = new Date().toISOString()
        const todayStr = nowIso.slice(0, 10)
        const isBackdated = submissionDate < todayStr
        const selectedDate = submissionDate.includes('T') ? new Date(submissionDate) : new Date(submissionDate + 'T00:00:00Z')

        const { findMatchingPeriod, findPeriodForBackdatedSubmission } = await import('@/lib/reportingPeriods')

        // Safety net: ensure periods exist for this employee before checking eligibility.
        // Handles cases where an employee was added to a goal after their initial onboarding.
        const { ensurePeriodsExistForEmployee } = await import('@/lib/reportingPeriodsMaintenance')
        await ensurePeriodsExistForEmployee(employeeId).catch(err =>
            console.error('[getEligibleGoalsAction] ensurePeriodsExistForEmployee failed:', err)
        )

        // 5. Use the exact matching logic for each goal
        const eligibleGoals = []

        for (const goal of projectGoals) {
            // If they already submitted a report specifically on this day, hide it
            if (submittedForDateGoalIds.has(goal.id)) continue

            if (isBackdated) {
                const managerId = goal.managerId || ''
                const result = await findPeriodForBackdatedSubmission(
                    goal.id,
                    employeeId,
                    managerId,
                    selectedDate,
                )
                // If it resolves to a valid period, check if it's already submitted
                if (result.ok && !result.period.reportId) {
                    eligibleGoals.push(goal)
                }
            } else {
                const { data: msData } = await (supabase as any)
                    .from('manager_settings')
                    .select('allow_late_submissions, grace_period_days')
                    .eq('manager_id', goal.managerId || '')
                    .maybeSingle()
                
                const graceDays = msData?.grace_period_days ?? 0
                const match = await findMatchingPeriod(goal.id, employeeId, new Date(), graceDays)
                
                // If match is found and reportId is null, it's eligible!
                // Even if "match.period.status === 'submitted'", we trust reportId as the source of truth
                if (match && !match.period.reportId) {
                    eligibleGoals.push(goal)
                }
            }
        }

        return { success: true, data: eligibleGoals }
    } catch (error) {
        console.error('getEligibleGoalsAction Error:', error)
        return { error: 'Failed to fetch eligible goals' }
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

        const [projects, goals, customMetrics, organization] = await Promise.all([
            projectService.getByEmployeeId(employee.id),
            goalService.getByEmployeeId(employee.id),
            customMetricService.getByOrganizationId(employee.organizationId),
            organizationService.getById(employee.organizationId)
        ])

        const selectedMetricIds: string[] = organization.selectedMetrics ?? []
        const activeDefaultMetrics = DEFAULT_ORG_METRICS
            .filter(m => selectedMetricIds.includes(m.id))
            .map(m => ({ id: m.id, name: m.name, description: m.desc, isActive: true }))
        const activeCustomMetrics = customMetrics.filter((m: any) => m.isActive !== false)
        const allMetrics = [...activeDefaultMetrics, ...activeCustomMetrics]

        // Only include projects that actually have goals assigned to this employee
        const employeeGoalProjectIds = new Set(goals.map((g: any) => g.projectId))
        const filteredProjects = projects.filter((p: any) => employeeGoalProjectIds.has(p.id))

        // Fetch active periods for deadline display — include missed so goals don't vanish
        // from the urgentGoals sidebar while waiting for the next period to be generated.
        const { data: pendingPeriods } = await (supabase as any)
            .from('reporting_periods')
            .select('*')
            .eq('employee_id', employee.id)
            .in('status', ['pending', 'submitted', 'late', 'missed'])
            .order('period_end', { ascending: true })

        // Fetch manager backdate settings for the employee's manager
        let backdateSettings: { allowLateSubmissions: boolean; backdateLimitDays: number | null, gracePeriodDays: number } = {
            allowLateSubmissions: true,
            backdateLimitDays: null,
            gracePeriodDays: 0,
        }
        if (employee.managerId) {
            const { data: ms } = await (supabase as any)
                .from('manager_settings')
                .select('allow_late_submissions, backdate_limit_days, grace_period_days')
                .eq('manager_id', employee.managerId)
                .maybeSingle()
            if (ms) {
                backdateSettings = {
                    allowLateSubmissions: ms.allow_late_submissions ?? true,
                    backdateLimitDays: ms.backdate_limit_days ?? null,
                    gracePeriodDays: ms.grace_period_days ?? 0,
                }
            }
        }

        return {
            success: true,
            data: {
                projects: filteredProjects,
                goals: goals,
                metrics: allMetrics,
                employeeId: employee.id,
                aiConfig: organization.aiConfig,
                goalWeight: organization.goalWeight ?? 70,
                backdateSettings: backdateSettings,
                pendingPeriods: pendingPeriods || []
            }
        }
    } catch (error) {
        console.error('getSubmitReportDataAction Error:', error)
        return { error: 'Failed to fetch submission data' }
    }
}

export async function submitReportAction(reportData: {
    goalIds: string[];
    reportText: string;
    employeeId: string;
    submissionDate?: string;   // YYYY-MM-DD or ISO — the date the employee selected
    evaluationScore: number;
    evaluationReasoning: string;
    criterionScores: { goalId: string; criterionName: string; score: number; reasoning: string; evidence?: string }[];
}) {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return { error: 'Not authenticated' }

        const nowIso = new Date().toISOString()
        // The date the employee selected (defaults to today)
        const selectedDateStr = reportData.submissionDate || nowIso.slice(0, 10)
        const selectedDate = selectedDateStr.includes('T') ? new Date(selectedDateStr) : new Date(selectedDateStr + 'T00:00:00Z')

        // Determine if this is a backdated submission (selected date < today in UTC)
        const todayStr = nowIso.slice(0, 10)
        const isBackdated = selectedDateStr < todayStr

        const { findMatchingPeriod, findPeriodForBackdatedSubmission, markPeriodSubmitted } = await import('@/lib/reportingPeriods')

        // ── 1. Period validation for each goal ────────────────────────────────
        type PeriodMatch = { periodId: string; isLate: boolean; goalId: string; backdatedAfterMissed: boolean }
        const periodMatches: PeriodMatch[] = []

        for (const goalId of reportData.goalIds) {
            const goal = await goalService.getById(goalId)
            if (!goal) continue

            // EXTRA DOUBLE-CLICK/RACE-CONDITION CHECK (New Requirement)
            // If a submitted period is found covering the submitted date, reject.
            const isoCheckDate = selectedDateStr + 'T00:00:00Z'
            const { data: dupPeriods } = await (supabase as any)
                .from('reporting_periods')
                .select('id')
                .eq('employee_id', reportData.employeeId)
                .eq('goal_id', goalId)
                .not('report_id', 'is', null)
                .lte('period_start', isoCheckDate)
                .gt('period_end', isoCheckDate)
                .limit(1)

            if (dupPeriods && dupPeriods.length > 0) {
                 return { error: `A report already exists for this goal in the current reporting period.` }
            }

            if (isBackdated) {
                // ── BACKDATED PATH ─────────────────────────────────
                const managerId = goal.managerId || ''
                const result = await findPeriodForBackdatedSubmission(
                    goalId,
                    reportData.employeeId,
                    managerId,
                    selectedDate,
                )
                if (!result.ok) {
                    return { error: result.error }
                }
                periodMatches.push({
                    periodId: result.period.id,
                    isLate: result.isLate,
                    goalId,
                    backdatedAfterMissed: result.wasAlreadyMissed,
                })
            } else {
                // ── CURRENT SUBMISSION PATH ────────────────────────
                // Fetch manager settings first to get grace_period_days
                const { data: msData } = await (supabase as any)
                    .from('manager_settings')
                    .select('allow_late_submissions, grace_period_days')
                    .eq('manager_id', goal?.managerId || '')
                    .maybeSingle()

                const graceDays = msData?.grace_period_days ?? 0
                const allowLate = msData?.allow_late_submissions ?? true

                // Use real submission time for current-period matching
                const match = await findMatchingPeriod(goalId, reportData.employeeId, new Date(), graceDays)
                if (!match) continue

                if (match.isLate && !allowLate) {
                    return { error: `Late submissions are not accepted for "${goal?.name}". The deadline for this period has passed.` }
                }

                if (match.period.status === 'submitted') {
                    return { error: `A report for "${goal?.name || goalId}" has already been submitted for this period.` }
                }
                
                if (match.period.reportId) {
                     return { error: `Duplicate submission detected for "${goal?.name || goalId}".` }
                }
                
                // Let's also check if a report exists for this employee, goal, and submittedForDate
                const { data: existing } = await (supabase as any)
                    .from('reports')
                    .select('id')
                    .eq('employee_id', reportData.employeeId)
                    .eq('goal_id', goalId)
                    .eq('submitted_for_date', selectedDateStr)
                    .limit(1)
                
                if (existing && existing.length > 0) {
                     return { error: `A report for "${goal?.name || goalId}" has already been submitted on ${selectedDateStr}.` }
                }

                periodMatches.push({ periodId: match.period.id, isLate: match.isLate, goalId, backdatedAfterMissed: false })
            }
        }

        // ── 2. Create reports for each goal ───────────────────────────────────
        // For backdated: submission_date = the start of the selected day (for period matching)
        // submitted_at = real now; submitted_for_date = selected date; is_backdated = true
        const results = await Promise.all(reportData.goalIds.map(async (goalId) => {
            const goalSpecificScores = reportData.criterionScores.filter(s => s.goalId === goalId)

            const reportRecord: any = {
                id: `report-${goalId}-${Date.now()}`,
                goalId,
                employeeId: reportData.employeeId,
                reportText: reportData.reportText,
                // Always use real now as the canonical submission_date on the DB record
                submissionDate: nowIso,
                submittedForDate: selectedDateStr,
                evaluationScore: reportData.evaluationScore,
                evaluationReasoning: reportData.evaluationReasoning,
                criterionScores: goalSpecificScores,
            }

            // Patch report for backdated audit trail — store direct via supabase
            // after reportService.create returns (can't extend the generic create easily)
            const saved = await reportService.create(reportRecord)

            if (isBackdated && saved?.id) {
                await (supabase as any)
                    .from('reports')
                    .update({
                        submitted_for_date: selectedDateStr,
                        submitted_at: nowIso,
                        is_backdated: true,
                    })
                    .eq('id', saved.id)
            }

            return saved
        }))

        // ── 3. Update matched periods ──────────────────────────────────────────
        for (const { periodId, isLate, goalId, backdatedAfterMissed } of periodMatches) {
            const savedReport = results.find((r: any) => r?.goalId === goalId || r?.goal_id === goalId)
            if (savedReport) {
                await markPeriodSubmitted(periodId, savedReport.id, isLate, backdatedAfterMissed)
            }
        }

        // ── 4. Clear cache ──────────────────────────────────────────────────
        revalidatePath('/(employee)/my-reports', 'layout')
        revalidatePath('/(employee)/my-reports/submit', 'page')
        revalidatePath('/(employee)/my-dashboard', 'layout')
        revalidatePath('/(app)/employees', 'layout')

        return { success: true, count: results.length }
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

        const result = await withRetry(
            'analyzeReportAction',
            () => model.generateContent(prompt)
        );
        
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

export async function overrideReportScoreAction(reportId: string, newScore: number, reason: string) {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return { error: 'Not authenticated' }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee || (employee.role !== 'manager' && employee.role !== 'admin')) {
            return { error: 'Unauthorized: Only managers can override scores' }
        }

        const report = await reportService.getById(reportId)
        if (!report) return { error: 'Report not found' }

        // Security check: direct manager OR org-wide permission
        const reportOwner = await employeeService.getById(report.employeeId!)
        const isDirectManager = reportOwner.managerId === employee.id
        const hasOrgWideAccess = employee.isAccountOwner ||
            employee.role === 'admin' ||
            (employee.permissions?.canViewOrganizationWide ?? false)

        if (!isDirectManager && !hasOrgWideAccess) {
            return { error: 'Unauthorized: You are not the manager for this employee' }
        }

        const updatedReport = await reportService.update(reportId, {
            managerOverallScore: newScore,
            managerOverrideReasoning: reason,
            reviewedBy: employee.id
        })

        // Create notification for employee using admin client to bypass RLS
        const adminSupabase = createAdminClient()
        await (adminSupabase as any).from('notifications').insert({
            user_id: report.employeeId!,
            type: 'alert',
            title: 'Report Score Adjusted',
            message: `Your manager has reviewed and overridden the AI score for your report on "${report.goals?.name || 'a goal'}".`,
            link_url: `/my-reports/${reportId}`
        })

        return { success: true, report: updatedReport }
    } catch (error) {
        console.error('overrideReportScoreAction Error:', error)
        return { error: 'Failed to save score override' }
    }
}
