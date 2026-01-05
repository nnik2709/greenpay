-- Cash Reconciliations Table
-- Tracks end-of-day cash reconciliation for counter agents

CREATE TABLE IF NOT EXISTS cash_reconciliations (
  id SERIAL PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reconciliation_date DATE NOT NULL,

  -- Cash details
  opening_float DECIMAL(10, 2) DEFAULT 0,
  expected_cash DECIMAL(10, 2) DEFAULT 0,
  actual_cash DECIMAL(10, 2) DEFAULT 0,
  variance DECIMAL(10, 2) DEFAULT 0,
  cash_denominations JSONB DEFAULT '{}',

  -- Other payment methods
  card_transactions DECIMAL(10, 2) DEFAULT 0,
  bank_transfers DECIMAL(10, 2) DEFAULT 0,
  eftpos_transactions DECIMAL(10, 2) DEFAULT 0,
  total_collected DECIMAL(10, 2) DEFAULT 0,

  -- Status and approval
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  approval_notes TEXT,

  -- Additional information
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_agent ON cash_reconciliations(agent_id);
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_date ON cash_reconciliations(reconciliation_date);
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_status ON cash_reconciliations(status);
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_approved_by ON cash_reconciliations(approved_by);

-- Unique constraint: one reconciliation per agent per date
CREATE UNIQUE INDEX IF NOT EXISTS idx_cash_reconciliations_agent_date
  ON cash_reconciliations(agent_id, reconciliation_date);

-- Add comment
COMMENT ON TABLE cash_reconciliations IS 'End-of-day cash reconciliation records for counter agents';
