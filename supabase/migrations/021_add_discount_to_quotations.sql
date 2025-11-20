-- Migration: Add discount and price_per_passport fields to quotations table
-- Created: 2025-01-20
-- Purpose: Track discount information in quotations

-- Add price_per_passport as an alias/alternative name (if needed for compatibility)
-- The table already has amount_per_passport, but let's add these for clarity

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
