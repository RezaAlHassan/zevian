
import { goalService } from './databaseService2';
import { supabase } from './supabaseClient';

async function test() {
    try {
        // Find a user to test with
        const { data: employees } = await supabase.from('employees').select('id').limit(1);
        if (!employees || employees.length === 0) {
            console.log('No employees found');
            return;
        }
        const empId = employees[0].id;
        console.log('Testing with employee:', empId);

        const goals = await goalService.getByEmployeeId(empId);
        console.log('Fetched', goals.length, 'goals');
        
        if (goals.length > 0) {
            const firstGoal = goals[0];
            console.log('First goal reports:', firstGoal.reports ? firstGoal.reports.length : 'MISSING');
            if (firstGoal.reports && firstGoal.reports.length > 0) {
                console.log('First report submissionDate:', firstGoal.reports[0].submissionDate);
            }
        }
    } catch (err) {
        console.error('Test failed:', err);
    }
}

test();
