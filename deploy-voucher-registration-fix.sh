#!/bin/bash
# Fix voucher registration - remove updated_at column reference

echo "🔧 Deploying voucher registration database fix..."

BACKEND_FILE="backend/routes/buy-online.js"

if [ ! -f "$BACKEND_FILE" ]; then
    echo "❌ Error: $BACKEND_FILE not found"
    exit 1
fi

echo "📦 File to deploy: $BACKEND_FILE"
echo ""
echo "📋 Deployment Instructions:"
echo ""
echo "1. Upload via CloudPanel File Manager:"
echo "   Navigate to: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/"
echo "   Upload: buy-online.js (overwrite existing)"
echo ""
echo "2. Restart backend via SSH:"
echo "   pm2 restart greenpay-api"
echo ""
echo "3. Monitor logs:"
echo "   pm2 logs greenpay-api --lines 50"
echo ""
echo "4. Test registration again on mobile device"
echo ""
echo "✅ Fix: Removed 'updated_at = NOW()' from UPDATE query"
echo "✅ Reason: Column doesn't exist in individual_purchases table"
echo ""
