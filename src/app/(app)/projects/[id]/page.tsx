import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { ProjectDetailView } from '@/components/organisms/ProjectDetailView'
import { notFound } from 'next/navigation'
import { projectService, goalService } from '@/../databaseService2'

export const metadata: Metadata = { title: 'Project Details' }

export default async function ProjectPage({ params }: { params: { id: string } }) {
    const supabase = createServerClient()

    let project = null;
    let activity = [];
    let reports = [];
    let goals = [];

    try {
        const data = await projectService.getById(params.id);
        if (data) {
            // Fetch real assignments with employee details
            const assigneesData = await projectService.getAssignees(params.id);
            const members = assigneesData?.map((a: any) => ({
                employee: {
                    id: a.assignee_id,
                    full_name: a.employees?.name || 'Unknown',
                    role: a.assignee_type || 'employee'
                }
            })) || [];

            // Fetch real goals for this project
            goals = await goalService.getByProjectId(params.id);

            // Fetch real reports for this project
            reports = await projectService.getProjectReports(params.id);

            // Fetch real activity
            activity = await projectService.getRecentActivity(params.id);

            project = {
                ...data,
                frequency: data.reportFrequency || 'Weekly',
                project_members: members,
                avg_score: data.avg_score ?? null,
                status: data.status || 'active',
                report_count: data.report_count || 0,
                goal_count: data.goal_count || 0,
                total_goals: data.total_goals || 0,
                goals: goals,
                reports: reports,
                activity: activity
            };
        }
    } catch (error) {
        console.error('Failed to load project details:', error);
    }

    if (!project) {
        notFound()
    }

    // Fetch employees for selectors (like Manage Team)
    const { data: employees } = await supabase
        .from('employees')
        .select('id, name, role')
        .order('name');

    const mappedEmployees = (employees || []).map((e: any) => ({
        ...e,
        full_name: e.name
    }))

    return (
        <ProjectDetailView
            project={project}
            employees={mappedEmployees as any ?? []}
        />
    )
}
