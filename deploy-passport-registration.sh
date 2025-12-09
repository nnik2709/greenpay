#!/bin/bash

# Deploy Passport Registration Update
# Uploads updated public-purchases.js route with passport registration endpoint

SERVER="root@72.61.208.79"
REMOTE_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo "🚀 Deploying Passport Registration Update"
echo "=========================================="
echo ""

# Upload updated public-purchases.js
echo "1️⃣ Uploading updated public-purchases.js route..."
scp backend/routes/public-purchases.js $SERVER:$REMOTE_DIR/routes/
if [ $? -ne 0 ]; then
    echo "❌ Failed to upload file"
    exit 1
fi
echo "✅ File uploaded successfully"
echo ""

# Restart PM2
echo "2️⃣ Restarting backend with PM2..."
ssh $SERVER "pm2 restart greenpay-api"
if [ $? -ne 0 ]; then
    echo "❌ Failed to restart backend"
    exit 1
fi
echo "✅ Backend restarted"
echo ""

# Check status
echo "3️⃣ Checking backend status..."
ssh $SERVER "pm2 status greenpay-api"
echo ""

echo "=========================================="
echo "✅ Deployment complete!"
echo ""
echo "📝 Test the new endpoint:"
echo "   curl -X POST https://greenpay.eywademo.cloud/api/public-purchases/register-passport \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"voucherCode\":\"VCH-XXX\",\"passportNumber\":\"P1234567\"}'"
echo ""
