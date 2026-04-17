const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env.vercel.production') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function deleteClaude() {
    const { data, error } = await supabase
        .from('blogs')
        .delete()
        .ilike('title', '%Claude Opus%')
        .select();

    if (error) console.error("Error deleting article:", error);
    else console.log("Deleted articles:", data.map(d => d.title));
}

deleteClaude();
