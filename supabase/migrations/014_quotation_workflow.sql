-- Migration: Quotation Workflow Enhancement
-- Date: October 11, 2025
-- Purpose: Add workflow fields for quotation lifecycle tracking

-- Add workflow tracking fields to quotations
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS amount_after_discount DECIMAL(10,2);

-- Update status check constraint to include all workflow states
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_status_check;
ALTER TABLE quotations ADD CONSTRAINT quotations_status_check 
  CHECK (status IN ('draft', 'sent', 'pending', 'approved', 'rejected', 'converted', 'expired'));

-- Add quotation link to corporate_vouchers
ALTER TABLE corporate_vouchers ADD COLUMN IF NOT EXISTS quotation_id UUID REFERENCES quotations(id);
ALTER TABLE corporate_vouchers ADD COLUMN IF NOT EXISTS batch_id TEXT;

-- Create index for quotation lookup
CREATE INDEX IF NOT EXISTS idx_corporate_vouchers_quotation ON corporate_vouchers(quotation_id) WHERE quotation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_corporate_vouchers_batch ON corporate_vouchers(batch_id) WHERE batch_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN quotations.approved_by IS 'User who approved the quotation';
COMMENT ON COLUMN quotations.approved_at IS 'Timestamp when quotation was approved';
COMMENT ON COLUMN quotations.sent_at IS 'Timestamp when quotation was sent to client';
COMMENT ON COLUMN quotations.converted_at IS 'Timestamp when quotation was converted to voucher batch';
COMMENT ON COLUMN quotations.discount_percentage IS 'Discount percentage applied';
COMMENT ON COLUMN quotations.discount_amount IS 'Calculated discount amount';
COMMENT ON COLUMN quotations.amount_after_discount IS 'Total amount after discount';

COMMENT ON COLUMN corporate_vouchers.quotation_id IS 'Link to quotation if created from quotation conversion';
COMMENT ON COLUMN corporate_vouchers.batch_id IS 'Batch identifier for grouping vouchers';

-- Create view for quotation statistics
CREATE OR REPLACE VIEW quotation_statistics AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
  COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'converted') as converted_count,
  COUNT(*) FILTER (WHERE status = 'expired') as expired_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  COUNT(*) as total_count,
  SUM(amount_after_discount) FILTER (WHERE status = 'converted') as converted_value,
  SUM(amount_after_discount) as total_value,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'converted')::DECIMAL / 
     NULLIF(COUNT(*) FILTER (WHERE status IN ('sent', 'approved', 'converted')), 0) * 100), 
    2
  ) as conversion_rate
FROM quotations;

-- Grant access to view
GRANT SELECT ON quotation_statistics TO authenticated;


