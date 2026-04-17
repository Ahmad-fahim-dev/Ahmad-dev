
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function debugAdmin() {
    console.log('--- Debugging Admin User ---');

    // 1. Fetch all admins
    const { data: admins, error } = await supabase
        .from('admins')
        .select('*');

    if (error) {
        console.error('❌ Error fetching admins:', error.message);
        return;
    }

    if (!admins || admins.length === 0) {
        console.log('⚠️ No admin users found in database!');
        return;
    }

    console.log(`Found ${admins.length} admin(s):`);

    // 2. Check each admin
    for (const admin of admins) {
        console.log(`\nUser in DB: '${admin.username}'`);
        console.log(`Hash in DB: ${admin.password.substring(0, 20)}...`);

        // 3. Test Passwords
        const isMatchNew = bcrypt.compareSync('iamkhanbb', admin.password);
        const isMatchOld = bcrypt.compareSync('$$dollar$$', admin.password);
        const isMatchOld2 = bcrypt.compareSync('password123', admin.password);

        console.log(`- Password 'iamkhanbb' match? ${isMatchNew ? '✅ YES' : '❌ NO'}`);
        console.log(`- Password '$$dollar$$' match? ${isMatchOld ? '✅ YES' : '❌ NO'}`);
        console.log(`- Password 'password123' match? ${isMatchOld2 ? '✅ YES' : '❌ NO'}`);
    }
}

debugAdmin();
