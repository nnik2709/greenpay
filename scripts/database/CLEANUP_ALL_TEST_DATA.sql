-- Cleanup ALL Test Data - Removes everything from test tables
-- Use this when all data in the database is test data

-- ===========================================
-- 1. DELETE ALL PASSPORTS
-- ===========================================
DELETE FROM passports;

-- ===========================================
-- 2. DELETE ALL INDIVIDUAL PURCHASE VOUCHERS
-- ===========================================
DELETE FROM individual_purchases;

-- ===========================================
-- 3. DELETE ALL CORPORATE VOUCHERS
-- ===========================================
DELETE FROM corporate_vouchers;

-- ===========================================
-- 4. DELETE ALL INVOICES
-- ===========================================
DELETE FROM invoices;

-- ===========================================
-- 5. DELETE ALL QUOTATIONS
-- ===========================================
DELETE FROM quotations;

-- ===========================================
-- 6. DELETE ALL BULK UPLOADS
-- ===========================================
DELETE FROM bulk_uploads;

-- ===========================================
-- 7. DELETE ALL CASH RECONCILIATIONS
-- ===========================================
DELETE FROM cash_reconciliations;

-- ===========================================
-- 8. CLEANUP LOGIN EVENTS (Keep last 100)
-- ===========================================
DELETE FROM login_events
WHERE id NOT IN (
  SELECT id FROM login_events
  ORDER BY id DESC
  LIMIT 100
);

-- ===========================================
-- SUMMARY - Verify all tables are empty
-- ===========================================
SELECT 
  'Passports' as table_name, COUNT(*) as remaining_count FROM passports
UNION ALL
SELECT 'Individual Purchases', COUNT(*) FROM individual_purchases
UNION ALL
SELECT 'Corporate Vouchers', COUNT(*) FROM corporate_vouchers
UNION ALL
SELECT 'Invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'Quotations', COUNT(*) FROM quotations
UNION ALL
SELECT 'Bulk Uploads', COUNT(*) FROM bulk_uploads
UNION ALL
SELECT 'Cash Reconciliations', COUNT(*) FROM cash_reconciliations
UNION ALL
SELECT 'Login Events', COUNT(*) FROM login_events
ORDER BY table_name;

-- Expected result: All counts should be 0 (except login_events which will be 100 or less)

