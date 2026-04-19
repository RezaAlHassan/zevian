BEGIN;

-- Seed scenario:
-- Goal: SDR Weekly Performance - Outbound B2B
-- Org: org-uqlwof1
-- Manager: emp-vkx0ehh
-- Employees:
--   1) emp-1776593757624-970 -> starts poor and improves steadily
--   2) emp-1776594291863-603 -> starts poor, improves, then declines
--
-- Radar intent:
--   Employee 1 strengths  -> Account Targeting, Personalization, Self-Awareness
--   Employee 1 weaknesses -> Objection Handling, Pipeline Progression, Process Adherence
--   Employee 2 strengths  -> Objection Handling, Pipeline Progression, Process Adherence
--   Employee 2 weaknesses -> Account Targeting, Personalization, Self-Awareness
--
-- Reporting intent:
--   6 submitted reports per employee
--   2 missed reporting periods per employee for missed-report testing

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = 'org-uqlwof1') THEN
        RAISE EXCEPTION 'Seed aborted: organization org-uqlwof1 does not exist.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM employees WHERE id = 'emp-vkx0ehh') THEN
        RAISE EXCEPTION 'Seed aborted: manager emp-vkx0ehh does not exist.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM employees WHERE id = 'emp-1776593757624-970') THEN
        RAISE EXCEPTION 'Seed aborted: employee emp-1776593757624-970 does not exist.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM employees WHERE id = 'emp-1776594291863-603') THEN
        RAISE EXCEPTION 'Seed aborted: employee emp-1776594291863-603 does not exist.';
    END IF;
END $$;

-- Clean up only this seed set so the script is safe to re-run.
DELETE FROM report_criterion_scores
WHERE report_id IN (
    'rpt-sdr-e1-w1', 'rpt-sdr-e1-w2', 'rpt-sdr-e1-w3', 'rpt-sdr-e1-w4', 'rpt-sdr-e1-w5', 'rpt-sdr-e1-w6',
    'rpt-sdr-e2-w1', 'rpt-sdr-e2-w2', 'rpt-sdr-e2-w3', 'rpt-sdr-e2-w4', 'rpt-sdr-e2-w5', 'rpt-sdr-e2-w6'
);

DELETE FROM reporting_periods
WHERE id IN (
    'rp-sdr-e1-00', 'rp-sdr-e1-01', 'rp-sdr-e1-02', 'rp-sdr-e1-03', 'rp-sdr-e1-04', 'rp-sdr-e1-05', 'rp-sdr-e1-06', 'rp-sdr-e1-07',
    'rp-sdr-e2-00', 'rp-sdr-e2-01', 'rp-sdr-e2-02', 'rp-sdr-e2-03', 'rp-sdr-e2-04', 'rp-sdr-e2-05', 'rp-sdr-e2-06', 'rp-sdr-e2-07'
);

DELETE FROM reports
WHERE id IN (
    'rpt-sdr-e1-w1', 'rpt-sdr-e1-w2', 'rpt-sdr-e1-w3', 'rpt-sdr-e1-w4', 'rpt-sdr-e1-w5', 'rpt-sdr-e1-w6',
    'rpt-sdr-e2-w1', 'rpt-sdr-e2-w2', 'rpt-sdr-e2-w3', 'rpt-sdr-e2-w4', 'rpt-sdr-e2-w5', 'rpt-sdr-e2-w6'
);

DELETE FROM goal_frequency_anchors
WHERE id IN ('gfa-sdr-e1', 'gfa-sdr-e2');

DELETE FROM goal_assignees
WHERE goal_id = 'goal-sdr-weekly-outbound'
  AND assignee_id IN ('emp-vkx0ehh', 'emp-1776593757624-970', 'emp-1776594291863-603');

DELETE FROM criteria
WHERE goal_id = 'goal-sdr-weekly-outbound';

DELETE FROM goals
WHERE id = 'goal-sdr-weekly-outbound';

DELETE FROM project_assignees
WHERE project_id = 'proj-sdr-weekly-outbound'
  AND assignee_id IN ('emp-vkx0ehh', 'emp-1776593757624-970', 'emp-1776594291863-603');

DELETE FROM projects
WHERE id = 'proj-sdr-weekly-outbound';

INSERT INTO manager_settings (
    manager_id,
    global_frequency,
    report_frequency,
    allow_late_submissions,
    backdate_limit_days,
    grace_period_days
)
VALUES (
    'emp-vkx0ehh',
    true,
    'weekly',
    true,
    14,
    0
)
ON CONFLICT (manager_id) DO UPDATE
SET global_frequency = EXCLUDED.global_frequency,
    report_frequency = EXCLUDED.report_frequency,
    allow_late_submissions = EXCLUDED.allow_late_submissions,
    backdate_limit_days = EXCLUDED.backdate_limit_days,
    grace_period_days = EXCLUDED.grace_period_days,
    updated_at = NOW();

INSERT INTO projects (
    id,
    organization_id,
    name,
    description,
    category,
    report_frequency,
    ai_context,
    created_by,
    status
)
VALUES (
    'proj-sdr-weekly-outbound',
    'org-uqlwof1',
    'Outbound SDR Quality Lab',
    'Demo project for weekly outbound SDR coaching, score trends, and radar-chart variance.',
    'sales',
    'weekly',
    'Illicium SDRs sell meetings, not contracts. Strong reports require concrete call examples, account selection rationale, objection handling specifics, outreach process evidence, and clear next-step coaching.',
    'emp-vkx0ehh',
    'active'
);

INSERT INTO project_assignees (project_id, assignee_id, assignee_type)
VALUES
    ('proj-sdr-weekly-outbound', 'emp-vkx0ehh', 'manager'),
    ('proj-sdr-weekly-outbound', 'emp-1776593757624-970', 'employee'),
    ('proj-sdr-weekly-outbound', 'emp-1776594291863-603', 'employee')
ON CONFLICT (project_id, assignee_id) DO NOTHING;

INSERT INTO goals (
    id,
    name,
    project_id,
    instructions,
    deadline,
    manager_id,
    created_by
)
VALUES (
    'goal-sdr-weekly-outbound',
    'SDR Weekly Performance - Outbound B2B',
    'proj-sdr-weekly-outbound',
    'Illicium SDRs run outbound prospecting for B2B software and IT companies. Their job is to generate qualified meetings, not close deals. Evaluate each rep''s weekly report on account selection, personalization quality, objection handling, whether they moved real opportunities forward, whether they followed a structured outreach process, and whether they identified one concrete improvement for the next week. Activity volume alone is not evidence of quality. Specific examples from calls and what the rep changed as a result are required for high scores.',
    DATE '2026-06-30',
    'emp-vkx0ehh',
    'emp-vkx0ehh'
);

INSERT INTO goal_assignees (goal_id, assignee_id, assignee_type)
VALUES
    ('goal-sdr-weekly-outbound', 'emp-vkx0ehh', 'manager'),
    ('goal-sdr-weekly-outbound', 'emp-1776593757624-970', 'employee'),
    ('goal-sdr-weekly-outbound', 'emp-1776594291863-603', 'employee')
ON CONFLICT (goal_id, assignee_id) DO NOTHING;

INSERT INTO criteria (id, goal_id, name, weight, display_order, target_description)
VALUES
    ('crit-sdr-targeting',   'goal-sdr-weekly-outbound', 'Account Targeting & Research',          15, 1, 'Targets should match the ICP and show pre-call research on account context, role relevance, and likely pain points.'),
    ('crit-sdr-personal',    'goal-sdr-weekly-outbound', 'Personalization & Messaging',           15, 2, 'Messaging should reference account-specific context, trigger events, or role-specific pains rather than generic outreach.'),
    ('crit-sdr-objections',  'goal-sdr-weekly-outbound', 'Objection Handling',                    25, 3, 'Report must describe real objections and how the SDR responded, adapted, or followed up.'),
    ('crit-sdr-pipeline',    'goal-sdr-weekly-outbound', 'Pipeline Progression',                  20, 4, 'Meetings, follow-ups, and opportunity movement must be quantified and linked to actual outreach.'),
    ('crit-sdr-process',     'goal-sdr-weekly-outbound', 'Outreach Process Adherence',            15, 5, 'Report should show a structured sequence across call, email, and LinkedIn with clear next steps.'),
    ('crit-sdr-improve',     'goal-sdr-weekly-outbound', 'Self-Awareness & Improvement',          10, 6, 'Report should identify one thing that did not work and one specific change for next week.')
;

INSERT INTO goal_frequency_anchors (
    id,
    goal_id,
    employee_id,
    frequency,
    anchor_date,
    is_active
)
VALUES
    ('gfa-sdr-e1', 'goal-sdr-weekly-outbound', 'emp-1776593757624-970', 'weekly', '2026-02-16T00:00:00Z', true),
    ('gfa-sdr-e2', 'goal-sdr-weekly-outbound', 'emp-1776594291863-603', 'weekly', '2026-02-16T00:00:00Z', true)
ON CONFLICT (id) DO UPDATE
SET anchor_date = EXCLUDED.anchor_date,
    frequency = EXCLUDED.frequency,
    is_active = EXCLUDED.is_active;

INSERT INTO reports (
    id,
    goal_id,
    employee_id,
    report_text,
    submission_date,
    evaluation_score,
    manager_overall_score,
    manager_override_reasoning,
    manager_feedback,
    reviewed_by,
    evaluation_reasoning,
    submitted_for_date,
    submitted_at,
    is_backdated
)
VALUES
    (
        'rpt-sdr-e1-w1',
        'goal-sdr-weekly-outbound',
        'emp-1776593757624-970',
        'I focused on 14 VP Sales and RevOps contacts at seed-to-Series A SaaS accounts using hiring signals and recent funding rounds. The opening emails landed better when I referenced current sales hiring, but on calls I stalled when prospects said they already had enough pipeline and I did not pivot to missed-meeting quality. I completed most first touches by phone and email, but I skipped LinkedIn on several accounts and only booked one weakly qualified intro. Next week I will keep the same research depth, add a tighter objection script for "we already have enough meetings," and complete the full three-touch sequence before disqualifying anyone.',
        '2026-03-02T09:12:00Z',
        4.70,
        NULL,
        NULL,
        NULL,
        'emp-vkx0ehh',
        'Research and targeting were stronger than the final result suggests, but the rep did not convert good preparation into confident objection handling or a disciplined outreach sequence. This was an evidence-backed but incomplete week with limited pipeline movement.',
        DATE '2026-03-01',
        '2026-03-02T09:12:00Z',
        false
    ),
    (
        'rpt-sdr-e1-w2',
        'goal-sdr-weekly-outbound',
        'emp-1776593757624-970',
        'I narrowed the list to vertical SaaS firms with active AE hiring and wrote custom intros around churn reduction and demo-show rates. Personalization improved reply quality, but I still lost momentum when CFOs challenged ROI and I defaulted to generic value statements. I booked one meeting, sent five tailored follow-ups, and documented that I missed LinkedIn touches on a third of the sequence. The main fix for next week is to bring one quantified proof point into every objection response and run the full call-email-LinkedIn rhythm without skipping the social step.',
        '2026-03-09T09:05:00Z',
        5.35,
        NULL,
        NULL,
        NULL,
        'emp-vkx0ehh',
        'The rep is improving on targeting discipline and message relevance, but objections still disrupt momentum and process gaps are reducing conversion efficiency. There is visible progress, though the week is still below target because outcomes remain thin.',
        DATE '2026-03-08',
        '2026-03-09T09:05:00Z',
        false
    ),
    (
        'rpt-sdr-e1-w3',
        'goal-sdr-weekly-outbound',
        'emp-1776593757624-970',
        'I prospected into 11 product-led growth software firms and used call openers tied to pricing-page changes or recent hiring. Messaging felt sharper and two prospects replied that the outreach actually sounded researched. I still handled "send me something" too softly, but I tested a follow-up that offered a 15-minute benchmark review and recovered one conversation into a booked discovery. I completed the sequence on most accounts and wrote down that my objection responses need a clearer redirect to business pain rather than a soft handoff to email.',
        '2026-03-16T09:08:00Z',
        6.60,
        NULL,
        NULL,
        NULL,
        'emp-vkx0ehh',
        'This week showed a real step up in prospecting quality and message fit, with some evidence that the rep is learning from earlier misses. The remaining gap is consistency in objection control and structured follow-through after the first positive reply.',
        DATE '2026-03-15',
        '2026-03-16T09:08:00Z',
        false
    ),
    (
        'rpt-sdr-e1-w4',
        'goal-sdr-weekly-outbound',
        'emp-1776593757624-970',
        'I stayed focused on B2B IT services and workflow SaaS accounts that had posted revenue-operations roles in the last 30 days. Personalization was tighter because every call note and email opener referenced an active trigger, and that led to three prospects engaging in real conversations rather than asking for generic decks. I handled the "timing is bad" objection better by offering a short benchmark review for next quarter planning, which turned one stall into a scheduled meeting. Sequence discipline was better than last week, though a couple of LinkedIn touches still went out late. I wrote down that I need to shorten my first rebuttal so I sound more conversational.',
        '2026-03-23T09:02:00Z',
        7.61,
        NULL,
        NULL,
        'Good jump in specificity and control. Keep tightening the rebuttal pacing.',
        'emp-vkx0ehh',
        'The rep is now combining strong account research with more usable call adjustments, and the week produced clearer movement into meetings. Performance is approaching target, but process consistency still trails the quality of the research.',
        DATE '2026-03-22',
        '2026-03-23T09:02:00Z',
        false
    ),
    (
        'rpt-sdr-e1-w5',
        'goal-sdr-weekly-outbound',
        'emp-1776593757624-970',
        'I worked a narrower list of AI infrastructure and IT operations companies where the VP Sales or CRO had posted about pipeline efficiency. Custom messaging around underperforming outbound teams generated four live conversations, and I turned two "not now" responses into follow-up meetings by referencing quarter-planning timing and offering examples from similar teams. I sent 12 structured follow-ups and finished every touch pattern across call, email, and LinkedIn. Pipeline movement was better, but I noted that I still over-explain the first objection response and want to trim it to one sentence before asking a question next week.',
        '2026-03-30T09:15:00Z',
        8.16,
        NULL,
        NULL,
        'The quality is now clearly visible in both preparation and call execution. Keep converting more of those engaged conversations into confirmed meetings.',
        'emp-vkx0ehh',
        'This was a strong week because the rep paired well-targeted outreach with clearer handling of resistance and better sequence completion. The trend is firmly upward and the coaching note is now refining a good process rather than fixing a broken one.',
        DATE '2026-03-29',
        '2026-03-30T09:15:00Z',
        false
    ),
    (
        'rpt-sdr-e1-w6',
        'goal-sdr-weekly-outbound',
        'emp-1776593757624-970',
        'I targeted 10 B2B software accounts that fit our highest-converting ICP and had both funding activity and open AE roles. Every outreach step used account-specific context, including win-rate language for RevOps leaders and meeting-quality language for VPs of Sales. I handled three recurring objections directly: "we already have SDR coverage," "send info," and "circle back next quarter." Two of those turned into qualified meetings after I reframed around meeting quality and offered short benchmark reviews. I kept the full outreach sequence on every account and logged the exact rebuttals that worked. The main improvement point is to keep sharpening the first 20 seconds so I get to the problem statement faster.',
        '2026-04-06T09:07:00Z',
        8.62,
        NULL,
        NULL,
        'This is the clearest evidence yet of a repeatable prospecting process. Preserve the quality bar while continuing to raise meeting conversion.',
        'emp-vkx0ehh',
        'The rep finished the cycle with strong evidence across research quality, tailored messaging, and reflective improvement. Objection handling and pipeline movement are no longer empty claims, even if those areas are still weaker than the rep''s preparation work.',
        DATE '2026-04-05',
        '2026-04-06T09:07:00Z',
        false
    ),
    (
        'rpt-sdr-e2-w1',
        'goal-sdr-weekly-outbound',
        'emp-1776594291863-603',
        'I ran the weekly sequence exactly as planned across calls, follow-up emails, and LinkedIn touches, and I kept CRM notes clean after each contact. The issue was that the list was too broad and several targets were outside our core B2B software ICP, so the conversations were polite but thin. I managed basic objections around timing and budget well enough to keep a few threads alive, but only one moved to a real next step. I know the process was disciplined, yet the week proved that structure without sharper targeting does not create quality meetings. Next week I need to tighten account selection before I scale the sequence.',
        '2026-03-02T09:18:00Z',
        5.79,
        NULL,
        NULL,
        NULL,
        'emp-vkx0ehh',
        'Execution discipline was solid, but weak account selection and generic messaging capped the value of that effort. This was a process-heavy week with limited strategic judgment behind it.',
        DATE '2026-03-01',
        '2026-03-02T09:18:00Z',
        false
    ),
    (
        'rpt-sdr-e2-w2',
        'goal-sdr-weekly-outbound',
        'emp-1776594291863-603',
        'I kept a consistent call-email-LinkedIn sequence and pushed follow-ups on time, which helped me recover a couple of soft no''s into later conversations. Objection handling improved because I answered "we already work with an agency" by narrowing the conversation to qualified meeting quality. Even so, the outreach copy was still too generic and I chased a few accounts that were clearly outside the sweet spot after the first call. I booked two meetings but one was only lightly qualified. The biggest adjustment for next week is to stop relying on process discipline as proof of quality and qualify the account list harder before the first touch.',
        '2026-03-09T09:09:00Z',
        6.38,
        NULL,
        NULL,
        NULL,
        'emp-vkx0ehh',
        'The rep is using the sequence and objection scripts effectively, and the week shows modest improvement. The remaining drag is still weak targeting and low self-correction once poor-fit accounts surface.',
        DATE '2026-03-08',
        '2026-03-09T09:09:00Z',
        false
    ),
    (
        'rpt-sdr-e2-w3',
        'goal-sdr-weekly-outbound',
        'emp-1776594291863-603',
        'This week I restricted outreach to software and IT services companies with active sales hiring and a clear outbound motion. The tighter list helped, and my objection handling around "we have enough pipeline" landed better when I switched to talking about meeting quality and conversion rates instead of volume. I booked three meetings and pushed six multi-step follow-ups to next stage conversations. My process stayed tight, but I still noticed that the email copy looked similar across accounts. Next week I want to keep the sequence discipline and improve the quality of the first-line personalization.',
        '2026-03-16T09:11:00Z',
        7.33,
        NULL,
        NULL,
        NULL,
        'emp-vkx0ehh',
        'This week produced stronger outcomes because the rep paired better list discipline with already-strong process execution. Improvement is clear, though personalization and self-awareness still lag behind the rep''s operational consistency.',
        DATE '2026-03-15',
        '2026-03-16T09:11:00Z',
        false
    ),
    (
        'rpt-sdr-e2-w4',
        'goal-sdr-weekly-outbound',
        'emp-1776594291863-603',
        'I kept the full outreach cadence on every account and focused on B2B SaaS firms that fit the ICP more closely than earlier weeks. I handled three common objections with tighter follow-up questions, especially when prospects said they already had internal SDR coverage. That reframing converted two calls into qualified meetings and helped move four other conversations into scheduled follow-ups. Process execution was the cleanest it has been so far, and the result quality matched it better. My weakest point is still the reflective section of the report because I can describe what happened faster than I describe what I should change.',
        '2026-03-23T09:06:00Z',
        8.03,
        NULL,
        NULL,
        'Best week so far. Keep the sharper ICP filter and write a more honest self-critique next time.',
        'emp-vkx0ehh',
        'This was the rep''s high point: strong sequence discipline translated into clearer pipeline movement and more confident objection control. The remaining weakness is not execution but learning depth and message quality.',
        DATE '2026-03-22',
        '2026-03-23T09:06:00Z',
        false
    ),
    (
        'rpt-sdr-e2-w5',
        'goal-sdr-weekly-outbound',
        'emp-1776594291863-603',
        'I maintained the same sequence discipline and kept follow-up timing clean, but the account list widened again because I tried to fill the top of funnel quickly. I still handled objections competently and booked two meetings, yet the conversations were less qualified than last week. Personalization dropped back toward template language, and I did not write a very specific reflection on what caused the weaker fit. The next change is to protect the account filter instead of chasing volume when the week starts slowly.',
        '2026-03-30T09:10:00Z',
        7.32,
        NULL,
        NULL,
        NULL,
        'emp-vkx0ehh',
        'The rep kept the mechanical parts of the process intact, but quality slipped because targeting discipline softened and the self-review stayed vague. This is a mild decline from the previous week rather than a collapse.',
        DATE '2026-03-29',
        '2026-03-30T09:10:00Z',
        false
    ),
    (
        'rpt-sdr-e2-w6',
        'goal-sdr-weekly-outbound',
        'emp-1776594291863-603',
        'I completed the outreach sequence on schedule and still managed objections around timing and "send me details" without losing every conversation. The problem was that the list quality drifted again and my opening copy sounded too similar across multiple accounts, so interest fell even when the cadence stayed strong. I booked one meeting, but it was weaker than the meetings from two weeks ago. My reflection this week is blunt: I leaned on process consistency as a crutch and did not correct the account strategy quickly enough. Next week I need to rebuild the list before running the sequence.',
        '2026-04-06T09:03:00Z',
        6.60,
        NULL,
        NULL,
        'Your process remains strong, but the strategy under it has slipped. Fix the list quality first.',
        'emp-vkx0ehh',
        'The rep still demonstrates reliable process execution, but outcome quality declined because targeting and personalization regressed. The trend has turned downward after a mid-cycle improvement, which makes the strategic weakness more visible.',
        DATE '2026-04-05',
        '2026-04-06T09:03:00Z',
        false
    );

INSERT INTO report_criterion_scores (report_id, criterion_name, score, evidence, reasoning)
VALUES
    ('rpt-sdr-e1-w1', 'Account Targeting & Research', 7.4, 'Focused on VP Sales and RevOps contacts at funded SaaS accounts using hiring signals.', 'Targeting was thoughtful even in a weak week, showing better judgment than the resulting pipeline suggests.'),
    ('rpt-sdr-e1-w1', 'Personalization & Messaging', 7.8, 'Opening emails referenced current sales hiring and account context.', 'Message relevance was above average and clearly researched.'),
    ('rpt-sdr-e1-w1', 'Objection Handling', 2.8, 'Stalled when prospects said they already had enough pipeline.', 'The report shows the objection occurred but not a strong response or recovery.'),
    ('rpt-sdr-e1-w1', 'Pipeline Progression', 3.1, 'Only booked one weakly qualified intro.', 'Some movement happened, but evidence of qualified progression was minimal.'),
    ('rpt-sdr-e1-w1', 'Outreach Process Adherence', 2.4, 'Skipped LinkedIn on several accounts.', 'The rep broke the intended sequence often enough to materially hurt quality.'),
    ('rpt-sdr-e1-w1', 'Self-Awareness & Improvement', 7.4, 'Will add a tighter objection script and complete the full three-touch sequence.', 'Reflection was concrete and useful even though execution lagged.'),

    ('rpt-sdr-e1-w2', 'Account Targeting & Research', 7.9, 'Narrowed the list to vertical SaaS firms with active AE hiring.', 'The ICP fit improved and the rationale was specific.'),
    ('rpt-sdr-e1-w2', 'Personalization & Messaging', 8.2, 'Custom intros around churn reduction and demo-show rates.', 'Messaging is now consistently tailored to account context.'),
    ('rpt-sdr-e1-w2', 'Objection Handling', 3.4, 'Defaulted to generic value statements when CFOs challenged ROI.', 'The report shows the rep still loses confidence under resistance.'),
    ('rpt-sdr-e1-w2', 'Pipeline Progression', 4.0, 'Booked one meeting and sent five tailored follow-ups.', 'There is some measurable motion, but it remains light for a strong week.'),
    ('rpt-sdr-e1-w2', 'Outreach Process Adherence', 3.2, 'Missed LinkedIn touches on a third of the sequence.', 'The process is improving, but the sequence is still incomplete too often.'),
    ('rpt-sdr-e1-w2', 'Self-Awareness & Improvement', 8.0, 'Bring one quantified proof point into every objection response.', 'The learning note is concrete and directly tied to the week''s weakness.'),

    ('rpt-sdr-e1-w3', 'Account Targeting & Research', 8.8, 'Prospected PLG software firms and used pricing-page changes or recent hiring as triggers.', 'Research quality is now clearly strong and repeatable.'),
    ('rpt-sdr-e1-w3', 'Personalization & Messaging', 8.8, 'Two prospects replied that the outreach sounded researched.', 'The rep demonstrated message quality with direct feedback from prospects.'),
    ('rpt-sdr-e1-w3', 'Objection Handling', 4.8, 'Handled "send me something" too softly but recovered one conversation.', 'There is progress, but the objection work is still inconsistent.'),
    ('rpt-sdr-e1-w3', 'Pipeline Progression', 5.5, 'Recovered one conversation into a booked discovery.', 'Pipeline movement is more credible than before, but still not strong.'),
    ('rpt-sdr-e1-w3', 'Outreach Process Adherence', 5.2, 'Completed the sequence on most accounts.', 'Process compliance is moving toward acceptable but is not fully reliable yet.'),
    ('rpt-sdr-e1-w3', 'Self-Awareness & Improvement', 8.8, 'Need a clearer redirect to business pain rather than a soft handoff to email.', 'Reflection is specific and clearly connected to call behavior.'),

    ('rpt-sdr-e1-w4', 'Account Targeting & Research', 9.2, 'Focused on B2B IT services and workflow SaaS accounts with recent RevOps hiring.', 'Strong targeting and signal usage are now a clear strength.'),
    ('rpt-sdr-e1-w4', 'Personalization & Messaging', 9.3, 'Every opener referenced an active trigger tied to the account.', 'Personalization is now precise and consistently applied.'),
    ('rpt-sdr-e1-w4', 'Objection Handling', 6.3, 'Turned one "timing is bad" objection into a scheduled meeting.', 'The rep is beginning to convert resistance into action, though not yet at a top level.'),
    ('rpt-sdr-e1-w4', 'Pipeline Progression', 6.9, 'Three prospects engaged in real conversations and one stall became a meeting.', 'Measurable progression is finally visible and improving.'),
    ('rpt-sdr-e1-w4', 'Outreach Process Adherence', 6.4, 'A couple of LinkedIn touches still went out late.', 'Mostly structured, but not fully disciplined yet.'),
    ('rpt-sdr-e1-w4', 'Self-Awareness & Improvement', 9.2, 'Need to shorten the first rebuttal so it sounds more conversational.', 'The rep is actively tuning a working approach rather than guessing at fixes.'),

    ('rpt-sdr-e1-w5', 'Account Targeting & Research', 9.5, 'Worked a narrower list of AI infrastructure and IT operations companies matching the best-converting ICP.', 'Targeting discipline is now excellent.'),
    ('rpt-sdr-e1-w5', 'Personalization & Messaging', 9.6, 'Custom messaging around underperforming outbound teams generated four live conversations.', 'The message is highly relevant and clearly influencing response quality.'),
    ('rpt-sdr-e1-w5', 'Objection Handling', 7.1, 'Turned two "not now" responses into follow-up meetings.', 'Objection handling is becoming effective, though still less dominant than research and messaging.'),
    ('rpt-sdr-e1-w5', 'Pipeline Progression', 7.8, 'Four live conversations and two follow-up meetings.', 'The report finally shows strong, measurable pipeline movement.'),
    ('rpt-sdr-e1-w5', 'Outreach Process Adherence', 6.8, 'Finished every touch pattern across call, email, and LinkedIn.', 'Execution is much better, though the earlier pattern keeps the long-run average weaker.'),
    ('rpt-sdr-e1-w5', 'Self-Awareness & Improvement', 9.4, 'Trim the first objection response to one sentence before asking a question.', 'Reflection remains concrete and highly coachable.'),

    ('rpt-sdr-e1-w6', 'Account Targeting & Research', 9.8, 'Targeted highest-converting ICP accounts with funding activity and open AE roles.', 'This is elite targeting discipline with clear ICP logic.'),
    ('rpt-sdr-e1-w6', 'Personalization & Messaging', 9.9, 'Every outreach step used account-specific context and role-specific language.', 'Message fit is a clear standout strength.'),
    ('rpt-sdr-e1-w6', 'Objection Handling', 7.9, 'Handled three recurring objections directly and converted two into qualified meetings.', 'Now credibly effective, though still behind the rep''s preparation strengths.'),
    ('rpt-sdr-e1-w6', 'Pipeline Progression', 8.4, 'Two qualified meetings and tracked rebuttals that worked.', 'The rep produced real movement with supporting detail.'),
    ('rpt-sdr-e1-w6', 'Outreach Process Adherence', 7.0, 'Kept the full outreach sequence on every account.', 'Process quality has improved to solid, even if the long-run average stays below strength level.'),
    ('rpt-sdr-e1-w6', 'Self-Awareness & Improvement', 9.6, 'Need to sharpen the first 20 seconds to reach the problem statement faster.', 'The reflection is precise and forward-looking.'),

    ('rpt-sdr-e2-w1', 'Account Targeting & Research', 2.5, 'Several targets were outside the core B2B software ICP.', 'The rep openly shows poor-fit account selection.'),
    ('rpt-sdr-e2-w1', 'Personalization & Messaging', 2.8, 'Conversations were polite but thin because the list was too broad.', 'The report does not show strong account-specific messaging.'),
    ('rpt-sdr-e2-w1', 'Objection Handling', 7.8, 'Managed timing and budget objections well enough to keep threads alive.', 'Objection handling was competent even in a weak strategic week.'),
    ('rpt-sdr-e2-w1', 'Pipeline Progression', 7.8, 'Kept a few threads alive with real next steps.', 'Pipeline movement was better than the targeting quality deserved.'),
    ('rpt-sdr-e2-w1', 'Outreach Process Adherence', 8.0, 'Ran the weekly sequence exactly as planned across calls, emails, and LinkedIn.', 'The rep showed strong structure and execution discipline.'),
    ('rpt-sdr-e2-w1', 'Self-Awareness & Improvement', 2.8, 'Need to tighten account selection before scaling the sequence.', 'The reflection is directionally correct but shallow and underdeveloped.'),

    ('rpt-sdr-e2-w2', 'Account Targeting & Research', 3.2, 'Still chased a few accounts outside the sweet spot after the first call.', 'Targeting remains below standard.'),
    ('rpt-sdr-e2-w2', 'Personalization & Messaging', 3.5, 'Outreach copy was still too generic.', 'Messaging is still weak and insufficiently tailored.'),
    ('rpt-sdr-e2-w2', 'Objection Handling', 8.4, 'Answered "we already work with an agency" by narrowing the conversation to qualified meeting quality.', 'The rep is already strong in rebuttal quality.'),
    ('rpt-sdr-e2-w2', 'Pipeline Progression', 8.2, 'Booked two meetings and recovered soft no''s into later conversations.', 'Measured progression is strong for a still-flawed week.'),
    ('rpt-sdr-e2-w2', 'Outreach Process Adherence', 8.7, 'Kept a consistent call-email-LinkedIn sequence and pushed follow-ups on time.', 'Process discipline is a standout skill.'),
    ('rpt-sdr-e2-w2', 'Self-Awareness & Improvement', 3.3, 'Stop relying on process discipline as proof of quality.', 'The rep acknowledges the gap but not in much depth.'),

    ('rpt-sdr-e2-w3', 'Account Targeting & Research', 4.8, 'Restricted outreach to software and IT services companies with active sales hiring.', 'List quality improved, but not enough to count as a strength.'),
    ('rpt-sdr-e2-w3', 'Personalization & Messaging', 5.0, 'Email copy looked similar across accounts.', 'Still too templated despite a better list.'),
    ('rpt-sdr-e2-w3', 'Objection Handling', 9.0, 'Handled "we have enough pipeline" better by switching to meeting quality and conversion rates.', 'Objection handling is now clearly strong and evidenced.'),
    ('rpt-sdr-e2-w3', 'Pipeline Progression', 8.9, 'Booked three meetings and pushed six follow-ups to next-stage conversations.', 'Pipeline advancement is strong and quantified.'),
    ('rpt-sdr-e2-w3', 'Outreach Process Adherence', 9.2, 'Process stayed tight across the week.', 'High discipline and consistency are clear strengths.'),
    ('rpt-sdr-e2-w3', 'Self-Awareness & Improvement', 4.5, 'Need to improve the quality of first-line personalization.', 'Reflection exists but still lacks depth.'),

    ('rpt-sdr-e2-w4', 'Account Targeting & Research', 6.0, 'Focused on B2B SaaS firms that fit the ICP more closely than earlier weeks.', 'This was the rep''s best targeting week, but it still trails the execution strengths.'),
    ('rpt-sdr-e2-w4', 'Personalization & Messaging', 6.2, 'Better ICP fit improved result quality, but message quality was not the main evidence point.', 'Adequate, not exceptional.'),
    ('rpt-sdr-e2-w4', 'Objection Handling', 9.4, 'Handled three common objections with tighter follow-up questions.', 'Confident, specific, and outcome-linked.'),
    ('rpt-sdr-e2-w4', 'Pipeline Progression', 9.4, 'Converted two calls into qualified meetings and moved four conversations to follow-up.', 'Excellent quantified movement.'),
    ('rpt-sdr-e2-w4', 'Outreach Process Adherence', 9.5, 'Kept the full outreach cadence on every account.', 'This is near-ideal process discipline.'),
    ('rpt-sdr-e2-w4', 'Self-Awareness & Improvement', 5.4, 'Weakest point is still the reflective section of the report.', 'Honest but still not richly specific.'),

    ('rpt-sdr-e2-w5', 'Account Targeting & Research', 5.0, 'The account list widened again because of funnel pressure.', 'The rep regressed on account discipline.'),
    ('rpt-sdr-e2-w5', 'Personalization & Messaging', 5.3, 'Personalization dropped back toward template language.', 'Message quality declined with the weaker list.'),
    ('rpt-sdr-e2-w5', 'Objection Handling', 8.9, 'Still handled objections competently while booking two meetings.', 'The rep kept this area strong despite strategic slippage.'),
    ('rpt-sdr-e2-w5', 'Pipeline Progression', 9.0, 'Booked two meetings, though they were less qualified than the prior week.', 'Pipeline movement stayed high even as meeting quality slipped.'),
    ('rpt-sdr-e2-w5', 'Outreach Process Adherence', 9.0, 'Maintained sequence discipline and follow-up timing.', 'Reliable structure remains a real strength.'),
    ('rpt-sdr-e2-w5', 'Self-Awareness & Improvement', 4.0, 'Did not write a very specific reflection on what caused the weaker fit.', 'The report identifies drift but not with enough learning detail.'),

    ('rpt-sdr-e2-w6', 'Account Targeting & Research', 3.8, 'List quality drifted again.', 'Targeting closed the cycle as a clear weakness.'),
    ('rpt-sdr-e2-w6', 'Personalization & Messaging', 4.1, 'Opening copy sounded too similar across multiple accounts.', 'Messaging regressed and became generic again.'),
    ('rpt-sdr-e2-w6', 'Objection Handling', 8.5, 'Still managed timing and "send me details" objections without losing every conversation.', 'Even in decline, objection work remains comparatively strong.'),
    ('rpt-sdr-e2-w6', 'Pipeline Progression', 8.4, 'Booked one meeting, weaker than two weeks earlier.', 'Movement stayed respectable, but quality clearly dipped.'),
    ('rpt-sdr-e2-w6', 'Outreach Process Adherence', 8.6, 'Completed the outreach sequence on schedule.', 'Sequence discipline stayed strong throughout the decline.'),
    ('rpt-sdr-e2-w6', 'Self-Awareness & Improvement', 3.2, 'I leaned on process consistency as a crutch and did not correct the account strategy quickly enough.', 'The rep admits the issue but still does not turn that into a robust corrective plan.');

INSERT INTO reporting_periods (
    id,
    goal_id,
    employee_id,
    period_start,
    period_end,
    status,
    late_submitted,
    report_id,
    backdated_after_missed_flagged
)
VALUES
    ('rp-sdr-e1-00', 'goal-sdr-weekly-outbound', 'emp-1776593757624-970', '2026-02-16T00:00:00Z', '2026-02-22T23:59:59Z', 'missed',    false, NULL,            false),
    ('rp-sdr-e1-01', 'goal-sdr-weekly-outbound', 'emp-1776593757624-970', '2026-02-23T00:00:00Z', '2026-03-01T23:59:59Z', 'submitted', false, 'rpt-sdr-e1-w1', false),
    ('rp-sdr-e1-02', 'goal-sdr-weekly-outbound', 'emp-1776593757624-970', '2026-03-02T00:00:00Z', '2026-03-08T23:59:59Z', 'submitted', false, 'rpt-sdr-e1-w2', false),
    ('rp-sdr-e1-03', 'goal-sdr-weekly-outbound', 'emp-1776593757624-970', '2026-03-09T00:00:00Z', '2026-03-15T23:59:59Z', 'submitted', false, 'rpt-sdr-e1-w3', false),
    ('rp-sdr-e1-04', 'goal-sdr-weekly-outbound', 'emp-1776593757624-970', '2026-03-16T00:00:00Z', '2026-03-22T23:59:59Z', 'submitted', false, 'rpt-sdr-e1-w4', false),
    ('rp-sdr-e1-05', 'goal-sdr-weekly-outbound', 'emp-1776593757624-970', '2026-03-23T00:00:00Z', '2026-03-29T23:59:59Z', 'submitted', false, 'rpt-sdr-e1-w5', false),
    ('rp-sdr-e1-06', 'goal-sdr-weekly-outbound', 'emp-1776593757624-970', '2026-03-30T00:00:00Z', '2026-04-05T23:59:59Z', 'submitted', false, 'rpt-sdr-e1-w6', false),
    ('rp-sdr-e1-07', 'goal-sdr-weekly-outbound', 'emp-1776593757624-970', '2026-04-06T00:00:00Z', '2026-04-12T23:59:59Z', 'missed',    false, NULL,            false),

    ('rp-sdr-e2-00', 'goal-sdr-weekly-outbound', 'emp-1776594291863-603', '2026-02-16T00:00:00Z', '2026-02-22T23:59:59Z', 'missed',    false, NULL,            false),
    ('rp-sdr-e2-01', 'goal-sdr-weekly-outbound', 'emp-1776594291863-603', '2026-02-23T00:00:00Z', '2026-03-01T23:59:59Z', 'submitted', false, 'rpt-sdr-e2-w1', false),
    ('rp-sdr-e2-02', 'goal-sdr-weekly-outbound', 'emp-1776594291863-603', '2026-03-02T00:00:00Z', '2026-03-08T23:59:59Z', 'submitted', false, 'rpt-sdr-e2-w2', false),
    ('rp-sdr-e2-03', 'goal-sdr-weekly-outbound', 'emp-1776594291863-603', '2026-03-09T00:00:00Z', '2026-03-15T23:59:59Z', 'submitted', false, 'rpt-sdr-e2-w3', false),
    ('rp-sdr-e2-04', 'goal-sdr-weekly-outbound', 'emp-1776594291863-603', '2026-03-16T00:00:00Z', '2026-03-22T23:59:59Z', 'submitted', false, 'rpt-sdr-e2-w4', false),
    ('rp-sdr-e2-05', 'goal-sdr-weekly-outbound', 'emp-1776594291863-603', '2026-03-23T00:00:00Z', '2026-03-29T23:59:59Z', 'submitted', false, 'rpt-sdr-e2-w5', false),
    ('rp-sdr-e2-06', 'goal-sdr-weekly-outbound', 'emp-1776594291863-603', '2026-03-30T00:00:00Z', '2026-04-05T23:59:59Z', 'submitted', false, 'rpt-sdr-e2-w6', false),
    ('rp-sdr-e2-07', 'goal-sdr-weekly-outbound', 'emp-1776594291863-603', '2026-04-06T00:00:00Z', '2026-04-12T23:59:59Z', 'missed',    false, NULL,            false);

COMMIT;
