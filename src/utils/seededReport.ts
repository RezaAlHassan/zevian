/**
 * Seeded / demo reports use ids like `rep-emp-cc-01-w1` or `rep-emp-showcase-...`,
 * whereas real submissions are `report-<timestamp>-...` (see reportService.create).
 *
 * Managers may always re-score a seeded report — to replace its fabricated demo
 * scores with genuine AI output. Real reports can only be re-scored when they
 * never completed scoring; to change a finished score, managers use the override.
 */
export function isSeededReport(id: string | null | undefined): boolean {
    return !!id && id.startsWith('rep-emp-')
}
