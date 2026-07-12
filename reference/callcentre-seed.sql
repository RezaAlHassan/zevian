-- ============================================================================
-- ZEVIAN — CALL-CENTRE SHOWCASE SEED
-- ============================================================================
-- A complete, realistic contact centre ("Vantage Contact Centre") for demoing.
--   • 30 agents + 5 team leads, all with photo avatars
--   • 5 teams (varied statuses) + goals (active & completed) + 6 shared criteria
--   • 8 weeks of weekly reports (2026-05-15 → 2026-07-03) trending POSITIVE overall
--   • Every scenario the UI can render: reviewed / scored-pending / late-backdated /
--     missed / excused / on-leave, team-lead overrides (agree / up / down),
--     consistency flags (escalating / stagnant / stable), leaves, invitations
--     (pending / accepted / expired), notifications, custom metrics, knowledge pins
--
-- Metrics are contact-centre flavoured: CSAT, FCR, AHT, QA audit scores, adherence,
-- dials/conversions (outbound), saves (retention), calibration (QA).
--
-- SAFE & RE-RUNNABLE: wrapped in a transaction, prefixed IDs, idempotent cleanup.
-- Nothing outside the 'cc' namespace is touched — EXCEPT the final step, which
-- re-points the existing login  rezahasan1198@gmail.com  into this org as the
-- account owner so it is visible immediately on sign-in (RLS scopes to your org).
--
--   ⚠ You must have signed in at least once with rezahasan1198@gmail.com so an
--     employees row for that email exists — the final step re-points that row.
--
-- Run in the Supabase SQL editor (DEV project) or: psql "$DEV_DB_URL" -f callcentre-seed.sql
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- 0. CLEANUP  (delete prior call-centre data so this file is safely re-runnable)
--    Ordered children-first. Never deletes the owner row or the org row itself.
-- ────────────────────────────────────────────────────────────────────────────
DELETE FROM report_criterion_scores WHERE report_id LIKE 'rep-emp-cc-%';
DELETE FROM reporting_periods       WHERE goal_id  LIKE 'goal-cc-%';
DELETE FROM reports                 WHERE goal_id  LIKE 'goal-cc-%';
DELETE FROM goal_frequency_anchors  WHERE goal_id  LIKE 'goal-cc-%';
DELETE FROM goal_assignees          WHERE goal_id  LIKE 'goal-cc-%';
DELETE FROM criteria                WHERE goal_id  LIKE 'goal-cc-%';
DELETE FROM knowledge_pins          WHERE project_id LIKE 'proj-cc-%';
DELETE FROM project_documents       WHERE project_id LIKE 'proj-cc-%';
DELETE FROM project_assignees       WHERE project_id LIKE 'proj-cc-%';
DELETE FROM goals                   WHERE id LIKE 'goal-cc-%';
DELETE FROM projects                WHERE id LIKE 'proj-cc-%';
DELETE FROM leaves                  WHERE id LIKE 'leave-cc-%';
DELETE FROM invitations             WHERE id LIKE 'inv-cc-%';
DELETE FROM notifications           WHERE link_url LIKE '%seed=callcentre%';
DELETE FROM notifications           WHERE user_id LIKE 'emp-cc-%' OR user_id LIKE 'mgr-cc-%';
DELETE FROM manager_settings        WHERE manager_id LIKE 'mgr-cc-%';
DELETE FROM employee_permissions    WHERE employee_id LIKE 'emp-cc-%' OR employee_id LIKE 'mgr-cc-%';
DELETE FROM organization_custom_metrics WHERE id LIKE 'ocm-cc-%';
-- Agents last. The owner row is a different id → untouched.
DELETE FROM employees               WHERE id LIKE 'emp-cc-%' OR id LIKE 'mgr-cc-%';

-- ────────────────────────────────────────────────────────────────────────────
-- 1. ORGANISATION
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO organizations (id, name, plan_tier, selected_metrics, goal_weight, working_days, created_at)
VALUES ('org-cc', 'Vantage Contact Centre', 'business',
        ARRAY['ocm-cc-1','ocm-cc-2'], 70, ARRAY[1,2,3,4,5], '2024-01-08 09:00:00+00')
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      plan_tier = EXCLUDED.plan_tier,
      selected_metrics = EXCLUDED.selected_metrics;

INSERT INTO organization_custom_metrics (id, organization_id, name, description, is_active) VALUES
  ('ocm-cc-1', 'org-cc', 'Customer Satisfaction', 'How satisfied customers were with the interaction this period (CSAT / verbatim tone).', TRUE),
  ('ocm-cc-2', 'org-cc', 'Reliability & Adherence', 'Consistency in schedule adherence, following process, and dependable delivery.', TRUE);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. TEAM LEADS  (role='manager' → excluded from the Agents roster)
--    manager_id set to the owner at the very end.
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO employees (id, organization_id, name, email, title, dept, avatar_url, role, is_account_owner, onboarding_completed, is_active, join_date) VALUES
 ('mgr-cc-inbound',  'org-cc','Sandra Mensah','sandra.mensah@vantage.example', 'Inbound Team Lead',        'Inbound Care',       'https://i.pravatar.cc/150?img=64', 'manager', FALSE, TRUE, TRUE, '2024-01-15'),
 ('mgr-cc-tech',     'org-cc','Rahul Verma',  'rahul.verma@vantage.example',   'Technical Support Lead',  'Technical Support',  'https://i.pravatar.cc/150?img=51', 'manager', FALSE, TRUE, TRUE, '2024-02-01'),
 ('mgr-cc-retention','org-cc','Grace Owusu',  'grace.owusu@vantage.example',   'Retention Team Lead',     'Retention',          'https://i.pravatar.cc/150?img=45', 'manager', FALSE, TRUE, TRUE, '2024-02-19'),
 ('mgr-cc-outbound', 'org-cc','Daniel Cole',  'daniel.cole@vantage.example',   'Outbound Sales Lead',     'Outbound Sales',     'https://i.pravatar.cc/150?img=62', 'manager', FALSE, TRUE, TRUE, '2024-03-04'),
 ('mgr-cc-qa',       'org-cc','Aisha Khan',   'aisha.khan@vantage.example',    'Quality & Training Lead', 'Quality & Training', 'https://i.pravatar.cc/150?img=47', 'manager', FALSE, TRUE, TRUE, '2024-03-18');

-- Full team-lead permissions
INSERT INTO employee_permissions (employee_id, can_set_global_frequency, can_view_organization_wide, can_manage_settings, can_create_projects, can_create_goals, can_override_ai_scores, can_invite_users)
SELECT id, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE FROM employees WHERE id LIKE 'mgr-cc-%';

-- Team-lead settings (weekly cadence)
INSERT INTO manager_settings (manager_id, global_frequency, report_frequency, allow_late_submissions, backdate_limit_days, grace_period_days)
SELECT id, TRUE, 'weekly', TRUE, 7, 1 FROM employees WHERE id LIKE 'mgr-cc-%';

-- ────────────────────────────────────────────────────────────────────────────
-- 3. AGENTS  (30, role='employee')
--    Suffix ranges define team: 01-07 Inbound · 08-14 Tech · 15-20 Retention
--                               · 21-25 Outbound · 26-30 QA & Training
--    Featured scenario agents are flagged in comments.
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO employees (id, organization_id, manager_id, name, email, title, dept, avatar_url, role, onboarding_completed, is_active, join_date) VALUES
 -- Inbound Care
 ('emp-cc-01','org-cc','mgr-cc-inbound','Amara Okafor',   'amara.okafor@vantage.example',   'Senior Customer Care Agent','Inbound Care','https://i.pravatar.cc/150?img=5',  'employee', TRUE, TRUE, '2024-04-02'), -- HERO: star performer
 ('emp-cc-02','org-cc','mgr-cc-inbound','Marcus Bell',    'marcus.bell@vantage.example',    'Customer Care Agent',       'Inbound Care','https://i.pravatar.cc/150?img=12', 'employee', TRUE, TRUE, '2024-06-11'), -- HERO: chronic late / backdated
 ('emp-cc-03','org-cc','mgr-cc-inbound','Priya Nair',     'priya.nair@vantage.example',     'Customer Care Agent',       'Inbound Care','https://i.pravatar.cc/150?img=9',  'employee', TRUE, TRUE, '2024-09-03'),
 ('emp-cc-04','org-cc','mgr-cc-inbound','Tomas Rivera',   'tomas.rivera@vantage.example',   'Customer Care Agent',       'Inbound Care','https://i.pravatar.cc/150?img=13', 'employee', TRUE, TRUE, '2025-01-20'),
 ('emp-cc-05','org-cc','mgr-cc-inbound','Chloe Bennett',  'chloe.bennett@vantage.example',  'Junior Customer Care Agent','Inbound Care','https://i.pravatar.cc/150?img=16', 'employee', TRUE, TRUE, '2025-03-10'),
 ('emp-cc-06','org-cc','mgr-cc-inbound','Kwame Asante',   'kwame.asante@vantage.example',   'Customer Care Agent',       'Inbound Care','https://i.pravatar.cc/150?img=15', 'employee', TRUE, TRUE, '2024-11-05'),
 ('emp-cc-07','org-cc','mgr-cc-inbound','Zoe Richardson', 'zoe.richardson@vantage.example', 'Junior Customer Care Agent','Inbound Care','https://i.pravatar.cc/150?img=20', 'employee', TRUE, TRUE, '2025-05-19'),
 -- Technical Support
 ('emp-cc-08','org-cc','mgr-cc-tech','Liam Chen',        'liam.chen@vantage.example',       'Technical Support Agent',       'Technical Support','https://i.pravatar.cc/150?img=33', 'employee', TRUE, TRUE, '2024-07-08'), -- HERO: big improver
 ('emp-cc-09','org-cc','mgr-cc-tech','Olivia Garcia',    'olivia.garcia@vantage.example',   'Senior Technical Support Agent','Technical Support','https://i.pravatar.cc/150?img=32', 'employee', TRUE, TRUE, '2024-05-13'), -- HERO: strong but awaiting review
 ('emp-cc-10','org-cc','mgr-cc-tech','Aiden Wright',     'aiden.wright@vantage.example',    'Technical Support Agent',       'Technical Support','https://i.pravatar.cc/150?img=68', 'employee', TRUE, TRUE, '2024-10-14'),
 ('emp-cc-11','org-cc','mgr-cc-tech','Isla Turner',      'isla.turner@vantage.example',     'Technical Support Agent',       'Technical Support','https://i.pravatar.cc/150?img=44', 'employee', TRUE, TRUE, '2025-02-24'),
 ('emp-cc-12','org-cc','mgr-cc-tech','Caleb Morgan',     'caleb.morgan@vantage.example',    'Senior Technical Support Agent','Technical Support','https://i.pravatar.cc/150?img=52', 'employee', TRUE, TRUE, '2024-08-19'),
 ('emp-cc-13','org-cc','mgr-cc-tech','Hannah Foster',    'hannah.foster@vantage.example',   'Technical Support Agent',       'Technical Support','https://i.pravatar.cc/150?img=25', 'employee', TRUE, FALSE,'2024-06-24'), -- offboarded (is_active=false)
 ('emp-cc-14','org-cc','mgr-cc-tech','Dylan Reed',       'dylan.reed@vantage.example',      'Technical Support Agent',       'Technical Support','https://i.pravatar.cc/150?img=53', 'employee', TRUE, TRUE, '2025-04-07'),
 -- Retention
 ('emp-cc-15','org-cc','mgr-cc-retention','Noah Patel',   'noah.patel@vantage.example',     'Senior Retention Specialist','Retention','https://i.pravatar.cc/150?img=59', 'employee', TRUE, TRUE, '2024-05-27'), -- HERO: declining / at-risk
 ('emp-cc-16','org-cc','mgr-cc-retention','Lucas Wright', 'lucas.wright@vantage.example',   'Retention Specialist',       'Retention','https://i.pravatar.cc/150?img=57', 'employee', TRUE, TRUE, '2024-12-02'), -- HERO: missed periods / struggling
 ('emp-cc-17','org-cc','mgr-cc-retention','Emily Carter', 'emily.carter@vantage.example',   'Retention Specialist',       'Retention','https://i.pravatar.cc/150?img=48', 'employee', TRUE, TRUE, '2024-09-16'),
 ('emp-cc-18','org-cc','mgr-cc-retention','Sofia Nguyen', 'sofia.nguyen@vantage.example',   'Retention Specialist',       'Retention','https://i.pravatar.cc/150?img=41', 'employee', TRUE, TRUE, '2025-01-06'),
 ('emp-cc-19','org-cc','mgr-cc-retention','Jack Robinson','jack.robinson@vantage.example',  'Retention Specialist',       'Retention','https://i.pravatar.cc/150?img=54', 'employee', TRUE, TRUE, '2024-10-28'),
 ('emp-cc-20','org-cc','mgr-cc-retention','Lily Adams',   'lily.adams@vantage.example',     'Junior Retention Specialist','Retention','https://i.pravatar.cc/150?img=26', 'employee', TRUE, TRUE, '2025-03-31'),
 -- Outbound Sales
 ('emp-cc-21','org-cc','mgr-cc-outbound','Sophia Martinez','sophia.martinez@vantage.example','Outbound Sales Agent',       'Outbound Sales','https://i.pravatar.cc/150?img=49', 'employee', TRUE, TRUE, '2024-08-05'), -- HERO: dip then recovery
 ('emp-cc-22','org-cc','mgr-cc-outbound','Mason Clark',   'mason.clark@vantage.example',    'Outbound Sales Agent',       'Outbound Sales','https://i.pravatar.cc/150?img=60', 'employee', TRUE, TRUE, '2024-11-18'),
 ('emp-cc-23','org-cc','mgr-cc-outbound','Ella Scott',    'ella.scott@vantage.example',     'Outbound Sales Agent',       'Outbound Sales','https://i.pravatar.cc/150?img=27', 'employee', TRUE, TRUE, '2025-02-10'),
 ('emp-cc-24','org-cc','mgr-cc-outbound','Owen Baker',    'owen.baker@vantage.example',     'Senior Outbound Sales Agent','Outbound Sales','https://i.pravatar.cc/150?img=61', 'employee', TRUE, TRUE, '2024-12-16'),
 ('emp-cc-25','org-cc','mgr-cc-outbound','Ruby Hall',     'ruby.hall@vantage.example',      'Outbound Sales Agent',       'Outbound Sales','https://i.pravatar.cc/150?img=29', 'employee', TRUE, TRUE, '2025-04-21'),
 -- Quality & Training
 ('emp-cc-26','org-cc','mgr-cc-qa','Mia Johnson',        'mia.johnson@vantage.example',     'QA Analyst',            'Quality & Training','https://i.pravatar.cc/150?img=28', 'employee', TRUE, TRUE, '2024-07-22'), -- HERO: on leave mid-quarter
 ('emp-cc-27','org-cc','mgr-cc-qa','Leo Kim',            'leo.kim@vantage.example',         'Senior QA Analyst',     'Quality & Training','https://i.pravatar.cc/150?img=66', 'employee', TRUE, TRUE, '2024-10-07'),
 ('emp-cc-28','org-cc','mgr-cc-qa','Nora White',         'nora.white@vantage.example',      'QA Analyst',            'Quality & Training','https://i.pravatar.cc/150?img=24', 'employee', TRUE, TRUE, '2025-01-27'),
 ('emp-cc-29','org-cc','mgr-cc-qa','Felix Gray',         'felix.gray@vantage.example',      'Training Specialist',   'Quality & Training','https://i.pravatar.cc/150?img=67', 'employee', TRUE, TRUE, '2024-09-30'),
 ('emp-cc-30','org-cc','mgr-cc-qa','Isabelle Young',     'isabelle.young@vantage.example',  'Junior QA Analyst',     'Quality & Training','https://i.pravatar.cc/150?img=65', 'employee', TRUE, TRUE, '2026-06-01'); -- recent joiner

-- A couple of agents get elevated permissions (senior / creators)
INSERT INTO employee_permissions (employee_id, can_create_projects, can_create_goals) VALUES
  ('emp-cc-09', TRUE, TRUE),
  ('emp-cc-12', TRUE, TRUE),
  ('emp-cc-27', TRUE, TRUE);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. TEAMS (projects)  (varied statuses to exercise the status pills)
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO projects (id, organization_id, name, description, category, report_frequency, status, created_by, valid_report_days, created_at) VALUES
 ('proj-cc-inbound',  'org-cc','Inbound Customer Care','Handle inbound service contacts with high CSAT and first-contact resolution.', 'Inbound Care',      'weekly','active',  'mgr-cc-inbound',  '{1,2,3,4,5}','2026-04-14 09:00+00'),
 ('proj-cc-tech',     'org-cc','Technical Support',    'Resolve technical issues cleanly, cut repeat contacts, own escalations.',       'Technical Support','weekly','active',  'mgr-cc-tech',     '{1,2,3,4,5}','2026-04-14 09:00+00'),
 ('proj-cc-retention','org-cc','Customer Retention',   'Save at-risk customers and protect recurring revenue across the book.',         'Retention',        'weekly','at-risk', 'mgr-cc-retention','{1,2,3,4,5}','2026-04-14 09:00+00'),
 ('proj-cc-outbound', 'org-cc','Outbound Sales',       'Convert outbound dials into qualified sales with clean, compliant calls.',      'Outbound Sales',   'weekly','review',  'mgr-cc-outbound', '{1,2,3,4,5}','2026-04-14 09:00+00'),
 ('proj-cc-qa',       'org-cc','Quality & Training',   'Audit interactions, run calibrations, and lift the floor through coaching.',    'Quality & Training','weekly','active', 'mgr-cc-qa',       '{1,2,3,4,5}','2026-04-14 09:00+00');

INSERT INTO knowledge_pins (project_id, section, content, created_by) VALUES
  ('proj-cc-inbound','benchmarks','A strong week is 90%+ CSAT and 85%+ FCR with AHT held under 5m00s. Volume without resolution scores below 7.','mgr-cc-inbound'),
  ('proj-cc-inbound','priorities','Never close a billing dispute without a documented resolution or a booked callback. "Customer seemed fine" is not a resolution.','mgr-cc-inbound'),
  ('proj-cc-retention','constraints','Escalate any cancellation over £1k ARR within 24 hours with a save plan. Do not soften churn-risk language in reports.','mgr-cc-retention');

-- ────────────────────────────────────────────────────────────────────────────
-- 5. GOALS  (one active goal per team + one completed legacy goal in Tech)
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO goals (id, name, project_id, instructions, manager_id, created_by, deadline, status, created_at) VALUES
 ('goal-cc-inbound','Q2 Inbound Service Excellence','proj-cc-inbound','Score each weekly report on evidenced service outcomes — CSAT, first-contact resolution, and handle time held to standard. Specific numbers and resolved cases score high; volume claims without resolution score low.', 'mgr-cc-inbound','mgr-cc-inbound','2026-06-30','active','2026-04-14 09:00+00'),
 ('goal-cc-tech','Q2 Technical Resolution Quality','proj-cc-tech','Assess weekly technical support: clean first-time fixes, reduced repeat contacts, ownership of escalations, and clarity of case notes. Reward evidence of resolution over effort.', 'mgr-cc-tech','mgr-cc-tech','2026-06-30','active','2026-04-14 09:00+00'),
 ('goal-cc-tech-legacy','Q1 Backlog & FCR Push','proj-cc-tech','Completed initiative: clear the ticket backlog and lift first-contact resolution. Historical reference for how the team scored during Q1.', 'mgr-cc-tech','mgr-cc-tech','2026-03-31','completed','2026-01-13 09:00+00'),
 ('goal-cc-retention','Q2 Retention & Save Rate','proj-cc-retention','Score on evidenced save outcomes: cancellations retained, at-risk customers stabilised, risks surfaced early with a plan. Honest risk reporting is rewarded; downplaying churn risk is penalised.', 'mgr-cc-retention','mgr-cc-retention','2026-06-30','active','2026-04-14 09:00+00'),
 ('goal-cc-outbound','Q2 Outbound Sales Performance','proj-cc-outbound','Assess weekly outbound results: connects, qualified conversions with real numbers, and compliant, quality calls. Reward measurable conversion over raw dial counts.', 'mgr-cc-outbound','mgr-cc-outbound','2026-06-30','active','2026-04-14 09:00+00'),
 ('goal-cc-qa','Q2 Quality & Coaching','proj-cc-qa','Score on audit volume and accuracy, calibration participation, coaching delivered to agents, and clarity of write-ups. Evidence of floor-wide improvement scores highest.', 'mgr-cc-qa','mgr-cc-qa','2026-06-30','active','2026-04-14 09:00+00');

-- 6 SHARED UNIVERSAL CRITERIA per goal (weights sum to 100) — consistent names so the
-- skill radar, skill list, and team-criterion overlays aggregate cleanly across the org.
INSERT INTO criteria (id, goal_id, name, weight, display_order, target_description)
SELECT 'crit-' || g.id || '-1', g.id, 'Resolution & FCR',          25, 1, 'Issues resolved on first contact with a documented outcome.' FROM goals g WHERE g.id LIKE 'goal-cc-%'
UNION ALL SELECT 'crit-' || g.id || '-2', g.id, 'Call Quality & Compliance', 20, 2, 'Follows script, compliance, and the QA standard.'            FROM goals g WHERE g.id LIKE 'goal-cc-%'
UNION ALL SELECT 'crit-' || g.id || '-3', g.id, 'Productivity',              20, 3, 'Handle time, volume, and schedule adherence held to target.' FROM goals g WHERE g.id LIKE 'goal-cc-%'
UNION ALL SELECT 'crit-' || g.id || '-4', g.id, 'Customer Experience',       15, 4, 'Empathy, tone, and CSAT — customers feel well handled.'      FROM goals g WHERE g.id LIKE 'goal-cc-%'
UNION ALL SELECT 'crit-' || g.id || '-5', g.id, 'Communication',             10, 5, 'Case notes and escalations are specific, concise, honest.'   FROM goals g WHERE g.id LIKE 'goal-cc-%'
UNION ALL SELECT 'crit-' || g.id || '-6', g.id, 'Growth & Coaching',         10, 6, 'Acts on feedback and helps lift the wider team.'             FROM goals g WHERE g.id LIKE 'goal-cc-%';

-- ────────────────────────────────────────────────────────────────────────────
-- 6. ASSIGNEES  (each agent → their team project + active goal; derived by suffix)
-- ────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE e RECORD; n INT; team TEXT;
BEGIN
  FOR e IN SELECT id FROM employees WHERE id LIKE 'emp-cc-%' LOOP
    n := split_part(e.id, '-', 3)::int;
    team := CASE WHEN n <= 7 THEN 'inbound' WHEN n <= 14 THEN 'tech' WHEN n <= 20 THEN 'retention'
                 WHEN n <= 25 THEN 'outbound' ELSE 'qa' END;
    INSERT INTO project_assignees (project_id, assignee_id, assignee_type)
      VALUES ('proj-cc-' || team, e.id, 'employee') ON CONFLICT DO NOTHING;
    INSERT INTO goal_assignees (goal_id, assignee_id, assignee_type)
      VALUES ('goal-cc-' || team, e.id, 'employee') ON CONFLICT DO NOTHING;
  END LOOP;
  -- Legacy completed goal: two tech agents carried it
  INSERT INTO goal_assignees (goal_id, assignee_id, assignee_type) VALUES
    ('goal-cc-tech-legacy','emp-cc-08','employee'),
    ('goal-cc-tech-legacy','emp-cc-09','employee') ON CONFLICT DO NOTHING;
END $$;

-- ============================================================================
-- 7. HERO REPORTS — 8 featured agents with hand-authored 8-week arcs.
--    Weekly Fridays: W1 05-15 · W2 05-22 · W3 05-29 · W4 06-05 · W5 06-12 · W6 06-19 · W7 06-26 · W8 07-03
-- ============================================================================

-- ── HERO 1 · Amara Okafor (Inbound) — STAR PERFORMER, consistently high, all reviewed ──
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, submitted_for_date, submitted_at, is_backdated, evaluation_score, evaluation_reasoning, manager_overall_score, manager_calibration, manager_override_reasoning, manager_feedback, consistency_flag, reviewed_by) VALUES
 ('rep-emp-cc-01-w1','goal-cc-inbound','emp-cc-01','Handled 182 inbound calls at 94% CSAT and 88% FCR, AHT 4m50s. Fully resolved two complex billing escalations without a callback and logged clean notes on every ticket.','2026-05-15 14:00+00','2026-05-15','2026-05-15 14:00+00',FALSE,8.4,'Strong evidenced week — high CSAT and FCR with disciplined notes and no callbacks.',8.4,'agree',NULL,NULL,'STABLE','mgr-cc-inbound'),
 ('rep-emp-cc-01-w2','goal-cc-inbound','emp-cc-01','176 calls, CSAT 95%, FCR 90%. Closed a refund case that had bounced twice before. Held AHT at 4m40s even on a heavy complaints day.','2026-05-22 14:00+00','2026-05-22','2026-05-22 14:00+00',FALSE,8.6,'Consistent quality with a difficult case closed cleanly and handle time under control.',8.6,'agree',NULL,NULL,'STABLE','mgr-cc-inbound'),
 ('rep-emp-cc-01-w3','goal-cc-inbound','emp-cc-01','Lighter volume (159 calls) on a training day. CSAT 94%, FCR 89%. Used the downtime to build a billing-dispute cheat-sheet the pod can reuse.','2026-05-29 14:00+00','2026-05-29','2026-05-29 14:00+00',FALSE,8.5,'Slightly lower volume but high quality plus a reusable asset for the team.',8.5,'agree',NULL,NULL,'STABLE','mgr-cc-inbound'),
 ('rep-emp-cc-01-w4','goal-cc-inbound','emp-cc-01','Best week of the quarter — 190 calls, CSAT 96%, FCR 91%. Coached Chloe on the empathy opener that lifts first-30-seconds sentiment; her CSAT rose the same week.','2026-06-05 14:00+00','2026-06-05','2026-06-05 14:00+00',FALSE,8.8,'Excellent output and quality, plus peer coaching that visibly moved a teammate.',8.8,'agree',NULL,'Outstanding week — the cheat-sheet and the coaching are exactly what we want copied.','STABLE','mgr-cc-inbound'),
 ('rep-emp-cc-01-w5','goal-cc-inbound','emp-cc-01','185 calls, CSAT 95%, FCR 90%. Wrote a short FAQ doc from my last 50 calls and shared it in the team channel to cut repeat questions.','2026-06-12 14:00+00','2026-06-12','2026-06-12 14:00+00',FALSE,9.0,'High output with strong quality and a reusable asset created for the team.',9.0,'agree',NULL,NULL,'STABLE','mgr-cc-inbound'),
 ('rep-emp-cc-01-w6','goal-cc-inbound','emp-cc-01','172 calls, CSAT 95%. Spent a shift helping Marcus rebuild his call-wrap habit so his notes and after-call work tighten up.','2026-06-19 14:00+00','2026-06-19','2026-06-19 14:00+00',FALSE,8.9,'Steady quality plus meaningful investment in a struggling teammate.',8.9,'agree',NULL,NULL,'STABLE','mgr-cc-inbound'),
 ('rep-emp-cc-01-w7','goal-cc-inbound','emp-cc-01','Owned a viral complaint that hit social — de-escalated the customer to a 5-star follow-up and documented the recovery as a playbook. 168 calls, CSAT 96% on top.','2026-06-26 14:00+00','2026-06-26','2026-06-26 14:00+00',FALSE,9.2,'Landmark recovery, sustained quality, and a documented playbook for the floor.',9.4,'adjusted_up','Score raised: the complaint-recovery playbook is now the team standard — impact well beyond her own queue.','Landmark week. The playbook is being adopted floor-wide.','STABLE','mgr-cc-inbound'),
 ('rep-emp-cc-01-w8','goal-cc-inbound','emp-cc-01','Finished the quarter at 95% average CSAT, above the 90% target. 180 calls this week. Handed a warm high-value account query to Tomas to balance the pod''s workload.','2026-07-03 14:00+00','2026-07-03','2026-07-03 14:00+00',FALSE,9.3,'Exceeded target, sustained pace to the finish, and shared load with the team.',9.3,'agree',NULL,'Best quarter on the team. Let''s talk about a senior / team-lead track.','STABLE','mgr-cc-inbound');

-- ── HERO 2 · Liam Chen (Tech) — BIG IMPROVER, 5.9 → 8.6, all reviewed ──
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, submitted_for_date, submitted_at, is_backdated, evaluation_score, evaluation_reasoning, manager_overall_score, manager_calibration, manager_override_reasoning, manager_feedback, consistency_flag, reviewed_by) VALUES
 ('rep-emp-cc-08-w1','goal-cc-tech','emp-cc-08','Cleared my ticket queue but two fixes were incomplete and reopened as repeat contacts. Escalated late on a router issue I should have flagged earlier. FCR only 68% this week. I know I need to confirm the fix before closing.','2026-05-15 14:00+00','2026-05-15','2026-05-15 14:00+00',FALSE,5.9,'Volume cleared but quality gaps and slow escalation drove repeat contacts. Honest self-diagnosis is a good sign.',5.9,'agree',NULL,NULL,'STABLE','mgr-cc-tech'),
 ('rep-emp-cc-08-w2','goal-cc-tech','emp-cc-08','Fixed last week''s reopened tickets and started confirming the resolution with the customer before closing. FCR up to 74%, zero reopens this week even if my handle time was a touch high.','2026-05-22 14:00+00','2026-05-22','2026-05-22 14:00+00',FALSE,6.3,'Applied last week''s lesson; FCR and reopens improved even as speed builds.',6.6,'adjusted_up','Score raised: acting on feedback within a week is exactly the trajectory I want to reinforce.','Good response to last week. Keep confirming fixes before you close.','STABLE','mgr-cc-tech'),
 ('rep-emp-cc-08-w3','goal-cc-tech','emp-cc-08','Handled the billing-integration tickets on time with clean notes. FCR 80%. Flagged a recurring modem-reset defect to the vendor early, which saved a day of repeat calls.','2026-05-29 14:00+00','2026-05-29','2026-05-29 14:00+00',FALSE,6.7,'On-time resolution, good notes, and early escalation that prevented repeat contacts.',6.7,'agree',NULL,NULL,'STABLE','mgr-cc-tech'),
 ('rep-emp-cc-08-w4','goal-cc-tech','emp-cc-08','Owned the recurring modem-reset issue end-to-end — wrote a short diagnostic script the team can follow, cutting that call type''s AHT. FCR 82%, no reopens.','2026-06-05 14:00+00','2026-06-05','2026-06-05 14:00+00',FALSE,7.1,'Clear ownership and a reusable diagnostic that lifts the whole team.',7.1,'agree',NULL,NULL,'STABLE','mgr-cc-tech'),
 ('rep-emp-cc-08-w5','goal-cc-tech','emp-cc-08','Traced a spike in dropped-connection tickets to a firmware batch, documented the workaround, and shared it in the knowledge base. Repeat contacts on that issue fell 40%. FCR 85%.','2026-06-12 14:00+00','2026-06-12','2026-06-12 14:00+00',FALSE,7.5,'Strong root-cause work with a measured drop in repeat contacts and a KB article.',7.5,'agree',NULL,NULL,'STABLE','mgr-cc-tech'),
 ('rep-emp-cc-08-w6','goal-cc-tech','emp-cc-08','Led the Tier-2 escalation queue this week. Cleared it under SLA and pair-listened with Aiden on the hardest cases. FCR 86%.','2026-06-19 14:00+00','2026-06-19','2026-06-19 14:00+00',FALSE,7.9,'Led a tough queue cleanly and lifted a teammate along the way.',7.9,'agree',NULL,NULL,'STABLE','mgr-cc-tech'),
 ('rep-emp-cc-08-w7','goal-cc-tech','emp-cc-08','Escalation queue held under SLA all week; FCR up to 88%. Wrote the runbook for the firmware issue and demoed it to the team. Took an out-of-hours P1 and resolved it in 20 minutes.','2026-06-26 14:00+00','2026-06-26','2026-06-26 14:00+00',FALSE,8.3,'Measurable impact, documentation, and fast, calm incident handling.',8.3,'agree',NULL,NULL,'STABLE','mgr-cc-tech'),
 ('rep-emp-cc-08-w8','goal-cc-tech','emp-cc-08','Closed the quarter at 88% FCR from 68% in May, with zero reopened escalations. Proposed a macro that pre-fills the top three diagnostic steps and prototyped it for review.','2026-07-03 14:00+00','2026-07-03','2026-07-03 14:00+00',FALSE,8.6,'From a shaky start to a consistent high performer now driving proactive improvements.',8.6,'agree',NULL,'Most improved on the team by a distance. The diagnostic macro is a green light.','STABLE','mgr-cc-tech');

-- ── HERO 3 · Noah Patel (Retention) — DECLINING / AT-RISK, consistency flags + override down ──
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, submitted_for_date, submitted_at, is_backdated, evaluation_score, evaluation_reasoning, manager_overall_score, manager_calibration, manager_override_reasoning, manager_feedback, consistency_flag, consistency_note, reviewed_by) VALUES
 ('rep-emp-cc-15-w1','goal-cc-retention','emp-cc-15','Worked 34 at-risk accounts. Saved the Whitfield account (£1.4k ARR) by fixing a billing error and lifted their satisfaction from 6 to 8. Flagged one shaky account with a concrete save plan.','2026-05-15 14:00+00','2026-05-15','2026-05-15 14:00+00',FALSE,8.1,'Strong evidenced outcomes — a real save, a moved satisfaction score, and honest risk-flagging.',8.1,'agree',NULL,NULL,'STABLE',NULL,'mgr-cc-retention'),
 ('rep-emp-cc-15-w2','goal-cc-retention','emp-cc-15','Retained two cancellations and ran renewal calls. The Cascade account went quiet — I''ve left two voicemails with no reply but I think it''s fine. Otherwise a solid week of check-ins.','2026-05-22 14:00+00','2026-05-22','2026-05-22 14:00+00',FALSE,7.9,'Good saves, but the Cascade "I think it''s fine" read lacks evidence and warrants a closer look.',7.9,'agree',NULL,NULL,'STABLE',NULL,'mgr-cc-retention'),
 ('rep-emp-cc-15-w3','goal-cc-retention','emp-cc-15','Busy week of calls across the book. Lots of good conversations. Cascade still unresponsive but their usage looks okay to me. Confident the portfolio is healthy overall.','2026-05-29 14:00+00','2026-05-29','2026-05-29 14:00+00',FALSE,7.6,'Activity is high but outcomes are getting vaguer; the Cascade risk is being narrated away.',7.6,'agree',NULL,NULL,'STABLE',NULL,'mgr-cc-retention'),
 ('rep-emp-cc-15-w4','goal-cc-retention','emp-cc-15','Strong week. Handled a pricing objection on the Meadowbrook account and I''m confident it''s locked for renewal. Cascade is still dark but I''m not worried. Everything is trending well.','2026-06-05 14:00+00','2026-06-05','2026-06-05 14:00+00',FALSE,7.2,'Confidence is outrunning evidence. No documented next steps on the two named risks.',7.2,'agree',NULL,NULL,'STABLE',NULL,'mgr-cc-retention'),
 ('rep-emp-cc-15-w5','goal-cc-retention','emp-cc-15','Good momentum this week. Calls went well and relationships are strong. Cascade opened a support ticket which I take as a positive sign of engagement. Book feels healthy.','2026-06-12 14:00+00','2026-06-12','2026-06-12 14:00+00',FALSE,6.9,'Reframing a support ticket as a "positive sign" without data. Outcomes remain unquantified.',6.9,'agree',NULL,NULL,'STABLE',NULL,'mgr-cc-retention'),
 ('rep-emp-cc-15-w6','goal-cc-retention','emp-cc-15','Excellent week overall — probably my best of the quarter. Every account is in great shape and I''m very confident about all upcoming renewals. Cascade will come around, I''m sure of it.','2026-06-19 14:00+00','2026-06-19','2026-06-19 14:00+00',FALSE,6.4,'Claims are escalating while evidence disappears. "Best week" is asserted with nothing to support it.',6.0,'adjusted_down','Score lowered: the report claims a peak week but two named accounts have open, unaddressed risk and no next steps. Confidence is not evidence.','Noah — let''s meet Monday. Cascade needs a real save plan today, and I need reports grounded in data, not reassurance.','ESCALATING_CLAIMS','Positive language is intensifying ("best week", "very confident") while concrete outcomes decline week over week.','mgr-cc-retention'),
 ('rep-emp-cc-15-w7','goal-cc-retention','emp-cc-15','Cascade cancelled (£2.1k ARR). I was blindsided. Spent the week on damage control and building a win-back. In hindsight the warning signs were there for a while.','2026-06-26 14:00+00','2026-06-26','2026-06-26 14:00+00',FALSE,6.1,'The flagged risk materialised as churn. Credit for an honest post-mortem, but the miss was avoidable.',6.1,'agree',NULL,NULL,'ESCALATING_CLAIMS','Prior weeks'' unfounded confidence directly preceded a £2.1k cancellation that was signposted for a month.','mgr-cc-retention'),
 ('rep-emp-cc-15-w8','goal-cc-retention','emp-cc-15','Reset week. Built a simple health tracker so no account goes dark unnoticed again. Re-baselined every at-risk account with documented next steps. Two saves in progress with real plans.','2026-07-03 14:00+00','2026-07-03','2026-07-03 14:00+00',FALSE,5.8,'Right corrective actions and finally evidence-based, but the quarter''s damage is done. Rebuilding trust.',5.8,'agree',NULL,'Good reset. This is the reporting I needed all along. Let''s rebuild from here — I''m in your corner.','STABLE',NULL,'mgr-cc-retention');

-- ── HERO 4 · Mia Johnson (QA) — ON LEAVE weeks 5–6 (excused), reports W1-4 + W7-8 ──
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, submitted_for_date, submitted_at, is_backdated, evaluation_score, evaluation_reasoning, manager_overall_score, manager_calibration, manager_override_reasoning, manager_feedback, consistency_flag, reviewed_by) VALUES
 ('rep-emp-cc-26-w1','goal-cc-qa','emp-cc-26','Audited 60 calls across Inbound and Tech. Flagged a pattern of missing compliance disclosures and ran a mini-calibration to align scores. Coaching notes delivered to five agents.','2026-05-15 14:00+00','2026-05-15','2026-05-15 14:00+00',FALSE,7.6,'Solid audit volume with a real pattern surfaced and calibration to keep scoring consistent.',7.6,'agree',NULL,NULL,'STABLE','mgr-cc-qa'),
 ('rep-emp-cc-26-w2','goal-cc-qa','emp-cc-26','65 audits. Built a one-page compliance checklist from last week''s pattern and shared it floor-wide; disclosure misses dropped noticeably. Partnered with Rahul before rollout.','2026-05-22 14:00+00','2026-05-22','2026-05-22 14:00+00',FALSE,7.8,'Turned an audit finding into a floor-wide fix with measurable effect.',7.8,'agree',NULL,NULL,'STABLE','mgr-cc-qa'),
 ('rep-emp-cc-26-w3','goal-cc-qa','emp-cc-26','Ran a calibration session with the leads on empathy scoring — 8 sample calls, aligned on a clearer rubric. Variance between scorers dropped sharply.','2026-05-29 14:00+00','2026-05-29','2026-05-29 14:00+00',FALSE,7.7,'Strong calibration rigor with a clearer rubric the whole QA team can use.',7.7,'agree',NULL,NULL,'STABLE','mgr-cc-qa'),
 ('rep-emp-cc-26-w4','goal-cc-qa','emp-cc-26','Prepped full handoff docs ahead of my planned leave — audit schedule, open coaching threads, and the new rubric — so nothing stalls while I''m out. Completed 58 audits.','2026-06-05 14:00+00','2026-06-05','2026-06-05 14:00+00',FALSE,8.0,'Strong output and a thoughtful, complete handoff before leave.',8.0,'agree',NULL,'Great work and a very clean handoff. Enjoy your time off — we''ve got it covered.','STABLE','mgr-cc-qa'),
 -- W5 & W6: on approved leave → no reports (see excused reporting_periods + leaves row below)
 ('rep-emp-cc-26-w7','goal-cc-qa','emp-cc-26','Back from leave. Caught up on the audit backlog, reviewed the scores logged while I was out, and re-aligned two leads whose empathy scoring had drifted. 55 audits.','2026-06-26 14:00+00','2026-06-26','2026-06-26 14:00+00',FALSE,7.9,'Smooth re-entry — cleared the backlog fast and re-aligned drifting scorers.',7.9,'agree',NULL,NULL,'STABLE','mgr-cc-qa'),
 ('rep-emp-cc-26-w8','goal-cc-qa','emp-cc-26','Rolled out a refreshed QA scorecard to beta with two teams. First read is strong — coaching turnaround time down ~30%. Wrote the rollout plan and a summary for the wider floor.','2026-07-03 14:00+00','2026-07-03','2026-07-03 14:00+00',FALSE,8.1,'Landed the new scorecard with a measured coaching-speed gain and a clear rollout plan.',8.1,'agree',NULL,'Barely a beat missed across the leave. Excellent quarter.','STABLE','mgr-cc-qa');

-- ── HERO 5 · Marcus Bell (Inbound) — CHRONIC LATE / BACKDATED (submitted days after the period) ──
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, submitted_for_date, submitted_at, is_backdated, evaluation_score, evaluation_reasoning, manager_overall_score, manager_calibration, manager_feedback, consistency_flag, reviewed_by) VALUES
 ('rep-emp-cc-02-w1','goal-cc-inbound','emp-cc-02','Handled 150 calls, CSAT 88%. FCR was low (76%) — a couple of cases needed callbacks. After-call notes were thin. Filing this a few days late, got buried in the queue.','2026-05-19 10:30+00','2026-05-15','2026-05-19 10:30+00',TRUE,6.8,'Moderate output; low FCR, thin notes, and a late submission hold the score.',6.8,'agree',NULL,'STABLE','mgr-cc-inbound'),
 ('rep-emp-cc-02-w2','goal-cc-inbound','emp-cc-02','160 calls, CSAT 90%, FCR up to 80%. Tightened my notes on the harder cases. Report is late again — I need a better end-of-week habit.','2026-05-26 09:15+00','2026-05-22','2026-05-26 09:15+00',TRUE,7.0,'Improving quality but the recurring lateness is now a pattern to fix.',7.0,'agree',NULL,'STABLE','mgr-cc-inbound'),
 ('rep-emp-cc-02-w3','goal-cc-inbound','emp-cc-02','Quieter week — 148 calls, CSAT 89%. Used Amara''s billing cheat-sheet which helped two disputes. Still filing late.','2026-06-02 11:00+00','2026-05-29','2026-06-02 11:00+00',TRUE,6.9,'Flat output; a good habit borrowed from a peer, but timeliness unchanged.',6.9,'agree',NULL,'STABLE','mgr-cc-inbound'),
 ('rep-emp-cc-02-w4','goal-cc-inbound','emp-cc-02','165 calls, FCR 82%, CSAT 91%. Set a Friday reminder to submit on time — this one is only one day late.','2026-06-06 16:00+00','2026-06-05','2026-06-06 16:00+00',TRUE,7.2,'Steady improvement and the lateness is shrinking — trending the right way.',7.2,'agree',NULL,'STABLE','mgr-cc-inbound'),
 ('rep-emp-cc-02-w5','goal-cc-inbound','emp-cc-02','Amara spent a shift helping me rebuild my call-wrap habit. Notes and after-call work tightened up immediately — FCR 84%. Late by two days, was on a course.','2026-06-16 09:00+00','2026-06-12','2026-06-16 09:00+00',TRUE,7.1,'Good uptake of peer coaching with quick results; timeliness slipped again.',7.1,'agree',NULL,'STABLE','mgr-cc-inbound'),
 ('rep-emp-cc-02-w6','goal-cc-inbound','emp-cc-02','Best week yet — 175 calls, CSAT 93%, FCR 86%. The new wrap habit is paying off. Still a day late but consistently closer.','2026-06-22 10:00+00','2026-06-19','2026-06-22 10:00+00',TRUE,7.4,'Clear improvement in quality and volume; timeliness steadily converging.',7.4,'agree',NULL,'STABLE','mgr-cc-inbound'),
 ('rep-emp-cc-02-w7','goal-cc-inbound','emp-cc-02','168 calls, CSAT 92%, FCR 86%. Resolved two long-running complaint threads for good. Filing a day late again but the quality is real now.','2026-06-29 09:30+00','2026-06-26','2026-06-29 09:30+00',TRUE,7.3,'Consistent quality progression; the coaching clearly took hold.',7.3,'agree',NULL,'STABLE','mgr-cc-inbound'),
 ('rep-emp-cc-02-w8','goal-cc-inbound','emp-cc-02','Ended the quarter at 92% CSAT and 87% FCR — genuinely turned it around in the back half, thanks to Amara''s help. 170 calls this week.','2026-07-05 12:00+00','2026-07-03','2026-07-05 12:00+00',TRUE,7.6,'Strong finish and real quality; the second-half turnaround holds. Fix the timeliness and this is an 8.',7.6,'agree','Big second-half turnaround, Marcus. Now let''s nail on-time reporting to match.','STABLE','mgr-cc-inbound');

-- ── HERO 6 · Olivia Garcia (Tech) — STRONG but latest 2 weeks AWAITING REVIEW (reviewed_by NULL) ──
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, submitted_for_date, submitted_at, is_backdated, evaluation_score, evaluation_reasoning, manager_overall_score, manager_calibration, consistency_flag, reviewed_by) VALUES
 ('rep-emp-cc-09-w1','goal-cc-tech','emp-cc-09','Owned the Tier-2 escalation desk and cleared it under SLA. Mentored Isla through her first solo escalation. FCR 87%, zero reopens.','2026-05-15 14:00+00','2026-05-15','2026-05-15 14:00+00',FALSE,7.4,'Strong technical leadership and mentorship with clean resolution.',7.4,'agree','STABLE','mgr-cc-tech'),
 ('rep-emp-cc-09-w2','goal-cc-tech','emp-cc-09','Cut token-refresh login tickets to near zero by documenting the real fix and updating the KB. FCR 88%. Wrote the decision up so the team has it.','2026-05-22 14:00+00','2026-05-22','2026-05-22 14:00+00',FALSE,7.6,'Measurable repeat-contact reduction plus durable documentation.',7.6,'agree','STABLE','mgr-cc-tech'),
 ('rep-emp-cc-09-w3','goal-cc-tech','emp-cc-09','Owned an out-of-hours outage call at 2am, root-caused a caching bug, and shipped the workaround plus a postmortem. Added an alert so it can''t recur silently.','2026-05-29 14:00+00','2026-05-29','2026-05-29 14:00+00',FALSE,7.5,'Exemplary incident ownership with preventative follow-through.',7.5,'agree','STABLE','mgr-cc-tech'),
 ('rep-emp-cc-09-w4','goal-cc-tech','emp-cc-09','Drove the cross-team fix for the billing-sync defect. Facilitated the alignment note and unblocked three dependencies. Repeat contacts on that issue started falling.','2026-06-05 14:00+00','2026-06-05','2026-06-05 14:00+00',FALSE,7.8,'Strong cross-team ownership and communication on a messy issue.',7.8,'agree','STABLE','mgr-cc-tech'),
 ('rep-emp-cc-09-w5','goal-cc-tech','emp-cc-09','Billing-sync fix rolled out with a clean customer-facing explainer. Ran a brown-bag on the approach for the whole support floor. FCR 89%.','2026-06-12 14:00+00','2026-06-12','2026-06-12 14:00+00',FALSE,8.0,'High-impact resolution plus knowledge-sharing that lifts the whole team.',8.0,'agree','STABLE','mgr-cc-tech'),
 ('rep-emp-cc-09-w6','goal-cc-tech','emp-cc-09','Reduced average diagnostic time on hardware cases by rewriting the triage macro. The team resolves those faster now. Documented the setup.','2026-06-19 14:00+00','2026-06-19','2026-06-19 14:00+00',FALSE,7.9,'A force-multiplier improvement with clear, quantified team-wide impact.',7.9,'agree','STABLE','mgr-cc-tech'),
 -- W7 & W8 submitted but NOT yet reviewed → show up under "Needs Review"
 ('rep-emp-cc-09-w7','goal-cc-tech','emp-cc-09','Prototyped a guided-diagnostic macro with Liam and benchmarked a 15% AHT saving on the top call type. Wrote it up and opened it for review. Handled two escalations for the team.','2026-06-26 14:00+00','2026-06-26','2026-06-26 14:00+00',FALSE,8.1,'Proactive efficiency work with rigorous benchmarking and a clear write-up.',NULL,NULL,'STABLE',NULL),
 ('rep-emp-cc-09-w8','goal-cc-tech','emp-cc-09','Rolled the guided-diagnostic macro to a pilot group; early numbers confirm the ~15% AHT saving. Closed the quarter with zero reopened escalations on my desk. Drafted next quarter''s KB plan.','2026-07-03 14:00+00','2026-07-03','2026-07-03 14:00+00',FALSE,8.2,'Delivered the efficiency win and set direction for next quarter. Excellent, sustained.',NULL,NULL,'STABLE',NULL);

-- ── HERO 7 · Sophia Martinez (Outbound) — RECOVERY ARC: dip at W3-W4 then rebound ──
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, submitted_for_date, submitted_at, is_backdated, evaluation_score, evaluation_reasoning, manager_overall_score, manager_calibration, manager_override_reasoning, manager_feedback, consistency_flag, consistency_note, reviewed_by) VALUES
 ('rep-emp-cc-21-w1','goal-cc-outbound','emp-cc-21','320 dials, 74 connects, 11 qualified sales. Conversion 15% on connects — clean, compliant calls with tidy disposition codes end to end.','2026-05-15 14:00+00','2026-05-15','2026-05-15 14:00+00',FALSE,7.4,'Strong week with real conversion and disciplined call handling.',7.4,'agree',NULL,NULL,'STABLE',NULL,'mgr-cc-outbound'),
 ('rep-emp-cc-21-w2','goal-cc-outbound','emp-cc-21','300 dials, 70 connects, 10 sales. A/B tested two openers; the winner lifted connect-to-pitch rate 8 points. Logged the result for the team.','2026-05-22 14:00+00','2026-05-22','2026-05-22 14:00+00',FALSE,7.1,'Good conversion and a clean experiment with a measured result.',7.1,'agree',NULL,NULL,'STABLE',NULL,'mgr-cc-outbound'),
 ('rep-emp-cc-21-w3','goal-cc-outbound','emp-cc-21','Tough week — the new lead list underperformed, conversion fell to 7% and I was slow to spot it. Spent the back half diagnosing. List quality looks like the cause.','2026-05-29 14:00+00','2026-05-29','2026-05-29 14:00+00',FALSE,6.2,'A real dip with slow detection, but honest ownership and a plausible root cause.',6.2,'agree',NULL,'Rough week happens — the honest diagnosis is what matters. Let''s fix the feedback loop.','STABLE',NULL,'mgr-cc-outbound'),
 ('rep-emp-cc-21-w4','goal-cc-outbound','emp-cc-21','Still working through the list issue. Swapped to a warmer segment and refreshed the script but results are lagging. Not much to show yet — mostly firefighting this week.','2026-06-05 14:00+00','2026-06-05','2026-06-05 14:00+00',FALSE,5.6,'Trough week — actions are reasonable but outcomes are thin and the report is light on specifics.',5.9,'adjusted_up','Score nudged up: the corrective actions are sound and I''d rather reward the right process during a dip than punish it.','You''re doing the right things — hold the line, the warmer segment needs a week to breathe.','STAGNANT_LANGUAGE','Two consecutive weeks describing the same list problem with similar framing; watch for it becoming a rut.','mgr-cc-outbound'),
 ('rep-emp-cc-21-w5','goal-cc-outbound','emp-cc-21','New segment worked — conversion back to 13% and 12 sales this week. Built a daily performance check so a bad list gets caught within a shift next time.','2026-06-12 14:00+00','2026-06-12','2026-06-12 14:00+00',FALSE,6.3,'Clear recovery plus a process fix that addresses the root cause of the dip.',6.3,'agree',NULL,NULL,'STABLE',NULL,'mgr-cc-outbound'),
 ('rep-emp-cc-21-w6','goal-cc-outbound','emp-cc-21','Fully recovered — 16 sales, best week of the quarter, conversion 18%. The daily check already flagged one weak list early and I switched it out same-day.','2026-06-19 14:00+00','2026-06-19','2026-06-19 14:00+00',FALSE,7.0,'Back to strong output and the new guardrail is already proving its worth.',7.0,'agree',NULL,NULL,'STABLE',NULL,'mgr-cc-outbound'),
 ('rep-emp-cc-21-w7','goal-cc-outbound','emp-cc-21','15 sales and cleanest QA scores of the quarter. Shared the list post-mortem with the team so the lesson scales beyond me.','2026-06-26 14:00+00','2026-06-26','2026-06-26 14:00+00',FALSE,7.6,'High output, quality calls, and turning a failure into team learning.',7.6,'agree',NULL,NULL,'STABLE',NULL,'mgr-cc-outbound'),
 ('rep-emp-cc-21-w8','goal-cc-outbound','emp-cc-21','Closed the quarter at 112% of the sales target despite the mid-quarter dip. Documented the daily list-check as standard practice for the team. Strong finish.','2026-07-03 14:00+00','2026-07-03','2026-07-03 14:00+00',FALSE,8.0,'Full recovery to above-target, with durable process improvements banked.',8.0,'agree',NULL,'Textbook recovery. The way you handled the dip is exactly what I want to see.','STABLE',NULL,'mgr-cc-outbound');

-- ── HERO 8 · Lucas Wright (Retention) — STRUGGLING, MISSED periods W3/W6/W7, low scores, one mercy bump ──
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, submitted_for_date, submitted_at, is_backdated, evaluation_score, evaluation_reasoning, manager_overall_score, manager_calibration, manager_override_reasoning, manager_feedback, consistency_flag, reviewed_by) VALUES
 ('rep-emp-cc-16-w1','goal-cc-retention','emp-cc-16','Getting up to speed on the book. Made a few save calls but didn''t reach the two highest-risk cancellations. Struggling to prioritise across 40 accounts.','2026-05-15 14:00+00','2026-05-15','2026-05-15 14:00+00',FALSE,5.4,'Onboarding challenges are understandable, but the highest-risk cancellations were left untouched.',5.4,'agree',NULL,NULL,'STABLE','mgr-cc-retention'),
 ('rep-emp-cc-16-w2','goal-cc-retention','emp-cc-16','Reached one at-risk customer. The call went okay but I didn''t leave with a clear next step. Feeling underwater on volume.','2026-05-22 14:00+00','2026-05-22','2026-05-22 14:00+00',FALSE,5.2,'Some progress on risk, but no documented outcome and the workload is clearly overwhelming.',5.2,'agree',NULL,'Lucas, let''s cut your book to the top 20 accounts so you can go deep. Book time with me.','STABLE','mgr-cc-retention'),
 -- W3 MISSED (no report)
 ('rep-emp-cc-16-w4','goal-cc-retention','emp-cc-16','Book was trimmed to 20 accounts — big help. Reached all my top-5 risks and left each with a next step. First week I felt on top of it.','2026-06-05 14:00+00','2026-06-05','2026-06-05 14:00+00',FALSE,5.8,'The reduced scope is working; still early but real, evidenced progress on risks.',5.8,'agree',NULL,NULL,'STABLE','mgr-cc-retention'),
 ('rep-emp-cc-16-w5','goal-cc-retention','emp-cc-16','Saved an at-risk customer with a tailored offer — satisfaction up from 4 to 6. Still slow on logging notes but the save work is landing.','2026-06-12 14:00+00','2026-06-12','2026-06-12 14:00+00',FALSE,6.0,'A genuine save with a moved score — the clearest win yet, held back only by admin lag.',6.4,'adjusted_up','Score raised: a real save with a moved satisfaction score is exactly the outcome we want; weighting the result over the paperwork this week.','That save is the standard — nice work. Keep the momentum.','STABLE','mgr-cc-retention'),
 -- W6 & W7 MISSED (no reports)
 ('rep-emp-cc-16-w8','goal-cc-retention','emp-cc-16','Back after two rough weeks — I was overloaded and let reporting slip, which I own. Re-grounded on my top accounts and secured two saves worth £1.6k ARR. Setting a fixed Friday report time.','2026-07-03 14:00+00','2026-07-03','2026-07-03 14:00+00',FALSE,6.4,'Honest about the missed weeks and finished with two evidenced saves. Consistency is the next hurdle.',6.4,'agree',NULL,'Glad you''re back on track. The saves are great — now let''s make the weekly rhythm non-negotiable.','STABLE','mgr-cc-retention');

-- ── Legacy completed goal — a little Q1 history so the completed goal isn't empty ──
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, submitted_for_date, submitted_at, is_backdated, evaluation_score, evaluation_reasoning, manager_overall_score, manager_calibration, consistency_flag, reviewed_by) VALUES
 ('rep-emp-cc-08-legacy-1','goal-cc-tech-legacy','emp-cc-08','Took a chunk of the ticket backlog during the Q1 push. Cleared 120 aged tickets and fixed the underlying retry logic behind a recurring failure. FCR trending up.','2026-02-14 14:00+00','2026-02-14','2026-02-14 14:00+00',FALSE,6.2,'Solid contribution to the backlog effort with a real root-cause fix.',6.2,'agree','STABLE','mgr-cc-tech'),
 ('rep-emp-cc-08-legacy-2','goal-cc-tech-legacy','emp-cc-08','Wrote the first triage runbook and ran a practice session. Team handle time on the drill halved. Backlog down to single digits this month.','2026-03-14 14:00+00','2026-03-14','2026-03-14 14:00+00',FALSE,7.0,'Good hygiene work with a clear, measured improvement to resolution speed.',7.0,'agree','STABLE','mgr-cc-tech'),
 ('rep-emp-cc-09-legacy-1','goal-cc-tech-legacy','emp-cc-09','Led the Q1 backlog push. Drove FCR from 71% to 84% by fixing the top two failure modes and adding a triage macro. Established the escalation rotation.','2026-02-14 14:00+00','2026-02-14','2026-02-14 14:00+00',FALSE,8.4,'Outstanding leadership of the initiative with a dramatic, quantified FCR gain.',8.4,'agree','STABLE','mgr-cc-tech'),
 ('rep-emp-cc-09-legacy-2','goal-cc-tech-legacy','emp-cc-09','Closed out the push: backlog cleared, FCR steady at 84%, and the triage runbook adopted team-wide. Handed the rotation to the team cleanly.','2026-03-14 14:00+00','2026-03-14','2026-03-14 14:00+00',FALSE,8.7,'Landed the initiative with durable process — model execution.',8.7,'agree','STABLE','mgr-cc-tech');

-- ============================================================================
-- 8. SUPPORTING CAST — 22 agents, generated weekly reports with an upward ramp.
--    Text drawn from realistic contact-centre templates; scores rise gently week
--    over week so the org-wide cumulative trend is clearly POSITIVE. A few end with
--    an unreviewed latest week (pend=TRUE) to add to the "Needs Review" queue.
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
    'Steady week on the phones. Hit CSAT target, kept AHT under standard, and logged clean notes on every contact. Carried one escalation into next week with a clear owner.',
    'Solid week against the goal. FCR above target, tightened the handoff to Tier-2, and documented a recurring issue so it is faster next time. Flagged one risk early.',
    'Good progress. Handle time down and quality up, applied the coaching from last review, and pair-listened with a newer teammate to level up their calls.',
    'Productive week on queue. Cleared my share of volume with evidence, tried a new opener, and shared the result with the team. One dependency still open.',
    'Delivered the week''s target and caught a compliance gap before it shipped. Wrote up the fix so others avoid it. Momentum is building on my scores.',
    'Focused week. Advanced the top priority with measurable movement in CSAT and kept the lead updated proactively. Nothing blocked going into next week.',
    'Hit target and helped a teammate close out a tricky complaint. Kept the update specific and honest — including the one call that slipped.',
    'Strong week. Above target on CSAT and FCR, improved a recurring wrap-up step, and left clear next steps. The change I tried last week is paying off.',
    'Real progress with numbers to back it. Reviewed two teammates'' call notes and gave useful feedback. On track for the month.',
    'Good week — cleared volume, documented a fix, and surfaced a risk with a plan attached. Building a more consistent rhythm on reporting.',
    'Met the week''s goal and pushed one improvement ahead of schedule. Tightened how I report so outcomes are easier to see. Good trajectory.',
    'Reliable week. Handled volume, unblocked others, and closed the loop on last week''s open item. Small lift in the metric I''ve been tracking.'
  ];
BEGIN
  -- (agent, team-goal, baseline score, weeks reported, pend=latest-week-unreviewed)
  FOR emp IN SELECT * FROM (VALUES
      ('emp-cc-03','goal-cc-inbound',   6.4::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-cc-04','goal-cc-inbound',   6.9::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-cc-05','goal-cc-inbound',   6.1::numeric, ARRAY[1,2,4,5,6,7,8],   FALSE),
      ('emp-cc-06','goal-cc-inbound',   7.0::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-cc-07','goal-cc-inbound',   5.9::numeric, ARRAY[2,3,4,5,6,7,8],   FALSE),
      ('emp-cc-10','goal-cc-tech',      6.6::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-cc-11','goal-cc-tech',      6.3::numeric, ARRAY[1,2,3,4,5,6,7,8], TRUE),
      ('emp-cc-12','goal-cc-tech',      7.4::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-cc-13','goal-cc-tech',      6.0::numeric, ARRAY[1,2,3,4,5],       FALSE),
      ('emp-cc-14','goal-cc-tech',      6.7::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-cc-17','goal-cc-retention', 6.8::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-cc-18','goal-cc-retention', 6.2::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-cc-19','goal-cc-retention', 6.5::numeric, ARRAY[1,2,3,4,5,6,7,8], TRUE),
      ('emp-cc-20','goal-cc-retention', 6.0::numeric, ARRAY[1,3,4,5,6,7,8],   FALSE),
      ('emp-cc-22','goal-cc-outbound',  6.7::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-cc-23','goal-cc-outbound',  6.4::numeric, ARRAY[1,2,3,4,5,6,7,8], TRUE),
      ('emp-cc-24','goal-cc-outbound',  7.1::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-cc-25','goal-cc-outbound',  6.2::numeric, ARRAY[2,3,4,5,6,7,8],   FALSE),
      ('emp-cc-27','goal-cc-qa',        7.2::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-cc-28','goal-cc-qa',        6.6::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-cc-29','goal-cc-qa',        6.9::numeric, ARRAY[1,2,3,4,5,6,7,8], FALSE),
      ('emp-cc-30','goal-cc-qa',        6.1::numeric, ARRAY[5,6,7,8],         FALSE)  -- recent joiner: only latter weeks
    ) AS t(eid, gid, base, weeks, pend)
  LOOP
    v_eid  := emp.eid;
    v_gid  := emp.gid;
    v_base := emp.base;
    w_arr  := emp.weeks;
    v_pend := emp.pend;
    v_mgr  := CASE v_gid
               WHEN 'goal-cc-inbound'   THEN 'mgr-cc-inbound'
               WHEN 'goal-cc-tech'      THEN 'mgr-cc-tech'
               WHEN 'goal-cc-retention' THEN 'mgr-cc-retention'
               WHEN 'goal-cc-outbound'  THEN 'mgr-cc-outbound'
               ELSE 'mgr-cc-qa' END;
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
-- 9a — submitted periods for every call-centre report on a weekly goal
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT id, goal_id, employee_id, submitted_for_date, is_backdated
    FROM reports
    WHERE goal_id LIKE 'goal-cc-%' AND goal_id <> 'goal-cc-tech-legacy'
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
 ('rp-cc-missed-16-w3','goal-cc-retention','emp-cc-16','2026-05-25 00:00+00','2026-05-29 23:59+00','missed',FALSE,FALSE),
 ('rp-cc-missed-16-w6','goal-cc-retention','emp-cc-16','2026-06-15 00:00+00','2026-06-19 23:59+00','missed',FALSE,FALSE),
 ('rp-cc-missed-16-w7','goal-cc-retention','emp-cc-16','2026-06-22 00:00+00','2026-06-26 23:59+00','missed',FALSE,FALSE),
 ('rp-cc-excused-26-w5','goal-cc-qa','emp-cc-26','2026-06-08 00:00+00','2026-06-12 23:59+00','excused',FALSE,FALSE),
 ('rp-cc-excused-26-w6','goal-cc-qa','emp-cc-26','2026-06-15 00:00+00','2026-06-19 23:59+00','excused',FALSE,FALSE);

-- 9c — PENDING upcoming week (2026-07-06 → 2026-07-10) for a handful of active agents
INSERT INTO reporting_periods (id, goal_id, employee_id, period_start, period_end, status) VALUES
 ('rp-cc-pending-01','goal-cc-inbound',  'emp-cc-01','2026-07-06 00:00+00','2026-07-10 23:59+00','pending'),
 ('rp-cc-pending-08','goal-cc-tech',     'emp-cc-08','2026-07-06 00:00+00','2026-07-10 23:59+00','pending'),
 ('rp-cc-pending-09','goal-cc-tech',     'emp-cc-09','2026-07-06 00:00+00','2026-07-10 23:59+00','pending'),
 ('rp-cc-pending-15','goal-cc-retention','emp-cc-15','2026-07-06 00:00+00','2026-07-10 23:59+00','pending'),
 ('rp-cc-pending-21','goal-cc-outbound', 'emp-cc-21','2026-07-06 00:00+00','2026-07-10 23:59+00','pending'),
 ('rp-cc-pending-26','goal-cc-qa',       'emp-cc-26','2026-07-06 00:00+00','2026-07-10 23:59+00','pending');

-- ============================================================================
-- 10. GOAL FREQUENCY ANCHORS — one active weekly anchor per (agent, goal)
-- ============================================================================
DO $$
DECLARE a RECORD;
BEGIN
  FOR a IN
    SELECT DISTINCT employee_id, goal_id FROM reports
    WHERE goal_id LIKE 'goal-cc-%' AND goal_id <> 'goal-cc-tech-legacy'
  LOOP
    INSERT INTO goal_frequency_anchors (id, goal_id, employee_id, frequency, anchor_date, is_active)
    VALUES ('gfa-' || a.employee_id || '-' || a.goal_id, a.goal_id, a.employee_id, 'weekly', '2026-05-11 00:00+00', TRUE)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ============================================================================
-- 11. REPORT CRITERION SCORES — 6 per report, generated from the report's score.
--    Per-agent/criterion bias gives each person a distinct, stable skill shape
--    (so the radar has real peaks and valleys); per-report jitter keeps it lifelike.
-- ============================================================================
DO $$
DECLARE
  r RECORD;
  nm TEXT;
  v_score NUMERIC;
  v_bias NUMERIC;
  v_reason TEXT;
  v_evidence TEXT;
  crit TEXT[] := ARRAY['Resolution & FCR','Call Quality & Compliance','Productivity','Customer Experience','Communication','Growth & Coaching'];
BEGIN
  FOR r IN SELECT id, employee_id, evaluation_score FROM reports WHERE goal_id LIKE 'goal-cc-%' LOOP
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
 ('leave-cc-1','emp-cc-26','org-cc','2026-06-08','2026-06-19','vacation','Pre-planned two-week vacation; handoff completed before leave.','mgr-cc-qa','2026-05-20 09:00+00'),
 ('leave-cc-2','emp-cc-17','org-cc','2026-06-24','2026-06-26','sick','Out sick for three days.','mgr-cc-retention','2026-06-24 08:00+00'),
 ('leave-cc-3','emp-cc-05','org-cc','2026-07-01','2026-07-02','personal','Personal days approved.','mgr-cc-inbound','2026-06-25 10:00+00');

-- ============================================================================
-- 13. INVITATIONS  (pending / accepted / expired — one of each)
-- ============================================================================
INSERT INTO invitations (id, token, email, role, organization_id, invited_by, invited_at, expires_at, accepted_at, status, initial_project_ids, initial_manager_id, permission_template) VALUES
 ('inv-cc-1','tok-cc-pending-8f3a1c','jordan.lee@vantage.example','employee','org-cc','mgr-cc-inbound','2026-07-02 09:00+00','2026-07-16 09:00+00',NULL,'pending',ARRAY['proj-cc-inbound'],'mgr-cc-inbound','standard_employee'),
 ('inv-cc-2','tok-cc-accepted-2b7d9e','taylor.moss@vantage.example','employee','org-cc','mgr-cc-qa','2026-05-28 09:00+00','2026-06-11 09:00+00','2026-05-30 14:20+00','accepted',ARRAY['proj-cc-qa'],'mgr-cc-qa','standard_employee'),
 ('inv-cc-3','tok-cc-expired-5c1f04','sam.rivera@vantage.example','manager','org-cc','mgr-cc-tech','2026-05-15 09:00+00','2026-05-29 09:00+00',NULL,'expired',ARRAY['proj-cc-tech'],NULL,'manager');

-- ============================================================================
-- 14. FINAL STEP — bring rezahasan1198@gmail.com into the call-centre org as
--     ACCOUNT OWNER, top the org chart, and drop a few curated notifications.
--     (RLS shows you only your own org, so this makes the demo visible on sign-in.)
-- ============================================================================
WITH target AS (
  SELECT id FROM employees WHERE email = 'rezahasan1198@gmail.com' ORDER BY created_at ASC LIMIT 1
)
UPDATE employees e SET
  organization_id      = 'org-cc',
  role                 = 'manager',
  is_account_owner     = TRUE,
  onboarding_completed = TRUE,
  is_active            = TRUE,
  manager_id           = NULL,
  title                = COALESCE(NULLIF(e.title, ''), 'Operations Director'),
  dept                 = COALESCE(NULLIF(e.dept, ''), 'Leadership')
FROM target
WHERE e.id = target.id;

-- Ensure the owner has full permissions + weekly settings
INSERT INTO employee_permissions (employee_id, can_set_global_frequency, can_view_organization_wide, can_manage_settings, can_create_projects, can_create_goals, can_override_ai_scores, can_invite_users)
SELECT id, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE FROM employees WHERE email = 'rezahasan1198@gmail.com'
ON CONFLICT (employee_id) DO UPDATE SET
  can_view_organization_wide = TRUE, can_manage_settings = TRUE, can_override_ai_scores = TRUE, can_invite_users = TRUE;

INSERT INTO manager_settings (manager_id, global_frequency, report_frequency, allow_late_submissions, backdate_limit_days, grace_period_days)
SELECT id, TRUE, 'weekly', TRUE, 7, 1 FROM employees WHERE email = 'rezahasan1198@gmail.com'
ON CONFLICT (manager_id) DO NOTHING;

-- The five team leads now report to the owner (top of the org chart)
UPDATE employees SET manager_id = (SELECT id FROM employees WHERE email = 'rezahasan1198@gmail.com' ORDER BY created_at ASC LIMIT 1)
WHERE id LIKE 'mgr-cc-%';

-- Curated notifications for the owner (link_url carries a sentinel so cleanup is idempotent)
INSERT INTO notifications (user_id, type, title, message, link_url, is_read, created_at)
SELECT e.id, n.type, n.title, n.message, n.link_url, n.is_read, n.created_at
FROM employees e
CROSS JOIN (VALUES
  ('performance','Score decline flagged','Noah Patel''s score has dropped for four straight weeks and a £2.1k customer cancelled. Review recommended.','/employees/emp-cc-15?seed=callcentre', FALSE, TIMESTAMPTZ '2026-07-03 15:10+00'),
  ('alert','Missed reporting periods','Lucas Wright missed three reporting periods this quarter. He is now back on track.','/employees/emp-cc-16?seed=callcentre', FALSE, TIMESTAMPTZ '2026-07-03 15:05+00'),
  ('info','Reports awaiting review','You have several submitted reports from this week awaiting your review.','/reports?seed=callcentre', FALSE, TIMESTAMPTZ '2026-07-04 08:30+00'),
  ('team_update','New team member','Isabelle Young has joined the Quality & Training team.','/employees/emp-cc-30?seed=callcentre', TRUE, TIMESTAMPTZ '2026-06-01 09:00+00'),
  ('performance','Standout performer','Amara Okafor finished the quarter at 95% average CSAT — top of the floor.','/employees/emp-cc-01?seed=callcentre', TRUE, TIMESTAMPTZ '2026-07-03 16:00+00')
) AS n(type, title, message, link_url, is_read, created_at)
WHERE e.email = 'rezahasan1198@gmail.com';

COMMIT;

-- ============================================================================
-- DONE. Sign in as rezahasan1198@gmail.com on the DEV app to see Vantage Contact Centre.
--   • Dashboard: positive 8-week team trend, KPI cards, recent activity, team skills
--   • Agents:    30 people with photo avatars, avg scores, sparkline trends
--   • Reports:   reviewed / awaiting-review / late / missed / excused rows
--   • Drill-in:  Amara (star), Liam (turnaround), Noah (at-risk), Mia (on-leave)
--   • Upload:    Submit page → e.g. "Q2 Technical Resolution Quality" → period Jul 6–10
--                (open agents: Liam Chen, Olivia Garcia)
-- ============================================================================
