#!/bin/bash

echo "======================================"
echo "PDF Generator & Logo Deployment"
echo "======================================"
echo ""

# Define correct backend path
BACKEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo "Step 1: Upload pdfGenerator.js..."
scp backend/utils/pdfGenerator.js root@165.22.52.100:$BACKEND_PATH/utils/
if [ $? -eq 0 ]; then
    echo "✅ pdfGenerator.js uploaded"
else
    echo "❌ Failed to upload pdfGenerator.js"
    exit 1
fi
echo ""

echo "Step 2: Upload CCDA logo..."
scp backend/assets/logos/ccda-logo.jpeg root@165.22.52.100:$BACKEND_PATH/assets/logos/
if [ $? -eq 0 ]; then
    echo "✅ CCDA logo uploaded"
else
    echo "❌ Failed to upload CCDA logo"
    exit 1
fi
echo ""

echo "Step 3: Upload PNG emblem..."
scp backend/assets/logos/png-emblem.png root@165.22.52.100:$BACKEND_PATH/assets/logos/
if [ $? -eq 0 ]; then
    echo "✅ PNG emblem uploaded"
else
    echo "❌ Failed to upload PNG emblem"
    exit 1
fi
echo ""

echo "Step 4: Verify files on server..."
ssh root@165.22.52.100 "ls -lh $BACKEND_PATH/utils/pdfGenerator.js && ls -lh $BACKEND_PATH/assets/logos/"
echo ""

echo "Step 5: Restart PM2 process..."
ssh root@165.22.52.100 "pm2 restart greenpay-api"
echo ""

echo "Step 6: Check process status..."
ssh root@165.22.52.100 "pm2 status greenpay-api"
echo ""

echo "======================================"
echo "Deployment Complete!"
echo ""
echo "Next steps:"
echo "1. Download a NEW voucher PDF from https://greenpay.eywademo.cloud"
echo "2. Open the PDF and check for logos"
echo "3. Run this command to check debug logs:"
echo "   ssh root@165.22.52.100 \"pm2 logs greenpay-api --lines 50 | grep -E '🔍|logo|emblem'\""
echo "======================================"
