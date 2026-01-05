-- Check what test data patterns exist in the database (Fixed column names)
-- This helps identify what cleanup patterns to use

-- Check Corporate Vouchers patterns (first 20 to see patterns)
SELECT 
  'Corporate Vouchers' as table_name,
  voucher_code,
  passport_number,
  CASE 
    WHEN voucher_code LIKE 'TEST-%' THEN 'TEST pattern'
    WHEN voucher_code LIKE '%TEST%' THEN 'Contains TEST'
    WHEN voucher_code LIKE 'VP-2025-%' THEN 'VP-2025 pattern'
    WHEN voucher_code LIKE 'VP-%' THEN 'VP- pattern'
    ELSE 'Other'
  END as pattern_type
FROM corporate_vouchers
ORDER BY id DESC
LIMIT 20;

-- Check Individual Purchases patterns (first 30 to see patterns)
SELECT 
  'Individual Purchases' as table_name,
  voucher_code,
  passport_number,
  CASE 
    WHEN voucher_code LIKE 'TEST-%' THEN 'TEST pattern'
    WHEN voucher_code LIKE '%TEST%' THEN 'Contains TEST'
    WHEN voucher_code LIKE 'VP-2025-%' THEN 'VP-2025 pattern'
    WHEN voucher_code LIKE 'VP-%' THEN 'VP- pattern'
    WHEN passport_number LIKE 'P%' AND LENGTH(passport_number) = 8 THEN 'Test passport pattern'
    ELSE 'Other'
  END as pattern_type
FROM individual_purchases
ORDER BY id DESC
LIMIT 30;

-- Check Invoices patterns
SELECT 
  'Invoices' as table_name,
  invoice_number,
  customer_name,
  CASE 
    WHEN invoice_number LIKE 'INV-2025-%' THEN 'INV-2025 pattern'
    WHEN invoice_number LIKE 'INV-%' THEN 'INV- pattern'
    WHEN invoice_number LIKE 'TEST-%' THEN 'TEST pattern'
    WHEN invoice_number LIKE '%TEST%' THEN 'Contains TEST'
    WHEN customer_name LIKE '%Test%' THEN 'Test customer'
    ELSE 'Other'
  END as pattern_type
FROM invoices
ORDER BY id DESC
LIMIT 20;

-- Check Quotations patterns (we know these exist)
SELECT 
  'Quotations' as table_name,
  quotation_number,
  CASE 
    WHEN quotation_number LIKE 'QUO-2025-%' THEN 'QUO-2025 pattern'
    WHEN quotation_number LIKE 'QUO-%' THEN 'QUO- pattern'
    WHEN quotation_number LIKE 'TEST-%' THEN 'TEST pattern'
    WHEN quotation_number LIKE '%TEST%' THEN 'Contains TEST'
    ELSE 'Other'
  END as pattern_type
FROM quotations
ORDER BY id DESC
LIMIT 20;

-- Check Passports
SELECT 
  'Passports' as table_name,
  passport_number
FROM passports
WHERE passport_number LIKE 'P%TEST%'
   OR passport_number LIKE 'TEST%'
   OR passport_number IN ('P1234567', 'P2345678', 'P3456789', 'P4567890', 'P5678901',
                          'P6789012', 'P7890123', 'P8901234', 'P9012345', 'P0123456', 'PTEST123')
ORDER BY id DESC;

-- Count by patterns for better understanding
SELECT 
  'Individual Purchases Pattern Counts' as info,
  CASE 
    WHEN voucher_code LIKE 'VP-%' THEN 'VP-* pattern'
    WHEN voucher_code LIKE 'TEST-%' THEN 'TEST-* pattern'
    WHEN voucher_code LIKE '%TEST%' THEN 'Contains TEST'
    ELSE 'Other/Unknown'
  END as pattern_type,
  COUNT(*) as count
FROM individual_purchases
GROUP BY pattern_type
ORDER BY count DESC;

SELECT 
  'Corporate Vouchers Pattern Counts' as info,
  CASE 
    WHEN voucher_code LIKE 'VP-%' THEN 'VP-* pattern'
    WHEN voucher_code LIKE 'TEST-%' THEN 'TEST-* pattern'
    WHEN voucher_code LIKE '%TEST%' THEN 'Contains TEST'
    ELSE 'Other/Unknown'
  END as pattern_type,
  COUNT(*) as count
FROM corporate_vouchers
GROUP BY pattern_type
ORDER BY count DESC;

