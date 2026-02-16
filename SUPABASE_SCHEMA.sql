-- ==========================================
-- SUPABASE SCHEMA SETUP SCRIPT
-- ==========================================
-- Copy and paste this entrie file into your Supabase SQL Editor and Click "Run"

-- 1. Enable UUID extension for generating IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create 'blogs' table
CREATE TABLE IF NOT EXISTS blogs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image TEXT,
  author TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create 'projects' table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  technologies TEXT[],
  github_link TEXT,
  live_link TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create 'admins' table
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Insert Default Admin (if not exists)
-- Username: Ahmad
-- Password: $$dollar$$
INSERT INTO admins (username, password) 
VALUES ('Ahmad', '$2a$10$wTf/w/wTf/w/wTf/w/wTUO.SomeHashHere...')
ON CONFLICT (username) DO NOTHING;

-- 6. Insert Sample Data (Optional verification)
INSERT INTO blogs (title, content, excerpt, author)
VALUES ('Welcome to my Blog', 'This is the first post!', 'Introduction post.', 'Ahmad')
ON CONFLICT DO NOTHING;
