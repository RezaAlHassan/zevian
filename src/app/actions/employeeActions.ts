'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { employeeService } from '@/../databaseService2'
import { computeTrustSignal } from '@/utils/trustSignal'
import { getSessionContext, getAuthUser } from '@/lib/auth/session'

export async function getEmployeesAction(view?: 'org' | 'direct') {
    try {
        // Cached identity lookup shared with the layout — no repeat auth/employee round-trips.
        const ctx = await getSessionContext()
        if (!ctx) {
            return { error: 'Not authenticated' }
        }
        const { employee } = ctx

        const isSenior = employee.isAccountOwner ||
            employee.role === 'admin' ||
            (employee.permissions?.canViewOrganizationWide ?? false)
        const effectiveView = view ?? (isSenior ? 'org' : 'direct')

        // Enforce: non-senior managers cannot use org view
        const safeView = (!isSenior && effectiveView === 'org') ? 'direct' : effectiveView

        // One parallel batch, and only the columns this page aggregates. The previous
        // version ran 3 sequential round-trips and then reportService.getAll() /
        // goalService.getAll() — every report with goals(*), employees(*), and all
        // criterion scores embedded — just to compute per-employee counts and averages.
        const supabase = createServerClient()
        const [staffMembers, managers, slimReportsResult, goalAssigneesResult] = await Promise.all([
            safeView === 'direct'
                ? employeeService.getTeamMembers(employee.id)
                : employeeService.getStaffMembers(),
            safeView === 'org' ? employeeService.getManagers() : Promise.resolve([]),
            supabase
                .from('reports')
                .select('employee_id, submission_date, evaluation_score, manager_overall_score, manager_calibration'),
            supabase
                .from('goal_assignees')
                .select('goal_id, assignee_id'),
        ])
        if (slimReportsResult.error) throw slimReportsResult.error

        const managerNameMap: Record<string, string> = {}
        for (const m of managers) {
            managerNameMap[m.id] = m.name
        }

        // Group once instead of filtering the full arrays per employee (O(n) not O(n·m)).
        const reportsByEmployee: Record<string, any[]> = {}
        for (const r of slimReportsResult.data || []) {
            (reportsByEmployee[r.employee_id] = reportsByEmployee[r.employee_id] || []).push(r)
        }
        const goalCountByEmployee: Record<string, number> = {}
        for (const ga of goalAssigneesResult.data || []) {
            goalCountByEmployee[ga.assignee_id] = (goalCountByEmployee[ga.assignee_id] || 0) + 1
        }

        const employeesWithMetrics = staffMembers.map((emp: any) => {
            const empReports = (reportsByEmployee[emp.id] || [])
                .slice()
                .sort((a: any, b: any) => new Date(b.submission_date || '').getTime() - new Date(a.submission_date || '').getTime())

            // Calculate avg score
            const scoredReports = empReports.filter((r: any) => (r.manager_overall_score ?? r.evaluation_score) !== null)
            const avgScore = scoredReports.length > 0
                ? scoredReports.reduce((acc: number, r: any) => acc + (r.manager_overall_score ?? r.evaluation_score ?? 0), 0) / scoredReports.length
                : 0

            // Last report date (empReports is already sorted newest-first)
            const lastReportDate = empReports.length > 0 ? empReports[0].submission_date : null

            const calibrations = empReports
                .filter((r: any) => r.manager_calibration != null)
                .slice(0, 8)
                .map((r: any) => r.manager_calibration as string)

            const trustSignal = computeTrustSignal(calibrations)

            return {
                ...emp,
                avgScore: Number(avgScore.toFixed(1)),
                reportCount: empReports.length,
                goalCount: goalCountByEmployee[emp.id] || 0,
                lastReport: lastReportDate
                    ? new Date(lastReportDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Pending',
                trend: 0, // Placeholder for now
                managerName: emp.managerId ? (managerNameMap[emp.managerId] || null) : null,
                trustSignal: trustSignal.label ? trustSignal : null
            }
        })

        return { employees: employeesWithMetrics, isSenior, effectiveView: safeView }
    } catch (error) {
        console.error('getEmployeesAction Error:', error)
        return { error: 'Failed to fetch employees' }
    }
}

export async function getManagersAction() {
    try {
        const supabase = createServerClient()
        const user = await getAuthUser()

        if (!user) {
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
        const user = await getAuthUser()

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

/**
 * Set (or clear, with null) the caller's OWN profile picture. The image file is uploaded to Storage
 * client-side (see AccountView); this only persists the resulting public URL onto the employee row.
 * Scoped to the session's own employee id, so a user can only change their own photo.
 */
export async function updateEmployeeAvatarAction(avatarUrl: string | null) {
    try {
        const ctx = await getSessionContext()
        if (!ctx) return { success: false, error: 'Not authenticated' }

        await employeeService.update(ctx.employee.id, { avatarUrl } as any)

        revalidatePath('/account')
        revalidatePath('/', 'layout') // refresh header/roster avatars app-wide
        return { success: true }
    } catch (error) {
        console.error('updateEmployeeAvatarAction Error:', error)
        return { success: false, error: 'Failed to update profile picture' }
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

export async function deactivateEmployeeAction(employeeId: string) {
    try {
        const supabase = createServerClient()
        const user = await getAuthUser()

        if (!user) return { success: false, error: 'Not authenticated' }

        const currentUser = await employeeService.getByAuthId(user.id)
        if (!currentUser || (currentUser.role !== 'manager' && !currentUser.isAccountOwner)) {
            return { success: false, error: 'Unauthorized' }
        }

        await employeeService.update(employeeId, { isActive: false } as any)
        revalidatePath('/organization')
        return { success: true }
    } catch (error) {
        console.error('deactivateEmployeeAction Error:', error)
        return { success: false, error: 'Failed to deactivate employee' }
    }
}

export async function reactivateEmployeeAction(employeeId: string) {
    try {
        const supabase = createServerClient()
        const user = await getAuthUser()

        if (!user) return { success: false, error: 'Not authenticated' }

        const currentUser = await employeeService.getByAuthId(user.id)
        if (!currentUser || (currentUser.role !== 'manager' && !currentUser.isAccountOwner)) {
            return { success: false, error: 'Unauthorized' }
        }

        await employeeService.update(employeeId, { isActive: true } as any)
        revalidatePath('/organization')
        return { success: true }
    } catch (error) {
        console.error('reactivateEmployeeAction Error:', error)
        return { success: false, error: 'Failed to reactivate employee' }
    }
}

export async function updateEmployeeManagerAction(employeeId: string, managerId: string | null) {
    try {
        const supabase = createServerClient()
        const user = await getAuthUser()

        if (!user) {
            return { success: false, error: 'Not authenticated' }
        }

        const currentUser = await employeeService.getByAuthId(user.id)
        if (!currentUser || (currentUser.role !== 'manager' && !currentUser.isAccountOwner)) {
            return { success: false, error: 'Unauthorized' }
        }

        await employeeService.update(employeeId, { managerId: managerId } as any)

        revalidatePath('/organization')

        return { success: true }
    } catch (error) {
        console.error('updateEmployeeManagerAction Error:', error)
        return { success: false, error: 'Failed to update manager' }
    }
}

export async function updateEmployeePermissionsAction(id: string, permissions: any) {
    try {
        const supabase = createServerClient()
        const user = await getAuthUser()

        if (!user) {
            return { success: false, error: 'Not authenticated' }
        }

        const currentUser = await employeeService.getByAuthId(user.id)
        if (!currentUser || (currentUser.role !== 'manager' && !currentUser.isAccountOwner)) {
            return { success: false, error: 'Unauthorized' }
        }

        // Use admin client to bypass RLS for upserting employee_permissions
        const { createAdminClient } = await import('@/lib/supabase/server')
        const adminClient = createAdminClient()

        // Verify employee exists
        const { data: employee, error: empError } = await (adminClient.from('employees') as any)
            .select('organization_id, name')
            .eq('id', id)
            .single()

        if (empError) {
            return { success: false, error: 'Employee not found' }
        }

        // The admin client bypasses RLS, so org isolation must be enforced here:
        // a manager/owner may only manage permissions for employees in their own org.
        if (employee.organization_id !== currentUser.organizationId) {
            return { success: false, error: 'Unauthorized' }
        }

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

        const { error: permError } = await (adminClient.from('employee_permissions') as any)
            .upsert(payload, { onConflict: 'employee_id' })
            .select()

        if (permError) {
            console.error('updateEmployeePermissionsAction upsert error:', permError);
            return { success: false, error: 'Database update failed' }
        }

        // Revalidate to ensure UI reflects changes
        revalidatePath('/', 'layout')
        revalidatePath('/dashboard')
        revalidatePath('/organization')
        revalidatePath(`/employees/${id}`)

        return { success: true }
    } catch (error) {
        console.error('updateEmployeePermissionsAction Error:', error)
        return { success: false, error: 'Internal Error' }
    }
}
