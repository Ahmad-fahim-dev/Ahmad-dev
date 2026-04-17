# Supabase Setup Guide

## 1. Create a Supabase Project
1.  Go to [https://supabase.com/](https://supabase.com/) and sign in.
2.  Click "New Project".
3.  Enter a name (e.g., "Portfolio"), database password, and region.
4.  Click "Create new project".

## 2. Get Credentials
1.  Go to **Project Settings** (gear icon) -> **API**.
2.  Copy the **Project URL** (`SUPABASE_URL`).
3.  Copy the **anon public** key (`SUPABASE_ANON_KEY`).
4.  Add these to your `.env.local` file:
    ```env
    SUPABASE_URL=your_project_url
    SUPABASE_ANON_KEY=your_anon_key
    ```

## 3. Create Tables
Go to the **SQL Editor** (left sidebar), click "New query", paste the following SQL, and click "Run".

```sql
-- Create Blogs Table
create table public.blogs (
  id uuid not null primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  excerpt text,
  image text,
  author text default 'Admin',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Projects Table
create table public.projects (
  id uuid not null primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  technologies text[], -- Array of strings
  github_link text,
  live_link text,
  image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Admins Table
create table public.admins (
  id uuid not null primary key default gen_random_uuid(),
  username text not null unique,
  password text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security) - Optional but recommended
alter table public.blogs enable row level security;
alter table public.projects enable row level security;
alter table public.admins enable row level security;

-- Create policies to allow public read access
create policy "Public blogs are viewable by everyone" on public.blogs for select using (true);
create policy "Public projects are viewable by everyone" on public.projects for select using (true);

-- Create policies to allow full access (for now, we'll handle auth in app code)
-- ideally you'd restrict this to authenticated users
create policy "Enable all access for all users" on public.blogs for all using (true);
create policy "Enable all access for all users" on public.projects for all using (true);
create policy "Enable all access for all users" on public.admins for all using (true);
```

## 4. Insert Default Admin
Run this SQL to add the default admin user:

```sql
-- Password is 'iamkhanbb' hashed with bcrypt
insert into public.admins (username, password)
values ('Ahmad', '$2a$10$AUlSYAVazgbfJJRLyKjdq.CTka16LaI8.Y98/ZikXU2vhCi7ds4gu');
```
