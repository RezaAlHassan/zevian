# Zevian: Software Requirements Specification (SRS)

## 1. Introduction
This document details the technical requirements and system behavior for the Zevian performance management platform.

## 2. Technical Requirements

### 2.1 Backend (Supabase)
- **Database**: PostgreSQL with the following core schemas:
    - `organizations`: Multi-tenant root.
    - `employees`: User data linked to Supabase Auth `uuid`.
    - `projects` & `goals`: Hierarchical task management.
    - `reports` & `report_criterion_scores`: Performance data storage.
- **Row Level Security (RLS)**: Mandatory for all tables. Policies must enforce organization-level isolation.
- **Functions & Triggers**:
    - `complete_invitation_flow`: Atomically handle user onboarding and project assignment.
    - `notify_*` triggers: Automatic notification generation on database events.

### 2.2 AI Integration
- **LLM Provider**: Google Gemini (`gemini-pro`).
- **Processing**: API Routes (e.g., `/api/ai`) must handle authentication and call the Gemini SDK.
- **Data Privacy**: AI prompts must avoid sending personally identifiable information (PII) beyond what is necessary for evaluation (e.g., task instructions and report text).

### 2.3 Frontend (Next.js)
- **Framework**: Next.js 14 App Router.
- **Auth Flow**: Middleware-based redirection. Unauthenticated users restricted to `/login`, `/signup`, `/verify-email`.
- **Performance**: Use of Server Components for data fetching to minimize client-side bundle size.

## 3. Functional Requirements

### 3.1 Authentication & Onboarding
- Support for organization creation or joining via invitation.
- Mandatory onboarding flow to collect user details (name, title, dept).

### 3.2 Report Submission
- Form for employees to submit periodic reports against specific goals.
- Validation to prevent duplicate reports for the same period (if applicable).

### 3.3 Scoring & Feedback
- AI scoring based on a 1-10 scale.
- Storage of criterion-specific scores and evidence.
- Interface for managers to override AI scores with justification.

## 4. Non-Functional Requirements
- **Security**: All API calls must be authenticated. RLS must be the primary line of defense for data.
- **Availability**: 99.9% uptime for core reporting functions.
- **Latency**: AI evaluation should complete within 30 seconds.
- **Usability**: Responsive design supporting desktop and tablet users.
