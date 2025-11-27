#!/bin/bash
# Run this script ON THE SERVER to complete the payment modes setup

echo "========================================="
echo "GreenPay Payment Modes Setup"
echo "========================================="

# Step 1: Register route in server.js
echo ""
echo "Step 1: Registering payment-modes route in server.js..."

# Check if route is already registered
if grep -q "payment-modes" /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js; then
  echo "✅ Payment modes route already registered"
else
  # Add the route registration after the settings route
  sed -i "/app.use('\/api\/settings'/a app.use('/api/payment-modes', require('./routes/payment-modes'));" /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js
  echo "✅ Payment modes route registered"
fi

# Step 2: Verify files exist
echo ""
echo "Step 2: Verifying files..."
if [ -f "/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/payment-modes.js" ]; then
  echo "✅ payment-modes.js exists"
else
  echo "❌ payment-modes.js NOT FOUND - you need to copy it to the server first"
  exit 1
fi

if [ -f "/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/settings.js" ]; then
  echo "✅ settings.js exists"
else
  echo "❌ settings.js NOT FOUND"
  exit 1
fi

# Step 3: Restart PM2
echo ""
echo "Step 3: Restarting backend..."
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
pm2 restart greenpay-api

echo ""
echo "✅ Setup complete!"
echo ""
echo "Check logs with: pm2 logs greenpay-api --lines 20"
