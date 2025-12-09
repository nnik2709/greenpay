#!/bin/bash
#
# Deploy Invoice toFixed Fix
# Fixes the .toFixed error when converting quotation to invoice
#

set -e

echo "🚀 Deploying Invoice Fix..."

SERVER="root@72.61.208.79"
BACKEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo ""
echo "📦 Uploading invoices-gst.js..."
scp backend/routes/invoices-gst.js ${SERVER}:${BACKEND_PATH}/routes/

echo ""
echo "🔄 Restarting backend API..."
ssh ${SERVER} "pm2 restart greenpay-api"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Test the fix:"
echo "  1. Go to https://greenpay.eywademo.cloud/quotations"
echo "  2. Click 'Convert to Invoice' on any quotation"
echo "  3. Select payment terms"
echo "  4. Click 'Create Invoice'"
echo ""
echo "Expected: Invoice created successfully without .toFixed errors"
echo ""
