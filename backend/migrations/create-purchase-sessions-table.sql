-- Migration: Create Purchase Sessions Table
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

-- Add constraint to ensure at least one contact method
ALTER TABLE purchase_sessions
  ADD CONSTRAINT chk_contact_info
  CHECK (customer_email IS NOT NULL OR customer_phone IS NOT NULL);

-- Add columns to individual_purchases table for public purchases
ALTER TABLE individual_purchases
  ADD COLUMN IF NOT EXISTS purchase_session_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS payment_gateway_ref VARCHAR(255);

-- Create index for linking vouchers to sessions
CREATE INDEX IF NOT EXISTS idx_individual_purchases_session
  ON individual_purchases(purchase_session_id);

-- Add foreign key constraint (optional - can be removed if sessions are cleaned up)
-- ALTER TABLE individual_purchases
--   ADD CONSTRAINT fk_purchase_session
--   FOREIGN KEY (purchase_session_id) REFERENCES purchase_sessions(id)
--   ON DELETE SET NULL;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_purchase_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_purchase_sessions_updated_at
  BEFORE UPDATE ON purchase_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_sessions_updated_at();

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

-- Grant permissions (adjust based on your user setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_sessions TO greenpay_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO greenpay_app;

-- Sample data for testing (optional - remove in production)
-- INSERT INTO purchase_sessions (
--   id,
--   customer_email,
--   customer_phone,
--   quantity,
--   amount,
--   currency,
--   delivery_method,
--   payment_status,
--   expires_at
-- ) VALUES (
--   'PGKB-TEST-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-000001',
--   'test@example.com',
--   '+675XXXXXXXX',
--   2,
--   100.00,
--   'PGK',
--   'SMS+Email',
--   'pending',
--   NOW() + INTERVAL '15 minutes'
-- );

COMMENT ON TABLE purchase_sessions IS 'Tracks online voucher purchase sessions before and after payment';
COMMENT ON COLUMN purchase_sessions.id IS 'Unique session ID (also used as merchant reference for BSP)';
COMMENT ON COLUMN purchase_sessions.customer_email IS 'Customer email for voucher delivery';
COMMENT ON COLUMN purchase_sessions.customer_phone IS 'Customer phone (+675XXXXXXXX) for SMS delivery';
COMMENT ON COLUMN purchase_sessions.quantity IS 'Number of vouchers to generate';
COMMENT ON COLUMN purchase_sessions.amount IS 'Total purchase amount in PGK';
COMMENT ON COLUMN purchase_sessions.delivery_method IS 'Email, SMS, or SMS+Email';
COMMENT ON COLUMN purchase_sessions.payment_status IS 'pending, processing, completed, failed, cancelled';
COMMENT ON COLUMN purchase_sessions.payment_gateway_ref IS 'BSP transaction ID';
COMMENT ON COLUMN purchase_sessions.session_data IS 'Additional payment data from gateway (JSON)';
COMMENT ON COLUMN purchase_sessions.expires_at IS 'Session expires after 15 minutes if payment not completed';
COMMENT ON COLUMN purchase_sessions.completed_at IS 'Timestamp when payment completed and vouchers generated';
