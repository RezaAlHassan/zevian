import type { ReportStatus, ReportingFrequency } from '@/types'

export const DEFAULT_VALID_REPORT_DAYS = [1, 2, 3, 4, 5]
export const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5]

export function getWorkingDays(org: { working_days?: number[] } | null | undefined): number[] {
  return org?.working_days?.length ? org.working_days : DEFAULT_WORKING_DAYS
}

export function resolveWorkingDays(
  project: { valid_report_days?: number[] } | null | undefined,
  org: { working_days?: number[] | null } | null | undefined,
): number[] {
  if (project?.valid_report_days?.length) return project.valid_report_days
  if (org?.working_days?.length) return org.working_days
  return DEFAULT_WORKING_DAYS
}

type ReportSubmission = {
  submitted_at?: Date | string | null
  submissionDate?: Date | string | null
  submittedForDate?: Date | string | null
}

type LeaveRecord = {
  startDate?: Date | string | null
  endDate?: Date | string | null
  start_date?: Date | string | null
  end_date?: Date | string | null
}

const INTERVAL_DAYS: Record<ReportingFrequency, number> = {
  daily: 1,
  weekly: 7,
  'bi-weekly': 14,
  monthly: 30,
}

export function normalizeFrequency(frequency?: string | null): ReportingFrequency {
  const normalized = frequency?.toLowerCase()
  if (normalized === 'daily' || normalized === 'weekly' || normalized === 'monthly') return normalized
  if (normalized === 'biweekly' || normalized === 'bi-weekly') return 'bi-weekly'
  return 'weekly'
}

export function toSafeDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) return new Date(value)
  const parsed = value.includes('T') ? new Date(value) : new Date(`${value}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function startOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function endOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

export function datesEqualDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

export function getNextDueDate(
  lastSubmissionDate: Date | string | null,
  goalStartDate: Date | string,
  employeeJoinDate: Date | string,
  frequency: ReportingFrequency | string,
  workingDays: number[] = DEFAULT_WORKING_DAYS,
): Date {
  const safeGoalStart = toSafeDate(goalStartDate) ?? new Date()
  const safeJoinDate = toSafeDate(employeeJoinDate) ?? safeGoalStart
  const baseDate = lastSubmissionDate
    ? (toSafeDate(lastSubmissionDate) ?? safeGoalStart)
    : new Date(Math.max(safeGoalStart.getTime(), safeJoinDate.getTime()))

  const normalizedFrequency = normalizeFrequency(frequency)
  const next = new Date(baseDate)
  next.setDate(next.getDate() + INTERVAL_DAYS[normalizedFrequency])

  if (normalizedFrequency === 'daily') {
    const allowedDays = workingDays.length > 0 ? workingDays : DEFAULT_WORKING_DAYS
    while (!allowedDays.includes(next.getDay())) {
      next.setDate(next.getDate() + 1)
    }
  }

  return next
}

export function isLeaveCoveringDate(leaveRecord: LeaveRecord | null, dueDate: Date): boolean {
  if (!leaveRecord) return false
  const start = toSafeDate(leaveRecord.startDate ?? leaveRecord.start_date)
  const end = toSafeDate(leaveRecord.endDate ?? leaveRecord.end_date)
  if (!start || !end) return false
  const due = startOfDay(dueDate).getTime()
  return due >= startOfDay(start).getTime() && due <= endOfDay(end).getTime()
}

export function getReportStatus(
  dueDate: Date,
  submission: ReportSubmission | null,
  leaveRecord: LeaveRecord | null,
  lateSubmissionsAllowed: boolean,
  today: Date = new Date(),
): ReportStatus {
  if (isLeaveCoveringDate(leaveRecord, dueDate)) return 'on_leave'

  if (submission) {
    const submittedAt = toSafeDate(submission.submitted_at ?? submission.submissionDate ?? submission.submittedForDate)
    if (submittedAt) {
      const submittedOnTime = submittedAt.getTime() <= endOfDay(dueDate).getTime()
      return submittedOnTime ? 'submitted' : 'submitted_late'
    }
  }

  const currentDay = startOfDay(today)
  const dueDay = startOfDay(dueDate)
  const isPastDue = currentDay.getTime() > dueDay.getTime()

  if (!isPastDue) {
    return datesEqualDay(currentDay, dueDay) ? 'due_today' : 'upcoming'
  }

  return lateSubmissionsAllowed ? 'late' : 'missed'
}

export type ExpectedReportPeriod = {
  dueDate: Date
  status: ReportStatus
  submission: any | null
  leaveRecord: any | null
}

export function getExpectedDueDatesBetween(
  goalStartDate: Date | string,
  employeeJoinDate: Date | string,
  frequency: ReportingFrequency | string,
  workingDays: number[] = DEFAULT_WORKING_DAYS,
  today: Date = new Date(),
): Date[] {
  const normalizedFrequency = normalizeFrequency(frequency)
  const firstBaseDate = new Date(Math.max(
    (toSafeDate(goalStartDate) ?? today).getTime(),
    (toSafeDate(employeeJoinDate) ?? today).getTime(),
  ))

  const results: Date[] = []
  let cursor: Date | null = null

  while (true) {
    const nextDue = getNextDueDate(cursor, firstBaseDate, firstBaseDate, normalizedFrequency, workingDays)
    if (startOfDay(nextDue).getTime() > startOfDay(today).getTime()) break
    results.push(nextDue)
    cursor = nextDue
  }

  return results
}

export function buildExpectedReportPeriods(params: {
  goalStartDate: Date | string
  employeeJoinDate: Date | string
  frequency: ReportingFrequency | string
  workingDays?: number[]
  submissions: any[]
  leaveRecords?: any[]
  lateSubmissionsAllowed: boolean
  today?: Date
}): ExpectedReportPeriod[] {
  const {
    goalStartDate,
    employeeJoinDate,
    frequency,
    workingDays = DEFAULT_WORKING_DAYS,
    submissions,
    leaveRecords = [],
    lateSubmissionsAllowed,
    today = new Date(),
  } = params

  return getExpectedDueDatesBetween(goalStartDate, employeeJoinDate, frequency, workingDays, today).map((dueDate) => {
    const submission = submissions.find((item) => {
      const submittedFor = toSafeDate(item.submittedForDate ?? item.submitted_for_date)
      return submittedFor ? datesEqualDay(submittedFor, dueDate) : false
    }) ?? null

    const leaveRecord = leaveRecords.find((item) => isLeaveCoveringDate(item, dueDate)) ?? null
    const status = getReportStatus(dueDate, submission, leaveRecord, lateSubmissionsAllowed, today)

    return {
      dueDate,
      status,
      submission,
      leaveRecord,
    }
  })
}
