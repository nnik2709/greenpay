-- =============================================
-- CONSOLIDATED MIGRATION - PNG Green Fees System
-- Date: 2025-01-20
-- Version: 2.0
-- Purpose: Add discount tracking and fix quotation creation
-- =============================================
-- This file contains migrations 020 and 021
-- Can be run all at once on a fresh database
-- Or run individually if migrations already partially applied
-- =============================================

-- =============================================
-- MIGRATION 020: Add Discount and Returned Amount
-- Purpose: Track discount and change for purchases/vouchers
-- =============================================

BEGIN;

-- Add discount column to individual_purchases
ALTER TABLE public.individual_purchases
ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Add returned_amount (change given) column to individual_purchases
ALTER TABLE public.individual_purchases
ADD COLUMN IF NOT EXISTS returned_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Add collected_amount (amount actually collected from customer) to individual_purchases
ALTER TABLE public.individual_purchases
ADD COLUMN IF NOT EXISTS collected_amount DECIMAL(10, 2);

-- Add discount column to corporate_vouchers
ALTER TABLE public.corporate_vouchers
ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Add returned_amount column to corporate_vouchers
ALTER TABLE public.corporate_vouchers
ADD COLUMN IF NOT EXISTS returned_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Add collected_amount to corporate_vouchers
ALTER TABLE public.corporate_vouchers
ADD COLUMN IF NOT EXISTS collected_amount DECIMAL(10, 2);

-- Add comments to document the columns
COMMENT ON COLUMN public.individual_purchases.discount IS 'Discount amount applied to this purchase (in PGK)';
COMMENT ON COLUMN public.individual_purchases.returned_amount IS 'Change/amount returned to customer after payment (in PGK)';
COMMENT ON COLUMN public.individual_purchases.collected_amount IS 'Total amount collected from customer before change (in PGK). If null, equals amount.';

COMMENT ON COLUMN public.corporate_vouchers.discount IS 'Discount amount applied to this voucher (in PGK)';
COMMENT ON COLUMN public.corporate_vouchers.returned_amount IS 'Change/amount returned to customer after payment (in PGK)';
COMMENT ON COLUMN public.corporate_vouchers.collected_amount IS 'Total amount collected from customer before change (in PGK). If null, equals amount.';

-- Update existing records to set collected_amount = amount where null
UPDATE public.individual_purchases
SET collected_amount = amount
WHERE collected_amount IS NULL;

UPDATE public.corporate_vouchers
SET collected_amount = amount
WHERE collected_amount IS NULL;

-- Create index for reporting queries that filter by discount
CREATE INDEX IF NOT EXISTS idx_individual_purchases_discount
ON public.individual_purchases(discount) WHERE discount > 0;

CREATE INDEX IF NOT EXISTS idx_corporate_vouchers_discount
ON public.corporate_vouchers(discount) WHERE discount > 0;

-- Create index for reporting queries that filter by returned_amount
CREATE INDEX IF NOT EXISTS idx_individual_purchases_returned
ON public.individual_purchases(returned_amount) WHERE returned_amount > 0;

CREATE INDEX IF NOT EXISTS idx_corporate_vouchers_returned
ON public.corporate_vouchers(returned_amount) WHERE returned_amount > 0;

COMMIT;

-- =============================================
-- MIGRATION 021: Add Discount to Quotations
-- Purpose: Track discount information in quotations
-- =============================================

BEGIN;

-- Add discount percentage column
ALTER TABLE public.quotations
ADD COLUMN IF NOT EXISTS discount DECIMAL(5, 2) DEFAULT 0 NOT NULL;

-- Add discount amount column (calculated discount in PGK)
ALTER TABLE public.quotations
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Add amount_after_discount column (total after discount applied)
ALTER TABLE public.quotations
ADD COLUMN IF NOT EXISTS amount_after_discount DECIMAL(10, 2);

-- Add price_per_passport as an alias to amount_per_passport for compatibility
ALTER TABLE public.quotations
ADD COLUMN IF NOT EXISTS price_per_passport DECIMAL(10, 2);

-- Add comments to document the columns
COMMENT ON COLUMN public.quotations.discount IS 'Discount percentage applied to this quotation (0-100)';
COMMENT ON COLUMN public.quotations.discount_amount IS 'Calculated discount amount in PGK (total_amount * discount / 100)';
COMMENT ON COLUMN public.quotations.amount_after_discount IS 'Total amount after discount (total_amount - discount_amount)';
COMMENT ON COLUMN public.quotations.price_per_passport IS 'Alias for amount_per_passport, price per voucher/passport in PGK';

-- Update existing records to set amount_after_discount = total_amount (no discount)
UPDATE public.quotations
SET amount_after_discount = total_amount
WHERE amount_after_discount IS NULL;

-- Update existing records to set price_per_passport = amount_per_passport
UPDATE public.quotations
SET price_per_passport = amount_per_passport
WHERE price_per_passport IS NULL;

-- Create index for reporting queries that filter by discount
CREATE INDEX IF NOT EXISTS idx_quotations_discount
ON public.quotations(discount) WHERE discount > 0;

COMMIT;

-- =============================================
-- VERIFICATION QUERIES
-- Run these to confirm successful migration
-- =============================================

-- Verify new columns in individual_purchases
SELECT 'individual_purchases columns' as check_type,
       COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'individual_purchases'
  AND column_name IN ('discount', 'collected_amount', 'returned_amount');
-- Expected: 3

-- Verify new columns in corporate_vouchers
SELECT 'corporate_vouchers columns' as check_type,
       COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'corporate_vouchers'
  AND column_name IN ('discount', 'collected_amount', 'returned_amount');
-- Expected: 3

-- Verify new columns in quotations
SELECT 'quotations columns' as check_type,
       COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'quotations'
  AND column_name IN ('discount', 'discount_amount', 'amount_after_discount', 'price_per_passport');
-- Expected: 4

-- Verify indexes created
SELECT 'indexes created' as check_type,
       COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
  AND (indexname LIKE '%discount%' OR indexname LIKE '%returned%')
  AND tablename IN ('individual_purchases', 'corporate_vouchers', 'quotations');
-- Expected: 5

-- Check for any null values in NOT NULL columns (should be 0)
SELECT 'null check - individual_purchases' as check_type,
       COUNT(*) FILTER (WHERE discount IS NULL) as null_discount_count,
       COUNT(*) FILTER (WHERE returned_amount IS NULL) as null_returned_count
FROM public.individual_purchases;

SELECT 'null check - corporate_vouchers' as check_type,
       COUNT(*) FILTER (WHERE discount IS NULL) as null_discount_count,
       COUNT(*) FILTER (WHERE returned_amount IS NULL) as null_returned_count
FROM public.corporate_vouchers;

SELECT 'null check - quotations' as check_type,
       COUNT(*) FILTER (WHERE discount IS NULL) as null_discount_count,
       COUNT(*) FILTER (WHERE discount_amount IS NULL) as null_discount_amount_count
FROM public.quotations;

-- =============================================
-- END OF CONSOLIDATED MIGRATION
-- =============================================
