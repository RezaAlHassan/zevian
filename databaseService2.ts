import { supabase } from './supabaseClient';
import type { Project, Goal, Report, Employee, Organization, Notification, CustomMetric } from './src/types';
import { isReportLate, getNextReportDueDate } from './src/utils/reportDueDate';

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
            aiConfig: data.ai_config,
            createdAt: data.created_at
        } as Organization;
    },
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
        createdBy: dbProject.created_by,
        createdAt: dbProject.created_at,
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
                goals(id, status, deadline, reports(id, evaluation_score))
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
                goals(id, status, deadline, reports(id, evaluation_score))
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
                if (typeof report.evaluation_score === 'number' && !isNaN(report.evaluation_score)) {
                    totalScore += report.evaluation_score;
                    scoredReports++;
                }
            });
        });

        let avgScore: number | null = scoredReports > 0 ? Number((totalScore / scoredReports).toFixed(1)) : null;

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
            status: derivedStatus,
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
                knowledge_base_link: project.knowledgeBaseLink,
                ai_context: project.aiContext,
                created_by: project.createdBy,
                created_at: project.createdAt || new Date().toISOString(),
            });
        // Removed .select() to avoid RLS 403 race condition

        if (error) {
            console.error("Supabase Project Insert Error:", error);
            throw error;
        }

        // Insert assignees
        if (project.assignees && project.assignees.length > 0) {
            const assigneesToInsert = project.assignees.map(a => ({
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
        if (updates.knowledgeBaseLink !== undefined) dbUpdates.knowledge_base_link = updates.knowledgeBaseLink;
        if (updates.aiContext !== undefined) dbUpdates.ai_context = updates.aiContext;
        if (updates.knowledgeBaseCache !== undefined) dbUpdates.knowledge_base_cache = updates.knowledgeBaseCache;

        const { data, error } = await supabase
            .from('projects')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;

        // Update assignees if provided
        if (updates.assignees) {
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
        console.log('[projectService.getByEmployeeId] directProjIds:', directProjIds);

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

        const allProjIds = Array.from(new Set([...directProjIds, ...goalProjIds]));
        console.log('[projectService.getByEmployeeId] allProjIds:', allProjIds);

        if (allProjIds.length === 0) return [];

        const { data, error } = await supabase
            .from('projects')
            .select(`
                *, 
                project_assignees(assignee_id, assignee_type, employees(name)),
                goals(id, status, deadline, reports(id, evaluation_score))
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
            .select('*, projects(*), criteria(*)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        if (!data) return [];

        const goalIds = data.map((g: any) => g.id);
        const goalMembersMap = await fetchGoalMembersMap(goalIds);

        return data.map((g: any) => ({
            ...dbGoalToGoal(g),
            project: g.projects ? projectService.mapProjectWithMetrics({ ...g.projects, goals: [], reports: [] }) : null,
            goal_members: goalMembersMap[g.id] || []
        }));
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('goals')
            .select('*, projects(*), criteria(*)')
            .eq('id', id)
            .single();
        if (error) throw error;
        if (!data) return null;

        const goalMembersMap = await fetchGoalMembersMap([id]);

        return {
            ...dbGoalToGoal(data),
            project: data.projects ? projectService.mapProjectWithMetrics({ ...data.projects, goals: [], reports: [] }) : null,
            goal_members: goalMembersMap[id] || []
        };
    },

    async getByProjectId(projectId: string) {
        const { data, error } = await supabase
            .from('goals')
            .select('*, criteria(*)')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        if (!data) return [];

        const goalIds = data.map((g: any) => g.id);
        const goalMembersMap = await fetchGoalMembersMap(goalIds);

        return data.map((g: any) => ({
            ...dbGoalToGoal(g),
            goal_members: goalMembersMap[g.id] || []
        }));
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
            }));

            const { error: criteriaError } = await supabase
                .from('criteria')
                .insert(criteriaToInsert);
            if (criteriaError) throw criteriaError;
        }

        // Insert goal assignees
        if (goal.assignees && goal.assignees.length > 0) {
            const assigneesToInsert = goal.assignees.map((idOrObj: any) => {
                const assigneeId = typeof idOrObj === 'string' ? idOrObj : (idOrObj.id || idOrObj.employee_id);
                return {
                    goal_id: goal.id,
                    assignee_id: assigneeId,
                    assignee_type: 'employee' // Default to employee
                };
            });

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

    async getByEmployeeId(employeeId: string) {
        console.log('[goalService.getByEmployeeId] Fetching for employee:', employeeId);
        
        // 1. Get projects where employee is assigned
        const { data: directProjects } = await supabase
            .from('project_assignees')
            .select('project_id')
            .eq('assignee_id', employeeId);
        const directProjIds = (directProjects || []).map((p: any) => p.project_id);

        // 2. Get goals where employee is explicitly assigned
        const { data: goalAssignments, error: gaError } = await supabase
            .from('goal_assignees')
            .select('goal_id')
            .eq('assignee_id', employeeId);
        
        if (gaError) throw gaError;

        const empAssignedGoalIds = (goalAssignments || []).map((g: any) => g.goal_id);

        // 3. Fetch goals from both sources
        let query = supabase
            .from('goals')
            .select(`
                *, 
                projects(*), 
                criteria(*),
                reports(id, evaluation_score)
            `);

        // Union: goals in assigned projects OR goals explicitly assigned
        if (directProjIds.length > 0 && empAssignedGoalIds.length > 0) {
            query = query.or(`project_id.in.("${directProjIds.join('","')}"),id.in.("${empAssignedGoalIds.join('","')}")`);
        } else if (directProjIds.length > 0) {
            query = query.in('project_id', directProjIds);
        } else if (empAssignedGoalIds.length > 0) {
            query = query.in('id', empAssignedGoalIds);
        } else {
            return [];
        }

        const { data: goalsData, error: goalsError } = await query.order('created_at', { ascending: false });

        if (goalsError) throw goalsError;

        if (!goalsData || goalsData.length === 0) return [];

        // 4. Fetch goal assignees separately (no FK join possible between goal_assignees and employees)
        const goalIds = goalsData.map((g: any) => g.id);
        const goalMembersMap = await fetchGoalMembersMap(goalIds);

        return (goalsData || []).map((g: any) => {
            const reports = g.reports || [];
            const avgScore = reports.length > 0 
                ? reports.reduce((acc: number, r: any) => acc + Number(r.evaluation_score), 0) / reports.length 
                : 0;

            return {
                ...dbGoalToGoal(g),
                project: g.projects ? projectService.mapProjectWithMetrics({
                    ...g.projects,
                    goals: [],
                    reports: []
                }) : null,
                report_count: reports.length,
                avg_score: Number(avgScore.toFixed(1)),
                goal_members: goalMembersMap[g.id] || []
            };
        });
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
            reasoning: s.reasoning
        })) : [],
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
                    reasoning: score.reasoning
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

    async getManagerReports(managerId: string) {
        // First get direct report IDs
        const { data: directReports } = await supabase
            .from('employees')
            .select('id')
            .eq('manager_id', managerId);

        const employeeIds = (directReports || []).map((e: any) => e.id);
        if (employeeIds.length === 0) return [];

        const { data, error } = await supabase
            .from('reports')
            .select('*, goals(id, name, projects(id, name)), employees!reports_employee_id_fkey(id, name, title, avatar_url), report_criterion_scores(*)')
            .in('employee_id', employeeIds)
            .order('submission_date', { ascending: false });

        if (error) throw error;
        return data ? data.map(dbReportToReport) : [];
    },

    async getEmployeeReports(employeeId: string) {
        const { data, error } = await supabase
            .from('reports')
            .select('*, goals(id, name, projects(id, name)), employees!reports_employee_id_fkey(id, name, title, avatar_url), report_criterion_scores(*)')
            .eq('employee_id', employeeId)
            .order('submission_date', { ascending: false });

        if (error) throw error;
        return data ? data.map(dbReportToReport) : [];
    },
};

// ============================================================================
// EMPLOYEES SERVICE
// ============================================================================

// Helper function to convert database employee to TypeScript Employee
function dbEmployeeToEmployee(dbEmployee: any): Employee {
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
        permissions: dbEmployee.employee_permissions ? {
            canSetGlobalFrequency: dbEmployee.employee_permissions.can_set_global_frequency,
            canViewOrganizationWide: dbEmployee.employee_permissions.can_view_organization_wide,
            canManageSettings: dbEmployee.employee_permissions.can_manage_settings,
        } : undefined,
        skillAnalysis: dbEmployee.skill_analysis || undefined,
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
        return data ? data.map(dbEmployeeToEmployee) : [];
    },

    async getTeamMembers(managerId: string) {
        const { data, error } = await supabase
            .from('employees')
            .select('*, employee_permissions(*)')
            .eq('manager_id', managerId)
            .order('name', { ascending: true });
        if (error) throw error;
        return data ? data.map(dbEmployeeToEmployee) : [];
    },

    async getStaffMembers() {
        // Fetch only 'employee' role as per user request to exclude managers/owners
        const { data, error } = await supabase
            .from('employees')
            .select('*, employee_permissions(*)')
            .eq('role', 'employee')
            .order('name', { ascending: true });

        if (error) throw error;
        return data ? data.map(dbEmployeeToEmployee) : [];
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
    async getEmployeeDashboardData(employeeId: string) {
        // 1. Get Employee Profile with manager details
        const { data: employeeData, error: empError } = await supabase
            .from('employees')
            .select('*, manager:manager_id(*)')
            .eq('id', employeeId)
            .single();

        if (empError) throw empError;
        const employee = dbEmployeeToEmployee(employeeData);
        const manager = employeeData.manager ? dbEmployeeToEmployee(employeeData.manager) : null;

        // 2. Get Employee's Reports with criteria scores and goal names
        const { data: reportsData, error: reportsError } = await supabase
            .from('reports')
            .select('*, goals(id, name, project_id), report_criterion_scores(*)')
            .eq('employee_id', employeeId)
            .order('submission_date', { ascending: false });

        if (reportsError) throw reportsError;
        const reports = (reportsData || []).map(dbReportToReport);

        // 3. Get Employee's Goals with projects and criteria
        // Part A: Goals via project assignments
        const { data: assignedProjects } = await supabase
            .from('project_assignees')
            .select('project_id')
            .eq('assignee_id', employeeId);
        const empAssignedProjIds = (assignedProjects || []).map((p: any) => p.project_id);
        
        // Part B: Goals via direct goal assignments
        const { data: assignedGoals } = await supabase
            .from('goal_assignees')
            .select('goal_id')
            .eq('assignee_id', employeeId);
        const empAssignedGoalIds = (assignedGoals || []).map((g: any) => g.goal_id);

        let goalsData: any[] = [];
        
        // Fetch goals from projects
        if (empAssignedProjIds.length > 0) {
            const { data: pGoals, error: pgError } = await supabase
                .from('goals')
                .select('*, projects(id, name), criteria(*)')
                .in('project_id', empAssignedProjIds);
            if (pgError) throw pgError;
            if (pGoals) goalsData = [...goalsData, ...pGoals];
        }

        // Fetch goals from direct assignments (and filter out duplicates)
        if (empAssignedGoalIds.length > 0) {
            const existingGoalIds = new Set(goalsData.map(g => g.id));
            const newGoalIds = empAssignedGoalIds.filter((id: string) => !existingGoalIds.has(id));
            
            if (newGoalIds.length > 0) {
                const { data: directGoals, error: dgError } = await supabase
                    .from('goals')
                    .select('*, projects(id, name), criteria(*)')
                    .in('id', newGoalIds);
                if (dgError) throw dgError;
                if (directGoals) goalsData = [...goalsData, ...directGoals];
            }
        }

        const goals = (goalsData || []).map(g => ({
            ...dbGoalToGoal(g),
            projectName: g.projects?.name || 'Unknown Project'
        }));

        // 4. Aggregations
        const currentScore = reports.length > 0 ? reports[0].evaluationScore : 0;
        const prevScore = reports.length > 1 ? reports[1].evaluationScore : currentScore;
        const delta = Number((currentScore - prevScore).toFixed(1));

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
            let category: 'strength' | 'neutral' | 'weakness' = 'neutral';
            if (score >= 8.5) category = 'strength';
            else if (score < 7.0) category = 'weakness';

            return {
                name,
                score: Number(score.toFixed(1)),
                maxScore: 10,
                category
            };
        }).sort((a: any, b: any) => b.score - a.score);

        // Trend (last 8 reports)
        const trendReports = [...reports].slice(0, 8).reverse();
        const trend = trendReports.map((r: any) => Number(Number(r.evaluationScore).toFixed(1)));
        const weeks = trendReports.map((r: any, i: number) => `R${i + 1}`);

        // Goals for UI
        const uiGoals = goals.map((g: any) => {
            const goalReports = reports.filter((r: any) => r.goalId === g.id);

            const avgScore = goalReports.length > 0
                ? goalReports.reduce((acc: any, r: any) => acc + Number(r.evaluationScore), 0) / goalReports.length
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
                icon: '🎯',
                score: Number(avgScore.toFixed(1)),
                reports: goalReports.length,
                criteria: goalCriteria
            };
        });

        // History
        const history = reports.slice(0, 5).map((r: any) => {
            const goal = goals.find((g: any) => g.id === r.goalId);
            return {
                date: new Date(r.submissionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                goal: goal ? goal.name : 'Unknown Goal',
                score: Number(Number(r.evaluationScore).toFixed(1)),
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
                        if (goals.length === 0) return 'N/A';
                        const dueDates = goals.map(g => {
                            const lastReport = reports.find((r: any) => r.goalId === g.id);
                            const frequency = 'weekly'; // Defaulting to weekly for now as projects are mapped differently
                            return getNextReportDueDate(lastReport?.submissionDate, frequency);
                        });
                        const soonest = new Date(Math.min(...dueDates.map(d => d.getTime())));
                        const days = Math.ceil((soonest.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        return days > 0 ? `${days}d` : 'Today';
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

    async getManagerDashboardData(managerId: string) {
        // 1. Get Manager Profile and Org ID
        const { data: managerData, error: managerError } = await supabase
            .from('employees')
            .select('*, organizations(*)')
            .eq('id', managerId)
            .single();

        if (managerError) throw managerError;
        const orgId = managerData.organization_id;

        // 2. Get all projects for the organization
        const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('id, name, category, report_frequency, project_assignees(assignee_id, employees(name))')
            .eq('organization_id', orgId);

        if (projectsError) throw projectsError;

        // 3. Get all employees for the organization
        const { data: employeesData, error: employeesError } = await supabase
            .from('employees')
            .select('*')
            .eq('organization_id', orgId);

        if (employeesError) throw employeesError;

        // 4. Get all reports for the organization
        const { data: reportsData, error: reportsError } = await supabase
            .from('reports')
            .select('*, employees!reports_employee_id_fkey!inner(organization_id, name), goals(project_id, name)')
            .eq('employees.organization_id', orgId)
            .order('submission_date', { ascending: false });

        if (reportsError) throw reportsError;

        // 5. Get all goals for the organization's projects
        const projectIds = (projectsData || []).map((p: any) => p.id);
        let goalsData: any[] = [];
        if (projectIds.length > 0) {
            const { data: gData, error: goalsError } = await supabase
                .from('goals')
                .select('*, criteria(*)')
                .in('project_id', projectIds);
            if (!goalsError && gData) goalsData = gData;
        }

        // 6. Aggregations
        const totalReports = reportsData?.length || 0;
        const avgScore = totalReports > 0
            ? reportsData.reduce((acc: any, r: any) => acc + (r.evaluation_score || 0), 0) / totalReports
            : 0;

        // Projects for UI
        const uiProjects = (projectsData || []).map((p: any) => {
            const projectReports = (reportsData || []).filter((r: any) => r.goals?.project_id === p.id);
            const projectGoals = goalsData.filter((g: any) => g.project_id === p.id);
            const projectScore = projectReports.length > 0
                ? projectReports.reduce((acc: any, r: any) => acc + (r.evaluation_score || 0), 0) / projectReports.length
                : 0;

            return {
                id: p.id,
                name: p.name,
                category: p.category,
                frequency: p.report_frequency,
                status: projectScore >= 7.5 ? 'active' : projectScore >= 6.0 ? 'review' : 'at-risk',
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
        const teamPerformance = (employeesData || []).map((e: any) => {
            const empReports = (reportsData || []).filter((r: any) => r.employee_id === e.id);
            const empScore = empReports.length > 0
                ? empReports.reduce((acc: any, r: any) => acc + (r.evaluation_score || 0), 0) / empReports.length
                : 0;

            return {
                name: e.name,
                role: e.title || 'Team Member',
                score: Number(empScore.toFixed(1)),
                status: empScore >= 7.5 ? 'on-track' : empScore >= 6.0 ? 'review' : 'at-risk'
            };
        }).sort((a: any, b: any) => b.score - a.score);

        // Goal Alignment data
        const uiGoals = goalsData.map((g: any) => {
            const goalReports = (reportsData || []).filter((r: any) => r.goal_id === g.id);
            const goalScore = goalReports.length > 0
                ? goalReports.reduce((acc: any, r: any) => acc + (r.evaluation_score || 0), 0) / goalReports.length
                : 0;
            // Find the employee who submitted most reports for this goal
            const ownerCounts: Record<string, { name: string, count: number }> = {};
            goalReports.forEach((r: any) => {
                const empName = r.employees?.name || 'Unknown';
                if (!ownerCounts[empName]) ownerCounts[empName] = { name: empName, count: 0 };
                ownerCounts[empName].count++;
            });
            const topOwner = Object.values(ownerCounts).sort((a: any, b: any) => b.count - a.count)[0];

            return {
                name: g.name,
                score: Number(goalScore.toFixed(1)),
                owner: topOwner ? topOwner.name : 'Unassigned',
                reports: goalReports.length,
                overdue: false,
            };
        }).filter((g: any) => g.reports > 0 || goalsData.length <= 10) // Show all if few goals, or only those with reports
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 8);

        // Trend scores (average per week/period)
        const trendScores = (() => {
            if (!reportsData || reportsData.length === 0) return [];
            const sorted = [...reportsData].sort((a: any, b: any) => new Date(a.submission_date).getTime() - new Date(b.submission_date).getTime());
            // Group into chunks of ~5 reports for trend points
            const chunkSize = Math.max(1, Math.floor(sorted.length / 6));
            const points: number[] = [];
            for (let i = 0; i < sorted.length; i += chunkSize) {
                const chunk = sorted.slice(i, i + chunkSize);
                const avg = chunk.reduce((acc: any, r: any) => acc + (r.evaluation_score || 0), 0) / chunk.length;
                points.push(Number(avg.toFixed(1)));
            }
            return points.slice(0, 8);
        })();

        return {
            totalReports,
            avgScore: Number(avgScore.toFixed(1)),
            projects: uiProjects,
            teamPerformance,
            goals: uiGoals,
            trendScores,
            lateSubmissions: [],
            recentReports: (reportsData || []).slice(0, 5).map((r: any) => ({
                id: r.id,
                employeeName: (employeesData || []).find((e: any) => e.id === r.employee_id)?.name || 'Unknown',
                date: new Date(r.submission_date).toLocaleDateString(),
                score: r.evaluation_score
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
            initial_goal_ids: invitation.initialGoalIds || []
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
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // not found
            throw error;
        }
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
            initialManagerId: data.initial_manager_id
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

