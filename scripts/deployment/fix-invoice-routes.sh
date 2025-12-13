#!/bin/bash

# Fix invoice route ordering issue in invoices-gst.js
# The /stats route must come BEFORE the /:id route

echo "🔧 Fixing invoice route ordering on server..."
echo "=============================================="
echo ""

# Upload the renamed invoices-gst.js
# (This file has correct route ordering with /stats before /:id)

echo "📤 Uploading invoices-gst.js with correct route ordering..."
scp backend/routes/invoices-gst.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/invoices-gst.js

if [ $? -eq 0 ]; then
  echo "✅ File uploaded successfully"
else
  echo "❌ Upload failed"
  exit 1
fi

# Restart backend
echo ""
echo "🔄 Restarting backend..."
ssh root@72.61.208.79 "pm2 restart greenpay-api"

if [ $? -eq 0 ]; then
  echo "✅ Backend restarted"
else
  echo "❌ Restart failed"
  exit 1
fi

# Verify server is running
echo ""
echo "🔍 Checking backend status..."
ssh root@72.61.208.79 "pm2 list | grep greenpay-api"

echo ""
echo "✅ Route ordering fix deployed!"
echo ""
echo "Test by running:"
echo "  npx playwright test tests/new-features.spec.js --grep 'invoices'"
echo ""
