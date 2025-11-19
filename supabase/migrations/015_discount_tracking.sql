-- Migration: Add Discount and Change Tracking to Payments
-- Date: October 11, 2025
-- Purpose: Track discounts, collected amounts, and returned change in payment transactions

-- Add discount tracking fields to individual_purchases
ALTER TABLE individual_purchases 
ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_after_discount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS collected_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS returned_amount DECIMAL(10, 2) DEFAULT 0;

-- Add comments
COMMENT ON COLUMN individual_purchases.discount IS 'Discount amount applied to this purchase';
COMMENT ON COLUMN individual_purchases.amount_after_discount IS 'Total amount after discount';
COMMENT ON COLUMN individual_purchases.collected_amount IS 'Amount collected from customer';
COMMENT ON COLUMN individual_purchases.returned_amount IS 'Change returned to customer';

-- Add discount tracking fields to corporate_vouchers
ALTER TABLE corporate_vouchers
ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS amount_after_discount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS collected_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS returned_amount DECIMAL(10, 2) DEFAULT 0;

-- Add comments
COMMENT ON COLUMN corporate_vouchers.discount IS 'Discount amount applied to this corporate batch';
COMMENT ON COLUMN corporate_vouchers.amount_after_discount IS 'Total amount after discount';
COMMENT ON COLUMN corporate_vouchers.collected_amount IS 'Amount collected from company';
COMMENT ON COLUMN corporate_vouchers.returned_amount IS 'Change returned';

-- Create function to calculate amount after discount
CREATE OR REPLACE FUNCTION calculate_amount_after_discount()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate amount_after_discount if not explicitly set
  IF NEW.amount_after_discount IS NULL THEN
    NEW.amount_after_discount := COALESCE(NEW.amount, 0) - COALESCE(NEW.discount, 0);
  END IF;
  
  -- Set default for collected_amount if not set
  IF NEW.collected_amount IS NULL THEN
    NEW.collected_amount := NEW.amount_after_discount;
  END IF;
  
  -- Calculate returned_amount if collected_amount is greater than amount_after_discount
  IF NEW.collected_amount > NEW.amount_after_discount THEN
    NEW.returned_amount := NEW.collected_amount - NEW.amount_after_discount;
  ELSE
    NEW.returned_amount := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for individual_purchases
DROP TRIGGER IF EXISTS calculate_discount_individual ON individual_purchases;
CREATE TRIGGER calculate_discount_individual
  BEFORE INSERT OR UPDATE ON individual_purchases
  FOR EACH ROW
  EXECUTE FUNCTION calculate_amount_after_discount();

-- Create triggers for corporate_vouchers
DROP TRIGGER IF EXISTS calculate_discount_corporate ON corporate_vouchers;
CREATE TRIGGER calculate_discount_corporate
  BEFORE INSERT OR UPDATE ON corporate_vouchers
  FOR EACH ROW
  EXECUTE FUNCTION calculate_amount_after_discount();

-- Add indexes for discount queries
CREATE INDEX IF NOT EXISTS idx_individual_purchases_discount 
  ON individual_purchases(discount) 
  WHERE discount > 0;

CREATE INDEX IF NOT EXISTS idx_corporate_vouchers_discount 
  ON corporate_vouchers(discount) 
  WHERE discount > 0;

-- Update existing records to set default values
UPDATE individual_purchases 
SET 
  discount = 0,
  amount_after_discount = amount,
  collected_amount = amount,
  returned_amount = 0
WHERE discount IS NULL;

UPDATE corporate_vouchers 
SET 
  discount = 0,
  amount_after_discount = amount,
  collected_amount = amount,
  returned_amount = 0
WHERE discount IS NULL;









