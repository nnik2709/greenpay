-- Simple check to see what voucher code patterns exist (no created_at needed)

-- Check Individual Purchases patterns
SELECT 
  'Individual Purchases' as table_name,
  voucher_code,
  passport_number,
  amount,
  payment_method
FROM individual_purchases
ORDER BY id DESC
LIMIT 30;

-- Check Corporate Vouchers patterns  
SELECT 
  'Corporate Vouchers' as table_name,
  voucher_code,
  passport_number,
  amount
FROM corporate_vouchers
ORDER BY id DESC
LIMIT 30;

-- Count voucher code patterns
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
GROUP BY 
  CASE 
    WHEN voucher_code LIKE 'VP-%' THEN 'VP-* pattern'
    WHEN voucher_code LIKE 'TEST-%' THEN 'TEST-* pattern'
    WHEN voucher_code LIKE '%TEST%' THEN 'Contains TEST'
    ELSE 'Other/Unknown'
  END
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
GROUP BY 
  CASE 
    WHEN voucher_code LIKE 'VP-%' THEN 'VP-* pattern'
    WHEN voucher_code LIKE 'TEST-%' THEN 'TEST-* pattern'
    WHEN voucher_code LIKE '%TEST%' THEN 'Contains TEST'
    ELSE 'Other/Unknown'
  END
ORDER BY count DESC;

