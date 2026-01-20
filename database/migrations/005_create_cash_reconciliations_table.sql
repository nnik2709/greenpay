-- Migration: Create cash_reconciliations table
-- Date: 2026-01-20
-- Description: Creates table for end-of-day cash reconciliation tracking
-- Run as: postgres user OR greenpay user with table creation privileges

-- Create cash_reconciliations table
CREATE TABLE IF NOT EXISTS cash_reconciliations (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  reconciliation_date DATE NOT NULL,

  -- Cash details
  opening_float NUMERIC(10,2) DEFAULT 0,
  expected_cash NUMERIC(10,2) DEFAULT 0,
  actual_cash NUMERIC(10,2) DEFAULT 0,
  variance NUMERIC(10,2) DEFAULT 0,
  cash_denominations JSONB DEFAULT '{}',

  -- Other payment methods
  card_transactions NUMERIC(10,2) DEFAULT 0,
  bank_transfers NUMERIC(10,2) DEFAULT 0,
  eftpos_transactions NUMERIC(10,2) DEFAULT 0,
  total_collected NUMERIC(10,2) DEFAULT 0,

  -- Notes and status
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Approval tracking
  approved_by INTEGER REFERENCES "User"(id) ON DELETE SET NULL,
  approval_notes TEXT,
  approved_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_agent_id ON cash_reconciliations(agent_id);
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_date ON cash_reconciliations(reconciliation_date);
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_status ON cash_reconciliations(status);
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_created_at ON cash_reconciliations(created_at);

-- Grant permissions to greenpay user
GRANT ALL PRIVILEGES ON TABLE cash_reconciliations TO greenpay;
GRANT ALL PRIVILEGES ON SEQUENCE cash_reconciliations_id_seq TO greenpay;

-- Add comment
COMMENT ON TABLE cash_reconciliations IS 'Stores end-of-day cash reconciliation records for counter agents';

-- Verify table was created
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'cash_reconciliations'
ORDER BY ordinal_position;
