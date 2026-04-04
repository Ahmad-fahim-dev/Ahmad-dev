const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env.vercel.production') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing Supabase credentials!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function migrate() {
    try {
        const blogsPath = path.join(__dirname, '../data/blogs.json');
        if (!fs.existsSync(blogsPath)) {
            console.log("No blogs.json found.");
            return;
        }

        const blogs = JSON.parse(fs.readFileSync(blogsPath, 'utf8'));

        for (const blog of blogs) {
            // Check if exists
            const { data: existing } = await supabase.from('blogs').select('id').eq('id', blog.id).single();
            if (!existing) {
                console.log(`Inserting blog: ${blog.title}`);
                const { error } = await supabase.from('blogs').insert({
                    id: blog.id,
                    title: blog.title,
                    content: blog.content,
                    excerpt: blog.excerpt,
                    image: blog.image,
                    author: blog.author,
                    created_at: blog.createdAt,
                    updated_at: blog.updatedAt
                });

                if (error) {
                    console.error("Error inserting blog:", error.message);
                } else {
                    console.log(`Successfully migrated: ${blog.title}`);
                }
            } else {
                console.log(`Blog already exists in Supabase: ${blog.title}`);
            }
        }
        console.log("Migration complete.");
    } catch (err) {
        console.error("Migration failed:", err);
    }
}

migrate();
