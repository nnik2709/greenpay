#!/bin/bash

echo "🚀 Deploying Consistent Voucher Templates"
echo "========================================="

SERVER="root@72.61.208.79"
FRONTEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud"
BACKEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo ""
echo "📦 Uploading frontend (dist folder)..."
scp -r dist/* $SERVER:$FRONTEND_PATH/

echo ""
echo "📦 Uploading backend PDF generator..."
scp backend/utils/pdfGenerator.js $SERVER:$BACKEND_PATH/utils/pdfGenerator.js

echo ""
echo "🔄 Restarting backend server..."
ssh $SERVER "pm2 restart greenpay-api"

echo ""
echo "📊 Checking server status..."
sleep 2
ssh $SERVER "pm2 logs greenpay-api --lines 20 --nostream"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "All voucher templates are now consistent:"
echo "  ✅ Same GREEN CARD layout"
echo "  ✅ CCDA logo added (frontend only - backend has placeholder)"
echo "  ✅ Larger barcode for easier scanning"
echo "  ✅ Passport info shown when registered"
echo "  ✅ Authorized Officer only shown for desk/corporate issuance"
echo ""
echo "Test at: https://greenpay.eywademo.cloud"
