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
-- For existing quotations, calculate the number of vouchers based on the subtotal
UPDATE quotations
SET
  unit_price = 50.00,
  number_of_vouchers = GREATEST(1, ROUND(subtotal / 50.00)::INTEGER),
  line_total = GREATEST(1, ROUND(subtotal / 50.00)::INTEGER) * 50.00,
  discount_percentage = CASE
    WHEN ROUND(subtotal / 50.00)::INTEGER * 50.00 > subtotal
    THEN ROUND(((ROUND(subtotal / 50.00)::INTEGER * 50.00 - subtotal) / (ROUND(subtotal / 50.00)::INTEGER * 50.00) * 100)::NUMERIC, 2)
    ELSE 0
  END,
  discount_amount = CASE
    WHEN ROUND(subtotal / 50.00)::INTEGER * 50.00 > subtotal
    THEN ROUND(subtotal / 50.00)::INTEGER * 50.00 - subtotal
    ELSE 0
  END
WHERE number_of_vouchers IS NULL OR number_of_vouchers = 1;
