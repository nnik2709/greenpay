-- Migration: Link quotations to customers table
-- This enables proper customer management for PNG Tax Invoices

-- Add customer_id foreign key to quotations table
ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id ON quotations(customer_id);

-- Add comment
COMMENT ON COLUMN quotations.customer_id IS 'Link to customers table for PNG Tax Invoice compliance';

-- For existing quotations without customer_id, we'll keep the embedded customer data
-- New quotations should reference the customers table
