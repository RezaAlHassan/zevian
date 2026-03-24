export function calculateFinalScore(goalAverage: number, orgMetricsAverage: number, goalWeight: number): number {
    // goalWeight is a percentage 0-100
    if (goalWeight < 0 || goalWeight > 100) {
        throw new Error('Goal weight must be between 0 and 100');
    }

    const goalWeightPercent = goalWeight / 100;
    const orgWeightPercent = (100 - goalWeight) / 100;

    const finalScore = (goalAverage * goalWeightPercent) + (orgMetricsAverage * orgWeightPercent);

    return Number(finalScore.toFixed(2));
}

export function validateCriteriaWeights(criteria: { weight: number }[]): boolean {
    const totalWeight = criteria.reduce((sum, item) => sum + (item.weight || 0), 0);
    return Math.abs(totalWeight - 100) < 0.01; // Allow small floating point errors
}

export function validateReportLength(reportText: string): boolean {
    if (!reportText) return false;

    // Strip HTML tags
    const strippedText = reportText.replace(/<[^>]*>?/gm, '');

    // Check length (trim whitespace)
    return strippedText.trim().length >= 50;
}
