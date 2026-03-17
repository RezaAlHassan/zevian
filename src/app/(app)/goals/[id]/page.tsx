import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { GoalDetailView } from '@/components/organisms/GoalDetailView'
import { notFound } from 'next/navigation'
import { projectService, goalService, reportService } from '@/../databaseService2'

export const metadata: Metadata = { title: 'Goal Details' }

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
                    employee: { id: a.assignee_id, full_name: a.employees?.name || 'Unknown' }
                })) || [];
            }

            // Compute avg score from real fetched reports
            const scoredReports = reports.filter((r: any) => typeof r.evaluationScore === 'number' && !isNaN(r.evaluationScore));
            const avgScore = scoredReports.length > 0
                ? Number((scoredReports.reduce((sum: number, r: any) => sum + r.evaluationScore, 0) / scoredReports.length).toFixed(1))
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
        supabase.from('employees').select('id, name').order('name')
    ])

    const mappedEmployees = (employees || []).map((e: any) => ({
        ...e,
        full_name: e.name
    }))

    return (
        <GoalDetailView
            goal={goal}
            projects={projects || []}
            employees={mappedEmployees as any || []}
        />
    )
}
