import { DEFAULT_WORKING_DAYS, getNextDueDate, normalizeFrequency } from './reportScheduling'

export function isReportLate(lastReportAt: string | null | undefined, frequency: string, workingDays?: number[]): boolean {
    if (!lastReportAt) return true
    const days = workingDays ?? DEFAULT_WORKING_DAYS
    const dueDate = getNextDueDate(lastReportAt, lastReportAt, lastReportAt, normalizeFrequency(frequency), days)
    return new Date() > dueDate
}

export function getNextReportDueDate(lastReportAt: string | null | undefined, frequency: string, workingDays?: number[]): Date {
    const baseDate = lastReportAt ?? new Date().toISOString()
    const days = workingDays ?? DEFAULT_WORKING_DAYS
    return getNextDueDate(baseDate, baseDate, baseDate, normalizeFrequency(frequency), days)
}
