'use server'

import { createServerClient } from '@/lib/supabase/server'
import { organizationService, employeeService, customMetricService } from '@/../databaseService2'
import { revalidatePath } from 'next/cache'

export async function getOrganizationAction() {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.error('Auth Error:', authError)
            return { error: 'Not authenticated' }
        }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee || !employee.organizationId) {
            return { error: 'Organization not found for user' }
        }

        const organization = await organizationService.getById(employee.organizationId)
        return { data: organization }
    } catch (error) {
        console.error('getOrganizationAction Error:', error)
        return { error: 'Failed to fetch organization' }
    }
}

export async function updateOrganizationAction(updates: any) {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { error: 'Not authenticated' }
        }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee || !employee.organizationId) {
            return { error: 'Permission denied' }
        }

        // Only managers/admins can update org
        if (employee.role !== 'manager' && employee.role !== 'admin') {
            return { error: 'Only managers can update organization settings' }
        }

        const updatedOrg = await organizationService.update(employee.organizationId, updates)

        revalidatePath('/organization')
        return { data: updatedOrg, success: true }
    } catch (error) {
        console.error('updateOrganizationAction Error:', error)
        return { error: 'Failed to update organization' }
    }
}

export async function getOrganizationEmployeesAction() {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { error: 'Not authenticated' }
        }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee || !employee.organizationId) {
            return { error: 'Organization not found' }
        }

        const employees = await employeeService.getByOrganizationId(employee.organizationId)
        return { data: employees }
    } catch (error) {
        console.error('getOrganizationEmployeesAction Error:', error)
        return { error: 'Failed to fetch employees' }
    }
}

export async function getCustomMetricsAction() {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { error: 'Not authenticated' }
        }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee || !employee.organizationId) {
            return { error: 'Organization not found' }
        }

        const metrics = await customMetricService.getByOrganizationId(employee.organizationId)
        return { data: metrics }
    } catch (error) {
        console.error('getCustomMetricsAction Error:', error)
        return { error: 'Failed to fetch custom metrics' }
    }
}

export async function createCustomMetricAction(metricData: { name: string, description?: string, isActive?: boolean }) {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { error: 'Not authenticated' }
        }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee || !employee.organizationId) {
            return { error: 'Permission denied' }
        }

        if (employee.role !== 'manager' && employee.role !== 'admin') {
            return { error: 'Only managers can create custom metrics' }
        }

        const newMetric = await customMetricService.create({
            organizationId: employee.organizationId,
            name: metricData.name,
            description: metricData.description,
            isActive: metricData.isActive ?? true
        })
        
        revalidatePath('/organization')
        return { data: newMetric, success: true }
    } catch (error) {
        return { error: 'Failed to create custom metric' }
    }
}

export async function updateCustomMetricAction(id: string, updates: any) {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { error: 'Not authenticated' }
        }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee || !employee.organizationId) {
            return { error: 'Permission denied' }
        }

        if (employee.role !== 'manager' && employee.role !== 'admin') {
            return { error: 'Only managers can update custom metrics' }
        }

        const updatedMetric = await customMetricService.update(id, updates)
        
        revalidatePath('/organization')
        return { data: updatedMetric, success: true }
    } catch (error) {
        console.error('updateCustomMetricAction Error:', error)
        return { error: 'Failed to update custom metric' }
    }
}

export async function deleteCustomMetricAction(id: string) {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { error: 'Not authenticated' }
        }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee || !employee.organizationId) {
            return { error: 'Permission denied' }
        }

        if (employee.role !== 'manager' && employee.role !== 'admin') {
            return { error: 'Only managers can delete custom metrics' }
        }

        await customMetricService.delete(id)
        
        revalidatePath('/organization')
        return { success: true }
    } catch (error) {
        console.error('deleteCustomMetricAction Error:', error)
        return { error: 'Failed to delete custom metric' }
    }
}
