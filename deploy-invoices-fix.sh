#!/bin/bash

echo "=================================="
echo "Deploying Invoice Fix to Production"
echo "=================================="
echo ""

SERVER="root@72.61.208.79"
BACKEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo "Step 1: Creating config directory on server..."
ssh $SERVER "mkdir -p $BACKEND_PATH/config"

echo ""
echo "Step 2: Uploading database.js to config folder..."
scp backend/config/database.js $SERVER:$BACKEND_PATH/config/

echo ""
echo "Step 3: Uploading fixed invoices.js..."
scp backend/routes/invoices.js $SERVER:$BACKEND_PATH/routes/

echo ""
echo "Step 4: Uploading fixed vouchers.js..."
scp backend/routes/vouchers.js $SERVER:$BACKEND_PATH/routes/

echo ""
echo "Step 5: Restarting PM2..."
ssh $SERVER "pm2 restart greenpay-api"

echo ""
echo "Step 6: Checking backend status..."
sleep 3
ssh $SERVER "pm2 logs greenpay-api --lines 20 --nostream"

echo ""
echo "=================================="
echo "✅ Deployment Complete!"
echo "=================================="
echo ""
echo "Test the backend:"
echo "curl https://greenpay.eywademo.cloud/api/auth/login"
