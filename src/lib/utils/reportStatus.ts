import type { ReportStatus } from '@/types'
import { getReportStatus } from '@/utils/reportScheduling'

export function calculateReportStatus(report: {
  isOnLeave?: boolean
  reviewedBy?: string | null
  evaluationScore?: number | null
}): 'on-leave' | 'reviewed' | 'scored' | 'pending' {
  if (report.isOnLeave) return 'on-leave'
  if (report.reviewedBy) return 'reviewed'
  if (report.evaluationScore !== null && report.evaluationScore !== undefined) return 'scored'
  return 'pending'
}

export function isLateSubmission(report: {
  submittedForDate?: string | null
  submissionDate?: string | null
}): boolean {
  if (!report.submittedForDate || !report.submissionDate) return false
  return getReportStatus(
    new Date(`${report.submittedForDate}T12:00:00`),
    { submissionDate: report.submissionDate },
    null,
    true,
  ) === 'submitted_late'
}

export { getReportStatus }
export type { ReportStatus }
