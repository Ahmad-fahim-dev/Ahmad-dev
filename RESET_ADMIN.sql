-- ==========================================
-- RESET ADMIN USER SCRIPT
-- ==========================================
-- This will DELETE the admin 'Ahmad' and recreate him.

-- 1. Delete existing admin to avoid conflicts
DELETE FROM admins WHERE username = 'Ahmad';
DELETE FROM admins WHERE username = 'ahmad';

-- 2. Insert fresh Admin
-- Username: Ahmad
-- Password: password123
INSERT INTO admins (username, password) 
VALUES ('Ahmad', '$2a$10$E/AVW2zp7SkMkxiwScsYNuB1284H73zb3r7Kg8KgtItAbuMqqjFrG');

-- 3. Verify it exists (The result should show the user)
SELECT * FROM admins;
