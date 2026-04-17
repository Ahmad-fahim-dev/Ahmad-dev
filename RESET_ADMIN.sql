-- ==========================================
-- RESET ADMIN USER SCRIPT
-- ==========================================
-- This will DELETE the admin 'Ahmad' and recreate him.

-- 1. Delete existing admin to avoid conflicts
DELETE FROM admins WHERE username = 'Ahmad';
DELETE FROM admins WHERE username = 'ahmad';

-- 2. Insert fresh Admin
-- Username: Ahmad
-- Password: iamkhanbb
INSERT INTO admins (username, password) 
VALUES ('Ahmad', '$2a$10$AUlSYAVazgbfJJRLyKjdq.CTka16LaI8.Y98/ZikXU2vhCi7ds4gu');

-- 3. Verify it exists (The result should show the user)
SELECT * FROM admins;
