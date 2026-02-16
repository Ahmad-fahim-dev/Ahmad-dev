-- ==========================================
-- RESET ADMIN USER SCRIPT
-- ==========================================
-- This will DELETE the admin 'Ahmad' and recreate him.

-- 1. Delete existing admin to avoid conflicts
DELETE FROM admins WHERE username = 'Ahmad';
DELETE FROM admins WHERE username = 'ahmad';

-- 2. Insert fresh Admin
-- Username: Ahmad
-- Password: $$dollar$$
INSERT INTO admins (username, password) 
VALUES ('Ahmad', '$2a$10$6QlmFSDwc8b6qh9V6Oom3OpU/XJqIhjh6ZS0Z1KEkOuAPYP833jbm');

-- 3. Verify it exists (The result should show the user)
SELECT * FROM admins;
