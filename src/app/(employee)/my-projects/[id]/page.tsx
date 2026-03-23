import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { ProjectDetailView } from '@/components/organisms/ProjectDetailView'
import { notFound } from 'next/navigation'
import { projectService, goalService, employeeService } from '@/../databaseService2'

export const metadata: Metadata = { title: 'Project Details | Zevian' }

export default async function EmployeeProjectPage({ params }: { params: { id: string } }) {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) notFound()

    const [employee, data, { data: employeesData }] = await Promise.all([
        employeeService.getByAuthId(user.id),
        projectService.getById(params.id),
        supabase.from('employees').select('id, name, role').order('name')
    ]);

    if (!employee || !data) notFound()

    let project = null;
    let goals = [];
    let reports = [];
    let activity = [];

    try {
        if (data) {
            const [assigneesData, fetchedGoals, fetchedReports, fetchedActivity] = await Promise.all([
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
            // Filter reports to only show current employee's reports
            reports = fetchedReports.filter((r: any) => r.employeeId === employee.id);
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
                goals,
                reports,
                activity
            };
        }
    } catch (error) {
        console.error('Failed to load project details:', error);
    }

    if (!project) notFound()

    const mappedEmployees = (employeesData || []).map((e: any) => ({
        ...e,
        full_name: e.name
    }))

    return (
        <ProjectDetailView
            project={project}
            employees={mappedEmployees as any ?? []}
            readOnly={true}
            basePath="/my-projects"
            goalBasePath="/my-goals"
        />
    )
}
