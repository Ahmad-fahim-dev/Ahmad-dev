const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env.vercel.production') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function bumpDate() {
    const { data, error } = await supabase
        .from('blogs')
        .update({ created_at: new Date().toISOString() })
        .ilike('title', '%Claude Opus%')
        .select();

    if (error) console.error("Error bumping date:", error);
    else console.log("Bumped dates for:", data.map(d => d.title));
}

bumpDate();
