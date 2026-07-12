# Zevian Documentation Suite

Welcome to the comprehensive documentation for the **Zevian** AI-powered performance management platform.

### Overview
Zevian is designed to revolutionize performance management for remote teams by leveraging LLMs to provide objective, real-time feedback and structured goal tracking.

### Documentation Components

1.  **[Technical Reference](./technical_reference.md)**: Verified-against-source engineering reference — tech stack, route/shell structure, component conventions, data model, known gaps. Start here for anything technical.
2.  **[Architecture & Tech Stack](./architecture_and_tech_stack.md)**: High-level framing (superseded by Technical Reference for specifics — corrections applied 2026-07-07).
3.  **[Product Requirements Document (PRD)](./product_requirements_document.md)**: Outlines high-level target audience, features, and success metrics.
4.  **[Business Requirements Document (BRD)](./business_requirements_document.md)**: Focuses on business objectives, operational efficiency, and ROI.
5.  **[Software Requirements Specification (SRS)](./software_requirements_specification.md)**: Detailed technical requirements (DB Schema, RLS, AI logic).
6.  **[User Flows & Sitemap](./user_flows_and_sitemap.md)**: Maps out the user journey and site architecture.
7.  **[AI Scoring Mechanics & Integrity](./ai_scoring_mechanics.md)**: Explains the robust, anti-gaming logic enforcing the automated performance evaluations.

### Visual references (shared as Artifacts, 2026-07-07)

- **Design System** — live color/type/spacing/icon/component reference, pulled from `src/design-system/tokens.ts` and `Icon.tsx`.
- **Product Reference** — personas, feature inventory, the report→score loop, roadmap.
- **Business Reference** — value proposition, scoring economics, multi-tenancy model, roadmap.
- **Design Reference** — sitemap, shell architecture, role-based view reuse, report-state patterns.


---

### Highlights of the Zevian Platform
- **AI-Driven Evaluation**: Automation of the report grading process using Google Gemini.
- **Granular Permissions**: Secure data isolation via Supabase RLS.
- **Dynamic Hierarchy**: Flexible organization of projects, goals, and team members.
- **Real-Time Feedback**: Automated notifications and performance tracking.
