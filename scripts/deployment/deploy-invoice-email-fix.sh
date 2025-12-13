#!/bin/bash
#
# Deploy Invoice Email Fix
# Uses notificationService.js instead of separate emailService.js
#

set -e

echo "🚀 Deploying Invoice Email Fix..."

SERVER="root@72.61.208.79"
BACKEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo ""
echo "📦 Uploading notificationService.js (with sendInvoiceEmail)..."
scp backend/services/notificationService.js ${SERVER}:${BACKEND_PATH}/services/

echo ""
echo "📦 Uploading invoices-gst.js (updated import)..."
scp backend/routes/invoices-gst.js ${SERVER}:${BACKEND_PATH}/routes/

echo ""
echo "🔄 Restarting backend API..."
ssh ${SERVER} "pm2 restart greenpay-api"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Test the fix:"
echo "  1. Go to https://greenpay.eywademo.cloud/invoices"
echo "  2. Click 'Email Invoice' on any invoice"
echo "  3. Enter email address"
echo "  4. Click 'Send Email'"
echo ""
echo "Expected: Email sent successfully (using existing SMTP configuration)"
echo ""
