import { ReportingPeriod, getEffectiveStatus } from './reportingPeriods';

export type ComplianceState = 'GREEN' | 'AMBER' | 'RED' | 'GRAY';

export interface DisplayStatus {
  state: ComplianceState;
  label: string;
}

/**
 * Calculates the compliance display state for a single reporting period.
 * 
 * Rules:
 * GREEN  → submitted within grace window (on time)
 * AMBER  → submitted past grace (late, accepted) OR missed but within ramp-up ('amber_missed')
 * RED    → missed and beyond ramp up
 * GRAY   → excused, void, or pending
 */
export function getPeriodDisplayStatus(
  period: ReportingPeriod,
  getRampUpEndsAt: (period: ReportingPeriod) => Date | null,
  graceDays = 0,
): DisplayStatus {
  // Derive status on the fly — a pending period past its grace deadline = missed
  const effectiveStatus = getEffectiveStatus(period, graceDays)

  if (effectiveStatus === 'excused' || effectiveStatus === 'void' || effectiveStatus === 'pending') {
    return { state: 'GRAY', label: effectiveStatus === 'excused' ? 'Excused' : effectiveStatus === 'void' ? 'Void' : 'Pending' };
  }

  if (effectiveStatus === 'submitted') {
    if (period.lateSubmitted) {
      return { state: 'AMBER', label: 'Late Submission' };
    }
    return { state: 'GREEN', label: 'On Time' };
  }

  if (effectiveStatus === 'missed' || (effectiveStatus as any) === 'amber_missed') {
    // Check if period fell within the ramp-up window for its specific project
    const periodEndDate = new Date(period.periodEnd);
    const rampUpEndsAt = getRampUpEndsAt(period);
    const isRampUp = rampUpEndsAt && periodEndDate <= rampUpEndsAt;

    if (isRampUp || (effectiveStatus as any) === 'amber_missed') {
      return { state: 'AMBER', label: 'Missed (Ramp-up)' };
    }

    return { state: 'RED', label: 'Missed' };
  }

  return { state: 'GRAY', label: 'Unknown' };
}

/**
 * Calculates the streak and compliance summary for an employee based on their past periods.
 * Expected input: `periods` sorted by date descending (newest first).
 * Only processes the last `count` (default 10) valid periods.
 */
export function calculateComplianceStreak(
  allPeriods: ReportingPeriod[],
  getRampUpEndsAt: (period: ReportingPeriod) => Date | null,
  count: number = 10,
  graceDays = 0,
) {
  // First limit to the last `count` periods chronologically
  const recentPeriods = allPeriods.slice(0, count);
  
  // Calculate display status for each
  const displayHistory = recentPeriods.map((period) => {
    return {
      period,
      display: getPeriodDisplayStatus(period, getRampUpEndsAt, graceDays)
    };
  });

  // For compliance calculation, exclude GRAY periods from the denominator
  const consideredPeriods = displayHistory.filter(p => p.display.state !== 'GRAY');
  const total = consideredPeriods.length;
  const compliantCount = consideredPeriods.filter(p => p.display.state === 'GREEN' || p.display.state === 'AMBER').length;
  
  let currentMissStreak = 0;
  for (const p of displayHistory) {
    if (p.display.state === 'RED') {
      currentMissStreak++;
    } else if (p.display.state === 'GREEN' || p.display.state === 'AMBER' || p.display.state === 'GRAY') {
      // If we hit a GREEN/AMBER, the miss streak is broken. 
      // If we hit a GRAY, should we break the miss streak? 
      // A pending period or an excused leave doesn't necessarily break a historical miss streak,
      // but if we are counting backwards from today, an excused week means the streak of misses is paused or broken.
      // Usually, any non-RED breaks contiguous RED counting if we strictly count consecutive REDs.
      if (p.display.state !== 'GRAY') {
        break;
      }
    }
  }

  return {
    streakLabel: `${compliantCount} of last ${total} periods compliant`,
    totalConsidered: total,
    submittedCount: compliantCount,
    currentMissStreak,
    isDanger: currentMissStreak >= 2,
    history: displayHistory
  };
}
