-- CHECK PRODUCTION ISSUES
-- Run these queries to diagnose current state
-- Date: 2025-12-19

-- =====================================================
-- CHECK #1: Passport Reports Data
-- =====================================================
-- Issue: Reports not showing actual data
-- Check if we have passport data

SELECT COUNT(*) as total_passports FROM passports;

SELECT
    id,
    passport_number,
    full_name,
    nationality,
    date_of_birth,
    expiry_date,
    created_at
FROM passports
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- CHECK #2: Corporate Vouchers Status
-- =====================================================
-- Issue: Status shows "Active" instead of "Pending" when no passport
-- Check vouchers without passports

SELECT
    id,
    voucher_code,
    status,
    passport_number,
    passport_id,
    company_name,
    amount,
    valid_from,
    valid_until,
    issued_date
FROM corporate_vouchers
WHERE passport_number IS NULL OR passport_number = ''
ORDER BY id DESC
LIMIT 10;

-- Expected: status should be 'pending_passport' when passport_number is NULL

-- =====================================================
-- CHECK #3: Voucher Registration Test
-- =====================================================
-- Issue: Invalid voucher code on registration page
-- Check if voucher code exists and is valid

-- Replace 1XNDLVY9 with actual voucher code from error
SELECT
    id,
    voucher_code,
    status,
    passport_number,
    valid_from,
    valid_until,
    company_name
FROM corporate_vouchers
WHERE voucher_code = '1XNDLVY9';

-- Check if any vouchers are available for registration
SELECT
    COUNT(*) as available_for_registration
FROM corporate_vouchers
WHERE status = 'pending_passport'
  AND valid_until > NOW();

-- =====================================================
-- CHECK #4: User Management Data
-- =====================================================
-- Issue: Deactivate user and change role not working
-- Check user table structure

SELECT
    id,
    name,
    email,
    "roleId",
    "isActive",
    "createdAt"
FROM "User"
ORDER BY "createdAt" DESC
LIMIT 5;

-- Check role table
SELECT * FROM "Role";

-- =====================================================
-- CHECK #5: Settings Table
-- =====================================================
-- Issue: Permission error when updating
-- Check current settings and ownership

SELECT * FROM settings ORDER BY id DESC LIMIT 1;

SELECT
    t.tablename,
    t.tableowner,
    array_agg(privilege_type) as privileges
FROM information_schema.table_privileges p
JOIN pg_tables t ON p.table_name = t.tablename
WHERE p.table_name = 'settings'
  AND p.grantee = 'greenpay_user'
GROUP BY t.tablename, t.tableowner;

-- =====================================================
-- CHECK #6: Email Configuration
-- =====================================================
-- Check if SMTP settings are in environment or database

SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'settings'
ORDER BY ordinal_position;

-- =====================================================
-- CHECK #7: Quotations Report Access
-- =====================================================
-- Issue: 403 for IT_Support role
-- Check IT_Support role ID

SELECT id, name FROM "Role" WHERE name = 'IT_Support';

-- Check if there are any quotations
SELECT COUNT(*) as total_quotations FROM quotations;

SELECT
    id,
    quotation_number,
    company_name,
    total_amount,
    status,
    created_at
FROM quotations
ORDER BY created_at DESC
LIMIT 5;
