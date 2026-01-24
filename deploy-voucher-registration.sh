#!/bin/bash
# Deploy voucher registration endpoint to production

echo "🚀 Deploying voucher registration endpoint..."

# Backend file to deploy
BACKEND_FILE="backend/routes/buy-online.js"

# Check if file exists
if [ ! -f "$BACKEND_FILE" ]; then
    echo "❌ Error: $BACKEND_FILE not found"
    exit 1
fi

echo "📦 Files to deploy:"
echo "  - $BACKEND_FILE"

echo ""
echo "📋 Deployment Instructions:"
echo ""
echo "1. Upload via CloudPanel File Manager:"
echo "   Navigate to: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/"
echo "   Upload: buy-online.js (overwrite existing)"
echo ""
echo "2. Verify file uploaded:"
echo "   ssh root@165.22.52.100"
echo "   ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js"
echo ""
echo "3. Restart backend:"
echo "   pm2 restart greenpay-api"
echo ""
echo "4. Check logs:"
echo "   pm2 logs greenpay-api --lines 50"
echo ""
echo "5. Test the endpoint:"
echo "   curl -X POST https://greenpay.eywademo.cloud/api/buy-online/voucher/TEST-CODE/register \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"passportNumber\":\"P1234567\",\"surname\":\"SMITH\",\"givenName\":\"John\",\"nationality\":\"Australian\",\"expiryDate\":\"2028-12-31\"}'"
echo ""
echo "✅ Endpoint: POST /api/buy-online/voucher/:code/register"
echo "✅ Function: Register passport to existing voucher"
echo ""
