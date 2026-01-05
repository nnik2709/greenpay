-- Final Cleanup Script - Only removes clearly identifiable test data
-- Preserves production data (VCH-* and GP-* patterns)

-- ===========================================
-- 1. DELETE TEST PASSPORTS (Only obvious test patterns)
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
-- Only delete obvious test patterns, preserve VCH-* production data
-- ===========================================
DELETE FROM individual_purchases 
WHERE voucher_code IN (
  'TEST-VOUCHER-123', 'VALID-TEST-VOUCHER', 'EXPIRED-VOUCHER-999', 
  'USED-VOUCHER-888', 'TEST-VOUCHER-456', 'TEST-VOUCHER-789'
) OR voucher_code LIKE 'VP-2025-%'  -- Test pattern
OR voucher_code LIKE 'TEST-%'
OR voucher_code LIKE '%TEST%'
OR passport_number IN (
  'P1234567', 'P2345678', 'P3456789', 'P4567890', 'P5678901',
  'P6789012', 'P7890123', 'P8901234', 'P9012345', 'P0123456',
  'PTEST123'
) OR passport_number LIKE 'P%TEST%'
-- Remove incomplete entries with PENDING passport numbers
OR passport_number = 'PENDING';

-- Note: VCH-* vouchers are preserved as they appear to be production data
-- Note: PNG passport numbers are preserved as they appear to be real data

-- ===========================================
-- 3. DELETE TEST CORPORATE VOUCHERS
-- Only delete obvious test patterns, preserve GP-* production data
-- ===========================================
DELETE FROM corporate_vouchers 
WHERE voucher_code LIKE 'TEST-%'
OR voucher_code LIKE '%TEST%'
OR voucher_code LIKE 'VP-2025-%';  -- Only test pattern

-- Note: GP-* vouchers are preserved as they appear to be production data

-- ===========================================
-- 4. DELETE TEST INVOICES
-- ===========================================
DELETE FROM invoices
WHERE invoice_number LIKE 'INV-2025-%'  -- Only 2025 test pattern
OR invoice_number LIKE 'TEST-%'
OR invoice_number LIKE '%TEST%'
OR customer_name LIKE '%Test%'
OR customer_name LIKE '%TEST%';

-- ===========================================
-- 5. DELETE TEST QUOTATIONS
-- ===========================================
DELETE FROM quotations
WHERE quotation_number LIKE 'QUO-2025-%'  -- Only 2025 test pattern (6 rows found)
OR quotation_number LIKE 'TEST-%'
OR quotation_number LIKE '%TEST%';

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
  ORDER BY id DESC
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

-- Show what will remain after cleanup
SELECT 'Individual Purchases (Production VCH-* vouchers preserved)' as info, COUNT(*) as count
FROM individual_purchases
WHERE voucher_code LIKE 'VCH-%';

SELECT 'Corporate Vouchers (Production GP-* vouchers preserved)' as info, COUNT(*) as count
FROM corporate_vouchers
WHERE voucher_code LIKE 'GP-%';

