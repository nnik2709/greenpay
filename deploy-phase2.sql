-- Phase 2 Database Migration
-- Add passport data support to purchase_sessions table
-- Execute on: greenpay database
-- Date: December 10, 2025

-- Add passport_data column
ALTER TABLE purchase_sessions
  ADD COLUMN IF NOT EXISTS passport_data JSONB;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_purchase_sessions_passport_data
  ON purchase_sessions USING GIN (passport_data);

-- Add tracking column
ALTER TABLE purchase_sessions
  ADD COLUMN IF NOT EXISTS passport_created BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN purchase_sessions.passport_data IS 'Passport information stored before payment (JSONB): {passportNumber, surname, givenName, nationality, dateOfBirth, sex}';
COMMENT ON COLUMN purchase_sessions.passport_created IS 'Whether passport record was successfully created during webhook processing';

-- Verify migration
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'purchase_sessions'
  AND column_name IN ('passport_data', 'passport_created');

-- Success message
SELECT 'Migration completed successfully!' as status;
