import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://aactkegmfwsjefzlhnoi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhY3RrZWdtZndzamVmemxobm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTEyMzM1NSwiZXhwIjoyMDgwNjk5MzU1fQ.ZmfgeMGxrLZUqO4txkTCajUVtWGBlZ-ZDN_0Cokb12A';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runQueries() {
  try {
    const q1 = await supabase.from('project_assignees').select('*').limit(2);
    
    fs.writeFileSync('tobe/assignments_schema.json', JSON.stringify({ 
      project_assignees: q1.data || q1.error?.message || []
    }, null, 2));
  } catch(e) {
    fs.writeFileSync('tobe/assignments_schema.json', JSON.stringify({ error: e.message }));
  }
}

await runQueries();
