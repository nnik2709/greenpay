#!/bin/bash

echo "========================================="
echo "File Location Verification Script"
echo "Running ON SERVER"
echo "========================================="
echo ""

# Define correct backend path
BACKEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo "Expected backend path: $BACKEND_PATH"
echo ""

echo "1. Checking pdfGenerator.js..."
echo "-------------------------------------------"
ls -lh $BACKEND_PATH/utils/pdfGenerator.js 2>&1
if [ $? -eq 0 ]; then
    echo "✅ File exists"
    echo ""
    echo "First 30 lines (checking for imports):"
    head -30 $BACKEND_PATH/utils/pdfGenerator.js
else
    echo "❌ File NOT found"
fi
echo ""

echo "2. Checking logo directory..."
echo "-------------------------------------------"
ls -lh $BACKEND_PATH/assets/logos/ 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Directory exists"
else
    echo "❌ Directory NOT found - Creating it now..."
    mkdir -p $BACKEND_PATH/assets/logos/
fi
echo ""

echo "3. Checking CCDA logo..."
echo "-------------------------------------------"
ls -lh $BACKEND_PATH/assets/logos/ccda-logo.jpeg 2>&1
if [ $? -eq 0 ]; then
    echo "✅ CCDA logo exists"
    file $BACKEND_PATH/assets/logos/ccda-logo.jpeg
else
    echo "❌ CCDA logo NOT found"
fi
echo ""

echo "4. Checking PNG emblem..."
echo "-------------------------------------------"
ls -lh $BACKEND_PATH/assets/logos/png-emblem.png 2>&1
if [ $? -eq 0 ]; then
    echo "✅ PNG emblem exists"
    file $BACKEND_PATH/assets/logos/png-emblem.png
else
    echo "❌ PNG emblem NOT found"
fi
echo ""

echo "5. Checking PM2 process..."
echo "-------------------------------------------"
pm2 describe greenpay-api | grep -E 'status|script path|uptime'
echo ""

echo "6. Recent backend logs (last 30 lines)..."
echo "-------------------------------------------"
pm2 logs greenpay-api --lines 30 --nostream
echo ""

echo "========================================="
echo "Verification Complete"
echo ""
echo "If files are missing, upload them with:"
echo "  scp backend/utils/pdfGenerator.js root@165.22.52.100:$BACKEND_PATH/utils/"
echo "  scp backend/assets/logos/*.* root@165.22.52.100:$BACKEND_PATH/assets/logos/"
echo ""
echo "Then restart backend:"
echo "  pm2 restart greenpay-api"
echo "========================================="
