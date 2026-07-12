import assert from 'node:assert'
import test, { describe } from 'node:test'
import {
    kindFromFrequency,
    frequencyLabel,
    parsePeriodDate,
    formatPeriodWindow,
} from './managerUploadShared.ts'

describe('kindFromFrequency', () => {
    test('monthly is intangible', () => {
        assert.strictEqual(kindFromFrequency('monthly'), 'intangible')
        assert.strictEqual(kindFromFrequency('Monthly'), 'intangible')
    })

    test('weekly / bi-weekly / daily are tangible', () => {
        assert.strictEqual(kindFromFrequency('weekly'), 'tangible')
        assert.strictEqual(kindFromFrequency('bi-weekly'), 'tangible')
        assert.strictEqual(kindFromFrequency('daily'), 'tangible')
    })

    test('null / undefined / empty default to tangible', () => {
        assert.strictEqual(kindFromFrequency(null), 'tangible')
        assert.strictEqual(kindFromFrequency(undefined), 'tangible')
        assert.strictEqual(kindFromFrequency(''), 'tangible')
    })
})

describe('frequencyLabel', () => {
    test('names weekly / bi-weekly / monthly', () => {
        assert.strictEqual(frequencyLabel('weekly'), 'weekly')
        assert.strictEqual(frequencyLabel('monthly'), 'monthly')
    })

    test('normalizes biweekly variants to "bi-weekly"', () => {
        assert.strictEqual(frequencyLabel('biweekly'), 'bi-weekly')
        assert.strictEqual(frequencyLabel('bi-weekly'), 'bi-weekly')
        assert.strictEqual(frequencyLabel('bi weekly'), 'bi-weekly')
        assert.strictEqual(frequencyLabel('BI_WEEKLY'), 'bi-weekly')
    })

    test('returns null for unknown / missing cadences', () => {
        assert.strictEqual(frequencyLabel('daily'), null)
        assert.strictEqual(frequencyLabel('yearly'), null)
        assert.strictEqual(frequencyLabel(null), null)
        assert.strictEqual(frequencyLabel(undefined), null)
        assert.strictEqual(frequencyLabel(''), null)
    })
})

describe('parsePeriodDate', () => {
    const iso = (d: Date | null) => (d ? d.toISOString() : null)

    test('parses ISO YYYY-MM-DD at UTC midnight', () => {
        assert.strictEqual(iso(parsePeriodDate('2026-06-15')), '2026-06-15T00:00:00.000Z')
    })

    test('zero-pads single-digit ISO month/day', () => {
        assert.strictEqual(iso(parsePeriodDate('2026-6-5')), '2026-06-05T00:00:00.000Z')
    })

    test('uses the START of a "to" range', () => {
        assert.strictEqual(iso(parsePeriodDate('2026-06-15 to 2026-06-21')), '2026-06-15T00:00:00.000Z')
    })

    test('uses the START of a dash range', () => {
        assert.strictEqual(iso(parsePeriodDate('2026-06-15 - 2026-06-21')), '2026-06-15T00:00:00.000Z')
    })

    test('uses the START of an en-dash / em-dash range', () => {
        assert.strictEqual(iso(parsePeriodDate('2026-06-15 – 2026-06-21')), '2026-06-15T00:00:00.000Z')
        assert.strictEqual(iso(parsePeriodDate('2026-06-15 — 2026-06-21')), '2026-06-15T00:00:00.000Z')
    })

    test('reads unambiguous slash date as DD/MM/YYYY when first part > 12', () => {
        // 15 can only be a day → 15 June 2026
        assert.strictEqual(iso(parsePeriodDate('15/06/2026')), '2026-06-15T00:00:00.000Z')
    })

    test('reads ambiguous slash date as MM/DD/YYYY when first part <= 12', () => {
        // 06/07 → June 7 (month-first) per the documented default
        assert.strictEqual(iso(parsePeriodDate('06/07/2026')), '2026-06-07T00:00:00.000Z')
    })

    test('trims surrounding whitespace', () => {
        assert.strictEqual(iso(parsePeriodDate('  2026-06-15  ')), '2026-06-15T00:00:00.000Z')
    })

    test('returns null for empty / blank / unparseable input', () => {
        assert.strictEqual(parsePeriodDate(''), null)
        assert.strictEqual(parsePeriodDate('   '), null)
        assert.strictEqual(parsePeriodDate('not a date'), null)
    })
})

describe('formatPeriodWindow', () => {
    test('same-month window collapses the trailing month', () => {
        // Mon Jul 6 → Fri Jul 10 (period_end is 23:59 UTC)
        assert.strictEqual(
            formatPeriodWindow('2026-07-06T00:00:00Z', '2026-07-10T23:59:00Z'),
            'Jul 6 – 10',
        )
    })

    test('cross-month window keeps both months', () => {
        assert.strictEqual(
            formatPeriodWindow('2026-06-29T00:00:00Z', '2026-07-03T23:59:00Z'),
            'Jun 29 – Jul 3',
        )
    })

    test('returns empty string for an unparseable bound', () => {
        assert.strictEqual(formatPeriodWindow('nope', '2026-07-10T23:59:00Z'), '')
    })
})
