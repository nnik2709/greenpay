#!/bin/bash

# Deploy Vouchers List Feature
# Adds GET endpoint for corporate vouchers to support the new Vouchers List page

echo "📋 Deploying Vouchers List Backend Feature"
echo "==========================================="
echo ""
echo "Feature: Vouchers List endpoint"
echo "- GET /api/vouchers/corporate-vouchers - Returns all corporate vouchers"
echo "- Supports the new Vouchers List page showing usage status"
echo ""

# Upload updated vouchers.js route
echo "📤 Uploading updated vouchers.js route..."
scp backend/routes/vouchers.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

if [ $? -ne 0 ]; then
    echo "❌ Upload failed"
    exit 1
fi

echo "✅ vouchers.js uploaded"
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
echo "✅ Vouchers List Backend Feature Deployed!"
echo ""
echo "Backend Changes:"
echo "  - Added GET /api/vouchers/corporate-vouchers endpoint"
echo "  - Returns all corporate vouchers with created_at DESC sorting"
echo "  - Requires authentication"
echo ""
echo "Frontend (already completed locally):"
echo "  - New VouchersList.jsx page showing all vouchers"
echo "  - Stats dashboard (Total, Active, Used, Expired, Individual, Corporate)"
echo "  - Filters by type and status"
echo "  - Search by voucher code, customer name, passport number"
echo "  - Export to Excel functionality"
echo "  - Route: /vouchers-list"
echo "  - Navigation: Passports > Vouchers List"
echo "  - Access: Flex_Admin, Finance_Manager, IT_Support, Counter_Agent"
echo ""
echo "Testing:"
echo "  1. Login to the app"
echo "  2. Navigate to Passports > Vouchers List"
echo "  3. View all vouchers with their usage status"
echo "  4. Test filters (Type, Status) and search"
echo "  5. Verify vouchers show correct status (Active/Used/Expired)"
echo "  6. Test Excel export"
echo ""
