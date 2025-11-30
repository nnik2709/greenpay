-- Fix Passport Table Constraints
-- Make date_of_birth, date_of_expiry, and other fields OPTIONAL
-- Only passport_number should be mandatory

-- Remove NOT NULL constraints from optional fields
ALTER TABLE "Passport" ALTER COLUMN date_of_birth DROP NOT NULL;
ALTER TABLE "Passport" ALTER COLUMN date_of_expiry DROP NOT NULL;
ALTER TABLE "Passport" ALTER COLUMN nationality DROP NOT NULL;
ALTER TABLE "Passport" ALTER COLUMN surname DROP NOT NULL;
ALTER TABLE "Passport" ALTER COLUMN given_name DROP NOT NULL;

-- Keep passport_number as the only required field
-- (it's already NOT NULL and UNIQUE, so no change needed)

-- Verify the changes
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'Passport'
ORDER BY ordinal_position;
