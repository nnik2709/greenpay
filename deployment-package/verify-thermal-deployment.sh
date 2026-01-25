#!/bin/bash
# Verify thermal receipt GREEN CARD deployment
# Date: January 25, 2026

echo "🔍 Verifying thermal receipt deployment on server..."
echo ""

ssh root@165.22.52.100 << 'EOF'
  echo "📂 Checking pdfGenerator.js on server..."
  echo ""

  # Check if file exists
  if [ -f "/var/www/greenpay/backend/utils/pdfGenerator.js" ]; then
    echo "✅ File exists"
    echo ""

    # Check for the GREEN CARD background code (line 949-952)
    echo "🔍 Checking for GREEN CARD background code..."
    if grep -A 3 "Title - GREEN CARD with white text" /var/www/greenpay/backend/utils/pdfGenerator.js | grep -q "fillAndStroke('#2d5016'"; then
      echo "✅ GREEN CARD background code found!"
      echo ""
      echo "Code snippet:"
      grep -A 5 "Title - GREEN CARD with white text" /var/www/greenpay/backend/utils/pdfGenerator.js
    else
      echo "❌ GREEN CARD background code NOT found!"
      echo "⚠️  The file needs to be deployed or was deployed incorrectly"
      echo ""
      echo "Current GREEN CARD code:"
      grep -A 5 "Title" /var/www/greenpay/backend/utils/pdfGenerator.js | head -15
    fi
    echo ""

    # Check PM2 status
    echo "🔍 Checking PM2 status..."
    pm2 list | grep greenpay-api
    echo ""

    # Check when file was last modified
    echo "📅 File last modified:"
    ls -lh /var/www/greenpay/backend/utils/pdfGenerator.js
    echo ""

    # Check PM2 restart time
    echo "🕐 PM2 process info:"
    pm2 info greenpay-api | grep -E "status|uptime|restart time"

  else
    echo "❌ File not found at /var/www/greenpay/backend/utils/pdfGenerator.js"
  fi
EOF

echo ""
echo "💡 If code is NOT found on server:"
echo "   Run: ./deploy-thermal-greencard.sh"
echo ""
echo "💡 If code IS found but vouchers still look old:"
echo "   The API might not have restarted properly"
echo "   SSH to server and run: pm2 restart greenpay-api"
echo "   Then generate a new voucher (old cached PDFs won't change)"
