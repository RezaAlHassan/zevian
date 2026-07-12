-- Audit stamp for manager-triggered AI re-scoring of a report.
-- rescored_by stores the display name of the manager who re-scored; rescored_at the time.
ALTER TABLE reports ADD COLUMN IF NOT EXISTS rescored_at timestamptz;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS rescored_by text;
