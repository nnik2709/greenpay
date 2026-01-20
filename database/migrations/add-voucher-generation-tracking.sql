-- Add Voucher Generation Tracking Columns
-- Purpose: Track voucher generation status separately from payment status
-- Date: 2026-01-15
-- Phase: Phase 1 - Multiple Vouchers Fix

-- Add tracking columns to purchase_sessions table
ALTER TABLE purchase_sessions
ADD COLUMN IF NOT EXISTS vouchers_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS vouchers_generation_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_generation_attempt TIMESTAMP;

-- Add comment to document purpose
COMMENT ON COLUMN purchase_sessions.vouchers_generated IS 'TRUE if vouchers were successfully generated for this session';
COMMENT ON COLUMN purchase_sessions.vouchers_generation_attempts IS 'Number of times voucher generation was attempted (for debugging failed generations)';
COMMENT ON COLUMN purchase_sessions.last_generation_attempt IS 'Timestamp of last voucher generation attempt';

-- Create index for quick lookup of sessions with failed voucher generation
CREATE INDEX IF NOT EXISTS idx_sessions_payment_success_vouchers_failed
ON purchase_sessions(payment_status, vouchers_generated)
WHERE payment_status = 'completed' AND vouchers_generated = FALSE;

-- Display migration status
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'purchase_sessions'
AND column_name IN ('vouchers_generated', 'vouchers_generation_attempts', 'last_generation_attempt')
ORDER BY ordinal_position;
