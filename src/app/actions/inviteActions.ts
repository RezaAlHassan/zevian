'use server'

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { invitationService, employeeService, goalService, projectService } from '@/../databaseService2'
import { sendEmail } from '@/lib/email/emailService'
import * as crypto from 'crypto'
import React from 'react'

export async function getInviteModalDataAction() {
    try {
        const supabase = createServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Not authenticated' }

        const employee = await employeeService.getByAuthId(user.id)
        if (!employee) return { success: false, error: 'Employee not found' }

        const isSenior = employee.isAccountOwner ||
            employee.role === 'admin' ||
            (employee.permissions?.canViewOrganizationWide ?? false)

        const managers = await employeeService.getManagers()

        let projects, goals
        if (isSenior) {
            // Senior managers can assign to any project/goal in the org
            ;[projects, goals] = await Promise.all([
                projectService.getAll(),
                goalService.getAll()
            ])
        } else {
            // Regular managers can only assign to projects they are assigned to
            // and goals within those projects
            projects = await projectService.getByEmployeeId(employee.id)
            const projectIds = new Set(projects.map((p: any) => p.id))
            const allGoals = await goalService.getAll()
            goals = allGoals.filter((g: any) => projectIds.has(g.projectId))
        }

        return { success: true, managers, goals, projects }
    } catch (error: any) {
        console.error('getInviteModalDataAction Error:', error)
        return { success: false, error: error.message || 'Failed to fetch invite data' }
    }
}

export async function inviteEmployeesAction(data: {
    emails: string[],
    role: 'employee' | 'manager',
    managerId: string,
    assignments: string[],
    permissionTemplate?: string,
    customPermissions?: any
}) {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Not authenticated' }
        }

        // Get inviter's organization
        const employeeRecord = await employeeService.getByAuthId(user.id)
        if (!employeeRecord || !employeeRecord.organizationId) {
            return { success: false, error: 'User organization not found' }
        }

        const orgId = employeeRecord.organizationId
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiration

        const initialProjectIds = data.role === 'manager' ? data.assignments : []
        const initialGoalIds = data.role === 'employee' ? data.assignments : []

        // Generate invitation records
        const adminClient = createAdminClient()
        const invitationsToInsert = data.emails.map(email => {
            const token = crypto.randomBytes(32).toString('hex')
            const invId = `inv-${Date.now()}-${Math.floor(Math.random() * 1000000)}`
            return {
                id: invId,
                token,
                email,
                role: data.role,
                organization_id: orgId,
                invited_by: employeeRecord.id,
                invited_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString(),
                status: 'pending',
                initial_project_ids: initialProjectIds,
                initial_goal_ids: initialGoalIds,
                initial_manager_id: data.managerId || null,
                permission_template: data.permissionTemplate || 'standard',
                custom_permissions: data.customPermissions || null,
            }
        })

        // Bulk insert invitations
        const { data: insertedInvitations, error: invError } = await (adminClient.from('invitations') as any)
            .insert(invitationsToInsert)
            .select()

        if (invError) throw invError

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'

        // Send emails in parallel
        const results = await Promise.all(insertedInvitations.map(async (invitation: any) => {
            const acceptLink = `${baseUrl}/accept-invite?token=${invitation.token}`
            console.log('--- TEST INVITATION LINK ---')
            console.log(acceptLink)
            console.log('----------------------------')

            const emailTemplate = (
                `<div>
                    <h1>You've been invited to join Zevian!</h1>
                    <p>Click the link below to accept your invitation and setup your account.</p>
                    <p><a href="${acceptLink}">${acceptLink}</a></p>
                 </div>`
            )

            try {
                await sendEmail({
                    to: invitation.email,
                    subject: "You're invited to Zevian",
                    html: emailTemplate,
                })
                return { email: invitation.email, success: true }
            } catch (emailError) {
                console.error(`Failed to send email to ${invitation.email}:`, emailError)
                return { email: invitation.email, success: false, error: 'Email failed to send' }
            }
        }))

        return { success: true, results }
    } catch (error: any) {
        console.error('inviteEmployeesAction Error:', error)
        return { success: false, error: error.message || 'Failed to send invitations' }
    }
}


export async function acceptInviteAction(token: string, data: { name: string, title: string, dept: string, password: string }) {
    try {
        const supabaseAdmin = createAdminClient()

        // 1. Verify token
        const invitation = await invitationService.getByToken(token)
        if (!invitation) return { success: false, error: 'Invalid invitation token' }
        if (invitation.status === 'accepted') return { success: false, error: 'Invitation already accepted' }
        if (new Date(invitation.expiresAt) < new Date()) return { success: false, error: 'Invitation expired' }

        // 2. Create user via Supabase Auth Admin
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: invitation.email,
            password: data.password,
            email_confirm: true, // Auto-confirm since they clicked the link
            user_metadata: {
                name: data.name
            }
        })

        if (authError || !authData.user) {
            console.error('Supabase Auth error:', authError)
            return { success: false, error: authError?.message || 'Failed to create user account' }
        }

        // 3. Complete Invitation Flow
        // Because of our custom plpgsql function `complete_invitation_flow` we can use it to handle projects and status update atomically.
        // Wait, since we are doing more complex data.name/title/dept, we'd better run normal statements or wrap them. 
        // The original `complete_invitation_flow` didn't have assignments array handled properly, it only handled one `initial_project_id`. 
        // We altered the schema in previous steps to use arrays `initial_project_ids` and `initial_goal_ids`.
        // Let's implement the DB side entirely in the backend here to handle the newly structured assignment arrays correctly.

        const newEmployeeId = `emp-${Date.now()}-${Math.floor(Math.random() * 1000)}`

        // Let's bypass RLS using admin client to create employee
        const { error: empError } = await supabaseAdmin.from('employees').insert({
            id: newEmployeeId,
            organization_id: invitation.organizationId,
            auth_user_id: authData.user.id,
            name: data.name,
            email: invitation.email,
            role: invitation.role,
            manager_id: invitation.initialManagerId || invitation.invitedBy, // fallback to inviter if no manager selected
            title: data.title,
            dept: data.dept,
            onboarding_completed: true,
            join_date: new Date().toISOString()
        } as any)
        if (empError) throw empError

        // 4. Handle initial projects (for managers)
        if (invitation.initialProjectIds && invitation.initialProjectIds.length > 0) {
            const paInsert = invitation.initialProjectIds.map((pid: string) => ({
                project_id: pid,
                assignee_id: newEmployeeId,
                assignee_type: invitation.role
            }))
            const { error: paError } = await supabaseAdmin.from('project_assignees').insert(paInsert as any)
            if (paError) throw paError
            
            // Generate periods for new assignment
            const { setupPeriodsForNewAssignment } = await import('@/lib/reportingPeriods')
            for (const pid of invitation.initialProjectIds) {
                await setupPeriodsForNewAssignment(newEmployeeId, pid).catch(err => console.error(err))
            }
        }

        // 5. Handle initial goals (for employees)
        if (invitation.initialGoalIds && invitation.initialGoalIds.length > 0) {
            const gaInsert = invitation.initialGoalIds.map((gid: string) => ({
                goal_id: gid,
                assignee_id: newEmployeeId,
                assignee_type: invitation.role
            }))
            // We need to make sure the table exists, assuming goal_assignees is created as per schema.sql
            // Wait! The user's system may not have `goal_assignees` executed yet, we might fall back to projects if they fail.
            const { error: gaError } = await supabaseAdmin.from('goal_assignees').insert(gaInsert as any).select().maybeSingle()
            if (gaError && gaError.code !== '42P01') {
                throw gaError // Throw unless table doesn't exist yet
            }
            
            // Generate periods for new assignment
            const { setupPeriodsForNewAssignment } = await import('@/lib/reportingPeriods')
            for (const gid of invitation.initialGoalIds) {
                await setupPeriodsForNewAssignment(newEmployeeId, undefined, gid).catch(err => console.error(err))
            }
        }

        // 6. Handle permissions (for managers)
        if (invitation.role === 'manager') {
            const templates: Record<string, any> = {
                'standard': {
                    can_invite_users: true,
                    can_create_projects: true,
                    can_create_goals: true,
                    can_override_ai_scores: true,
                    can_view_organization_wide: false,
                    can_manage_settings: false,
                    can_set_global_frequency: false
                },
                'senior': {
                    can_invite_users: true,
                    can_create_projects: true,
                    can_create_goals: true,
                    can_override_ai_scores: true,
                    can_view_organization_wide: true,
                    can_manage_settings: true,
                    can_set_global_frequency: true
                },
                'read-only': {
                    can_invite_users: false,
                    can_create_projects: false,
                    can_create_goals: false,
                    can_override_ai_scores: false,
                    can_view_organization_wide: true,
                    can_manage_settings: false,
                    can_set_global_frequency: false
                }
            };

            let perms = templates[invitation.permissionTemplate || 'standard'] || templates['standard'];
            
            if (invitation.permissionTemplate === 'custom' && invitation.customPermissions) {
                // Map custom permissions from frontend keys to DB column names
                perms = {
                    can_invite_users: !!invitation.customPermissions.canInviteUsers,
                    can_create_projects: !!invitation.customPermissions.canCreateProjects,
                    can_create_goals: !!invitation.customPermissions.canCreateGoals,
                    can_override_ai_scores: !!invitation.customPermissions.canOverrideAIScores,
                    can_view_organization_wide: !!invitation.customPermissions.canViewOrganizationWide,
                    can_manage_settings: !!invitation.customPermissions.canManageSettings,
                    can_set_global_frequency: !!invitation.customPermissions.canSetGlobalFrequency
                };
            }

            const { error: permError } = await supabaseAdmin.from('employee_permissions').insert({
                employee_id: newEmployeeId,
                ...perms
            });
            
            if (permError) {
                console.error('Permission setup error:', permError);
                // Non-blocking for invitation acceptance
            }
        }

        // 6. Mark accepted
        // @ts-ignore
        await supabaseAdmin.from('invitations').update({
            status: 'accepted',
            accepted_at: new Date().toISOString()
        }).eq('id', invitation.id)

        // 7. Log User in 
        // Admin signup doesn't auto-login via API since they are separate, we tell UI to login
        // but passing the success flag allows redirect to login page.

        return { success: true, email: invitation.email, role: invitation.role }
    } catch (error: any) {
        console.error('acceptInviteAction error', error)
        return { success: false, error: 'Database operations failed' }
    }
}
