'use server'

import { createServerClient } from '@/lib/supabase/server'
import { dashboardService, employeeService, organizationService, customMetricService, goalService, reportService, notificationService, leaveService } from '@/../databaseService2'
import { CustomMetric } from '@/types'

export async function getDashboardDataAction(view?: 'org' | 'direct', startDate?: string, endDate?: string) {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.error('Auth Error:', authError)
            return { error: 'Not authenticated' }
        }

        // Get employee by auth_user_id
        const employee = await employeeService.getByAuthId(user.id)
        if (!employee || !employee.organizationId) {
            return { error: 'Employee or Organization not found' }
        }

        const [organization, customMetrics] = await Promise.all([
            organizationService.getById(employee.organizationId),
            customMetricService.getByOrganizationId(employee.organizationId),
        ])

        // Only include active metrics
        organization.customMetrics = customMetrics.filter((m: CustomMetric) => m.isActive)

        if (employee.role === 'manager' || employee.role === 'admin') {
            // Senior roles (owner, admin, or org-wide permission) default to org view;
            // regular managers default to direct-report view.
            const isSenior = employee.isAccountOwner ||
                employee.role === 'admin' ||
                (employee.permissions?.canViewOrganizationWide ?? false)
            const effectiveView = view ?? (isSenior ? 'org' : 'direct')
            // Enforce: non-senior managers cannot use org view even if ?view=org is in the URL
            const safeView = (!isSenior && effectiveView === 'org') ? 'direct' : effectiveView
            const data = await dashboardService.getManagerDashboardData(employee.id, safeView, startDate, endDate)
            return { ...data, organization }
        }

        // Ensure period chain exists for this employee — does not mutate status, just generates missing future periods
        import('@/lib/reportingPeriodsMaintenance').then(({ ensurePeriodsExistForEmployee }) =>
            ensurePeriodsExistForEmployee(employee.id)
        ).catch(e => console.warn('[Dashboard] Period chain check failed:', e))

        let soonestPeriod: any = null
        let upcomingPeriods: any[] = []
        try {
            const { getSoonestPendingPeriod } = await import('@/lib/reportingPeriods')
            const [soonest, { data: allPeriods }] = await Promise.all([
                getSoonestPendingPeriod(employee.id),
                supabase
                    .from('reporting_periods')
                    .select('*')
                    .eq('employee_id', employee.id)
                    .in('status', ['pending', 'submitted', 'missed'])
                    .order('period_end', { ascending: true })
            ])
            soonestPeriod = soonest
            upcomingPeriods = allPeriods || []
        } catch (periodError) {
            // If reporting_periods table not yet migrated, fall back gracefully
            console.warn('[Dashboard] Period fetch failed (table may not exist yet):', periodError)
        }

        const [data, allReports] = await Promise.all([
            dashboardService.getEmployeeDashboardData(employee.id, startDate, endDate),
            reportService.getEmployeeReports(employee.id, startDate, endDate),
        ])

        const latestFeedbackReport = allReports.find((report: any) =>
            typeof report.managerFeedback === 'string' && report.managerFeedback.trim().length > 0
        )

        const lastManagerFeedback = latestFeedbackReport ? {
            text: latestFeedbackReport.managerFeedback,
            date: latestFeedbackReport.submissionDate,
            goalName: latestFeedbackReport.goals?.name || null,
        } : null

        // Fetch manager settings for grace period/deadline adjustments
        let managerSettings: any = null
        if (employee.managerId) {
            const { getManagerBackdateSettings } = await import('@/lib/reportingPeriods')
            managerSettings = await getManagerBackdateSettings(employee.managerId)
        }

        return { ...data, organization, soonestPeriod, upcomingPeriods, managerSettings, lastManagerFeedback, allReports }
    } catch (error) {
        console.error('getDashboardDataAction Error:', error)
        return { error: 'Failed to fetch dashboard data' }
    }
}

export async function getEmployeeDashboardDataByIdAction(employeeId: string, startDate?: string, endDate?: string) {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.error('Auth Error:', authError)
            return { error: 'Not authenticated' }
        }

        // Get the caller's employee profile
        const caller = await employeeService.getByAuthId(user.id)
        if (!caller || !caller.organizationId) {
            return { error: 'Caller profile or organization not found' }
        }

        // Only managers and admins can view other employees' dashboards
        if (caller.role !== 'manager' && caller.role !== 'admin') {
            return { error: 'Not authorized' }
        }

        // Get target employee to verify organization match
        const targetEmployee = await employeeService.getById(employeeId)
        if (!targetEmployee || !targetEmployee.organizationId || targetEmployee.organizationId !== caller.organizationId) {
            return { error: 'Target employee not found or organization mismatch' }
        }

        const data = await dashboardService.getEmployeeDashboardData(employeeId, startDate, endDate)
        const organization = await organizationService.getById(caller.organizationId)
        
        const { data: allPeriods } = await supabase
            .from('reporting_periods')
            .select('*')
            .eq('employee_id', employeeId)
            .in('status', ['pending', 'submitted', 'missed'])
            .order('period_end', { ascending: true })
        
        return { ...data, organization, upcomingPeriods: allPeriods || [] }
    } catch (error) {
        console.error('getEmployeeDashboardDataByIdAction Error:', error)
        return { error: 'Failed to fetch employee dashboard data' }
    }
}

export async function getEmployeeDetailedDataAction(employeeId: string, startDate?: string, endDate?: string) {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.error('Auth Error:', authError)
            return { error: 'Not authenticated' }
        }

        // Get the caller's employee profile
        const caller = await employeeService.getByAuthId(user.id)
        if (!caller || !caller.organizationId) {
            return { error: 'Caller profile or organization not found' }
        }

        // Authorization: Only managers/admins can view other employees' details
        // Or the employee themselves can view their own details (though this page is for managers)
        const isSelf = caller.id === employeeId
        if (!isSelf && caller.role !== 'manager' && caller.role !== 'admin') {
            return { error: 'Not authorized' }
        }

        // Get target employee to verify organization match
        const targetEmployee = await employeeService.getById(employeeId)
        if (!targetEmployee || !targetEmployee.organizationId || targetEmployee.organizationId !== caller.organizationId) {
            return { error: 'Target employee not found or organization mismatch' }
        }

        // Fetch everything in parallel
        const [dashboardData, allGoals, allReportsData, allNotifications, leaves, periodsData] = await Promise.all([
            dashboardService.getEmployeeDashboardData(employeeId, startDate, endDate),
            goalService.getByEmployeeId(employeeId),
            reportService.getEmployeeReports(employeeId, startDate, endDate),
            notificationService.getAll(employeeId),
            leaveService.getByEmployeeId(employeeId),
            supabase.from('reporting_periods').select('*').eq('employee_id', employeeId).in('status', ['pending', 'submitted', 'missed']).order('period_end', { ascending: true })
        ])

        const organization = await organizationService.getById(caller.organizationId)
        
        // Attach periods for dashboard Next Report Due widget
        ;(dashboardData as any).upcomingPeriods = periodsData.data || []

        const canApproveLeave = !isSelf && (caller.isAccountOwner || targetEmployee.managerId === caller.id)

        // Inject mock reports for leaves
        const leaveReports = leaves.map((leave: any) => ({
            id: `leave-${leave.id}`,
            employeeId: employeeId,
            goalId: null,
            submissionDate: leave.startDate, // Using start date as the "submission" date
            evaluationScore: null,
            managerOverallScore: null,
            status: 'on-leave',
            isOnLeave: true,
            leaveType: leave.leaveType,
            endDate: leave.endDate,
            goals: { name: 'On Leave', projects: { name: 'Leave' } },
            employees: { name: targetEmployee.name, title: targetEmployee.title || '' }
        }))

        // We sort by submission date descending
        const allReports = [...allReportsData, ...leaveReports].sort((a: any, b: any) => 
            new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()
        )
        
        // 4. Enrich Activity Feed
        const reportActivities = allReportsData.map((r: any) => ({
            id: r.id,
            type: 'report',
            title: 'Report Submitted',
            message: `Submitted report for "${r.goals?.name || 'Goal'}"`,
            createdAt: r.submissionDate
        }));

        const goalActivities = allGoals.map((g: any) => ({
            id: g.id,
            type: 'goal',
            title: 'Goal Assigned',
            message: `New goal assigned: "${g.name}"`,
            createdAt: g.createdAt
        }));

        const leaveActivities = leaves.map((l: any) => ({
            id: l.id,
            type: 'leave',
            title: 'Leave Period',
            message: `${l.leaveType.charAt(0).toUpperCase() + l.leaveType.slice(1)} leave for ${targetEmployee.name}`,
            createdAt: l.startDate
        }));

        const notificationActivities = allNotifications.map((n: any) => ({
            ...n,
            type: n.type || 'alert'
        }));

        const allActivity = [
            ...notificationActivities,
            ...reportActivities,
            ...goalActivities,
            ...leaveActivities
        ].sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return { 
            dashboardData, 
            allGoals, 
            allReports, 
            allActivity,
            organization,
            permissions: {
                canApproveLeave
            }
        }
    } catch (error) {
        console.error('getEmployeeDetailedDataAction Error:', error)
        return { error: 'Failed to fetch detailed employee data' }
    }
}
