'use server'

import { createServerClient } from '@/lib/supabase/server'
import { leaveService, employeeService } from '@/../databaseService2'
import { revalidatePath } from 'next/cache'

export async function grantLeaveAction(data: {
    employeeId: string,
    startDate: string,
    endDate: string,
    leaveType: 'sick' | 'vacation' | 'personal' | 'other',
    note?: string
}) {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { error: 'Not authenticated' }
        }

        // Get the caller's employee profile
        const caller = await employeeService.getByAuthId(user.id)
        if (!caller || !caller.organizationId) {
            return { error: 'Caller profile or organization not found' }
        }

        // Get target employee to verify organization match
        const targetEmployee = await employeeService.getById(data.employeeId)
        if (!targetEmployee || !targetEmployee.organizationId || targetEmployee.organizationId !== caller.organizationId) {
            return { error: 'Target employee not found or organization mismatch' }
        }

        // Authorization rules:
        // - Owners can approve for anyone
        // - Managers can approve for direct reports
        // - Employees cannot self-approve
        if (caller.id === data.employeeId) {
            return { error: 'Employees cannot self-approve leave' }
        }

        const isOwner = caller.isAccountOwner
        const isDirectManager = targetEmployee.managerId === caller.id

        if (!isOwner && !isDirectManager) {
            return { error: 'Not authorized to approve leave for this employee' }
        }

        // Create the leave record
        const leave = await leaveService.create({
            employeeId: data.employeeId,
            organizationId: targetEmployee.organizationId,
            startDate: data.startDate,
            endDate: data.endDate,
            leaveType: data.leaveType,
            note: data.note,
            approvedBy: caller.id
        })

        // Retroactively excuse any already-missed periods that fall within the leave window.
        // A period overlaps the leave if: period_start <= endDate AND period_end >= startDate
        await (supabase as any)
            .from('reporting_periods')
            .update({ status: 'excused' })
            .eq('employee_id', data.employeeId)
            .eq('status', 'missed')
            .lte('period_start', data.endDate)
            .gte('period_end', data.startDate)

        // Run the missed-report check now that the leave record exists.
        // This converts any overdue pending periods that fall within the leave window
        // to 'excused' (instead of 'missed') and generates the next period in the chain.
        const { runMissedReportCheck } = await import('@/lib/reportingPeriodsMaintenance')
        await runMissedReportCheck(data.employeeId).catch(e =>
            console.warn('[grantLeaveAction] runMissedReportCheck failed:', e)
        )

        // Notifications are handled by the database trigger `notify_leave_granted`

        revalidatePath('/(app)/reports', 'layout')
        revalidatePath('/(app)/employees', 'layout')
        revalidatePath('/(employee)/my-dashboard', 'layout')

        return { success: true, leave }
    } catch (error: any) {
        console.error('grantLeaveAction Error:', error)
        return { error: error.message || 'Failed to grant leave' }
    }
}
