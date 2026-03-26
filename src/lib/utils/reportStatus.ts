export function calculateReportStatus(report: {
  isOnLeave?: boolean;
  reviewedBy?: string | null;
  evaluationScore?: number | null;
}): 'on-leave' | 'reviewed' | 'scored' | 'pending' {
  if (report.isOnLeave) {
    return 'on-leave';
  }
  if (report.reviewedBy) {
    return 'reviewed';
  }
  if (report.evaluationScore !== null && report.evaluationScore !== undefined) {
    return 'scored';
  }
  return 'pending';
}
