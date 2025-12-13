#!/bin/bash
#
# Deploy Error Toast Fix
# Fixes: Error responses now properly attach response.data so toast messages display correctly
#

set -e

echo "🚀 Deploying Error Toast Fix..."

SERVER="root@72.61.208.79"
FRONTEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud"

echo ""
echo "📦 Uploading frontend dist files..."
rsync -avz --delete dist/ ${SERVER}:${FRONTEND_PATH}/dist/

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Test the fix:"
echo "  1. Go to https://greenpay.eywademo.cloud/invoices"
echo "  2. Find a paid invoice that already has vouchers generated"
echo "  3. Click 'Generate Vouchers' button"
echo "  4. You should now see a clear toast notification with:"
echo "     - Title: 'Vouchers have already been generated for this invoice'"
echo "     - Description: 'Found X existing vouchers. Please check the Vouchers List page.'"
echo ""
echo "Expected: Toast notification displays visually (not just in console)"
echo ""
