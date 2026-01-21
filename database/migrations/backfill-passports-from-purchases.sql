/**
 * Backfill Passports Table from Individual Purchases
 *
 * PROBLEM: Passport registrations were only updating individual_purchases table,
 * not creating records in the passports table. This caused passport list and
 * passport reports to be empty.
 *
 * SOLUTION: This migration creates passport records for all registered vouchers
 * that have passport data but no corresponding passport record.
 *
 * Date: January 21, 2026
 */

BEGIN;

-- Create passport records for all individual purchases with passport data
-- that don't already have a passport record
INSERT INTO passports (
  passport_number,
  full_name,
  nationality,
  date_of_birth,
  issue_date,
  expiry_date,
  passport_type,
  sex,
  created_at,
  updated_at
)
SELECT DISTINCT
  ip.passport_number,
  ip.customer_name as full_name,
  NULL as nationality,  -- Not stored in individual_purchases
  NULL as date_of_birth, -- Not stored in individual_purchases
  NULL as issue_date,
  NULL as expiry_date,
  'P' as passport_type,  -- Default to P (Passport)
  NULL as sex,           -- Not stored in individual_purchases
  MIN(ip.created_at) as created_at,  -- Use earliest registration date
  MAX(ip.created_at) as updated_at   -- Use latest registration date
FROM individual_purchases ip
WHERE ip.passport_number IS NOT NULL
  AND ip.passport_number != ''
  AND ip.passport_number != 'PENDING'
  AND NOT EXISTS (
    -- Only insert if passport doesn't already exist
    SELECT 1 FROM passports p
    WHERE p.passport_number = ip.passport_number
  )
GROUP BY ip.passport_number, ip.customer_name
ORDER BY ip.passport_number;

-- Update individual_purchases records to link to passport_id
UPDATE individual_purchases ip
SET passport_id = p.id
FROM passports p
WHERE ip.passport_number = p.passport_number
  AND ip.passport_id IS NULL;

-- Print summary
DO $$
DECLARE
  passport_count INT;
  updated_purchases_count INT;
BEGIN
  SELECT COUNT(*) INTO passport_count FROM passports;
  SELECT COUNT(*) INTO updated_purchases_count
  FROM individual_purchases
  WHERE passport_id IS NOT NULL;

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Passport Backfill Migration Complete';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Total passports in table: %', passport_count;
  RAISE NOTICE 'Individual purchases with passport_id: %', updated_purchases_count;
  RAISE NOTICE '==============================================';
END $$;

COMMIT;
