#!/bin/bash

# Deploy transactions backend route to production server
# Run this script to upload backend changes

SERVER="root@72.61.208.79"
BACKEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo "🚀 Deploying transactions backend to production..."
echo ""

# Upload new transactions route
echo "📤 Uploading transactions.js..."
scp backend/routes/transactions.js $SERVER:$BACKEND_PATH/routes/

# Upload updated server.js
echo "📤 Uploading server.js..."
scp backend/server.js $SERVER:$BACKEND_PATH/

echo ""
echo "✅ Files uploaded. Now restarting PM2..."
echo ""

# Restart PM2
ssh $SERVER << 'EOF'
  cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
  pm2 restart greenpay-api
  echo ""
  echo "📊 PM2 Status:"
  pm2 status greenpay-api
  echo ""
  echo "📝 Recent logs:"
  pm2 logs greenpay-api --lines 10 --nostream
EOF

echo ""
echo "✅ Deployment complete!"
echo "🔍 Test the endpoint:"
echo "   curl https://greenpay.eywademo.cloud/api/health"
echo ""
