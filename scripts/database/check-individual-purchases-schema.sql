-- Check the actual schema of individual_purchases table
\d individual_purchases

-- If the table doesn't exist or has wrong schema, create/recreate it
-- Run this on the production server via CloudPanel SQL editor

-- Drop the old table if needed (CAUTION: This will delete data!)
-- DROP TABLE IF EXISTS individual_purchases CASCADE;

-- Create individual_purchases table with correct schema for PostgreSQL
CREATE TABLE IF NOT EXISTS individual_purchases (
  id SERIAL PRIMARY KEY,
  voucher_code TEXT UNIQUE NOT NULL,
  passport_number TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  card_last_four TEXT,
  discount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  collected_amount DECIMAL(10, 2),
  returned_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  used_at TIMESTAMP,
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  created_by INTEGER REFERENCES "User"(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  refunded BOOLEAN DEFAULT false,
  refund_amount DECIMAL(10, 2),
  refund_reason TEXT,
  refund_method TEXT,
  refund_notes TEXT,
  refunded_at TIMESTAMP
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON individual_purchases TO greenpay_user;
GRANT USAGE, SELECT ON SEQUENCE individual_purchases_id_seq TO greenpay_user;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_individual_purchases_voucher_code ON individual_purchases(voucher_code);
CREATE INDEX IF NOT EXISTS idx_individual_purchases_passport_number ON individual_purchases(passport_number);
CREATE INDEX IF NOT EXISTS idx_individual_purchases_created_at ON individual_purchases(created_at);

-- Show existing data
SELECT COUNT(*) as total_records FROM individual_purchases;
