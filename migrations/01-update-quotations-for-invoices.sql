-- Migration: Update quotations table for invoice system
-- Adds PNG GST compliance fields and invoice linking

ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS customer_tin VARCHAR(50),
ADD COLUMN IF NOT EXISTS customer_address TEXT,
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'Net 30 days',
ADD COLUMN IF NOT EXISTS converted_to_invoice BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS invoice_id INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN quotations.customer_tin IS 'Customer Tax Identification Number (PNG IRC)';
COMMENT ON COLUMN quotations.customer_address IS 'Customer full address for invoice';
COMMENT ON COLUMN quotations.subtotal IS 'Amount before GST (total_amount - gst_amount)';
COMMENT ON COLUMN quotations.gst_amount IS 'GST amount calculated at gst_rate (default 10%)';
COMMENT ON COLUMN quotations.gst_rate IS 'GST percentage rate (PNG standard is 10%)';
COMMENT ON COLUMN quotations.payment_terms IS 'Payment terms (e.g., Net 30 days, Due on receipt)';
COMMENT ON COLUMN quotations.converted_to_invoice IS 'Whether this quotation has been converted to invoice';
COMMENT ON COLUMN quotations.invoice_id IS 'Reference to invoice if converted';

-- Update existing records to calculate GST from total_amount
UPDATE quotations
SET
  subtotal = ROUND(total_amount / 1.10, 2),
  gst_amount = ROUND(total_amount - (total_amount / 1.10), 2),
  gst_rate = 10.00
WHERE subtotal IS NULL AND total_amount IS NOT NULL;

-- Create index for invoice lookups
CREATE INDEX IF NOT EXISTS idx_quotations_invoice ON quotations(invoice_id);
CREATE INDEX IF NOT EXISTS idx_quotations_converted ON quotations(converted_to_invoice);
