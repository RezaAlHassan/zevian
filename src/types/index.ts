export interface Organization {
    id: string;
    name: string;
    planTier?: string;
    selectedMetrics?: string[];
    goalWeight?: number;
    aiConfig?: {
        allowLate?: boolean;
        allowLateSubmissions?: boolean;
        requireReport?: boolean;
        notifyManager?: boolean;
    };
    customMetrics?: CustomMetric[];
    createdAt?: string;
}

export interface CustomMetric {
    id: string;
    organizationId: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}


export interface Project {
    id: string;
    name: string;
    description?: string;
    emoji?: string;
    category?: string;
    frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    reportFrequency?: string;
    avgScore?: number;
    reportCount?: number;
    goalCount?: number;
    lastReportAt?: string;
    status?: 'active' | 'archived';
    organizationId?: string;
    createdBy?: string;
    createdAt?: string;
    knowledgeBaseLink?: string;
    aiContext?: string;
    knowledgeBaseCache?: string;
    assignees?: string[] | any[];
}

export interface Goal {
    id: string;
    name: string;
    instructions?: string;
    deadline?: string;
    avgScore?: number;
    reportCount?: number;
    status?: 'active' | 'archived' | 'completed';
    projectId?: string;
    createdBy?: string;
    managerId?: string;
    createdAt?: string;
    projectName?: string;
    criteria?: any[];
    assignees?: string[] | any[];
    reports?: Report[];
    project?: Project;
}

export interface Employee {
    id: string;
    name: string;
    full_name?: string;
    email: string;
    title?: string;
    dept?: string;
    avatarUrl?: string;
    role?: 'manager' | 'employee' | 'admin';
    organizationId?: string;
    managerId?: string;
    isActive?: boolean;
    isAccountOwner?: boolean;
    onboardingCompleted?: boolean;
    joinDate?: string;
    skillAnalysis?: any;
    permissions?: any;
    createdAt?: string;
    authUserId?: string;
}

export interface Report {
    id: string;
    content?: string;
    reportText?: string;
    score?: number | null;
    status?: 'pending' | 'scored' | 'reviewed' | 'late';
    aiSummary?: string;
    evaluationReasoning?: string;
    isOnLeave?: boolean;
    managerOverrideScore?: number;
    managerOverallScore?: number;
    managerOverrideReasoning?: string;
    managerNote?: string;
    managerFeedback?: string;
    reviewedBy?: string;
    employeeId?: string;
    goalId?: string;
    createdAt?: string;
    submissionDate?: string;
    submittedForDate?: string;
    evaluationScore?: number;
    criterionScores?: any[];
    goals?: any;
    employees?: any;
}

export interface Notification {
    id: string;
    userId: string;
    type: 'alert' | 'message' | 'goal_update' | 'info';
    title: string;
    message: string;
    linkUrl?: string;
    isRead: boolean;
    createdAt?: string;
}

export interface Leave {
    id: string;
    employeeId: string;
    organizationId: string;
    startDate: string;
    endDate: string;
    leaveType: 'sick' | 'vacation' | 'personal' | 'other';
    note?: string;
    approvedBy: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface ManagerSettings {
    id: string;
    managerId: string;
    globalFrequency: boolean;
    reportFrequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
    allowLateSubmissions: boolean;
    gracePeriodDays: number;
    backdateLimitDays: number;
    createdAt?: string;
    updatedAt?: string;
}
