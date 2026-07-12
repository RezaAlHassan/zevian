-- ============================================================================
-- Performance indexes for core manager pages
-- People · People Detail · Reports · Projects · KPIs (+ Dashboard)
-- ============================================================================
--
-- HOW TO RUN
--   1. Run on the DEV Supabase project first, verify pages load, then PROD.
--   2. Paste into the Supabase SQL Editor and run the whole file. All statements
--      are idempotent (IF NOT EXISTS) so re-running is safe.
--   3. Tables are small today, so a plain CREATE INDEX finishes in milliseconds.
--      If any table has grown large (100k+ rows) and this is PROD, run that one
--      statement separately using the CONCURRENTLY form noted above it, because
--      a plain CREATE INDEX briefly blocks writes to that table while it builds.
--      CONCURRENTLY cannot run inside a transaction block — if the SQL Editor
--      wraps the script in a transaction, run those lines one at a time.
--
-- WHAT THIS DOES NOT FIX
--   Indexes reduce steady-state query latency (the uniform ">2s to load").
--   They do NOT fix the "first load is empty until I refresh" symptom — that is
--   an app/auth-cookie issue fixed in application code, not the database.
--
-- Every index below targets a filter/join/sort column that these pages actually
-- use. Columns already indexed in the base schema (reports.employee_id,
-- reports.submission_date, employees.manager_id, goal_assignees.assignee_id,
-- reporting_periods.employee_id/period_end, etc.) are intentionally not repeated;
-- the composites below extend those where a query filters and sorts together.
-- ============================================================================


-- ── employees.organization_id ──────────────────────────────────────────────
-- The single highest-impact index here. Every manager view fetches "all
-- employees in my org" (dashboard org + direct views, People page), and the
-- manager reports/dashboard queries join reports -> employees and filter on
-- employees.organization_id. There is currently NO index on this column, so
-- each of those is a sequential scan of the employees table.
-- Pages: Dashboard, People, People Detail, Reports.
-- CONCURRENTLY form (large prod table):
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_organization_id ON employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_organization_id
  ON employees(organization_id);


-- ── projects.organization_id ───────────────────────────────────────────────
-- The dashboard filters projects by organization_id directly, and the Projects
-- and KPIs pages read projects under an org-scoped RLS policy. Only created_by
-- and category are indexed today, not organization_id.
-- Pages: Projects, KPIs, Dashboard.
-- CONCURRENTLY form:
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id
  ON projects(organization_id);


-- ── goals.created_by ───────────────────────────────────────────────────────
-- The manager "Direct Reports" dashboard/KPIs view selects goals with
-- `created_by = <managerId> OR project_id IN (...)`. goals is indexed on
-- project_id, manager_id, deadline and status, but not created_by, so the
-- created_by half of that OR falls back to a scan.
-- Pages: Dashboard (direct view), KPIs.
-- CONCURRENTLY form:
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_goals_created_by ON goals(created_by);
CREATE INDEX IF NOT EXISTS idx_goals_created_by
  ON goals(created_by);


-- ── reports (employee_id, submission_date DESC) ────────────────────────────
-- People Detail, the employee dashboard data, and the Reports page all fetch a
-- given employee's (or set of employees') reports ordered newest-first:
--   WHERE employee_id [= | IN] (...) ORDER BY submission_date DESC
-- The two existing single-column indexes (employee_id, submission_date) can't
-- serve the filter and the sort with one scan. This composite does both, which
-- matters most on the report-heavy People Detail and Reports pages.
-- Pages: People Detail, Reports, Dashboard.
-- CONCURRENTLY form:
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_employee_id_submission_date ON reports(employee_id, submission_date DESC);
CREATE INDEX IF NOT EXISTS idx_reports_employee_id_submission_date
  ON reports(employee_id, submission_date DESC);


-- ── reports (goal_id, submission_date DESC) ────────────────────────────────
-- KPI scoring and goal detail aggregate a goal's reports newest-first
-- (WHERE goal_id IN (...) ORDER BY submission_date DESC). Complements the
-- existing goal_id index by folding in the ordering.
-- Pages: KPIs, Dashboard (goal alignment).
-- CONCURRENTLY form:
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_goal_id_submission_date ON reports(goal_id, submission_date DESC);
CREATE INDEX IF NOT EXISTS idx_reports_goal_id_submission_date
  ON reports(goal_id, submission_date DESC);


-- ── reporting_periods (employee_id, period_end) ────────────────────────────
-- The dashboard, Reports and People Detail pages all read reporting periods as
--   WHERE employee_id IN (...) AND period_end >= <cutoff>
-- Today employee_id and period_end are separately indexed; this composite serves
-- the combined filter in one scan and covers the common "recent periods for these
-- employees" access pattern.
-- Pages: Dashboard, Reports, People Detail.
-- CONCURRENTLY form:
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rp_employee_id_period_end ON reporting_periods(employee_id, period_end);
CREATE INDEX IF NOT EXISTS idx_rp_employee_id_period_end
  ON reporting_periods(employee_id, period_end);


-- ── Refresh planner statistics ─────────────────────────────────────────────
-- So Postgres immediately considers the new indexes instead of waiting for the
-- next autovacuum/analyze cycle.
ANALYZE employees;
ANALYZE projects;
ANALYZE goals;
ANALYZE reports;
ANALYZE reporting_periods;
