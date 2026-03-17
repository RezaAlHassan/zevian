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
            const scoredReports = empReports.filter((r: any) => r.evaluationScore !== null && r.evaluationScore !== undefined)
            const avgScore = scoredReports.length > 0
                ? scoredReports.reduce((acc: number, r: any) => acc + (r.evaluationScore || 0), 0) / scoredReports.length
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
