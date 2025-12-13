#!/bin/bash

echo "=================================="
echo "Deploying Fixed Routes to Production"
echo "=================================="
echo ""

SERVER="root@72.61.208.79"
BACKEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo "Step 1: Uploading fixed invoices.js..."
scp backend/routes/invoices.js $SERVER:$BACKEND_PATH/routes/

echo ""
echo "Step 2: Uploading fixed vouchers.js..."
scp backend/routes/vouchers.js $SERVER:$BACKEND_PATH/routes/

echo ""
echo "Step 3: Restarting PM2..."
ssh $SERVER "pm2 restart greenpay-api"

echo ""
echo "Step 4: Waiting for restart..."
sleep 3

echo ""
echo "Step 5: Checking backend status..."
ssh $SERVER "pm2 status greenpay-api"

echo ""
echo "Step 6: Checking logs for errors..."
ssh $SERVER "pm2 logs greenpay-api --lines 30 --nostream"

echo ""
echo "=================================="
echo "✅ Deployment Complete!"
echo "=================================="
echo ""
echo "Test the backend:"
echo "curl https://greenpay.eywademo.cloud/api/auth/login"
