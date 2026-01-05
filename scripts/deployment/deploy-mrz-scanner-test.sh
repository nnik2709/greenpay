#!/bin/bash

# Deploy MRZ Scanner Test Page to Production
# This script deploys ONLY the new MRZ scanner test functionality
# WITHOUT affecting the existing /buy-online implementation

set -e  # Exit on any error

echo "================================================"
echo "🚀 Deploying MRZ Scanner Test Page to Production"
echo "================================================"
echo ""

# Production server details
PROD_SERVER="root@165.22.52.100"
PROD_PATH="/var/www/greenpay"

echo "📋 Deployment Plan:"
echo "  - Build production bundle with new MRZ scanner test page"
echo "  - Backup current production dist folder"
echo "  - Upload new dist folder to server"
echo "  - Restart PM2 process"
echo "  - Test page will be available at: https://greenpay.eywademo.cloud/app/mrz-scanner-test"
echo "  - Existing /buy-online will remain UNCHANGED"
echo ""

read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "Step 1: Building production bundle..."
echo "========================================"
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Error: dist folder not created"
    exit 1
fi

echo "✅ Build completed successfully"
echo ""

echo "Step 2: Creating backup on production server..."
echo "================================================"
BACKUP_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ssh $PROD_SERVER "cd $PROD_PATH && cp -r dist dist.backup-mrz-$BACKUP_TIMESTAMP"
echo "✅ Backup created: dist.backup-mrz-$BACKUP_TIMESTAMP"
echo ""

echo "Step 3: Uploading new dist folder..."
echo "====================================="
echo "Removing old dist on server..."
ssh $PROD_SERVER "rm -rf $PROD_PATH/dist/*"

echo "Uploading new build..."
scp -r dist/* $PROD_SERVER:$PROD_PATH/dist/

echo "✅ Upload completed"
echo ""

echo "Step 4: Restarting PM2 process..."
echo "=================================="
ssh $PROD_SERVER "pm2 restart greenpay-api"
echo "✅ PM2 restarted"
echo ""

echo "Step 5: Verifying deployment..."
echo "================================"
echo "Checking PM2 status..."
ssh $PROD_SERVER "pm2 list | grep greenpay"
echo ""

echo "================================================"
echo "✅ Deployment Complete!"
echo "================================================"
echo ""
echo "📍 Access URLs:"
echo "  - MRZ Scanner Test: https://greenpay.eywademo.cloud/app/mrz-scanner-test"
echo "  - Existing Buy Online: https://greenpay.eywademo.cloud/buy-online (unchanged)"
echo ""
echo "🔐 Access Requirements:"
echo "  - Login required (Flex_Admin or IT_Support roles)"
echo ""
echo "🧪 Testing Steps:"
echo "  1. Login to https://greenpay.eywademo.cloud"
echo "  2. Navigate to /app/mrz-scanner-test"
echo "  3. Click 'Initialize Dynamsoft SDK'"
echo "  4. Click 'Scan from Camera'"
echo "  5. Scan a passport - all fields should populate correctly"
echo ""
echo "🔄 Rollback (if needed):"
echo "  ssh $PROD_SERVER \"cd $PROD_PATH && rm -rf dist && cp -r dist.backup-mrz-$BACKUP_TIMESTAMP dist && pm2 restart greenpay-api\""
echo ""
echo "✨ Deployment successful!"
