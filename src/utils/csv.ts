/**
 * Minimal CSV parser — handles quoted fields, escaped quotes ("" inside quoted field),
 * CRLF and LF line endings. Intended for manager-uploaded performance spreadsheets,
 * not for arbitrary user-supplied CSV abuse. Keep it small and predictable.
 */

export interface ParsedCSV {
    headers: string[];
    rows: string[][];
}

export function parseCSV(text: string): ParsedCSV {
    const rows: string[][] = [];
    let field = '';
    let row: string[] = [];
    let inQuotes = false;

    const pushField = () => { row.push(field); field = ''; };
    const pushRow = () => { rows.push(row); row = []; };

    for (let i = 0; i < text.length; i++) {
        const c = text[i];

        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') { field += '"'; i++; }
                else { inQuotes = false; }
            } else {
                field += c;
            }
            continue;
        }

        if (c === '"') { inQuotes = true; continue; }
        if (c === ',') { pushField(); continue; }
        if (c === '\r') { continue; }
        if (c === '\n') { pushField(); pushRow(); continue; }
        field += c;
    }

    // Flush trailing field/row if file doesn't end in newline
    if (field.length > 0 || row.length > 0) {
        pushField();
        pushRow();
    }

    // Drop fully-empty rows (trailing blank lines, stray separators)
    const cleaned = rows.filter(r => r.some(f => f.trim().length > 0));
    if (cleaned.length === 0) return { headers: [], rows: [] };

    const headers = cleaned[0].map(h => h.trim());
    const dataRows = cleaned.slice(1);
    return { headers, rows: dataRows };
}
