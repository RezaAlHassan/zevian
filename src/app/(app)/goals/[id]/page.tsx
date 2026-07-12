import type { Metadata } from 'next'
import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { GoalDetailView } from '@/components/organisms/GoalDetailView'
import { notFound } from 'next/navigation'
import { projectService, goalService, reportService } from '@/../databaseService2'
import { formatPeriodWindow } from '@/app/actions/managerUploadShared'

export const metadata: Metadata = { title: 'KPI Details' }

export default async function GoalPage({ params }: { params: { id: string } }) {
    const supabase = createServerClient()

    let goal = null;
    let reports = [];

    try {
        const data = await goalService.getById(params.id);
        if (data) {
            const projectId = data.projectId || '';
            // Fetch real reports for this goal
            reports = await reportService.getByGoalId(params.id);

            // Fetch parent project
            let projectData = null;

            if (projectId) {
                projectData = await projectService.getById(projectId);
            }

            // Use goal-specific members from goalService (uses fetchGoalMembersMap, FK-safe).
            // Fall back to project members if no goal assignees exist.
            let members = (data as any).goal_members || [];
            if (members.length === 0 && projectId) {
                const assigneesData = await projectService.getAssignees(projectId);
                members = assigneesData?.map((a: any) => ({
                    employee: { id: a.assignee_id, full_name: a.employees?.name || 'Unknown', avatar_url: a.employees?.avatar_url ?? null }
                })) || [];
            }

            // Compute avg score from real fetched reports
            const scoredReports = reports.filter((r: any) => {
                const s = r.managerOverallScore ?? r.evaluationScore;
                return typeof s === 'number' && !isNaN(s);
            });
            const avgScore = scoredReports.length > 0
                ? Number((scoredReports.reduce((sum: number, r: any) => sum + (r.managerOverallScore ?? r.evaluationScore), 0) / scoredReports.length).toFixed(1))
                : null;

            goal = {
                ...data,
                status: data.status || 'active',
                avgScore,
                report_count: reports.length,
                goal_members: members,
                project: projectData,
                reports: reports
            };
        }
    } catch (error) {
        console.error('Failed to load goal details:', error);
    }

    if (!goal) {
        notFound()
    }

    const [{ data: projects }, { data: employees }] = await Promise.all([
        supabase.from('projects').select('id, name'),
        supabase.from('employees').select('id, name, avatar_url').eq('role', 'employee').eq('is_active', true).order('name')
    ])

    const mappedEmployees = (employees || []).map((e: any) => ({
        ...e,
        full_name: e.name
    }))

    const periodSummary = await buildPeriodSummary(params.id, goal.goal_members || [])

    return (
        <GoalDetailView
            goal={goal}
            projects={projects || []}
            employees={mappedEmployees as any || []}
            periodSummary={periodSummary}
        />
    )
}

export interface GoalPeriodSummary {
    current: { label: string; reported: number; total: number; missing: string[] } | null
    nextLabel: string | null
}

/**
 * Compute the goal's current reporting-period coverage (+ a next-period caption)
 * for the manager's Goal Detail strip. Reporting periods are per (goal, employee),
 * so we group them into date windows and pick the window covering "now" (or the
 * most recent past one). Uses the admin client — scoped by goal_id — so coverage
 * reflects the whole team, not just rows RLS would expose to the viewer.
 */
async function buildPeriodSummary(goalId: string, members: any[]): Promise<GoalPeriodSummary | null> {
    try {
        const admin = createAdminClient()
        const { data: prs } = await (admin as any)
            .from('reporting_periods')
            .select('id, employee_id, period_start, period_end, status, report_id')
            .eq('goal_id', goalId)
            .neq('status', 'void')

        if (!prs || prs.length === 0) return null

        const nameOf = new Map<string, string>()
        for (const m of members) {
            const emp = m.employee
            if (emp?.id) nameOf.set(emp.id, emp.full_name || emp.name || 'Unknown')
        }

        const windowKey = (ps: string) => new Date(ps).toISOString().slice(0, 10)
        const windows = new Map<string, any[]>()
        for (const p of prs) {
            const k = windowKey(p.period_start)
            const arr = windows.get(k) || []
            arr.push(p)
            windows.set(k, arr)
        }

        const now = Date.now()
        const winList = [...windows.values()].map(rows => ({
            periodStart: rows[0].period_start,
            periodEnd: rows[0].period_end,
            startMs: new Date(rows[0].period_start).getTime(),
            endMs: new Date(rows[0].period_end).getTime(),
            rows,
        }))

        const containing = winList.find(w => w.startMs <= now && now <= w.endMs)
        const mostRecentPast = winList
            .filter(w => w.endMs <= now)
            .sort((a, b) => b.endMs - a.endMs)[0]
        const latest = [...winList].sort((a, b) => b.startMs - a.startMs)[0]
        const current = containing || mostRecentPast || latest || null

        const next = winList
            .filter(w => w.startMs > now)
            .sort((a, b) => a.startMs - b.startMs)[0] || null

        let cur: GoalPeriodSummary['current'] = null
        if (current) {
            const total = current.rows.length
            const reported = current.rows.filter((r: any) => r.report_id).length
            const missing = current.rows
                .filter((r: any) => !r.report_id && r.status !== 'excused')
                .map((r: any) => nameOf.get(r.employee_id) || 'Unknown')
            cur = { label: formatPeriodWindow(current.periodStart, current.periodEnd), reported, total, missing }
        }

        return {
            current: cur,
            nextLabel: next ? formatPeriodWindow(next.periodStart, next.periodEnd) : null,
        }
    } catch (e) {
        console.error('buildPeriodSummary failed:', e)
        return null
    }
}
