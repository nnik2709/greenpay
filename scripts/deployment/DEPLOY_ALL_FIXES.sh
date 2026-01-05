#!/bin/bash
# Complete Deployment Script for All Fixes
# Date: 2025-12-19

echo "🚀 Deploying all GreenPay fixes..."

# Step 1: Upload fixed backend files
echo ""
echo "1️⃣ Uploading backend files..."
scp backend/routes/settings.js root@165.22.52.100:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
scp backend/routes/settings.js root@165.22.52.100:/var/www/greenpay/backend/routes/

# Step 2: Upload frontend build
echo ""
echo "2️⃣ Uploading frontend dist..."
scp -r dist/* root@165.22.52.100:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/
scp -r dist/* root@165.22.52.100:/var/www/greenpay/dist/

# Step 3: Restart PM2
echo ""
echo "3️⃣ Restarting PM2..."
ssh root@165.22.52.100 "pm2 restart greenpay-api && pm2 flush greenpay-api"

# Step 4: Wait and check logs
echo ""
echo "4️⃣ Waiting 5 seconds..."
sleep 5

echo ""
echo "5️⃣ Checking logs for errors..."
ssh root@165.22.52.100 "pm2 logs greenpay-api --lines 30 --nostream"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Test these URLs:"
echo "- Settings: https://greenpay.eywademo.cloud/app/admin/settings"
echo "- Passport Reports: https://greenpay.eywademo.cloud/app/reports/passports"
echo "- Voucher Registration: https://greenpay.eywademo.cloud/register/1XNDLVY9"
