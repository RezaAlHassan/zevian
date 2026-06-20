#!/usr/bin/env node
/**
 * De-duplicate reporting_periods.
 *
 * A now-fixed generation bug could create multiple rows for the SAME
 * (employee, goal, period_start) slot. This collapses each such slot down to a
 * single row, which corrects inflated "expected" submission counts.
 *
 * SAFETY:
 *   - Dry-run by default; only deletes with --execute.
 *   - Groups strictly by employee_id + goal_id + exact period_start (ms). Distinct
 *     periods are never touched — only literal duplicates of the same slot.
 *   - NEVER deletes a row with report_id set (real submissions are always kept; if a
 *     slot has several report-linked rows, all of them are kept).
 *   - For a duplicated slot with no report-linked row, keeps exactly one (prefers a
 *     non-pending status), deletes the rest. Every slot always retains >=1 row.
 *
 * USAGE (PowerShell):
 *   $env:SUPABASE_URL="https://<ref>.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="<service role key>"
 *   node scripts/dedup-periods.mjs            # dry run
 *   node scripts/dedup-periods.mjs --execute  # apply
 */

const BASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EXECUTE = process.argv.includes('--execute');

if (!BASE_URL || !KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function fetchAllPeriods() {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const r = await fetch(
      `${BASE_URL}/rest/v1/reporting_periods?select=id,employee_id,goal_id,period_start,status,report_id`,
      { headers: { ...H, Range: `${from}-${from + pageSize - 1}`, Prefer: 'count=exact' } }
    );
    const batch = await r.json();
    rows.push(...batch);
    const total = parseInt((r.headers.get('content-range') || '/0').split('/')[1] || '0', 10);
    if (rows.length >= total || batch.length === 0) break;
  }
  return rows;
}

// status preference for choosing a keeper when no report-linked row exists
const statusRank = (s) => ({ submitted: 0, missed: 1, excused: 2, void: 3, pending: 4 }[s] ?? 5);

async function deleteByIds(ids) {
  const chunk = 100;
  for (let i = 0; i < ids.length; i += chunk) {
    const slice = ids.slice(i, i + chunk);
    const inList = slice.map((x) => `"${x}"`).join(',');
    const r = await fetch(`${BASE_URL}/rest/v1/reporting_periods?id=in.(${inList})`, {
      method: 'DELETE',
      headers: { ...H, Prefer: 'return=minimal' },
    });
    if (!r.ok && r.status !== 204) throw new Error(`DELETE failed -> ${r.status}`);
  }
}

async function main() {
  console.log(`Mode: ${EXECUTE ? 'EXECUTE (will delete)' : 'DRY RUN'}`);
  console.log(`Target: ${new URL(BASE_URL).host}\n`);

  const periods = await fetchAllPeriods();
  console.log(`Fetched ${periods.length} reporting_periods.`);

  const groups = new Map();
  for (const p of periods) {
    const key = `${p.employee_id}|${p.goal_id}|${new Date(p.period_start).getTime()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }

  const toDelete = [];
  let dupSlots = 0;
  for (const [, rows] of groups) {
    if (rows.length <= 1) continue;
    dupSlots++;
    const linked = rows.filter((r) => r.report_id != null);
    if (linked.length > 0) {
      // keep all report-linked rows, delete the unlinked duplicates
      toDelete.push(...rows.filter((r) => r.report_id == null).map((r) => r.id));
    } else {
      // keep one (best status), delete the rest
      const sorted = [...rows].sort((a, b) => statusRank(a.status) - statusRank(b.status));
      toDelete.push(...sorted.slice(1).map((r) => r.id));
    }
  }

  // per-employee summary of what will be removed
  const delSet = new Set(toDelete);
  const byEmp = {};
  for (const p of periods) {
    if (!delSet.has(p.id)) continue;
    byEmp[p.employee_id] = (byEmp[p.employee_id] || 0) + 1;
  }
  console.log(`Duplicate slots: ${dupSlots}`);
  console.log(`Rows to delete: ${toDelete.length}\n`);
  for (const [emp, n] of Object.entries(byEmp)) console.log(`  ${emp}: -${n}`);

  if (!EXECUTE) {
    console.log('\nDry run only. Re-run with --execute to apply.');
    return;
  }
  if (toDelete.length === 0) {
    console.log('Nothing to delete.');
    return;
  }
  await deleteByIds(toDelete);
  const after = await fetchAllPeriods();
  console.log(`\nDone. reporting_periods: ${periods.length} -> ${after.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
