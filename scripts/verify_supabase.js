
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', SUPABASE_URL ? 'Found' : 'Missing');
console.log('Key:', SUPABASE_ANON_KEY ? 'Found' : 'Missing');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
    try {
        // Try to fetch 1 blog post to verify read access
        const { data, error } = await supabase
            .from('blogs')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Connection Failed:', error.message);
            console.error('Details:', error);
        } else {
            console.log('✅ Connection Successful!');
            console.log('Fetched Data:', data.length, 'rows');
        }
    } catch (err) {
        console.error('❌ Unexpected Error:', err.message);
    }
}

testConnection();
