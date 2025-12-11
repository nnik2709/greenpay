#!/bin/bash

# Deploy Buy Online with Camera Scanner Fix

SERVER="root@72.61.208.79"
REMOTE_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud"

echo "🚀 Deploying Buy Online Camera Scanner Fix"
echo "=========================================="

# Check if sshpass is available
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass not found. Using regular SSH (you'll be prompted for password)"
    SSH_CMD="ssh"
    RSYNC_CMD="rsync"
else
    if [ -z "$SSH_PASSWORD" ]; then
        echo "⚠️  SSH_PASSWORD not set. You'll be prompted for password."
        SSH_CMD="ssh"
        RSYNC_CMD="rsync"
    else
        SSH_CMD="sshpass -p ${SSH_PASSWORD} ssh -o StrictHostKeyChecking=no"
        RSYNC_CMD="sshpass -p ${SSH_PASSWORD} rsync"
    fi
fi

# 1. Build frontend
echo "1️⃣ Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ Build complete"
echo ""

# 2. Deploy frontend dist
echo "2️⃣ Deploying frontend..."
$RSYNC_CMD -avz --progress dist/ $SERVER:$REMOTE_DIR/dist/
if [ $? -ne 0 ]; then
    echo "❌ Frontend deployment failed"
    exit 1
fi
echo "✅ Frontend deployed"
echo ""

# 3. Check if buy-online.js exists on server
echo "3️⃣ Checking buy-online.js on server..."
$SSH_CMD $SERVER "ls -la $REMOTE_DIR/backend/routes/buy-online.js 2>&1"
echo ""

# 4. Deploy backend route (just to be sure)
echo "4️⃣ Uploading buy-online.js route..."
$RSYNC_CMD -avz --progress backend/routes/buy-online.js $SERVER:$REMOTE_DIR/backend/routes/
if [ $? -ne 0 ]; then
    echo "❌ Route upload failed"
    exit 1
fi
echo "✅ Route uploaded"
echo ""

# 5. Install stripe if needed
echo "5️⃣ Checking/Installing stripe package..."
$SSH_CMD $SERVER "cd $REMOTE_DIR/backend && npm list stripe || npm install stripe@latest"
echo ""

# 6. Restart backend
echo "6️⃣ Restarting backend..."
$SSH_CMD $SERVER "pm2 restart greenpay-api"
if [ $? -ne 0 ]; then
    echo "❌ Restart failed"
    exit 1
fi
echo "✅ Backend restarted"
echo ""

echo "=========================================="
echo "✅ Deployment Complete!"
echo ""
echo "📱 Camera scanner improvements:"
echo "  - Clean given names (no OCR garbage)"
echo "  - Proper nationality conversion (BGR → Bulgaria)"
echo "  - Space-separated given names"
echo ""
echo "🧪 Test at: https://greenpay.eywademo.cloud/buy-online"
echo ""
