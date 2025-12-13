#!/bin/bash

echo "🚀 Deploying Corporate Voucher Registration Fixes"
echo "=================================================="

SERVER="root@72.61.208.79"
REMOTE_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo ""
echo "📦 Uploading fixed files..."

# Upload database.js
scp backend/config/database.js $SERVER:$REMOTE_PATH/config/database.js

# Upload server.js
scp backend/server.js $SERVER:$REMOTE_PATH/server.js

# Upload corporate-voucher-registration.js
scp backend/routes/corporate-voucher-registration.js $SERVER:$REMOTE_PATH/routes/corporate-voucher-registration.js

echo ""
echo "🔄 Restarting backend server..."
ssh $SERVER "pm2 restart greenpay-api"

echo ""
echo "📊 Checking server status..."
sleep 2
ssh $SERVER "pm2 logs greenpay-api --lines 20 --nostream"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Test the registration at: https://greenpay.eywademo.cloud/corporate-voucher-registration"
