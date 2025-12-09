#!/bin/bash

# Deploy invoices-gst.js with fixed route ordering
# The issue: /stats route must come BEFORE /:id route to avoid "invalid input syntax for type integer: stats"

echo "🔧 Deploying Invoice Route Fix"
echo "==============================="
echo ""
echo "Issue: Express was matching /invoices/stats to /:id route, trying to parse 'stats' as integer"
echo "Fix: Reordered routes so /stats (line 42) comes before /:id (line 109)"
echo ""

# Deploy using rsync like the other deployment scripts
echo "📤 Uploading invoices-gst.js..."
rsync -avz backend/routes/invoices-gst.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

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
echo "✅ Invoice route ordering fix deployed!"
echo ""
echo "Changes made:"
echo "  - Renamed local invoices.js → invoices-gst.js (eliminates confusion)"
echo "  - Routes now ordered correctly: /stats (line 42) before /:id (line 109)"
echo "  - Deployed to server"
echo ""
echo "Next: Re-run tests to verify fix"
echo "  npx playwright test --grep 'invoices'"
echo ""
