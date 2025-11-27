#!/bin/bash

# Deploy Payments Page Feature
# This script deploys the Edit & Refund payment functionality

echo "╔════════════════════════════════════════════════════════╗"
echo "║   Deploying Payments Feature (Edit & Refund)          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Add refund columns to database
echo "Step 1: Adding refund columns to database..."
echo "─────────────────────────────────────────────────────────"
ssh root@72.61.208.79 << 'EOF'
# Connect as postgres superuser to alter table structure
sudo -u postgres psql -d greenpay_db << 'SQL'

-- Add refund columns to individual_purchases table
ALTER TABLE individual_purchases
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS refunded_by VARCHAR(255);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_individual_purchases_status ON individual_purchases(status);
CREATE INDEX IF NOT EXISTS idx_individual_purchases_refunded_at ON individual_purchases(refunded_at);

SQL
EOF

echo "✅ Database columns added"
echo ""

# Step 2: Upload backend files
echo "Step 2: Uploading backend files..."
echo "─────────────────────────────────────────────────────────"
scp backend/routes/individual-purchases.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

echo "✅ Backend files uploaded"
echo ""

# Step 3: Restart PM2
echo "Step 3: Restarting PM2..."
echo "─────────────────────────────────────────────────────────"
ssh root@72.61.208.79 << 'EOF'
pm2 restart greenpay-api
echo ""
echo "PM2 Status:"
pm2 status greenpay-api
echo ""
echo "Recent logs:"
pm2 logs greenpay-api --lines 15 --nostream
EOF

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   ✅ Deployment Complete!                              ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. Build frontend: npm run build"
echo "2. Upload dist/ folder to server"
echo "3. Test at: https://greenpay.eywademo.cloud/payments"
echo ""
