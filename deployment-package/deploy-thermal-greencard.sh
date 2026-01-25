#!/bin/bash
# Deploy thermal receipt GREEN CARD styling fix
# Date: January 25, 2026

echo "🎨 Deploying thermal receipt GREEN CARD styling fix..."
echo ""

# Copy file to server
echo "📤 Uploading pdfGenerator.js to server..."
scp ../backend/utils/pdfGenerator.js root@165.22.52.100:/tmp/

echo ""
echo "🔧 Deploying on server..."

ssh root@165.22.52.100 << 'EOF'
  # Backup current file
  echo "💾 Creating backup..."
  cp /var/www/greenpay/backend/utils/pdfGenerator.js \
     /var/www/greenpay/backend/utils/pdfGenerator.js.backup-$(date +%Y%m%d-%H%M%S)

  # Deploy new file
  echo "📦 Deploying new version..."
  mv /tmp/pdfGenerator.js /var/www/greenpay/backend/utils/pdfGenerator.js
  chown root:root /var/www/greenpay/backend/utils/pdfGenerator.js

  # Restart API
  echo "🔄 Restarting API..."
  pm2 restart greenpay-api

  echo ""
  echo "✅ Deployment complete!"
  echo ""
  echo "📋 Checking logs..."
  pm2 logs greenpay-api --lines 20 --nostream
EOF

echo ""
echo "🎉 Done! Test by printing a thermal receipt voucher."
echo ""
echo "Changes applied:"
echo "  ✅ GREEN CARD now has white text on dark green background"
echo "  ✅ Removed separator line (background provides separation)"
