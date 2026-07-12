-- ============================================================================
-- ZEVIAN — PORTFOLIO SHOWCASE SEED
-- ============================================================================
-- A complete, realistic organisation ("Meridian") for demoing the app.
--   • 30 employees + 5 department managers, all with photo avatars
--   • 5 projects (varied statuses) + goals (active & completed) + 6 shared criteria
--   • 8 weeks of weekly reports (2026-05-15 → 2026-07-03) trending POSITIVE overall
--   • Every scenario the UI can render: reviewed / scored-pending / late-backdated /
--     missed / excused / on-leave, manager overrides (agree / up / down),
--     consistency flags (escalating / stagnant / stable), leaves, invitations
--     (pending / accepted / expired), notifications, custom metrics, knowledge pins
--
-- SAFE & RE-RUNNABLE: wrapped in a transaction, prefixed IDs, idempotent cleanup.
-- Nothing outside the 'showcase' namespace is touched — EXCEPT the final step, which
-- re-points the existing login  reza@zevian.co  into this org as the account owner
-- so it is visible immediately on sign-in (RLS scopes everything to your org).
--
-- Run in the Supabase SQL editor (DEV project) or: psql "$DEV_DB_URL" -f showcase-seed.sql
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 0. CLEANUP  (delete prior showcase data so this file is safely re-runnable)
--    Ordered children-first. Never deletes reza's row or the org row itself.
-- ────────────────────────────────────────────────────────────────────────────
DELETE FROM report_criterion_scores WHERE report_id LIKE 'rep-emp-showcase-%';
DELETE FROM reporting_periods       WHERE goal_id  LIKE 'goal-showcase-%';
DELETE FROM reports                 WHERE goal_id  LIKE 'goal-showcase-%';
DELETE FROM goal_frequency_anchors  WHERE goal_id  LIKE 'goal-showcase-%';
DELETE FROM goal_assignees          WHERE goal_id  LIKE 'goal-showcase-%';
DELETE FROM criteria                WHERE goal_id  LIKE 'goal-showcase-%';
DELETE FROM knowledge_pins          WHERE project_id LIKE 'proj-showcase-%';
DELETE FROM project_documents       WHERE project_id LIKE 'proj-showcase-%';
DELETE FROM project_assignees       WHERE project_id LIKE 'proj-showcase-%';
DELETE FROM goals                   WHERE id LIKE 'goal-showcase-%';
DELETE FROM projects                WHERE id LIKE 'proj-showcase-%';
DELETE FROM leaves                  WHERE id LIKE 'leave-showcase-%';
DELETE FROM invitations             WHERE id LIKE 'inv-showcase-%';
DELETE FROM notifications           WHERE link_url LIKE '%seed=showcase%';
DELETE FROM notifications           WHERE user_id LIKE 'emp-showcase-%' OR user_id LIKE 'mgr-showcase-%';
DELETE FROM manager_settings        WHERE manager_id LIKE 'mgr-showcase-%';
DELETE FROM employee_permissions    WHERE employee_id LIKE 'emp-showcase-%' OR employee_id LIKE 'mgr-showcase-%';
DELETE FROM organization_custom_metrics WHERE id LIKE 'ocm-showcase-%';
-- Employees last (cascades any stray notifications / assignees). reza is a different id → untouched.
DELETE FROM employees               WHERE id LIKE 'emp-showcase-%' OR id LIKE 'mgr-showcase-%';

-- ────────────────────────────────────────────────────────────────────────────
-- 1. ORGANISATION
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO organizations (id, name, plan_tier, selected_metrics, goal_weight, working_days, created_at)
VALUES ('org-showcase', 'Meridian', 'business',
        ARRAY['ocm-showcase-1','ocm-showcase-2'], 70, ARRAY[1,2,3,4,5], '2024-01-08 09:00:00+00')
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      plan_tier = EXCLUDED.plan_tier,
      selected_metrics = EXCLUDED.selected_metrics;

INSERT INTO organization_custom_metrics (id, organization_id, name, description, is_active) VALUES
  ('ocm-showcase-1', 'org-showcase', 'Customer Sentiment', 'Qualitative read on how customers feel about the work delivered this period.', TRUE),
  ('ocm-showcase-2', 'org-showcase', 'Innovation',         'Evidence of new ideas, experiments, or process improvements introduced.',      TRUE);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. DEPARTMENT MANAGERS  (role='manager' → excluded from the Employees roster)
--    manager_id set to reza at the very end.
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO employees (id, organization_id, name, email, title, dept, avatar_url, role, is_account_owner, onboarding_completed, is_active, join_date) VALUES
 ('mgr-showcase-sales','org-showcase','Daniel Cole',   'daniel.cole@meridian.example',   'VP, Sales',                'Sales',            'https://i.pravatar.cc/150?img=62', 'manager', FALSE, TRUE, TRUE, '2024-01-15'),
 ('mgr-showcase-eng',  'org-showcase','Priya Nair',     'priya.nair@meridian.example',    'Engineering Manager',      'Engineering',      'https://i.pravatar.cc/150?img=45', 'manager', FALSE, TRUE, TRUE, '2024-02-01'),
 ('mgr-showcase-cs',   'org-showcase','Marcus Bennett',  'marcus.bennett@meridian.example','Head of Customer Success','Customer Success', 'https://i.pravatar.cc/150?img=64', 'manager', FALSE, TRUE, TRUE, '2024-02-19'),
 ('mgr-showcase-mkt',  'org-showcase','Elena Rossi',    'elena.rossi@meridian.example',   'Marketing Director',       'Marketing',        'https://i.pravatar.cc/150?img=65', 'manager', FALSE, TRUE, TRUE, '2024-03-04'),
 ('mgr-showcase-prod', 'org-showcase','James Okafor',   'james.okafor@meridian.example',  'Head of Product',          'Product',          'https://i.pravatar.cc/150?img=66', 'manager', FALSE, TRUE, TRUE, '2024-03-18');

-- Full manager permissions
INSERT INTO employee_permissions (employee_id, can_set_global_frequency, can_view_organization_wide, can_manage_settings, can_create_projects, can_create_goals, can_override_ai_scores, can_invite_users)
SELECT id, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE FROM employees WHERE id LIKE 'mgr-showcase-%';

-- Manager settings (weekly cadence)
INSERT INTO manager_settings (manager_id, global_frequency, report_frequency, allow_late_submissions, backdate_limit_days, grace_period_days)
SELECT id, TRUE, 'weekly', TRUE, 7, 1 FROM employees WHERE id LIKE 'mgr-showcase-%';

-- ────────────────────────────────────────────────────────────────────────────
-- 3. EMPLOYEES  (30, role='employee')
--    Suffix ranges define department: 01-07 Sales · 08-14 Eng · 15-20 CS · 21-25 Mkt · 26-30 Product
--    Featured scenario employees are flagged in comments.
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO employees (id, organization_id, manager_id, name, email, title, dept, avatar_url, role, onboarding_completed, is_active, join_date) VALUES
 -- Sales
 ('emp-showcase-01','org-showcase','mgr-showcase-sales','Ava Thompson',    'ava.thompson@meridian.example',    'Senior Account Executive','Sales','https://i.pravatar.cc/150?img=5',  'employee', TRUE, TRUE, '2024-04-02'), -- HERO: star performer
 ('emp-showcase-02','org-showcase','mgr-showcase-sales','Ethan Brooks',    'ethan.brooks@meridian.example',    'Account Executive',       'Sales','https://i.pravatar.cc/150?img=12', 'employee', TRUE, TRUE, '2024-06-11'), -- HERO: chronic late / backdated
 ('emp-showcase-03','org-showcase','mgr-showcase-sales','Grace Miller',    'grace.miller@meridian.example',    'Sales Development Rep',    'Sales','https://i.pravatar.cc/150?img=9',  'employee', TRUE, TRUE, '2024-09-03'),
 ('emp-showcase-04','org-showcase','mgr-showcase-sales','Ryan Cooper',     'ryan.cooper@meridian.example',     'Account Executive',       'Sales','https://i.pravatar.cc/150?img=13', 'employee', TRUE, TRUE, '2025-01-20'),
 ('emp-showcase-05','org-showcase','mgr-showcase-sales','Chloe Bennett',   'chloe.bennett@meridian.example',   'Sales Development Rep',    'Sales','https://i.pravatar.cc/150?img=16', 'employee', TRUE, TRUE, '2025-03-10'),
 ('emp-showcase-06','org-showcase','mgr-showcase-sales','Nathan Hughes',   'nathan.hughes@meridian.example',   'Account Executive',       'Sales','https://i.pravatar.cc/150?img=15', 'employee', TRUE, TRUE, '2024-11-05'),
 ('emp-showcase-07','org-showcase','mgr-showcase-sales','Zoe Richardson',  'zoe.richardson@meridian.example',  'Sales Development Rep',    'Sales','https://i.pravatar.cc/150?img=20', 'employee', TRUE, TRUE, '2025-05-19'),
 -- Engineering
 ('emp-showcase-08','org-showcase','mgr-showcase-eng','Liam Chen',        'liam.chen@meridian.example',       'Software Engineer',       'Engineering','https://i.pravatar.cc/150?img=33', 'employee', TRUE, TRUE, '2024-07-08'), -- HERO: big improver
 ('emp-showcase-09','org-showcase','mgr-showcase-eng','Olivia Garcia',    'olivia.garcia@meridian.example',   'Senior Software Engineer','Engineering','https://i.pravatar.cc/150?img=32', 'employee', TRUE, TRUE, '2024-05-13'), -- HERO: strong but awaiting review
 ('emp-showcase-10','org-showcase','mgr-showcase-eng','Aiden Wright',     'aiden.wright@meridian.example',    'Software Engineer',       'Engineering','https://i.pravatar.cc/150?img=51', 'employee', TRUE, TRUE, '2024-10-14'),
 ('emp-showcase-11','org-showcase','mgr-showcase-eng','Isla Turner',      'isla.turner@meridian.example',     'Software Engineer',       'Engineering','https://i.pravatar.cc/150?img=44', 'employee', TRUE, TRUE, '2025-02-24'),
 ('emp-showcase-12','org-showcase','mgr-showcase-eng','Caleb Morgan',     'caleb.morgan@meridian.example',    'Senior Software Engineer','Engineering','https://i.pravatar.cc/150?img=52', 'employee', TRUE, TRUE, '2024-08-19'),
 ('emp-showcase-13','org-showcase','mgr-showcase-eng','Hannah Foster',    'hannah.foster@meridian.example',   'Software Engineer',       'Engineering','https://i.pravatar.cc/150?img=25', 'employee', TRUE, FALSE,'2024-06-24'), -- offboarded (is_active=false)
 ('emp-showcase-14','org-showcase','mgr-showcase-eng','Dylan Reed',       'dylan.reed@meridian.example',      'Platform Engineer',       'Engineering','https://i.pravatar.cc/150?img=53', 'employee', TRUE, TRUE, '2025-04-07'),
 -- Customer Success
 ('emp-showcase-15','org-showcase','mgr-showcase-cs','Noah Patel',        'noah.patel@meridian.example',      'Senior CSM',              'Customer Success','https://i.pravatar.cc/150?img=59', 'employee', TRUE, TRUE, '2024-05-27'), -- HERO: declining / at-risk
 ('emp-showcase-16','org-showcase','mgr-showcase-cs','Lucas Wright',      'lucas.wright@meridian.example',    'Customer Success Manager','Customer Success','https://i.pravatar.cc/150?img=57', 'employee', TRUE, TRUE, '2024-12-02'), -- HERO: missed periods / struggling
 ('emp-showcase-17','org-showcase','mgr-showcase-cs','Emily Carter',      'emily.carter@meridian.example',    'Customer Success Manager','Customer Success','https://i.pravatar.cc/150?img=47', 'employee', TRUE, TRUE, '2024-09-16'),
 ('emp-showcase-18','org-showcase','mgr-showcase-cs','Sofia Nguyen',      'sofia.nguyen@meridian.example',    'Onboarding Specialist',   'Customer Success','https://i.pravatar.cc/150?img=41', 'employee', TRUE, TRUE, '2025-01-06'),
 ('emp-showcase-19','org-showcase','mgr-showcase-cs','Jack Robinson',     'jack.robinson@meridian.example',   'Customer Success Manager','Customer Success','https://i.pravatar.cc/150?img=54', 'employee', TRUE, TRUE, '2024-10-28'),
 ('emp-showcase-20','org-showcase','mgr-showcase-cs','Lily Adams',        'lily.adams@meridian.example',      'Support Engineer',        'Customer Success','https://i.pravatar.cc/150?img=48', 'employee', TRUE, TRUE, '2025-03-31'),
 -- Marketing
 ('emp-showcase-21','org-showcase','mgr-showcase-mkt','Sophia Martinez',  'sophia.martinez@meridian.example', 'Growth Marketer',         'Marketing','https://i.pravatar.cc/150?img=49', 'employee', TRUE, TRUE, '2024-08-05'), -- HERO: dip then recovery
 ('emp-showcase-22','org-showcase','mgr-showcase-mkt','Mason Clark',      'mason.clark@meridian.example',     'Content Lead',            'Marketing','https://i.pravatar.cc/150?img=60', 'employee', TRUE, TRUE, '2024-11-18'),
 ('emp-showcase-23','org-showcase','mgr-showcase-mkt','Ella Scott',       'ella.scott@meridian.example',      'Demand Gen Specialist',   'Marketing','https://i.pravatar.cc/150?img=26', 'employee', TRUE, TRUE, '2025-02-10'),
 ('emp-showcase-24','org-showcase','mgr-showcase-mkt','Owen Baker',       'owen.baker@meridian.example',      'Performance Marketer',    'Marketing','https://i.pravatar.cc/150?img=61', 'employee', TRUE, TRUE, '2024-12-16'),
 ('emp-showcase-25','org-showcase','mgr-showcase-mkt','Ruby Hall',        'ruby.hall@meridian.example',       'Brand Designer',          'Marketing','https://i.pravatar.cc/150?img=27', 'employee', TRUE, TRUE, '2025-04-21'),
 -- Product & Design
 ('emp-showcase-26','org-showcase','mgr-showcase-prod','Mia Johnson',     'mia.johnson@meridian.example',     'Product Designer',        'Product','https://i.pravatar.cc/150?img=28', 'employee', TRUE, TRUE, '2024-07-22'), -- HERO: on leave mid-quarter
 ('emp-showcase-27','org-showcase','mgr-showcase-prod','Leo Kim',         'leo.kim@meridian.example',         'Product Manager',         'Product','https://i.pravatar.cc/150?img=68', 'employee', TRUE, TRUE, '2024-10-07'),
 ('emp-showcase-28','org-showcase','mgr-showcase-prod','Nora White',      'nora.white@meridian.example',      'Product Designer',        'Product','https://i.pravatar.cc/150?img=29', 'employee', TRUE, TRUE, '2025-01-27'),
 ('emp-showcase-29','org-showcase','mgr-showcase-prod','Felix Gray',      'felix.gray@meridian.example',      'UX Researcher',           'Product','https://i.pravatar.cc/150?img=67', 'employee', TRUE, TRUE, '2024-09-30'),
 ('emp-showcase-30','org-showcase','mgr-showcase-prod','Isabelle Young',  'isabelle.young@meridian.example',  'Associate Product Manager','Product','https://i.pravatar.cc/150?img=24', 'employee', TRUE, TRUE, '2026-06-01'); -- recent joiner

-- A couple of employees get elevated permissions (creators / senior ICs)
INSERT INTO employee_permissions (employee_id, can_create_projects, can_create_goals) VALUES
  ('emp-showcase-09', TRUE, TRUE),
  ('emp-showcase-12', TRUE, TRUE),
  ('emp-showcase-27', TRUE, TRUE);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. PROJECTS  (varied statuses to exercise the status pills)
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO projects (id, organization_id, name, description, category, report_frequency, status, created_by, valid_report_days, created_at) VALUES
 ('proj-showcase-sales','org-showcase','Revenue & Pipeline',   'Net-new logo acquisition and pipeline coverage for Q2.',                 'Sales',           'weekly','active',    'mgr-showcase-sales','{1,2,3,4,5}','2026-04-14 09:00+00'),
 ('proj-showcase-eng',  'org-showcase','Platform Engineering', 'Ship the platform roadmap while holding the reliability bar.',           'Engineering',     'weekly','active',    'mgr-showcase-eng',  '{1,2,3,4,5}','2026-04-14 09:00+00'),
 ('proj-showcase-cs',   'org-showcase','Customer Success',     'Drive retention and account health across the book of business.',        'Customer Success','weekly','at-risk',   'mgr-showcase-cs',   '{1,2,3,4,5}','2026-04-14 09:00+00'),
 ('proj-showcase-mkt',  'org-showcase','Growth Marketing',     'Demand generation and pipeline contribution from marketing programs.',   'Marketing',       'weekly','review',    'mgr-showcase-mkt',  '{1,2,3,4,5}','2026-04-14 09:00+00'),
 ('proj-showcase-prod', 'org-showcase','Product & Design',     'Deliver the Q2 product roadmap with strong design and research rigor.',  'Product',         'weekly','active',    'mgr-showcase-prod', '{1,2,3,4,5}','2026-04-14 09:00+00');

INSERT INTO knowledge_pins (project_id, section, content, created_by) VALUES
  ('proj-showcase-sales','priorities','ICP this quarter: Series B–D SaaS, 200–2000 employees, with a named Head of Sales hired in the last 6 months.','mgr-showcase-sales'),
  ('proj-showcase-sales','benchmarks','A strong week is 3+ qualified meetings booked with documented next steps. Vague activity counts score below 7.','mgr-showcase-sales'),
  ('proj-showcase-cs','constraints','Escalate any account with a health-score drop of 2+ points within 24 hours. Do not soften churn-risk language in reports.','mgr-showcase-cs');

-- ────────────────────────────────────────────────────────────────────────────
-- 5. GOALS  (one active goal per project + one completed legacy goal in Eng)
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO goals (id, name, project_id, instructions, manager_id, created_by, deadline, status, created_at) VALUES
 ('goal-showcase-sales','Q2 Sales Performance',      'proj-showcase-sales','Score each weekly report on real, evidenced outcomes — qualified meetings, pipeline created, and deals advanced. Specific numbers and clear next steps score high; activity claims without outcomes score low.', 'mgr-showcase-sales','mgr-showcase-sales','2026-06-30','active','2026-04-14 09:00+00'),
 ('goal-showcase-eng','Q2 Engineering Excellence',   'proj-showcase-eng','Assess weekly delivery: shipped scope, code quality, ownership of incidents, and how clearly the work and its trade-offs were communicated. Reward evidence of impact over effort.', 'mgr-showcase-eng','mgr-showcase-eng','2026-06-30','active','2026-04-14 09:00+00'),
 ('goal-showcase-eng-legacy','Q1 Reliability Push',  'proj-showcase-eng','Completed initiative: drive P1 incident rate down and establish on-call hygiene. Historical reference for how the team scored during Q1.', 'mgr-showcase-eng','mgr-showcase-eng','2026-03-31','completed','2026-01-13 09:00+00'),
 ('goal-showcase-cs','Q2 Retention & Account Health','proj-showcase-cs','Score on evidenced account outcomes: renewals secured, health scores moved, risks surfaced early with a plan. Honest risk reporting is rewarded; downplaying churn risk is penalised.', 'mgr-showcase-cs','mgr-showcase-cs','2026-06-30','active','2026-04-14 09:00+00'),
 ('goal-showcase-mkt','Q2 Demand Generation',        'proj-showcase-mkt','Assess weekly contribution to pipeline: qualified leads, campaign performance with real numbers, and experiments run. Reward measurable results and clean analysis.', 'mgr-showcase-mkt','mgr-showcase-mkt','2026-06-30','active','2026-04-14 09:00+00'),
 ('goal-showcase-prod','Q2 Product Delivery',        'proj-showcase-prod','Score on shipped product outcomes, design/research quality, cross-functional ownership, and clarity of communication. Evidence of user impact scores highest.', 'mgr-showcase-prod','mgr-showcase-prod','2026-06-30','active','2026-04-14 09:00+00');

-- 6 SHARED UNIVERSAL CRITERIA per goal (weights sum to 100) — consistent names so the
-- skill radar, skill list, and team-criterion overlays aggregate cleanly across the org.
INSERT INTO criteria (id, goal_id, name, weight, display_order, target_description)
SELECT 'crit-' || g.id || '-1', g.id, 'Impact & Outcomes',      25, 1, 'Delivered results tied to a metric or clear outcome.'      FROM goals g WHERE g.id LIKE 'goal-showcase-%'
UNION ALL SELECT 'crit-' || g.id || '-2', g.id, 'Execution Quality',      20, 2, 'Work is correct, complete, and holds the quality bar.'     FROM goals g WHERE g.id LIKE 'goal-showcase-%'
UNION ALL SELECT 'crit-' || g.id || '-3', g.id, 'Ownership & Initiative', 20, 3, 'Takes problems end-to-end without being asked.'            FROM goals g WHERE g.id LIKE 'goal-showcase-%'
UNION ALL SELECT 'crit-' || g.id || '-4', g.id, 'Collaboration',          15, 4, 'Actively unblocks and elevates teammates.'                 FROM goals g WHERE g.id LIKE 'goal-showcase-%'
UNION ALL SELECT 'crit-' || g.id || '-5', g.id, 'Communication',          10, 5, 'Written updates are specific, concise, and honest.'        FROM goals g WHERE g.id LIKE 'goal-showcase-%'
UNION ALL SELECT 'crit-' || g.id || '-6', g.id, 'Growth & Learning',      10, 6, 'Diagnoses what is not working and tests a change.'         FROM goals g WHERE g.id LIKE 'goal-showcase-%';

-- ────────────────────────────────────────────────────────────────────────────
-- 6. ASSIGNEES  (each employee → their dept project + active goal; derived by suffix)
-- ────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE e RECORD; n INT; dept TEXT;
BEGIN
  FOR e IN SELECT id FROM employees WHERE id LIKE 'emp-showcase-%' LOOP
    n := split_part(e.id, '-', 3)::int;
    dept := CASE WHEN n <= 7 THEN 'sales' WHEN n <= 14 THEN 'eng' WHEN n <= 20 THEN 'cs'
                 WHEN n <= 25 THEN 'mkt' ELSE 'prod' END;
    INSERT INTO project_assignees (project_id, assignee_id, assignee_type)
      VALUES ('proj-showcase-' || dept, e.id, 'employee') ON CONFLICT DO NOTHING;
    INSERT INTO goal_assignees (goal_id, assignee_id, assignee_type)
      VALUES ('goal-showcase-' || dept, e.id, 'employee') ON CONFLICT DO NOTHING;
  END LOOP;
  -- Legacy completed goal: two engineers carried it
  INSERT INTO goal_assignees (goal_id, assignee_id, assignee_type) VALUES
    ('goal-showcase-eng-legacy','emp-showcase-08','employee'),
    ('goal-showcase-eng-legacy','emp-showcase-09','employee') ON CONFLICT DO NOTHING;
END $$;

-- ============================================================================
-- 7. HERO REPORTS — 8 featured employees with hand-authored 8-week arcs.
--    Weekly Fridays: W1 05-15 · W2 05-22 · W3 05-29 · W4 06-05 · W5 06-12 · W6 06-19 · W7 06-26 · W8 07-03
-- ============================================================================

-- ── HERO 1 · Ava Thompson (Sales) — STAR PERFORMER, consistently high, all reviewed ──
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, submitted_for_date, submitted_at, is_backdated, evaluation_score, evaluation_reasoning, manager_overall_score, manager_calibration, manager_override_reasoning, manager_feedback, consistency_flag, reviewed_by) VALUES
 ('rep-emp-showcase-01-w1','goal-showcase-sales','emp-showcase-01','Booked 4 qualified meetings against the new ICP (Series B–D, recent Head of Sales). Two came from a "how are you measuring rep quality today" opener that consistently lands. Advanced the Northwind deal to a mutual action plan with a signed timeline. Pipeline created this week: $128k.','2026-05-15 14:00+00','2026-05-15','2026-05-15 14:00+00',FALSE,8.4,'Strong evidenced week — qualified meetings with next steps and real pipeline created.',8.4,'agree',NULL,NULL,'STABLE','mgr-showcase-sales'),
 ('rep-emp-showcase-01-w2','goal-showcase-sales','emp-showcase-01','5 qualified meetings, 3 tied to the Head-of-Sales trigger. Closed a $42k expansion. Ran a clean discovery on the Atlas account and mapped three stakeholders. One meeting slipped to next week but has a firm hold.','2026-05-22 14:00+00','2026-05-22','2026-05-22 14:00+00',FALSE,8.6,'Consistent qualified pipeline, a closed expansion, and disciplined multi-threading.',8.6,'agree',NULL,NULL,'STABLE','mgr-showcase-sales'),
 ('rep-emp-showcase-01-w3','goal-showcase-sales','emp-showcase-01','4 meetings booked, quieter week due to a conference. Used the downtime to build a 30-account target list with named triggers. Advanced two deals to proposal. Pipeline created: $96k.','2026-05-29 14:00+00','2026-05-29','2026-05-29 14:00+00',FALSE,8.5,'Slightly lighter volume but high quality and forward-looking list building.',8.5,'agree',NULL,NULL,'STABLE','mgr-showcase-sales'),
 ('rep-emp-showcase-01-w4','goal-showcase-sales','emp-showcase-01','6 qualified meetings — best week of the quarter. Closed Northwind at $61k. The target list from last week produced 3 of the 6 meetings, so the trigger approach is repeatable. Coached Chloe on the rep-quality opener.','2026-06-05 14:00+00','2026-06-05','2026-06-05 14:00+00',FALSE,8.8,'Excellent output, a closed deal, proof the list is repeatable, plus peer coaching.',8.8,'agree',NULL,'Outstanding week — the target-list system is exactly what we want the team copying.','STABLE','mgr-showcase-sales'),
 ('rep-emp-showcase-01-w5','goal-showcase-sales','emp-showcase-01','5 meetings, $150k pipeline created. Advanced Atlas to contract review. Built a short objection-handling doc from my last 20 calls and shared it with the SDR pod.','2026-06-12 14:00+00','2026-06-12','2026-06-12 14:00+00',FALSE,9.0,'High output with strong pipeline and a reusable asset created for the team.',9.0,'agree',NULL,NULL,'STABLE','mgr-showcase-sales'),
 ('rep-emp-showcase-01-w6','goal-showcase-sales','emp-showcase-01','4 meetings and closed a $38k deal. Spent a day helping Ethan rebuild his follow-up sequence. Atlas verbal-committed for next week.','2026-06-19 14:00+00','2026-06-19','2026-06-19 14:00+00',FALSE,8.9,'Steady closing plus meaningful investment in a struggling teammate.',8.9,'agree',NULL,NULL,'STABLE','mgr-showcase-sales'),
 ('rep-emp-showcase-01-w7','goal-showcase-sales','emp-showcase-01','Closed Atlas at $88k — largest deal of the quarter. 5 new qualified meetings on top. Documented the full Atlas cycle as a playbook.','2026-06-26 14:00+00','2026-06-26','2026-06-26 14:00+00',FALSE,9.2,'Landmark close, sustained top-of-funnel, and a documented playbook.',9.4,'adjusted_up','Score raised: the Atlas playbook is now the team standard — impact beyond her own number.','Landmark week. The playbook is being adopted org-wide.','STABLE','mgr-showcase-sales'),
 ('rep-emp-showcase-01-w8','goal-showcase-sales','emp-showcase-01','Finished the quarter 118% to pipeline target. 5 meetings this week, two at proposal. Handed a warm $70k opportunity to Ryan to balance the pod''s workload.','2026-07-03 14:00+00','2026-07-03','2026-07-03 14:00+00',FALSE,9.3,'Exceeded target, sustained pace to the finish, and shared upside with the team.',9.3,'agree',NULL,'Best quarter on the team. Let''s talk about a team-lead track.','STABLE','mgr-showcase-sales');

-- ── HERO 2 · Liam Chen (Eng) — BIG IMPROVER, 5.9 → 8.6, all reviewed ──
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, submitted_for_date, submitted_at, is_backdated, evaluation_score, evaluation_reasoning, manager_overall_score, manager_calibration, manager_override_reasoning, manager_feedback, consistency_flag, reviewed_by) VALUES
 ('rep-emp-showcase-08-w1','goal-showcase-eng','emp-showcase-08','Shipped the settings page but missed two edge cases that came back as bugs. Spent a lot of time stuck and only asked for help late. Tests were thin. I know I need to break work down smaller.','2026-05-15 14:00+00','2026-05-15','2026-05-15 14:00+00',FALSE,5.9,'Shipped but with quality gaps and slow escalation. Honest self-diagnosis is a good sign.',5.9,'agree',NULL,NULL,'STABLE','mgr-showcase-eng'),
 ('rep-emp-showcase-08-w2','goal-showcase-eng','emp-showcase-08','Fixed last week''s bugs and added the missing tests. Started breaking tickets into sub-tasks before coding. Delivery still slower than I''d like but quality was cleaner — zero regressions this week.','2026-05-22 14:00+00','2026-05-22','2026-05-22 14:00+00',FALSE,6.3,'Applied last week''s lesson; quality improved even if velocity is still building.',6.6,'adjusted_up','Score raised: acting on feedback within a week is exactly the trajectory I want to reinforce.','Good response to last week. Keep the sub-task habit.','STABLE','mgr-showcase-eng'),
 ('rep-emp-showcase-08-w3','goal-showcase-eng','emp-showcase-08','Delivered the API pagination work on time with full test coverage. Reviewed two PRs and caught a race condition in one. Asked for help early on a tricky migration and it saved a day.','2026-05-29 14:00+00','2026-05-29','2026-05-29 14:00+00',FALSE,6.7,'On-time delivery, good tests, and early escalation. Review comments added team value.',6.7,'agree',NULL,NULL,'STABLE','mgr-showcase-eng'),
 ('rep-emp-showcase-08-w4','goal-showcase-eng','emp-showcase-08','Owned the notifications refactor end-to-end and shipped behind a flag. Wrote a short design note first and got buy-in, which made review fast. No regressions.','2026-06-05 14:00+00','2026-06-05','2026-06-05 14:00+00',FALSE,7.1,'Clear ownership, design-first approach, and a clean flagged rollout.',7.1,'agree',NULL,NULL,'STABLE','mgr-showcase-eng'),
 ('rep-emp-showcase-08-w5','goal-showcase-eng','emp-showcase-08','Rolled notifications to 100% with a monitored ramp. Debugged a production latency spike and traced it to an N+1 query — fixed it and added a regression test. Cut p95 by 40%.','2026-06-12 14:00+00','2026-06-12','2026-06-12 14:00+00',FALSE,7.5,'Strong incident ownership with a measured performance win and a guardrail test.',7.5,'agree',NULL,NULL,'STABLE','mgr-showcase-eng'),
 ('rep-emp-showcase-08-w6','goal-showcase-eng','emp-showcase-08','Led the search-indexing project. Broke it into four PRs, each reviewed in under a day. Pair-programmed with Aiden on the trickiest one. Shipped on schedule.','2026-06-19 14:00+00','2026-06-19','2026-06-19 14:00+00',FALSE,7.9,'Led a multi-PR effort cleanly and lifted a teammate along the way.',7.9,'agree',NULL,NULL,'STABLE','mgr-showcase-eng'),
 ('rep-emp-showcase-08-w7','goal-showcase-eng','emp-showcase-08','Search shipped; query latency down to 90ms p95 from 260ms. Wrote the runbook and demoed to the team. Picked up an on-call incident and resolved it in 20 minutes.','2026-06-26 14:00+00','2026-06-26','2026-06-26 14:00+00',FALSE,8.3,'Measurable impact, documentation, and fast, calm incident response.',8.3,'agree',NULL,NULL,'STABLE','mgr-showcase-eng'),
 ('rep-emp-showcase-08-w8','goal-showcase-eng','emp-showcase-08','Closed the quarter having shipped three major features with zero rollbacks. Proposed and prototyped a caching layer that could cut infra cost ~15%. Wrote the proposal doc for review.','2026-07-03 14:00+00','2026-07-03','2026-07-03 14:00+00',FALSE,8.6,'From shaky start to consistent high performer — now driving proactive improvements.',8.6,'agree',NULL,'Most improved on the team by a distance. The caching proposal is a green light.','STABLE','mgr-showcase-eng');

-- ── HERO 3 · Noah Patel (CS) — DECLINING / AT-RISK, consistency flags + manager override down ──
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, submitted_for_date, submitted_at, is_backdated, evaluation_score, evaluation_reasoning, manager_overall_score, manager_calibration, manager_override_reasoning, manager_feedback, consistency_flag, consistency_note, reviewed_by) VALUES
 ('rep-emp-showcase-15-w1','goal-showcase-cs','emp-showcase-15','Ran QBRs for three enterprise accounts. Secured an early renewal on Vertex ($120k) and lifted their health score from 6 to 8 with a fixed onboarding gap. Flagged one at-risk account with a concrete save plan.','2026-05-15 14:00+00','2026-05-15','2026-05-15 14:00+00',FALSE,8.1,'Strong evidenced outcomes — an early renewal, a moved health score, and honest risk-flagging.',8.1,'agree',NULL,NULL,'STABLE',NULL,'mgr-showcase-cs'),
 ('rep-emp-showcase-15-w2','goal-showcase-cs','emp-showcase-15','Renewed two accounts and ran adoption reviews. The Cascade account went quiet; I''ve emailed twice with no reply but I think it''s fine. Otherwise a solid week of check-ins.','2026-05-22 14:00+00','2026-05-22','2026-05-22 14:00+00',FALSE,7.9,'Good renewals, but the Cascade "I think it''s fine" read lacks evidence and warrants a closer look.',7.9,'agree',NULL,NULL,'STABLE',NULL,'mgr-showcase-cs'),
 ('rep-emp-showcase-15-w3','goal-showcase-cs','emp-showcase-15','Busy week of meetings across the book. Lots of good conversations. Cascade still unresponsive but their usage looks okay to me. Confident the portfolio is healthy overall.','2026-05-29 14:00+00','2026-05-29','2026-05-29 14:00+00',FALSE,7.6,'Activity is high but outcomes are getting vaguer; the Cascade risk is being narrated away.',7.6,'agree',NULL,NULL,'STABLE',NULL,'mgr-showcase-cs'),
 ('rep-emp-showcase-15-w4','goal-showcase-cs','emp-showcase-15','Strong week with the team. Handled a pricing question on Meridian-East and I''m confident it''s locked for renewal. Cascade is still dark but I''m not worried. Everything is trending well.','2026-06-05 14:00+00','2026-06-05','2026-06-05 14:00+00',FALSE,7.2,'Confidence is outrunning evidence. No documented next steps on the two named risks.',7.2,'agree',NULL,NULL,'STABLE',NULL,'mgr-showcase-cs'),
 ('rep-emp-showcase-15-w5','goal-showcase-cs','emp-showcase-15','Good momentum this week. Meetings went well and relationships are strong. Cascade opened a support ticket which I take as a positive sign of engagement. Book feels healthy.','2026-06-12 14:00+00','2026-06-12','2026-06-12 14:00+00',FALSE,6.9,'Reframing a support ticket as a "positive sign" without data. Outcomes remain unquantified.',6.9,'agree',NULL,NULL,'STABLE',NULL,'mgr-showcase-cs'),
 ('rep-emp-showcase-15-w6','goal-showcase-cs','emp-showcase-15','Excellent week overall — probably my best of the quarter. Every account is in great shape and I''m very confident about all upcoming renewals. Cascade will come around, I''m sure of it.','2026-06-19 14:00+00','2026-06-19','2026-06-19 14:00+00',FALSE,6.4,'Claims are escalating while evidence disappears. "Best week" is asserted with nothing to support it.',6.0,'adjusted_down','Score lowered: the report claims a peak week but two named accounts have open, unaddressed risk and no next steps. Confidence is not evidence.','Noah — let''s meet Monday. The Cascade situation needs a real save plan today, and I need reports grounded in data, not reassurance.','ESCALATING_CLAIMS','Positive language is intensifying ("best week", "very confident") while concrete outcomes are declining week over week.','mgr-showcase-cs'),
 ('rep-emp-showcase-15-w7','goal-showcase-cs','emp-showcase-15','Cascade gave notice of non-renewal ($95k). I was blindsided. Spent the week on damage control and building a win-back. In hindsight the warning signs were there for a while.','2026-06-26 14:00+00','2026-06-26','2026-06-26 14:00+00',FALSE,6.1,'The flagged risk materialised as churn. Credit for an honest post-mortem, but the miss was avoidable.',6.1,'agree',NULL,NULL,'ESCALATING_CLAIMS','Prior weeks'' unfounded confidence directly preceded a $95k churn that was signposted for a month.','mgr-showcase-cs'),
 ('rep-emp-showcase-15-w8','goal-showcase-cs','emp-showcase-15','Reset week. Built a health-score dashboard so no account goes dark unnoticed again. Re-baselined every at-risk account with documented next steps. Two saves in progress with real plans.','2026-07-03 14:00+00','2026-07-03','2026-07-03 14:00+00',FALSE,5.8,'Right corrective actions and finally evidence-based, but the quarter''s damage is done. Rebuilding trust.',5.8,'agree',NULL,'Good reset. This is the reporting I needed all along. Let''s rebuild from here — I''m in your corner.','STABLE',NULL,'mgr-showcase-cs');

-- ── HERO 4 · Mia Johnson (Product) — ON LEAVE weeks 5–6 (excused), reports W1-4 + W7-8 ──
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, submitted_for_date, submitted_at, is_backdated, evaluation_score, evaluation_reasoning, manager_overall_score, manager_calibration, manager_override_reasoning, manager_feedback, consistency_flag, reviewed_by) VALUES
 ('rep-emp-showcase-26-w1','goal-showcase-prod','emp-showcase-26','Shipped the redesigned onboarding flow to 50% of new users. Early data shows activation up 6 points. Ran two usability sessions and folded the findings into v2.','2026-05-15 14:00+00','2026-05-15','2026-05-15 14:00+00',FALSE,7.6,'Shipped with a measurable activation lift and grounded the next iteration in research.',7.6,'agree',NULL,NULL,'STABLE','mgr-showcase-prod'),
 ('rep-emp-showcase-26-w2','goal-showcase-prod','emp-showcase-26','Onboarding to 100%; activation holding at +7. Delivered the settings redesign spec with prototypes and partnered with Liam on feasibility before handoff.','2026-05-22 14:00+00','2026-05-22','2026-05-22 14:00+00',FALSE,7.8,'Sustained the win and de-risked the next build with early engineering partnership.',7.8,'agree',NULL,NULL,'STABLE','mgr-showcase-prod'),
 ('rep-emp-showcase-26-w3','goal-showcase-prod','emp-showcase-26','Ran a research sprint on the reporting experience — 8 interviews, synthesised into 3 clear problems. Presented to the product team and aligned on priority.','2026-05-29 14:00+00','2026-05-29','2026-05-29 14:00+00',FALSE,7.7,'Solid research rigor with a clear, prioritised output the team could act on.',7.7,'agree',NULL,NULL,'STABLE','mgr-showcase-prod'),
 ('rep-emp-showcase-26-w4','goal-showcase-prod','emp-showcase-26','Turned the research into a design direction for reporting and pressure-tested it with two customers. Prepped full handoff docs ahead of my planned leave so nothing stalls.','2026-06-05 14:00+00','2026-06-05','2026-06-05 14:00+00',FALSE,8.0,'Strong customer-validated direction and thoughtful handoff planning before leave.',8.0,'agree',NULL,'Great work and a very clean handoff. Enjoy your time off — we''ve got it covered.','STABLE','mgr-showcase-prod'),
 -- W5 & W6: on approved leave → no reports (see excused reporting_periods + leaves row below)
 ('rep-emp-showcase-26-w7','goal-showcase-prod','emp-showcase-26','Back from leave. Caught up on the reporting build, reviewed what shipped while I was out, and unblocked two design questions same-day. Re-validated the direction still holds.','2026-06-26 14:00+00','2026-06-26','2026-06-26 14:00+00',FALSE,7.9,'Smooth re-entry — caught up fast and unblocked the team quickly.',7.9,'agree',NULL,NULL,'STABLE','mgr-showcase-prod'),
 ('rep-emp-showcase-26-w8','goal-showcase-prod','emp-showcase-26','Shipped the reporting redesign to beta. First feedback is strong — task time down ~30% in tests. Wrote the rollout plan and the research summary for the wider team.','2026-07-03 14:00+00','2026-07-03','2026-07-03 14:00+00',FALSE,8.1,'Landed the beta with a measured usability gain and a clear rollout plan.',8.1,'agree',NULL,'Barely a beat missed across the leave. Excellent quarter.','STABLE','mgr-showcase-prod');

-- ── HERO 5 · Ethan Brooks (Sales) — CHRONIC LATE / BACKDATED (submitted days after the period) ──
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, submitted_for_date, submitted_at, is_backdated, evaluation_score, evaluation_reasoning, manager_overall_score, manager_calibration, manager_feedback, consistency_flag, reviewed_by) VALUES
 ('rep-emp-showcase-02-w1','goal-showcase-sales','emp-showcase-02','Booked 2 meetings and had a decent discovery on the Orbit account. Follow-up was a bit slow on my end. Filing this a few days late — got buried in inbox.','2026-05-19 10:30+00','2026-05-15','2026-05-19 10:30+00',TRUE,6.8,'Moderate output; late submission and self-noted slow follow-up hold the score.',6.8,'agree',NULL,'STABLE','mgr-showcase-sales'),
 ('rep-emp-showcase-02-w2','goal-showcase-sales','emp-showcase-02','3 meetings this week, one strong. Advanced Orbit to a second call. Report is late again — I need a better end-of-week habit.','2026-05-26 09:15+00','2026-05-22','2026-05-26 09:15+00',TRUE,7.0,'Improving pipeline but the recurring lateness is now a pattern to fix.',7.0,'agree',NULL,'STABLE','mgr-showcase-sales'),
 ('rep-emp-showcase-02-w3','goal-showcase-sales','emp-showcase-02','Quieter week — 2 meetings. Orbit stalled on budget. Adopted Ava''s objection doc which helped one call. Still filing late.','2026-06-02 11:00+00','2026-05-29','2026-06-02 11:00+00',TRUE,6.9,'Flat output; a good habit borrowed from a peer, but timeliness unchanged.',6.9,'agree',NULL,'STABLE','mgr-showcase-sales'),
 ('rep-emp-showcase-02-w4','goal-showcase-sales','emp-showcase-02','3 meetings and reopened Orbit with a smaller-scope proposal. Set a Friday reminder to submit on time — this one is only one day late.','2026-06-06 16:00+00','2026-06-05','2026-06-06 16:00+00',TRUE,7.2,'Creative deal recovery and the lateness is shrinking — trending the right way.',7.2,'agree',NULL,'STABLE','mgr-showcase-sales'),
 ('rep-emp-showcase-02-w5','goal-showcase-sales','emp-showcase-02','Ava spent time helping me rebuild my follow-up sequence. Immediately booked 3 meetings off it. Orbit moving again. Late by two days — travel week.','2026-06-16 09:00+00','2026-06-12','2026-06-16 09:00+00',TRUE,7.1,'Good uptake of peer coaching with quick results; timeliness slipped again on travel.',7.1,'agree',NULL,'STABLE','mgr-showcase-sales'),
 ('rep-emp-showcase-02-w6','goal-showcase-sales','emp-showcase-02','4 meetings — best week yet. New sequence is paying off. Closed a small $18k deal. Still a day late but consistently closer.','2026-06-22 10:00+00','2026-06-19','2026-06-22 10:00+00',TRUE,7.4,'Clear improvement in output and a first close; timeliness steadily converging.',7.4,'agree',NULL,'STABLE','mgr-showcase-sales'),
 ('rep-emp-showcase-02-w7','goal-showcase-sales','emp-showcase-02','3 meetings, advanced two to proposal. Orbit finally at contract. Filing a day late again but the pipeline is real now.','2026-06-29 09:30+00','2026-06-26','2026-06-29 09:30+00',TRUE,7.3,'Consistent pipeline progression; the coaching clearly took hold.',7.3,'agree',NULL,'STABLE','mgr-showcase-sales'),
 ('rep-emp-showcase-02-w8','goal-showcase-sales','emp-showcase-02','Closed Orbit at $34k to end the quarter. 3 more meetings booked. Genuinely turned my quarter around in the back half — thanks to Ava''s help.','2026-07-05 12:00+00','2026-07-03','2026-07-05 12:00+00',TRUE,7.6,'Strong finish and a closed deal; the second-half turnaround is real. Fix the timeliness and this is an 8.',7.6,'agree','Big second-half turnaround, Ethan. Now let''s nail on-time reporting to match.','STABLE','mgr-showcase-sales');

-- ── HERO 6 · Olivia Garcia (Eng) — STRONG but latest 2 weeks AWAITING MANAGER REVIEW (reviewed_by NULL) ──
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, submitted_for_date, submitted_at, is_backdated, evaluation_score, evaluation_reasoning, manager_overall_score, manager_calibration, consistency_flag, reviewed_by) VALUES
 ('rep-emp-showcase-09-w1','goal-showcase-eng','emp-showcase-09','Led the auth refactor design review and shipped phase one behind a flag. Mentored Isla through her first production deploy. Zero incidents.','2026-05-15 14:00+00','2026-05-15','2026-05-15 14:00+00',FALSE,7.4,'Strong technical leadership and mentorship with a clean rollout.',7.4,'agree','STABLE','mgr-showcase-eng'),
 ('rep-emp-showcase-09-w2','goal-showcase-eng','emp-showcase-09','Phase two of auth to 100%. Cut token-refresh errors to near zero. Wrote the ADR so the decisions are documented for the team.','2026-05-22 14:00+00','2026-05-22','2026-05-22 14:00+00',FALSE,7.6,'Measurable reliability win plus durable documentation.',7.6,'agree','STABLE','mgr-showcase-eng'),
 ('rep-emp-showcase-09-w3','goal-showcase-eng','emp-showcase-09','Owned an incident end-to-end at 2am, root-caused a cache bug, and shipped the fix plus a postmortem. Added alerting so it can''t recur silently.','2026-05-29 14:00+00','2026-05-29','2026-05-29 14:00+00',FALSE,7.5,'Exemplary incident ownership with preventative follow-through.',7.5,'agree','STABLE','mgr-showcase-eng'),
 ('rep-emp-showcase-09-w4','goal-showcase-eng','emp-showcase-09','Drove the API-versioning project across two teams. Facilitated the alignment doc and unblocked three dependencies. Shipped the first versioned endpoint.','2026-06-05 14:00+00','2026-06-05','2026-06-05 14:00+00',FALSE,7.8,'Strong cross-team ownership and communication on a complex initiative.',7.8,'agree','STABLE','mgr-showcase-eng'),
 ('rep-emp-showcase-09-w5','goal-showcase-eng','emp-showcase-09','Versioning rolled to all public endpoints with a clean migration guide for customers. Ran a brown-bag on the approach for the whole eng team.','2026-06-12 14:00+00','2026-06-12','2026-06-12 14:00+00',FALSE,8.0,'High-impact delivery plus knowledge-sharing that lifts the whole team.',8.0,'agree','STABLE','mgr-showcase-eng'),
 ('rep-emp-showcase-09-w6','goal-showcase-eng','emp-showcase-09','Reduced CI time from 22 to 9 minutes by parallelising the test suite. The whole team ships faster now. Documented the setup.','2026-06-19 14:00+00','2026-06-19','2026-06-19 14:00+00',FALSE,7.9,'A force-multiplier improvement with clear, quantified team-wide impact.',7.9,'agree','STABLE','mgr-showcase-eng'),
 -- W7 & W8 submitted but NOT yet reviewed → show up under "Needs Review"
 ('rep-emp-showcase-09-w7','goal-showcase-eng','emp-showcase-09','Prototyped the caching layer with Liam and benchmarked a 15% infra saving. Wrote the RFC and opened it for review. Handled two code reviews for the team.','2026-06-26 14:00+00','2026-06-26','2026-06-26 14:00+00',FALSE,8.1,'Proactive efficiency work with rigorous benchmarking and a clear RFC.',NULL,NULL,'STABLE',NULL),
 ('rep-emp-showcase-09-w8','goal-showcase-eng','emp-showcase-09','Shipped the caching layer to staging; early numbers confirm the ~15% saving. Closed the quarter with zero rollbacks across everything I owned. Drafted next quarter''s reliability roadmap.','2026-07-03 14:00+00','2026-07-03','2026-07-03 14:00+00',FALSE,8.2,'Delivered the efficiency win and set direction for next quarter. Excellent, sustained.',NULL,NULL,'STABLE',NULL);

-- ── HERO 7 · Sophia Martinez (Marketing) — RECOVERY ARC: dip at W3-W4 then rebound ──
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, submitted_for_date, submitted_at, is_backdated, evaluation_score, evaluation_reasoning, manager_overall_score, manager_calibration, manager_override_reasoning, manager_feedback, consistency_flag, consistency_note, reviewed_by) VALUES
 ('rep-emp-showcase-21-w1','goal-showcase-mkt','emp-showcase-21','Launched the webinar campaign — 240 registrations, 90 attendees, 22 MQLs. Clean UTM tracking end-to-end so attribution is solid.','2026-05-15 14:00+00','2026-05-15','2026-05-15 14:00+00',FALSE,7.4,'Strong launch with real numbers and disciplined attribution.',7.4,'agree',NULL,NULL,'STABLE',NULL,'mgr-showcase-mkt'),
 ('rep-emp-showcase-21-w2','goal-showcase-mkt','emp-showcase-21','Nurtured the webinar list — 12 MQLs progressed to sales-accepted. A/B tested subject lines; winner lifted open rate 8 points.','2026-05-22 14:00+00','2026-05-22','2026-05-22 14:00+00',FALSE,7.1,'Good downstream conversion and a clean experiment with a measured result.',7.1,'agree',NULL,NULL,'STABLE',NULL,'mgr-showcase-mkt'),
 ('rep-emp-showcase-21-w3','goal-showcase-mkt','emp-showcase-21','Paid social campaign underperformed — CPL came in 60% over target and I was slow to catch it. Spent the back half diagnosing. Creative fatigue looks like the cause.','2026-05-29 14:00+00','2026-05-29','2026-05-29 14:00+00',FALSE,6.2,'A real miss with slow detection, but honest ownership and a plausible root cause.',6.2,'agree',NULL,'Rough week happens — the honest diagnosis is what matters. Let''s fix the feedback loop.','STABLE',NULL,'mgr-showcase-mkt'),
 ('rep-emp-showcase-21-w4','goal-showcase-mkt','emp-showcase-21','Still working through the paid issue. Paused the worst ad sets and refreshed creative but results are lagging. Not much to show yet — mostly firefighting this week.','2026-06-05 14:00+00','2026-06-05','2026-06-05 14:00+00',FALSE,5.6,'Trough week — actions are reasonable but outcomes are thin and the report is light on specifics.',5.9,'adjusted_up','Score nudged up: the corrective actions are sound and I''d rather reward the right process during a dip than punish it.','You''re doing the right things — hold the line, the new creative needs a week to breathe.','STAGNANT_LANGUAGE','Two consecutive weeks describing the same paid-social problem with similar framing; watch for it becoming a rut.','mgr-showcase-mkt'),
 ('rep-emp-showcase-21-w5','goal-showcase-mkt','emp-showcase-21','New creative worked — CPL back under target and MQLs recovering to 18 this week. Built a weekly performance check so a blow-out gets caught within 48 hours next time.','2026-06-12 14:00+00','2026-06-12','2026-06-12 14:00+00',FALSE,6.3,'Clear recovery plus a process fix that addresses the root cause of the miss.',6.3,'agree',NULL,NULL,'STABLE',NULL,'mgr-showcase-mkt'),
 ('rep-emp-showcase-21-w6','goal-showcase-mkt','emp-showcase-21','Fully recovered — 26 MQLs, best week of the quarter. The 48-hour check already flagged one dip early and I fixed it same-day. Launched a customer-story series.','2026-06-19 14:00+00','2026-06-19','2026-06-19 14:00+00',FALSE,7.0,'Back to strong output and the new guardrail is already proving its worth.',7.0,'agree',NULL,NULL,'STABLE',NULL,'mgr-showcase-mkt'),
 ('rep-emp-showcase-21-w7','goal-showcase-mkt','emp-showcase-21','Customer-story series drove 30 MQLs and 3 sales-accepted opps. Shared the paid-social post-mortem with the team so the lesson scales.','2026-06-26 14:00+00','2026-06-26','2026-06-26 14:00+00',FALSE,7.6,'High output, pipeline contribution, and turning a failure into team learning.',7.6,'agree',NULL,NULL,'STABLE',NULL,'mgr-showcase-mkt'),
 ('rep-emp-showcase-21-w8','goal-showcase-mkt','emp-showcase-21','Closed the quarter at 112% of MQL target despite the mid-quarter dip. Documented the new always-on monitoring as standard practice. Strong finish.','2026-07-03 14:00+00','2026-07-03','2026-07-03 14:00+00',FALSE,8.0,'Full recovery to above-target, with durable process improvements banked.',8.0,'agree',NULL,'Textbook recovery. The way you handled the dip is exactly what I want to see.','STABLE',NULL,'mgr-showcase-mkt');

-- ── HERO 8 · Lucas Wright (CS) — STRUGGLING, MISSED periods W3/W6/W7, low scores, one mercy bump ──
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, submitted_for_date, submitted_at, is_backdated, evaluation_score, evaluation_reasoning, manager_overall_score, manager_calibration, manager_override_reasoning, manager_feedback, consistency_flag, reviewed_by) VALUES
 ('rep-emp-showcase-16-w1','goal-showcase-cs','emp-showcase-16','Getting up to speed on the book. Ran a few check-ins but didn''t get to the two at-risk accounts. Struggling to prioritise across 40 accounts.','2026-05-15 14:00+00','2026-05-15','2026-05-15 14:00+00',FALSE,5.4,'Onboarding challenges are understandable, but the highest-risk accounts were left untouched.',5.4,'agree',NULL,NULL,'STABLE','mgr-showcase-cs'),
 ('rep-emp-showcase-16-w2','goal-showcase-cs','emp-showcase-16','Reached one at-risk account. Meeting went okay but I didn''t leave with clear next steps. Feeling underwater on volume.','2026-05-22 14:00+00','2026-05-22','2026-05-22 14:00+00',FALSE,5.2,'Some progress on risk, but no documented outcomes and workload is clearly overwhelming.',5.2,'agree',NULL,'Lucas, let''s cut your book to the top 20 accounts so you can go deep. Book time with me.','STABLE','mgr-showcase-cs'),
 -- W3 MISSED (no report)
 ('rep-emp-showcase-16-w4','goal-showcase-cs','emp-showcase-16','Book was trimmed to 20 accounts — big help. Got to all my top-5 risks and left each with a next step. First week I felt on top of it.','2026-06-05 14:00+00','2026-06-05','2026-06-05 14:00+00',FALSE,5.8,'The reduced scope is working; still early but real, evidenced progress on risks.',5.8,'agree',NULL,NULL,'STABLE','mgr-showcase-cs'),
 ('rep-emp-showcase-16-w5','goal-showcase-cs','emp-showcase-16','Saved one at-risk account with a tailored adoption plan — health score up from 4 to 6. Still slow on documentation but the customer work is landing.','2026-06-12 14:00+00','2026-06-12','2026-06-12 14:00+00',FALSE,6.0,'A genuine save with a moved metric — the clearest win yet, held back only by admin lag.',6.4,'adjusted_up','Score raised: a real health-score turnaround is exactly the outcome we want; I''m weighting the result over the paperwork this week.','That save is the standard — nice work. Keep the momentum.','STABLE','mgr-showcase-cs'),
 -- W6 & W7 MISSED (no reports)
 ('rep-emp-showcase-16-w8','goal-showcase-cs','emp-showcase-16','Back after two rough weeks — was overloaded and let reporting slip, which I own. Re-grounded on my top accounts and closed two renewals worth $54k. Setting a fixed Friday report time.','2026-07-03 14:00+00','2026-07-03','2026-07-03 14:00+00',FALSE,6.4,'Honest about the missed weeks and finished with two evidenced renewals. Consistency is the next hurdle.',6.4,'agree',NULL,'Glad you''re back on track. The renewals are great — now let''s make the weekly rhythm non-negotiable.','STABLE','mgr-showcase-cs');

-- ── Legacy completed goal — a little Q1 history so the completed goal isn't empty ──
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, submitted_for_date, submitted_at, is_backdated, evaluation_score, evaluation_reasoning, manager_overall_score, manager_calibration, consistency_flag, reviewed_by) VALUES
 ('rep-emp-showcase-08-legacy-1','goal-showcase-eng-legacy','emp-showcase-08','Took on-call for the reliability push. Cleared two recurring P2 alerts by fixing the underlying retry logic. P1 count down to one this month.','2026-02-14 14:00+00','2026-02-14','2026-02-14 14:00+00',FALSE,6.2,'Solid contribution to the reliability effort with a measurable alert reduction.',6.2,'agree','STABLE','mgr-showcase-eng'),
 ('rep-emp-showcase-08-legacy-2','goal-showcase-eng-legacy','emp-showcase-08','Wrote the first on-call runbook and ran a game-day. Team response time in the drill halved. No P1s this month.','2026-03-14 14:00+00','2026-03-14','2026-03-14 14:00+00',FALSE,7.0,'Good hygiene work with a clear, measured improvement to incident response.',7.0,'agree','STABLE','mgr-showcase-eng'),
 ('rep-emp-showcase-09-legacy-1','goal-showcase-eng-legacy','emp-showcase-09','Led the reliability push. Drove P1 rate from 5/month to 1/month by fixing the top two failure modes and adding SLO alerting. Established the on-call rotation.','2026-02-14 14:00+00','2026-02-14','2026-02-14 14:00+00',FALSE,8.4,'Outstanding leadership of the initiative with a dramatic, quantified reliability gain.',8.4,'agree','STABLE','mgr-showcase-eng'),
 ('rep-emp-showcase-09-legacy-2','goal-showcase-eng-legacy','emp-showcase-09','Closed out the push: zero P1s in March, SLO dashboards live, and the runbook adopted team-wide. Handed the rotation to the team cleanly.','2026-03-14 14:00+00','2026-03-14','2026-03-14 14:00+00',FALSE,8.7,'Landed the initiative with a perfect month and durable process — model execution.',8.7,'agree','STABLE','mgr-showcase-eng');

-- ============================================================================
-- 8. SUPPORTING CAST — 22 employees, generated weekly reports with an upward ramp.
--    Text drawn from realistic templates; scores rise gently week over week so the
--    org-wide cumulative trend is clearly POSITIVE. A few end with an unreviewed
--    latest week (pend=TRUE) to add to the "Needs Review" queue.
-- ============================================================================
DO $$
DECLARE
  emp RECORD;
  wk INT;
  maxwk INT;
  w_arr INT[];
  v_base NUMERIC;
  v_gid TEXT;
  v_eid TEXT;
  v_pend BOOLEAN;
  v_score NUMERIC;
  v_rid TEXT;
  v_mgr TEXT;
  v_text TEXT;
  v_reviewer TEXT;
  v_moverall NUMERIC;
  v_cal TEXT;
  idx INT;
  wk_sub TIMESTAMPTZ[] := ARRAY['2026-05-15 14:00+00','2026-05-22 14:00+00','2026-05-29 14:00+00','2026-06-05 14:00+00','2026-06-12 14:00+00','2026-06-19 14:00+00','2026-06-26 14:00+00','2026-07-03 14:00+00']::timestamptz[];
  tpl TEXT[] := ARRAY[
    'Closed out the week on plan. Shipped the committed work, unblocked two teammates, and posted a short written summary. Carrying one item into next week with a clear owner.',
    'Solid week against the goal. Hit the primary target, tightened the handoff with the next team, and documented the change so it is repeatable. Flagged one risk early enough to avoid slippage.',
    'Steady progress. Numbers moved in the right direction, applied the feedback from last review, and paired with a newer teammate to level up the work.',
    'Good outcomes this week. Delivered the main deliverable with evidence, ran a small experiment, and shared the result with the team. One dependency still open.',
    'Delivered on the week''s commitment and caught a quality issue before it shipped. Wrote up the fix so others can avoid it. Momentum is building.',
    'Focused week. Advanced the top priority with measurable movement and kept stakeholders updated proactively. Nothing blocked going into next week.',
    'Shipped what I committed to and helped a teammate close theirs out too. Kept the update specific and honest — including the one thing that slipped.',
    'Strong week. Hit target, improved a recurring process, and left clear next steps. The change I tested last week is now paying off.',
    'Made real progress on the goal with numbers to back it. Reviewed two pieces of teammates'' work and gave useful feedback. On track.',
    'Productive week — delivered the core work, documented it, and surfaced a risk with a plan attached. Building a more consistent rhythm.',
    'Met the week''s goal and pushed one deliverable ahead of schedule. Tightened how I report so the outcomes are easier to see. Good trajectory.',
    'Reliable week. Shipped, unblocked others, and closed the loop on last week''s open item. Small improvement in the metric I''ve been tracking.'
  ];
BEGIN
  -- (employee, dept-goal, baseline score, weeks reported, pend=latest-week-unreviewed)
  FOR emp IN SELECT * FROM (VALUES
      ('emp-showcase-03','goal-showcase-sales', 6.4::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-showcase-04','goal-showcase-sales', 6.9::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-showcase-05','goal-showcase-sales', 6.1::numeric, ARRAY[1,2,4,5,6,7,8],   FALSE),
      ('emp-showcase-06','goal-showcase-sales', 7.0::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-showcase-07','goal-showcase-sales', 5.9::numeric, ARRAY[2,3,4,5,6,7,8],   FALSE),
      ('emp-showcase-10','goal-showcase-eng',   6.6::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-showcase-11','goal-showcase-eng',   6.3::numeric, ARRAY[1,2,3,4,5,6,7,8], TRUE),
      ('emp-showcase-12','goal-showcase-eng',   7.4::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-showcase-13','goal-showcase-eng',   6.0::numeric, ARRAY[1,2,3,4,5],       FALSE),
      ('emp-showcase-14','goal-showcase-eng',   6.7::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-showcase-17','goal-showcase-cs',    6.8::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-showcase-18','goal-showcase-cs',    6.2::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-showcase-19','goal-showcase-cs',    6.5::numeric, ARRAY[1,2,3,4,5,6,7,8], TRUE),
      ('emp-showcase-20','goal-showcase-cs',    6.0::numeric, ARRAY[1,3,4,5,6,7,8],   FALSE),
      ('emp-showcase-22','goal-showcase-mkt',   6.7::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-showcase-23','goal-showcase-mkt',   6.4::numeric, ARRAY[1,2,3,4,5,6,7,8], TRUE),
      ('emp-showcase-24','goal-showcase-mkt',   7.1::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-showcase-25','goal-showcase-mkt',   6.2::numeric, ARRAY[2,3,4,5,6,7,8],   FALSE),
      ('emp-showcase-27','goal-showcase-prod',  7.2::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-showcase-28','goal-showcase-prod',  6.6::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-showcase-29','goal-showcase-prod',  6.9::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-showcase-30','goal-showcase-prod',  6.1::numeric, ARRAY[5,6,7,8],         FALSE)  -- recent joiner: only latter weeks
    ) AS t(eid, gid, base, weeks, pend)
  LOOP
    v_eid  := emp.eid;
    v_gid  := emp.gid;
    v_base := emp.base;
    w_arr  := emp.weeks;
    v_pend := emp.pend;
    v_mgr  := CASE v_gid
               WHEN 'goal-showcase-sales' THEN 'mgr-showcase-sales'
               WHEN 'goal-showcase-eng'   THEN 'mgr-showcase-eng'
               WHEN 'goal-showcase-cs'    THEN 'mgr-showcase-cs'
               WHEN 'goal-showcase-mkt'   THEN 'mgr-showcase-mkt'
               ELSE 'mgr-showcase-prod' END;
    maxwk := w_arr[array_length(w_arr, 1)];

    FOREACH wk IN ARRAY w_arr LOOP
      -- upward ramp + small deterministic jitter, clamped to a believable band
      v_score := v_base + (wk - 1) * 0.16 + ((abs(hashtext(v_eid || '-' || wk::text)) % 9) - 4) / 10.0;
      v_score := round(greatest(4.2, least(9.4, v_score))::numeric, 1);
      v_rid   := 'rep-' || v_eid || '-w' || wk::text;
      idx     := (abs(hashtext(v_rid)) % array_length(tpl, 1)) + 1;
      v_text  := tpl[idx];

      IF v_pend AND wk = maxwk THEN
        v_reviewer := NULL; v_moverall := NULL; v_cal := NULL;   -- awaiting review
      ELSE
        v_reviewer := v_mgr; v_moverall := v_score; v_cal := 'agree';
      END IF;

      INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, submitted_for_date, submitted_at, is_backdated, evaluation_score, evaluation_reasoning, manager_overall_score, manager_calibration, consistency_flag, reviewed_by)
      VALUES (v_rid, v_gid, v_eid, v_text, wk_sub[wk], wk_sub[wk]::date, wk_sub[wk], FALSE, v_score,
              'Weekly evaluation across the six goal criteria based on the evidence in this report.',
              v_moverall, v_cal, 'STABLE', v_reviewer);
    END LOOP;
  END LOOP;
END $$;

-- ============================================================================
-- 9. REPORTING PERIODS
--    9a. One 'submitted' period per report (derived from submitted_for_date).
--    9b. Explicit 'missed' / 'excused' scenario periods (weeks with no report).
--    9c. A few 'pending' upcoming periods (next week) so dashboards show what's due.
-- ============================================================================
-- 9a — submitted periods for every showcase report on a weekly goal
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT id, goal_id, employee_id, submitted_for_date, is_backdated
    FROM reports
    WHERE goal_id LIKE 'goal-showcase-%' AND goal_id <> 'goal-showcase-eng-legacy'
  LOOP
    INSERT INTO reporting_periods (id, goal_id, employee_id, period_start, period_end, status, late_submitted, report_id)
    VALUES (
      'rp-' || r.id,
      r.goal_id,
      r.employee_id,
      date_trunc('week', r.submitted_for_date::timestamptz),                 -- Monday 00:00
      (r.submitted_for_date::timestamptz + interval '23 hours 59 minutes'),  -- Friday 23:59
      'submitted',
      COALESCE(r.is_backdated, FALSE),
      r.id
    );
  END LOOP;
END $$;

-- 9b — MISSED (Lucas W3/W6/W7) and EXCUSED (Mia W5/W6, covered by leave)
INSERT INTO reporting_periods (id, goal_id, employee_id, period_start, period_end, status, late_submitted, backdated_after_missed_flagged) VALUES
 ('rp-missed-16-w3','goal-showcase-cs','emp-showcase-16','2026-05-25 00:00+00','2026-05-29 23:59+00','missed',FALSE,FALSE),
 ('rp-missed-16-w6','goal-showcase-cs','emp-showcase-16','2026-06-15 00:00+00','2026-06-19 23:59+00','missed',FALSE,FALSE),
 ('rp-missed-16-w7','goal-showcase-cs','emp-showcase-16','2026-06-22 00:00+00','2026-06-26 23:59+00','missed',FALSE,FALSE),
 ('rp-excused-26-w5','goal-showcase-prod','emp-showcase-26','2026-06-08 00:00+00','2026-06-12 23:59+00','excused',FALSE,FALSE),
 ('rp-excused-26-w6','goal-showcase-prod','emp-showcase-26','2026-06-15 00:00+00','2026-06-19 23:59+00','excused',FALSE,FALSE);

-- 9c — PENDING upcoming week (2026-07-06 → 2026-07-10) for a handful of active contributors
INSERT INTO reporting_periods (id, goal_id, employee_id, period_start, period_end, status) VALUES
 ('rp-pending-01','goal-showcase-sales','emp-showcase-01','2026-07-06 00:00+00','2026-07-10 23:59+00','pending'),
 ('rp-pending-08','goal-showcase-eng',  'emp-showcase-08','2026-07-06 00:00+00','2026-07-10 23:59+00','pending'),
 ('rp-pending-09','goal-showcase-eng',  'emp-showcase-09','2026-07-06 00:00+00','2026-07-10 23:59+00','pending'),
 ('rp-pending-15','goal-showcase-cs',   'emp-showcase-15','2026-07-06 00:00+00','2026-07-10 23:59+00','pending'),
 ('rp-pending-21','goal-showcase-mkt',  'emp-showcase-21','2026-07-06 00:00+00','2026-07-10 23:59+00','pending'),
 ('rp-pending-26','goal-showcase-prod', 'emp-showcase-26','2026-07-06 00:00+00','2026-07-10 23:59+00','pending');

-- ============================================================================
-- 10. GOAL FREQUENCY ANCHORS — one active weekly anchor per (employee, goal)
-- ============================================================================
DO $$
DECLARE a RECORD;
BEGIN
  FOR a IN
    SELECT DISTINCT employee_id, goal_id FROM reports
    WHERE goal_id LIKE 'goal-showcase-%' AND goal_id <> 'goal-showcase-eng-legacy'
  LOOP
    INSERT INTO goal_frequency_anchors (id, goal_id, employee_id, frequency, anchor_date, is_active)
    VALUES ('gfa-' || a.employee_id || '-' || a.goal_id, a.goal_id, a.employee_id, 'weekly', '2026-05-11 00:00+00', TRUE)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ============================================================================
-- 11. REPORT CRITERION SCORES — 6 per report, generated from the report's score.
--    Per-employee/criterion bias gives each person a distinct, stable skill shape
--    (so the radar has real peaks and valleys); per-report jitter keeps it lifelike.
--    Reasoning/evidence text is banded by score so the notes read believably.
-- ============================================================================
DO $$
DECLARE
  r RECORD;
  nm TEXT;
  v_score NUMERIC;
  v_bias NUMERIC;
  v_reason TEXT;
  v_evidence TEXT;
  crit TEXT[] := ARRAY['Impact & Outcomes','Execution Quality','Ownership & Initiative','Collaboration','Communication','Growth & Learning'];
BEGIN
  FOR r IN SELECT id, employee_id, evaluation_score FROM reports WHERE goal_id LIKE 'goal-showcase-%' LOOP
    FOREACH nm IN ARRAY crit LOOP
      v_bias  := ((abs(hashtext(r.employee_id || '|' || nm)) % 30) - 15) / 10.0;              -- -1.5 .. +1.4 per person/skill
      v_score := r.evaluation_score + v_bias + ((abs(hashtext(r.id || '|' || nm)) % 9) - 4) / 10.0;
      v_score := round(greatest(3.0, least(10.0, v_score))::numeric, 1);

      IF v_score >= 8.5 THEN
        v_reason := 'Consistently strong — specific outcomes with clear ownership.';
        v_evidence := 'Concrete results cited; target met or exceeded.';
      ELSIF v_score >= 7.5 THEN
        v_reason := 'Solid and reliable; evidence is specific with only minor gaps.';
        v_evidence := 'Clear examples provided; on track.';
      ELSIF v_score >= 6.5 THEN
        v_reason := 'Developing; some evidence, though claims occasionally outpace outcomes.';
        v_evidence := 'Partial evidence; mixed results this period.';
      ELSE
        v_reason := 'Needs work; claims are vague and evidence is thin this period.';
        v_evidence := 'Limited specifics; below target.';
      END IF;

      INSERT INTO report_criterion_scores (report_id, criterion_name, score, reasoning, evidence)
      VALUES (r.id, nm, v_score, v_reason, v_evidence);
    END LOOP;
  END LOOP;
END $$;

-- ============================================================================
-- 12. LEAVES  (Mia's mid-quarter leave covers her excused periods; plus two more)
-- ============================================================================
INSERT INTO leaves (id, employee_id, organization_id, start_date, end_date, leave_type, note, approved_by, created_at) VALUES
 ('leave-showcase-1','emp-showcase-26','org-showcase','2026-06-08','2026-06-19','vacation','Pre-planned two-week vacation; handoff completed before leave.','mgr-showcase-prod','2026-05-20 09:00+00'),
 ('leave-showcase-2','emp-showcase-17','org-showcase','2026-06-24','2026-06-26','sick','Out sick for three days.','mgr-showcase-cs','2026-06-24 08:00+00'),
 ('leave-showcase-3','emp-showcase-05','org-showcase','2026-07-01','2026-07-02','personal','Personal days approved.','mgr-showcase-sales','2026-06-25 10:00+00');

-- ============================================================================
-- 13. INVITATIONS  (pending / accepted / expired — one of each)
-- ============================================================================
INSERT INTO invitations (id, token, email, role, organization_id, invited_by, invited_at, expires_at, accepted_at, status, initial_project_ids, initial_manager_id, permission_template) VALUES
 ('inv-showcase-1','tok-showcase-pending-8f3a1c','jordan.lee@meridian.example','employee','org-showcase','mgr-showcase-sales','2026-07-02 09:00+00','2026-07-16 09:00+00',NULL,'pending',ARRAY['proj-showcase-sales'],'mgr-showcase-sales','standard_employee'),
 ('inv-showcase-2','tok-showcase-accepted-2b7d9e','taylor.moss@meridian.example','employee','org-showcase','mgr-showcase-prod','2026-05-28 09:00+00','2026-06-11 09:00+00','2026-05-30 14:20+00','accepted',ARRAY['proj-showcase-prod'],'mgr-showcase-prod','standard_employee'),
 ('inv-showcase-3','tok-showcase-expired-5c1f04','sam.rivera@meridian.example','manager','org-showcase','mgr-showcase-eng','2026-05-15 09:00+00','2026-05-29 09:00+00',NULL,'expired',ARRAY['proj-showcase-eng'],NULL,'manager');

-- ============================================================================
-- 14. FINAL STEP — bring reza@zevian.co into the showcase org as ACCOUNT OWNER,
--     top the org chart, and drop a few curated notifications on the bell.
--     (RLS shows you only your own org, so this makes the demo visible on sign-in.)
-- ============================================================================
WITH target AS (
  SELECT id FROM employees WHERE email = 'reza@zevian.co' ORDER BY created_at ASC LIMIT 1
)
UPDATE employees e SET
  organization_id      = 'org-showcase',
  role                 = 'manager',
  is_account_owner     = TRUE,
  onboarding_completed = TRUE,
  is_active            = TRUE,
  manager_id           = NULL,
  title                = COALESCE(NULLIF(e.title, ''), 'Chief Executive Officer'),
  dept                 = COALESCE(NULLIF(e.dept, ''), 'Leadership')
FROM target
WHERE e.id = target.id;

-- Ensure reza has full owner permissions + weekly settings
INSERT INTO employee_permissions (employee_id, can_set_global_frequency, can_view_organization_wide, can_manage_settings, can_create_projects, can_create_goals, can_override_ai_scores, can_invite_users)
SELECT id, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE FROM employees WHERE email = 'reza@zevian.co'
ON CONFLICT (employee_id) DO UPDATE SET
  can_view_organization_wide = TRUE, can_manage_settings = TRUE, can_override_ai_scores = TRUE, can_invite_users = TRUE;

INSERT INTO manager_settings (manager_id, global_frequency, report_frequency, allow_late_submissions, backdate_limit_days, grace_period_days)
SELECT id, TRUE, 'weekly', TRUE, 7, 1 FROM employees WHERE email = 'reza@zevian.co'
ON CONFLICT (manager_id) DO NOTHING;

-- The five department managers now report to reza (top of the org chart)
UPDATE employees SET manager_id = (SELECT id FROM employees WHERE email = 'reza@zevian.co' ORDER BY created_at ASC LIMIT 1)
WHERE id LIKE 'mgr-showcase-%';

-- Curated notifications for reza (link_url carries a sentinel so cleanup is idempotent)
INSERT INTO notifications (user_id, type, title, message, link_url, is_read, created_at)
SELECT e.id, n.type, n.title, n.message, n.link_url, n.is_read, n.created_at
FROM employees e
CROSS JOIN (VALUES
  ('performance','Score decline flagged','Noah Patel''s score has dropped for four straight weeks and a $95k account churned. Review recommended.','/employees/emp-showcase-15?seed=showcase', FALSE, TIMESTAMPTZ '2026-07-03 15:10+00'),
  ('alert','Missed reporting periods','Lucas Wright missed three reporting periods this quarter. He is now back on track.','/employees/emp-showcase-16?seed=showcase', FALSE, TIMESTAMPTZ '2026-07-03 15:05+00'),
  ('info','Reports awaiting review','You have several submitted reports from this week awaiting your review.','/reports?seed=showcase', FALSE, TIMESTAMPTZ '2026-07-04 08:30+00'),
  ('team_update','New team member','Isabelle Young has joined the Product team.','/employees/emp-showcase-30?seed=showcase', TRUE, TIMESTAMPTZ '2026-06-01 09:00+00'),
  ('performance','Standout performer','Ava Thompson finished the quarter at 118% of pipeline target — top of the team.','/employees/emp-showcase-01?seed=showcase', TRUE, TIMESTAMPTZ '2026-07-03 16:00+00')
) AS n(type, title, message, link_url, is_read, created_at)
WHERE e.email = 'reza@zevian.co';

COMMIT;

-- ============================================================================
-- DONE. Sign in as reza@zevian.co on the DEV app to see the Meridian showcase.
--   • Dashboard: positive 8-week team trend, KPI cards, recent activity, team skills
--   • Employees: 30 people with photo avatars, avg scores, sparkline trends
--   • Reports:   reviewed / awaiting-review / late / missed / excused rows
--   • Drill-in:  try Ava (star), Liam (turnaround), Noah (at-risk), Mia (on-leave)
-- ============================================================================
