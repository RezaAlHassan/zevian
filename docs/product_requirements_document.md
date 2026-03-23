# Zevian: Product Requirements Document (PRD)

## 1. Executive Summary
Zevian is an AI-powered performance management platform designed for remote and hybrid teams. It automates the evaluation of employee progress reports using Large Language Models (LLMs), providing objective feedback and reducing manager overhead.

## 2. Target Audience
- **Small to Medium Organizations**: Seeking modern, automated performance tracking.
- **Remote Teams**: Needing structured reporting and objective evaluation across time zones.
- **Managers**: Looking to save time on manual report reviews and feedback loops.

## 3. Key Features

### 3.1 Goal & Project Management
- **Hierarchical Structure**: Projects containing multiple goals.
- **Clear Instructions**: Goals include specific instructions and evaluation criteria.
- **Assignment**: Goals can be assigned to multiple employees and overseen by managers.

### 3.2 AI-Powered Reporting
- **Report Submission**: Employees submit text-based reports for assigned goals.
- **AI Evaluation**: The system automatically scores reports based on goal criteria using Google Gemini.
- **Reasoning & Summaries**: AI provides a summary of the report and detailed reasoning for the score.
- **Manager Override**: Managers can review AI scores and override them with their own evaluation and feedback.

### 3.3 Dashboard & Analytics
- **Manager Dashboard**: Overview of team performance, recent reports, and at-risk goals.
- **Employee Dashboard**: View of personal goals, recent scores, and upcoming deadlines.
- **Score Trends**: Visualisation of performance over time.

### 3.4 Knowledge Base
- **Context Preservation**: Project-specific knowledge (Lexicon, Priorities, Constraints) to help AI evaluate reports more accurately.
- **Pinned Knowledge**: Managers can pin important artifacts for the team.

### 3.5 Automated Notifications
- Real-time alerts for new assignments, report feedback, and organization updates.

## 4. User Roles & Permissions
- **Admin**: Organization management, billing, global settings.
- **Manager**: Team oversight, project/goal creation, report review, invitations.
- **Employee**: Submitting reports, viewing personal performance data.

## 5. Success Metrics
- **Time Saved**: Reduction in time spent by managers reviewing reports.
- **Objective Feedback**: Improved employee satisfaction with evaluation fairness.
- **Completion Rate**: Percentage of goals met on time.
