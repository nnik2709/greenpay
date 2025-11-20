-- Migration: Add discount and returned_amount columns to individual_purchases and corporate_vouchers
-- Created: 2025-01-20
-- Purpose: Track discount and change/returned amounts for revenue reporting

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
