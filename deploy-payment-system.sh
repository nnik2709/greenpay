#!/bin/bash

# Deploy Complete Stripe Payment System
# Includes: webhook fixes, session endpoint, notifications

echo "🚀 Deploying Stripe Payment System to Production..."
echo ""

SERVER="root@72.61.208.79"
REMOTE_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo "📦 Files to deploy:"
echo "  1. server.js (raw body parser for webhooks)"
echo "  2. routes/public-purchases.js (webhook handler + session endpoints + notifications)"
echo "  3. services/notificationService.js (SMS/Email notifications)"
echo ""

# Upload files
echo "📤 Uploading server.js..."
scp backend/server.js $SERVER:$REMOTE_DIR/

echo "📤 Uploading routes/public-purchases.js..."
scp backend/routes/public-purchases.js $SERVER:$REMOTE_DIR/routes/

echo "📤 Uploading notificationService.js..."
ssh $SERVER "mkdir -p $REMOTE_DIR/services"
scp backend/services/notificationService.js $SERVER:$REMOTE_DIR/services/

# Restart PM2
echo ""
echo "🔄 Restarting backend..."
ssh $SERVER "cd $REMOTE_DIR && pm2 restart greenpay-api"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 What was deployed:"
echo "   ✓ Webhook signature verification (raw body parser)"
echo "   ✓ Session lookup by internal ID"
echo "   ✓ Session lookup by Stripe session ID"
echo "   ✓ SMS/Email notification service"
echo "   ✓ Automatic voucher delivery after payment"
echo ""
echo "🧪 To test:"
echo "   1. Visit: http://localhost:3000/buy-voucher"
echo "   2. Complete a test purchase"
echo "   3. Check logs: ssh $SERVER 'pm2 logs greenpay-api --lines 50'"
echo "   4. Verify vouchers appear on callback page"
echo ""
echo "📧 Notification Setup (Production):"
echo "   To enable real SMS/Email delivery, configure in .env:"
echo "   - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (for emails)"
echo "   - DIGICEL_API_KEY or TWILIO_API_KEY (for SMS)"
echo "   - PUBLIC_URL=https://greenpay.eywademo.cloud"
echo ""
