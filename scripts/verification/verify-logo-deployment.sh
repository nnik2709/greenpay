#!/bin/bash

echo "========================================="
echo "Logo Deployment Verification Script"
echo "========================================="
echo ""

# Check 1: Logo files exist
echo "1. Checking logo files..."
ssh root@165.22.52.100 "ls -lh /var/www/greenpay/backend/assets/logos/" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Logo directory exists"
else
    echo "❌ Logo directory NOT found"
fi
echo ""

# Check 2: pdfGenerator.js has new code
echo "2. Checking pdfGenerator.js for logo code..."
ssh root@165.22.52.100 "grep -q 'ccdaLogoPath' /var/www/greenpay/backend/utils/pdfGenerator.js"
if [ $? -eq 0 ]; then
    echo "✅ New logo code found in pdfGenerator.js"
else
    echo "❌ OLD code - pdfGenerator.js NOT updated!"
fi
echo ""

# Check 3: Check for placeholder code (should NOT exist)
echo "3. Checking for old placeholder code..."
ssh root@165.22.52.100 "grep -q 'CCDA Logo placeholder' /var/www/greenpay/backend/utils/pdfGenerator.js"
if [ $? -eq 0 ]; then
    echo "❌ OLD placeholder code still present!"
else
    echo "✅ Placeholder code removed"
fi
echo ""

# Check 4: Show first occurrence of logo code
echo "4. Logo implementation code:"
ssh root@165.22.52.100 "grep -A3 'ccdaLogoPath' /var/www/greenpay/backend/utils/pdfGenerator.js | head -10"
echo ""

# Check 5: Backend PM2 status
echo "5. Backend status:"
ssh root@165.22.52.100 "pm2 list | grep greenpay-backend"
echo ""

# Check 6: Recent backend logs
echo "6. Recent backend logs (last 20 lines):"
ssh root@165.22.52.100 "pm2 logs greenpay-backend --lines 20 --nostream"
echo ""

echo "========================================="
echo "Verification Complete"
echo "========================================="
