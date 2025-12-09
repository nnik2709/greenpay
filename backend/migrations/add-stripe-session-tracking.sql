-- Add column to track Stripe session ID for easier lookups
ALTER TABLE purchase_sessions 
ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchase_sessions_stripe_session 
ON purchase_sessions(stripe_session_id);

-- Add index for payment gateway reference
CREATE INDEX IF NOT EXISTS idx_purchase_sessions_gateway_ref 
ON purchase_sessions(payment_gateway_ref);
