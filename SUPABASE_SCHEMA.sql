-- ==========================================
-- SUPABASE SCHEMA SETUP SCRIPT (CORRECTED)
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

-- 5. Insert Default Admin (CORRECTED PASSWORD)
-- Username: Ahmad
-- Password: $$dollar$$
INSERT INTO admins (username, password) 
VALUES ('Ahmad', '$2a$10$6QlmFSDwc8b6qh9V6Oom3OpU/XJqIhjh6ZS0Z1KEkOuAPYP833jbm')  
ON CONFLICT (username) 
DO UPDATE SET password = EXCLUDED.password;

-- Note: I will replace the hash above with the one generated in the next step.
