-- Cleanup Test Data from PNG Green Fees System Database
-- This script removes test data created for testing purposes
-- Run with:
-- PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -f cleanup-test-data.sql
-- Or remotely:
-- ssh root@your-server 'PGPASSWORD="password" psql -h localhost -U greenpay_user -d greenpay_db -f /path/to/cleanup-test-data.sql'

\echo '🧹 Starting test data cleanup...'
\echo ''

-- ===========================================
-- 1. DELETE TEST PASSPORTS
-- ===========================================

\echo '📘 Deleting test passports...'

DELETE FROM "Passport" 
WHERE "passportNo" IN (
  'P1234567', 'P2345678', 'P3456789', 'P4567890', 'P5678901',
  'P6789012', 'P7890123', 'P8901234', 'P9012345', 'P0123456',
  'PTEST123', 'PTEST456', 'PTEST789'
) OR "passportNo" LIKE 'P%TEST%'
OR "passportNo" LIKE 'TEST%';

\echo '  ✓ Deleted test passports'
\echo ''

-- ===========================================
-- 2. DELETE TEST INDIVIDUAL PURCHASE VOUCHERS
-- ===========================================

\echo '🎫 Deleting test individual purchase vouchers...'

-- Delete vouchers with test codes
DELETE FROM individual_purchases 
WHERE voucher_code IN (
  'TEST-VOUCHER-123', 'VALID-TEST-VOUCHER', 'EXPIRED-VOUCHER-999', 
  'USED-VOUCHER-888', 'TEST-VOUCHER-456', 'TEST-VOUCHER-789'
) OR voucher_code LIKE 'VP-2025-%'
OR voucher_code LIKE 'TEST-%'
OR voucher_code LIKE '%TEST%'
OR passport_number IN (
  'P1234567', 'P2345678', 'P3456789', 'P4567890', 'P5678901',
  'P6789012', 'P7890123', 'P8901234', 'P9012345', 'P0123456',
  'PTEST123'
);

\echo '  ✓ Deleted test individual purchase vouchers'
\echo ''

-- ===========================================
-- 3. DELETE TEST CORPORATE VOUCHERS
-- ===========================================

\echo '🏢 Deleting test corporate vouchers...'

-- Delete corporate vouchers with test codes
DELETE FROM corporate_vouchers 
WHERE voucher_code LIKE 'TEST-%'
OR voucher_code LIKE '%TEST%'
OR company_name LIKE '%Test%'
OR company_name LIKE '%TEST%';

\echo '  ✓ Deleted test corporate vouchers'
\echo ''

-- ===========================================
-- 4. DELETE TEST INVOICES
-- ===========================================

\echo '📄 Deleting test invoices...'

DELETE FROM invoices
WHERE invoice_number LIKE 'INV-2025-%'
OR invoice_number LIKE 'TEST-%'
OR invoice_number LIKE '%TEST%'
OR customer_name LIKE '%Test%'
OR customer_name LIKE '%TEST%';

\echo '  ✓ Deleted test invoices'
\echo ''

-- ===========================================
-- 5. DELETE TEST QUOTATIONS
-- ===========================================

\echo '📋 Deleting test quotations...'

DELETE FROM quotations
WHERE quotation_number LIKE 'QUO-2025-%'
OR quotation_number LIKE 'TEST-%'
OR quotation_number LIKE '%TEST%'
OR company_name LIKE '%Test%'
OR company_name LIKE '%TEST%';

\echo '  ✓ Deleted test quotations'
\echo ''

-- ===========================================
-- 6. DELETE TEST BULK UPLOADS
-- ===========================================

\echo '📦 Deleting test bulk upload records...'

DELETE FROM bulk_uploads
WHERE file_name LIKE '%test%'
OR file_name LIKE '%TEST%'
OR file_name = 'test-bulk-upload.csv';

\echo '  ✓ Deleted test bulk upload records'
\echo ''

-- ===========================================
-- 7. DELETE TEST CASH RECONCILIATIONS
-- ===========================================

\echo '💰 Deleting test cash reconciliations...'

DELETE FROM cash_reconciliations
WHERE notes LIKE '%test%'
OR notes LIKE '%TEST%';

\echo '  ✓ Deleted test cash reconciliations'
\echo ''

-- ===========================================
-- 8. DELETE TEST LOGIN EVENTS (Optional - be careful!)
-- ===========================================

\echo '🔐 Cleaning up old login events (keeping last 100)...'

-- Keep only the most recent 100 login events, delete older ones
DELETE FROM login_events
WHERE id NOT IN (
  SELECT id FROM login_events
  ORDER BY created_at DESC
  LIMIT 100
);

\echo '  ✓ Cleaned up old login events'
\echo ''

-- ===========================================
-- SUMMARY
-- ===========================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📊 Cleanup Summary:'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  (SELECT COUNT(*) FROM "Passport") as remaining_passports,
  (SELECT COUNT(*) FROM individual_purchases) as remaining_vouchers,
  (SELECT COUNT(*) FROM corporate_vouchers) as remaining_corporate_vouchers,
  (SELECT COUNT(*) FROM invoices) as remaining_invoices,
  (SELECT COUNT(*) FROM quotations) as remaining_quotations,
  (SELECT COUNT(*) FROM bulk_uploads) as remaining_bulk_uploads,
  (SELECT COUNT(*) FROM cash_reconciliations) as remaining_reconciliations,
  (SELECT COUNT(*) FROM login_events) as remaining_login_events;

\echo ''
\echo '✅ Test data cleanup completed!'
\echo ''
\echo 'Note: Test users (agent@greenpay.com, etc.) are preserved.'
\echo '      Production data remains intact.'
\echo ''

