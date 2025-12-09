#!/bin/bash

# Deploy bulk corporate vouchers fix
# Adds POST /api/vouchers/bulk-corporate endpoint to backend

echo "🔧 Deploying Bulk Corporate Vouchers Fix"
echo "========================================"
echo ""
echo "Issue: Frontend trying to call non-existent Supabase Edge Function"
echo "Fix: Added POST /api/vouchers/bulk-corporate backend endpoint"
echo ""

# Upload updated vouchers.js route
echo "📤 Uploading updated vouchers.js..."
rsync -avz backend/routes/vouchers.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

if [ $? -ne 0 ]; then
    echo "❌ Upload failed"
    exit 1
fi

echo "✅ File uploaded"
echo ""

# Restart backend
echo "🔄 Restarting backend..."
ssh root@72.61.208.79 "pm2 restart greenpay-api"

if [ $? -ne 0 ]; then
    echo "❌ Restart failed"
    exit 1
fi

echo "✅ Backend restarted"
echo ""

# Check status
echo "🔍 Checking backend status..."
ssh root@72.61.208.79 "pm2 list | grep greenpay-api"

echo ""
echo "✅ Bulk corporate vouchers fix deployed!"
echo ""
echo "Changes:"
echo "  Backend:"
echo "    - Added POST /api/vouchers/bulk-corporate endpoint"
echo "    - Supports creating 1-1000 vouchers in one request"
echo "    - Role-based access: Flex_Admin, Finance_Manager, Counter_Agent"
echo "    - Transaction support with automatic rollback on errors"
echo ""
echo "  Frontend (already updated locally):"
echo "    - Updated corporateVouchersService.js to use new API endpoint"
echo "    - Removed dependency on non-existent Supabase Edge Function"
echo ""
echo "Next: Test bulk corporate voucher creation in the app"
echo ""
