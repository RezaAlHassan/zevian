'use server'

import { createServerClient } from '@/lib/supabase/server'
import { dashboardService, employeeService, organizationService } from '@/../databaseService2'

export async function getDashboardDataAction() {
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

        const organization = await organizationService.getById(employee.organizationId)

        if (employee.role === 'manager' || employee.role === 'admin') {
            const data = await dashboardService.getManagerDashboardData(employee.id)
            return { ...data, organization }
        }

        const data = await dashboardService.getEmployeeDashboardData(employee.id)
        return { ...data, organization }
    } catch (error) {
        console.error('getDashboardDataAction Error:', error)
        return { error: 'Failed to fetch dashboard data' }
    }
}
