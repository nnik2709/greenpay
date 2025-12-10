#!/bin/bash

# Deploy Buy Online Fixes - PDF Download, Email, and Return Home Button
# This deploys:
# 1. Backend: buy-online.js with fixed PDF download and email endpoints
# 2. Frontend: PaymentSuccess.jsx with "Return to Home" going to / instead of /login

set -e

echo "🚀 Deploying Buy Online Fixes..."

SERVER="root@72.61.208.79"
BACKEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"
FRONTEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/frontend"

# Deploy backend route
echo "📦 Deploying backend route (buy-online.js)..."
scp backend/routes/buy-online.js $SERVER:$BACKEND_PATH/routes/

# Deploy frontend dist
echo "📦 Deploying frontend dist..."
rsync -avz --delete dist/ $SERVER:$FRONTEND_PATH/dist/

# Restart backend
echo "🔄 Restarting backend..."
ssh $SERVER "cd $BACKEND_PATH && pm2 restart greenpay-backend || pm2 start server.js --name greenpay-backend"

echo "✅ Deployment complete!"
echo ""
echo "Changes deployed:"
echo "  ✓ PDF download endpoint working"
echo "  ✓ Email endpoint with PDF attachment and 'voucher ready' template"
echo "  ✓ Return to Home button now goes to public homepage (/)"
