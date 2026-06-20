#!/usr/bin/env node
/**
 * Purge runaway reporting_periods rows.
 *
 * Context: a bug in the period generator (now fixed) could fan out hundreds of
 * thousands of duplicate `pending` periods for a single employee, which made the
 * dashboard slow. This script cleans the junk rows while PRESERVING real history
 * (`submitted` periods, which carry a report_id).
 *
 * SAFETY:
 *   - Dry-run by default. It only deletes when you pass --execute.
 *   - Only touches employees whose period count exceeds --threshold (default 1000).
 *   - Only deletes rows with report_id IS NULL (pending / missed / excused / void).
 *     `submitted` periods and anything linked to a report are never touched.
 *   - After cleanup, the (fixed) app regenerates a clean 26-period chain on next load.
 *
 * USAGE (PowerShell):
 *   $env:SUPABASE_URL="https://<prod-ref>.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="<prod service role key>"
 *   node scripts/purge-runaway-periods.mjs              # dry run, shows what it would do
 *   node scripts/purge-runaway-periods.mjs --execute    # actually delete
 *
 * Get the prod URL + service-role key from the Netlify dashboard env vars.
 * NEVER commit those values.
 */

const BASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EXECUTE = process.argv.includes('--execute');
const threshArg = process.argv.find((a) => a.startsWith('--threshold='));
const THRESHOLD = threshArg ? parseInt(threshArg.split('=')[1], 10) : 1000;

if (!BASE_URL || !KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const Hcount = { ...H, Prefer: 'count=exact' };
const Hdel = { ...H, Prefer: 'return=minimal' };

const total = (cr) => parseInt((cr || '/0').split('/')[1] || '0', 10);

async function count(path) {
  const r = await fetch(`${BASE_URL}/rest/v1/${path}`, { headers: Hcount });
  return total(r.headers.get('content-range'));
}
async function getJson(path) {
  const r = await fetch(`${BASE_URL}/rest/v1/${path}`, { headers: H });
  return r.json();
}
async function del(path) {
  const r = await fetch(`${BASE_URL}/rest/v1/${path}`, { method: 'DELETE', headers: Hdel });
  if (!r.ok && r.status !== 204) throw new Error(`DELETE ${path} -> ${r.status}`);
}

async function main() {
  console.log(`Mode: ${EXECUTE ? 'EXECUTE (will delete)' : 'DRY RUN'}  | threshold: >${THRESHOLD} periods`);
  console.log(`Target: ${new URL(BASE_URL).host}\n`);

  const employees = await getJson('employees?select=id,name');
  console.log(`Scanning ${employees.length} employees...`);

  const bloated = [];
  for (const e of employees) {
    const n = await count(`reporting_periods?select=id&employee_id=eq.${e.id}`);
    if (n > THRESHOLD) bloated.push({ ...e, n });
  }

  if (bloated.length === 0) {
    console.log('No bloated employees found. Nothing to do.');
    return;
  }

  let grandTotalDeletable = 0;
  for (const e of bloated) {
    const submitted = await count(`reporting_periods?select=id&employee_id=eq.${e.id}&status=eq.submitted`);
    const deletable = await count(
      `reporting_periods?select=id&employee_id=eq.${e.id}&status=in.(pending,missed,excused,void)&report_id=is.null`
    );
    // safety: any non-submitted row that DOES have a report_id should never be deleted
    const linked = await count(
      `reporting_periods?select=id&employee_id=eq.${e.id}&status=in.(pending,missed,excused,void)&report_id=not.is.null`
    );
    grandTotalDeletable += deletable;
    console.log(
      `\n${e.name} (${e.id})\n  total=${e.n}  submitted(keep)=${submitted}  deletable=${deletable}  report-linked(keep)=${linked}`
    );

    if (!EXECUTE) continue;

    let pass = 0;
    while (true) {
      const remaining = await count(
        `reporting_periods?select=id&employee_id=eq.${e.id}&status=in.(pending,missed,excused,void)&report_id=is.null`
      );
      if (remaining === 0) break;
      await del(`reporting_periods?employee_id=eq.${e.id}&status=in.(pending,missed,excused,void)&report_id=is.null`);
      if (++pass > 100) {
        console.log(`  safety stop after 100 passes, remaining=${remaining}`);
        break;
      }
    }
    const after = await count(`reporting_periods?select=id&employee_id=eq.${e.id}`);
    console.log(`  -> done. total now=${after}`);
  }

  console.log(
    `\n${EXECUTE ? 'Deleted' : 'Would delete'} ${grandTotalDeletable} rows across ${bloated.length} employee(s).`
  );
  if (!EXECUTE) console.log('Re-run with --execute to apply.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
