-- Migration: Create invoices table for PNG GST-compliant tax invoices
-- Invoices are generated from approved quotations

CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  quotation_id INTEGER REFERENCES quotations(id),

  -- Customer Information (required for PNG Tax Invoice)
  customer_name VARCHAR(255) NOT NULL,
  customer_address TEXT NOT NULL,
  customer_tin VARCHAR(50),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),

  -- Invoice Details
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',

  -- Line Items (stored as JSON for flexibility)
  -- Format: [{ description, quantity, unitPrice, gstApplicable }]
  items JSONB NOT NULL,

  -- Financial Details (PNG GST Compliance)
  subtotal DECIMAL(10,2) NOT NULL,
  gst_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  gst_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0.00,
  amount_due DECIMAL(10,2),

  -- Additional Information
  notes TEXT,
  payment_terms TEXT DEFAULT 'Net 30 days',

  -- Voucher Generation (Green Pass)
  vouchers_generated BOOLEAN DEFAULT FALSE,
  voucher_batch_id VARCHAR(100),

  -- Audit Fields
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT status_check CHECK (status IN ('pending', 'partial', 'paid', 'cancelled', 'overdue'))
);

-- Indexes for performance
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_quotation ON invoices(quotation_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_customer ON invoices(customer_name);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- Comments for documentation
COMMENT ON TABLE invoices IS 'PNG GST-compliant tax invoices generated from approved quotations';
COMMENT ON COLUMN invoices.invoice_number IS 'Format: INV-YYYYMM-XXXX (e.g., INV-202511-0001)';
COMMENT ON COLUMN invoices.customer_tin IS 'Customer Tax Identification Number from PNG IRC';
COMMENT ON COLUMN invoices.gst_rate IS 'PNG GST rate (currently 10%)';
COMMENT ON COLUMN invoices.gst_amount IS 'GST amount = subtotal * gst_rate';
COMMENT ON COLUMN invoices.amount_due IS 'Calculated as total_amount - amount_paid';
COMMENT ON COLUMN invoices.vouchers_generated IS 'Whether vouchers/green passes have been generated after full payment';
COMMENT ON COLUMN invoices.voucher_batch_id IS 'Reference to corporate_vouchers batch_id if generated';

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_invoices_updated_at();
