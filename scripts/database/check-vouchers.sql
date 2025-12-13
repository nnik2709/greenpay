-- Run this in Supabase SQL Editor to check existing vouchers

-- Check Individual Vouchers
SELECT
  'INDIVIDUAL' as type,
  voucher_code,
  passport_number,
  amount,
  CASE
    WHEN used_at IS NOT NULL THEN 'USED'
    WHEN valid_until < NOW() THEN 'EXPIRED'
    ELSE 'VALID'
  END as status,
  created_at
FROM individual_purchases
ORDER BY created_at DESC
LIMIT 10;

-- Check Corporate Vouchers
SELECT
  'CORPORATE' as type,
  voucher_code,
  passport_number,
  company_name,
  amount,
  CASE
    WHEN used_at IS NOT NULL THEN 'USED'
    WHEN valid_until < NOW() THEN 'EXPIRED'
    ELSE 'VALID'
  END as status,
  created_at
FROM corporate_vouchers
ORDER BY created_at DESC
LIMIT 10;
