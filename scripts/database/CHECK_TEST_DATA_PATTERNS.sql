-- Check what test data patterns exist in the database
-- This helps identify what cleanup patterns to use

-- Check Corporate Vouchers patterns
SELECT 
  'Corporate Vouchers' as table_name,
  voucher_code,
  CASE 
    WHEN voucher_code LIKE 'TEST-%' THEN 'TEST pattern'
    WHEN voucher_code LIKE '%TEST%' THEN 'Contains TEST'
    WHEN voucher_code LIKE 'VP-2025-%' THEN 'VP-2025 pattern'
    ELSE 'Other'
  END as pattern_type,
  created_at
FROM corporate_vouchers
WHERE voucher_code LIKE 'TEST-%'
   OR voucher_code LIKE '%TEST%'
   OR voucher_code LIKE 'VP-2025-%'
ORDER BY created_at DESC
LIMIT 20;

-- Check Individual Purchases patterns
SELECT 
  'Individual Purchases' as table_name,
  voucher_code,
  passport_number,
  CASE 
    WHEN voucher_code LIKE 'TEST-%' THEN 'TEST pattern'
    WHEN voucher_code LIKE '%TEST%' THEN 'Contains TEST'
    WHEN voucher_code LIKE 'VP-2025-%' THEN 'VP-2025 pattern'
    WHEN passport_number LIKE 'P%' AND LENGTH(passport_number) = 8 THEN 'Test passport pattern'
    ELSE 'Other'
  END as pattern_type,
  created_at
FROM individual_purchases
WHERE voucher_code LIKE 'TEST-%'
   OR voucher_code LIKE '%TEST%'
   OR voucher_code LIKE 'VP-2025-%'
   OR passport_number IN ('P1234567', 'P2345678', 'P3456789', 'P4567890', 'P5678901',
                          'P6789012', 'P7890123', 'P8901234', 'P9012345', 'P0123456', 'PTEST123')
ORDER BY created_at DESC
LIMIT 30;

-- Check Invoices patterns
SELECT 
  'Invoices' as table_name,
  invoice_number,
  customer_name,
  CASE 
    WHEN invoice_number LIKE 'INV-2025-%' THEN 'INV-2025 pattern'
    WHEN invoice_number LIKE 'TEST-%' THEN 'TEST pattern'
    WHEN invoice_number LIKE '%TEST%' THEN 'Contains TEST'
    WHEN customer_name LIKE '%Test%' THEN 'Test customer'
    ELSE 'Other'
  END as pattern_type,
  created_at
FROM invoices
WHERE invoice_number LIKE 'INV-2025-%'
   OR invoice_number LIKE 'TEST-%'
   OR invoice_number LIKE '%TEST%'
   OR customer_name LIKE '%Test%'
   OR customer_name LIKE '%TEST%'
ORDER BY created_at DESC
LIMIT 20;

-- Check Quotations patterns
SELECT 
  'Quotations' as table_name,
  quotation_number,
  CASE 
    WHEN quotation_number LIKE 'QUO-2025-%' THEN 'QUO-2025 pattern'
    WHEN quotation_number LIKE 'TEST-%' THEN 'TEST pattern'
    WHEN quotation_number LIKE '%TEST%' THEN 'Contains TEST'
    ELSE 'Other'
  END as pattern_type,
  created_at
FROM quotations
WHERE quotation_number LIKE 'QUO-2025-%'
   OR quotation_number LIKE 'TEST-%'
   OR quotation_number LIKE '%TEST%'
ORDER BY created_at DESC
LIMIT 20;

-- Check Passports
SELECT 
  'Passports' as table_name,
  passport_number,
  created_at
FROM passports
WHERE passport_number LIKE 'P%TEST%'
   OR passport_number LIKE 'TEST%'
   OR passport_number IN ('P1234567', 'P2345678', 'P3456789', 'P4567890', 'P5678901',
                          'P6789012', 'P7890123', 'P8901234', 'P9012345', 'P0123456', 'PTEST123')
ORDER BY created_at DESC;

