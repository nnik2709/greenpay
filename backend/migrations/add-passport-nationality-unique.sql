-- Migration: Add composite unique constraint on passport_number + nationality
-- Reason: Passport numbers are NOT globally unique - different countries can issue
--         the same passport number to different people.
--
-- Run this on production database:
-- psql -h localhost -U postgres -d greenpay -f add-passport-nationality-unique.sql

-- Step 1: Check for any existing conflicts before migration
DO $$
DECLARE
    conflict_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO conflict_count
    FROM (
        SELECT passport_number, nationality
        FROM passports
        GROUP BY passport_number, nationality
        HAVING COUNT(*) > 1
    ) AS duplicates;

    IF conflict_count > 0 THEN
        RAISE NOTICE 'Found % duplicate passport_number + nationality combinations. Please resolve before migration.', conflict_count;
        -- Show the duplicates
        RAISE NOTICE 'Run this query to see duplicates: SELECT passport_number, nationality, COUNT(*) FROM passports GROUP BY passport_number, nationality HAVING COUNT(*) > 1;';
    ELSE
        RAISE NOTICE 'No conflicts found. Safe to proceed with migration.';
    END IF;
END $$;

-- Step 2: Remove the old unique constraint on passport_number alone
-- Note: The constraint name may vary - check your database
ALTER TABLE passports DROP CONSTRAINT IF EXISTS passports_passport_number_key;
ALTER TABLE passports DROP CONSTRAINT IF EXISTS passports_passport_number_unique;

-- Also drop any unique index that might exist
DROP INDEX IF EXISTS passports_passport_number_key;
DROP INDEX IF EXISTS idx_passports_passport_number_unique;

-- Step 3: Add new composite unique constraint
-- This allows same passport_number from different countries
ALTER TABLE passports
ADD CONSTRAINT passports_passport_nationality_unique
UNIQUE(passport_number, nationality);

-- Step 4: Create index for efficient lookups by passport_number + nationality
CREATE INDEX IF NOT EXISTS idx_passports_number_nationality
ON passports(passport_number, nationality);

-- Step 5: Verify the constraint was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'passports_passport_nationality_unique'
    ) THEN
        RAISE NOTICE 'SUCCESS: Composite unique constraint created successfully.';
    ELSE
        RAISE NOTICE 'WARNING: Constraint may not have been created. Please verify manually.';
    END IF;
END $$;

-- Step 6: Show current constraints on passports table
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'passports'::regclass;
