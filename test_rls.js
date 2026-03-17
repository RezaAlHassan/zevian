require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testRLS() {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Create a dummy Auth user to act as the new user
    const email = `test-${Date.now()}@test.com`;
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
        email,
        password: 'password123',
    });

    if (authError) {
        console.error("Auth Error:", authError);
        return;
    }

    const userId = authData.user.id;

    // 2. Login as that user to get a session (client context)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    await supabase.auth.signInWithPassword({
        email,
        password: 'password123'
    });

    console.log("Logged in as new user:", userId);

    const orgId = `org-${userId.substring(0, 8)}`;
    const empId = `emp-${userId.substring(0, 8)}`;

    // 3. Try creating Org
    console.log("Inserting Org...");
    const { error: orgError } = await supabase.from('organizations').insert({
        id: orgId,
        name: "Test Org"
    });
    console.log("Org Insert Error:", orgError);

    // 4. Try creating Employee
    console.log("Inserting Employee...");
    const { error: empError } = await supabase.from('employees').insert({
        id: empId,
        organization_id: orgId,
        auth_user_id: userId,
        name: "Test User",
        email: email,
        role: "manager"
    });
    console.log("Employee Insert Error:", empError);

    // 5. Cleanup
    await supabaseAdmin.auth.admin.deleteUser(userId);
}

testRLS();
