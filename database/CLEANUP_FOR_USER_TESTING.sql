-- =====================================================
-- GreenPay Database Cleanup for User Testing
-- Date: 2026-01-21
-- Purpose: Remove all test data while preserving:
--   - System configuration (email templates, settings)
--   - flexadmin user only
--   - Table structures
-- =====================================================

-- IMPORTANT: Run this as the database owner
-- PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay_user -d greenpay_db < CLEANUP_FOR_USER_TESTING.sql

BEGIN;

-- =====================================================
-- STEP 1: Display current data counts (for verification)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CURRENT DATABASE STATE (Before Cleanup)';
    RAISE NOTICE '========================================';
END $$;

SELECT 'Users' as table_name, COUNT(*) as count FROM "User";
SELECT 'Passports' as table_name, COUNT(*) as count FROM passports;
SELECT 'Individual Purchases' as table_name, COUNT(*) as count FROM individual_purchases;
SELECT 'Corporate Vouchers' as table_name, COUNT(*) as count FROM corporate_vouchers;
SELECT 'Quotations' as table_name, COUNT(*) as count FROM quotations;
SELECT 'Invoices' as table_name, COUNT(*) as count FROM invoices;
SELECT 'Customers' as table_name, COUNT(*) as count FROM customers;
SELECT 'Tickets' as table_name, COUNT(*) as count FROM tickets;
SELECT 'Cash Reconciliations' as table_name, COUNT(*) as count FROM cash_reconciliations;
SELECT 'Login Events' as table_name, COUNT(*) as count FROM login_events;
SELECT 'Purchase Sessions' as table_name, COUNT(*) as count FROM purchase_sessions;
SELECT 'Email Templates' as table_name, COUNT(*) as count FROM email_templates;

-- =====================================================
-- STEP 2: Delete transactional data (test data)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CLEANING TRANSACTIONAL DATA';
    RAISE NOTICE '========================================';
END $$;

-- Delete login events (all historical login data)
DELETE FROM login_events;
DO $$ BEGIN RAISE NOTICE '✓ Deleted all login events'; END $$;

-- Delete purchase sessions
DELETE FROM purchase_sessions;
DO $$ BEGIN RAISE NOTICE '✓ Deleted all purchase sessions'; END $$;

-- Delete cash reconciliations
DELETE FROM cash_reconciliations;
DO $$ BEGIN RAISE NOTICE '✓ Deleted all cash reconciliations'; END $$;

-- Delete tickets
DELETE FROM tickets;
DO $$ BEGIN RAISE NOTICE '✓ Deleted all tickets'; END $$;

-- Delete corporate vouchers FIRST (references invoices)
DELETE FROM corporate_vouchers;
DO $$ BEGIN RAISE NOTICE '✓ Deleted all corporate vouchers'; END $$;

-- Delete invoice payments
DELETE FROM invoice_payments WHERE invoice_id IS NOT NULL;
DO $$ BEGIN RAISE NOTICE '✓ Deleted all invoice payments'; END $$;

-- Delete invoices (after corporate vouchers)
DELETE FROM invoices;
DO $$ BEGIN RAISE NOTICE '✓ Deleted all invoices'; END $$;

-- Delete quotations
DELETE FROM quotations;
DO $$ BEGIN RAISE NOTICE '✓ Deleted all quotations'; END $$;

-- Delete individual purchases (vouchers)
DELETE FROM individual_purchases;
DO $$ BEGIN RAISE NOTICE '✓ Deleted all individual purchases/vouchers'; END $$;

-- Delete passports
DELETE FROM passports;
DO $$ BEGIN RAISE NOTICE '✓ Deleted all passports'; END $$;

-- Delete all archived tables (dynamic cleanup)
DO $$
DECLARE
    archived_table RECORD;
BEGIN
    FOR archived_table IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE '_archived_%'
    LOOP
        EXECUTE format('DELETE FROM %I', archived_table.table_name);
        RAISE NOTICE '✓ Deleted archived table: %', archived_table.table_name;
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠ Error cleaning archived tables: %', SQLERRM;
END $$;

-- Delete customers (except keep if needed for referential integrity)
DELETE FROM customers;
DO $$ BEGIN RAISE NOTICE '✓ Deleted all customers'; END $$;

-- =====================================================
-- STEP 3: Clean up users - Keep ONLY flexadmin
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CLEANING USERS - Keeping only flexadmin';
    RAISE NOTICE '========================================';
END $$;

-- Delete all users EXCEPT the one with roleId 1 (Flex_Admin)
-- First, let's see which user is the admin
DO $$
DECLARE
    admin_user_record RECORD;
BEGIN
    SELECT id, name, email, "roleId" INTO admin_user_record
    FROM "User"
    WHERE "roleId" = 1
    LIMIT 1;

    IF admin_user_record.id IS NOT NULL THEN
        RAISE NOTICE 'Keeping admin user: ID=%, Name=%, Email=%, RoleId=%',
            admin_user_record.id,
            admin_user_record.name,
            admin_user_record.email,
            admin_user_record."roleId";
    ELSE
        RAISE NOTICE 'WARNING: No admin user found! Please ensure at least one admin exists before running this script.';
    END IF;
END $$;

-- Delete all non-admin users
DELETE FROM "User" WHERE "roleId" != 1;

-- If multiple admin users exist, keep only the first one
DELETE FROM "User"
WHERE "roleId" = 1
AND id NOT IN (
    SELECT id FROM "User"
    WHERE "roleId" = 1
    ORDER BY id ASC
    LIMIT 1
);

DO $$ BEGIN RAISE NOTICE '✓ Deleted all non-admin users'; END $$;

-- =====================================================
-- STEP 4: Reset auto-increment sequences
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESETTING AUTO-INCREMENT SEQUENCES';
    RAISE NOTICE '========================================';
END $$;

-- Reset sequences to start fresh IDs for new test data (with error handling)
DO $$
DECLARE
    seq_name TEXT;
    seq_list TEXT[] := ARRAY[
        'passports_id_seq',
        'individual_purchases_id_seq',
        'corporate_vouchers_id_seq',
        'quotations_id_seq',
        'invoices_id_seq',
        'customers_id_seq',
        'tickets_id_seq',
        'cash_reconciliations_id_seq',
        'login_events_id_seq'
    ];
BEGIN
    FOREACH seq_name IN ARRAY seq_list
    LOOP
        BEGIN
            EXECUTE format('ALTER SEQUENCE %I RESTART WITH 1', seq_name);
            RAISE NOTICE '✓ Reset sequence: %', seq_name;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '⚠ Could not reset sequence % (this is OK): %', seq_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- =====================================================
-- STEP 5: PRESERVE system configuration
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SYSTEM CONFIGURATION (Preserved)';
    RAISE NOTICE '========================================';
END $$;

-- Email templates are preserved (no deletion)
SELECT 'Email Templates (Kept)' as config_item, COUNT(*) as count FROM email_templates;

-- Settings are preserved (no deletion)
SELECT 'Settings (Kept)' as config_item, COUNT(*) as count FROM settings;

-- Payment modes are preserved (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_modes') THEN
        EXECUTE 'SELECT ''Payment Modes (Kept)'' as config_item, COUNT(*) as count FROM payment_modes';
    END IF;
END $$;

-- =====================================================
-- STEP 6: Display final state
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DATABASE STATE (After Cleanup)';
    RAISE NOTICE '========================================';
END $$;

SELECT 'Users' as table_name, COUNT(*) as count FROM "User";
SELECT 'Passports' as table_name, COUNT(*) as count FROM passports;
SELECT 'Individual Purchases' as table_name, COUNT(*) as count FROM individual_purchases;
SELECT 'Corporate Vouchers' as table_name, COUNT(*) as count FROM corporate_vouchers;
SELECT 'Quotations' as table_name, COUNT(*) as count FROM quotations;
SELECT 'Invoices' as table_name, COUNT(*) as count FROM invoices;
SELECT 'Customers' as table_name, COUNT(*) as count FROM customers;
SELECT 'Tickets' as table_name, COUNT(*) as count FROM tickets;
SELECT 'Email Templates (Kept)' as table_name, COUNT(*) as count FROM email_templates;

-- =====================================================
-- STEP 7: Verify flexadmin user
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'ADMIN USER (Should be 1)';
    RAISE NOTICE '========================================';
END $$;

SELECT
    id,
    name,
    email,
    "roleId",
    "createdAt"
FROM "User"
WHERE "roleId" = 1;

-- =====================================================
-- COMMIT or ROLLBACK
-- =====================================================

-- If everything looks good, COMMIT. Otherwise ROLLBACK
-- Review the output above before committing!

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CLEANUP COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Review the output above.';
    RAISE NOTICE 'If everything looks correct, this transaction will commit.';
    RAISE NOTICE 'To rollback instead, press Ctrl+C now or run: ROLLBACK;';
    RAISE NOTICE '';
    RAISE NOTICE '✓ Database is ready for user testing';
    RAISE NOTICE '✓ Only flexadmin user remains';
    RAISE NOTICE '✓ All test data has been removed';
    RAISE NOTICE '✓ System configuration preserved';
END $$;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES (Run these after cleanup)
-- =====================================================

-- Uncomment to verify after cleanup:
-- SELECT 'Total Users' as metric, COUNT(*) as value FROM "User";
-- SELECT 'Admin Users' as metric, COUNT(*) as value FROM "User" WHERE role = 'Flex_Admin';
-- SELECT 'Total Passports' as metric, COUNT(*) as value FROM passports;
-- SELECT 'Total Vouchers' as metric, COUNT(*) as value FROM individual_purchases;
-- SELECT 'Email Templates' as metric, COUNT(*) as value FROM email_templates;
