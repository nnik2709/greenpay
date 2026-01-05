-- FIX DATABASE PERMISSIONS
-- Run this on production database to fix permission errors
-- Date: 2025-12-19

-- Connect as postgres superuser or database owner
-- psql -U postgres -d greenpay_db

-- =====================================================
-- FIX #1: Settings Table Permissions
-- =====================================================
-- Error: "must be owner of table settings"
-- Solution: Grant UPDATE permission to greenpay_user

GRANT SELECT, INSERT, UPDATE, DELETE ON settings TO greenpay_user;

-- Verify permissions
SELECT
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'settings';

-- =====================================================
-- FIX #2: Check all table permissions
-- =====================================================
-- Make sure greenpay_user has proper permissions on all tables

-- Core tables
GRANT SELECT, INSERT, UPDATE, DELETE ON passports TO greenpay_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON individual_purchases TO greenpay_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON corporate_vouchers TO greenpay_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON quotations TO greenpay_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON invoices TO greenpay_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON tickets TO greenpay_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON "User" TO greenpay_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Role" TO greenpay_user;

-- Sequences (for auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO greenpay_user;

-- =====================================================
-- FIX #3: Verify Row Level Security is not blocking
-- =====================================================
-- Check if RLS is enabled on settings table

SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'settings';

-- If rowsecurity = true, check policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'settings';

-- =====================================================
-- Verification Queries
-- =====================================================

-- Test settings update as greenpay_user
-- (Run this after granting permissions)
SET ROLE greenpay_user;

UPDATE settings
SET voucher_validity_days = 30
WHERE id = (SELECT id FROM settings ORDER BY id DESC LIMIT 1);

SELECT * FROM settings ORDER BY id DESC LIMIT 1;

RESET ROLE;

-- =====================================================
-- Results
-- =====================================================
-- If the UPDATE succeeds, permissions are fixed
-- If it still fails, check the error message for more details
