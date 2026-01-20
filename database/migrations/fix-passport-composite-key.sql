-- Migration: Fix Passport Uniqueness Constraint
-- Issue: Passport numbers are NOT globally unique across countries
-- Solution: Change from UNIQUE(passport_number) to UNIQUE(passport_number, nationality)
-- Priority: HIGH (Security Review Recommendation #5)
-- Date: 2026-01-19

-- Step 1: Drop existing unique constraint on passport_number
DO $$
BEGIN
  -- Check if the constraint exists and drop it
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'passports_passport_number_key'
  ) THEN
    ALTER TABLE passports DROP CONSTRAINT passports_passport_number_key;
    RAISE NOTICE 'Dropped existing passport_number unique constraint';
  ELSE
    RAISE NOTICE 'No existing passport_number unique constraint found';
  END IF;
END $$;

-- Step 2: Add composite unique constraint on (passport_number, nationality)
DO $$
BEGIN
  -- Check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'passports_passport_nationality_key'
  ) THEN
    ALTER TABLE passports
      ADD CONSTRAINT passports_passport_nationality_key
      UNIQUE (passport_number, nationality);
    RAISE NOTICE 'Added composite unique constraint on (passport_number, nationality)';
  ELSE
    RAISE NOTICE 'Composite constraint already exists';
  END IF;
END $$;

-- Step 3: Create index for performance on common queries
CREATE INDEX IF NOT EXISTS idx_passports_passport_nationality
  ON passports(passport_number, nationality);

RAISE NOTICE 'Migration completed: Passport uniqueness now enforced by (passport_number, nationality)';

-- Verification query (commented out - run manually if needed)
-- SELECT
--   passport_number,
--   nationality,
--   COUNT(*) as count
-- FROM passports
-- GROUP BY passport_number, nationality
-- HAVING COUNT(*) > 1;
-- This should return 0 rows after migration
