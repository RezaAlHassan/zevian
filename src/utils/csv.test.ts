import assert from 'node:assert'
import test, { describe } from 'node:test'
import { parseCSV } from './csv.ts'

describe('parseCSV', () => {
    test('parses a simple CSV with header and rows', () => {
        const out = parseCSV('Agent,Period,Calls\njane@acme.com,2026-06-15,120\nbob@acme.com,2026-06-15,80\n')
        assert.deepStrictEqual(out.headers, ['Agent', 'Period', 'Calls'])
        assert.strictEqual(out.rows.length, 2)
        assert.deepStrictEqual(out.rows[0], ['jane@acme.com', '2026-06-15', '120'])
        assert.deepStrictEqual(out.rows[1], ['bob@acme.com', '2026-06-15', '80'])
    })

    test('trims header whitespace but preserves cell values', () => {
        const out = parseCSV(' Agent , Period \n jane@acme.com ,2026-06-15\n')
        assert.deepStrictEqual(out.headers, ['Agent', 'Period'])
        // Cells are not trimmed by the parser (callers trim where needed).
        assert.deepStrictEqual(out.rows[0], [' jane@acme.com ', '2026-06-15'])
    })

    test('handles quoted fields containing commas', () => {
        const out = parseCSV('Name,Score\n"Doe, John",22\n')
        assert.deepStrictEqual(out.rows[0], ['Doe, John', '22'])
    })

    test('handles quoted numbers with thousands separators', () => {
        const out = parseCSV('Name,Calls\njane,"1,340"\n')
        assert.deepStrictEqual(out.rows[0], ['jane', '1,340'])
    })

    test('handles escaped double quotes inside a quoted field', () => {
        const out = parseCSV('Name,Note\njane,"She said ""hi"" today"\n')
        assert.deepStrictEqual(out.rows[0], ['jane', 'She said "hi" today'])
    })

    test('handles CRLF line endings', () => {
        const out = parseCSV('A,B\r\n1,2\r\n3,4\r\n')
        assert.strictEqual(out.rows.length, 2)
        assert.deepStrictEqual(out.rows[0], ['1', '2'])
        assert.deepStrictEqual(out.rows[1], ['3', '4'])
    })

    test('flushes a trailing row with no final newline', () => {
        const out = parseCSV('A,B\n1,2')
        assert.strictEqual(out.rows.length, 1)
        assert.deepStrictEqual(out.rows[0], ['1', '2'])
    })

    test('preserves empty cells but keeps the row', () => {
        const out = parseCSV('Agent,Period,Calls\n,2026-06-15,\n')
        assert.deepStrictEqual(out.rows[0], ['', '2026-06-15', ''])
    })

    test('drops fully-blank rows (trailing blank lines / stray separators)', () => {
        const out = parseCSV('A,B\n1,2\n\n \n3,4\n')
        assert.strictEqual(out.rows.length, 2)
        assert.deepStrictEqual(out.rows[1], ['3', '4'])
    })

    test('returns empty result for whitespace-only input', () => {
        const out = parseCSV('\n \n')
        assert.deepStrictEqual(out.headers, [])
        assert.deepStrictEqual(out.rows, [])
    })

    test('handles a commit-style quoted field spanning a newline', () => {
        const out = parseCSV('Name,Note\njane,"line one\nline two"\n')
        assert.strictEqual(out.rows.length, 1)
        assert.deepStrictEqual(out.rows[0], ['jane', 'line one\nline two'])
    })
})
