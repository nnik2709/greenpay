#!/bin/bash

# Deploy Buy Online Phase 3 - Enhanced Flow
# Removes email requirement and adds verification

set -e

echo "🚀 Deploying Buy Online Phase 3..."

# Configuration
SERVER="root@72.61.208.79"
BACKEND_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"
FRONTEND_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud"

echo ""
echo "📦 Step 1: Deploy backend (buy-online.js)"
scp backend/routes/buy-online.js $SERVER:$BACKEND_DIR/routes/

echo ""
echo "📦 Step 2: Deploy frontend (dist)"
rsync -avz --delete dist/ $SERVER:$FRONTEND_DIR/dist/

echo ""
echo "🔄 Step 3: Restart PM2 services"
ssh $SERVER << 'EOF'
  cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
  pm2 restart greenpay-backend

  cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
  pm2 restart greenpay-frontend

  echo ""
  echo "📊 PM2 Status:"
  pm2 status

  echo ""
  echo "📋 Recent backend logs:"
  pm2 logs greenpay-backend --lines 20 --nostream
EOF

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Changes deployed:"
echo "  ✓ Removed email/phone requirement from buy-online"
echo "  ✓ Added human verification (math + honeypot + time)"
echo "  ✓ Voucher shows immediately after payment"
echo "  ✓ Email dialog on success page (optional)"
echo "  ✓ Fixed all database schema issues"
echo ""
echo "🧪 Test at: https://greenpay.eywademo.cloud/buy-online"
echo ""
