import test from 'node:test';
import assert from 'node:assert/strict';
import { isReportLate } from './reportDueDate.ts';

test('isReportLate', async (t) => {
    const DAY_IN_MS = 1000 * 60 * 60 * 24;

    function getPastDateStr(daysAgo: number): string {
        const d = new Date();
        d.setTime(d.getTime() - (daysAgo * DAY_IN_MS));
        return d.toISOString();
    }

    await t.test('returns true when lastReportAt is missing or null', () => {
        assert.strictEqual(isReportLate(null, 'daily'), true);
        assert.strictEqual(isReportLate(undefined, 'weekly'), true);
        assert.strictEqual(isReportLate('', 'monthly'), true);
    });

    await t.test('handles daily frequency', () => {
        assert.strictEqual(isReportLate(getPastDateStr(1), 'daily'), false, '1 day is not late');
        assert.strictEqual(isReportLate(getPastDateStr(1.4), 'daily'), false, '1.4 days is within 1.5 buffer');
        assert.strictEqual(isReportLate(getPastDateStr(1.6), 'daily'), true, '1.6 days is late');
    });

    await t.test('handles weekly frequency', () => {
        assert.strictEqual(isReportLate(getPastDateStr(7), 'weekly'), false, '7 days is not late');
        assert.strictEqual(isReportLate(getPastDateStr(8), 'weekly'), false, '8 days is within buffer');
        assert.strictEqual(isReportLate(getPastDateStr(8.1), 'weekly'), true, '8.1 days is late');
    });

    await t.test('handles biweekly and bi-weekly frequencies', () => {
        assert.strictEqual(isReportLate(getPastDateStr(14), 'biweekly'), false, '14 days is not late');
        assert.strictEqual(isReportLate(getPastDateStr(15), 'biweekly'), false, '15 days is within buffer');
        assert.strictEqual(isReportLate(getPastDateStr(15.1), 'biweekly'), true, '15.1 days is late');

        assert.strictEqual(isReportLate(getPastDateStr(14), 'bi-weekly'), false);
        assert.strictEqual(isReportLate(getPastDateStr(15), 'bi-weekly'), false);
        assert.strictEqual(isReportLate(getPastDateStr(15.1), 'bi-weekly'), true);
    });

    await t.test('handles monthly frequency', () => {
        assert.strictEqual(isReportLate(getPastDateStr(30), 'monthly'), false, '30 days is not late');
        assert.strictEqual(isReportLate(getPastDateStr(32), 'monthly'), false, '32 days is within buffer');
        assert.strictEqual(isReportLate(getPastDateStr(32.1), 'monthly'), true, '32.1 days is late');
    });

    await t.test('defaults to weekly for unknown frequencies', () => {
        assert.strictEqual(isReportLate(getPastDateStr(7), 'yearly'), false, '7 days is not late (weekly default)');
        assert.strictEqual(isReportLate(getPastDateStr(8), 'unknown'), false, '8 days is within buffer (weekly default)');
        assert.strictEqual(isReportLate(getPastDateStr(8.1), 'random'), true, '8.1 days is late (weekly default)');
    });

    await t.test('is case insensitive', () => {
        assert.strictEqual(isReportLate(getPastDateStr(1.4), 'DAILY'), false);
        assert.strictEqual(isReportLate(getPastDateStr(1.6), 'DaIlY'), true);
        assert.strictEqual(isReportLate(getPastDateStr(8), 'WEEKLY'), false);
        assert.strictEqual(isReportLate(getPastDateStr(8.1), 'WeEkLy'), true);
    });
});
