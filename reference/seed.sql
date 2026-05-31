-- ============================================================================
-- ZEVIAN SKILL CHART SEED v2 — 6 Criteria, 8 Reports Per Employee
-- ============================================================================
-- Employee 1: emp-1776594291863-603  Richard James  (Starts Poor → Improves)
-- Employee 2: emp-1776593757624-970  Sarah Adams    (Starts Poor → Peaks → Declines)
-- Manager:    emp-vkx0ehh
-- Project:    proj-dxh724s
-- ============================================================================

-- ============================================================================
-- CLEANUP — two passes:
--   Pass 1: wipe ALL goals in proj-dxh724s (catches old seeds in this project)
--   Pass 2: wipe ALL reports + reporting_periods for Richard and Sarah
--            across EVERY goal/project (catches leftover data from other goals)
-- ============================================================================

-- ── Pass 1: everything in proj-dxh724s ──────────────────────────────────────
DELETE FROM report_criterion_scores
WHERE report_id IN (
  SELECT r.id FROM reports r
  JOIN goals g ON r.goal_id = g.id
  WHERE g.project_id = 'proj-dxh724s'
);
DELETE FROM reporting_periods
WHERE goal_id IN (SELECT id FROM goals WHERE project_id = 'proj-dxh724s');
DELETE FROM reports
WHERE goal_id IN (SELECT id FROM goals WHERE project_id = 'proj-dxh724s');
DELETE FROM goal_assignees
WHERE goal_id IN (SELECT id FROM goals WHERE project_id = 'proj-dxh724s');
DELETE FROM criteria
WHERE goal_id IN (SELECT id FROM goals WHERE project_id = 'proj-dxh724s');
DELETE FROM goals WHERE project_id = 'proj-dxh724s';

-- ── Pass 2: all leftover data for the two demo employees (any project) ───────
DELETE FROM report_criterion_scores
WHERE report_id IN (
  SELECT id FROM reports
  WHERE employee_id IN ('emp-1776594291863-603','emp-1776593757624-970')
);
DELETE FROM reporting_periods
WHERE employee_id IN ('emp-1776594291863-603','emp-1776593757624-970');
DELETE FROM reports
WHERE employee_id IN ('emp-1776594291863-603','emp-1776593757624-970');

-- ============================================================================
-- GOAL
-- ============================================================================
INSERT INTO goals (id, name, project_id, instructions, manager_id, created_by, deadline, status)
VALUES (
  'goal-demo-skill-002',
  'SDR Skill Dimension Radar — Weekly Assessment',
  'proj-dxh724s',
  'Score each SDR weekly report across six skill dimensions. Prospecting Quality: does the rep target the right accounts using a defined filter or trigger signal? Objection Handling: does the rep name specific objections, describe their response, and report an outcome? Pipeline Progression: are meetings booked and followed up with evidence and numbers? Process Adherence: is the full outreach sequence — call, email, LinkedIn — completed consistently and on schedule? Self-Awareness and Improvement: does the rep diagnose what is not working and define a specific, testable change? Communication Clarity: are written messages concise, specific, and free of filler? Each dimension is scored on evidence in the report only. Vague claims score below 7.0. Specific outcomes with numbers score above 8.5.',
  'emp-vkx0ehh',
  'emp-vkx0ehh',
  '2026-06-30',
  'active'
);

-- ============================================================================
-- CRITERIA
-- ============================================================================
INSERT INTO criteria (id, goal_id, name, weight, display_order) VALUES
  ('crit-s2-pq', 'goal-demo-skill-002', 'Prospecting Quality',         25, 1),
  ('crit-s2-oh', 'goal-demo-skill-002', 'Objection Handling',           20, 2),
  ('crit-s2-pp', 'goal-demo-skill-002', 'Pipeline Progression',         20, 3),
  ('crit-s2-pa', 'goal-demo-skill-002', 'Process Adherence',            15, 4),
  ('crit-s2-sa', 'goal-demo-skill-002', 'Self-Awareness & Improvement', 10, 5),
  ('crit-s2-cc', 'goal-demo-skill-002', 'Communication Clarity',        10, 6);

-- ============================================================================
-- ASSIGNEES
-- ============================================================================
INSERT INTO goal_assignees (goal_id, assignee_id, assignee_type) VALUES
  ('goal-demo-skill-002', 'emp-1776594291863-603', 'employee'),
  ('goal-demo-skill-002', 'emp-1776593757624-970',  'employee')
ON CONFLICT (goal_id, assignee_id) DO NOTHING;

-- ============================================================================
-- EMPLOYEE 1: RICHARD JAMES — IMPROVING TREND: 5.93→6.28→6.88→7.13→7.55→7.88→8.18→8.30
-- reviewed_by set → already reviewed, no action needed from manager
-- ============================================================================

-- W1 (5.93)
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, evaluation_score, evaluation_reasoning, reviewed_by) VALUES (
  'rep-s2-e1-w1', 'goal-demo-skill-002', 'emp-1776594291863-603',
  'Reached out to a broad range of software companies this week. No specific filter — just companies that seemed active on LinkedIn. Made 55 dials, connected with 9, booked 1 meeting.

On calls I am picking up patterns. The main pushback was "we are already covered." I responded by asking how they were measuring rep quality and two people engaged with that question. One ended there, one said they would think about it. No booking from it yet but the angle felt right.

Missed the email follow-up on 4 connects and did not do LinkedIn on most of them. I know the sequence is important but I ran out of time.

Emails I sent were long — tried to explain the product. Got no replies on those.

Next week: I noticed the question about rep quality keeps people talking. Going to use it every time that objection comes up.',
  '2026-02-17 09:00:00+00', 5.93,
  'Prospecting is unfocused — no ICP filter, broad list, low connect rate. Objection handling shows raw instinct: a diagnostic question was identified and tested. Pipeline thin at 1 meeting. Process adherence poor — email and LinkedIn steps missed on most connects. Self-awareness present but early — noticed a pattern and committed to testing it. Communication quality low — long product-explanation emails with no replies.',
  'emp-vkx0ehh'
);
INSERT INTO report_criterion_scores (report_id, criterion_name, score, reasoning, evidence) VALUES
  ('rep-s2-e1-w1','Prospecting Quality',         5.5,'No ICP filter. "Seemed active on LinkedIn" is not a repeatable targeting system.','55 dials. Broad software companies. No size, stage, or trigger criteria.'),
  ('rep-s2-e1-w1','Objection Handling',           7.0,'Identified a diagnostic question instinctively. Two prospects engaged. No meeting yet but the approach has signal.','Rep quality question tested. 2 engaged, 0 meetings from it. Pattern recognised.'),
  ('rep-s2-e1-w1','Pipeline Progression',         6.0,'1 meeting from 9 connects. Low output. No follow-up on prior pipeline noted.','1 meeting from 9 connects. 55 dials.'),
  ('rep-s2-e1-w1','Process Adherence',            5.0,'Email missed on 4 connects. LinkedIn skipped on most. Sequence incomplete on majority of connects.','4 emails missed. LinkedIn not done on most. "Ran out of time" cited.'),
  ('rep-s2-e1-w1','Self-Awareness & Improvement', 7.0,'Spotted a live pattern mid-week and committed to using it next week. Early but real.','Rep quality question noticed as effective. Plan: use it every time objection comes up.'),
  ('rep-s2-e1-w1','Communication Clarity',        5.0,'Long product-explanation emails. Zero replies. Wrong format for cold outreach.','Long emails explaining product. No replies received.');

-- W2 (6.28)
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, evaluation_score, evaluation_reasoning, reviewed_by) VALUES (
  'rep-s2-e1-w2', 'goal-demo-skill-002', 'emp-1776594291863-603',
  'Similar list to last week — pulled more software and IT companies without a specific filter. Made 58 dials, connected with 11, booked 2 meetings.

Used the rep quality question on the "already covered" objection 4 times. Two people gave detailed answers about gaps in their current setup. Both became meetings. The other two ended the call. 50% conversion on that objection is meaningful.

Still missing process steps. Did the email follow-up on 7 of 11 connects but LinkedIn on only 4. Sequence discipline is my weak point.

Emails are still too long. One connect replied saying "too much info upfront." That was useful feedback.

Next week: going to cut emails to 3 sentences maximum. The rep quality question is working — going to develop a follow-up question for when they give a vague answer.',
  '2026-02-24 09:00:00+00', 6.28,
  'Prospecting still unfocused. Objection handling improved: rep quality question used consistently, 2 of 4 converted to meetings — 50% rate. Pipeline better at 2 meetings. Process adherence still poor with LinkedIn steps mostly missed. Self-awareness growing: received external feedback and committed to a specific change. Communication quality still poor — long emails acknowledged explicitly.',
  'emp-vkx0ehh'
);
INSERT INTO report_criterion_scores (report_id, criterion_name, score, reasoning, evidence) VALUES
  ('rep-s2-e1-w2','Prospecting Quality',         5.5,'Same broad approach. No filter introduced despite two weeks of low connect rates.','58 dials. Software and IT companies. No ICP filter.'),
  ('rep-s2-e1-w2','Objection Handling',           7.5,'Rep quality question used consistently. 50% conversion rate on primary objection. Follow-up question being developed.','4 objections → 2 meetings, 2 losses. Rep quality question used each time.'),
  ('rep-s2-e1-w2','Pipeline Progression',         7.0,'2 meetings from 11 connects. Improvement from last week. Objection handling driving meetings.','2 meetings from 11 connects.'),
  ('rep-s2-e1-w2','Process Adherence',            5.0,'Email done on 7 of 11. LinkedIn on 4. Sequence incomplete on majority.','7/11 emails. 4/11 LinkedIn steps. Pattern continuing.'),
  ('rep-s2-e1-w2','Self-Awareness & Improvement', 7.5,'External feedback received and acted on. Specific change committed to. Follow-up question being developed.','Prospect feedback: "too much info upfront." Plan: 3-sentence max. Follow-up question in development.'),
  ('rep-s2-e1-w2','Communication Clarity',        5.0,'Long emails acknowledged as a problem. Specific feedback from prospect confirms it. No change yet this week.','Prospect called out email length. Long format continued this week.');

-- W3 (6.88)
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, evaluation_score, evaluation_reasoning, reviewed_by) VALUES (
  'rep-s2-e1-w3', 'goal-demo-skill-002', 'emp-1776594291863-603',
  'Tried something new on targeting: searched LinkedIn for companies that posted a "Head of Sales" role. Theory is they are building a sales function and probably struggling with rep quality. Found 30 accounts that way. Mixed the rest of the list with broad software companies.

Made 62 dials, connected with 13, booked 3 meetings. Two meetings came from the job-posting accounts.

Objections: used the rep quality question again. Added a follow-up: when they say "it is fine," I asked "what does fine actually look like week to week?" That kept two people talking longer. One became a meeting. Total: 3 of 6 objections converted to meetings.

Cut emails to 3 sentences. Reply rate improved — two people responded positively to message format.

Sequence: email on 8 of 13, LinkedIn on 6. Still missing steps but slightly better.

Next week: going to run only job-posting accounts. Want to see if the conversion rate holds without the broad list.',
  '2026-03-03 09:00:00+00', 6.88,
  'Prospecting shows first improvement — job-posting trigger signal identified and tested. Objection handling stronger with a developed follow-up question; 3 of 6 converted. Pipeline best week yet at 3 meetings. Process adherence slightly improved but still inconsistent. Communication quality improving — shorter emails producing replies. Self-awareness high: committed to a controlled test of the trigger signal next week.',
  'emp-vkx0ehh'
);
INSERT INTO report_criterion_scores (report_id, criterion_name, score, reasoning, evidence) VALUES
  ('rep-s2-e1-w3','Prospecting Quality',         6.0,'First trigger signal introduced — job-posting filter. 30 accounts from it. Two meetings from that segment.','30 job-posting accounts. 2 of 3 meetings came from that segment. Broad list mixed in.'),
  ('rep-s2-e1-w3','Objection Handling',           8.0,'Two-question sequence now in use. 3 of 6 objections converted — 50% rate. Follow-up question added this week.','6 objections → 3 meetings. "What does fine look like week to week?" added.'),
  ('rep-s2-e1-w3','Pipeline Progression',         8.0,'3 meetings — strongest week. Job-posting segment contributing. Objection sequence driving volume.','3 meetings from 13 connects. 2 from job-posting accounts.'),
  ('rep-s2-e1-w3','Process Adherence',            5.5,'8 of 13 emails. 6 of 13 LinkedIn. Slight improvement but more than half of sequences still incomplete.','8/13 emails. 6/13 LinkedIn. Improving slowly.'),
  ('rep-s2-e1-w3','Self-Awareness & Improvement', 8.0,'Designed a controlled test: next week only job-posting accounts. Specific hypothesis. Testable.','Plan: job-posting accounts only next week. Wants to see if conversion rate holds without broad list.'),
  ('rep-s2-e1-w3','Communication Clarity',        5.5,'3-sentence format introduced. Two positive replies on format. Improvement noted but still not consistent.','2 positive replies on email format. 3-sentence rule applied. Not yet fully consistent.');

-- W4 (7.13)
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, evaluation_score, evaluation_reasoning, reviewed_by) VALUES (
  'rep-s2-e1-w4', 'goal-demo-skill-002', 'emp-1776594291863-603',
  'Ran only job-posting accounts this week. Pulled 40 companies with a VP Sales or Head of Sales opening. Made 65 dials, connected with 14, booked 3 meetings. All three from the job-posting list. Conversion rate held without the broad list — the trigger signal is real.

Objections: "already have someone" came up 7 times. Used the two-question sequence. Four became meetings or callbacks. Three ended. I tracked each one — the ones that ended were companies that had just hired someone in the last 30 days. That timing matters. Need to filter for companies where the role has been open longer.

Sequence: email on 9 of 14, LinkedIn on 6. Still the same gap. I have not fixed this.

Emails shorter this week but one was still too long. Most were 3 sentences.

Next week: add a filter to exclude companies where the role was posted in the last 30 days. Testing the timing hypothesis.',
  '2026-03-10 09:00:00+00', 7.13,
  'Prospecting improving but still one-dimensional — job-posting filter confirmed but no secondary refinement yet. Objection handling strong: 7 instances tracked individually with analysis of which ended and why. Pipeline solid at 3 meetings. Process adherence unchanged — same gap for four weeks. Self-awareness at strength level: identified a timing variable and designed a test. Communication slightly better but inconsistent.',
  'emp-vkx0ehh'
);
INSERT INTO report_criterion_scores (report_id, criterion_name, score, reasoning, evidence) VALUES
  ('rep-s2-e1-w4','Prospecting Quality',         6.0,'Job-posting filter confirmed. All 3 meetings from it. Single-dimensional ICP — no secondary filter yet.','40 job-posting accounts. 65 dials. 3 meetings all from filtered list.'),
  ('rep-s2-e1-w4','Objection Handling',           8.5,'7 objections tracked individually. Identified timing variable — recent hires end the call. Actionable insight derived.','7 objections: 4 meetings/callbacks, 3 losses. Losses correlated with recently-filled roles.'),
  ('rep-s2-e1-w4','Pipeline Progression',         8.5,'3 meetings from 14 connects. All ICP-matched. Conversion rate holding without broad list padding.','3 meetings from 14 connects. No broad list included.'),
  ('rep-s2-e1-w4','Process Adherence',            5.5,'9 of 14 emails. 6 of 14 LinkedIn. Same adherence level as last two weeks. No structural change made.','9/14 emails. 6/14 LinkedIn. Pattern unchanged for 4 weeks.'),
  ('rep-s2-e1-w4','Self-Awareness & Improvement', 8.5,'Derived a timing hypothesis from objection analysis. Designed a filter to test it. Specific and executable.','Roles posted in last 30 days correlate with losses. Plan: exclude them next week.'),
  ('rep-s2-e1-w4','Communication Clarity',        5.5,'Most emails 3 sentences. One overlength. Slight improvement but not yet consistent.','Most emails 3 sentences. One still too long. Inconsistent.');

-- W5 (7.55)
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, evaluation_score, evaluation_reasoning, reviewed_by) VALUES (
  'rep-s2-e1-w5', 'goal-demo-skill-002', 'emp-1776594291863-603',
  'Added the timing filter this week — excluded roles posted in the last 30 days. Narrowed the list to 28 companies but all were better fits. Made 60 dials, connected with 13, booked 4 meetings. Best conversion yet.

Objections: "already have someone" 5 times. Used the two-question sequence. Four became meetings. One said they hired last week — would have been filtered out next week. 80% conversion on that objection this week.

Also developed a new line for the timing objection: "what does their pipeline look like right now?" Two people answered with frustration about their current team. Both became meetings.

Sequence: email on 9 of 13, LinkedIn on 7. Still the same pattern. I have identified the fix — block 5pm Friday for LinkedIn — but have not done it yet.

Emails: 3 sentences on all but one. Reply rate up. One prospect said the message was "clear and direct."

Next week: implement the Friday LinkedIn block.',
  '2026-03-17 09:00:00+00', 7.55,
  'Prospecting improving: timing filter added, tighter list, better conversion. Objection handling excellent: 80% rate on primary objection, new question developed for secondary. Pipeline best week yet. Process adherence unchanged — the fix is known but not implemented. Self-awareness very high: identified the specific solution and committed to implementing it. Communication quality improving — one positive prospect comment.',
  'emp-vkx0ehh'
);
INSERT INTO report_criterion_scores (report_id, criterion_name, score, reasoning, evidence) VALUES
  ('rep-s2-e1-w5','Prospecting Quality',         6.5,'Timing filter added to job-posting criteria. Narrower list, better quality. Two ICP dimensions now.','28 accounts after timing filter. 4 meetings from 13 connects — strongest rate yet.'),
  ('rep-s2-e1-w5','Objection Handling',           9.0,'80% conversion on primary objection. New question developed for timing objection — 2 meetings from it.','5 primary objections → 4 meetings. Timing objection → 2 meetings from pipeline question.'),
  ('rep-s2-e1-w5','Pipeline Progression',         9.0,'4 meetings — best week. Two objection types both generating pipeline. ICP quality high.','4 meetings from 13 connects. All ICP-matched.'),
  ('rep-s2-e1-w5','Process Adherence',            5.5,'9 of 13 emails. 7 of 13 LinkedIn. Fix identified (Friday block) but not yet implemented. Fifth week of same gap.','9/13 emails. 7/13 LinkedIn. Fix known. Not done.'),
  ('rep-s2-e1-w5','Self-Awareness & Improvement', 9.0,'Specific fix identified, time-boxed, and committed to. Most actionable improvement plan yet.','Friday 5pm LinkedIn block identified as fix. Committed to implementing next week.'),
  ('rep-s2-e1-w5','Communication Clarity',        6.0,'All emails 3 sentences except one. Prospect called message "clear and direct" — first strong external validation.','3-sentence format applied. Prospect described message as "clear and direct."');

-- W6 (7.88)
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, evaluation_score, evaluation_reasoning, reviewed_by) VALUES (
  'rep-s2-e1-w6', 'goal-demo-skill-002', 'emp-1776594291863-603',
  'Implemented the Friday LinkedIn block. Did LinkedIn follow-up on 10 of 14 connects — best process week yet. Still not perfect but meaningful improvement.

Pulled 32 accounts using the job-posting and timing filter. Made 63 dials, connected with 14, booked 4 meetings.

Objections: primary objection came up 6 times. Five became meetings or callbacks using the two-question sequence. One ended — company had just promoted internally. The timing pipeline question converted 2 of 3 timing objections.

Emails: 3 sentences on all. No outliers this week. One prospect replied immediately — "exactly what I needed to hear."

Next week: looking at adding a third ICP dimension. Noticed that the meetings converting to demos are mostly from companies with 40–80 employees. Going to add that size filter.',
  '2026-03-24 09:00:00+00', 7.88,
  'Prospecting still two-dimensional but the rep is noticing a third signal. Objection handling excellent — high conversion across two objection types. Pipeline strong at 4 meetings. Process adherence improved for the first time — Friday block implemented. Self-awareness building a new hypothesis from demo conversion data. Communication quality consistent and producing external positive signals.',
  'emp-vkx0ehh'
);
INSERT INTO report_criterion_scores (report_id, criterion_name, score, reasoning, evidence) VALUES
  ('rep-s2-e1-w6','Prospecting Quality',         6.5,'Same two-dimension filter. Beginning to notice a third signal — company size from demo conversion data.','32 accounts. Job-posting and timing filter. 4 meetings from 14 connects.'),
  ('rep-s2-e1-w6','Objection Handling',           9.5,'5 of 6 primary objections converted. 2 of 3 timing objections converted. Two-question sequence working at high rate.','6 primary: 5 converted. 3 timing: 2 converted. One internal promotion loss.'),
  ('rep-s2-e1-w6','Pipeline Progression',         9.5,'4 meetings. Strong conversion. Quality high based on ICP filter. Objection sequence adding to volume.','4 meetings from 14 connects.'),
  ('rep-s2-e1-w6','Process Adherence',            6.0,'10 of 14 LinkedIn steps done — first meaningful improvement. Friday block working.','10/14 LinkedIn. Friday block implemented. First real adherence improvement.'),
  ('rep-s2-e1-w6','Self-Awareness & Improvement', 9.5,'Third ICP dimension identified from downstream data (demo conversion by company size). Hypothesis formed and will be tested.','40–80 employee companies converting to demos more often. Plan: add size filter next week.'),
  ('rep-s2-e1-w6','Communication Clarity',        6.0,'All emails 3 sentences. One immediate positive reply from prospect. Consistent quality maintained.','3-sentence format on all. One prospect replied immediately with positive signal.');

-- W7 (8.18)
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, evaluation_score, evaluation_reasoning, reviewed_by) VALUES (
  'rep-s2-e1-w7', 'goal-demo-skill-002', 'emp-1776594291863-603',
  'Added the 40–80 employee filter. 26 accounts this week — tight list. Made 58 dials, connected with 13, booked 5 meetings. Highest ever. Every single meeting from the three-filter list.

Objections: tracked all 8 instances. Six became meetings. One timing objection ended after the pipeline question — the person was clearly not a fit. One "no budget" came up for the first time. I asked what their current spend on rep management looked like. They gave a number. We are in a follow-up.

Process: email on 11 of 13, LinkedIn on 10 of 13. Holding the Friday block. Best adherence yet.

Emails: concise, specific, personalised. Three replies this week including one that booked a call directly from the email.

Next week: the no-budget objection needs a second question. Going to develop that. Also want to test whether the size filter is responsible for the demo conversion rate — need two more weeks of data.',
  '2026-03-31 09:00:00+00', 8.18,
  'Three-dimension ICP fully operational and producing best pipeline week yet. Objection handling exceptional — 6 of 8 converted, new objection type handled instinctively with a diagnostic question. Process adherence best week. Communication producing direct call bookings from email. Self-awareness operating at the highest level: tracking individual objection types, designing tests, building evidence-based hypotheses.',
  'emp-vkx0ehh'
);
INSERT INTO report_criterion_scores (report_id, criterion_name, score, reasoning, evidence) VALUES
  ('rep-s2-e1-w7','Prospecting Quality',         6.5,'Three-dimension ICP active: job-posting + timing + size filter. 5 meetings all from filtered list.','26 accounts. 58 dials, 13 connects, 5 meetings — all from three-filter ICP.'),
  ('rep-s2-e1-w7','Objection Handling',          10.0,'8 objections tracked. 6 converted. New objection type (budget) handled with diagnostic question on first encounter.','8 objections: 6 meetings, 1 no-fit end, 1 budget → follow-up from diagnostic question.'),
  ('rep-s2-e1-w7','Pipeline Progression',        10.0,'5 meetings — record. All ICP-matched. All three objection types contributing.','5 meetings from 13 connects. Every meeting from filtered list.'),
  ('rep-s2-e1-w7','Process Adherence',            6.0,'11 of 13 emails. 10 of 13 LinkedIn. Best adherence since starting.','11/13 emails. 10/13 LinkedIn. Friday block holding.'),
  ('rep-s2-e1-w7','Self-Awareness & Improvement',10.0,'Tracking objections by type, developing specific questions per type, designing size-filter validation test with defined timeline.','Budget objection question in development. Size-filter validation: 2-week data window defined.'),
  ('rep-s2-e1-w7','Communication Clarity',        6.5,'Three replies this week. One direct call booking from email. Personalised and concise throughout.','3 email replies. 1 call booked directly from email. All messages concise and specific.');

-- W8 (8.30)
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, evaluation_score, evaluation_reasoning, reviewed_by) VALUES (
  'rep-s2-e1-w8', 'goal-demo-skill-002', 'emp-1776594291863-603',
  'Second week of three-dimension ICP. 28 accounts. Made 62 dials, connected with 15, booked 5 meetings. Conversion rate holding.

Objection tracking: 9 instances total across three types. Primary: 4 of 5 converted. Timing: 2 of 2 converted. Budget: 2 of 2 converted using the new diagnostic — asked what they spent on managing rep performance currently. Both gave numbers. Both are active follow-ups.

Process: email on 12 of 15, LinkedIn on 11 of 15. The Friday block is now a habit.

Two referrals this week — contacts from W6 and W7 meetings introduced me to colleagues. Both booked calls.

Emails: 3 sentences, specific, company and role referenced. Four replies. One was unsolicited positive feedback on the outreach quality.

Continuing the size-filter validation next week. Preliminary data supports it. Still want one more week before drawing a conclusion.',
  '2026-04-07 09:00:00+00', 8.30,
  'Strongest overall week. Three-dimension ICP producing consistent high-quality pipeline including referrals. Objection handling exceptional across all three types. Process adherence highest ever. Communication producing referrals and unsolicited positive feedback. Self-awareness rigorous — validating a hypothesis with a defined data window before concluding. Structural weaknesses in prospecting and communication remain relative to the call skill ceiling but are improving.',
  'emp-vkx0ehh'
);
INSERT INTO report_criterion_scores (report_id, criterion_name, score, reasoning, evidence) VALUES
  ('rep-s2-e1-w8','Prospecting Quality',         7.0,'Three-dimension ICP second week. Referrals beginning. ICP quality high. First week scoring in neutral zone.','28 accounts. 62 dials, 15 connects, 5 meetings plus 2 referral calls booked.'),
  ('rep-s2-e1-w8','Objection Handling',          10.0,'9 objections across 3 types. Near-perfect conversion. Budget diagnostic producing follow-ups.','9 objections: 4/5 primary, 2/2 timing, 2/2 budget → all active follow-ups or meetings.'),
  ('rep-s2-e1-w8','Pipeline Progression',        10.0,'5 meetings plus 2 referral calls. 7 total pipeline additions this week.','5 meetings from 15 connects. 2 referrals from prior weeks. 7 total.'),
  ('rep-s2-e1-w8','Process Adherence',            6.0,'12 of 15 emails. 11 of 15 LinkedIn. Highest adherence yet but still not full sequence on all connects.','12/15 emails. 11/15 LinkedIn. Friday block is a habit now.'),
  ('rep-s2-e1-w8','Self-Awareness & Improvement',10.0,'Size-filter validation ongoing with a defined window. Hypothesis-driven approach. Not concluding prematurely.','Size filter: one more week of data before conclusion. Rigorous evidence standard applied.'),
  ('rep-s2-e1-w8','Communication Clarity',        6.5,'4 replies. Unsolicited positive feedback on outreach quality. Referrals partly driven by communication standard.','4 email replies. 1 unsolicited quality compliment. 2 referrals from prior meeting quality.');

-- ============================================================================
-- EMPLOYEE 2: SARAH ADAMS — ARC TREND: 6.00→6.75→7.25→7.75→8.00→7.50→7.00 + W8 MISSED
-- reviewed_by NULL → needs manager review
-- ============================================================================

-- W1 (6.00)
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, evaluation_score, evaluation_reasoning) VALUES (
  'rep-s2-e2-w1', 'goal-demo-skill-002', 'emp-1776593757624-970',
  'This week I targeted IT directors and VPs at Australian SaaS companies between 30 and 100 employees using a LinkedIn Sales Navigator filter. Pulled 45 accounts. Excluded companies with fewer than 5 sales headcount — they are unlikely to have SDR quality issues. Made 60 dials, connected with 10.

Booked 1 meeting. Nine connects went nowhere. On calls I described what we do and people either were interested or were not. A few said "already handled internally." I said we were different and moved on when they did not engage.

Followed the full sequence on all 10 connects — call same day, email within 2 hours, LinkedIn the next morning.

Wrote clear, short emails. Used their company name, job title, and a specific detail about their sales team size.

Next week I will try to reach more people by expanding the list.',
  '2026-02-17 09:00:00+00', 6.00,
  'Prospecting is structured with clear ICP criteria and exclusion logic. Objection handling is passive — description of product followed by disengagement when prospect does not react. 1 meeting from 10 connects despite good targeting. Full sequence adherence is strong. Self-awareness is shallow — the diagnosis is volume, not conversion rate. Communication is concise and personalised.'
);
INSERT INTO report_criterion_scores (report_id, criterion_name, score, reasoning, evidence) VALUES
  ('rep-s2-e2-w1','Prospecting Quality',         7.0,'Defined ICP filter: size, role, headcount. Exclusion logic applied. 45 accounts pulled systematically.','45 accounts. IT directors/VPs, 30–100 employees, 5+ sales headcount. Sales Navigator used.'),
  ('rep-s2-e2-w1','Objection Handling',           5.0,'No counter offered on "handled internally." Stated differentiation generically and ended when prospect did not engage.','9 of 10 connects produced no meeting. "Already handled internally" → "we are different" → call ended.'),
  ('rep-s2-e2-w1','Pipeline Progression',         5.0,'1 meeting from 10 connects. Low output despite good targeting. Conversion is the gap.','1 meeting from 10 connects. 60 dials.'),
  ('rep-s2-e2-w1','Process Adherence',            7.0,'Full sequence on all 10 connects. Call, email within 2 hours, LinkedIn next morning. Consistent.','10/10 sequences complete. Call → email 2hr → LinkedIn next morning.'),
  ('rep-s2-e2-w1','Self-Awareness & Improvement', 5.0,'Diagnosis is volume ("expand the list") not conversion. The problem is not list size — it is call conversion.','Plan: expand list. Root cause not identified. Conversion rate not analysed.'),
  ('rep-s2-e2-w1','Communication Clarity',        7.0,'Short emails. Company name, job title, and sales team size referenced. Personalised and specific.','Short emails. Company name, title, and sales headcount referenced in each message.');

-- W2 (6.75)
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, evaluation_score, evaluation_reasoning) VALUES (
  'rep-s2-e2-w2', 'goal-demo-skill-002', 'emp-1776593757624-970',
  'Refined the ICP filter this week. Added a second criterion — companies using HubSpot as their CRM (visible via BuiltWith). Theory: HubSpot users are tech-forward and more likely to value sales performance tools. Pulled 38 accounts meeting both criteria. Made 65 dials, connected with 12, booked 2 meetings.

On calls people are still not converting at the rate I want. When they push back I explain the value proposition clearly. Most people who are not interested say they do not need it. I acknowledge that and move on.

Full sequence on 11 of 12 connects. One connect I could not find on LinkedIn.

Emails this week included a relevant data point — mentioned that teams using HubSpot without a structured review process lose 20–30% of rep performance data. Two prospects replied asking for more information.

Next week: going to add a third filter — companies that have posted an SDR role in the last 60 days.',
  '2026-02-24 09:00:00+00', 6.75,
  'Prospecting improving — second ICP dimension added with a clear rationale. Objection handling still passive — explaining value and disengaging when prospect does not convert. Pipeline better at 2 meetings driven by email content, not call handling. Sequence adherence strong at 11 of 12. Self-awareness still surface-level — observes low conversion but attributes it to "interest" rather than call technique. Communication strong — data-backed email producing replies.'
);
INSERT INTO report_criterion_scores (report_id, criterion_name, score, reasoning, evidence) VALUES
  ('rep-s2-e2-w2','Prospecting Quality',         8.0,'Two ICP dimensions with clear rationale. HubSpot filter derived from a hypothesis about tech-forward buyers.','38 accounts. Sales Navigator + HubSpot filter via BuiltWith. Clear exclusion logic.'),
  ('rep-s2-e2-w2','Objection Handling',           5.5,'Explained value and moved on when prospect did not convert. No diagnostic question attempted.','Pushback → value explanation → "not interested" → move on. No question asked.'),
  ('rep-s2-e2-w2','Pipeline Progression',         5.5,'2 meetings — both driven by email replies, not call conversion. Calls still not generating meetings.','2 meetings from 12 connects. Both from email replies, not live call conversion.'),
  ('rep-s2-e2-w2','Process Adherence',            8.0,'11 of 12 sequences complete. One LinkedIn missed due to no profile found.','11/12 complete. 1 missed — prospect not on LinkedIn.'),
  ('rep-s2-e2-w2','Self-Awareness & Improvement', 5.5,'Observes low call conversion but attributes to prospect interest, not technique. Does not diagnose the call itself.','Plan: add third filter. Call conversion not analysed. Problem framed as targeting, not handling.'),
  ('rep-s2-e2-w2','Communication Clarity',        8.0,'Data-backed email produced 2 replies. Specific, short, relevant. Email quality driving meetings this week.','Data point in email: 20–30% performance data loss without review process. 2 replies.');

-- W3 (7.25)
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, evaluation_score, evaluation_reasoning) VALUES (
  'rep-s2-e2-w3', 'goal-demo-skill-002', 'emp-1776593757624-970',
  'Added the third filter — SDR job posting in the last 60 days. Pulled 32 accounts meeting all three criteria: 30–100 employees, HubSpot user, active SDR job posting. Made 68 dials, connected with 13, booked 2 meetings.

Both meetings came from email replies, not live calls. On calls the pattern is the same — I explain clearly and people are either interested or they are not. I am getting good at explaining the product concisely. Several people said it made sense but they were not looking to change anything.

Full sequence on all 13 connects. Built a tracking sheet this week to log the date and status of every step per prospect.

Emails are strong. Subject line this week: "how [Company] could be losing 25% of SDR performance data." Four replies. Two booked calls directly from email.

Next week: interested in refining the email data point. Going to test a different statistic.',
  '2026-03-03 09:00:00+00', 7.25,
  'Prospecting excellent — three-dimension ICP with specific logic for each filter. Process adherence exceptional with a tracking system built. Communication strong and producing direct call bookings. Objection handling still absent — on calls the rep explains and disengages. Pipeline driven by email not calls. Self-awareness focuses on email optimisation, not the call conversion gap which is the real bottleneck.'
);
INSERT INTO report_criterion_scores (report_id, criterion_name, score, reasoning, evidence) VALUES
  ('rep-s2-e2-w3','Prospecting Quality',         9.0,'Three-dimension ICP fully operational. Each filter has a clear rationale. 32 highly targeted accounts.','32 accounts: 30–100 employees + HubSpot + SDR job posting in 60 days.'),
  ('rep-s2-e2-w3','Objection Handling',           5.5,'Explains product clearly when challenged. Does not ask diagnostic questions. People say "makes sense, not looking to change."','Same pattern: concise product explanation → prospect not convinced → call ends. No question asked.'),
  ('rep-s2-e2-w3','Pipeline Progression',         5.5,'2 meetings, both from email. Calls still converting at near-zero rate.','2 meetings from 13 connects. Both from email replies. 0 from live call conversion.'),
  ('rep-s2-e2-w3','Process Adherence',            9.0,'Full sequence on all 13 connects. Tracking sheet built to log each step per prospect.','13/13 complete. Tracking sheet introduced to log step-level status per prospect.'),
  ('rep-s2-e2-w3','Self-Awareness & Improvement', 5.5,'Plans to refine email statistics, not to improve call conversion. Misattributes meetings to outreach quality rather than diagnosing the call failure.','Plan: test different email statistic. Call conversion problem not identified as the issue.'),
  ('rep-s2-e2-w3','Communication Clarity',        9.0,'Subject line with specific personalised data point. 4 replies. 2 direct call bookings from email.','Subject: "how [Company] could be losing 25% of SDR performance data." 4 replies, 2 call bookings.');

-- W4 (7.75)
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, evaluation_score, evaluation_reasoning) VALUES (
  'rep-s2-e2-w4', 'goal-demo-skill-002', 'emp-1776593757624-970',
  'Refined the ICP further — added a LinkedIn headcount growth signal. Companies that grew their sales headcount by 30% or more in the last 12 months. Pulled 28 accounts. High confidence in all of them.

Made 65 dials, connected with 14, booked 3 meetings. Two from email, one from a live call — the first call conversion in four weeks.

The live call meeting came from a prospect who pushed back hard. I was surprised by the pushback and instead of explaining the product I said "what is the gap you are trying to fill?" He answered for two minutes. By the end of the call he wanted to see a demo.

Emails: tested a new data point — "companies that score reps weekly retain 40% more top performers." Three replies. Two became meetings. Subject line: "SDR retention at [Company]."

Full sequence on all 14 connects. Tracking sheet updated in real time.

Next week: that call technique — asking what the gap is — felt different. Going to try it again.',
  '2026-03-10 09:00:00+00', 7.75,
  'Prospecting excellent with a fourth dimension added and well-reasoned. Process adherence exceptional. Communication strongest week yet with targeted subject lines. First live call conversion — happened accidentally when the rep deviated from their explanation script. Self-awareness recognises this but frames it as something to "try again" rather than as a systematic technique to adopt.'
);
INSERT INTO report_criterion_scores (report_id, criterion_name, score, reasoning, evidence) VALUES
  ('rep-s2-e2-w4','Prospecting Quality',         9.5,'Fourth ICP dimension: headcount growth signal. 28 high-confidence accounts. Systematic and well-reasoned.','28 accounts: 30–100 employees + HubSpot + SDR job posting + 30% headcount growth in 12 months.'),
  ('rep-s2-e2-w4','Objection Handling',           6.0,'One live call conversion — happened by accident when rep deviated from explanation and asked a diagnostic question instead.','1 call meeting: pushback → "what gap are you trying to fill?" → 2-minute answer → demo booked.'),
  ('rep-s2-e2-w4','Pipeline Progression',         6.0,'3 meetings — best live-call week. 2 from email, 1 from call. Improvement but still heavily email-dependent.','3 meetings from 14 connects. 2 email, 1 call. First call conversion in 4 weeks.'),
  ('rep-s2-e2-w4','Process Adherence',            9.5,'Full sequence on all 14 connects. Tracking sheet updated in real time.','14/14 sequences complete. Real-time tracking.'),
  ('rep-s2-e2-w4','Self-Awareness & Improvement', 6.0,'Noticed the gap question worked. Plans to "try it again." Not yet recognised as a system to adopt.','Gap question produced call meeting. Plan: try it again next week. Not systematised.'),
  ('rep-s2-e2-w4','Communication Clarity',        9.5,'Retention-focused subject line with specific data point. 3 replies, 2 meetings. Sharpest email work yet.','Subject: "SDR retention at [Company]." New data point: 40% retention lift. 3 replies, 2 meetings.');

-- W5 (8.00)
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, evaluation_score, evaluation_reasoning) VALUES (
  'rep-s2-e2-w5', 'goal-demo-skill-002', 'emp-1776593757624-970',
  'Best week overall. ICP is fully dialled in: 30–100 employees, HubSpot, SDR job posting in 60 days, headcount growth above 30%. Pulled 25 accounts. Made 66 dials, connected with 15, booked 3 meetings. Two from email, one from a call.

The call meeting: used the gap question again. Worked again. Person talked for 90 seconds about their current challenge. Booked a demo by end of call.

Objections came up 7 times. Used the gap question on 4 of them. Three engaged — one became a meeting, two said they would think about it. Three objections I answered with a product explanation and all three ended the call.

Full sequence on all 15 connects. Tracking sheet current and complete.

Emails: five replies this week. Three meetings booked via email. Subject lines personalised per account using their job posting title.

Next week: I want to book more meetings. Need to do more dials.',
  '2026-03-17 09:00:00+00', 8.00,
  'Peak week. ICP is fully defined and operational. Communication producing five replies and three email meetings — exceptional. Process adherence perfect. Objection handling shows a split: gap question working when used, product explanation failing when used. Rep has not fully recognised the pattern — still using product explanation on half of objections. Self-awareness again prescribes volume, not conversion analysis.'
);
INSERT INTO report_criterion_scores (report_id, criterion_name, score, reasoning, evidence) VALUES
  ('rep-s2-e2-w5','Prospecting Quality',        10.0,'Four-dimension ICP fully operational and validated. 25 high-quality accounts. Highest confidence targeting in 5 weeks.','25 accounts. All four dimensions active. Strong evidence of ICP quality from conversion rate.'),
  ('rep-s2-e2-w5','Objection Handling',           6.0,'Gap question used on 4 of 7 objections: 1 meeting, 2 thinking. Product explanation used on 3: all ended. Pattern visible but not fully recognised.','7 objections: gap question → 1 meeting, 2 TBC. Product explanation → 3 ended.'),
  ('rep-s2-e2-w5','Pipeline Progression',         6.0,'3 meetings. 2 from email, 1 from call. Email remains the primary driver. Call conversion still low.','3 meetings from 15 connects. 2 email, 1 call.'),
  ('rep-s2-e2-w5','Process Adherence',           10.0,'15 of 15 sequences complete. Tracking sheet fully current. Perfect adherence.','15/15 sequences. Tracking sheet complete. Perfect week.'),
  ('rep-s2-e2-w5','Self-Awareness & Improvement', 6.0,'Plan is volume ("more dials"). Does not analyse the 4 vs 3 objection split or recognise the gap question success pattern.','Plan: more dials next week. Objection split not analysed. Volume prescribed.'),
  ('rep-s2-e2-w5','Communication Clarity',       10.0,'5 replies. 3 meetings from email. Job posting title used in personalised subject lines per account. Best communication week.','5 email replies. 3 email meetings. Job posting title in subject line. Personalised per account.');

-- W6 (7.50)
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, evaluation_score, evaluation_reasoning) VALUES (
  'rep-s2-e2-w6', 'goal-demo-skill-002', 'emp-1776593757624-970',
  'Pulled 30 accounts using the same four-dimension ICP. Made 70 dials — most dials in any week. Connected with 14. Booked 2 meetings.

Pipeline dropped from last week despite more dials. Email replies also down — three this week versus five last week. The job-posting subject lines are being reused and I think prospects are seeing similar messages from other people.

On calls: tried the gap question on 3 objections. One engaged, two did not. On the other 4 objections I used product explanation and all four ended.

Full sequence on 13 of 14 connects. One email bounced.

Emails: tested a different subject line format — more generic, results-focused. Fewer replies than last week.

Next week: going to go back to the subject lines that worked last week. The generic format was a mistake.',
  '2026-03-24 09:00:00+00', 7.50,
  'Prospecting maintained at high quality. Process adherence strong. Communication declining — tested a weaker email format. Objection handling deteriorating: gap question used inconsistently, product explanation still default on most objections. Pipeline declining. Self-awareness still not diagnosing the call conversion problem — attributes email decline to format, not to lack of call technique development.'
);
INSERT INTO report_criterion_scores (report_id, criterion_name, score, reasoning, evidence) VALUES
  ('rep-s2-e2-w6','Prospecting Quality',         9.5,'Same four-dimension ICP. 30 accounts. Targeting quality maintained.','30 accounts. Same four-dimension filter. 70 dials, 14 connects.'),
  ('rep-s2-e2-w6','Objection Handling',           5.5,'Gap question used on 3 of 7 objections: 1 engaged. Product explanation on 4: all ended. Pattern still not recognised.','7 objections: 3 gap questions (1 engaged), 4 product explanations (4 ended).'),
  ('rep-s2-e2-w6','Pipeline Progression',         5.5,'2 meetings — down from 3. More dials, lower output. Email replies declining.','2 meetings from 14 connects. 3 email replies vs 5 last week.'),
  ('rep-s2-e2-w6','Process Adherence',            9.5,'13 of 14 sequences. One email bounced. Otherwise perfect.','13/14 complete. 1 email bounce. Tracking sheet current.'),
  ('rep-s2-e2-w6','Self-Awareness & Improvement', 5.5,'Attributes email decline to subject line format, not to lack of objection handling development. Plans to revert subject line.','Plan: revert to last week''s subject line format. Call conversion not mentioned.'),
  ('rep-s2-e2-w6','Communication Clarity',        9.5,'Generic subject line tested — fewer replies. Recognised as weaker. Will revert.','Generic subject line: fewer replies. Decision to revert confirms prior format was stronger.');

-- W7 (7.00)
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, evaluation_score, evaluation_reasoning) VALUES (
  'rep-s2-e2-w7', 'goal-demo-skill-002', 'emp-1776593757624-970',
  'Reverted to personalised subject lines. Email replies improved back to four this week. Pulled 28 accounts using the four-dimension ICP. Made 68 dials, connected with 13. Booked 1 meeting.

Only 1 meeting from 13 connects despite four email replies. The email replies are not converting to booked calls at the rate they were. People are replying with questions and I am answering but the conversations are not closing.

On calls: 8 objections. Used the gap question on 2. One became a callback, one ended. Used product explanation on the other 6. All ended.

Full sequence on 12 of 13 connects.

Emails: four replies. One booked. The others asked questions and went quiet.

I think the issue is that the ICP segment is getting saturated at this level of precision. The total addressable pool with all four filters active is shrinking week on week. Need to either loosen a filter or find a new trigger signal.',
  '2026-03-31 09:00:00+00', 7.00,
  'Prospecting quality maintained but the rep is attributing pipeline decline to list saturation rather than call conversion. Objection handling continuing to deteriorate — gap question used on only 2 of 8 objections. Product explanation still default on majority. Pipeline at lowest point since W2. Process adherence strong. Self-awareness misdiagnoses the problem — the ICP is not saturated, the call conversion rate is the issue.'
);
INSERT INTO report_criterion_scores (report_id, criterion_name, score, reasoning, evidence) VALUES
  ('rep-s2-e2-w7','Prospecting Quality',         9.0,'Same four-dimension ICP. Quality unchanged. Rep attributes declining results to list saturation — not the ICP itself.','28 accounts. Four-dimension filter. 68 dials, 13 connects.'),
  ('rep-s2-e2-w7','Objection Handling',           5.0,'Gap question used on 2 of 8 objections. Product explanation on 6: all ended. Regression from prior weeks.','8 objections: 2 gap questions (1 callback, 1 end), 6 product explanations (6 ended).'),
  ('rep-s2-e2-w7','Pipeline Progression',         5.0,'1 meeting — worst week since W1. Email replies not closing. Call conversion near zero.','1 meeting from 13 connects. 4 email replies, 1 converted. Calls generating 0 meetings.'),
  ('rep-s2-e2-w7','Process Adherence',            9.0,'12 of 13 sequences complete. Tracking sheet current.','12/13 complete. One step missed on one connect.'),
  ('rep-s2-e2-w7','Self-Awareness & Improvement', 5.0,'Attributes decline to ICP saturation. The four-dimension list is not saturated at 28 accounts — the call technique is the issue. Misdiagnosis.','Plan: loosen filter or find new trigger signal. Actual problem (call conversion) not identified.'),
  ('rep-s2-e2-w7','Communication Clarity',        9.0,'Personalised subject lines restored. 4 replies — back to normal. Email quality consistent.','4 email replies after reverting to personalised format. Quality confirmed as the driver.');

-- ============================================================================
-- EMPLOYEE 2 W8 — MISSED REPORT
-- Period: 2026-04-07 → 2026-04-14. No submission. Status = missed.
-- ============================================================================
INSERT INTO reporting_periods (id, goal_id, employee_id, period_start, period_end, status, late_submitted, report_id)
VALUES (
  'rp-s2-e2-w8',
  'goal-demo-skill-002',
  'emp-1776593757624-970',
  '2026-04-07 09:00:00+00',
  '2026-04-14 09:00:00+00',
  'missed',
  false,
  null
);