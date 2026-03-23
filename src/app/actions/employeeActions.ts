'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { employeeService, reportService, goalService } from '@/../databaseService2'

export async function getEmployeesAction() {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { error: 'Not authenticated' }
        }

        const staffMembers = await employeeService.getStaffMembers()

        // Fetch all reports to calculate avg scores and last report dates
        const allReports = await reportService.getAll()

        // Fetch all goals to calculate goal counts
        const allGoals = await goalService.getAll()

        const employeesWithMetrics = staffMembers.map((emp: any) => {
            const empReports = allReports.filter((r: any) => r.employeeId === emp.id)
            const empGoals = allGoals.filter((g: any) => g.managerId === emp.id || (g as any).assignees?.includes(emp.id))

            // Calculate avg score
            const scoredReports = empReports.filter((r: any) => (r.managerOverallScore ?? r.evaluationScore) !== null)
            const avgScore = scoredReports.length > 0
                ? scoredReports.reduce((acc: number, r: any) => acc + (r.managerOverallScore ?? r.evaluationScore ?? 0), 0) / scoredReports.length
                : 0

            // Last report date
            const lastReportDate = empReports.length > 0
                ? [...empReports].sort((a: any, b: any) => new Date(b.submissionDate || '').getTime() - new Date(a.submissionDate || '').getTime())[0].submissionDate
                : 'Pending'

            return {
                ...emp,
                avgScore: Number(avgScore.toFixed(1)),
                reportCount: empReports.length,
                goalCount: empGoals.length,
                lastReport: lastReportDate && lastReportDate !== 'Pending'
                    ? new Date(lastReportDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Pending',
                trend: 0 // Placeholder for now
            }
        })

        return { employees: employeesWithMetrics }
    } catch (error) {
        console.error('getEmployeesAction Error:', error)
        return { error: 'Failed to fetch employees' }
    }
}

export async function getManagersAction() {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { error: 'Not authenticated' }
        }

        const managers = await employeeService.getManagers()
        return { managers }
    } catch (error) {
        console.error('getManagersAction Error:', error)
        return { error: 'Failed to fetch managers' }
    }
}

export async function updateEmployeeProfileAction(id: string, updates: { name?: string; title?: string; dept?: string }) {
    try {
        const supabase = createServerClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Not authenticated' }
        }

        await employeeService.update(id, updates)

        revalidatePath('/account') // Refresh page

        return { success: true }
    } catch (error) {
        console.error('updateEmployeeProfileAction Error:', error)
        return { success: false, error: 'Failed to update employee' }
    }
}

export async function updatePasswordAction(password: string) {
    try {
        const supabase = createServerClient()
        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            console.error('Supabase update password error:', error)
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (error) {
        console.error('updatePasswordAction Error:', error)
        return { success: false, error: 'Failed to update password' }
    }
}

export async function updateEmployeePermissionsAction(id: string, permissions: any) {
    try {
        console.log(`[PERM_UPDATE] Starting for ID: ${id}`);
        console.log(`[PERM_UPDATE] Permissions requested:`, JSON.stringify(permissions, null, 2));

        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.warn('[PERM_UPDATE] Not authenticated');
            return { success: false, error: 'Not authenticated' }
        }
        console.log(`[PERM_UPDATE] User authenticated: ${user.id}`);

        const currentUser = await employeeService.getByAuthId(user.id)
        if (!currentUser || (currentUser.role !== 'manager' && !currentUser.isAccountOwner)) {
            console.warn(`[PERM_UPDATE] Unauthorized attempt by user ${user.id}. Role: ${currentUser?.role}, isAccountOwner: ${currentUser?.isAccountOwner}`);
            return { success: false, error: 'Unauthorized' }
        }
        console.log(`[PERM_UPDATE] User authorized: ${currentUser.id} (Role: ${currentUser.role}, Owner: ${currentUser.isAccountOwner})`);

        // Use admin client to bypass RLS for upserting employee_permissions
        const { createAdminClient } = await import('@/lib/supabase/server')
        const adminClient = createAdminClient()
        console.log('[PERM_UPDATE] Admin client created.');

        // Verify employee exists
        const { data: employee, error: empError } = await (adminClient.from('employees') as any)
            .select('organization_id, name')
            .eq('id', id)
            .single()

        if (empError) {
            console.error('[PERM_UPDATE] Employee fetch error:', empError);
            return { success: false, error: 'Employee not found' }
        }
        console.log(`[PERM_UPDATE] Found employee: ${employee.name} in Org: ${employee.organization_id}`);

        const payload = {
            employee_id: id,
            can_invite_users: !!permissions.canInviteUsers,
            can_create_projects: !!permissions.canCreateProjects,
            can_create_goals: !!permissions.canCreateGoals,
            can_view_organization_wide: !!permissions.canViewOrganizationWide,
            can_manage_settings: !!permissions.canManageSettings,
            can_set_global_frequency: !!permissions.canSetGlobalFrequency,
            can_override_ai_scores: !!permissions.canOverrideAIScores,
        }

        console.log(`[PERM_UPDATE] Executing upsert with payload:`, JSON.stringify(payload, null, 2));

        const { data: upsertData, error: permError } = await (adminClient.from('employee_permissions') as any)
            .upsert(payload, { onConflict: 'employee_id' })
            .select()

        if (permError) {
            console.error('[PERM_UPDATE] Upsert error:', permError);
            return { success: false, error: 'Database update failed' }
        }
        
        console.log('[PERM_UPDATE] Upsert successful. Data returned:', JSON.stringify(upsertData, null, 2));

        // Revalidate to ensure UI reflects changes
        revalidatePath('/', 'layout')
        revalidatePath('/dashboard')
        revalidatePath('/organization')
        revalidatePath(`/employees/${id}`)
        console.log('[PERM_UPDATE] Paths revalidated.');

        return { success: true }
    } catch (error) {
        console.error('[PERM_UPDATE] Unexpected error:', error)
        return { success: false, error: 'Internal Error' }
    }
}
