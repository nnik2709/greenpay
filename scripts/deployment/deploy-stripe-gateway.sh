#!/bin/bash

# Deploy Stripe Payment Gateway (Abstraction Layer)
# Uploads all new payment gateway files to server

SERVER="root@72.61.208.79"
REMOTE_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo "🚀 Deploying Stripe Payment Gateway System"
echo "=========================================="
echo ""

# Step 1: Create payment-gateways directory on server
echo "1️⃣ Creating payment-gateways directory..."
ssh $SERVER "mkdir -p $REMOTE_DIR/services/payment-gateways"
echo "✅ Directory created"
echo ""

# Step 2: Upload payment gateway files
echo "2️⃣ Uploading payment gateway files..."

scp backend/services/payment-gateways/PaymentGatewayInterface.js \
    $SERVER:$REMOTE_DIR/services/payment-gateways/

scp backend/services/payment-gateways/StripeGateway.js \
    $SERVER:$REMOTE_DIR/services/payment-gateways/

scp backend/services/payment-gateways/BSPGateway.js \
    $SERVER:$REMOTE_DIR/services/payment-gateways/

scp backend/services/payment-gateways/KinaBankGateway.js \
    $SERVER:$REMOTE_DIR/services/payment-gateways/

scp backend/services/payment-gateways/PaymentGatewayFactory.js \
    $SERVER:$REMOTE_DIR/services/payment-gateways/

echo "✅ Payment gateway files uploaded"
echo ""

# Step 3: Upload updated routes
echo "3️⃣ Uploading updated routes..."
scp backend/routes/public-purchases.js $SERVER:$REMOTE_DIR/routes/
echo "✅ Routes uploaded"
echo ""

# Step 4: Install Stripe dependency
echo "4️⃣ Installing Stripe package..."
ssh $SERVER "cd $REMOTE_DIR && npm install stripe@latest"
if [ $? -ne 0 ]; then
    echo "❌ Failed to install Stripe"
    exit 1
fi
echo "✅ Stripe installed"
echo ""

# Step 5: Update .env file
echo "5️⃣ Configuring environment variables..."
echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo "   1. SSH to server: ssh $SERVER"
echo "   2. Edit .env: nano $REMOTE_DIR/.env"
echo "   3. Add these lines:"
echo ""
echo "      # Payment Gateway"
echo "      PAYMENT_GATEWAY=stripe"
echo ""
echo "      # Stripe Keys (get from https://dashboard.stripe.com/test/apikeys)"
echo "      STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE"
echo "      STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_SECRET_HERE"
echo ""
echo "   4. Save and exit (Ctrl+O, Enter, Ctrl+X)"
echo ""
read -p "Press Enter when you've updated .env file..."

# Step 6: Restart PM2
echo "6️⃣ Restarting backend with PM2..."
ssh $SERVER "pm2 restart greenpay-api"
if [ $? -ne 0 ]; then
    echo "❌ Failed to restart backend"
    exit 1
fi
echo "✅ Backend restarted"
echo ""

# Step 7: Check status
echo "7️⃣ Checking backend status..."
ssh $SERVER "pm2 status greenpay-api"
echo ""

# Step 8: Test the endpoint
echo "8️⃣ Testing API endpoint..."
echo ""
echo "Run this command to test:"
echo ""
echo 'curl -X POST https://greenpay.eywademo.cloud/api/public-purchases/create-payment-session \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{'
echo '    "customerEmail": "test@example.com",'
echo '    "customerPhone": "+67512345678",'
echo '    "quantity": 1,'
echo '    "amount": 50,'
echo '    "currency": "USD",'
echo '    "returnUrl": "https://greenpay.eywademo.cloud/purchase/callback",'
echo '    "cancelUrl": "https://greenpay.eywademo.cloud/buy-voucher"'
echo '  }'"'"
echo ""

echo "=========================================="
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Set up Stripe webhook:"
echo "      URL: https://greenpay.eywademo.cloud/api/public-purchases/webhook?gateway=stripe"
echo "      Events: checkout.session.completed, checkout.session.expired"
echo ""
echo "   2. Test with Stripe test card: 4242 4242 4242 4242"
echo ""
echo "   3. Check logs: ssh $SERVER 'pm2 logs greenpay-api'"
echo ""
echo "📚 Documentation:"
echo "   - Quick Start: STRIPE_POC_QUICK_START.md"
echo "   - Full Guide: STRIPE_INTEGRATION_PLAN.md"
echo "   - Summary: PAYMENT_GATEWAY_IMPLEMENTATION_SUMMARY.md"
echo ""
