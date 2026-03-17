'use server'

import { createServerClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/emailService'
import { InvitationEmail } from '@/lib/email/templates/InvitationEmail'
import { WelcomeEmail } from '@/lib/email/templates/WelcomeEmail'
import React from 'react'

export async function completeOnboardingAction(data: {
    orgName: string;
    projName: string;
    projDesc?: string;
    frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
    emails?: string;
    origin?: string;
    // Goal data from templates
    goalName?: string;
    goalInstructions?: string;
    criteria?: { name: string; weight: number }[];
}) {
    const supabase = createServerClient()

    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('User not authenticated')

    // 2. Generate IDs
    const ts = Date.now()
    const orgId = `org-${Math.random().toString(36).substring(2, 9)}`
    const projId = `project-onboarding-${ts}`
    const goalId = `goal-onboarding-${ts}`
    const empId = `emp-${Math.random().toString(36).substring(2, 9)}`

    // Start a transaction-like sequence
    // 3. Create Organization
    const { error: orgError } = await supabase
        .from('organizations')
        .insert({
            id: orgId,
            name: data.orgName,
            plan_tier: 'business'
        } as any)
    if (orgError) throw orgError

    // 4. Create or Update Employee (Account Owner)
    // Check if employee already exists (e.g., created by verify page)
    const { data: existingEmp } = await supabase
        .from('employees')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle()

    const finalEmpId = (existingEmp as any)?.id || empId

    const { error: empError } = await supabase
        .from('employees')
        .upsert({
            id: finalEmpId,
            organization_id: orgId,
            auth_user_id: user.id,
            name: user.user_metadata.full_name || user.email?.split('@')[0] || 'Unknown User',
            email: user.email!,
            role: 'manager',
            is_account_owner: true,
            onboarding_completed: true,
            join_date: new Date().toISOString().split('T')[0]
        } as any)
    if (empError) throw empError

    // Use finalEmpId for projects and assignments
    const currentEmpId = finalEmpId

    // 5. Create Project
    const { error: projError } = await supabase
        .from('projects')
        .insert({
            id: projId,
            organization_id: orgId,
            name: data.projName,
            description: data.projDesc,
            report_frequency: data.frequency,
            created_by: currentEmpId
        } as any)
    if (projError) throw projError

    // 6. Assign Manager to Project
    const { error: assignError } = await supabase
        .from('project_assignees')
        .insert({
            project_id: projId,
            assignee_id: currentEmpId,
            assignee_type: 'manager'
        } as any)
    if (assignError) throw assignError

    // 7. Create Goal (from template)
    if (data.goalName) {
        const { error: goalError } = await supabase
            .from('goals')
            .insert({
                id: goalId,
                name: data.goalName,
                project_id: projId,
                instructions: data.goalInstructions || '',
                manager_id: currentEmpId,
                created_by: currentEmpId,
                status: 'active',
            } as any)
        if (goalError) throw goalError

        // 8. Create Criteria
        if (data.criteria && data.criteria.length > 0) {
            const criteriaRows = data.criteria.map((c, index) => ({
                id: `crit-onb-${ts}-${index}`,
                goal_id: goalId,
                name: c.name,
                weight: c.weight,
                display_order: index,
            }))

            const { error: criteriaError } = await supabase
                .from('criteria')
                .insert(criteriaRows as any)
            if (criteriaError) throw criteriaError
        }
    }

    // 9. Handle invitations if any
    if (data.emails) {
        const emailList = data.emails.split(/[,\s]+/).filter(e => e.includes('@'))
        if (emailList.length > 0) {
            const invitations = emailList.map(email => ({
                id: `inv-${Math.random().toString(36).substring(2, 9)}`,
                token: Math.random().toString(36).substring(2, 15),
                email,
                role: 'employee',
                organization_id: orgId,
                invited_by: currentEmpId,
                invited_at: new Date().toISOString(),
                status: 'pending',
                initial_project_ids: [projId]
            }))

            await supabase.from('invitations').insert(invitations as any)

            // 10. Send the actual emails
            const inviterName = user.user_metadata.full_name || user.email?.split('@')[0] || 'A team member'

            for (const invitation of invitations) {
                const inviteLink = `${data.origin || ''}/signup?token=${invitation.token}`
                await sendEmail({
                    to: invitation.email,
                    subject: `Join ${data.orgName} on Zevian`,
                    react: React.createElement(InvitationEmail, {
                        inviterName,
                        orgName: data.orgName,
                        projectName: data.projName,
                        inviteLink
                    })
                })
            }
        }
    }

    // 11. Send Welcome Email to the owner
    const userName = user.user_metadata.full_name || user.email?.split('@')[0] || 'Unknown User'
    await sendEmail({
        to: user.email!,
        subject: `Welcome to Zevian, ${userName}!`,
        react: React.createElement(WelcomeEmail, {
            userName,
            orgName: data.orgName
        })
    })

    return { success: true, orgId, projId, goalId, empId }
}

/**
 * Signup Action: Standardizes registration and ensures the profile is created 
 * immediately on the server before redirection.
 */
export async function signupAction(data: {
    name: string;
    email: string;
    password: string;
}) {
    const supabase = createServerClient()

    // 1. Sign up the user (Email confirmation is OFF)
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
            data: {
                full_name: data.name,
            },
        },
    })

    if (authError) return { success: false, error: authError.message }
    if (!authData.user) return { success: false, error: 'Signup failed. No user returned.' }

    const user = authData.user

    // 2. Proactively create the profile and organization (Self-Healing Backup)
    // This ensures that even if the trigger is slow/broken, the user record is there.
    try {
        const orgId = `org-${user.id.substring(0, 8)}`
        const empId = `emp-${user.id.substring(0, 8)}`
        const userName = data.name || user.email?.split('@')[0] || 'User'

        // Insert Org (Indempotent)
        await supabase
            .from('organizations')
            .upsert({
                id: orgId,
                name: `${userName}'s Workspace`,
                plan_tier: 'free'
            } as any)

        // Insert Employee (Indempotent)
        await supabase
            .from('employees')
            .upsert({
                id: empId,
                organization_id: orgId,
                auth_user_id: user.id,
                name: userName,
                email: user.email!,
                role: 'manager',
                is_account_owner: true,
                onboarding_completed: false,
                join_date: new Date().toISOString().split('T')[0]
            } as any)

        return { success: true }
    } catch (err) {
        console.error('Error initializing profile in signupAction:', err)
        // We still return true because the user was created in Auth
        return { success: true }
    }
}

/**
 * Self-healing action: ensures a user has a profile and an organization.
 * Used at the start of the onboarding flow to prevent "missing profile" loops.
 */
export async function ensureProfileExists() {
    const supabase = createServerClient()

    // 1. Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Not authenticated')

    // 2. Check for existing employee profile
    const { data: existingEmp } = await supabase
        .from('employees')
        .select(`
            id,
            organization_id,
            onboarding_completed,
            organizations (name)
        `)
        .eq('auth_user_id', user.id)
        .maybeSingle()

    if (existingEmp) {
        return {
            exists: true,
            profile: existingEmp,
            onboardingCompleted: (existingEmp as any).onboarding_completed
        }
    }

    // 3. Create a "Personal" workspace if none exists
    const orgId = `org-${user.id.substring(0, 8)}`
    const empId = `emp-${user.id.substring(0, 8)}`
    const userName = user.user_metadata.full_name || user.email?.split('@')[0] || 'User'

    // Use a transaction-safe approach (serial inserts)
    // Create Org
    const { error: orgError } = await supabase
        .from('organizations')
        .insert({
            id: orgId,
            name: `${userName}'s Workspace`,
            plan_tier: 'free'
        } as any)

    // If org exists (conflict), we just ignore and continue
    if (orgError && !orgError.message.includes('unique constraint')) {
        console.error('Error creating self-healing org:', orgError)
    }

    // Create Employee
    const { data: newEmp, error: empError } = await supabase
        .from('employees')
        .insert({
            id: empId,
            organization_id: orgId,
            auth_user_id: user.id,
            name: userName,
            email: user.email!,
            role: 'manager',
            is_account_owner: true,
            onboarding_completed: false,
            join_date: new Date().toISOString().split('T')[0]
        } as any)
        .select()
        .single()

    if (empError) {
        console.error('Error creating self-healing profile:', empError)
        throw new Error('Could not initialize user profile')
    }

    return {
        exists: true,
        profile: newEmp,
        onboardingCompleted: false
    }
}
