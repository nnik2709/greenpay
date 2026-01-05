#!/bin/bash

echo "========================================="
echo "File Location Verification Script"
echo "========================================="
echo ""

# Define correct backend path
BACKEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo "Checking files on server: 165.22.52.100"
echo "Expected backend path: $BACKEND_PATH"
echo ""

echo "1. Checking pdfGenerator.js..."
echo "-------------------------------------------"
ssh root@165.22.52.100 "ls -lh $BACKEND_PATH/utils/pdfGenerator.js 2>&1"
if [ $? -eq 0 ]; then
    echo "✅ File exists"
    echo ""
    echo "First 30 lines (checking for imports):"
    ssh root@165.22.52.100 "head -30 $BACKEND_PATH/utils/pdfGenerator.js"
else
    echo "❌ File NOT found"
fi
echo ""

echo "2. Checking logo directory..."
echo "-------------------------------------------"
ssh root@165.22.52.100 "ls -lh $BACKEND_PATH/assets/logos/ 2>&1"
if [ $? -eq 0 ]; then
    echo "✅ Directory exists"
else
    echo "❌ Directory NOT found"
fi
echo ""

echo "3. Checking CCDA logo..."
echo "-------------------------------------------"
ssh root@165.22.52.100 "ls -lh $BACKEND_PATH/assets/logos/ccda-logo.jpeg 2>&1"
if [ $? -eq 0 ]; then
    echo "✅ CCDA logo exists"
else
    echo "❌ CCDA logo NOT found"
fi
echo ""

echo "4. Checking PNG emblem..."
echo "-------------------------------------------"
ssh root@165.22.52.100 "ls -lh $BACKEND_PATH/assets/logos/png-emblem.png 2>&1"
if [ $? -eq 0 ]; then
    echo "✅ PNG emblem exists"
else
    echo "❌ PNG emblem NOT found"
fi
echo ""

echo "5. Checking PM2 process status..."
echo "-------------------------------------------"
ssh root@165.22.52.100 "pm2 describe greenpay-api | grep -E 'status|script path|uptime'"
echo ""

echo "6. Checking recent backend logs..."
echo "-------------------------------------------"
ssh root@165.22.52.100 "pm2 logs greenpay-api --lines 20 --nostream"
echo ""

echo "========================================="
echo "Verification Complete"
echo "========================================="
