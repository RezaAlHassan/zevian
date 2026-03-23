-- Step 7 Schema Updates for Reporting Periods

-- Add column for backdated submissions to track retroactively submitted reports
-- that were already marked as 'missed' previously.
ALTER TABLE public.reporting_periods 
ADD COLUMN IF NOT EXISTS backdated_after_missed_flagged boolean NOT NULL DEFAULT false;

-- It's also recommended to add a constraint to ensure 'void' and 'excused' periods
-- don't get report_ids unintentionally attached to them, but this is optional.
