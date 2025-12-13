#!/bin/bash

# Add refund columns to individual_purchases table
# Run this script on the production server

echo "Adding refund columns to individual_purchases table..."
echo ""

ssh root@72.61.208.79 << 'EOF'
# Connect as postgres superuser to alter table structure
sudo -u postgres psql -d greenpay_db << 'SQL'

-- Add refund columns to individual_purchases table
ALTER TABLE individual_purchases
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS refunded_by VARCHAR(255);

-- Create indexes for refunded payments
CREATE INDEX IF NOT EXISTS idx_individual_purchases_status ON individual_purchases(status);
CREATE INDEX IF NOT EXISTS idx_individual_purchases_refunded_at ON individual_purchases(refunded_at);

-- Add comments
COMMENT ON COLUMN individual_purchases.status IS 'Payment status: active, refunded';
COMMENT ON COLUMN individual_purchases.refund_reason IS 'Reason for refund if status is refunded';
COMMENT ON COLUMN individual_purchases.refunded_at IS 'Timestamp when refund was processed';
COMMENT ON COLUMN individual_purchases.refunded_by IS 'User who processed the refund';

-- Verify columns were added
\d individual_purchases

SQL

echo ""
echo "✅ Refund columns added successfully!"
echo ""

EOF
