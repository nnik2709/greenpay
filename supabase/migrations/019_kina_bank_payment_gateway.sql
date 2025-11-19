-- Migration: Kina Bank Payment Gateway Integration
-- Description: Add tables and functions for Kina Bank IPG integration
-- Created: 2025-01-15

-- =====================================================
-- 1. Payment Gateway Configuration Table
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_gateway_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gateway_name TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  merchant_id TEXT,
  api_endpoint_url TEXT,
  sandbox_mode BOOLEAN DEFAULT true,
  config_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Add comment
COMMENT ON TABLE payment_gateway_config IS 'Configuration settings for payment gateways (Kina Bank, BSP, etc.)';

-- =====================================================
-- 2. Payment Gateway Transactions Table
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_gateway_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID REFERENCES individual_purchases(id) ON DELETE SET NULL,
  gateway_name TEXT NOT NULL,
  transaction_reference TEXT, -- Gateway's transaction ID
  merchant_reference TEXT UNIQUE, -- Our internal reference
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'PGK',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, success, failed, refunded, cancelled
  payment_method TEXT, -- VISA, MASTERCARD, etc.
  card_last_four TEXT, -- Last 4 digits of card
  customer_email TEXT,
  customer_name TEXT,
  request_payload JSONB,
  response_payload JSONB,
  callback_data JSONB,
  error_code TEXT,
  error_message TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  callback_received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Add indexes for performance
CREATE INDEX idx_gateway_transactions_purchase ON payment_gateway_transactions(purchase_id);
CREATE INDEX idx_gateway_transactions_status ON payment_gateway_transactions(status);
CREATE INDEX idx_gateway_transactions_reference ON payment_gateway_transactions(transaction_reference);
CREATE INDEX idx_gateway_transactions_merchant_ref ON payment_gateway_transactions(merchant_reference);
CREATE INDEX idx_gateway_transactions_created ON payment_gateway_transactions(created_at DESC);

-- Add comment
COMMENT ON TABLE payment_gateway_transactions IS 'Records all payment gateway transactions for audit and reconciliation';

-- =====================================================
-- 3. Payment Gateway Webhooks/Callbacks Log
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_gateway_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gateway_name TEXT NOT NULL,
  webhook_type TEXT, -- callback, notification, status_update
  transaction_reference TEXT,
  payload JSONB NOT NULL,
  headers JSONB,
  ip_address TEXT,
  processed BOOLEAN DEFAULT false,
  processing_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index
CREATE INDEX idx_gateway_webhooks_reference ON payment_gateway_webhooks(transaction_reference);
CREATE INDEX idx_gateway_webhooks_processed ON payment_gateway_webhooks(processed, created_at);

-- Add comment
COMMENT ON TABLE payment_gateway_webhooks IS 'Log of all webhook/callback requests from payment gateways';

-- =====================================================
-- 4. Insert Default Kina Bank Configuration
-- =====================================================
INSERT INTO payment_gateway_config (gateway_name, is_active, sandbox_mode, config_json)
VALUES (
  'KINA_BANK',
  false, -- Not active by default - admin must configure
  true, -- Start in sandbox mode
  '{
    "gateway_display_name": "Kina Bank Internet Payment Gateway",
    "supported_cards": ["VISA", "MASTERCARD"],
    "transaction_fee": 0.50,
    "currency": "PGK",
    "timeout_seconds": 300,
    "redirect_flow": true
  }'::jsonb
)
ON CONFLICT (gateway_name) DO NOTHING;

-- =====================================================
-- 5. Function to Generate Merchant Reference
-- =====================================================
CREATE OR REPLACE FUNCTION generate_merchant_reference()
RETURNS TEXT AS $$
DECLARE
  ref TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate reference: PGKB-YYYYMMDD-XXXXXX (PGKB = PNG Kina Bank)
    ref := 'PGKB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
           LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');

    -- Check if exists
    SELECT EXISTS(
      SELECT 1 FROM payment_gateway_transactions
      WHERE merchant_reference = ref
    ) INTO exists;

    -- Exit loop if unique
    EXIT WHEN NOT exists;
  END LOOP;

  RETURN ref;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. Function to Update Transaction Status
-- =====================================================
CREATE OR REPLACE FUNCTION update_gateway_transaction_status(
  p_merchant_reference TEXT,
  p_status TEXT,
  p_transaction_reference TEXT DEFAULT NULL,
  p_callback_data JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS payment_gateway_transactions AS $$
DECLARE
  v_transaction payment_gateway_transactions;
BEGIN
  UPDATE payment_gateway_transactions
  SET
    status = p_status,
    transaction_reference = COALESCE(p_transaction_reference, transaction_reference),
    callback_data = COALESCE(p_callback_data, callback_data),
    error_message = COALESCE(p_error_message, error_message),
    callback_received_at = CASE
      WHEN p_status IN ('success', 'failed') THEN NOW()
      ELSE callback_received_at
    END,
    payment_date = CASE
      WHEN p_status = 'success' THEN NOW()
      ELSE payment_date
    END,
    updated_at = NOW()
  WHERE merchant_reference = p_merchant_reference
  RETURNING * INTO v_transaction;

  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. RLS Policies
-- =====================================================

-- Payment Gateway Config - Only admins can view/edit
ALTER TABLE payment_gateway_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view gateway config" ON payment_gateway_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Flex_Admin'
    )
  );

CREATE POLICY "Admin can update gateway config" ON payment_gateway_config
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Flex_Admin'
    )
  );

-- Payment Gateway Transactions - Counter agents and admins can view
ALTER TABLE payment_gateway_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Counter Agents can view transactions" ON payment_gateway_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Flex_Admin', 'Counter_Agent', 'Finance_Manager')
    )
  );

CREATE POLICY "Counter Agents and Admins can insert transactions" ON payment_gateway_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('Flex_Admin', 'Counter_Agent')
    )
  );

CREATE POLICY "System can update transactions" ON payment_gateway_transactions
  FOR UPDATE USING (true); -- Allow updates from webhook callbacks

-- Payment Gateway Webhooks - Admin only
ALTER TABLE payment_gateway_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view webhooks" ON payment_gateway_webhooks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Flex_Admin'
    )
  );

CREATE POLICY "System can insert webhooks" ON payment_gateway_webhooks
  FOR INSERT WITH CHECK (true); -- Allow webhooks from external sources

-- =====================================================
-- 8. Updated_at Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gateway_config_updated_at
  BEFORE UPDATE ON payment_gateway_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gateway_transactions_updated_at
  BEFORE UPDATE ON payment_gateway_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. Add Gateway Payment to Payment Modes
-- =====================================================
INSERT INTO payment_modes (name, collect_card_details, active)
VALUES
  ('KINA BANK IPG', false, false), -- Not active until configured
  ('BSP IPG', false, false) -- Placeholder for future BSP integration
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE payment_modes IS 'Payment methods including traditional modes and online payment gateways';
