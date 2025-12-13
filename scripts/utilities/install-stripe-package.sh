#!/bin/bash

# Install Stripe package on production server

SERVER="root@72.61.208.79"
REMOTE_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo "🚀 Installing Stripe package on server"
echo "=========================================="

echo "Installing stripe package..."
sshpass -p "${SSH_PASSWORD}" ssh -o StrictHostKeyChecking=no $SERVER "cd $REMOTE_DIR && npm install stripe@latest"

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Stripe"
    exit 1
fi

echo "✅ Stripe package installed"
echo ""

echo "Restarting backend..."
sshpass -p "${SSH_PASSWORD}" ssh -o StrictHostKeyChecking=no $SERVER "pm2 restart greenpay-api"

if [ $? -ne 0 ]; then
    echo "❌ Failed to restart backend"
    exit 1
fi

echo "✅ Backend restarted"
echo ""
echo "✅ Complete! The Stripe module should now be available."
