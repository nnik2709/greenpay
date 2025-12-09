#!/bin/bash

# Deploy Payment Gateway System to Production Server
# Deploys the new payment gateway abstraction layer

SERVER="root@72.61.208.79"
REMOTE_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo "🚀 Deploying Payment Gateway System"
echo "=========================================="
echo ""

# Step 1: Upload payment gateway files
echo "1️⃣ Uploading payment gateway files..."
rsync -avz --progress \
  backend/services/payment-gateways/ \
  $SERVER:$REMOTE_DIR/services/payment-gateways/

if [ $? -ne 0 ]; then
    echo "❌ Failed to upload payment gateway files"
    exit 1
fi
echo "✅ Payment gateway files uploaded"
echo ""

# Step 2: Upload updated routes
echo "2️⃣ Uploading updated routes..."
rsync -avz --progress \
  backend/routes/public-purchases.js \
  $SERVER:$REMOTE_DIR/routes/

if [ $? -ne 0 ]; then
    echo "❌ Failed to upload routes"
    exit 1
fi
echo "✅ Routes uploaded"
echo ""

# Step 3: Install Stripe dependency
echo "3️⃣ Installing Stripe package..."
ssh $SERVER "cd $REMOTE_DIR && npm install stripe@latest"
if [ $? -ne 0 ]; then
    echo "❌ Failed to install Stripe"
    exit 1
fi
echo "✅ Stripe installed"
echo ""

# Step 4: Check .env configuration
echo "4️⃣ Checking .env configuration..."
echo ""
echo "⚠️  MANUAL CONFIGURATION REQUIRED:"
echo ""
echo "Please add these lines to your backend .env file:"
echo ""
echo "  # Payment Gateway"
echo "  PAYMENT_GATEWAY=stripe"
echo ""
echo "  # Stripe Keys (get from https://dashboard.stripe.com/test/apikeys)"
echo "  STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE"
echo "  STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_SECRET_HERE"
echo ""
echo "To edit .env on server:"
echo "  ssh $SERVER"
echo "  nano $REMOTE_DIR/.env"
echo ""
read -p "Press Enter when .env is configured..."

# Step 5: Restart PM2
echo ""
echo "5️⃣ Restarting backend with PM2..."
ssh $SERVER "pm2 restart greenpay-api"
if [ $? -ne 0 ]; then
    echo "❌ Failed to restart backend"
    exit 1
fi
echo "✅ Backend restarted"
echo ""

# Step 6: Check status
echo "6️⃣ Checking backend status..."
ssh $SERVER "pm2 status greenpay-api"
echo ""

# Step 7: Show logs
echo "7️⃣ Checking recent logs..."
ssh $SERVER "pm2 logs greenpay-api --lines 20 --nostream"
echo ""

echo "=========================================="
echo "✅ Payment Gateway Deployment Complete!"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Test API endpoint:"
echo "   curl -X POST https://greenpay.eywademo.cloud/api/public-purchases/create-payment-session \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{"
echo "       \"customerEmail\": \"test@example.com\","
echo "       \"customerPhone\": \"+67512345678\","
echo "       \"quantity\": 1,"
echo "       \"amount\": 50,"
echo "       \"currency\": \"PGK\","
echo "       \"returnUrl\": \"https://greenpay.eywademo.cloud/purchase/callback\","
echo "       \"cancelUrl\": \"https://greenpay.eywademo.cloud/buy-voucher\""
echo "     }'"
echo ""
echo "2. Set up Stripe webhook in dashboard:"
echo "   URL: https://greenpay.eywademo.cloud/api/public-purchases/webhook?gateway=stripe"
echo "   Events: checkout.session.completed, checkout.session.expired"
echo ""
echo "3. Test with test card: 4242 4242 4242 4242"
echo ""
echo "4. Monitor logs: ssh $SERVER 'pm2 logs greenpay-api'"
echo ""
echo "📚 Documentation:"
echo "   - Quick Start: STRIPE_POC_QUICK_START.md"
echo "   - Local Testing: LOCAL_TESTING_SETUP.md"
echo "   - Full Guide: PAYMENT_GATEWAY_IMPLEMENTATION_SUMMARY.md"
echo ""
