#!/bin/bash

# Deploy View Vouchers Feature Removal
# Date: 2025-12-19

echo "🚀 Deploying View Vouchers feature removal..."

# Production path (where PM2 is actually running from)
PROD_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud"

# Also update the /var/www/greenpay path (for consistency)
VAR_PATH="/var/www/greenpay"

echo ""
echo "📁 Deploying backend file..."
scp backend/routes/vouchers.js root@165.22.52.100:$PROD_PATH/backend/routes/
scp backend/routes/vouchers.js root@165.22.52.100:$VAR_PATH/backend/routes/

echo ""
echo "📁 Deploying frontend build..."
scp -r dist/* root@165.22.52.100:$PROD_PATH/dist/
scp -r dist/* root@165.22.52.100:$VAR_PATH/dist/

echo ""
echo "🔄 Restarting PM2..."
ssh root@165.22.52.100 "pm2 restart greenpay-api"

echo ""
echo "⏳ Waiting 3 seconds for restart..."
sleep 3

echo ""
echo "📋 Checking logs..."
ssh root@165.22.52.100 "pm2 logs greenpay-api --lines 20 --nostream"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Expected result: No more 'column cv.payment_method' or 'column p.email' errors"
