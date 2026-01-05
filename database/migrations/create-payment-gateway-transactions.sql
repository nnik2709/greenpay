-- Create payment_gateway_transactions table for BSP DOKU integration
-- This table tracks all payment gateway transactions across different providers

CREATE TABLE IF NOT EXISTS payment_gateway_transactions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  gateway_name VARCHAR(50) NOT NULL,
  gateway_session_id VARCHAR(255),
  customer_email VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'PGK',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  gateway_response JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on session_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_payment_gateway_session_id
  ON payment_gateway_transactions(session_id);

-- Create index on status for reporting
CREATE INDEX IF NOT EXISTS idx_payment_gateway_status
  ON payment_gateway_transactions(status);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_payment_gateway_created_at
  ON payment_gateway_transactions(created_at);

COMMENT ON TABLE payment_gateway_transactions IS 'Tracks payment gateway transactions for BSP DOKU and other payment providers';
COMMENT ON COLUMN payment_gateway_transactions.session_id IS 'Unique transaction identifier from merchant system (e.g., PGKO-timestamp-random)';
COMMENT ON COLUMN payment_gateway_transactions.gateway_name IS 'Payment gateway provider name (e.g., bsp, stripe)';
COMMENT ON COLUMN payment_gateway_transactions.gateway_session_id IS 'Session ID from payment gateway (if different from session_id)';
COMMENT ON COLUMN payment_gateway_transactions.status IS 'Transaction status: pending, completed, failed, cancelled';
COMMENT ON COLUMN payment_gateway_transactions.gateway_response IS 'Full response from payment gateway (JSON)';
