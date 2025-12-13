-- Add refund_status column to track refund workflow
-- Status: null (no refund), 'pending' (refund initiated), 'completed' (refund paid)

ALTER TABLE individual_purchases
ADD COLUMN IF NOT EXISTS refund_status VARCHAR(20);

-- Update existing refunded payments to have refund_status = 'completed'
UPDATE individual_purchases
SET refund_status = 'completed'
WHERE status = 'refunded' AND refund_status IS NULL;

-- Add comment
COMMENT ON COLUMN individual_purchases.refund_status IS 'Refund status: NULL (no refund), pending (refund initiated), completed (refund paid)';

-- Add index
CREATE INDEX IF NOT EXISTS idx_individual_purchases_refund_status ON individual_purchases(refund_status);
