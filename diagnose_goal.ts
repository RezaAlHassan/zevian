
import { createClient } from '@supabase/supabase-js';

async function diagnose() {
    const supabase = createClient(
        'https://aactkegmfwsjefzlhnoi.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhY3RrZWdtZndzamVmemxobm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTEyMzM1NSwiZXhwIjoyMDgwNjk5MzU1fQ.ZmfgeMGxrLZUqO4txkTCajUVtWGBlZ-ZDN_0Cokb12A'
    );

    console.log('Searching for goal: "Prototype Connectivity App MVP with Client Design"');
    const { data: goals, error: gError } = await supabase
        .from('goals')
        .select('*, projects(name, report_frequency), reports(*)')
        .ilike('name', '%Prototype Connectivity App%');

    if (gError) {
        console.error('Error fetching goals:', gError);
        return;
    }

    if (!goals || goals.length === 0) {
        console.log('No matching goal found.');
        return;
    }

    for (const goal of goals) {
        console.log('\n--- Goal ---');
        console.log('ID:', goal.id);
        console.log('Name:', goal.name);
        console.log('Project:', goal.projects?.name);
        console.log('Frequency:', goal.projects?.report_frequency);
        console.log('Reports Count:', goal.reports?.length);

        if (goal.reports && goal.reports.length > 0) {
            console.log('Recent Reports:');
            goal.reports.forEach((r: any) => {
                console.log(`- ID: ${r.id}, SubDate: ${r.submission_date}, ForDate: ${r.submitted_for_date}`);
            });
        }
    }
}

diagnose();
