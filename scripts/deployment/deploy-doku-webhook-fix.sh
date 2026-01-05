#!/bin/bash

# Deploy BSP DOKU Webhook Fix
# The webhook route is returning 404 - need to deploy payment-webhook-doku.js

echo "=========================================="
echo "BSP DOKU Webhook Deployment Fix"
echo "=========================================="
echo ""
echo "Issue: Webhook route returns 404 error"
echo "DOKU is sending webhooks but getting 404 responses"
echo ""
echo "Files to deploy:"
echo "  - backend/routes/payment-webhook-doku.js"
echo "  - backend/server.js (already has route configured)"
echo ""
echo "=========================================="
echo ""

SERVER="root@165.22.52.100"
BACKEND_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

# Check if files exist locally
if [ ! -f "backend/routes/payment-webhook-doku.js" ]; then
    echo "❌ ERROR: backend/routes/payment-webhook-doku.js not found locally"
    exit 1
fi

if [ ! -f "backend/server.js" ]; then
    echo "❌ ERROR: backend/server.js not found locally"
    exit 1
fi

echo "Step 1: Upload webhook route file"
echo "=========================================="
echo ""
echo "Please upload via CloudPanel File Manager:"
echo ""
echo "Source: backend/routes/payment-webhook-doku.js"
echo "Destination: $BACKEND_DIR/routes/payment-webhook-doku.js"
echo ""
echo "Press Enter when file is uploaded..."
read

echo ""
echo "Step 2: Verify file exists on server"
echo "=========================================="
echo ""
echo "Run this command on server:"
echo ""
echo "ssh $SERVER \"ls -lh $BACKEND_DIR/routes/payment-webhook-doku.js\""
echo ""
echo "Press Enter when verified..."
read

echo ""
echo "Step 3: Restart backend service"
echo "=========================================="
echo ""
echo "Run this command on server:"
echo ""
echo "ssh $SERVER \"pm2 restart greenpay-api\""
echo ""
echo "Press Enter when restarted..."
read

echo ""
echo "Step 4: Test webhook endpoint"
echo "=========================================="
echo ""
echo "Testing webhook endpoint..."
echo ""

# Test the endpoint
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify)

if [ "$RESPONSE" = "405" ] || [ "$RESPONSE" = "400" ]; then
    echo "✅ SUCCESS: Webhook endpoint responding (HTTP $RESPONSE)"
    echo "   (405 = Method Not Allowed or 400 = Bad Request is expected for GET)"
    echo "   The route exists and is working!"
elif [ "$RESPONSE" = "404" ]; then
    echo "❌ ERROR: Still getting 404"
    echo "   The route is not configured correctly"
else
    echo "⚠️  UNKNOWN: Got HTTP $RESPONSE"
fi

echo ""
echo "Step 5: Check logs for webhook activity"
echo "=========================================="
echo ""
echo "Run this command on server:"
echo ""
echo "ssh $SERVER \"pm2 logs greenpay-api --lines 50 --nostream | grep -i 'webhook\\|doku'\""
echo ""

echo ""
echo "=========================================="
echo "Deployment Complete"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Test a payment again with DOKU Visa card"
echo "2. DOKU should now receive webhook responses"
echo "3. Transaction should complete successfully"
echo ""
echo "Monitor in real-time:"
echo "ssh $SERVER \"pm2 logs greenpay-api --lines 0\" | grep -i doku"
echo ""
