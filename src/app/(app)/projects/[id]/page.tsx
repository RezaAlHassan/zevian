import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { ProjectDetailView } from '@/components/organisms/ProjectDetailView'
import { notFound } from 'next/navigation'
import { projectService, goalService, employeeService } from '@/../databaseService2'

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
            const [
                assigneesData,
                fetchedGoals,
                fetchedReports,
                fetchedActivity
            ] = await Promise.all([
                projectService.getAssignees(params.id),
                goalService.getByProjectId(params.id),
                projectService.getProjectReports(params.id),
                projectService.getRecentActivity(params.id)
            ]);

            const members = assigneesData?.map((a: any) => ({
                employee: {
                    id: a.assignee_id,
                    full_name: a.employees?.name || 'Unknown',
                    role: a.assignee_type || 'employee'
                }
            })) || [];

            goals = fetchedGoals;
            reports = fetchedReports;
            activity = fetchedActivity;

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
        .eq('role', 'manager')
        .eq('is_active', true)
        .order('name');

    const mappedEmployees = (employees || []).map((e: any) => ({
        ...e,
        full_name: e.name
    }))

    // Fetch current user permissions
    const { data: { user } } = await supabase.auth.getUser()
    let readOnly = false
    if (user) {
        const currentEmployee = await employeeService.getByAuthId(user.id)
        if (currentEmployee && currentEmployee.role === 'manager' && !currentEmployee.isAccountOwner) {
            readOnly = !currentEmployee.permissions?.canCreateProjects && !currentEmployee.permissions?.canCreateGoals
        }
    }

    return (
        <ProjectDetailView
            project={project}
            employees={mappedEmployees as any ?? []}
            readOnly={readOnly}
        />
    )
}
