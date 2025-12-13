#!/bin/bash
#
# Deploy Quotation Email Fix
# Uploads backend routes and frontend files to production server
#

set -e

echo "🚀 Deploying Quotation Email Fix..."

SERVER="root@72.61.208.79"
BACKEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"
FRONTEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud"

echo ""
echo "📦 Part 1: Uploading backend files..."

# Upload quotations route
echo "  → Uploading quotations.js route..."
scp backend/routes/quotations.js ${SERVER}:${BACKEND_PATH}/routes/

# Upload notification service
echo "  → Uploading notificationService.js..."
scp backend/services/notificationService.js ${SERVER}:${BACKEND_PATH}/services/

echo ""
echo "🔄 Restarting backend API..."
ssh ${SERVER} "cd ${BACKEND_PATH} && pm2 restart greenpay-api"

echo ""
echo "📦 Part 2: Building and deploying frontend..."

# Build frontend
echo "  → Building production bundle..."
npm run build

# Upload frontend build
echo "  → Uploading frontend dist folder..."
rsync -avz --delete dist/ ${SERVER}:${FRONTEND_PATH}/dist/

# Restart frontend
echo "  → Restarting frontend service..."
ssh ${SERVER} "pm2 restart png-green-fees"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Test the fix:"
echo "  1. Login to https://greenpay.eywademo.cloud/"
echo "  2. Go to Quotations page"
echo "  3. Click 'Send Quotation' button (top right)"
echo "  4. Enter quotation number: QUO-2025-MIH222ZWP98"
echo "  5. Enter email address: nikolay@eywasystems.com"
echo "  6. Click 'Send' button"
echo "  7. Check that email is sent successfully"
echo ""
echo "📧 Expected: Quotation email delivered with:"
echo "  - Professional HTML template with PNG branding"
echo "  - Quotation details (items, pricing, GST)"
echo "  - 'Purchase Online Now' button"
echo "  - Contact information"
echo ""
echo "✅ Success message: 'Quotation sent successfully!'"
echo ""
