# Zevian: Technical Reference

Consolidated, verified-against-source reference for engineers. Supersedes stale claims in
`architecture_and_tech_stack.md` and `software_requirements_specification.md` (kept for their
requirements framing, not as a source of current fact — see the correction notes at the top of
`architecture_and_tech_stack.md`).

## 1. Tech stack

- **Framework**: Next.js 14.2.3, App Router. React 18.3.1. TypeScript ^5.4.5.
- **Backend**: Supabase — `@supabase/supabase-js` ^2.43.4, `@supabase/ssr` ^0.12.0 for server-side
  auth/session (`src/lib/supabase/`). PostgreSQL with RLS on every table.
- **Styling**: hand-rolled CSS-variable design system, **not Tailwind**. `src/styles/globals.css`
  (imported once in `src/app/layout.tsx`) plus `src/design-system/tokens.ts` drive inline
  `style={{}}` props. There is no `tailwind.config.*` or `postcss.config.*` at the repo root —
  `tailwindcss@4` only appears transitively via `@react-email/tailwind` for email templates, and is
  not used for app UI. Full token reference: the Design System artifact (colors, type, spacing,
  radius, motion, icons, component tokens).
- **AI/LLM**: `@google/generative-ai` ^0.24.1 (Google Gemini), model pinned to
  `gemini-2.5-flash` in `src/app/api/ai/score-report/route.ts:330`. No Anthropic or OpenAI SDK
  anywhere in the codebase.
- **Testing**: three separate runners —
  - `npm test` → Node's built-in test runner via `tsx --test __tests__/**/*.test.ts`
  - `vitest` (`vitest.config.ts`, jsdom + Testing Library) for component/action tests under
    `src/app/actions/__tests__/`, `src/components/organisms/__tests__/`, `src/lib/__tests__/`
  - `npm run test:e2e` → Playwright (`playwright.config.ts`, Chromium, boots `next dev` as the
    webServer)
- **Email**: Resend + `@react-email/components`, templates under `src/lib/email/templates/`.
- **Deployment**: **Netlify**, not Vercel — `netlify.toml` + `@netlify/plugin-nextjs` at the repo
  root, consistent with `CLAUDE.md`'s dev/main → Netlify dev URL / app.zevian.co branch rules.
- **Icons**: fully custom hand-drawn SVG set in `src/components/atoms/Icon.tsx` — **not Lucide
  React**. 54 glyphs, 16×16 viewBox, `stroke="currentColor"`, one shared `<Icon name size color />`
  component.
- No Stripe SDK dependency despite `src/app/api/webhooks/stripe/` existing as an empty directory
  (no `route.ts`) and `organizations.plan_tier` already existing in the schema — billing is
  scaffolded, not implemented.

## 2. Route structure

```
src/app/
  (auth)/        login, signup, accept-invite, onboarding, verify-email — no shell
  (app)/         manager/admin shell — AppShellServer → AppShellClient
  (employee)/    employee shell, all routes prefixed my-* — EmployeeShellServer → EmployeeShellClient
  (main)/        one stray route: /submit-report (renders SubmitReportView directly,
                 separate from (employee)/my-reports/submit)
  actions/       server actions, one file per domain
  api/           ai/, auth/, cron/, webhooks/ (webhooks/stripe/ is an empty scaffold)
  auth/callback/
```

`src/app/(app)/settings/` exists as an empty directory with no `page.tsx` — not a live route.
Personal settings currently live at `/account`.

### Auth/role gating

- `(app)/layout.tsx`: resolves `getCachedUser()` + `getSessionContext()`. If the employee's
  `role === 'employee'`, redirects to `/my-dashboard` before render — an employee never sees the
  manager shell even by direct URL. Builds a `profile` object with `canManageSettings` /
  `canViewOrganizationWide` for the client shell to branch on.
- `(employee)/layout.tsx`: resolves `getAuthUser()` + `getCachedEmployee()`, redirects to `/login`
  if unauthenticated or inactive. No role redirect in this direction.

### Shared organisms across shells

Employee routes don't duplicate the manager UI — `GoalsView`, `ProjectsView`, `ReportsView`,
`AccountView`, `NotificationsView` are reused with `readOnly` / `role="employee"` /
`basePath="/my-*"` props. A change to one of these organisms ships to both shells simultaneously.

### View scoping pattern

`goals`, `projects`, and `organization` pages compute
`canViewOrg = employee.isAccountOwner || permissions.canViewOrganizationWide || role === 'admin'`,
then branch org-wide vs. filtered-to-direct-reports data based on a `?view=org|direct` search
param — same route, same component, different query.

## 3. Component conventions (atomic design)

`src/components/`:

- **atoms/** (13): Avatar, Badge, Button, Calendar, Chip, EmployeeHeader, Header, Icon,
  NoDataPill, PageSkeleton, Portal, Score, StatusPill
- **molecules/** (23): AIBanner, Accordion, AnalysisModal, Breadcrumbs, Card, DatePicker,
  DateRangeSelector, EmployeeRow, InviteModal, KPICard, LateItem, MetaSection, MetricCard, Modal,
  ProjectCard, ProjectRow, RangePicker, RecentReportItem, SkillList, SkillSpider, SlimProjectCard,
  Sparkline, StepTracker
- **organisms/** (31): AIContextView, AccountView, AddGoalSheet, AddProjectSheet, AppShellClient,
  AppShellServer, ApproveLeaveModal, DashboardView, EmployeeDashboardView, EmployeeShellClient,
  EmployeeShellServer, EmployeesView, GoalDetailView, GoalSubmissionCards, GoalsView,
  InviteEmployeeSheet, KnowledgeBaseView, LoginForm, ManageGoalTeamSheet, ManagePermissionsModal,
  ManageTeamSheet, NotificationsView, OnboardingView, OrganizationView, ProjectDetailView,
  ProjectsView, RegisterForm, ReportDetailView, ReportsView, SkillAnalysisBar, SubmitReportClient,
  SubmitReportView, UploadDataView

### Design token duplication — read before editing tokens

`src/design-system/tokens.ts` carries an explicit comment: *"This file mirrors
`zevian-ds/src/design/tokens.ts`."* A second, standalone copy of the same token system lives at
repo root in `zevian-ds/` (its own `README.md`, `tokens.ts`, `global.css`, meant to be copied into
other apps). `vitest.config.ts` aliases `@/design-system` to `./zevian-ds`; the live Next.js app's
`tsconfig` path presumably points `@/design-system` at `src/design-system` instead. **The two must
be kept in lockstep by hand** — if a color or component looks wrong in tests vs. the running app,
check which copy is actually in play.

### Two data-access patterns

Most pages call server actions in `src/app/actions/*.ts` (one file per domain: `askActions`,
`dashboardActions`, `employeeActions`, `goalActions`, `inviteActions`, `knowledgePinActions`,
`leaveActions`, `managerSettingsActions`, `managerUploadActions`, `notificationActions`,
`onboardingActions`, `organizationActions`, `projectActions`, `reportActions`). But
`src/app/(app)/goals/page.tsx` and `projects/page.tsx` import directly from a legacy
**`databaseService2`** module at repo root instead. New pages should follow the actions pattern.

## 4. Data model

Core tables in `reference/sc.sql` (938 lines), TEXT primary keys (app-generated IDs like `emp-...`):

| Table | Key columns / notes |
|---|---|
| `organizations` | `plan_tier`, `selected_metrics[]`, `goal_weight int default 70`, `ai_config jsonb`, `working_days int[]` |
| `employees` | `auth_user_id`, `role CHECK IN (manager,employee,admin)`, `manager_id → employees`, `is_account_owner`, unique on `(email, organization_id)` |
| `employee_permissions` | 1:1 per employee — `can_set_global_frequency`, `can_view_organization_wide`, `can_manage_settings`, `can_create_projects`, `can_create_goals`, `can_override_ai_scores`, `can_invite_users` |
| `projects` | `report_frequency CHECK IN (daily,weekly,bi-weekly,monthly)`, `status CHECK IN (active,at-risk,review,completed)`, `valid_report_days int[]`, `knowledge_base_cache jsonb` |
| `project_assignees` | join table, `assignee_type CHECK IN (employee,manager)` |
| `project_documents` | uploaded files metadata |
| `goals` | `instructions`, `deadline`, `status CHECK IN (active,completed)` |
| `goal_assignees` | join table (added later in the schema file) |
| `criteria` | `weight int 0-100`, `display_order`, `target_description` |
| `reports` | `evaluation_score numeric(4,2) 0-10`, `manager_overall_score`, `manager_override_reasoning`, `manager_calibration CHECK IN (agree,adjusted_up,adjusted_down)`, `consistency_flag CHECK IN (ESCALATING_CLAIMS,STAGNANT_LANGUAGE,STABLE)` |
| `report_criterion_scores` | `criterion_name`, `score 0-10`, `evidence`, `reasoning`, `coaching_note` |
| `invitations` | `token`, `role CHECK IN (manager,employee)`, `permission_template`, `custom_permissions jsonb` |
| `manager_settings` | `global_frequency`, `allow_late_submissions`, `backdate_limit_days`, `grace_period_days` |
| `leaves` | `leave_type CHECK IN (sick,vacation,personal,other)`, `approved_by` |
| `notifications` | `type CHECK IN (assignment,team_update,goal,performance,alert,info)`, populated by DB triggers |
| `organization_custom_metrics` | org-defined evaluation metrics blended into the score formula |
| `knowledge_pins` | `section CHECK IN (lexicon,priorities,benchmarks,constraints,general)` — backs the Knowledge Base feature |
| `goal_frequency_anchors` / `reporting_periods` | reporting-cadence engine; `reporting_periods.status CHECK IN (pending,submitted,missed,excused,void)` |
| `ask_queries` | logs every Ask question — `resolved_scope jsonb`, `answer_text`, `cited_report_ids jsonb`. Not surfaced in the UI. |

Five legacy frequency-day tables (`manager_selected_days`, `employee_frequency_settings`,
`employee_frequency_days`, `project_frequency_settings`, `project_frequency_days`) were created
then dropped in the same schema file in favor of the `working_days` / `valid_report_days` int-array
columns — if you see references to them elsewhere, they're dead.

### Functions & triggers

- `handle_new_user()` (SECURITY DEFINER, trigger on `auth.users` insert) — auto-provisions a new
  organization plus a `manager`, `is_account_owner=true` employee row on signup. **Whoever signs up
  first becomes the owning manager of a new org**; there's no separate "create org" step.
- `complete_invitation_flow(...)` (SECURITY DEFINER) — atomically creates the employee row from an
  accepted invite and assigns initial projects/goals.
- `notify_*` triggers populate `notifications` on project assignment, new team member, new goal,
  manager feedback, leave granted, goal assignment.

### RLS

Enabled on every table. Two SECURITY DEFINER helpers gate almost all policies: `get_my_org_id()`
and `is_manager()` (`role IN ('manager','admin')`). Pattern: employees `SELECT`/`UPDATE` their own
rows; managers get `SELECT`/`ALL` scoped to `organization_id = get_my_org_id()`. Storage bucket
`avatars` is public-read, 2MB cap, PNG/JPEG/WEBP, write restricted to
`storage.foldername(name)[1] = auth.uid()`.

## 5. AI scoring engine

Implemented in `src/app/api/ai/score-report/route.ts` (Gemini `gemini-2.5-flash`). Full rubric and
anti-gaming rules are documented in `docs/ai_scoring_mechanics.md` — still accurate, not
duplicated here. Score formula:

```
Final Score = [ Goal Average × Goal Weight% ] + [ Org Metrics Average × (100% − Goal Weight%) ]
```

`Goal Weight` is `organizations.goal_weight`, default 70.

## 6. Known gaps / tech debt

- `/settings` route folder exists with no `page.tsx` — dead route.
- `/api/webhooks/stripe/` is an empty folder, no `route.ts`, no Stripe SDK dependency — billing
  is schema-scaffolded (`organizations.plan_tier`) but not implemented.
- `KnowledgeBaseView` (`src/app/(app)/knowledge-base/page.tsx`) ships hardcoded `MOCK_PINS` /
  `MOCK_PROJECT_NAMES` fallback data alongside real Supabase-backed pins.
- `zevian-ds/` and `src/design-system/` are two hand-synced copies of the same design tokens (see
  §3). No build step keeps them in sync.
- `goals`/`projects` pages use the legacy `databaseService2` module instead of the `actions/*`
  pattern used everywhere else (see §3).

## 7. Corrections to older docs in this folder

`architecture_and_tech_stack.md` (pre-dates several rounds of dev work) states three things that no
longer match the code:

1. "Styling: Tailwind CSS & Vanilla CSS" — no Tailwind config exists; styling is the CSS-variable +
   token system described in §1.
2. "Icons: Lucide React (via custom Icon component)" — the icon set is fully hand-drawn SVG, no
   Lucide dependency.
3. "Deployment: Vercel (standard)" — actual deployment is Netlify (`netlify.toml` +
   `@netlify/plugin-nextjs`), matching `CLAUDE.md`.
4. "Fonts: Outfit (Global), DM Mono (Monospace)" — a third face, Plus Jakarta Sans, is now the
   dominant display/numeric typeface; Outfit is body/UI text only.

`docs/ai_scoring_mechanics.md`, `docs/business_requirements_document.md`, and
`docs/product_requirements_document.md` were spot-checked against the running code during this
review and remain accurate as of 2026-07-07.
