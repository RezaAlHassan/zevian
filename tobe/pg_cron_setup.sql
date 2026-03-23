-- ==========================================
-- Supabase Scheduled Job (pg_cron + pg_net)
-- ==========================================

-- Ensure the pg_net extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Enable pg_cron (if available on your Supabase plan, usually enabled by default)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop existing job if replacing
SELECT cron.unschedule('missed-report-checker');

-- Schedule the job to run at the start of every hour
-- It calls the Next.js API route to process overdue reporting periods.
-- REPLACE 'https://your-production-url.com' WITH YOUR ACTUAL PRODUCTION DOMAIN
SELECT cron.schedule(
  'missed-report-checker', 
  '0 * * * *', -- At minute 0 past every hour
  $$
    SELECT net.http_get(
        url := 'https://your-production-url.com/api/cron/missed-reports',
        headers := '{"Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
    );
  $$
);
