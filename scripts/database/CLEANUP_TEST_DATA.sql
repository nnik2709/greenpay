-- Cleanup Test Data from PNG Green Fees System Database
-- Execute this script to remove all test data before starting a new testing round
-- Run: PGPASSWORD='your-password' psql -h localhost -U greenpay_user -d greenpay_db -f CLEANUP_TEST_DATA.sql

-- ===========================================
-- 1. DELETE TEST PASSPORTS
-- ===========================================
DELETE FROM passports 
WHERE passport_number IN (
  'P1234567', 'P2345678', 'P3456789', 'P4567890', 'P5678901',
  'P6789012', 'P7890123', 'P8901234', 'P9012345', 'P0123456',
  'PTEST123', 'PTEST456', 'PTEST789'
) OR passport_number LIKE 'P%TEST%'
OR passport_number LIKE 'TEST%';

-- ===========================================
-- 2. DELETE TEST INDIVIDUAL PURCHASE VOUCHERS
-- ===========================================
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

-- ===========================================
-- 3. DELETE TEST CORPORATE VOUCHERS
-- Note: If company_name column doesn't exist, only delete by voucher_code
-- ===========================================
DELETE FROM corporate_vouchers 
WHERE voucher_code LIKE 'TEST-%'
OR voucher_code LIKE '%TEST%';
-- OR company_name LIKE '%Test%'  -- Uncomment if column exists
-- OR company_name LIKE '%TEST%'; -- Uncomment if column exists

-- ===========================================
-- 4. DELETE TEST INVOICES
-- ===========================================
DELETE FROM invoices
WHERE invoice_number LIKE 'INV-2025-%'
OR invoice_number LIKE 'TEST-%'
OR invoice_number LIKE '%TEST%'
OR customer_name LIKE '%Test%'
OR customer_name LIKE '%TEST%';

-- ===========================================
-- 5. DELETE TEST QUOTATIONS
-- ===========================================
DELETE FROM quotations
WHERE quotation_number LIKE 'QUO-2025-%'
OR quotation_number LIKE 'TEST-%'
OR quotation_number LIKE '%TEST%';
-- Note: company_name column check removed if it doesn't exist

-- ===========================================
-- 6. DELETE TEST BULK UPLOADS
-- ===========================================
DELETE FROM bulk_uploads
WHERE filename LIKE '%test%'
OR filename LIKE '%TEST%'
OR filename = 'test-bulk-upload.csv';

-- ===========================================
-- 7. DELETE TEST CASH RECONCILIATIONS
-- ===========================================
DELETE FROM cash_reconciliations
WHERE notes LIKE '%test%'
OR notes LIKE '%TEST%';

-- ===========================================
-- 8. CLEANUP OLD LOGIN EVENTS (Keep last 100)
-- ===========================================
DELETE FROM login_events
WHERE id NOT IN (
  SELECT id FROM login_events
  ORDER BY created_at DESC
  LIMIT 100
);

-- ===========================================
-- SUMMARY - Show remaining records
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
