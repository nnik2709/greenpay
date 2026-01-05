-- Identify potentially test data by date ranges
-- Use this to identify what might be test data created recently

-- Check recent individual purchases (last 30 days - likely test data)
SELECT 
  'Recent Individual Purchases (Last 30 days)' as category,
  COUNT(*) as count,
  MIN(id) as oldest_id,
  MAX(id) as newest_id
FROM individual_purchases
WHERE id > (SELECT MAX(id) - 100 FROM individual_purchases);  -- Last 100 records

-- Show recent voucher codes to see if they're test patterns
SELECT 
  'Recent Individual Purchases' as table_name,
  id,
  voucher_code,
  passport_number,
  amount,
  payment_method
FROM individual_purchases
ORDER BY id DESC
LIMIT 20;

-- Check corporate vouchers patterns
SELECT 
  'Recent Corporate Vouchers' as table_name,
  id,
  voucher_code,
  passport_number,
  amount
FROM corporate_vouchers
ORDER BY id DESC
LIMIT 20;

-- Count by voucher code prefix
SELECT 
  'Individual Purchases by Prefix' as info,
  CASE 
    WHEN voucher_code LIKE 'VCH-%' THEN 'VCH-* (Production pattern)'
    WHEN voucher_code LIKE 'VP-%' THEN 'VP-* (Possible test)'
    WHEN voucher_code LIKE 'TEST-%' THEN 'TEST-* (Test)'
    ELSE 'Other'
  END as pattern_type,
  COUNT(*) as count,
  MIN(id) as min_id,
  MAX(id) as max_id
FROM individual_purchases
GROUP BY 
  CASE 
    WHEN voucher_code LIKE 'VCH-%' THEN 'VCH-* (Production pattern)'
    WHEN voucher_code LIKE 'VP-%' THEN 'VP-* (Possible test)'
    WHEN voucher_code LIKE 'TEST-%' THEN 'TEST-* (Test)'
    ELSE 'Other'
  END
ORDER BY count DESC;

-- Same for corporate vouchers
SELECT 
  'Corporate Vouchers by Prefix' as info,
  CASE 
    WHEN voucher_code LIKE 'VCH-%' THEN 'VCH-* (Production pattern)'
    WHEN voucher_code LIKE 'VP-%' THEN 'VP-* (Possible test)'
    WHEN voucher_code LIKE 'TEST-%' THEN 'TEST-* (Test)'
    ELSE 'Other'
  END as pattern_type,
  COUNT(*) as count,
  MIN(id) as min_id,
  MAX(id) as max_id
FROM corporate_vouchers
GROUP BY 
  CASE 
    WHEN voucher_code LIKE 'VCH-%' THEN 'VCH-* (Production pattern)'
    WHEN voucher_code LIKE 'VP-%' THEN 'VP-* (Possible test)'
    WHEN voucher_code LIKE 'TEST-%' THEN 'TEST-* (Test)'
    ELSE 'Other'
  END
ORDER BY count DESC;

-- Check if passport numbers look like test data
SELECT 
  'Individual Purchases by Passport Pattern' as info,
  CASE 
    WHEN passport_number = 'PENDING' THEN 'PENDING (Incomplete/Test)'
    WHEN passport_number LIKE 'PNG%' AND LENGTH(passport_number) > 10 THEN 'PNG Long (Possible test)'
    WHEN passport_number LIKE 'PNG%' AND LENGTH(passport_number) BETWEEN 8 AND 10 THEN 'PNG Normal (Production)'
    WHEN passport_number LIKE 'P%' AND LENGTH(passport_number) = 8 THEN 'P* 8-digit (Test pattern)'
    ELSE 'Other'
  END as pattern_type,
  COUNT(*) as count
FROM individual_purchases
GROUP BY 
  CASE 
    WHEN passport_number = 'PENDING' THEN 'PENDING (Incomplete/Test)'
    WHEN passport_number LIKE 'PNG%' AND LENGTH(passport_number) > 10 THEN 'PNG Long (Possible test)'
    WHEN passport_number LIKE 'PNG%' AND LENGTH(passport_number) BETWEEN 8 AND 10 THEN 'PNG Normal (Production)'
    WHEN passport_number LIKE 'P%' AND LENGTH(passport_number) = 8 THEN 'P* 8-digit (Test pattern)'
    ELSE 'Other'
  END
ORDER BY count DESC;

