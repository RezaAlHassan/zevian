import { describe, it, expect } from 'vitest';
import { calculateFinalScore, validateCriteriaWeights, validateReportLength } from './scoreCalculation';

describe('calculateFinalScore', () => {
    it('calculates score with 70% goal weight', () => {
        // (80 * 0.7) + (90 * 0.3) = 56 + 27 = 83
        expect(calculateFinalScore(80, 90, 70)).toBe(83);
    });

    it('calculates score with 100% goal weight', () => {
        expect(calculateFinalScore(80, 90, 100)).toBe(80);
    });

    it('calculates score with 0% goal weight', () => {
        expect(calculateFinalScore(80, 90, 0)).toBe(90);
    });

    it('throws error for invalid weight', () => {
        expect(() => calculateFinalScore(80, 90, 150)).toThrow();
        expect(() => calculateFinalScore(80, 90, -10)).toThrow();
    });
});

describe('validateCriteriaWeights', () => {
    it('returns true when weights total exactly 100', () => {
        expect(validateCriteriaWeights([{ weight: 50 }, { weight: 50 }])).toBe(true);
        expect(validateCriteriaWeights([{ weight: 33.33 }, { weight: 33.33 }, { weight: 33.34 }])).toBe(true);
    });

    it('returns false when weights total < 100', () => {
        expect(validateCriteriaWeights([{ weight: 40 }, { weight: 50 }])).toBe(false);
    });

    it('returns false when weights total > 100', () => {
        expect(validateCriteriaWeights([{ weight: 60 }, { weight: 50 }])).toBe(false);
    });

    it('handles empty criteria', () => {
        expect(validateCriteriaWeights([])).toBe(false); // 0 != 100
    });
});

describe('validateReportLength', () => {
    it('returns true for reports >= 50 chars', () => {
        const longText = 'This is a long report text that should easily be over 50 characters in length.';
        expect(validateReportLength(longText)).toBe(true);
    });

    it('returns false for reports < 50 chars', () => {
        const shortText = 'Too short report.';
        expect(validateReportLength(shortText)).toBe(false);
    });

    it('strips HTML before validating length', () => {
        // The HTML is long, but the text is short
        const shortTextWithHtml = '<p><h1><b>Too short</b></h1></p>';
        expect(validateReportLength(shortTextWithHtml)).toBe(false);

        // The HTML is long, and the text is also long enough
        const longTextWithHtml = '<p><b>This is a long report text that should easily be over 50 characters in length.</b></p>';
        expect(validateReportLength(longTextWithHtml)).toBe(true);
    });

    it('handles empty or undefined strings', () => {
        expect(validateReportLength('')).toBe(false);
        // @ts-ignore
        expect(validateReportLength(undefined)).toBe(false);
        // @ts-ignore
        expect(validateReportLength(null)).toBe(false);
    });
});
