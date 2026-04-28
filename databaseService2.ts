import { supabase } from './supabaseClient';
import type { Project, Goal, Report, Employee, Organization, Notification, CustomMetric, Leave, ManagerSettings } from './src/types';
import { isReportLate, getNextReportDueDate } from './src/utils/reportDueDate';
import { calculateComplianceStreak } from './src/lib/complianceHelpers';
import { getSkillCategory } from './src/lib/skillThresholds';

// ============================================================================
// ORGANIZATIONS SERVICE (Multi-Tenancy)
// ============================================================================
export const organizationService = {
    async getById(id: string) {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return {
            id: data.id,
            name: data.name,
            planTier: data.plan_tier,
            selectedMetrics: data.selected_metrics,
            goalWeight: data.goal_weight,
            workingDays: data.working_days ?? [1, 2, 3, 4, 5],
            aiConfig: data.ai_config,
            createdAt: data.created_at
        } as Organization;
    },

    async create(organization: Omit<Organization, 'createdAt'>) {
        const { error } = await supabase
            .from('organizations')
            .insert({
                id: organization.id,
                name: organization.name,
                plan_tier: organization.planTier,
                selected_metrics: organization.selectedMetrics,
                goal_weight: organization.goalWeight,
                working_days: organization.workingDays ?? [1, 2, 3, 4, 5],
                ai_config: organization.aiConfig,
            });
        // Do NOT select() here because the user cannot "view" the organization 
        // until their employee record is created (which happens next).
        // RLS "View own organization" depends on get_my_org_id() -> employee table.

        if (error) throw error;
        return { ...organization, createdAt: new Date().toISOString() } as Organization;
    },

    async update(id: string, updates: Partial<Organization>) {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.planTier !== undefined) dbUpdates.plan_tier = updates.planTier;
        if (updates.selectedMetrics !== undefined) dbUpdates.selected_metrics = updates.selectedMetrics;
        if (updates.goalWeight !== undefined) dbUpdates.goal_weight = updates.goalWeight;
        if (updates.workingDays !== undefined) dbUpdates.working_days = updates.workingDays;
        if (updates.aiConfig !== undefined) dbUpdates.ai_config = updates.aiConfig;

        const { data, error } = await supabase
            .from('organizations')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return {
            id: data.id,
            name: data.name,
            planTier: data.plan_tier,
            selectedMetrics: data.selected_metrics,
            goalWeight: data.goal_weight,
            workingDays: data.working_days ?? [1, 2, 3, 4, 5],
            aiConfig: data.ai_config,
            createdAt: data.created_at
        } as Organization;
    },
};


// ============================================================================
// MANAGER SETTINGS SERVICE
// ============================================================================
export const managerSettingsService = {
    async getByManagerId(managerId: string) {
        const { data, error } = await supabase
            .from('manager_settings')
            .select('*')
            .eq('manager_id', managerId)
            .maybeSingle();
        
        if (error) throw error;
        if (!data) return null;

        return {
            id: data.id,
            managerId: data.manager_id,
            globalFrequency: data.global_frequency,
            reportFrequency: data.report_frequency,
            allowLateSubmissions: data.allow_late_submissions,
            gracePeriodDays: data.grace_period_days,
            backdateLimitDays: data.backdate_limit_days,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        } as ManagerSettings;
    },

    async update(managerId: string, updates: Partial<ManagerSettings>) {
        const dbUpdates: any = {};
        if (updates.globalFrequency !== undefined) dbUpdates.global_frequency = updates.globalFrequency;
        if (updates.reportFrequency !== undefined) dbUpdates.report_frequency = updates.reportFrequency;
        if (updates.allowLateSubmissions !== undefined) dbUpdates.allow_late_submissions = updates.allowLateSubmissions;
        if (updates.gracePeriodDays !== undefined) dbUpdates.grace_period_days = updates.gracePeriodDays;
        if (updates.backdateLimitDays !== undefined) dbUpdates.backdate_limit_days = updates.backdateLimitDays;

        const { data, error } = await supabase
            .from('manager_settings')
            .update(dbUpdates)
            .eq('manager_id', managerId)
            .select()
            .single();
        
        if (error) throw error;
        
        return {
            id: data.id,
            managerId: data.manager_id,
            globalFrequency: data.global_frequency,
            reportFrequency: data.report_frequency,
            allowLateSubmissions: data.allow_late_submissions,
            gracePeriodDays: data.grace_period_days,
            backdateLimitDays: data.backdate_limit_days,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        } as ManagerSettings;
    }
};


// ============================================================================
// CUSTOM METRICS SERVICE
// ============================================================================
export const customMetricService = {
    async getByOrganizationId(organizationId: string) {
        const { data, error } = await supabase
            .from('organization_custom_metrics')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data.map((item: any) => ({
            id: item.id,
            organizationId: item.organization_id,
            name: item.name,
            description: item.description,
            isActive: item.is_active,
            createdAt: item.created_at,
            updatedAt: item.updated_at
        })) as CustomMetric[];
    },

    async create(metric: Omit<CustomMetric, 'createdAt' | 'updatedAt' | 'id'> & { id?: string }) {
        const id = metric.id || `metric-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const { data, error } = await supabase
            .from('organization_custom_metrics')
            .insert({
                id,
                organization_id: metric.organizationId,
                name: metric.name,
                description: metric.description,
                is_active: metric.isActive !== undefined ? metric.isActive : true
            })
            .select()
            .single();
        if (error) throw error;
        return {
            id: data.id,
            organizationId: data.organization_id,
            name: data.name,
            description: data.description,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        } as CustomMetric;
    },

    async update(id: string, updates: Partial<CustomMetric>) {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

        const { data, error } = await supabase
            .from('organization_custom_metrics')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return {
            id: data.id,
            organizationId: data.organization_id,
            name: data.name,
            description: data.description,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        } as CustomMetric;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('organization_custom_metrics')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }
};


// ============================================================================
// PROJECTS SERVICE
// ============================================================================

// Helper function to convert database project to TypeScript Project
function dbProjectToProject(dbProject: any): Project {
    return {
        id: dbProject.id,
        organizationId: dbProject.organization_id,
        name: dbProject.name,
        description: dbProject.description,
        category: dbProject.category,
        reportFrequency: dbProject.report_frequency,
        knowledgeBaseLink: dbProject.knowledge_base_link,
        aiContext: dbProject.ai_context,
        knowledgeBaseCache: dbProject.knowledge_base_cache,
        validReportDays: dbProject.valid_report_days,
        createdBy: dbProject.created_by,
        createdAt: dbProject.created_at,
        status: dbProject.status,
        assignees: [], // Assignees are loaded separately
    };
}

export const projectService = {
    async getAll() {
        const { data, error } = await supabase
            .from('projects')
            .select(`
                *,
                project_assignees(assignee_id, assignee_type, employees(name)),
                goals(id, status, deadline, reports(id, evaluation_score, manager_overall_score, submission_date))
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data ? data.map((dbProject: any) => this.mapProjectWithMetrics(dbProject)) : [];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('projects')
            .select(`
                *,
                project_assignees(assignee_id, assignee_type, employees(name)),
                goals(id, status, deadline, reports(id, evaluation_score, manager_overall_score, submission_date))
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        return this.mapProjectWithMetrics(data);
    },

    mapProjectWithMetrics(dbProject: any) {
        // Calculate dynamic metrics
        const goals = dbProject.goals || [];
        const activeGoals = goals.filter((g: any) => g.status === 'active' || g.status === 'on-track' || g.status === 'at-risk');

        let reportCount = 0;
        let totalScore = 0;
        let scoredReports = 0;

        goals.forEach((goal: any) => {
            const reports = goal.reports || [];
            reportCount += reports.length;

            reports.forEach((report: any) => {
                const effectiveScore = report.manager_overall_score ?? report.evaluation_score;
                if (typeof effectiveScore === 'number' && !isNaN(effectiveScore)) {
                    totalScore += effectiveScore;
                    scoredReports++;
                }
            });
        });

        let avgScore: number | null = scoredReports > 0 ? Number((totalScore / scoredReports).toFixed(1)) : null;

        // Find the latest report submission date
        let lastReportAt: string | null = null;
        goals.forEach((goal: any) => {
            const reports = goal.reports || [];
            reports.forEach((report: any) => {
                const date = report.submission_date || report.created_at;
                if (date && (!lastReportAt || new Date(date) > new Date(lastReportAt))) {
                    lastReportAt = date;
                }
            });
        });

        // Determine derived status
        let derivedStatus = 'active'; // Default
        if (goals.length > 0) {
            if (activeGoals.length === 0) {
                derivedStatus = 'completed';
            } else if (goals.some((g: any) => g.status === 'at-risk' || new Date(g.deadline) < new Date())) {
                derivedStatus = 'at-risk';
            } else if (goals.some((g: any) => g.status === 'review')) {
                derivedStatus = 'review';
            }
        }

        return {
            ...dbProjectToProject(dbProject),
            assignees: dbProject.project_assignees?.map((pa: any) => ({
                id: pa.assignee_id,
                type: pa.assignee_type
            })) || [],
            project_members: dbProject.project_assignees?.map((pa: any) => ({
                employee: { id: pa.assignee_id, full_name: pa.employees?.name || 'Unknown' }
            })) || [],
            goal_count: activeGoals.length,
            total_goals: goals.length,
            report_count: reportCount,
            avg_score: avgScore,
            last_report_at: lastReportAt,
            status: dbProject.status || derivedStatus,
            emoji: '🖥️' // Fallback emoji
        };
    },

    async create(project: Omit<Project, 'updatedAt'>) {
        console.log("projectService.create called with:", project);
        const { error } = await supabase
            .from('projects')
            .insert({
                id: project.id,
                organization_id: project.organizationId,
                name: project.name,
                description: project.description,
                category: project.category,
                report_frequency: project.reportFrequency,
                valid_report_days: project.validReportDays,
                knowledge_base_link: project.knowledgeBaseLink,
                ai_context: project.aiContext,
                created_by: project.createdBy,
                status: project.status || 'active',
                created_at: project.createdAt || new Date().toISOString(),
            });
        // Removed .select() to avoid RLS 403 race condition

        if (error) {
            console.error("Supabase Project Insert Error:", error);
            throw error;
        }

        // Ensure creator is an assignee
        const assignees = [...(project.assignees || [])];
        if (project.createdBy && !assignees.some(a => a.id === project.createdBy)) {
            assignees.push({ id: project.createdBy, type: 'manager' });
        }

        // Insert assignees
        if (assignees.length > 0) {
            // Validate all assignees are managers
            const managerCheckPromises = assignees.map(async (a: any) => {
                const emp = await employeeService.getById(a.id);
                if (emp.role !== 'manager') {
                    throw new Error(`Employee ${emp.name} cannot be assigned to a project because they are not a manager.`);
                }
            });
            await Promise.all(managerCheckPromises);

            const assigneesToInsert = assignees.map(a => ({
                project_id: project.id,
                assignee_id: a.id,
                assignee_type: a.type
            }));
            const { error: assigneesError } = await supabase
                .from('project_assignees')
                .insert(assigneesToInsert);

            if (assigneesError) throw assigneesError;
        }

        return {
            ...project,
            assignees: project.assignees || []
        } as Project;
    },

    async update(id: string, updates: Partial<Project>) {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.reportFrequency !== undefined) dbUpdates.report_frequency = updates.reportFrequency;
        if (updates.validReportDays !== undefined) dbUpdates.valid_report_days = updates.validReportDays;
        if (updates.knowledgeBaseLink !== undefined) dbUpdates.knowledge_base_link = updates.knowledgeBaseLink;
        if (updates.aiContext !== undefined) dbUpdates.ai_context = updates.aiContext;
        if (updates.knowledgeBaseCache !== undefined) dbUpdates.knowledge_base_cache = updates.knowledgeBaseCache;
        if (updates.status !== undefined) dbUpdates.status = updates.status;

        const { data, error } = await supabase
            .from('projects')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        
        const projectId = id;

        // Update assignees if provided
        if (updates.assignees) {
            // Validate all assignees are managers
            const managerCheckPromises = updates.assignees.map(async (a: any) => {
                const emp = await employeeService.getById(a.id);
                if (emp.role !== 'manager') {
                    throw new Error(`Employee ${emp.name} cannot be assigned to a project because they are not a manager.`);
                }
            });
            await Promise.all(managerCheckPromises);

            // Delete existing assignees
            const { error: deleteError } = await supabase
                .from('project_assignees')
                .delete()
                .eq('project_id', id);
            if (deleteError) throw deleteError;

            // Insert new assignees
            if (updates.assignees.length > 0) {
                const assigneesToInsert = updates.assignees.map(a => ({
                    project_id: id,
                    assignee_id: a.id,
                    assignee_type: a.type
                }));
                const { error: insertError } = await supabase
                    .from('project_assignees')
                    .insert(assigneesToInsert);
                if (insertError) throw insertError;
            }
        }

        // Return updated project with assignees
        return this.getById(id);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async getAssignees(projectId: string) {
        const { data, error } = await supabase
            .from('project_assignees')
            .select('assignee_id, assignee_type, employees(*)')
            .eq('project_id', projectId);
        if (error) throw error;
        return data;
    },

    async assignEmployee(projectId: string, employeeId: string, assigneeType: 'employee' | 'manager') {
        // Validate role: PROJECTS only allow managers
        const employee = await employeeService.getById(employeeId);
        if (employee.role !== 'manager') {
            throw new Error('Only managers can be assigned to projects.');
        }

        const { data, error } = await supabase
            .from('project_assignees')
            .insert({
                project_id: projectId,
                assignee_id: employeeId,
                assignee_type: assigneeType,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async unassignEmployee(projectId: string, employeeId: string) {
        const { error } = await supabase
            .from('project_assignees')
            .delete()
            .eq('project_id', projectId)
            .eq('assignee_id', employeeId);
        if (error) throw error;
    },

    async getProjectReports(projectId: string) {
        const { data, error } = await supabase
            .from('reports')
            .select('*, goals!inner(id, name), employees!reports_employee_id_fkey(id, name, avatar_url)')
            .eq('goals.project_id', projectId)
            .order('submission_date', { ascending: false });
        if (error) throw error;
        return data ? data.map(dbReportToReport) : [];
    },

    async getRecentActivity(projectId: string) {
        // Aggregate goals, reports, and assignments
        const [goals, reports, assignees] = await Promise.all([
            supabase.from('goals').select('id, name, created_at, created_by, employees!created_by(name)').eq('project_id', projectId),
            supabase.from('reports').select('id, submission_date, employee_id, employees!reports_employee_id_fkey(name), goals!inner(name, project_id)').eq('goals.project_id', projectId),
            supabase.from('project_assignees').select('assigned_at, assignee_id, employees!assignee_id(name)').eq('project_id', projectId)
        ]);

        const activities: any[] = [];

        if (goals.data) {
            goals.data.forEach((g: any) => {
                activities.push({
                    id: `goal-${g.id}`,
                    type: 'goal',
                    user: (g as any).employees?.name || 'Manager',
                    action: `created goal "${g.name}"`,
                    timestamp: g.created_at
                });
            });
        }

        if (reports.data) {
            reports.data.forEach((r: any) => {
                activities.push({
                    id: `report-${r.id}`,
                    type: 'report',
                    user: (r as any).employees?.name || 'Employee',
                    action: `submitted report for "${(r as any).goals?.name}"`,
                    timestamp: r.submission_date
                });
            });
        }

        if (assignees.data) {
            assignees.data.forEach((a: any) => {
                activities.push({
                    id: `assign-${a.assignee_id}`,
                    type: 'assignment',
                    user: (a as any).employees?.name || 'Employee',
                    action: `was assigned to the project`,
                    timestamp: a.assigned_at
                });
            });
        }

        return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },

    async getByEmployeeId(employeeId: string) {
        console.log('[projectService.getByEmployeeId] Fetching for employee:', employeeId);

        // 1. Get projects where employee is assigned
        const { data: directProjects, error: dpError } = await supabase
            .from('project_assignees')
            .select('project_id')
            .eq('assignee_id', employeeId);
        
        if (dpError) console.error('[projectService.getByEmployeeId] directProjects error:', dpError);
        const directProjIds = (directProjects || []).map((p: any) => p.project_id);

        // 1b. Get projects created by the employee
        const { data: createdProjects, error: cpError } = await supabase
            .from('projects')
            .select('id')
            .eq('created_by', employeeId);
        
        if (cpError) console.error('[projectService.getByEmployeeId] createdProjects error:', cpError);
        const createdProjIds = (createdProjects || []).map((p: any) => p.id);
        
        console.log('[projectService.getByEmployeeId] directProjIds:', directProjIds, 'createdProjIds:', createdProjIds);

        // 2. Get goals where employee is assigned (fetch goal_id separately, then get project_id)
        const { data: goalAssignments, error: gaError } = await supabase
            .from('goal_assignees')
            .select('goal_id')
            .eq('assignee_id', employeeId);
        
        if (gaError) console.error('[projectService.getByEmployeeId] goalAssignments error:', gaError);
        console.log('[projectService.getByEmployeeId] goalAssignments:', goalAssignments);

        const empAssignedGoalIds = (goalAssignments || []).map((ga: any) => ga.goal_id);

        // 2b. Now fetch the project_id for those goals separately (avoid PGRST200 join)
        let goalProjIds: string[] = [];
        if (empAssignedGoalIds.length > 0) {
            const { data: goalsWithProject, error: gwpError } = await supabase
                .from('goals')
                .select('id, project_id')
                .in('id', empAssignedGoalIds);
            
            if (gwpError) console.error('[projectService.getByEmployeeId] goalsWithProject error:', gwpError);
            console.log('[projectService.getByEmployeeId] goalsWithProject:', goalsWithProject);
            goalProjIds = (goalsWithProject || []).map((g: any) => g.project_id).filter(Boolean);
        }

        console.log('[projectService.getByEmployeeId] goalProjIds:', goalProjIds);

        const allProjIds = Array.from(new Set([...directProjIds, ...createdProjIds, ...goalProjIds]));
        console.log('[projectService.getByEmployeeId] allProjIds:', allProjIds);

        if (allProjIds.length === 0) return [];

        const { data, error } = await supabase
            .from('projects')
            .select(`
                *,
                project_assignees(assignee_id, assignee_type, employees(name)),
                goals(id, status, deadline, reports(id, evaluation_score, manager_overall_score, submission_date))
            `)
            .in('id', allProjIds)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((dbProject: any) => {
            // Filter goals to only those assigned to the employee
            const personalizedGoals = (dbProject.goals || []).filter((g: any) => 
                empAssignedGoalIds.includes(g.id) || directProjIds.includes(dbProject.id)
            );
            
            // Map with these filtered goals to get personalized metrics
            const mapped = this.mapProjectWithMetrics({
                ...dbProject,
                goals: personalizedGoals
            });

            return {
                ...mapped,
                project_members: (dbProject.project_assignees || []).map((pa: any) => ({
                    employee: {
                        full_name: pa.employees?.name || 'Unknown'
                    }
                }))
            };
        });
    },
};

// ============================================================================
// GOALS SERVICE
// ============================================================================

// Helper function to convert database goal to TypeScript Goal
function dbGoalToGoal(dbGoal: any): Goal {
    return {
        id: dbGoal.id,
        name: dbGoal.name,
        projectId: dbGoal.project_id,
        criteria: dbGoal.criteria ? dbGoal.criteria.map((c: any) => ({
            id: c.id,
            name: c.name,
            weight: c.weight
        })) : [],
        instructions: dbGoal.instructions,
        startDate: dbGoal.start_date ?? dbGoal.created_at,
        deadline: dbGoal.deadline,
        managerId: dbGoal.manager_id,
        createdBy: dbGoal.created_by,
        createdAt: dbGoal.created_at,
        status: dbGoal.status || 'active',
        assignees: [],
    };
}

/**
 * Helper: fetch goal members for a list of goal IDs.
 * Avoids joining `employees` directly from `goal_assignees` (no FK in schema cache).
 * Instead fetches assignee_ids first, then looks up names from the employees table.
 */
async function fetchGoalMembersMap(goalIds: string[]): Promise<Record<string, { employee: { id: string; full_name: string } }[]>> {
    if (!goalIds.length) return {};

    // Step 1: get assignee IDs per goal
    const { data: assigneeRows } = await supabase
        .from('goal_assignees')
        .select('goal_id, assignee_id')
        .in('goal_id', goalIds);

    if (!assigneeRows || assigneeRows.length === 0) return {};

    // Step 2: get unique employee IDs, then fetch their names
    const empIds = [...new Set(assigneeRows.map((r: any) => r.assignee_id))];
    const { data: empRows } = await supabase
        .from('employees')
        .select('id, name')
        .in('id', empIds);

    const empNameMap: Record<string, string> = {};
    (empRows || []).forEach((e: any) => { empNameMap[e.id] = e.name; });

    // Step 3: build map from goal_id -> members array
    const map: Record<string, { employee: { id: string; full_name: string } }[]> = {};
    assigneeRows.forEach((r: any) => {
        if (!map[r.goal_id]) map[r.goal_id] = [];
        map[r.goal_id].push({ employee: { id: r.assignee_id, full_name: empNameMap[r.assignee_id] || 'Unknown' } });
    });

    return map;
}

export const goalService = {
    async getAll() {
        const { data, error } = await supabase
            .from('goals')
            .select('*, projects(*), criteria(*), reports(id, evaluation_score, manager_overall_score, submission_date, submitted_for_date)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        if (!data) return [];

        const goalIds = data.map((g: any) => g.id);
        const goalMembersMap = await fetchGoalMembersMap(goalIds);

        return data.map((g: any) => {
            const reports: any[] = g.reports || [];
            const scoredReports = reports.filter((r: any) => (r.manager_overall_score ?? r.evaluation_score) != null);
            const avg_score = scoredReports.length > 0
                ? scoredReports.reduce((sum: number, r: any) => sum + (r.manager_overall_score ?? r.evaluation_score), 0) / scoredReports.length
                : null;

            return {
                ...dbGoalToGoal(g),
                project: g.projects ? projectService.mapProjectWithMetrics({ ...g.projects, goals: [], reports: [] }) : null,
                goal_members: goalMembersMap[g.id] || [],
                reports: reports.map(dbReportToReport),
                report_count: reports.length,
                avg_score: avg_score ? Number(avg_score.toFixed(1)) : null,
                avgScore: avg_score ? Number(avg_score.toFixed(1)) : null,
            };
        });
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('goals')
            .select('*, projects(*), criteria(*), reports(id, evaluation_score, manager_overall_score, submission_date, submitted_for_date)')
            .eq('id', id)
            .single();
        if (error) throw error;
        if (!data) return null;

        const goalMembersMap = await fetchGoalMembersMap([id]);
        const reports = data.reports || [];
        const scoredReports = reports.filter((r: any) => (r.manager_overall_score ?? r.evaluation_score) != null);
        const avg_score = scoredReports.length > 0
            ? scoredReports.reduce((sum: number, r: any) => sum + (r.manager_overall_score ?? r.evaluation_score), 0) / scoredReports.length
            : null;

        return {
            ...dbGoalToGoal(data),
            project: data.projects ? projectService.mapProjectWithMetrics({ ...data.projects, goals: [], reports: [] }) : null,
            goal_members: goalMembersMap[id] || [],
            reports: reports.map(dbReportToReport),
            report_count: reports.length,
            avg_score: avg_score ? Number(avg_score.toFixed(1)) : null,
            avgScore: avg_score ? Number(avg_score.toFixed(1)) : null
        };
    },

    async getByProjectId(projectId: string) {
        const { data, error } = await supabase
            .from('goals')
            .select('*, criteria(*), reports(id, evaluation_score, manager_overall_score, submission_date, submitted_for_date)')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        if (!data) return [];

        const goalIds = data.map((g: any) => g.id);
        const goalMembersMap = await fetchGoalMembersMap(goalIds);

        return data.map((g: any) => {
            const reports = g.reports || [];
            const scoredReports = reports.filter((r: any) => (r.manager_overall_score ?? r.evaluation_score) != null);
            const avg_score = scoredReports.length > 0
                ? scoredReports.reduce((sum: number, r: any) => sum + (r.manager_overall_score ?? r.evaluation_score), 0) / scoredReports.length
                : null;

            return {
                ...dbGoalToGoal(g),
                goal_members: goalMembersMap[g.id] || [],
                reports: reports.map(dbReportToReport),
                report_count: reports.length,
                avg_score: avg_score ? Number(avg_score.toFixed(1)) : null,
                avgScore: avg_score ? Number(avg_score.toFixed(1)) : null // For UI components using avgScore
            };
        });
    },

    async getByEmployeeId(employeeId: string) {
        // 1. Get explicitly assigned goals
        const { data: directGoalAssignees } = await supabase
            .from('goal_assignees')
            .select('goal_id')
            .eq('assignee_id', employeeId);
        const directGoalIds = (directGoalAssignees || []).map((ga: any) => ga.goal_id);

        // 2. Get goals created by this employee
        const { data: createdGoals } = await supabase
            .from('goals')
            .select('id')
            .eq('created_by', employeeId);
        const createdGoalIds = (createdGoals || []).map((g: any) => g.id);

        // 3. Get projects assigned to or created by this employee
        const { data: assignedProjects } = await supabase
            .from('project_assignees')
            .select('project_id')
            .eq('assignee_id', employeeId);
        const assignedProjectIds = (assignedProjects || []).map((p: any) => p.project_id);

        const { data: createdProjects } = await supabase
            .from('projects')
            .select('id')
            .eq('created_by', employeeId);
        const createdProjectIds = (createdProjects || []).map((p: any) => p.id);
        
        const allProjectIds = [...new Set([...assignedProjectIds, ...createdProjectIds])];

        let projectGoalIds: string[] = [];
        if (allProjectIds.length > 0) {
             const { data: pGoals } = await supabase
                 .from('goals')
                 .select('id')
                 .in('project_id', allProjectIds);
             projectGoalIds = (pGoals || []).map((g: any) => g.id);
        }

        const finalGoalIds = [...new Set([...directGoalIds, ...createdGoalIds, ...projectGoalIds])];

        // If not assigned to any goals, return empty
        if (finalGoalIds.length === 0) return [];

        const { data, error } = await supabase
            .from('goals')
            .select('*, projects(*), criteria(*), reports(id, evaluation_score, manager_overall_score, submission_date, submitted_for_date)')
            .in('id', finalGoalIds)
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!data) return [];

        const goalIds = data.map((g: any) => g.id);
        const goalMembersMap = await fetchGoalMembersMap(goalIds);

        return data.map((g: any) => {
            const reports: any[] = g.reports || [];
            const scoredReports = reports.filter((r: any) => (r.manager_overall_score ?? r.evaluation_score) != null);
            const avg_score = scoredReports.length > 0
                ? scoredReports.reduce((sum: number, r: any) => sum + (r.manager_overall_score ?? r.evaluation_score), 0) / scoredReports.length
                : null;

            return {
                ...dbGoalToGoal(g),
                project: g.projects ? projectService.mapProjectWithMetrics({ ...g.projects, goals: [], reports: [] }) : null,
                goal_members: goalMembersMap[g.id] || [],
                reports: reports.map(dbReportToReport),
                report_count: reports.length,
                avg_score: avg_score ? Number(avg_score.toFixed(1)) : null,
                avgScore: avg_score ? Number(avg_score.toFixed(1)) : null,
            };
        });
    },

    async create(goal: Omit<Goal, 'createdAt' | 'updatedAt'>) {
        // Insert goal
        const { error: goalError } = await supabase
            .from('goals')
            .insert({
                id: goal.id,
                name: goal.name,
                project_id: goal.projectId,
                instructions: goal.instructions,
                deadline: goal.deadline,
                manager_id: goal.managerId,
                created_by: goal.createdBy,
                status: goal.status || 'active',
            });
        // Removed .select() to avoid RLS 403 race condition

        if (goalError) throw goalError;

        // Insert criteria
        if (goal.criteria && goal.criteria.length > 0) {
            const criteriaToInsert = goal.criteria.map((criterion, index) => ({
                id: criterion.id,
                goal_id: goal.id,
                name: criterion.name,
                weight: criterion.weight,
                display_order: index,
                target_description: criterion.target_description ?? null,
            }));

            const { error: criteriaError } = await supabase
                .from('criteria')
                .insert(criteriaToInsert);
            if (criteriaError) throw criteriaError;
        }

        // Insert goal assignees
        if (goal.assignees && goal.assignees.length > 0) {
            const assigneesToInsert = await Promise.all(goal.assignees.map(async (idOrObj: any) => {
                const assigneeId = typeof idOrObj === 'string' ? idOrObj : (idOrObj.id || idOrObj.employee_id);
                
                // Validate role: GOALS only allow employees
                const emp = await employeeService.getById(assigneeId);
                if (emp.role !== 'employee') {
                    throw new Error(`Manager ${emp.name} cannot be assigned to a goal.`);
                }

                return {
                    goal_id: goal.id,
                    assignee_id: assigneeId,
                    assignee_type: 'employee' // Default to employee
                };
            }));

            const { error: assigneesError } = await supabase
                .from('goal_assignees')
                .insert(assigneesToInsert);
            if (assigneesError) throw assigneesError;
        }

        return {
            ...goal,
            criteria: goal.criteria || [],
            assignees: goal.assignees || []
        } as Goal;
    },

    async update(id: string, updates: Partial<Goal>) {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.instructions !== undefined) dbUpdates.instructions = updates.instructions;
        if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
        if (updates.managerId !== undefined) dbUpdates.manager_id = updates.managerId;
        if (updates.status !== undefined) dbUpdates.status = updates.status;

        const { data, error } = await supabase
            .from('goals')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;

        // Update criteria if provided
        if (updates.criteria) {
            // Delete existing criteria
            await supabase.from('criteria').delete().eq('goal_id', id);

            // Insert new criteria
            if (updates.criteria.length > 0) {
                const criteriaToInsert = updates.criteria.map((criterion, index) => ({
                    id: criterion.id,
                    goal_id: id,
                    name: criterion.name,
                    weight: criterion.weight,
                    display_order: index,
                    target_description: criterion.target_description ?? null,
                }));

                const { error: criteriaError } = await supabase
                    .from('criteria')
                    .insert(criteriaToInsert);
                if (criteriaError) throw criteriaError;
            }
        }

        // goal_assignees update skipped — table may not exist yet

        return this.getById(id);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    /**
     * Atomically replace all assignees for a goal.
     * Deletes every existing row in goal_assignees for this goal,
     * then inserts the new list of employee IDs.
     */
    async updateGoalAssignees(goalId: string, assigneeIds: string[]) {
        // 1. Remove all existing assignees for this goal
        const { error: deleteError } = await supabase
            .from('goal_assignees')
            .delete()
            .eq('goal_id', goalId);
        if (deleteError) throw deleteError;

        // 2. Insert the new list (skip if empty)
        if (assigneeIds.length > 0) {
            const rows = assigneeIds.map(id => ({
                goal_id: goalId,
                assignee_id: id,
                assignee_type: 'employee',
            }));
            const { error: insertError } = await supabase
                .from('goal_assignees')
                .insert(rows);
            if (insertError) throw insertError;
        }
    },

};

// ============================================================================
// REPORTS SERVICE
// ============================================================================

// Helper function to convert database report to TypeScript Report
function dbReportToReport(dbReport: any): Report {
    return {
        id: dbReport.id,
        goalId: dbReport.goal_id,
        employeeId: dbReport.employee_id,
        reportText: dbReport.report_text,
        submissionDate: dbReport.submission_date,
        submittedForDate: dbReport.submitted_for_date,
        evaluationScore: dbReport.evaluation_score,
        managerOverallScore: dbReport.manager_overall_score,
        managerOverrideReasoning: dbReport.manager_override_reasoning,
        managerFeedback: dbReport.manager_feedback,
        reviewedBy: dbReport.reviewed_by,
        evaluationReasoning: dbReport.evaluation_reasoning,
        aiSummary: dbReport.ai_summary,
        criterionScores: dbReport.report_criterion_scores ? dbReport.report_criterion_scores.map((s: any) => ({
            criterionName: s.criterion_name,
            score: s.score,
            evidence: s.evidence,
            reasoning: s.reasoning,
            coachingNote: s.coaching_note || null
        })) : [],
        managerCalibration: dbReport.manager_calibration ?? null,
        consistencyFlag: dbReport.consistency_flag ?? null,
        consistencyNote: dbReport.consistency_note ?? null,
        goals: dbReport.goals,
        employees: dbReport.employees
    };
}

export const reportService = {
    async getAll() {
        console.log('[Database] Fetching all reports...');
        const { data, error } = await supabase
            .from('reports')
            .select('*, goals(*), employees!reports_employee_id_fkey(*), report_criterion_scores(*)')
            .order('submission_date', { ascending: false });

        if (error) {
            console.error('[Database] Error fetching reports:', error);
            throw error;
        }

        console.log(`[Database] Fetched ${data?.length || 0} reports.`);
        // console.log('[Database] Sample report:', data?.[0]); // Debugging

        return data ? data.map(dbReportToReport) : [];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('reports')
            .select('*, goals(id, name, projects(id, name)), employees!reports_employee_id_fkey(id, name, title, avatar_url), report_criterion_scores(*)')
            .eq('id', id)
            .single();
        if (error) throw error;
        return dbReportToReport(data);
    },

    async getByEmployeeId(employeeId: string) {
        const { data, error } = await supabase
            .from('reports')
            .select('*, goals(*), report_criterion_scores(*)')
            .eq('employee_id', employeeId)
            .order('submission_date', { ascending: false });
        if (error) throw error;
        return data ? data.map(dbReportToReport) : [];
    },

    async getByGoalId(goalId: string) {
        const { data, error } = await supabase
            .from('reports')
            .select('*, employees!reports_employee_id_fkey(*), report_criterion_scores(*)')
            .eq('goal_id', goalId)
            .order('submission_date', { ascending: false });
        if (error) throw error;
        return data ? data.map(dbReportToReport) : [];
    },

    async create(report: Omit<Report, 'createdAt' | 'updatedAt'>) {
        try {
            // Validation helper (keep for internal use if needed, but not for ID checks)

            // Prepare the report data
            const insertData: any = {
                goal_id: report.goalId,
                employee_id: report.employeeId,
                report_text: report.reportText,
                submission_date: report.submissionDate || new Date().toISOString(),
                submitted_for_date: report.submittedForDate,
                evaluation_score: typeof report.evaluationScore !== 'number' || isNaN(report.evaluationScore) ? 0 : report.evaluationScore,
                evaluation_reasoning: report.evaluationReasoning || 'No reasoning provided.',
            };

            // Handle optional fields
            if (report.managerOverallScore !== undefined && report.managerOverallScore !== null) {
                insertData.manager_overall_score = report.managerOverallScore;
            }
            if (report.managerOverrideReasoning !== undefined && report.managerOverrideReasoning !== null) {
                insertData.manager_override_reasoning = report.managerOverrideReasoning;
            }

            // Ensure we have an ID for the report. If not provided, generate one.
            // Since the system uses custom string IDs (e.g. goal-..., emp-...), we follow that pattern.
            insertData.id = report.id || `report-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            console.log('[Database] Creating report...', insertData);

            // Insert report
            const { data: reportData, error: reportError } = await supabase
                .from('reports')
                .insert(insertData)
                .select()
                .single();

            if (reportError) {
                console.error('[Database] Failed to insert report:', {
                    error: reportError,
                    sentData: insertData
                });
                throw reportError;
            }

            if (!reportData) {
                throw new Error('Report insertion succeeded but no data was returned.');
            }

            const reportId = reportData.id;
            console.log('[Database] Report created successfully. ID:', reportId);

            // Insert criterion scores
            if (report.criterionScores && report.criterionScores.length > 0) {
                const scoresToInsert = report.criterionScores.map(score => ({
                    report_id: reportId,
                    criterion_name: score.criterionName,
                    score: score.score,
                    evidence: score.evidence,
                    reasoning: score.reasoning,
                    coaching_note: score.coachingNote || null
                }));

                console.log('[Database] Inserting criterion scores...', scoresToInsert);

                const { error: scoresError } = await supabase
                    .from('report_criterion_scores')
                    .insert(scoresToInsert);

                if (scoresError) {
                    console.error('[Database] Failed to insert criterion scores:', {
                        error: scoresError,
                        sentData: scoresToInsert
                    });
                    throw scoresError;
                }
            }

            const fullReport = dbReportToReport(reportData);
            fullReport.criterionScores = report.criterionScores || [];

            return fullReport;
        } catch (err) {
            console.error('[Database] Critical error in reportService.create:', err);
            throw err;
        }
    },

    async update(id: string, updates: Partial<Report>) {
        const dbUpdates: any = {};
        if (updates.reportText !== undefined) dbUpdates.report_text = updates.reportText;
        if (updates.evaluationScore !== undefined) dbUpdates.evaluation_score = updates.evaluationScore;
        if (updates.managerOverallScore !== undefined) dbUpdates.manager_overall_score = updates.managerOverallScore;
        if (updates.managerOverrideReasoning !== undefined) dbUpdates.manager_override_reasoning = updates.managerOverrideReasoning;
        if (updates.managerFeedback !== undefined) dbUpdates.manager_feedback = updates.managerFeedback;
        if (updates.reviewedBy !== undefined) dbUpdates.reviewed_by = updates.reviewedBy;
        if (updates.evaluationReasoning !== undefined) dbUpdates.evaluation_reasoning = updates.evaluationReasoning;
        if (updates.managerCalibration !== undefined) dbUpdates.manager_calibration = updates.managerCalibration;
        if (updates.consistencyFlag !== undefined) dbUpdates.consistency_flag = updates.consistencyFlag;
        if (updates.consistencyNote !== undefined) dbUpdates.consistency_note = updates.consistencyNote;

        console.log('[Database] Updating report:', id, dbUpdates);

        const { data, error } = await supabase
            .from('reports')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) {
            console.error('[Database] Failed to update report:', {
                error,
                id,
                dbUpdates
            });
            throw error;
        }

        if (!data) {
            console.warn('[Database] Report update returned no data (possibly RLS or ID mismatch):', { id, dbUpdates });
            throw new Error(`Report with ID ${id} not found or you don't have permission to update it.`);
        }

        return dbReportToReport(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('reports')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async getManagerReports(managerId: string, view: 'org' | 'direct' = 'org', organizationId?: string, startDate?: string, endDate?: string) {
        let employeeIds: string[] = [];

        if (view === 'direct') {
            // Get direct report IDs
            const { data: directReports } = await supabase
                .from('employees')
                .select('id')
                .eq('manager_id', managerId)
                .eq('is_active', true);
            employeeIds = (directReports || []).map((e: any) => e.id);
        } else if (organizationId) {
            // Get all employees in organization
            const { data: orgEmployees } = await supabase
                .from('employees')
                .select('id')
                .eq('organization_id', organizationId)
                .eq('is_active', true);
            employeeIds = (orgEmployees || []).map((e: any) => e.id);
        }

        if (employeeIds.length === 0) return [];

        let query = supabase
            .from('reports')
            .select('*, goals(id, name, projects(id, name)), employees!reports_employee_id_fkey(id, name, title, avatar_url), report_criterion_scores(*)')
            .in('employee_id', employeeIds);
        
        if (startDate) {
            query = query.gte('submission_date', startDate);
        }
        if (endDate) {
            query = query.lte('submission_date', endDate);
        }

        const { data, error } = await query.order('submission_date', { ascending: false });

        if (error) throw error;
        return data ? data.map(dbReportToReport) : [];
    },

    async getEmployeeReports(employeeId: string, startDate?: string, endDate?: string) {
        let query = supabase
            .from('reports')
            .select('*, goals(id, name, projects(id, name)), employees!reports_employee_id_fkey(id, name, title, avatar_url), report_criterion_scores(*)')
            .eq('employee_id', employeeId);

        if (startDate) {
            query = query.gte('submission_date', startDate);
        }
        if (endDate) {
            query = query.lte('submission_date', endDate);
        }

        const { data, error } = await query.order('submission_date', { ascending: false });

        if (error) throw error;
        return data ? data.map(dbReportToReport) : [];
    },
};

// ============================================================================
// EMPLOYEES SERVICE
// ============================================================================

// Helper function to convert database employee to TypeScript Employee
function dbEmployeeToEmployee(dbEmployee: any): Employee {
    if (dbEmployee.id === 'emp-1774254984062-870') {
        console.log('--- RAW DB EMPLOYEE (Target) ---', JSON.stringify(dbEmployee, null, 2));
    }
    return {
        id: dbEmployee.id,
        organizationId: dbEmployee.organization_id,
        name: dbEmployee.name,
        full_name: dbEmployee.name,
        email: dbEmployee.email,
        title: dbEmployee.title,
        avatarUrl: dbEmployee.avatar_url,
        role: dbEmployee.role,
        managerId: dbEmployee.manager_id,
        isAccountOwner: dbEmployee.is_account_owner,
        onboardingCompleted: dbEmployee.onboarding_completed,
        joinDate: dbEmployee.join_date,
        authUserId: dbEmployee.auth_user_id,
        dept: dbEmployee.dept,
        permissions: (Array.isArray(dbEmployee.employee_permissions) ? dbEmployee.employee_permissions[0] : dbEmployee.employee_permissions) ? {
            canSetGlobalFrequency: (Array.isArray(dbEmployee.employee_permissions) ? dbEmployee.employee_permissions[0] : dbEmployee.employee_permissions).can_set_global_frequency,
            canViewOrganizationWide: (Array.isArray(dbEmployee.employee_permissions) ? dbEmployee.employee_permissions[0] : dbEmployee.employee_permissions).can_view_organization_wide,
            canManageSettings: (Array.isArray(dbEmployee.employee_permissions) ? dbEmployee.employee_permissions[0] : dbEmployee.employee_permissions).can_manage_settings,
            canCreateProjects: (Array.isArray(dbEmployee.employee_permissions) ? dbEmployee.employee_permissions[0] : dbEmployee.employee_permissions).can_create_projects,
            canCreateGoals: (Array.isArray(dbEmployee.employee_permissions) ? dbEmployee.employee_permissions[0] : dbEmployee.employee_permissions).can_create_goals,
            canInviteUsers: (Array.isArray(dbEmployee.employee_permissions) ? dbEmployee.employee_permissions[0] : dbEmployee.employee_permissions).can_invite_users,
            canOverrideAIScores: (Array.isArray(dbEmployee.employee_permissions) ? dbEmployee.employee_permissions[0] : dbEmployee.employee_permissions).can_override_ai_scores,
        } : undefined,
        skillAnalysis: dbEmployee.skill_analysis || undefined,
        isActive: dbEmployee.is_active ?? true,
    };
}

export const employeeService = {
    async getAll() {
        const { data, error } = await supabase
            .from('employees')
            .select('*, employee_permissions(*)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data ? data.map(dbEmployeeToEmployee) : [];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('employees')
            .select('*, employee_permissions(*)')
            .eq('id', id)
            .single();
        if (error) throw error;
        return dbEmployeeToEmployee(data);
    },

    async getByEmail(email: string) {
        const { data, error } = await supabase
            .from('employees')
            .select('*, employee_permissions(*)')
            .eq('email', email)
            .maybeSingle();
        if (error) throw error;
        return data ? dbEmployeeToEmployee(data) : null;
    },

    async getByAuthId(authUserId: string) {
        const { data, error } = await supabase
            .from('employees')
            .select('*, employee_permissions(*)')
            .eq('auth_user_id', authUserId)
            .maybeSingle();
        if (error) throw error;
        return data ? dbEmployeeToEmployee(data) : null;
    },

    async getManagers() {
        const { data, error } = await supabase
            .from('employees')
            .select('*, employee_permissions(*)')
            .eq('role', 'manager')
            .order('name', { ascending: true });
        if (error) throw error;
        return data ? data.map(dbEmployeeToEmployee).filter((e: Employee) => e.isActive !== false) : [];
    },

    async getTeamMembers(managerId: string) {
        const { data, error } = await supabase
            .from('employees')
            .select('*, employee_permissions(*)')
            .eq('manager_id', managerId)
            .order('name', { ascending: true });
        if (error) throw error;
        return data ? data.map(dbEmployeeToEmployee).filter((e: Employee) => e.isActive !== false) : [];
    },

    async getStaffMembers() {
        // Fetch only 'employee' role as per user request to exclude managers/owners
        const { data, error } = await supabase
            .from('employees')
            .select('*, employee_permissions(*)')
            .eq('role', 'employee')
            .order('name', { ascending: true });

        if (error) throw error;
        return data ? data.map(dbEmployeeToEmployee).filter((e: Employee) => e.isActive !== false) : [];
    },

    async getByOrganizationId(organizationId: string) {
        const { data, error } = await supabase
            .from('employees')
            .select('*, employee_permissions(*)')
            .eq('organization_id', organizationId)
            .order('name', { ascending: true });
        if (error) throw error;
        return data ? data.map(dbEmployeeToEmployee) : [];
    },

    async create(employee: Omit<Employee, 'createdAt' | 'updatedAt'>) {
        const { data, error } = await supabase
            .from('employees')
            .insert({
                id: employee.id,
                organization_id: employee.organizationId,
                name: employee.name,
                email: employee.email,
                title: employee.title,
                role: employee.role,
                manager_id: employee.managerId,
                is_account_owner: employee.isAccountOwner,
                onboarding_completed: employee.onboardingCompleted,
                join_date: employee.joinDate,
                auth_user_id: employee.authUserId,
            })
            .select()
            .single();
        if (error) throw error;

        // Insert permissions if provided
        if (employee.permissions) {
            const { error: permError } = await supabase
                .from('employee_permissions')
                .insert({
                    employee_id: employee.id,
                    can_set_global_frequency: employee.permissions.canSetGlobalFrequency,
                    can_view_organization_wide: employee.permissions.canViewOrganizationWide,
                    can_manage_settings: employee.permissions.canManageSettings,
                    can_create_projects: employee.permissions.canCreateProjects,
                    can_create_goals: employee.permissions.canCreateGoals,
                    can_invite_users: employee.permissions.canInviteUsers,
                    can_override_ai_scores: employee.permissions.canOverrideAIScores,
                });
            if (permError) throw permError;
        }

        return dbEmployeeToEmployee(data);
    },

    async update(id: string, updates: Partial<Employee>) {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.organizationId !== undefined) dbUpdates.organization_id = updates.organizationId; // Critical fix: allow updating org ID
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.role !== undefined) dbUpdates.role = updates.role;
        if (updates.managerId !== undefined) dbUpdates.manager_id = updates.managerId;
        if (updates.isAccountOwner !== undefined) dbUpdates.is_account_owner = updates.isAccountOwner;
        if (updates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = updates.onboardingCompleted;
        if (updates.joinDate !== undefined) dbUpdates.join_date = updates.joinDate;
        if (updates.authUserId !== undefined) dbUpdates.auth_user_id = updates.authUserId;
        if (updates.skillAnalysis !== undefined) dbUpdates.skill_analysis = updates.skillAnalysis;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

        const { data, error } = await supabase
            .from('employees')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;

        // Update permissions if provided
        if (updates.permissions) {
            const { error: permError } = await supabase
                .from('employee_permissions')
                .upsert({
                    employee_id: id,
                    can_set_global_frequency: updates.permissions.canSetGlobalFrequency,
                    can_view_organization_wide: updates.permissions.canViewOrganizationWide,
                    can_manage_settings: updates.permissions.canManageSettings,
                    can_create_projects: updates.permissions.canCreateProjects,
                    can_create_goals: updates.permissions.canCreateGoals,
                    can_invite_users: updates.permissions.canInviteUsers,
                    can_override_ai_scores: updates.permissions.canOverrideAIScores,
                });
            if (permError) throw permError;
        }

        return dbEmployeeToEmployee(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('employees')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
export const dbUtils = {
    async testConnection() {
        try {
            const { data, error } = await supabase.from('employees').select('count');
            if (error) throw error;
            return { success: true, message: 'Connected to Supabase successfully!' };
        } catch (error) {
            return { success: false, message: `Connection failed: ${error}` };
        }
    },

    async getStats() {
        const [projects, goals, reports, employees] = await Promise.all([
            supabase.from('projects').select('count'),
            supabase.from('goals').select('count'),
            supabase.from('reports').select('count'),
            supabase.from('employees').select('count'),
        ]);

        return {
            projectsCount: projects.data?.[0]?.count || 0,
            goalsCount: goals.data?.[0]?.count || 0,
            reportsCount: reports.data?.[0]?.count || 0,
            employeesCount: employees.data?.[0]?.count || 0,
        };
    },
};

// ============================================================================
// NOTIFICATIONS SERVICE
// ============================================================================

// Helper function to convert DB notification to TS Notification
function dbNotificationToNotification(dbNotif: any): Notification {
    return {
        id: dbNotif.id,
        userId: dbNotif.user_id,
        type: dbNotif.type,
        title: dbNotif.title,
        message: dbNotif.message,
        linkUrl: dbNotif.link_url,
        isRead: dbNotif.is_read,
        createdAt: dbNotif.created_at,
    };
}

export const notificationService = {
    async getAll(userId: string) {
        // Fetch all notifications for the user, ordered by newest first
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50); // Limit to last 50 for now

        if (error) throw error;
        return data ? data.map(dbNotificationToNotification) : [];
    },

    async getUnreadCount(userId: string) {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        return count || 0;
    },

    async markAsRead(notificationId: number) {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) throw error;
    },

    async markAllAsRead(userId: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false); // Only update unread ones

        if (error) throw error;
    },

    // For manual creation (e.g. from backend logic/Edge Functions, though most are triggers)
    async create(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) {
        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: notification.userId, // This should be the employee.id (string)
                type: notification.type,
                title: notification.title,
                message: notification.message,
                link_url: notification.linkUrl,
            });

        if (error) throw error;
    },

    async checkAndNotifyLateReports(employeeId: string) {
        // 1. Get all active goals for this employee
        // Get goals via project_assignees (goal_assignees table may not exist)
        const { data: assignedProjects } = await supabase
            .from('project_assignees')
            .select('project_id')
            .eq('assignee_id', employeeId);
        const assignedProjectIds = (assignedProjects || []).map((p: any) => p.project_id);

        let goals: any[] = [];
        let goalsError: any = null;
        if (assignedProjectIds.length > 0) {
            const result = await supabase
                .from('goals')
                .select('*, projects(report_frequency)')
                .in('project_id', assignedProjectIds)
                .eq('status', 'active');
            goals = result.data || [];
            goalsError = result.error;
        }

        if (goalsError) throw goalsError;
        if (!goals || goals.length === 0) return;

        // 2. For each goal, check the latest report
        for (const goal of goals) {
            const frequency = goal.projects?.report_frequency || 'weekly';

            const { data: recentReports, error: reportsError } = await supabase
                .from('reports')
                .select('submission_date')
                .eq('goal_id', goal.id)
                .order('submission_date', { ascending: false })
                .limit(1);

            if (reportsError) continue;

            const lastReportDate = recentReports && recentReports.length > 0 ? recentReports[0].submission_date : null;

            if (isReportLate(lastReportDate, frequency)) {
                // Check if employee is on leave around the due date.
                const today = new Date();
                const activeLeaves = await leaveService.getActiveLeavesByDateRange(employeeId, today, today);
                
                if (activeLeaves.length > 0) {
                    continue; // Skip alerting if on leave
                }
                
                // 3. Check if a late report notification already exists for this goal in the last 24h
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                const { data: existingNotif, error: notifError } = await supabase
                    .from('notifications')
                    .select('id')
                    .eq('user_id', employeeId)
                    .eq('type', 'alert')
                    .eq('link_url', `/goals/${goal.id}`)
                    .gt('created_at', oneDayAgo)
                    .maybeSingle();

                if (!notifError && !existingNotif) {
                    // 4. Create notification
                    await this.create({
                        userId: employeeId,
                        type: 'alert',
                        title: 'Late Report Due',
                        message: `Your report for "${goal.name}" is overdue. Please submit it as soon as possible.`,
                        linkUrl: `/goals/${goal.id}`,
                    });
                }
            }
        }
    }
};

// ============================================================================
// DASHBOARD SERVICE
// ============================================================================
export const dashboardService = {
    async getEmployeeDashboardData(employeeId: string, startDate?: string, endDate?: string) {
        // Batch 1: all four queries are independent — run in parallel
        let reportsQuery = supabase
            .from('reports')
            .select('*, goals(id, name, project_id), report_criterion_scores(*)')
            .eq('employee_id', employeeId);
        if (startDate) reportsQuery = reportsQuery.gte('submission_date', startDate);
        if (endDate) reportsQuery = reportsQuery.lte('submission_date', endDate);

        const [
            { data: employeeData, error: empError },
            { data: reportsData, error: reportsError },
            { data: assignedProjects },
            { data: assignedGoals },
        ] = await Promise.all([
            supabase.from('employees').select('*, manager:manager_id(*)').eq('id', employeeId).single(),
            reportsQuery.order('submission_date', { ascending: false }),
            supabase.from('project_assignees').select('project_id').eq('assignee_id', employeeId),
            supabase.from('goal_assignees').select('goal_id').eq('assignee_id', employeeId),
        ]);

        if (empError) throw empError;
        if (reportsError) throw reportsError;

        const employee = dbEmployeeToEmployee(employeeData);
        const manager = employeeData.manager ? dbEmployeeToEmployee(employeeData.manager) : null;
        const reports = (reportsData || []).map(dbReportToReport);

        // Batch 2: fetch goals from projects and direct assignments in parallel
        const empAssignedProjIds = (assignedProjects || []).map((p: any) => p.project_id);
        const empAssignedGoalIds = (assignedGoals || []).map((g: any) => g.goal_id);

        const [pGoalsResult, dGoalsResult] = await Promise.all([
            empAssignedProjIds.length > 0
                ? supabase.from('goals').select('*, projects(id, name, report_frequency, valid_report_days), criteria(*)').in('project_id', empAssignedProjIds)
                : Promise.resolve({ data: [] as any[], error: null }),
            empAssignedGoalIds.length > 0
                ? supabase.from('goals').select('*, projects(id, name, report_frequency, valid_report_days), criteria(*)').in('id', empAssignedGoalIds)
                : Promise.resolve({ data: [] as any[], error: null }),
        ]);

        if (pGoalsResult.error) throw pGoalsResult.error;
        if (dGoalsResult.error) throw dGoalsResult.error;

        // Merge, deduplicating goals that appear in both result sets
        const seenGoalIds = new Set<string>();
        let goalsData: any[] = [];
        for (const g of [...(pGoalsResult.data || []), ...(dGoalsResult.data || [])]) {
            if (!seenGoalIds.has(g.id)) {
                seenGoalIds.add(g.id);
                goalsData.push(g);
            }
        }

        const goals = (goalsData || []).map(g => ({
            ...dbGoalToGoal(g),
            projectName: g.projects?.name || 'Unknown Project',
            projectFrequency: g.projects?.report_frequency || 'weekly',
            validReportDays: g.projects?.valid_report_days ?? [1, 2, 3, 4, 5],
        }));

        // 4. Aggregations
        // currentScore is the average across all reports (matches "Average score" label in the UI
        // and is consistent with how the manager dashboard's team performance list computes employee scores)
        const currentScore = reports.length > 0
            ? reports.reduce((acc: number, r: any) => acc + Number(r.managerOverallScore ?? r.evaluationScore ?? 0), 0) / reports.length
            : 0;
        // delta = change between the two most recent scored reports (shown as "vs last report")
        const scoredReportsForDelta = reports.filter((r: any) =>
            r.managerOverallScore != null || r.evaluationScore != null
        );
        const latestScore = scoredReportsForDelta.length > 0 ? Number(scoredReportsForDelta[0].managerOverallScore ?? scoredReportsForDelta[0].evaluationScore ?? 0) : 0;
        const prevScore = scoredReportsForDelta.length > 1 ? Number(scoredReportsForDelta[1].managerOverallScore ?? scoredReportsForDelta[1].evaluationScore ?? 0) : latestScore;
        const delta = Number((latestScore - prevScore).toFixed(1));

        const activeGoalsCount = goals.filter(g => g.status === 'active').length;
        const projectsCount = new Set(goals.map(g => g.projectId)).size;

        // Best criterion (average across all reports)
        const criterionAverages: Record<string, { total: number, count: number }> = {};
        reports.forEach((r: any) => {
            r.criterionScores.forEach((cs: any) => {
                if (!criterionAverages[cs.criterionName]) {
                    criterionAverages[cs.criterionName] = { total: 0, count: 0 };
                }
                criterionAverages[cs.criterionName].total += Number(cs.score);
                criterionAverages[cs.criterionName].count += 1;
            });
        });

        let bestCriterion = { name: 'N/A', score: 0 };
        Object.entries(criterionAverages).forEach(([name, data]) => {
            const avg = data.total / data.count;
            if (avg > bestCriterion.score) {
                bestCriterion = { name, score: avg };
            }
        });

        // Skill Analysis (using criteria averages)
        const skills = Object.entries(criterionAverages).map(([name, data]) => {
            const score = data.total / data.count;
            return {
                name,
                score: Number(score.toFixed(1)),
                maxScore: 10,
                category: getSkillCategory(score),
            };
        }).sort((a: any, b: any) => b.score - a.score);

        // Trend (last 8 reports)
        const trendReports = [...reports].slice(0, 8).reverse();
        const trend = trendReports.map((r: any) => Number(Number(r.managerOverallScore ?? r.evaluationScore).toFixed(1)));
        const weeks = trendReports.map((r: any, i: number) => `R${i + 1}`);

        // Goals for UI
        const uiGoals = goals.map((g: any) => {
            const goalReports = reports.filter((r: any) => r.goalId === g.id);

            const avgScore = goalReports.length > 0
                ? goalReports.reduce((acc: any, r: any) => acc + Number(r.managerOverallScore ?? r.evaluationScore), 0) / goalReports.length
                : 0;

            // Average per criterion for this goal
            const goalCriteria = (g.criteria || []).map((c: any) => {
                const scores = goalReports.flatMap((r: any) => r.criterionScores.filter((cs: any) => cs.criterionName === c.name));
                const cAvg = scores.length > 0
                    ? scores.reduce((acc: any, s: any) => acc + Number(s.score), 0) / scores.length
                    : 0;
                return {
                    name: c.name,
                    w: c.weight,
                    score: Number(cAvg.toFixed(1))
                };
            });

            return {
                id: g.id,
                name: g.name,
                project: g.projectName,
                projectFrequency: g.projectFrequency || 'weekly', // Frequency from project for due date calc
                icon: '🎯',
                score: Number(avgScore.toFixed(1)),
                reports: goalReports.length,
                criteria: goalCriteria,
                deadline: g.deadline,
                status: g.status
            };
        });

        // Sort goals by deadline
        uiGoals.sort((a, b) => {
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });

        // History
        const history = reports.slice(0, 5).map((r: any) => {
            const goal = goals.find((g: any) => g.id === r.goalId);
            return {
                date: new Date(r.submissionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                goal: goal ? goal.name : 'Unknown Goal',
                score: Number(Number(r.managerOverallScore ?? r.evaluationScore).toFixed(1)),
                status: 'reviewed'
            };
        });

        return {
            me: {
                name: employee.name,
                initials: employee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
                role: employee.title || 'Team Member',
                team: goals.length > 0 ? goals[0].projectName : 'No Team Assigned',
                currentScore: Number(currentScore.toFixed(1)),
                baselineRequired: reports.length < 3,
                delta,
                trend,
                weeks,
            },
            kpis: [
                { label: 'Reports submitted', value: reports.length, meta: 'Total', icon: 'fileText' },
                { label: 'Active goals', value: activeGoalsCount, meta: `Across ${projectsCount} projects`, icon: 'target' },
                { label: 'Best criterion', value: Number(bestCriterion.score.toFixed(1)), meta: bestCriterion.name, icon: 'star' },
                { 
                    label: 'Next report due', 
                    value: (() => {
                        const activeGoalsWithDeadlines = goals.filter(g => g.deadline && g.status !== 'completed' && g.status !== 'archived');
                        if (activeGoalsWithDeadlines.length === 0) return 'N/A';
                        
                        const dueDates = activeGoalsWithDeadlines.map(g => new Date(g.deadline!).getTime());
                        const soonest = new Date(Math.min(...dueDates));
                        const diffMs = soonest.getTime() - Date.now();
                        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                        
                        if (diffMs < 0) return 'Overdue';
                        return days === 0 ? 'Today' : `${days}d`;
                    })(),
                    meta: 'Check goals', 
                    icon: 'clock' 
                },
            ],
            goals: uiGoals,
            skills: skills,
            history,
            manager: manager ? {
                name: manager.name,
                initials: manager.name.split(' ').map(n => n[0]).join('').toUpperCase(),
                title: manager.title || 'Manager'
            } : null
        };
    },

    async getManagerDashboardData(managerId: string, view: 'org' | 'direct' = 'org', startDate?: string, endDate?: string) {
        // 1. Get Manager Profile and Org ID
        const { data: managerData, error: managerError } = await supabase
            .from('employees')
            .select('*, organizations(*)')
            .eq('id', managerId)
            .single();

        if (managerError) throw managerError;
        const orgId = managerData.organization_id;

        // Batch 1: project_assignees (direct only), employees, and custom metrics are all independent
        const [assignedResult, employeesRawResult, customMetricsResult] = await Promise.all([
            view === 'direct'
                ? supabase.from('project_assignees').select('project_id').eq('assignee_id', managerId)
                : Promise.resolve({ data: null as any, error: null }),
            view === 'direct'
                ? supabase.from('employees').select('*').eq('organization_id', orgId).eq('manager_id', managerId)
                : supabase.from('employees').select('*').eq('organization_id', orgId),
            supabase.from('organization_custom_metrics').select('name').eq('organization_id', orgId).eq('is_active', true),
        ]);

        if (employeesRawResult.error) throw employeesRawResult.error;
        // Filter inactive in JS — safe whether or not the is_active column exists yet
        const employeesData = (employeesRawResult.data || []).filter((e: any) => e.is_active !== false);
        const directReportIds = employeesData.map((e: any) => e.id);

        // Batch 2: projects (needs assignedIds) and reports (needs directReportIds for direct view) — run in parallel
        const assignedIds = (assignedResult.data || []).map((a: any) => a.project_id);

        let projectsQuery = supabase
            .from('projects')
            .select('id, name, category, report_frequency, status, created_by, project_assignees(assignee_id, employees(name))')
            .eq('organization_id', orgId);
        if (view === 'direct') {
            projectsQuery = projectsQuery.or(`created_by.eq.${managerId}${assignedIds.length > 0 ? `,id.in.("${assignedIds.join('","')}")` : ''}`);
        }

        let reportsQuery = supabase
            .from('reports')
            .select('*, employees!reports_employee_id_fkey!inner(organization_id, name, manager_id), goals(project_id, name), report_criterion_scores(*)')
            .eq('employees.organization_id', orgId);
        if (view === 'direct') {
            reportsQuery = directReportIds.length > 0
                ? reportsQuery.in('employee_id', directReportIds)
                : reportsQuery.eq('employee_id', 'none');
        }
        if (startDate) reportsQuery = reportsQuery.gte('submission_date', startDate);
        if (endDate) reportsQuery = reportsQuery.lte('submission_date', endDate);

        const [projectsResult, reportsResult] = await Promise.all([
            projectsQuery,
            reportsQuery.order('submission_date', { ascending: false }),
        ]);

        if (projectsResult.error) throw projectsResult.error;
        if (reportsResult.error) throw reportsResult.error;

        const projectsData = projectsResult.data || [];
        const reportsData = reportsResult.data || [];
        const projectIds = projectsData.map((p: any) => p.id);

        // Batch 3: goals (needs projectIds) and reporting periods (needs employeeIds) — run in parallel
        const targetEmpIds = view === 'direct' ? directReportIds : employeesData.map((e: any) => e.id);

        const [goalsResult, periodsResult, managerSettingsResult] = await Promise.all([
            projectIds.length > 0
                ? (() => {
                    let q = supabase.from('goals').select('*, criteria(*)').in('project_id', projectIds);
                    if (view === 'direct') {
                        q = q.or(`created_by.eq.${managerId},project_id.in.("${projectIds.join('","')}")`);
                    }
                    return q;
                  })()
                : Promise.resolve({ data: [] as any[], error: null }),
            targetEmpIds.length > 0
                ? supabase.from('reporting_periods').select('*').in('employee_id', targetEmpIds).order('period_start', { ascending: false })
                : Promise.resolve({ data: [] as any[], error: null }),
            supabase.from('manager_settings').select('grace_period_days').eq('manager_id', managerId).maybeSingle(),
        ]);

        const goalsData: any[] = goalsResult.data || [];
        const periodsData: any[] = periodsResult.data || [];
        const graceDays: number = managerSettingsResult.data?.grace_period_days ?? 0;

        // Aggregations
        const totalReports = reportsData?.length || 0;
        const avgScore = totalReports > 0
            ? reportsData.reduce((acc: any, r: any) => acc + (r.manager_overall_score ?? r.evaluation_score ?? 0), 0) / totalReports
            : 0;

        // Organization Metrics average score
        // selected_metrics stores IDs (e.g. 'communication'); map to display names used in report_criterion_scores
        const DEFAULT_METRIC_ID_TO_NAME: Record<string, string> = {
            'communication': 'Communication',
            'initiative': 'Initiative',
            'collaboration': 'Collaboration',
            'delivery': 'On-time Delivery',
            'quality': 'Work Quality',
            'problem_solving': 'Problem Solving',
            'documentation': 'Documentation',
            'growth': 'Learning & Growth',
            'ownership': 'Ownership & Accountability',
        };
        const selectedMetricIds = managerData.organizations?.selected_metrics || [];
        const selectedMetricNames = new Set<string>(
            selectedMetricIds.map((id: string) => DEFAULT_METRIC_ID_TO_NAME[id]).filter(Boolean)
        );
        (customMetricsResult.data || []).forEach((m: any) => selectedMetricNames.add(m.name));

        let orgTotalScore = 0;
        let orgScoreCount = 0;

        if (reportsData && selectedMetricNames.size > 0) {
            reportsData.forEach((r: any) => {
                const scores = r.report_criterion_scores || [];
                scores.forEach((s: any) => {
                    if (selectedMetricNames.has(s.criterion_name)) {
                        orgTotalScore += Number(s.score);
                        orgScoreCount++;
                    }
                });
            });
        }
        const orgAvgScore = orgScoreCount > 0 ? orgTotalScore / orgScoreCount : null;

        // Projects for UI
        const uiProjects = (projectsData || []).map((p: any) => {
            const projectReports = (reportsData || []).filter((r: any) => r.goals?.project_id === p.id);
            const projectGoals = goalsData.filter((g: any) => g.project_id === p.id);
            const projectScore = projectReports.length > 0
                ? projectReports.reduce((acc: any, r: any) => acc + (r.manager_overall_score ?? r.evaluation_score ?? 0), 0) / projectReports.length
                : 0;

            return {
                id: p.id,
                name: p.name,
                category: p.category,
                frequency: p.report_frequency,
                status: p.status || (projectReports.length === 0 ? 'no-reports' : (projectScore >= 7.5 ? 'on-track' : projectScore >= 6.0 ? 'review' : 'at-risk')),
                score: Number(projectScore.toFixed(1)),
                reportCount: projectReports.length,
                goalCount: projectGoals.length,
                lastReport: projectReports.length > 0 ? new Date(projectReports[0].submission_date).toLocaleDateString() : 'Never',
                members: p.project_assignees?.map((pa: any) => ({
                    employee: { full_name: pa.employees?.name }
                })) || [],
                emoji: '📄'
            };
        });

        // Team Performance (Employees)
        // In Org view, show everyone. In Direct view, show only direct reports.
        const teamPerformance = (employeesData || [])
            .filter((e: any) => e.id !== managerId && e.role === 'employee') // Exclude self and managers
            .map((e: any) => {
            const empReports = (reportsData || []).filter((r: any) => r.employee_id === e.id);
            const empScore = empReports.length > 0
                ? empReports.reduce((acc: any, r: any) => acc + (r.manager_overall_score ?? r.evaluation_score ?? 0), 0) / empReports.length
                : 0;

            const baselineRequired = empReports.length < 3;

            const empPeriods = periodsData
                .filter(p => p.employee_id === e.id)
                .map(p => ({
                    id: p.id,
                    goalId: p.goal_id,
                    employeeId: p.employee_id,
                    periodStart: p.period_start,
                    periodEnd: p.period_end,
                    status: p.status,
                    lateSubmitted: p.late_submitted,
                    reportId: p.report_id,
                    createdAt: p.created_at,
                    updatedAt: p.updated_at
                }));
                
            const getRampUpEndsAt = (period: any) => {
                const goal = goalsData.find((g: any) => g.id === period.goalId);
                if (!goal) return null;
                const project = (projectsData || []).find((p: any) => p.id === goal.project_id);
                if (!project) return null;
                const assignee = (project.project_assignees || []).find((pa: any) => pa.assignee_id === e.id);
                return null; // assignee?.ramp_up_ends_at removed
            };

            const compliance = calculateComplianceStreak(empPeriods, getRampUpEndsAt, 10, graceDays);

            return {
                id: e.id,
                name: e.name,
                role: e.title || 'Team Member',
                score: baselineRequired ? null : Number(empScore.toFixed(1)),
                baselineRequired,
                compliance,
                status: empReports.length === 0 ? 'no-data' : (empScore >= 7.5 ? 'on-track' : empScore >= 6.0 ? 'review' : 'at-risk')
            };
        }).sort((a: any, b: any) => {
            if (a.score === null && b.score !== null) return 1;
            if (a.score !== null && b.score === null) return -1;
            return b.score - a.score;
        });

        // Goal Alignment data
        const uiGoals = goalsData.map((g: any) => {
            const goalReports = (reportsData || []).filter((r: any) => r.goal_id === g.id);
            const goalScore = goalReports.length > 0
                ? goalReports.reduce((acc: any, r: any) => acc + (r.manager_overall_score ?? r.evaluation_score ?? 0), 0) / goalReports.length
                : 0;
            
            // For total submissions, we might need all reports for this goal if it's shared
            // but in Direct view, we only show reports from direct reports.
            
            const ownerCounts: Record<string, { name: string, count: number }> = {};
            goalReports.forEach((r: any) => {
                const empName = r.employees?.name || 'Unknown';
                if (!ownerCounts[empName]) ownerCounts[empName] = { name: empName, count: 0 };
                ownerCounts[empName].count++;
            });
            const topOwner = Object.values(ownerCounts).sort((a: any, b: any) => b.count - a.count)[0];

            return {
                id: g.id,
                name: g.name,
                score: Number(goalScore.toFixed(1)),
                owner: topOwner ? topOwner.name : 'Unassigned',
                reports: goalReports.length,
                overdue: false,
            };
        }).filter((g: any) => g.reports > 0 || goalsData.length <= 10)
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 8);

        // Trend scores
        const trendScores = (() => {
            if (!reportsData || reportsData.length === 0) return [];
            const sorted = [...reportsData].sort((a: any, b: any) => new Date(a.submission_date).getTime() - new Date(b.submission_date).getTime());
            
            let runningTotal = 0;
            let runningCount = 0;
            const points: number[] = [];
            
            sorted.forEach((r: any) => {
                const score = r.manager_overall_score ?? r.evaluation_score ?? 0;
                runningTotal += score;
                runningCount++;
                points.push(Number((runningTotal / runningCount).toFixed(1)));
            });
            
            if (points.length <= 8) return points;
            const sampled = [];
            const step = (points.length - 1) / 7;
            for (let i = 0; i < 7; i++) {
                sampled.push(points[Math.floor(i * step)]);
            }
            sampled.push(points[points.length - 1]);
            return sampled;
        })();

        return {
            totalReports,
            avgScore: Number(avgScore.toFixed(1)),
            orgAvgScore: orgAvgScore !== null ? Number(orgAvgScore.toFixed(1)) : null,
            projects: uiProjects,
            teamPerformance,
            goals: uiGoals,
            trendScores,
            lateSubmissions: periodsData.filter((p: any) => p.status === 'late'),
            recentReports: (reportsData || []).slice(0, 5).map((r: any) => ({
                id: r.id,
                employeeName: r.employees?.name || 'Unknown',
                date: new Date(r.submission_date).toLocaleDateString(),
                score: r.manager_overall_score ?? r.evaluation_score
            }))
        };
    }
};

// ============================================================================
// INVITATION SERVICE
// ============================================================================
export interface Invitation {
    id: string;
    token: string;
    email: string;
    role: 'manager' | 'employee';
    organizationId: string;
    invitedBy: string;
    invitedAt: string;
    expiresAt: string;
    acceptedAt?: string;
    status: 'pending' | 'accepted' | 'expired';
    initialProjectIds?: string[];
    initialGoalIds?: string[];
    initialManagerId?: string;
    permissionTemplate?: string;
    customPermissions?: any;
}

export const invitationService = {
    async create(invitation: Partial<Invitation>) {
        const insertData: any = {
            id: invitation.id || `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            token: invitation.token,
            email: invitation.email,
            role: invitation.role,
            organization_id: invitation.organizationId,
            invited_by: invitation.invitedBy,
            invited_at: new Date().toISOString(),
            expires_at: invitation.expiresAt,
            status: 'pending',
            initial_project_ids: invitation.initialProjectIds || [],
            initial_goal_ids: invitation.initialGoalIds || [],
            permission_template: invitation.permissionTemplate,
            custom_permissions: invitation.customPermissions
        };

        if (invitation.initialManagerId) {
            insertData.initial_manager_id = invitation.initialManagerId;
        }

        const { data, error } = await supabase
            .from('invitations')
            .insert(insertData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getByToken(token: string) {
        const { data, error } = await supabase
            .from('invitations')
            .select('*')
            .eq('token', token)
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;
        return {
            id: data.id,
            token: data.token,
            email: data.email,
            role: data.role,
            organizationId: data.organization_id,
            invitedBy: data.invited_by,
            invitedAt: data.invited_at,
            expiresAt: data.expires_at,
            acceptedAt: data.accepted_at,
            status: data.status,
            initialProjectIds: data.initial_project_ids,
            initialGoalIds: data.initial_goal_ids,
            initialManagerId: data.initial_manager_id,
            permissionTemplate: data.permission_template,
            customPermissions: data.custom_permissions
        } as Invitation;
    },

    async markAccepted(token: string) {
        const { data, error } = await supabase
            .from('invitations')
            .update({ status: 'accepted', accepted_at: new Date().toISOString() })
            .eq('token', token)
            .select()
            .single()

        if (error) throw error;
        return data;
    }
};

// ============================================================================
// LEAVE SERVICE
// ============================================================================
export const leaveService = {
    async getByEmployeeId(employeeId: string) {
        const { data, error } = await supabase
            .from('leaves')
            .select('*')
            .eq('employee_id', employeeId)
            .order('start_date', { ascending: false });

        if (error) throw error;
        return data.map((l: any) => ({
            id: l.id,
            employeeId: l.employee_id,
            organizationId: l.organization_id,
            startDate: l.start_date,
            endDate: l.end_date,
            leaveType: l.leave_type,
            note: l.note,
            approvedBy: l.approved_by,
            createdAt: l.created_at,
            updatedAt: l.updated_at
        })) as Leave[];
    },

    async getByOrganizationId(organizationId: string) {
        const { data, error } = await supabase
            .from('leaves')
            .select('*')
            .eq('organization_id', organizationId)
            .order('start_date', { ascending: false });

        if (error) throw error;
        return data.map((l: any) => ({
            id: l.id,
            employeeId: l.employee_id,
            organizationId: l.organization_id,
            startDate: l.start_date,
            endDate: l.end_date,
            leaveType: l.leave_type,
            note: l.note,
            approvedBy: l.approved_by,
            createdAt: l.created_at,
            updatedAt: l.updated_at
        })) as Leave[];
    },

    async getActiveLeavesByDateRange(employeeId: string, startDate: Date, endDate: Date) {
        const leaves = await this.getByEmployeeId(employeeId);
        return leaves.filter(l => {
            const lStart = new Date(l.startDate);
            const lEnd = new Date(l.endDate);
            // Overlaps if l.start <= period.end AND l.end >= period.start
            return lStart <= endDate && lEnd >= startDate;
        });
    },

    async create(leave: Omit<Leave, 'createdAt' | 'updatedAt' | 'id'>) {
        const insertData: any = {
            id: `leave-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            employee_id: leave.employeeId,
            organization_id: leave.organizationId,
            start_date: leave.startDate,
            end_date: leave.endDate,
            leave_type: leave.leaveType,
            note: leave.note,
            approved_by: leave.approvedBy
        };

        const { data, error } = await supabase
            .from('leaves')
            .insert(insertData)
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            employeeId: data.employee_id,
            organizationId: data.organization_id,
            startDate: data.start_date,
            endDate: data.end_date,
            leaveType: data.leave_type,
            note: data.note,
            approvedBy: data.approved_by,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        } as Leave;
    }
};
