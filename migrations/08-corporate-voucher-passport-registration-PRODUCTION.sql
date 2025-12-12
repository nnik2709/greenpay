-- Migration: Add passport registration workflow for corporate vouchers
-- Date: December 12, 2025
-- Purpose: Allow corporate vouchers to be created without passport data,
--          then registered later by corporate users
-- PRODUCTION VERSION - matches actual database schema

-- Your production schema:
-- - Uses INTEGER ids (not UUID)
-- - Has employee_name, employee_id columns (not passport fields)
-- - Already has status column (default 'active')
-- - Already has registered_at column

-- Step 1: status column already exists, just update default for new records
ALTER TABLE corporate_vouchers
ALTER COLUMN status SET DEFAULT 'pending_passport';

-- Step 2: Add passport-related columns (these don't exist in your schema)
ALTER TABLE corporate_vouchers
ADD COLUMN IF NOT EXISTS passport_id INTEGER REFERENCES passports(id);

ALTER TABLE corporate_vouchers
ADD COLUMN IF NOT EXISTS passport_number TEXT;

-- Step 3: registered_at already exists, skip

-- Step 4: Add registered_by user reference (INTEGER, not UUID)
ALTER TABLE corporate_vouchers
ADD COLUMN IF NOT EXISTS registered_by INTEGER REFERENCES profiles(id);

-- Step 5: Status index already exists (idx_corporate_vouchers_status)

-- Step 6: Create index on passport_number for faster lookups (only non-null)
CREATE INDEX IF NOT EXISTS idx_corporate_vouchers_passport_number
ON corporate_vouchers(passport_number) WHERE passport_number IS NOT NULL;

-- Step 7: Create index on passport_id for joins
CREATE INDEX IF NOT EXISTS idx_corporate_vouchers_passport_id
ON corporate_vouchers(passport_id) WHERE passport_id IS NOT NULL;

-- Step 8: Update existing vouchers
-- Set existing vouchers without passport to 'pending_passport'
UPDATE corporate_vouchers
SET status = 'pending_passport'
WHERE passport_number IS NULL
  AND status NOT IN ('redeemed', 'expired', 'cancelled');

-- Set existing vouchers with passport data to 'active'
UPDATE corporate_vouchers
SET status = 'active'
WHERE passport_number IS NOT NULL
  AND status NOT IN ('redeemed', 'expired', 'cancelled', 'pending_passport');

-- Step 9: Add helpful comments
COMMENT ON COLUMN corporate_vouchers.status IS 'Voucher lifecycle status: pending_passport (needs registration), active (ready to use), redeemed (used), expired, cancelled';
COMMENT ON COLUMN corporate_vouchers.registered_at IS 'When the passport was registered to this voucher';
COMMENT ON COLUMN corporate_vouchers.registered_by IS 'Profile ID of user who registered the passport to this voucher';
COMMENT ON COLUMN corporate_vouchers.passport_id IS 'Reference to passports table after registration';
COMMENT ON COLUMN corporate_vouchers.passport_number IS 'Passport number registered to this voucher';

-- Step 10: Update the status constraint if it exists, or create it
DO $$
BEGIN
  -- Drop old constraint if exists
  ALTER TABLE corporate_vouchers DROP CONSTRAINT IF EXISTS check_corporate_voucher_status;

  -- Add new constraint with all valid statuses
  ALTER TABLE corporate_vouchers
  ADD CONSTRAINT check_corporate_voucher_status
  CHECK (status IN ('pending_passport', 'active', 'redeemed', 'expired', 'cancelled'));

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Constraint already exists or could not be created: %', SQLERRM;
END $$;

-- Verification queries
SELECT 'Migration completed successfully!' as message;

SELECT
  status,
  COUNT(*) as total_vouchers,
  COUNT(passport_number) as with_passport,
  COUNT(*) - COUNT(passport_number) as without_passport
FROM corporate_vouchers
GROUP BY status
ORDER BY status;

-- Show sample of pending vouchers
SELECT
  voucher_code,
  company_name,
  employee_name,
  status,
  passport_number,
  valid_until
FROM corporate_vouchers
WHERE status = 'pending_passport'
LIMIT 5;
