-- Migration: Create Purchase Sessions Table (Simplified)
-- Purpose: Track online voucher purchases before payment completion
-- Date: 2025-01-15

-- Create purchase_sessions table
CREATE TABLE IF NOT EXISTS purchase_sessions (
  id VARCHAR(255) PRIMARY KEY,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  quantity INTEGER NOT NULL DEFAULT 1,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'PGK',
  delivery_method VARCHAR(50) DEFAULT 'Email',
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_gateway_ref VARCHAR(255),
  session_data JSONB,
  expires_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_sessions_status ON purchase_sessions(payment_status);
CREATE INDEX IF NOT EXISTS idx_purchase_sessions_expires ON purchase_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_purchase_sessions_email ON purchase_sessions(customer_email);
CREATE INDEX IF NOT EXISTS idx_purchase_sessions_phone ON purchase_sessions(customer_phone);
CREATE INDEX IF NOT EXISTS idx_purchase_sessions_created ON purchase_sessions(created_at DESC);

-- Add columns to individual_purchases table for public purchases
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='individual_purchases' AND column_name='purchase_session_id') THEN
    ALTER TABLE individual_purchases ADD COLUMN purchase_session_id VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='individual_purchases' AND column_name='customer_email') THEN
    ALTER TABLE individual_purchases ADD COLUMN customer_email VARCHAR(255);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='individual_purchases' AND column_name='customer_phone') THEN
    ALTER TABLE individual_purchases ADD COLUMN customer_phone VARCHAR(50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='individual_purchases' AND column_name='payment_gateway_ref') THEN
    ALTER TABLE individual_purchases ADD COLUMN payment_gateway_ref VARCHAR(255);
  END IF;
END $$;

-- Create index for linking vouchers to sessions
CREATE INDEX IF NOT EXISTS idx_individual_purchases_session ON individual_purchases(purchase_session_id);

-- Create function to cleanup expired sessions (for cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_purchase_sessions()
RETURNS TABLE (
  deleted_count INTEGER
) AS $$
DECLARE
  count INTEGER;
BEGIN
  DELETE FROM purchase_sessions
  WHERE expires_at < NOW()
    AND payment_status = 'pending';

  GET DIAGNOSTICS count = ROW_COUNT;

  RETURN QUERY SELECT count;
END;
$$ LANGUAGE plpgsql;

-- Verify table created
SELECT 'Purchase sessions table created successfully!' AS status;
