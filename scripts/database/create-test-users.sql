-- Create Test Users for PNG Green Fees System
-- Run this in Supabase SQL Editor AFTER creating users in Authentication

-- =============================================
-- IMPORTANT: Before running this SQL
-- =============================================
-- You must first create the users in Supabase Authentication UI:
-- 1. Go to Authentication > Users > Add User
-- 2. Create each user with the emails below
-- 3. Set their passwords (see table below)
-- 4. Copy each user's UUID
-- 5. Replace the UUIDs in this file with the actual UUIDs
-- 6. Then run this SQL

-- =============================================
-- USER CREDENTIALS (for manual Auth creation)
-- =============================================
--
-- User 1: Flex Admin (Full System Access)
-- Email: admin@example.com
-- Password: admin123
-- Role: Flex_Admin
--
-- User 2: Finance Manager (Quotations & Reports)
-- Email: finance@example.com
-- Password: finance123
-- Role: Finance_Manager
--
-- User 3: Counter Agent (Passport & Payment Processing)
-- Email: agent@example.com
-- Password: agent123
-- Role: Counter_Agent
--
-- User 4: IT Support (User Management & Reports)
-- Email: support@example.com
-- Password: support123
-- Role: IT_Support

-- =============================================
-- STEP 1: Create profiles for the users
-- =============================================
-- Replace 'UUID_FROM_AUTH_USER_1' with actual UUIDs from Auth

-- Admin User
INSERT INTO profiles (id, email, role, active)
VALUES (
  'UUID_FROM_AUTH_USER_1',  -- Replace with actual UUID from Auth
  'admin@example.com',
  'Flex_Admin',
  true
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  active = EXCLUDED.active;

-- Finance Manager
INSERT INTO profiles (id, email, role, active)
VALUES (
  'UUID_FROM_AUTH_USER_2',  -- Replace with actual UUID from Auth
  'finance@example.com',
  'Finance_Manager',
  true
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  active = EXCLUDED.active;

-- Counter Agent
INSERT INTO profiles (id, email, role, active)
VALUES (
  'UUID_FROM_AUTH_USER_3',  -- Replace with actual UUID from Auth
  'agent@example.com',
  'Counter_Agent',
  true
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  active = EXCLUDED.active;

-- IT Support
INSERT INTO profiles (id, email, role, active)
VALUES (
  'UUID_FROM_AUTH_USER_4',  -- Replace with actual UUID from Auth
  'support@example.com',
  'IT_Support',
  true
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  active = EXCLUDED.active;

-- =============================================
-- VERIFICATION
-- =============================================
-- Check that all users were created
SELECT
  id,
  email,
  role,
  active,
  created_at
FROM profiles
ORDER BY
  CASE role
    WHEN 'Flex_Admin' THEN 1
    WHEN 'Finance_Manager' THEN 2
    WHEN 'Counter_Agent' THEN 3
    WHEN 'IT_Support' THEN 4
  END;

-- =============================================
-- ROLE PERMISSIONS REFERENCE
-- =============================================
--
-- Flex_Admin:
--   - Full system access
--   - User management
--   - Admin settings (Payment modes, Email templates)
--   - All features
--
-- Finance_Manager:
--   - Quotations (create, view, manage)
--   - Reports (all types)
--   - Corporate vouchers
--   - Passports (view only)
--
-- Counter_Agent:
--   - Passport purchases (individual & bulk)
--   - Bulk uploads
--   - Payments
--   - Scan & validate
--
-- IT_Support:
--   - User management
--   - Reports
--   - Scan & validate
--   - No financial operations
