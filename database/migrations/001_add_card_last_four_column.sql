-- Migration: Add card_last_four column to individual_purchases table
-- Date: 2025-12-18
-- Issue: View vouchers by passport failing with "column card_last_four does not exist"
-- Severity: CRITICAL

-- Add card_last_four column if it doesn't exist
ALTER TABLE individual_purchases
ADD COLUMN IF NOT EXISTS card_last_four VARCHAR(4);

-- Add comment for documentation
COMMENT ON COLUMN individual_purchases.card_last_four IS 'Last 4 digits of payment card (PCI compliant - never store full card number)';

-- Verify column was added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'individual_purchases'
AND column_name = 'card_last_four';
