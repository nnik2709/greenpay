#!/bin/bash

# Deploy pdfGenerator.js with barcode fix to production
# This script backs up the old file and deploys the fixed version

PROD_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"
LOCAL_FILE="backend/utils/pdfGenerator.js"
BACKUP_SUFFIX="backup-$(date +%Y%m%d-%H%M%S)"

echo "🚀 Deploying pdfGenerator.js with barcode fix to production..."
echo ""

# Step 1: Create backup on production server
echo "📦 Step 1: Creating backup on production server..."
ssh root@165.22.52.100 "cp ${PROD_PATH}/utils/pdfGenerator.js ${PROD_PATH}/utils/pdfGenerator.js.${BACKUP_SUFFIX}"
if [ $? -eq 0 ]; then
  echo "✅ Backup created: pdfGenerator.js.${BACKUP_SUFFIX}"
else
  echo "❌ Backup failed! Aborting deployment."
  exit 1
fi
echo ""

# Step 2: Upload the fixed file
echo "📤 Step 2: Uploading fixed pdfGenerator.js..."
scp ${LOCAL_FILE} root@165.22.52.100:${PROD_PATH}/utils/pdfGenerator.js
if [ $? -eq 0 ]; then
  echo "✅ File uploaded successfully"
else
  echo "❌ Upload failed! Restoring backup..."
  ssh root@165.22.52.100 "cp ${PROD_PATH}/utils/pdfGenerator.js.${BACKUP_SUFFIX} ${PROD_PATH}/utils/pdfGenerator.js"
  exit 1
fi
echo ""

# Step 3: Install bwip-js package (suppress warnings)
echo "📦 Step 3: Installing bwip-js package..."
ssh root@165.22.52.100 "cd ${PROD_PATH} && npm install bwip-js 2>&1 | grep -v 'npm WARN'"
if [ $? -eq 0 ]; then
  echo "✅ bwip-js installed successfully"
else
  echo "❌ npm install failed! Check manually."
  exit 1
fi
echo ""

# Step 4: Restart PM2
echo "🔄 Step 4: Restarting PM2 process..."
ssh root@165.22.52.100 "pm2 restart greenpay-api"
if [ $? -eq 0 ]; then
  echo "✅ PM2 restarted successfully"
else
  echo "❌ PM2 restart failed!"
  exit 1
fi
echo ""

# Step 5: Check PM2 status
echo "✅ Step 5: Checking PM2 status..."
ssh root@165.22.52.100 "pm2 list | grep greenpay-api"
echo ""

# Step 6: Verify the change
echo "🔍 Step 6: Verifying deployment..."
echo "Checking for CommonJS require syntax:"
ssh root@165.22.52.100 "grep 'const bwipjs = require' ${PROD_PATH}/utils/pdfGenerator.js | head -1"
echo ""

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Reset test voucher:"
echo "      ssh root@165.22.52.100 \"PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -c \\\"UPDATE corporate_vouchers SET status = 'pending_passport', passport_number = NULL, passport_id = NULL WHERE voucher_code = 'E0W3TDT1';\\\"\""
echo ""
echo "   2. Run automated test:"
echo "      npx playwright test tests/production/voucher-E0W3TDT1-test.spec.ts --headed --project=chromium"
echo ""
echo "   3. Check email at nnik.area9@gmail.com for PDF with clean barcode"
echo ""
echo "🔄 Rollback command (if needed):"
echo "   ssh root@165.22.52.100 \"cp ${PROD_PATH}/utils/pdfGenerator.js.${BACKUP_SUFFIX} ${PROD_PATH}/utils/pdfGenerator.js && pm2 restart greenpay-api\""
