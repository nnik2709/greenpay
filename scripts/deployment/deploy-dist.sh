#!/bin/bash

# Deploy dist/ folder to VPS
# Usage: ./deploy-dist.sh

echo "🚀 Deploying PNG Green Fees to VPS..."
echo ""

# VPS details
VPS_USER="root"
VPS_HOST="195.200.14.62"
VPS_PATH="/var/www/png-green-fees/dist"

# Build first
echo "📦 Building production bundle..."
npm run build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "📤 Syncing dist/ folder to $VPS_HOST..."
echo "   (You will be prompted for password)"
echo ""

# Deploy using rsync (will prompt for password)
rsync -avz --delete dist/ ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Site is live at: http://eywademo.cloud"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo ""
fi
