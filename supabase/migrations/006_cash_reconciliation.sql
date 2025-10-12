-- Cash Reconciliation Table
-- Stores end-of-day cash reconciliation records for counter agents

CREATE TABLE IF NOT EXISTS cash_reconciliations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reconciliation_date DATE NOT NULL,

  -- Cash breakdown
  opening_float DECIMAL(10,2) DEFAULT 0,
  expected_cash DECIMAL(10,2) NOT NULL,
  actual_cash DECIMAL(10,2) NOT NULL,
  variance DECIMAL(10,2) NOT NULL,
  cash_denominations JSONB DEFAULT '{}'::jsonb,

  -- Other payment methods
  card_transactions DECIMAL(10,2) DEFAULT 0,
  bank_transfers DECIMAL(10,2) DEFAULT 0,
  eftpos_transactions DECIMAL(10,2) DEFAULT 0,
  total_collected DECIMAL(10,2) NOT NULL,

  -- Status and approval
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_agent ON cash_reconciliations(agent_id);
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_date ON cash_reconciliations(reconciliation_date);
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_status ON cash_reconciliations(status);
CREATE INDEX IF NOT EXISTS idx_cash_reconciliations_approved_by ON cash_reconciliations(approved_by);

-- RLS Policies
ALTER TABLE cash_reconciliations ENABLE ROW LEVEL SECURITY;

-- Counter agents can view and create their own reconciliations
CREATE POLICY "counter_agents_own_reconciliations"
  ON cash_reconciliations FOR ALL
  USING (auth.uid() = agent_id);

-- Admins and Finance Managers can view all reconciliations
CREATE POLICY "admins_finance_view_all_reconciliations"
  ON cash_reconciliations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('Flex_Admin', 'Finance_Manager')
    )
  );

-- Admins and Finance Managers can approve/reject reconciliations
CREATE POLICY "admins_finance_approve_reconciliations"
  ON cash_reconciliations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('Flex_Admin', 'Finance_Manager')
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cash_reconciliations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_cash_reconciliations_updated_at
  BEFORE UPDATE ON cash_reconciliations
  FOR EACH ROW
  EXECUTE FUNCTION update_cash_reconciliations_updated_at();

-- Comment on table
COMMENT ON TABLE cash_reconciliations IS 'Stores end-of-day cash reconciliation records for counter agents';
