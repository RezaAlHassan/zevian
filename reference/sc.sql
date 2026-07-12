-- ============================================================================
-- 1. ORGANIZATIONS
-- ============================================================================
CREATE TABLE organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    plan_tier TEXT DEFAULT 'free',
    selected_metrics TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. PROJECTS TABLE
-- ============================================================================
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    report_frequency TEXT NOT NULL CHECK (report_frequency IN ('daily', 'weekly', 'bi-weekly', 'monthly')),
    knowledge_base_link TEXT,
    ai_context TEXT,
    created_by TEXT, 
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'at-risk', 'review', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_category ON projects(category);

-- ============================================================================
-- 3. EMPLOYEES TABLE
-- ============================================================================
CREATE TABLE employees (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id),
    auth_user_id UUID, 
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    title TEXT,
    dept TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL CHECK (role IN ('manager', 'employee', 'admin')),
    manager_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
    is_account_owner BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    join_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email, organization_id)
);

CREATE INDEX idx_employees_auth_user_id ON employees(auth_user_id);
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_email ON employees(email);

-- ============================================================================
-- 4. EMPLOYEE PERMISSIONS TABLE
-- ============================================================================
CREATE TABLE employee_permissions (
    employee_id TEXT PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
    can_set_global_frequency BOOLEAN DEFAULT FALSE,
    can_view_organization_wide BOOLEAN DEFAULT FALSE,
    can_manage_settings BOOLEAN DEFAULT FALSE,
    can_create_projects BOOLEAN DEFAULT FALSE,
    can_create_goals BOOLEAN DEFAULT FALSE,
    can_override_ai_scores BOOLEAN DEFAULT FALSE,
    can_invite_users BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- 5. PROJECT ASSIGNEES TABLE
-- ============================================================================
CREATE TABLE project_assignees (
    id SERIAL PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assignee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    assignee_type TEXT NOT NULL CHECK (assignee_type IN ('employee', 'manager')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (project_id, assignee_id)
);

CREATE INDEX idx_project_assignees_project_id ON project_assignees(project_id);
CREATE INDEX idx_project_assignees_assignee_id ON project_assignees(assignee_id);

-- ============================================================================
-- 6. PROJECT DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE project_documents (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by TEXT REFERENCES employees(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. GOALS TABLE
-- ============================================================================
CREATE TABLE goals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    instructions TEXT NOT NULL,
    deadline DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    manager_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
    created_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goals_project_id ON goals(project_id);
CREATE INDEX idx_goals_manager_id ON goals(manager_id);
CREATE INDEX idx_goals_deadline ON goals(deadline);
CREATE INDEX idx_goals_status ON goals(status);

-- ============================================================================
-- 8. CRITERIA TABLE
-- ============================================================================
CREATE TABLE criteria (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    weight INTEGER NOT NULL CHECK (weight >= 0 AND weight <= 100),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_criteria_goal_id ON criteria(goal_id);

-- ============================================================================
-- 9. REPORTS TABLE
-- ============================================================================
CREATE TABLE reports (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    report_text TEXT NOT NULL,
    submission_date TIMESTAMPTZ NOT NULL,
    evaluation_score NUMERIC(4,2) NOT NULL CHECK (evaluation_score >= 0 AND evaluation_score <= 10),
    manager_overall_score NUMERIC(4,2) CHECK (manager_overall_score >= 0 AND manager_overall_score <= 10),
    manager_override_reasoning TEXT,
    manager_feedback TEXT,
    reviewed_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    evaluation_reasoning TEXT NOT NULL,
    submitted_for_date DATE,
    submitted_at TIMESTAMPTZ,
    is_backdated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_goal_id ON reports(goal_id);
CREATE INDEX idx_reports_employee_id ON reports(employee_id);
CREATE INDEX idx_reports_submission_date ON reports(submission_date);
CREATE INDEX idx_reports_reviewed_by ON reports(reviewed_by);

-- ============================================================================
-- 10. REPORT CRITERION SCORES TABLE
-- ============================================================================
CREATE TABLE report_criterion_scores (
    id SERIAL PRIMARY KEY,
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    criterion_name TEXT NOT NULL,
    score NUMERIC(4,2) NOT NULL CHECK (score >= 0 AND score <= 10),
    evidence TEXT,
    reasoning TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_criterion_scores_report_id ON report_criterion_scores(report_id);

-- ============================================================================
-- 11. INVITATIONS TABLE
-- ============================================================================
CREATE TABLE invitations (
    id TEXT PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('manager', 'employee')),
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    invited_by TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    invited_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired')),
    initial_project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    initial_project_ids TEXT[],
    initial_goal_ids TEXT[],
    permission_template TEXT,
    custom_permissions JSONB,
    initial_manager_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);

-- ============================================================================
-- 12. SETTINGS TABLES
-- ============================================================================
CREATE TABLE manager_settings (
    id SERIAL PRIMARY KEY,
    manager_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    global_frequency BOOLEAN DEFAULT TRUE,
    report_frequency TEXT DEFAULT 'weekly',
    allow_late_submissions BOOLEAN DEFAULT TRUE,
    backdate_limit_days INTEGER,
    grace_period_days INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (manager_id)
);

CREATE TABLE manager_selected_days (
    id SERIAL PRIMARY KEY,
    manager_settings_id INTEGER NOT NULL REFERENCES manager_settings(id) ON DELETE CASCADE,
    day_name TEXT NOT NULL CHECK (day_name IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    UNIQUE (manager_settings_id, day_name)
);

CREATE TABLE employee_frequency_settings (
    id SERIAL PRIMARY KEY,
    manager_settings_id INTEGER NOT NULL REFERENCES manager_settings(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE (manager_settings_id, employee_id)
);

CREATE TABLE employee_frequency_days (
    id SERIAL PRIMARY KEY,
    employee_frequency_id INTEGER NOT NULL REFERENCES employee_frequency_settings(id) ON DELETE CASCADE,
    day_name TEXT NOT NULL CHECK (day_name IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    UNIQUE (employee_frequency_id, day_name)
);

CREATE TABLE project_frequency_settings (
    id SERIAL PRIMARY KEY,
    manager_settings_id INTEGER NOT NULL REFERENCES manager_settings(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE (manager_settings_id, project_id)
);

CREATE TABLE project_frequency_days (
    id SERIAL PRIMARY KEY,
    project_frequency_id INTEGER NOT NULL REFERENCES project_frequency_settings(id) ON DELETE CASCADE,
    day_name TEXT NOT NULL CHECK (day_name IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    UNIQUE (project_frequency_id, day_name)
);

-- ============================================================================
-- 12.5 LEAVES TABLE
-- ============================================================================
CREATE TABLE leaves (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('sick', 'vacation', 'personal', 'other')),
    note TEXT,
    approved_by TEXT NOT NULL REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leaves_employee_id ON leaves(employee_id);
CREATE INDEX idx_leaves_start_date ON leaves(start_date);
CREATE INDEX idx_leaves_end_date ON leaves(end_date);

-- ============================================================================
-- 13. TRIGGERS — updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at         BEFORE UPDATE ON projects         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at        BEFORE UPDATE ON employees        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leaves_updated_at           BEFORE UPDATE ON leaves           FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at            BEFORE UPDATE ON goals            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at          BEFORE UPDATE ON reports          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invitations_updated_at      BEFORE UPDATE ON invitations      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_manager_settings_updated_at BEFORE UPDATE ON manager_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 14. INVITATION FLOW (SMART FUNCTION)
-- ============================================================================
CREATE OR REPLACE FUNCTION complete_invitation_flow(
  token_input TEXT,
  user_name TEXT,
  auth_user_id_input UUID DEFAULT NULL,
  email_input TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_current_email TEXT;
  v_invite_record invitations%ROWTYPE;
  v_new_employee_id TEXT;
  v_pid TEXT;
  v_gid TEXT;
BEGIN
  v_current_user_id := COALESCE(auth_user_id_input, auth.uid());
  v_current_email := COALESCE(email_input, auth.jwt() ->> 'email');

  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID must be provided or user must be signed in';
  END IF;

  SELECT * INTO v_invite_record FROM invitations WHERE token = token_input;

  IF v_invite_record IS NULL THEN
    RAISE EXCEPTION 'Invalid invitation token';
  END IF;

  IF v_invite_record.status = 'accepted' THEN
    RAISE EXCEPTION 'Invitation already accepted';
  END IF;

  v_new_employee_id := 'emp-' || floor(extract(epoch from now()) * 1000)::text;

  INSERT INTO employees (
    id, organization_id, auth_user_id, name, email, role, manager_id, onboarding_completed, join_date
  ) VALUES (
    v_new_employee_id, v_invite_record.organization_id, v_current_user_id, user_name, v_invite_record.email,
    v_invite_record.role, v_invite_record.initial_manager_id, TRUE, NOW()
  );

  -- Assign Projects (array field takes priority over legacy single field)
  IF v_invite_record.initial_project_ids IS NOT NULL AND array_length(v_invite_record.initial_project_ids, 1) > 0 THEN
    FOREACH v_pid IN ARRAY v_invite_record.initial_project_ids
    LOOP
      INSERT INTO project_assignees (project_id, assignee_id, assignee_type)
      VALUES (v_pid, v_new_employee_id, v_invite_record.role)
      ON CONFLICT (project_id, assignee_id) DO NOTHING;
    END LOOP;
  ELSIF v_invite_record.initial_project_id IS NOT NULL THEN
    INSERT INTO project_assignees (project_id, assignee_id, assignee_type)
    VALUES (v_invite_record.initial_project_id, v_new_employee_id, v_invite_record.role)
    ON CONFLICT (project_id, assignee_id) DO NOTHING;
  END IF;

  -- Assign Goals
  IF v_invite_record.initial_goal_ids IS NOT NULL AND array_length(v_invite_record.initial_goal_ids, 1) > 0 THEN
    FOREACH v_gid IN ARRAY v_invite_record.initial_goal_ids
    LOOP
      INSERT INTO goal_assignees (goal_id, assignee_id, assignee_type)
      VALUES (v_gid, v_new_employee_id, v_invite_record.role)
      ON CONFLICT (goal_id, assignee_id) DO NOTHING;
    END LOOP;
  END IF;

  UPDATE invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE token = token_input;

  RETURN jsonb_build_object('success', true, 'employee_id', v_new_employee_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 15. ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE organizations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_permissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignees          ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_criterion_scores    ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations                ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_selected_days      ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_frequency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_frequency_days    ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_frequency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_frequency_days     ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents          ENABLE ROW LEVEL SECURITY;

-- Helpers
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS TEXT AS $$
  SELECT organization_id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('manager', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ORGANIZATIONS
CREATE POLICY "View own organization"       ON organizations FOR SELECT USING (id = get_my_org_id());
CREATE POLICY "Create organization"         ON organizations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Manager update organization" ON organizations FOR UPDATE USING (is_manager() AND id = get_my_org_id());

-- EMPLOYEES
CREATE POLICY "View own profile"          ON employees FOR SELECT USING (auth_user_id = auth.uid());
CREATE POLICY "View org employees"        ON employees FOR SELECT USING (organization_id = get_my_org_id());
CREATE POLICY "Update own profile"        ON employees FOR UPDATE USING (auth_user_id = auth.uid());
CREATE POLICY "Manager update employees"  ON employees FOR UPDATE USING (is_manager() AND organization_id = get_my_org_id());
CREATE POLICY "Create employee"           ON employees FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- EMPLOYEE PERMISSIONS
CREATE POLICY "View individual permissions" ON employee_permissions
    FOR SELECT USING (
        employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())
        OR (is_manager() AND EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.id = employee_permissions.employee_id 
            AND e.organization_id = get_my_org_id()
        ))
    );

CREATE POLICY "Manager manage permissions" ON employee_permissions
    FOR ALL USING (
        is_manager() AND EXISTS (
            SELECT 1 FROM employees e 
            WHERE e.id = employee_permissions.employee_id 
            AND e.organization_id = get_my_org_id()
        )
    );

-- PROJECTS
CREATE POLICY "View organization projects"              ON projects FOR SELECT USING (organization_id = get_my_org_id());
CREATE POLICY "Manager manage projects"                 ON projects FOR ALL    USING (is_manager() AND organization_id = get_my_org_id());
CREATE POLICY "Enable insert for authenticated users"   ON projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- GOALS
CREATE POLICY "View organization goals"              ON goals FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = goals.project_id AND projects.organization_id = get_my_org_id()));
CREATE POLICY "Manager manage goals"                 ON goals FOR ALL    USING (is_manager() AND EXISTS (SELECT 1 FROM projects WHERE projects.id = goals.project_id AND projects.organization_id = get_my_org_id()));
CREATE POLICY "Enable insert for authenticated users" ON goals FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- CRITERIA
CREATE POLICY "Enable read access for authenticated users" ON criteria FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users"      ON criteria FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for managers"             ON criteria FOR ALL    USING (is_manager());

-- REPORTS
CREATE POLICY "View own reports"           ON reports FOR SELECT USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));
CREATE POLICY "Manager view org reports"   ON reports FOR SELECT USING (is_manager() AND EXISTS (SELECT 1 FROM employees WHERE employees.id = reports.employee_id AND employees.organization_id = get_my_org_id()));
CREATE POLICY "Create own reports"         ON reports FOR INSERT WITH CHECK (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));
CREATE POLICY "Update own reports"         ON reports FOR UPDATE USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));
CREATE POLICY "Manager update org reports" ON reports FOR UPDATE USING (is_manager() AND EXISTS (SELECT 1 FROM employees WHERE employees.id = reports.employee_id AND employees.organization_id = get_my_org_id()));

-- REPORT CRITERION SCORES
CREATE POLICY "Enable read access for authenticated users" ON report_criterion_scores FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users"      ON report_criterion_scores FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- LEAVES
CREATE POLICY "View own leaves"        ON leaves FOR SELECT USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));
CREATE POLICY "Manager view org leaves"   ON leaves FOR SELECT USING (is_manager() AND get_my_org_id() = organization_id);
CREATE POLICY "Manager manage org leaves" ON leaves FOR ALL    USING (is_manager() AND get_my_org_id() = organization_id);

-- INVITATIONS
CREATE POLICY "Manager manage invitations" ON invitations FOR ALL    USING (is_manager() AND organization_id = get_my_org_id());
CREATE POLICY "Read invitations by token"  ON invitations FOR SELECT USING (true);

-- PROJECT DOCUMENTS
CREATE POLICY "View project documents"  ON project_documents FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_documents.project_id AND projects.organization_id = get_my_org_id()));
CREATE POLICY "Upload project documents" ON project_documents FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- PROJECT ASSIGNEES
CREATE POLICY "View organization project assignees" ON project_assignees FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_assignees.project_id AND projects.organization_id = (SELECT organization_id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1))
);
CREATE POLICY "Manager manage project assignees" ON project_assignees FOR ALL USING (
    is_manager() AND EXISTS (SELECT 1 FROM projects WHERE projects.id = project_assignees.project_id AND projects.organization_id = (SELECT organization_id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1))
);

-- MANAGER SETTINGS & RELATED TABLES
CREATE POLICY "Manage own settings"          ON manager_settings FOR ALL    USING (manager_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));
CREATE POLICY "View org manager settings"    ON manager_settings FOR SELECT USING (manager_id IN (SELECT id FROM employees WHERE organization_id = get_my_org_id()));
CREATE POLICY "Manage own selected days"     ON manager_selected_days FOR ALL    USING (manager_settings_id IN (SELECT id FROM manager_settings WHERE manager_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())));
CREATE POLICY "View org selected days"       ON manager_selected_days FOR SELECT USING (manager_settings_id IN (SELECT id FROM manager_settings WHERE manager_id IN (SELECT id FROM employees WHERE organization_id = get_my_org_id())));
CREATE POLICY "Manage emp freq settings"     ON employee_frequency_settings FOR ALL    USING (manager_settings_id IN (SELECT id FROM manager_settings WHERE manager_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())));
CREATE POLICY "View own freq settings"       ON employee_frequency_settings FOR SELECT USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));
CREATE POLICY "Manage emp freq days"         ON employee_frequency_days FOR ALL    USING (employee_frequency_id IN (SELECT efs.id FROM employee_frequency_settings efs JOIN manager_settings ms ON efs.manager_settings_id = ms.id WHERE ms.manager_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())));
CREATE POLICY "View own freq days"           ON employee_frequency_days FOR SELECT USING (employee_frequency_id IN (SELECT efs.id FROM employee_frequency_settings efs WHERE efs.employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())));
CREATE POLICY "Manage proj freq settings"    ON project_frequency_settings FOR ALL    USING (manager_settings_id IN (SELECT id FROM manager_settings WHERE manager_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())));
CREATE POLICY "View proj freq settings"      ON project_frequency_settings FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE organization_id = get_my_org_id()));
CREATE POLICY "Manage proj freq days"        ON project_frequency_days FOR ALL    USING (project_frequency_id IN (SELECT pfs.id FROM project_frequency_settings pfs JOIN manager_settings ms ON pfs.manager_settings_id = ms.id WHERE ms.manager_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())));
CREATE POLICY "View proj freq days"          ON project_frequency_days FOR SELECT USING (project_frequency_id IN (SELECT pfs.id FROM project_frequency_settings pfs JOIN projects p ON pfs.project_id = p.id WHERE p.organization_id = get_my_org_id()));

-- ============================================================================
-- 16. SEED DATA (Minimal Setup — dev reference only, omit for prod)
-- ============================================================================
-- INSERT INTO organizations (id, name, plan_tier) VALUES ('org-1', 'Acme Corp', 'business');
-- INSERT INTO employees ...
-- INSERT INTO employee_permissions ...
-- (Seed data commented out — run manually in dev only via schema_seed.sql)

-- ============================================================================
-- 17. NOTIFICATIONS SYSTEM
-- ============================================================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('assignment', 'team_update', 'goal', 'performance', 'alert', 'info')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own notifications"   ON notifications FOR SELECT USING (user_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));
CREATE POLICY "Update own notifications" ON notifications FOR UPDATE USING (user_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

-- ============================================================================
-- 18. NOTIFICATION TRIGGERS
-- ============================================================================

-- 1. New Project Assignment
CREATE OR REPLACE FUNCTION notify_project_assignment()
RETURNS TRIGGER AS $$
DECLARE
    project_name TEXT;
BEGIN
    SELECT name INTO project_name FROM projects WHERE id = NEW.project_id;
    INSERT INTO notifications (user_id, type, title, message, link_url)
    VALUES (NEW.assignee_id, 'assignment', 'New Project Assignment', 'You have been assigned to project: ' || project_name, '/projects/' || NEW.project_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_assignment
AFTER INSERT ON project_assignees
FOR EACH ROW EXECUTE FUNCTION notify_project_assignment();

-- 2. New Team Member (notifies manager)
CREATE OR REPLACE FUNCTION notify_new_team_member()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.manager_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, link_url)
        VALUES (NEW.manager_id, 'team_update', 'New Team Member', NEW.name || ' has joined your team.', '/employees/' || NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_team_member
AFTER INSERT ON employees
FOR EACH ROW EXECUTE FUNCTION notify_new_team_member();

-- 3. New Goal (notifies project assignees)
CREATE OR REPLACE FUNCTION notify_new_goal()
RETURNS TRIGGER AS $$
DECLARE
    assignee_rec RECORD;
    project_name TEXT;
BEGIN
    SELECT name INTO project_name FROM projects WHERE id = NEW.project_id;
    FOR assignee_rec IN SELECT assignee_id FROM project_assignees WHERE project_id = NEW.project_id
    LOOP
        IF assignee_rec.assignee_id != NEW.created_by THEN
            INSERT INTO notifications (user_id, type, title, message, link_url)
            VALUES (assignee_rec.assignee_id, 'goal', 'New Goal Added', 'A new goal "' || NEW.name || '" has been added to project: ' || project_name, '/goals/' || NEW.id);
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_goal
AFTER INSERT ON goals
FOR EACH ROW EXECUTE FUNCTION notify_new_goal();

-- 4. Manager Feedback (notifies employee)
CREATE OR REPLACE FUNCTION notify_manager_feedback()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.manager_feedback IS DISTINCT FROM NEW.manager_feedback) OR 
       (OLD.manager_overall_score IS DISTINCT FROM NEW.manager_overall_score) THEN
        INSERT INTO notifications (user_id, type, title, message, link_url)
        VALUES (NEW.employee_id, 'performance', 'Report Feedback', 'Your manager has updated feedback or scoring on your report.', '/reports/' || NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_manager_feedback
AFTER UPDATE ON reports
FOR EACH ROW EXECUTE FUNCTION notify_manager_feedback();

-- 5. Leave Granted (notifies employee)
CREATE OR REPLACE FUNCTION notify_leave_granted()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, link_url)
    VALUES (NEW.employee_id, 'info', 'Leave Granted', 'Leave has been granted from ' || NEW.start_date || ' to ' || NEW.end_date || '.', '/employees/' || NEW.employee_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_leave_granted
AFTER INSERT ON leaves
FOR EACH ROW EXECUTE FUNCTION notify_leave_granted();

-- ============================================================================
-- 19. STORAGE BUCKETS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

-- Note: DROP POLICY IF EXISTS used here only to make this block safely re-runnable
-- against an existing bucket without policy conflicts.
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars." ON storage.objects;
DROP POLICY IF EXISTS "Users can update avatars." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete avatars." ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload avatars."              ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update avatars."              ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete avatars."              ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- ============================================================================
-- 20. AUTH HOOK — handle_new_user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id TEXT;
  v_emp_id TEXT;
  v_user_name TEXT;
BEGIN
  v_org_id := 'org-' || substring(new.id::text from 1 for 8);
  v_emp_id := 'emp-' || substring(new.id::text from 1 for 8);
  v_user_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  INSERT INTO public.organizations (id, name)
  VALUES (v_org_id, v_user_name || '''s Org')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.employees (
    id, organization_id, auth_user_id, name, email, role, is_account_owner, onboarding_completed, join_date
  )
  VALUES (
    v_emp_id, v_org_id, new.id, v_user_name, new.email, 'manager', true, false, CURRENT_DATE
  )
  ON CONFLICT (auth_user_id) DO NOTHING;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Never let this trigger fail or Auth signup will return 500
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 21. ORGANIZATION CUSTOM METRICS
-- ============================================================================
CREATE TABLE IF NOT EXISTS organization_custom_metrics (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_custom_metrics_org_id ON organization_custom_metrics(organization_id);

ALTER TABLE organization_custom_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View organization custom metrics" ON organization_custom_metrics
    FOR SELECT USING (organization_id = get_my_org_id());

CREATE POLICY "Manager manage custom metrics" ON organization_custom_metrics
    FOR ALL USING (is_manager() AND organization_id = get_my_org_id());

CREATE TRIGGER update_org_custom_metrics_updated_at 
BEFORE UPDATE ON organization_custom_metrics 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AI Evaluation Config on Organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS goal_weight INTEGER DEFAULT 70;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS ai_config JSONB DEFAULT '{"allowLate": true, "requireReport": true, "notifyManager": false}'::jsonb;

-- ============================================================================
-- 22. KNOWLEDGE PINS
-- ============================================================================
CREATE TABLE IF NOT EXISTS knowledge_pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    section TEXT NOT NULL CHECK (section IN ('lexicon', 'priorities', 'benchmarks', 'constraints', 'general')),
    content TEXT NOT NULL,
    created_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_pins_project_id ON knowledge_pins(project_id);

ALTER TABLE projects ADD COLUMN IF NOT EXISTS knowledge_base_cache JSONB;

ALTER TABLE knowledge_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View project pins" ON knowledge_pins
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM projects WHERE projects.id = knowledge_pins.project_id AND projects.organization_id = (SELECT organization_id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1))
    );

CREATE POLICY "Manager manage pins" ON knowledge_pins
    FOR ALL USING (
        EXISTS (SELECT 1 FROM employees WHERE auth_user_id = auth.uid() AND role IN ('manager', 'admin') AND organization_id = (SELECT organization_id FROM projects WHERE projects.id = knowledge_pins.project_id))
    );

-- ============================================================================
-- 23. GOAL ASSIGNEES
-- ============================================================================
CREATE TABLE IF NOT EXISTS goal_assignees (
    id SERIAL PRIMARY KEY,
    goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    assignee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    assignee_type TEXT NOT NULL CHECK (assignee_type IN ('employee', 'manager')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (goal_id, assignee_id)
);

CREATE INDEX IF NOT EXISTS idx_goal_assignees_goal_id ON goal_assignees(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_assignees_assignee_id ON goal_assignees(assignee_id);

ALTER TABLE goal_assignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View organization goal assignees" ON goal_assignees FOR SELECT USING (
    EXISTS (SELECT 1 FROM goals g JOIN projects p ON g.project_id = p.id WHERE g.id = goal_assignees.goal_id AND p.organization_id = (SELECT e.organization_id FROM employees e WHERE e.auth_user_id = auth.uid() LIMIT 1))
);

CREATE POLICY "Manager manage goal assignees" ON goal_assignees FOR ALL USING (
    is_manager() AND EXISTS (SELECT 1 FROM goals g JOIN projects p ON g.project_id = p.id WHERE g.id = goal_assignees.goal_id AND p.organization_id = (SELECT e.organization_id FROM employees e WHERE e.auth_user_id = auth.uid() LIMIT 1))
);

-- Goal assignment notification trigger
CREATE OR REPLACE FUNCTION notify_goal_assignment()
RETURNS TRIGGER AS $$
DECLARE
    v_goal_name TEXT;
    v_project_id TEXT;
BEGIN
    SELECT g.name, g.project_id INTO v_goal_name, v_project_id FROM goals g WHERE g.id = NEW.goal_id;
    INSERT INTO notifications (user_id, type, title, message, link_url)
    VALUES (NEW.assignee_id, 'goal', 'New Goal Assignment', 'You have been explicitly assigned to goal: ' || v_goal_name, '/goals/' || NEW.goal_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_goal_assignment ON goal_assignees;
CREATE TRIGGER on_goal_assignment
AFTER INSERT ON goal_assignees
FOR EACH ROW EXECUTE FUNCTION notify_goal_assignment();

-- ============================================================================
-- 24. REPORTING PERIODS SYSTEM
-- ============================================================================

-- 24a. Goal Frequency Anchors
CREATE TABLE IF NOT EXISTS goal_frequency_anchors (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'bi-weekly', 'monthly')),
    anchor_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One active anchor per (goal, employee)
CREATE UNIQUE INDEX IF NOT EXISTS idx_gfa_unique_active ON goal_frequency_anchors (goal_id, employee_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_gfa_goal_id     ON goal_frequency_anchors(goal_id);
CREATE INDEX IF NOT EXISTS idx_gfa_employee_id ON goal_frequency_anchors(employee_id);

-- 24b. Reporting Periods
CREATE TABLE IF NOT EXISTS reporting_periods (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'missed', 'excused', 'void')),
    late_submitted BOOLEAN NOT NULL DEFAULT FALSE,
    backdated_after_missed_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    report_id TEXT REFERENCES reports(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rp_goal_id     ON reporting_periods(goal_id);
CREATE INDEX IF NOT EXISTS idx_rp_employee_id ON reporting_periods(employee_id);
CREATE INDEX IF NOT EXISTS idx_rp_status      ON reporting_periods(status);
CREATE INDEX IF NOT EXISTS idx_rp_period_end  ON reporting_periods(period_end);
CREATE INDEX IF NOT EXISTS idx_rp_report_id   ON reporting_periods(report_id);

CREATE TRIGGER update_reporting_periods_updated_at
BEFORE UPDATE ON reporting_periods
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE goal_frequency_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reporting_periods      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own frequency anchors"         ON goal_frequency_anchors FOR SELECT USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));
CREATE POLICY "Manager view org frequency anchors" ON goal_frequency_anchors FOR SELECT USING (is_manager() AND employee_id IN (SELECT id FROM employees WHERE organization_id = get_my_org_id()));
CREATE POLICY "Manager manage frequency anchors"   ON goal_frequency_anchors FOR ALL    USING (is_manager() AND employee_id IN (SELECT id FROM employees WHERE organization_id = get_my_org_id()));
CREATE POLICY "Service role manage frequency anchors" ON goal_frequency_anchors FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "View own reporting periods"         ON reporting_periods FOR SELECT USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));
CREATE POLICY "Manager view org reporting periods" ON reporting_periods FOR SELECT USING (is_manager() AND employee_id IN (SELECT id FROM employees WHERE organization_id = get_my_org_id()));
CREATE POLICY "Manager manage reporting periods"   ON reporting_periods FOR ALL    USING (is_manager() AND employee_id IN (SELECT id FROM employees WHERE organization_id = get_my_org_id()));
CREATE POLICY "Service role manage reporting periods" ON reporting_periods FOR ALL  USING (auth.role() = 'authenticated');


ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE criteria ADD COLUMN IF NOT EXISTS target_description TEXT;
ALTER TABLE report_criterion_scores ADD COLUMN IF NOT EXISTS coaching_note TEXT;

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS manager_calibration TEXT
CHECK (manager_calibration IN ('agree', 'adjusted_up', 'adjusted_down'));

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS consistency_flag TEXT
CHECK (consistency_flag IN ('ESCALATING_CLAIMS', 'STAGNANT_LANGUAGE', 'STABLE'));

ALTER TABLE reports
ADD COLUMN IF NOT EXISTS consistency_note TEXT;


-- 1. Add working days to organizations (org-level default)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS working_days integer[] DEFAULT '{1,2,3,4,5}';

-- 2. Add valid report days to projects (per-project override)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS valid_report_days integer[] DEFAULT '{1,2,3,4,5}';

-- 3. Drop the five unused legacy tables
DROP TABLE IF EXISTS project_frequency_days CASCADE;
DROP TABLE IF EXISTS employee_frequency_days CASCADE;
DROP TABLE IF EXISTS manager_selected_days CASCADE;
DROP TABLE IF EXISTS employee_frequency_settings CASCADE;
DROP TABLE IF EXISTS project_frequency_settings CASCADE;

-- Log of every Ask query: the question, the scope the resolve step settled on,
-- the answer, and which reports the answer cited. Persisted for later reference
-- only — not surfaced in the UI.
CREATE TABLE IF NOT EXISTS ask_queries (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT REFERENCES organizations(id),
    manager_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    resolved_scope JSONB NOT NULL,        -- { employeeIds, startDate, endDate, goalId }
    answer_text TEXT NOT NULL,
    cited_report_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ask_queries_organization_id ON ask_queries(organization_id);
CREATE INDEX IF NOT EXISTS idx_ask_queries_manager_id ON ask_queries(manager_id);
CREATE INDEX IF NOT EXISTS idx_ask_queries_created_at ON ask_queries(created_at);

-- Profile pictures for employees.
--
-- The employees.avatar_url column already exists (mapped in dbEmployeeToEmployee and selected in
-- report queries); ADD COLUMN IF NOT EXISTS is kept only so a fresh/prod DB stays in parity.
alter table employees add column if not exists avatar_url text;

-- ── Storage bucket ──────────────────────────────────────────────────────────
-- Public bucket so a plain <img src> renders without minting signed URLs. Small images only
-- (2 MB cap), common web image types. Idempotent: re-running updates the limits.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png','image/jpeg','image/jpg','image/webp'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ── RLS policies on storage.objects ─────────────────────────────────────────
-- Read: anyone (public bucket). Write/update/delete: only the authenticated user, and only inside
-- their own top-level folder {auth.uid()}/…  — so no one can overwrite another user's avatar.
-- Files are uploaded to  avatars/{auth.uid()}/avatar-<ts>.<ext>  (see AccountView upload).
drop policy if exists "avatars_public_read"  on storage.objects;
drop policy if exists "avatars_user_insert"  on storage.objects;
drop policy if exists "avatars_user_update"  on storage.objects;
drop policy if exists "avatars_user_delete"  on storage.objects;

create policy "avatars_public_read" on storage.objects
  for select
  using (bucket_id = 'avatars');

create policy "avatars_user_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_user_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_user_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
