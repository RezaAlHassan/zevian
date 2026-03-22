'use server'

import { createServerClient } from '@/lib/supabase/server'
import { notificationService, employeeService } from '@/../databaseService2'
import { revalidatePath } from 'next/cache'

export async function getNotificationsAction() {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Not authenticated' }
        }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee) {
            return { success: false, error: 'Employee not found' }
        }

        const notifications = await notificationService.getAll(employee.id);
        return { success: true, data: notifications, userId: employee.id, role: employee.role };
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        return { success: false, error: error.message };
    }
}

export async function markAsReadAction(notificationId: number) {
    try {
        await notificationService.markAsRead(notificationId);
        revalidatePath('/notifications');
        revalidatePath('/my-notifications');
        revalidatePath('/my-dashboard');
        return { success: true };
    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        return { success: false, error: error.message };
    }
}

export async function markAllAsReadAction(userId: string) {
    try {
        await notificationService.markAllAsRead(userId);
        revalidatePath('/notifications');
        revalidatePath('/my-notifications');
        revalidatePath('/my-dashboard');
        return { success: true };
    } catch (error: any) {
        console.error('Error marking all notifications as read:', error);
        return { success: false, error: error.message };
    }
}
