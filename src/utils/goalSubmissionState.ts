import {
  getNextDueDate,
  normalizeFrequency,
  resolveWorkingDays,
  toSafeDate,
} from './reportScheduling'

export interface GoalSubmissionState {
  goalId: string
  goalName: string
  projectName: string
  projectId: string
  frequency: string
  /** All past-due unsubmitted periods, sorted oldest → newest */
  latePeriods: Date[]
  lateCount: number
  oldestLateDate: Date | null
  nextDueDate: Date | null
  isDueToday: boolean
}

export type SubmissionSection = 'needs_attention' | 'due_today' | 'upcoming'

export function getGoalSection(state: GoalSubmissionState): SubmissionSection {
  if (state.lateCount > 0) return 'needs_attention'
  if (state.isDueToday) return 'due_today'
  return 'upcoming'
}

/**
 * For each active goal, compute late periods, next due date, and section membership.
 * Goals with lateCount > 0 go to NEEDS ATTENTION; isDueToday → DUE TODAY; otherwise UPCOMING.
 */
export function computeGoalSubmissionStates(
  goals: any[],
  periods: any[],
  allReports: any[],
  orgWorkingDays: number[] = [1, 2, 3, 4, 5],
  today: Date = new Date(),
): GoalSubmissionState[] {
  const todayStart = new Date(today)
  todayStart.setHours(0, 0, 0, 0)

  return goals
    .filter((g: any) => g.status === 'active')
    .map((goal: any) => {
      const goalPeriods = periods.filter(
        (p: any) => (p.goal_id ?? p.goalId) === goal.id,
      )

      // Late = past-due AND no report filed
      const latePeriods: Date[] = goalPeriods
        .filter((p: any) => {
          const end = toSafeDate(p.period_end ?? p.periodEnd)
          if (!end) return false
          const endDay = new Date(end)
          endDay.setHours(0, 0, 0, 0)
          return (
            endDay < todayStart &&
            ['pending', 'late', 'missed'].includes(p.status) &&
            !p.report_id &&
            !p.reportId
          )
        })
        .map((p: any) => toSafeDate(p.period_end ?? p.periodEnd)!)
        .sort((a: Date, b: Date) => a.getTime() - b.getTime())

      // Next pending period on or after today with no report
      const nextPending = goalPeriods
        .filter((p: any) => {
          const end = toSafeDate(p.period_end ?? p.periodEnd)
          if (!end) return false
          const endDay = new Date(end)
          endDay.setHours(0, 0, 0, 0)
          return (
            endDay >= todayStart &&
            p.status === 'pending' &&
            !p.report_id &&
            !p.reportId
          )
        })
        .sort((a: any, b: any) => {
          const aT = toSafeDate(a.period_end ?? a.periodEnd)!.getTime()
          const bT = toSafeDate(b.period_end ?? b.periodEnd)!.getTime()
          return aT - bT
        })[0]

      let nextDueDate: Date | null = null
      if (nextPending) {
        nextDueDate = toSafeDate(nextPending.period_end ?? nextPending.periodEnd)
      } else {
        // Fall back to computing from last report
        const lastReport = [...(allReports ?? [])]
          .filter((r: any) => (r.goalId ?? r.goal_id) === goal.id && !r.isOnLeave)
          .sort(
            (a: any, b: any) =>
              new Date(b.submissionDate ?? b.submission_date ?? 0).getTime() -
              new Date(a.submissionDate ?? a.submission_date ?? 0).getTime(),
          )[0]

        const freq = normalizeFrequency(
          goal.projectFrequency ??
            goal.project?.reportFrequency ??
            goal.project?.report_frequency ??
            'weekly',
        )
        const workingDays = resolveWorkingDays(
          { valid_report_days: goal.validReportDays ?? goal.project?.validReportDays },
          { working_days: orgWorkingDays },
        )
        const goalStart = goal.startDate ?? goal.start_date ?? today.toISOString()
        const joinDate = goal.joinDate ?? goal.join_date ?? goalStart

        nextDueDate = getNextDueDate(
          lastReport?.submissionDate ?? lastReport?.submission_date ?? null,
          goalStart,
          joinDate,
          freq,
          workingDays,
        )
      }

      const ndDay = nextDueDate ? new Date(nextDueDate) : null
      if (ndDay) ndDay.setHours(0, 0, 0, 0)
      const isDueToday = ndDay ? ndDay.getTime() === todayStart.getTime() : false

      return {
        goalId: goal.id,
        goalName: goal.name,
        projectName:
          (typeof goal.project === 'object' ? goal.project?.name : null) ??
          (typeof goal.project === 'string' ? goal.project : null) ??
          goal.projectName ??
          '',
        projectId: goal.projectId ?? goal.project_id ?? '',
        frequency:
          goal.projectFrequency ??
          goal.project?.reportFrequency ??
          goal.project?.report_frequency ??
          'weekly',
        latePeriods,
        lateCount: latePeriods.length,
        oldestLateDate: latePeriods.length > 0 ? latePeriods[0] : null,
        nextDueDate,
        isDueToday,
      }
    })
}
