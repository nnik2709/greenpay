#!/bin/bash

# Fix Stripe Webhook Signature Verification
# Uploads fixed server.js and public-purchases.js to production server

echo "🔧 Fixing Stripe Webhook Signature Verification..."
echo ""

SERVER="root@72.61.208.79"
REMOTE_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

# Upload fixed files
echo "📤 Uploading server.js (raw body parser for webhooks)..."
scp backend/server.js $SERVER:$REMOTE_DIR/

echo "📤 Uploading routes/public-purchases.js (webhook handler + session endpoint)..."
scp backend/routes/public-purchases.js $SERVER:$REMOTE_DIR/routes/

# Restart PM2
echo ""
echo "🔄 Restarting PM2 process..."
ssh $SERVER "cd $REMOTE_DIR && pm2 restart greenpay-api"

echo ""
echo "✅ All fixes deployed!"
echo ""
echo "📋 What was fixed:"
echo "   ✓ Webhook now uses raw body for signature verification"
echo "   ✓ Session endpoint returns correct format for frontend"
echo "   ✓ Payment callback page should now show vouchers"
echo ""
echo "🧪 To test the complete flow:"
echo "   1. Visit: http://localhost:3000/buy-voucher"
echo "   2. Fill in email/phone and click 'Proceed to Payment'"
echo "   3. Complete payment with test card: 4242 4242 4242 4242"
echo "   4. You should see your voucher code on the success page"
echo ""
