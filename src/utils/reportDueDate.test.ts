import assert from 'node:assert';
import test, { describe } from 'node:test';
import { getNextReportDueDate } from './reportDueDate.ts';

describe('getNextReportDueDate', () => {
    test('handles daily frequency', () => {
        const baseDate = new Date('2024-01-01T12:00:00Z');
        const nextDate = getNextReportDueDate(baseDate.toISOString(), 'daily');
        assert.strictEqual(nextDate.toISOString(), new Date('2024-01-02T12:00:00Z').toISOString());
    });

    test('handles weekly frequency', () => {
        const baseDate = new Date('2024-01-01T12:00:00Z');
        const nextDate = getNextReportDueDate(baseDate.toISOString(), 'weekly');
        assert.strictEqual(nextDate.toISOString(), new Date('2024-01-08T12:00:00Z').toISOString());
    });

    test('handles biweekly frequency', () => {
        const baseDate = new Date('2024-01-01T12:00:00Z');
        const nextDate = getNextReportDueDate(baseDate.toISOString(), 'biweekly');
        assert.strictEqual(nextDate.toISOString(), new Date('2024-01-15T12:00:00Z').toISOString());
    });

    test('handles bi-weekly frequency', () => {
        const baseDate = new Date('2024-01-01T12:00:00Z');
        const nextDate = getNextReportDueDate(baseDate.toISOString(), 'bi-weekly');
        assert.strictEqual(nextDate.toISOString(), new Date('2024-01-15T12:00:00Z').toISOString());
    });

    test('handles monthly frequency', () => {
        const baseDate = new Date('2024-01-01T12:00:00Z');
        const nextDate = getNextReportDueDate(baseDate.toISOString(), 'monthly');
        assert.strictEqual(nextDate.toISOString(), new Date('2024-02-01T12:00:00Z').toISOString());
    });

    test('handles unknown frequency by defaulting to weekly', () => {
        const baseDate = new Date('2024-01-01T12:00:00Z');
        const nextDate = getNextReportDueDate(baseDate.toISOString(), 'yearly');
        assert.strictEqual(nextDate.toISOString(), new Date('2024-01-08T12:00:00Z').toISOString());
    });

    test('handles case-insensitivity in frequency', () => {
        const baseDate = new Date('2024-01-01T12:00:00Z');
        const nextDate = getNextReportDueDate(baseDate.toISOString(), 'DaILy');
        assert.strictEqual(nextDate.toISOString(), new Date('2024-01-02T12:00:00Z').toISOString());
    });

    test('uses current date when lastReportAt is null', () => {
        const before = new Date();
        const nextDate = getNextReportDueDate(null, 'daily');
        const after = new Date();

        // nextDate should be approximately 1 day after "now"
        const expectedBefore = new Date(before);
        expectedBefore.setDate(before.getDate() + 1);

        const expectedAfter = new Date(after);
        expectedAfter.setDate(after.getDate() + 1);

        assert.ok(nextDate >= expectedBefore && nextDate <= expectedAfter);
    });

    test('uses current date when lastReportAt is undefined', () => {
        const before = new Date();
        const nextDate = getNextReportDueDate(undefined, 'daily');
        const after = new Date();

        // nextDate should be approximately 1 day after "now"
        const expectedBefore = new Date(before);
        expectedBefore.setDate(before.getDate() + 1);

        const expectedAfter = new Date(after);
        expectedAfter.setDate(after.getDate() + 1);

        assert.ok(nextDate >= expectedBefore && nextDate <= expectedAfter);
    });
});
