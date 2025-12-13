#!/bin/bash
#
# Deploy Vouchers Generation Fix
# Fixes:
# 1. JSON.parse error when items is already an array
# 2. Removes created_by column (doesn't exist in production DB)
#

set -e

echo "🚀 Deploying Vouchers Generation Fix..."

SERVER="root@72.61.208.79"
BACKEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo ""
echo "📦 Uploading invoices-gst.js (array handling + removed created_by)..."
scp backend/routes/invoices-gst.js ${SERVER}:${BACKEND_PATH}/routes/

echo ""
echo "🔄 Restarting backend API..."
ssh ${SERVER} "pm2 restart greenpay-api"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Test the fix:"
echo "  1. Go to https://greenpay.eywademo.cloud/invoices"
echo "  2. Open a paid invoice (or register a payment to make one fully paid)"
echo "  3. Click 'Generate Vouchers' button"
echo "  4. Verify vouchers are generated successfully"
echo ""
echo "Expected: Vouchers generated without errors"
echo ""
