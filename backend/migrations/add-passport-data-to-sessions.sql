-- Migration: Add Passport Data Support to Purchase Sessions
-- Purpose: Store passport information for atomic voucher+passport creation
-- Date: 2025-12-10

-- Add passport_data column to store passport information before payment
ALTER TABLE purchase_sessions
  ADD COLUMN IF NOT EXISTS passport_data JSONB;

-- Add index for passport data queries
CREATE INDEX IF NOT EXISTS idx_purchase_sessions_passport_data
  ON purchase_sessions USING GIN (passport_data);

-- Add column to track if passport was created
ALTER TABLE purchase_sessions
  ADD COLUMN IF NOT EXISTS passport_created BOOLEAN DEFAULT FALSE;

-- Comments
COMMENT ON COLUMN purchase_sessions.passport_data IS 'Passport information for voucher registration (JSONB): {passport_number, surname, given_name, nationality, dob, sex}';
COMMENT ON COLUMN purchase_sessions.passport_created IS 'Whether passport record was created during webhook processing';

-- Sample structure:
-- passport_data: {
--   "passportNumber": "AB123456",
--   "surname": "DOE",
--   "givenName": "JOHN",
--   "nationality": "Papua New Guinea",
--   "dateOfBirth": "1990-01-15",
--   "sex": "Male",
--   "email": "john@example.com",
--   "phone": "+675..."
-- }
