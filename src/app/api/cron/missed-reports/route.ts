import { NextResponse } from 'next/server';
import { runMissedReportCheck } from '@/lib/reportingPeriodsMaintenance';

export const dynamic = 'force-dynamic'

/**
 * Scheduled Cron Job Endpoint for Checking Missed Reports
 * 
 * This endpoint should be called periodically (e.g., every hour) by a cron system
 * like Supabase pg_net + pg_cron, Vercel Cron Functions, or a standard crontab.
 * 
 * It runs the maintenance script to identify overdue reporting periods, correctly
 * applying grace periods and checking for approved leaves, and marking periods
 * as 'missed', 'amber_missed', or 'excused' where appropriate. It also forces
 * the generation of the sequential next period.
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Only enforce secret if it's set in the environment.
    // If you expose this publicly, you MUST set CRON_SECRET in your .env
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run the global maintenance check (no employeeId argument means all employees)
    const result = await runMissedReportCheck();

    return NextResponse.json({ 
        success: true, 
        message: 'Missed report check completed successfully',
        data: result
    });
  } catch (error: any) {
    console.error('Cron job failed - Missed Report Check:', error);
    return NextResponse.json({ 
        success: false, 
        error: error.message 
    }, { status: 500 });
  }
}
