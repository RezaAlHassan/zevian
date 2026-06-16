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

-- RLS on with NO policies: anon and user-session clients can neither read nor write
-- this table. Writes happen only via the service-role admin client (bypasses RLS) in
-- askActions.ts; the log is never read back in the UI.
ALTER TABLE ask_queries ENABLE ROW LEVEL SECURITY;
