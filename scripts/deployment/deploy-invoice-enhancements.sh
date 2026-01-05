#!/bin/bash

# Deploy Invoice Enhancements to Production
# This script deploys GST toggle and Generated Vouchers modal features

PROD_BACKEND="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"
PROD_FRONTEND="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud"
LOCAL_BACKEND="backend/routes/invoices-gst.js"
LOCAL_FRONTEND="dist"
BACKUP_SUFFIX="backup-$(date +%Y%m%d-%H%M%S)"

echo "🚀 Deploying Invoice Enhancements to Production..."
echo ""

# Step 1: Backup backend routes file
echo "📦 Step 1: Creating backup of invoices-gst.js..."
ssh root@165.22.52.100 "cp ${PROD_BACKEND}/routes/invoices-gst.js ${PROD_BACKEND}/routes/invoices-gst.js.${BACKUP_SUFFIX}"
if [ $? -eq 0 ]; then
  echo "✅ Backend backup created: invoices-gst.js.${BACKUP_SUFFIX}"
else
  echo "❌ Backend backup failed! Aborting deployment."
  exit 1
fi
echo ""

# Step 2: Backup frontend dist directory
echo "📦 Step 2: Creating backup of frontend dist..."
ssh root@165.22.52.100 "cp -r ${PROD_FRONTEND}/dist ${PROD_FRONTEND}/dist.${BACKUP_SUFFIX}"
if [ $? -eq 0 ]; then
  echo "✅ Frontend backup created: dist.${BACKUP_SUFFIX}"
else
  echo "❌ Frontend backup failed! Aborting deployment."
  exit 1
fi
echo ""

# Step 3: Upload backend routes file
echo "📤 Step 3: Uploading invoices-gst.js..."
scp ${LOCAL_BACKEND} root@165.22.52.100:${PROD_BACKEND}/routes/invoices-gst.js
if [ $? -eq 0 ]; then
  echo "✅ Backend file uploaded successfully"
else
  echo "❌ Backend upload failed! Restoring backup..."
  ssh root@165.22.52.100 "cp ${PROD_BACKEND}/routes/invoices-gst.js.${BACKUP_SUFFIX} ${PROD_BACKEND}/routes/invoices-gst.js"
  exit 1
fi
echo ""

# Step 4: Upload frontend dist folder
echo "📤 Step 4: Uploading frontend assets..."
ssh root@165.22.52.100 "rm -rf ${PROD_FRONTEND}/dist/*"
scp -r ${LOCAL_FRONTEND}/* root@165.22.52.100:${PROD_FRONTEND}/dist/
if [ $? -eq 0 ]; then
  echo "✅ Frontend assets uploaded successfully"
else
  echo "❌ Frontend upload failed! Restoring backup..."
  ssh root@165.22.52.100 "rm -rf ${PROD_FRONTEND}/dist && cp -r ${PROD_FRONTEND}/dist.${BACKUP_SUFFIX} ${PROD_FRONTEND}/dist"
  exit 1
fi
echo ""

# Step 5: Restart PM2
echo "🔄 Step 5: Restarting PM2 process..."
ssh root@165.22.52.100 "pm2 restart greenpay-api"
if [ $? -eq 0 ]; then
  echo "✅ PM2 restarted successfully"
else
  echo "❌ PM2 restart failed!"
  exit 1
fi
echo ""

# Step 6: Check PM2 status
echo "✅ Step 6: Checking PM2 status..."
ssh root@165.22.52.100 "pm2 list | grep greenpay-api"
echo ""

# Step 7: Verify deployment
echo "🔍 Step 7: Verifying deployment..."
echo "Checking backend routes file:"
ssh root@165.22.52.100 "grep 'apply_gst' ${PROD_BACKEND}/routes/invoices-gst.js | head -2"
echo ""

echo "✅ Deployment complete!"
echo ""
echo "📋 Testing checklist:"
echo "   1. Login to https://greenpay.eywademo.cloud"
echo "   2. Navigate to Quotations page"
echo "   3. Select a quotation and click 'Convert to Invoice'"
echo "   4. Verify GST toggle switch appears (amber colored box)"
echo "   5. Toggle GST off and check calculation updates"
echo "   6. Create invoice and verify GST is 0 when toggled off"
echo "   7. Navigate to Invoices page"
echo "   8. Generate vouchers for a paid invoice"
echo "   9. Verify 'Generated Vouchers' modal appears after generation"
echo "   10. Check voucher list displays correctly with codes, amounts, status"
echo "   11. Test 'Download All Vouchers' button"
echo "   12. Test 'Email Vouchers' button"
echo ""
echo "🔄 Rollback command (if needed):"
echo "   ssh root@165.22.52.100 \"cp ${PROD_BACKEND}/routes/invoices-gst.js.${BACKUP_SUFFIX} ${PROD_BACKEND}/routes/invoices-gst.js && rm -rf ${PROD_FRONTEND}/dist && cp -r ${PROD_FRONTEND}/dist.${BACKUP_SUFFIX} ${PROD_FRONTEND}/dist && pm2 restart greenpay-api\""
echo ""
