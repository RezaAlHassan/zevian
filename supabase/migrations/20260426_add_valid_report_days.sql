ALTER TABLE projects
ADD COLUMN IF NOT EXISTS valid_report_days integer[] DEFAULT '{1,2,3,4,5}';
