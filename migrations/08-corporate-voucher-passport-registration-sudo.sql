-- Migration: Add passport registration workflow for corporate vouchers
-- Date: December 12, 2025
-- Purpose: Allow corporate vouchers to be created without passport data,
--          then registered later by corporate users
-- IMPORTANT: Run this as postgres superuser (sudo -u postgres psql)

\c greenpay_db;

-- Step 1: Add status column to corporate_vouchers
ALTER TABLE corporate_vouchers
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_passport';

-- Step 2: Make passport_number nullable (currently NOT NULL)
ALTER TABLE corporate_vouchers
ALTER COLUMN passport_number DROP NOT NULL;

-- Step 3: Add registered_at timestamp
ALTER TABLE corporate_vouchers
ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ;

-- Step 4: Add registered_by user reference
ALTER TABLE corporate_vouchers
ADD COLUMN IF NOT EXISTS registered_by UUID REFERENCES profiles(id);

-- Step 5: Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_corporate_vouchers_status
ON corporate_vouchers(status);

-- Step 6: Create index on passport_number for faster lookups (only non-null)
CREATE INDEX IF NOT EXISTS idx_corporate_vouchers_passport_number
ON corporate_vouchers(passport_number) WHERE passport_number IS NOT NULL;

-- Step 7: Update existing vouchers to have 'active' status if they have passport data
UPDATE corporate_vouchers
SET status = 'active'
WHERE passport_number IS NOT NULL AND status IS NULL;

-- Step 8: Set existing vouchers without passport to 'pending_passport'
UPDATE corporate_vouchers
SET status = 'pending_passport'
WHERE passport_number IS NULL AND status IS NULL;

-- Step 9: Add helpful comments
COMMENT ON COLUMN corporate_vouchers.status IS 'Voucher lifecycle status: pending_passport, active, used, expired, cancelled';
COMMENT ON COLUMN corporate_vouchers.registered_at IS 'When the passport was registered to this voucher';
COMMENT ON COLUMN corporate_vouchers.registered_by IS 'User who registered the passport to this voucher';

-- Step 10: Add constraint to ensure status values are valid
ALTER TABLE corporate_vouchers
ADD CONSTRAINT check_corporate_voucher_status
CHECK (status IN ('pending_passport', 'active', 'used', 'expired', 'cancelled'));

-- Verification queries
SELECT 'Migration completed successfully!' as message;
SELECT COUNT(*) as total_vouchers, status, COUNT(*) FILTER (WHERE passport_number IS NOT NULL) as with_passport
FROM corporate_vouchers
GROUP BY status;
