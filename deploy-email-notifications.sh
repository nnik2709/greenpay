#!/bin/bash

# Deploy Email Notification Feature
# Enables real email delivery in sandbox/test mode

echo "📧 Deploying Email Notifications..."
echo ""

SERVER="root@72.61.208.79"
REMOTE_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

# Upload updated notification service
echo "📤 Uploading notificationService.js..."
scp backend/services/notificationService.js $SERVER:$REMOTE_DIR/services/

# Upload test script
echo "📤 Uploading test-email.js..."
scp backend/test-email.js $SERVER:$REMOTE_DIR/

# Install nodemailer
echo ""
echo "📦 Installing nodemailer package..."
ssh $SERVER "cd $REMOTE_DIR && npm install nodemailer"

# Restart backend
echo ""
echo "🔄 Restarting backend..."
ssh $SERVER "cd $REMOTE_DIR && pm2 restart greenpay-api"

echo ""
echo "✅ Email notifications deployed!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1️⃣  Configure Gmail SMTP (see setup-test-email.md):"
echo "    ssh $SERVER"
echo "    cd $REMOTE_DIR"
echo "    nano .env"
echo ""
echo "    Add these lines:"
echo "    SMTP_HOST=smtp.gmail.com"
echo "    SMTP_PORT=587"
echo "    SMTP_SECURE=false"
echo "    SMTP_USER=your.email@gmail.com"
echo "    SMTP_PASS=your-app-password"
echo "    SMTP_FROM=\"PNG Green Fees <your.email@gmail.com>\""
echo "    PUBLIC_URL=http://localhost:3000"
echo ""
echo "2️⃣  Restart after adding config:"
echo "    pm2 restart greenpay-api"
echo ""
echo "3️⃣  Test email delivery:"
echo "    cd $REMOTE_DIR"
echo "    TEST_EMAIL=your.email@gmail.com node test-email.js"
echo ""
echo "4️⃣  Make a test purchase:"
echo "    Visit: http://localhost:3000/buy-voucher"
echo "    Use your email address"
echo "    Check inbox for voucher email!"
echo ""
