/**
 * Reporting Periods — period generation and management.
 *
 * IMPORTANT: Two deadline types exist in this system. This file handles ONLY
 * the reporting deadline (frequency-driven, hard deadline). Never use goals.deadline
 * for any logic in this file.
 *
 * Anchor date logic:
 *   - anchor_date = the exact moment the frequency was set
 *   - period_end[n]   = anchor_date + n * interval
 *   - period_start[n] = anchor_date + (n-1) * interval  (= period_end[n-1])
 *
 * First Period Grace Rule:
 *   If (anchor_date + 1 interval − anchor_date) < 24 h that is always >= 1 interval,
 *   but if the first period_end is less than 24 h away from anchor_date, push it
 *   forward by one interval.  e.g. weekly set at 11pm means first deadline is
 *   14 days away, not 7 hours away.
 */

import { supabase } from '../../supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReportingFrequency = 'daily' | 'weekly' | 'bi-weekly' | 'monthly';

export interface ReportingPeriod {
  id: string;
  goalId: string;
  employeeId: string;
  periodStart: string;  // ISO UTC
  periodEnd: string;    // ISO UTC
  status: 'pending' | 'submitted' | 'missed' | 'excused' | 'void';
  lateSubmitted: boolean;
  reportId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoalFrequencyAnchor {
  id: string;
  goalId: string;
  employeeId: string;
  frequency: ReportingFrequency;
  anchorDate: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Interval helpers ─────────────────────────────────────────────────────────

const INTERVAL_MS: Record<ReportingFrequency, number> = {
  daily:      1   * 24 * 60 * 60 * 1000,
  weekly:     7   * 24 * 60 * 60 * 1000,
  'bi-weekly': 14 * 24 * 60 * 60 * 1000,
  monthly:    30  * 24 * 60 * 60 * 1000,  // approximate; see note below
};

/**
 * Returns the timestamp of period_end[n] where n is 1-based.
 * For 'monthly' we add calendar months (not 30 days) to stay accurate.
 */
function addInterval(base: Date, frequency: ReportingFrequency, n: number): Date {
  if (frequency === 'monthly') {
    const d = new Date(base);
    d.setUTCMonth(d.getUTCMonth() + n);
    return d;
  }
  return new Date(base.getTime() + n * INTERVAL_MS[frequency]);
}

// ─── ID generation ────────────────────────────────────────────────────────────

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

// ─── DB mapping helpers ───────────────────────────────────────────────────────

function dbToPeriod(row: any): ReportingPeriod {
  return {
    id: row.id,
    goalId: row.goal_id,
    employeeId: row.employee_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    status: row.status,
    lateSubmitted: row.late_submitted,
    reportId: row.report_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function dbToAnchor(row: any): GoalFrequencyAnchor {
  return {
    id: row.id,
    goalId: row.goal_id,
    employeeId: row.employee_id,
    frequency: row.frequency,
    anchorDate: row.anchor_date,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

// ─── Period Generation ────────────────────────────────────────────────────────

/**
 * Generates `forwardCount` reporting periods for a (goal, employee) pair.
 * Applies the First Period Grace Rule.
 *
 * Safe to call at frequency set-time or after a frequency change (call
 * voidCurrentPeriodAndRegenerate instead of this directly when changing frequency).
 *
 * @param goalId
 * @param employeeId
 * @param frequency
 * @param anchorDate  The exact timestamp when the frequency was set
 * @param forwardCount  How many future periods to pre-generate (default 26)
 */
export async function generatePeriodsForGoalEmployee(
  goalId: string,
  employeeId: string,
  frequency: ReportingFrequency,
  anchorDate: Date,
  forwardCount = 26,
  isNewAssignment = false
): Promise<ReportingPeriod[]> {
  const intervalMs = INTERVAL_MS[frequency];

  // First Period Grace Rule: if first period_end would be < 24h from now, push it forward
  const firstPeriodEnd = addInterval(anchorDate, frequency, 1);
  const graceThresholdMs = 24 * 60 * 60 * 1000;
  const applyGrace = (firstPeriodEnd.getTime() - anchorDate.getTime()) < graceThresholdMs;

  const startOffset = applyGrace ? 1 : 0;  // start generating from n=2 if grace applied


  const rows: any[] = [];

  for (let n = 1; n <= forwardCount; n++) {
    // With grace: first real period is n+1 intervals from anchor
    const actualN = n + startOffset;
    const periodStart = addInterval(anchorDate, frequency, actualN - 1);
    const periodEnd   = addInterval(anchorDate, frequency, actualN);

    // Ramp up ends 14 days after anchor for first new assignment — stored on project_assignees, NOT on period rows

    rows.push({
      id: makeId('rp'),
      goal_id: goalId,
      employee_id: employeeId,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      status: 'pending',
      late_submitted: false,
      report_id: null,
    });
  }

  const { data, error } = await supabase
    .from('reporting_periods')
    .insert(rows)
    .select();

  if (error) throw error;
  return (data || []).map(dbToPeriod);
}

// ─── Frequency Change ─────────────────────────────────────────────────────────

/**
 * Called when a manager changes the reporting frequency for a (goal, employee).
 *
 * 1. Voids the current pending period
 * 2. Deactivates the old anchor
 * 3. Creates a new anchor with anchor_date = NOW()
 * 4. Generates new periods from the new anchor
 *
 * Past submitted/missed periods are NOT touched.
 */
export async function setFrequencyForGoalEmployee(
  goalId: string,
  employeeId: string,
  newFrequency: ReportingFrequency,
): Promise<GoalFrequencyAnchor> {
  const now = new Date();

  // 1. Void current pending period (if any)
  await supabase
    .from('reporting_periods')
    .update({ status: 'void' })
    .eq('goal_id', goalId)
    .eq('employee_id', employeeId)
    .eq('status', 'pending')
    .lte('period_start', now.toISOString());

  // 2. Deactivate old anchor
  await supabase
    .from('goal_frequency_anchors')
    .update({ is_active: false })
    .eq('goal_id', goalId)
    .eq('employee_id', employeeId)
    .eq('is_active', true);

  // 3. Create new anchor
  const anchorId = makeId('gfa');
  const { data: anchorData, error: anchorError } = await supabase
    .from('goal_frequency_anchors')
    .insert({
      id: anchorId,
      goal_id: goalId,
      employee_id: employeeId,
      frequency: newFrequency,
      anchor_date: now.toISOString(),
      is_active: true,
    })
    .select()
    .single();

  if (anchorError) throw anchorError;

  // 4. Generate periods from new anchor
  await generatePeriodsForGoalEmployee(goalId, employeeId, newFrequency, now);

  return dbToAnchor(anchorData);
}

/**
 * Trigger A — Frequency is set or changed on manager_settings
 * Gets all employees under manager, finds their active goals, and resets periods.
 */
export async function applyGlobalFrequencyUpdate(managerId: string): Promise<void> {
  // 1. Get all employees under this manager
  const { data: employees } = await supabase
    .from('employees')
    .select('id')
    .eq('manager_id', managerId);
    
  if (!employees || employees.length === 0) return;
  const employeeIds = employees.map((e: any) => e.id);

  // For each employee, find their active goals and the goals' project frequency
  for (const empId of employeeIds) {
    // A. Find projects for this employee
    const { data: assignments } = await supabase
      .from('project_assignees')
      .select('project_id')
      .eq('assignee_id', empId);
      
    if (!assignments || assignments.length === 0) continue;
    const projectIds = assignments.map((a: any) => a.project_id);
    
    // B. Get project frequencies and manager settings
    const { data: settings } = await supabase
      .from('manager_settings')
      .select('global_frequency, report_frequency')
      .eq('manager_id', managerId)
      .maybeSingle();

    const globalFreq = settings?.global_frequency ? (settings.report_frequency as ReportingFrequency) : null;

    const { data: projects } = await supabase
      .from('projects')
      .select('id, report_frequency')
      .in('id', projectIds);
      
    const freqMap = new Map<string, ReportingFrequency>();
    if (projects) {
      for (const p of projects) {
        // Project Frequency > Global Frequency > 'weekly'
        const freq = (p.report_frequency as ReportingFrequency) || globalFreq || 'weekly';
        freqMap.set(p.id, freq);
      }
    }
    
    // C. Get active goals
    const { data: goals } = await supabase
      .from('goals')
      .select('id, project_id')
      .in('project_id', projectIds)
      .eq('status', 'active');
      
    if (!goals) continue;
    
    // D. Apply frequency for each goal+employee pair
    for (const goal of goals) {
      const freq = freqMap.get(goal.project_id);
      if (freq) {
        // This will void existing 'pending' periods and generate new ones from NOW()
        await setFrequencyForGoalEmployee(goal.id, empId, freq);
      }
    }
  }
}

/**
 * Trigger B — A new employee is assigned to a project/goal
 */
export async function setupPeriodsForNewAssignment(
  employeeId: string,
  projectId?: string,
  goalId?: string
): Promise<void> {
  const now = new Date();
  
  if (goalId) {
    const { data: goal } = await supabase
      .from('goals')
      .select('id, project_id, status, manager_id, projects(report_frequency)')
      .eq('id', goalId)
      .maybeSingle();

    if (goal && goal.status === 'active') {
      let freq: ReportingFrequency = 'weekly';
      const projectFreq = (goal.projects as any)?.report_frequency;

      if (projectFreq) {
        freq = projectFreq as ReportingFrequency;
      } else if (goal.manager_id) {
        const { data: settings } = await supabase
          .from('manager_settings')
          .select('global_frequency, report_frequency')
          .eq('manager_id', goal.manager_id)
          .maybeSingle();
        
        if (settings?.global_frequency && settings.report_frequency) {
          freq = settings.report_frequency as ReportingFrequency;
        }
      }
      
      await generatePeriodsForGoalEmployee(goal.id, employeeId, freq, now, 26, true);
    }
  } else if (projectId) {
    const { data: project } = await supabase
      .from('projects')
      .select('report_frequency, created_by')
      .eq('id', projectId)
      .maybeSingle();
      
    let freq: ReportingFrequency = 'weekly';
    const projectFreq = project?.report_frequency;

    if (projectFreq) {
      freq = projectFreq as ReportingFrequency;
    } else if (project?.created_by) {
      const { data: settings } = await supabase
        .from('manager_settings')
        .select('global_frequency, report_frequency')
        .eq('manager_id', project.created_by)
        .maybeSingle();
      
      if (settings?.global_frequency && settings.report_frequency) {
        freq = settings.report_frequency as ReportingFrequency;
      }
    }
    
    const { data: goals } = await supabase
      .from('goals')
      .select('id')
      .eq('project_id', projectId)
      .eq('status', 'active');
      
    if (goals) {
      for (const g of goals) {
        await generatePeriodsForGoalEmployee(g.id, employeeId, freq, now, 26, true);
      }
    }
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns the active (pending) anchor for a (goal, employee) pair.
 */
export async function getActiveAnchor(
  goalId: string,
  employeeId: string,
): Promise<GoalFrequencyAnchor | null> {
  const { data, error } = await supabase
    .from('goal_frequency_anchors')
    .select('*')
    .eq('goal_id', goalId)
    .eq('employee_id', employeeId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data ? dbToAnchor(data) : null;
}

/**
 * Returns the current pending period for a (goal, employee), i.e. the one
 * that is open right now and hasn't been submitted/missed/excused.
 */
export async function getCurrentPendingPeriod(
  goalId: string,
  employeeId: string,
): Promise<ReportingPeriod | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('reporting_periods')
    .select('*')
    .eq('goal_id', goalId)
    .eq('employee_id', employeeId)
    .eq('status', 'pending')
    .lte('period_start', now)
    .gte('period_end', now)
    .order('period_end', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? dbToPeriod(data) : null;
}

/**
 * Returns the soonest pending period across all goals for an employee.
 * Used by the dashboard "Next report due" KPI.
 */
export async function getSoonestPendingPeriod(
  employeeId: string,
): Promise<ReportingPeriod | null> {
  const { data, error } = await supabase
    .from('reporting_periods')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'pending')
    .order('period_end', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? dbToPeriod(data) : null;
}

/**
 * Returns all pending periods for an employee, sorted soonest first.
 * Used by the submit-report sidebar and upcoming reports card.
 */
export async function getAllPendingPeriods(
  employeeId: string,
): Promise<ReportingPeriod[]> {
  const { data, error } = await supabase
    .from('reporting_periods')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'pending')
    .order('period_end', { ascending: true });

  if (error) throw error;
  return (data || []).map(dbToPeriod);
}

// ─── Submission Matching ──────────────────────────────────────────────────────

/**
 * Finds the period that matches a given submission timestamp.
 * Matching rule: period_start <= submissionDate < period_end
 *
 * Also detects late submissions (period has passed, but still within the next cycle).
 */
export async function findMatchingPeriod(
  goalId: string,
  employeeId: string,
  submissionDate: Date,
  gracePeriodDays = 0,
): Promise<{ period: ReportingPeriod; isLate: boolean } | null> {
  const ts = submissionDate.toISOString();

  // Try on-time match first
  const { data: onTime } = await supabase
    .from('reporting_periods')
    .select('*')
    .eq('goal_id', goalId)
    .eq('employee_id', employeeId)
    .lte('period_start', ts)
    .gt('period_end', ts)
    .not('status', 'eq', 'void')
    .order('period_end', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (onTime) return { period: dbToPeriod(onTime), isLate: false };

  // Try late match: find the most-recent period whose period_end has already passed
  const { data: late } = await supabase
    .from('reporting_periods')
    .select('*')
    .eq('goal_id', goalId)
    .eq('employee_id', employeeId)
    .in('status', ['missed', 'pending'])
    .lt('period_end', ts)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!late) return null;

  const latePeriod = dbToPeriod(late);

  // Late submissions are only valid within one full cycle past period_end
  // Find the next period after this one to determine the cutoff
  const { data: nextPeriod } = await supabase
    .from('reporting_periods')
    .select('period_end')
    .eq('goal_id', goalId)
    .eq('employee_id', employeeId)
    .gt('period_start', latePeriod.periodEnd)
    .not('status', 'eq', 'void')
    .order('period_start', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!nextPeriod) return null;  // no next period found, can't accept

  // Must be submitted before the NEXT period's end
  if (submissionDate.getTime() < new Date(nextPeriod.period_end).getTime()) {
    // Check if within grace period
    const effectiveDeadline = new Date(latePeriod.periodEnd).getTime() + (gracePeriodDays * 24 * 60 * 60 * 1000);
    const isWithinGrace = submissionDate.getTime() <= effectiveDeadline;
    
    return { period: latePeriod, isLate: !isWithinGrace };
  }

  return null;  // more than one full cycle late — always reject
}

/**
 * Marks a period as submitted.
 * @param backdatedAfterMissed Pass true when the period was already 'missed' before this submission.
 */
export async function markPeriodSubmitted(
  periodId: string,
  reportId: string,
  isLate: boolean,
  backdatedAfterMissed = false,
): Promise<void> {
  const { error } = await supabase
    .from('reporting_periods')
    .update({
      status: 'submitted',
      report_id: reportId,
      late_submitted: isLate,
      ...(backdatedAfterMissed ? { backdated_after_missed_flagged: true } : {}),
    })
    .eq('id', periodId);

  if (error) throw error;
}

// ─── Backdated Submission Support ─────────────────────────────────────────────

export type BackdateValidationResult =
  | { ok: true; period: ReportingPeriod; wasAlreadyMissed: boolean; isLate: boolean }
  | { ok: false; error: string };

/**
 * Validates and finds the target period for a backdated submission.
 *
 * Call this when the employee has selected a date in the past (selected_date < today).
 *
 * Checks (in order):
 *  1. allow_late_submissions — must be true
 *  2. backdate_limit_days — selected date must be within the allowed window
 *  3. Period existence — a period must exist for the selected date
 *  4. Period status — 'void' and 'submitted' are rejected
 */
export async function findPeriodForBackdatedSubmission(
  goalId: string,
  employeeId: string,
  managerId: string,
  selectedDate: Date,  // The date the employee chose
): Promise<BackdateValidationResult> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const sel = new Date(selectedDate);
  sel.setUTCHours(0, 0, 0, 0);

  const daysBack = Math.floor((today.getTime() - sel.getTime()) / (1000 * 60 * 60 * 24));

  // ── Step 1: Fetch manager settings ──
  const { data: settings } = await supabase
    .from('manager_settings')
    .select('allow_late_submissions, backdate_limit_days, grace_period_days')
    .eq('manager_id', managerId)
    .maybeSingle();

  const allowLate = settings?.allow_late_submissions ?? true;
  const backdateDays: number | null = settings?.backdate_limit_days ?? null;
  const gracePeriodDays = settings?.grace_period_days ?? 0;

  // ── Step 2: Check allow_late_submissions ──
  if (!allowLate) {
    return {
      ok: false,
      error: 'Late and backdated submissions are not allowed for this goal.',
    };
  }

  // ── Step 3: Check backdate_limit_days ──
  if (backdateDays === null) {
    // NULL + allowLate=false already handled above.
    // NULL + allowLate=true: no explicit limit configured — apply default 7-day window
    // (matches the client-side fallback in SubmitReportClient).
    if (daysBack > 7) {
      return { ok: false, error: 'You can only submit reports up to 7 days in the past.' };
    }
  } else if (backdateDays > 0 && daysBack > backdateDays) {
    return {
      ok: false,
      error: `You can only submit reports up to ${backdateDays} day${backdateDays === 1 ? '' : 's'} in the past.`,
    };
  }

  // ── Step 4: Find the target period ──
  // A date falls in a period if: period_start <= date < period_end
  const selIso = selectedDate.toISOString();
  const { data: periodRow } = await supabase
    .from('reporting_periods')
    .select('*')
    .eq('goal_id', goalId)
    .eq('employee_id', employeeId)
    .lte('period_start', selIso)
    .gt('period_end', selIso)
    .order('period_end', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!periodRow) {
    return { ok: false, error: 'No reporting period exists for the selected date.' };
  }

  const period = dbToPeriod(periodRow);

  // ── Step 5: Period status checks ──
  if (period.status === 'void') {
    return { ok: false, error: 'This period was cancelled due to a schedule change.' };
  }
  if (period.status === 'submitted') {
    return { ok: false, error: 'A report has already been submitted for this period.' };
  }

  // ── Step 6: Was it already surfaced as missed? ──
  // A period is 'missed' if it was already marked as missed, 
  // OR if it's currently pending but NOW > period_end + grace
  const effectiveDeadline = new Date(period.periodEnd).getTime() + (gracePeriodDays * 24 * 60 * 60 * 1000);
  const isPastGrace = Date.now() > effectiveDeadline;
  
  const wasAlreadyMissed = period.status === 'missed' || (period.status === 'pending' && isPastGrace);

  // ── Step 7: Is this submission on-time or late relative to grace? ──
  // For backdated submissions, they are almost always "late" in the real-world sense,
  // but we should set late_submitted = false if it's within the grace window.
  const isLate = selectedDate.getTime() > effectiveDeadline;

  return { ok: true, period, wasAlreadyMissed, isLate };
}

/**
 * Fetches only the manager backdate settings relevant for UI rendering.
 * Returns null if no settings exist (treat as defaults).
 */
export async function getManagerBackdateSettings(managerId: string): Promise<{
  allowLateSubmissions: boolean;
  backdateLimitDays: number | null;
  gracePeriodDays: number;
} | null> {
  const { data } = await supabase
    .from('manager_settings')
    .select('allow_late_submissions, backdate_limit_days, grace_period_days')
    .eq('manager_id', managerId)
    .maybeSingle();

  if (!data) return null;
  return {
    allowLateSubmissions: data.allow_late_submissions ?? true,
    backdateLimitDays: data.backdate_limit_days ?? null,
    gracePeriodDays: data.grace_period_days ?? 0,
  };
}
