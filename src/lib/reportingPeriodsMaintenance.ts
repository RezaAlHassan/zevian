/**
 * Reporting Periods Maintenance
 *
 * This module is responsible for marking periods as 'missed' or 'excused'
 * after their deadline has passed.
 *
 * Run on:
 *  - Dashboard load (via server action, for the current employee)
 *  - Supabase scheduled edge function (for all employees, e.g. hourly cron)
 *
 * NEVER mark a period missed while period_end > NOW().
 * NEVER use goals.deadline here.
 */

import { supabase } from '../../supabaseClient';

/**
 * Checks all overdue pending periods for a given employee (or all employees
 * if employeeId is omitted) and marks them 'missed' or 'excused' as appropriate.
 *
 * Leave check: if an approved leave record overlaps the period window,
 * the period is marked 'excused' instead of 'missed'.
 */
export async function runMissedReportCheck(employeeId?: string): Promise<{
  missed: number;
  excused: number;
}> {
  const now = new Date().toISOString();

  // Fetch all pending periods whose deadline has already passed
  let query = supabase
    .from('reporting_periods')
    .select('*')
    .eq('status', 'pending')
    .lt('period_end', now);

  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }

  const { data: overduePeriods, error: fetchError } = await query;
  if (fetchError) throw fetchError;
  if (!overduePeriods || overduePeriods.length === 0) return { missed: 0, excused: 0 };

  let missedCount = 0;
  let excusedCount = 0;

  for (const period of overduePeriods) {
    // ── Step 1: Check grace period ──
    const { data: emp } = await supabase
      .from('employees')
      .select('manager_id')
      .eq('id', period.employee_id)
      .maybeSingle();

    let graceDays = 0;
    if (emp?.manager_id) {
      const { data: settings } = await supabase
        .from('manager_settings')
        .select('grace_period_days')
        .eq('manager_id', emp.manager_id)
        .maybeSingle();
      graceDays = settings?.grace_period_days ?? 0;
    }

    const effectiveDeadline = new Date(period.period_end).getTime() + (graceDays * 24 * 60 * 60 * 1000);
    if (Date.now() <= effectiveDeadline) {
      continue;
    }

    // ── Step 2: Check for approved leave ──
    const { data: leaves, error: leaveError } = await supabase
      .from('leaves')
      .select('id')
      .eq('employee_id', period.employee_id)
      .lte('start_date', period.period_end)
      .gte('end_date', period.period_start)
      .limit(1);

    if (leaveError) throw leaveError;

    // ── Step 3: Check ramp-up period (from project_assignees, NOT from period row) ──
    let newStatus = (leaves && leaves.length > 0) ? 'excused' : 'missed';
    
    // Ramp-up disabled as column doesn't exist yet

    newStatus === 'excused' ? excusedCount++ : missedCount++;

    await supabase
      .from('reporting_periods')
      .update({ status: newStatus })
      .eq('id', period.id);
      
    // TRIGGER D — Immediately generate the next period
    // Find frequency using project settings
    const { data: goal } = await supabase
      .from('goals')
      .select('projects(report_frequency), name, manager_id')
      .eq('id', period.goal_id)
      .maybeSingle();
      
    if (goal && (goal.projects as any)?.report_frequency) {
       const freq = (goal.projects as any).report_frequency;
       const { generatePeriodsForGoalEmployee } = await import('./reportingPeriods');
       // Generate from previous period_end, creating just the next sequence of periods
       await generatePeriodsForGoalEmployee(
           period.goal_id, 
           period.employee_id, 
           freq, 
           new Date(period.period_end), 
           26, 
           false
       );
    }
    
    // STEP 5: Consecutive Missed Check
    if (newStatus === 'missed') {
       const { data: recentPeriods } = await supabase
         .from('reporting_periods')
         .select('status')
         .eq('goal_id', period.goal_id)
         .eq('employee_id', period.employee_id)
         .lte('period_end', period.period_end)
         .order('period_end', { ascending: false })
         .limit(4);
         
       if (recentPeriods && recentPeriods.length >= 2) {
          let consecutiveMissed = 0;
          for (const p of recentPeriods) {
              if (p.status === 'missed') {
                  consecutiveMissed++;
              } else {
                  break;
              }
          }
          
          if (consecutiveMissed >= 2) {
              const goalName = goal?.name || 'A goal';
              const managerId = goal?.manager_id;
              
              if (consecutiveMissed === 2) {
                  // Send Warning notification to employee
                  await supabase.from('notifications').insert({
                      employee_id: period.employee_id,
                      type: 'warning',
                      title: 'Consecutive Missed Reports',
                      message: `You have missed 2 consecutive reports for "${goalName}". Please submit your report.`,
                      read: false
                  });
              } else if (consecutiveMissed === 3) {
                  // Send Critical to employee, Warning to manager
                  await supabase.from('notifications').insert({
                      employee_id: period.employee_id,
                      type: 'error',
                      title: 'Critical: 3 Missed Reports',
                      message: `You have missed 3 consecutive reports for "${goalName}". Your manager has been notified.`,
                      read: false
                  });
                  if (managerId) {
                      await supabase.from('notifications').insert({
                          employee_id: managerId,
                          type: 'warning',
                          title: 'Employee Missed Reports',
                          message: `Your employee has missed 3 consecutive reports for "${goalName}".`,
                          read: false
                      });
                  }
              } else if (consecutiveMissed >= 4) {
                  // Escalate: Mark goal 'at-risk'
                  await supabase.from('goals').update({ status: 'at-risk' }).eq('id', period.goal_id);
                  
                  await supabase.from('notifications').insert({
                      employee_id: period.employee_id,
                      type: 'error',
                      title: 'Goal At Risk',
                      message: `Due to 4 consecutive missed reports, "${goalName}" has been marked At Risk.`,
                      read: false
                  });
              }
          }
       }
    }
  }

  return { missed: missedCount, excused: excusedCount };
}

/**
 * Trigger C — App loads / dashboard is viewed (safety net)
 * Check if the current period exists for the logged-in employee.
 * If no 'pending' period exists and frequency is set → generate it.
 */
export async function ensurePeriodsExistForEmployee(employeeId: string): Promise<void> {
  const { setupPeriodsForNewAssignment } = await import('./reportingPeriods');
  
  const { data: assignments } = await supabase
    .from('project_assignees')
    .select('project_id')
    .eq('assignee_id', employeeId);
    
  const projectIds = (assignments || []).map((a: any) => a.project_id);
  
  const { data: goalAssignees } = await supabase
      .from('goal_assignees')
      .select('goal_id')
      .eq('assignee_id', employeeId);
      
  const directGoalIds = (goalAssignees || []).map((ga: any) => ga.goal_id);
  
  // Get all active goals either from projects or direct assignments
  let query = supabase.from('goals').select('id').eq('status', 'active');
  
  let orConditions = [];
  if (projectIds.length > 0) orConditions.push(`project_id.in.("${projectIds.join('","')}")`);
  if (directGoalIds.length > 0) orConditions.push(`id.in.("${directGoalIds.join('","')}")`);
  
  if (orConditions.length === 0) return;
  query = query.or(orConditions.join(','));
  
  const { data: goals } = await query;
    
  if (!goals || goals.length === 0) return;
  
  // For each goal, check if a pending period exists
  for (const goal of goals) {
    const { data: period } = await supabase
      .from('reporting_periods')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('goal_id', goal.id)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle();
      
    if (!period) {
      await setupPeriodsForNewAssignment(employeeId, undefined, goal.id).catch(console.error);
    }
  }
}

/**
 * Convenience wrapper that runs the check for a single employee.
 * Called from dashboard server actions on every load.
 */
export async function runMissedCheckForEmployee(employeeId: string): Promise<void> {
  // 1. Mark missed/excused and extend chain
  await runMissedReportCheck(employeeId);
  // 2. Fallback: ensure periods exist
  await ensurePeriodsExistForEmployee(employeeId);
}
