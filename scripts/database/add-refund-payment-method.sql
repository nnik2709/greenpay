-- Add refund_payment_method column to individual_purchases table
-- This tracks how the refund was paid (e.g., CASH, BANK, CARD)

ALTER TABLE individual_purchases
ADD COLUMN IF NOT EXISTS refund_payment_method VARCHAR(50);

-- Add comment
COMMENT ON COLUMN individual_purchases.refund_payment_method IS 'Payment method used for the refund (CASH, BANK, CARD, etc.)';
