#!/bin/bash
#
# Deploy Customers Route and Table
# Enables customer selection in quotations
#

set -e

echo "🚀 Deploying Customers Feature..."

SERVER="root@72.61.208.79"
BACKEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo ""
echo "📦 Uploading customers.js route..."
scp backend/routes/customers.js ${SERVER}:${BACKEND_PATH}/routes/

echo ""
echo "📦 Uploading server.js (customers route registration)..."
scp backend/server.js ${SERVER}:${BACKEND_PATH}/

echo ""
echo "📦 Uploading customers table migration..."
scp backend/migrations/create-customers-table.sql ${SERVER}:/tmp/

echo ""
echo "🗄️  Running database migration..."
ssh ${SERVER} "PGPASSWORD='GreenPay2025!Secure#PG' psql -U greenpay_user -d greenpay_db -f /tmp/create-customers-table.sql"

echo ""
echo "🔄 Restarting backend API..."
ssh ${SERVER} "pm2 restart greenpay-api"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Test the fix:"
echo "  1. Go to https://greenpay.eywademo.cloud/create-quotation"
echo "  2. Click on 'Customer' dropdown"
echo "  3. Click 'Add New Customer'"
echo "  4. Fill in customer details and save"
echo "  5. Customer should appear in dropdown"
echo "  6. Select the customer and create quotation"
echo ""
echo "Expected: Customers can be added and selected for quotations"
echo ""
