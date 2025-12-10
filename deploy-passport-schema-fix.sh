#!/bin/bash

# Deploy Passport Schema Fix + Emoji-Free Frontend
# Fixes the database schema mismatch in buy-online.js
# Also deploys the emoji-removed frontend

set -e

echo "🚀 Starting deployment..."

# Configuration
SERVER="root@72.61.208.79"
BACKEND_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"
FRONTEND_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud"

echo ""
echo "📦 Step 1: Deploy fixed backend file (buy-online.js)"
scp backend/routes/buy-online.js $SERVER:$BACKEND_DIR/routes/

echo ""
echo "📦 Step 2: Deploy emoji-free frontend"
rsync -avz --delete dist/ $SERVER:$FRONTEND_DIR/dist/

echo ""
echo "🔄 Step 3: Restart PM2 services"
ssh $SERVER << 'EOF'
  cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
  pm2 restart greenpay-backend
  pm2 save

  cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
  pm2 restart greenpay-frontend
  pm2 save
EOF

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Changes deployed:"
echo "  ✓ Fixed Passport table name (passports → \"Passport\")"
echo "  ✓ Fixed column names:"
echo "    - passport_number → \"passportNo\""
echo "    - given_name → \"givenName\""
echo "    - date_of_birth → dob"
echo "    - created_at → \"createdAt\""
echo "    - updated_at → \"updatedAt\""
echo "    - Added required \"dateOfExpiry\" column"
echo "  ✓ Removed all emojis from Login, BuyOnline, PaymentSuccess, PaymentCancelled"
echo ""
echo "🧪 Next steps:"
echo "  1. Test the payment flow at https://greenpay.eywademo.cloud/buy-online"
echo "  2. Check if voucher is created successfully after payment"
echo "  3. Verify passport appears in admin lists"
echo "  4. Check voucher status changes to 'used' after scanning"
echo ""
