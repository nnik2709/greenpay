-- Add line item fields to quotations table
-- These fields store the itemized quotation details

ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS number_of_vouchers INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10, 2) DEFAULT 50.00,
ADD COLUMN IF NOT EXISTS line_total NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN quotations.number_of_vouchers IS 'Quantity of green pass vouchers';
COMMENT ON COLUMN quotations.unit_price IS 'Price per voucher in PGK';
COMMENT ON COLUMN quotations.line_total IS 'Total before discount (qty × unit_price)';
COMMENT ON COLUMN quotations.discount_percentage IS 'Discount percentage applied';
COMMENT ON COLUMN quotations.discount_amount IS 'Discount amount in PGK';

-- Update existing records to calculate missing values from subtotal
-- Assuming default unit price of PGK 50
UPDATE quotations
SET
  number_of_vouchers = GREATEST(1, ROUND(subtotal / 50.00)::INTEGER),
  unit_price = 50.00,
  line_total = subtotal,
  discount_percentage = 0,
  discount_amount = 0
WHERE number_of_vouchers IS NULL;
