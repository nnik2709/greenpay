-- Migration: Update corporate_vouchers to link with invoices
-- Green Pass = Voucher with QR code (same thing)

ALTER TABLE corporate_vouchers
ADD COLUMN IF NOT EXISTS invoice_id INTEGER REFERENCES invoices(id),
ADD COLUMN IF NOT EXISTS is_green_pass BOOLEAN DEFAULT TRUE;

-- Add comments
COMMENT ON COLUMN corporate_vouchers.invoice_id IS 'Reference to invoice if generated from paid invoice';
COMMENT ON COLUMN corporate_vouchers.is_green_pass IS 'Green Pass flag (voucher with QR code for exit authorization)';

-- Create index
CREATE INDEX IF NOT EXISTS idx_corporate_vouchers_invoice ON corporate_vouchers(invoice_id);

-- Also update individual_purchases if needed
ALTER TABLE individual_purchases
ADD COLUMN IF NOT EXISTS invoice_id INTEGER;

COMMENT ON COLUMN individual_purchases.invoice_id IS 'Reference to invoice if applicable';

CREATE INDEX IF NOT EXISTS idx_individual_purchases_invoice ON individual_purchases(invoice_id);
