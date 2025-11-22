-- PCI-DSS Compliance Migration: Add POS Terminal Transaction Tracking
-- Run this SQL in your Supabase SQL Editor
--
-- Purpose: Replace credit card data collection with secure POS transaction references
-- Date: November 23, 2025
-- Related: PCI_COMPLIANCE_FIX.md

-- =============================================
-- ADD POS TERMINAL TRACKING COLUMNS
-- =============================================

-- Add columns to individual_purchases table
ALTER TABLE individual_purchases
ADD COLUMN IF NOT EXISTS pos_terminal_id TEXT,
ADD COLUMN IF NOT EXISTS pos_transaction_ref TEXT,
ADD COLUMN IF NOT EXISTS pos_approval_code TEXT;

-- Add columns to corporate_vouchers table
ALTER TABLE corporate_vouchers
ADD COLUMN IF NOT EXISTS pos_terminal_id TEXT,
ADD COLUMN IF NOT EXISTS pos_transaction_ref TEXT,
ADD COLUMN IF NOT EXISTS pos_approval_code TEXT;

-- Add columns to transactions table (for reporting)
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS pos_terminal_id TEXT,
ADD COLUMN IF NOT EXISTS pos_transaction_ref TEXT,
ADD COLUMN IF NOT EXISTS pos_approval_code TEXT,
ADD COLUMN IF NOT EXISTS card_last_four TEXT;

-- =============================================
-- CREATE INDEXES FOR RECONCILIATION
-- =============================================

-- Index for fast lookup by transaction reference
CREATE INDEX IF NOT EXISTS idx_individual_purchases_pos_ref
ON individual_purchases(pos_transaction_ref);

CREATE INDEX IF NOT EXISTS idx_corporate_vouchers_pos_ref
ON corporate_vouchers(pos_transaction_ref);

CREATE INDEX IF NOT EXISTS idx_transactions_pos_ref
ON transactions(pos_transaction_ref);

-- Composite index for terminal + date reconciliation
CREATE INDEX IF NOT EXISTS idx_individual_purchases_pos_terminal_date
ON individual_purchases(pos_terminal_id, created_at);

CREATE INDEX IF NOT EXISTS idx_corporate_vouchers_pos_terminal_date
ON corporate_vouchers(pos_terminal_id, created_at);

-- =============================================
-- DATA CLEANUP (CRITICAL SECURITY)
-- =============================================

-- ⚠️ IMPORTANT: Check if any full card numbers exist in card_last_four column
-- This should be run AFTER backing up the database

-- Check for potential full card numbers (more than 4 digits)
DO $$
DECLARE
  bad_cards_individual INTEGER;
  bad_cards_corporate INTEGER;
BEGIN
  -- Count potentially problematic entries
  SELECT COUNT(*) INTO bad_cards_individual
  FROM individual_purchases
  WHERE LENGTH(REGEXP_REPLACE(card_last_four, '[^0-9]', '', 'g')) > 4;

  SELECT COUNT(*) INTO bad_cards_corporate
  FROM corporate_vouchers
  WHERE LENGTH(REGEXP_REPLACE(card_last_four, '[^0-9]', '', 'g')) > 4;

  -- Log findings
  RAISE NOTICE 'Found % individual purchases with card data > 4 digits', bad_cards_individual;
  RAISE NOTICE 'Found % corporate vouchers with card data > 4 digits', bad_cards_corporate;

  -- Only proceed with cleanup if issues found
  IF bad_cards_individual > 0 THEN
    -- Clean up individual_purchases - keep only last 4 digits
    UPDATE individual_purchases
    SET card_last_four = RIGHT(REGEXP_REPLACE(card_last_four, '[^0-9]', '', 'g'), 4)
    WHERE LENGTH(REGEXP_REPLACE(card_last_four, '[^0-9]', '', 'g')) > 4;

    RAISE NOTICE 'Cleaned % individual purchase records', bad_cards_individual;
  END IF;

  IF bad_cards_corporate > 0 THEN
    -- Clean up corporate_vouchers - keep only last 4 digits
    UPDATE corporate_vouchers
    SET card_last_four = RIGHT(REGEXP_REPLACE(card_last_four, '[^0-9]', '', 'g'), 4)
    WHERE LENGTH(REGEXP_REPLACE(card_last_four, '[^0-9]', '', 'g')) > 4;

    RAISE NOTICE 'Cleaned % corporate voucher records', bad_cards_corporate;
  END IF;

  IF bad_cards_individual = 0 AND bad_cards_corporate = 0 THEN
    RAISE NOTICE '✅ No card data cleanup needed - all entries are compliant';
  END IF;
END $$;

-- =============================================
-- UPDATE PAYMENT MODES TABLE
-- =============================================

-- Update payment modes to reflect that we no longer collect card details
-- We only collect POS transaction references
UPDATE payment_modes
SET collect_card_details = false
WHERE name IN ('CREDIT CARD', 'DEBIT CARD', 'EFTPOS');

-- Add comment explaining the change
COMMENT ON COLUMN payment_modes.collect_card_details IS
'DEPRECATED: Application no longer collects full card details for PCI-DSS compliance. Only POS transaction references are collected.';

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON COLUMN individual_purchases.pos_terminal_id IS
'POS terminal identifier (e.g., POS-001) for reconciliation';

COMMENT ON COLUMN individual_purchases.pos_transaction_ref IS
'Transaction reference number from POS terminal receipt (required for card payments)';

COMMENT ON COLUMN individual_purchases.pos_approval_code IS
'Bank approval code from POS terminal receipt';

COMMENT ON COLUMN individual_purchases.card_last_four IS
'Last 4 digits of card number only (for reconciliation). NEVER store full card numbers - PCI-DSS violation.';

COMMENT ON COLUMN corporate_vouchers.pos_terminal_id IS
'POS terminal identifier (e.g., POS-001) for reconciliation';

COMMENT ON COLUMN corporate_vouchers.pos_transaction_ref IS
'Transaction reference number from POS terminal receipt (required for card payments)';

COMMENT ON COLUMN corporate_vouchers.pos_approval_code IS
'Bank approval code from POS terminal receipt';

COMMENT ON COLUMN transactions.pos_terminal_id IS
'POS terminal identifier for reporting and reconciliation';

COMMENT ON COLUMN transactions.pos_transaction_ref IS
'Transaction reference number from POS terminal';

COMMENT ON COLUMN transactions.pos_approval_code IS
'Bank approval code from POS terminal';

COMMENT ON COLUMN transactions.card_last_four IS
'Last 4 digits of card number only. NEVER store full card numbers.';

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Run these queries after migration to verify success:

-- 1. Check columns were added
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'individual_purchases'
-- AND column_name LIKE 'pos_%';

-- 2. Check indexes were created
-- SELECT indexname
-- FROM pg_indexes
-- WHERE tablename IN ('individual_purchases', 'corporate_vouchers', 'transactions')
-- AND indexname LIKE '%pos%';

-- 3. Verify no card data longer than 4 digits exists
-- SELECT
--   'individual_purchases' as table_name,
--   COUNT(*) as records,
--   COUNT(CASE WHEN LENGTH(REGEXP_REPLACE(card_last_four, '[^0-9]', '', 'g')) > 4 THEN 1 END) as violations
-- FROM individual_purchases
-- WHERE card_last_four IS NOT NULL
-- UNION ALL
-- SELECT
--   'corporate_vouchers',
--   COUNT(*),
--   COUNT(CASE WHEN LENGTH(REGEXP_REPLACE(card_last_four, '[^0-9]', '', 'g')) > 4 THEN 1 END)
-- FROM corporate_vouchers
-- WHERE card_last_four IS NOT NULL;

-- Expected result: violations = 0 for both tables

-- =============================================
-- ROLLBACK SCRIPT (Emergency Use Only)
-- =============================================

-- ⚠️ WARNING: Only use if migration causes critical issues
-- DO NOT run this in normal circumstances

-- DROP INDEX IF EXISTS idx_individual_purchases_pos_ref;
-- DROP INDEX IF EXISTS idx_corporate_vouchers_pos_ref;
-- DROP INDEX IF EXISTS idx_transactions_pos_ref;
-- DROP INDEX IF EXISTS idx_individual_purchases_pos_terminal_date;
-- DROP INDEX IF EXISTS idx_corporate_vouchers_pos_terminal_date;

-- ALTER TABLE individual_purchases DROP COLUMN IF EXISTS pos_terminal_id;
-- ALTER TABLE individual_purchases DROP COLUMN IF EXISTS pos_transaction_ref;
-- ALTER TABLE individual_purchases DROP COLUMN IF EXISTS pos_approval_code;

-- ALTER TABLE corporate_vouchers DROP COLUMN IF EXISTS pos_terminal_id;
-- ALTER TABLE corporate_vouchers DROP COLUMN IF EXISTS pos_transaction_ref;
-- ALTER TABLE corporate_vouchers DROP COLUMN IF EXISTS pos_approval_code;

-- ALTER TABLE transactions DROP COLUMN IF EXISTS pos_terminal_id;
-- ALTER TABLE transactions DROP COLUMN IF EXISTS pos_transaction_ref;
-- ALTER TABLE transactions DROP COLUMN IF EXISTS pos_approval_code;
-- ALTER TABLE transactions DROP COLUMN IF EXISTS card_last_four;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PCI-DSS Compliance Migration Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Added POS terminal tracking columns';
  RAISE NOTICE 'Created reconciliation indexes';
  RAISE NOTICE 'Cleaned any existing card data violations';
  RAISE NOTICE 'Updated payment mode settings';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Deploy updated application code';
  RAISE NOTICE '2. Train staff on new POS transaction entry';
  RAISE NOTICE '3. Test card payment workflow';
  RAISE NOTICE '4. Monitor for any issues';
  RAISE NOTICE '========================================';
END $$;
