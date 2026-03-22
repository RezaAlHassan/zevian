import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://aactkegmfwsjefzlhnoi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhY3RrZWdtZndzamVmemxobm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTEyMzM1NSwiZXhwIjoyMDgwNjk5MzU1fQ.ZmfgeMGxrLZUqO4txkTCajUVtWGBlZ-ZDN_0Cokb12A';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runQueries() {
  const q1 = await supabase.from('reporting_periods').select('*', { count: 'exact', head: true });
  
  const q2 = await supabase.from('reporting_periods')
    .select('employee_id, goal_id, status, period_start, period_end')
    .order('created_at', { ascending: false })
    .limit(20);

  const q3 = await supabase.from('manager_settings')
    .select('manager_id, global_frequency, allow_late_submissions')
    .limit(10);
    
  const result = {
    count: q1.count,
    periods: q2.data,
    settings: q3.data
  };
  
  fs.writeFileSync('tobe/db_output.json', JSON.stringify(result, null, 2));
}

await runQueries();
