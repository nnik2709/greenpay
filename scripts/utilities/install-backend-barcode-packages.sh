#!/bin/bash
# Install jsbarcode and canvas packages on backend server

echo "🔧 Installing backend barcode packages..."
echo ""

# Connect to server and install packages
ssh root@72.61.208.79 << 'EOF'
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
echo "📦 Installing jsbarcode and canvas..."
npm install jsbarcode canvas
echo ""
echo "✅ Packages installed successfully!"
echo ""
echo "🔄 Restarting backend API..."
pm2 restart greenpay-api
echo ""
echo "✅ Backend API restarted!"
echo ""
pm2 status greenpay-api
EOF

echo ""
echo "✅ All done! Backend is ready with barcode support."
