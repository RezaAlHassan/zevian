/**
 * Checks if a report is late based on its last submission date and required frequency.
 * 
 * @param lastReportAt - ISO string of the last report submission date
 * @param frequency - 'daily', 'weekly', 'biweekly', or 'monthly'
 * @returns boolean - true if the report is late
 */
export function isReportLate(lastReportAt: string | null | undefined, frequency: string): boolean {
    if (!lastReportAt) return true; // Never reported means it's late

    const lastDate = new Date(lastReportAt);
    const now = new Date();
    const diffInMs = now.getTime() - lastDate.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    switch (frequency.toLowerCase()) {
        case 'daily':
            return diffInDays > 1.5; // Allow some buffer
        case 'weekly':
            return diffInDays > 8; // 7 days + 1 buffer
        case 'biweekly':
        case 'bi-weekly':
            return diffInDays > 15; // 14 days + 1 buffer
        case 'monthly':
            return diffInDays > 32; // ~1 month + 1 buffer
        default:
            return diffInDays > 8; // Default to weekly if unknown
    }
}

/**
 * Calculates when the next report is due.
 */
export function getNextReportDueDate(lastReportAt: string | null | undefined, frequency: string): Date {
    const baseDate = lastReportAt ? new Date(lastReportAt) : new Date();
    const nextDate = new Date(baseDate);

    switch (frequency.toLowerCase()) {
        case 'daily':
            nextDate.setDate(baseDate.getDate() + 1);
            break;
        case 'weekly':
            nextDate.setDate(baseDate.getDate() + 7);
            break;
        case 'biweekly':
        case 'bi-weekly':
            nextDate.setDate(baseDate.getDate() + 14);
            break;
        case 'monthly':
            nextDate.setMonth(baseDate.getMonth() + 1);
            break;
        default:
            nextDate.setDate(baseDate.getDate() + 7);
    }

    return nextDate;
}
