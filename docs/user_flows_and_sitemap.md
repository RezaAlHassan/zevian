# Zevian: User Flows & Sitemap

## 1. Sitemap

### Public / Auth
- `/login`: User authentication.
- `/signup`: New organization registration.
- `/verify-email`: Email verification.
- `/onboarding`: Profile setup and organization joining.
- `/accept-invite`: Specialized landing for invited users.

### Manager / Admin View (`(app)` group)
- `/dashboard`: Overall team performance and KPIs.
- `/projects`: List of all active and archived projects.
    - `/projects/[id]`: Project details and goal list.
- `/goals`: Overview of all goals.
- `/reports`: Feed of submitted reports for review.
- `/employees`: Team directory and performance profiles.
- `/organization`: Organization settings, metrics, and hierarchy.
- `/settings`: Personal user settings.

### Employee View (`(employee)` group)
- `/my-dashboard`: Personal performance metrics.
- `/my-goals`: List of assigned goals and status.
- `/my-reports`: History of submitted reports and feedback.
- `/my-projects`: View-only list of assigned projects.
- `/my-account`: Personal profile management.

---

## 2. Core User Flows

### 2.1 Employee: Submitting a Report
1. **Trigger**: Employee accesses dashboard or goal list.
2. **Action**: Clicks "Submit Report" on an active goal.
3. **Drafting**: Navigates to `/submit-report`, enters progress text.
4. **Submission**: Report sent to backend.
5. **AI Processing**: API Route triggers Gemini evaluation.
6. **Result**: Report status moves from `pending` to `scored`.
7. **Feedback**: Employee receives notification when scoring is complete.

### 2.2 Manager: Reviewing Performance
1. **Discovery**: Manager opens `/dashboard` or `/reports`.
2. **Review**: Clicks on a `scored` report.
3. **Analysis**: Views AI summary and reasoning.
4. **Interaction**: (Optional) Enters manager override score and feedback.
5. **Completion**: Report status moves to `reviewed`, notification sent to employee.

### 2.3 Admin: Onboarding a Team
1. **Setup**: Admin creates organization via `/signup`.
2. **Configuration**: Defines custom metrics in `/organization`.
3. **Invitation**: Sends email invites to team members via `/employees`.
4. **Structuring**: Creates Projects and Goals, assigning them to incoming members.
