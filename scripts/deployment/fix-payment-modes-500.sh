#!/bin/bash
# Troubleshoot and fix payment modes 500 error

echo "========================================="
echo "Payment Modes 500 Error - Troubleshooting"
echo "========================================="

echo ""
echo "Step 1: Create PaymentMode table..."
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -f /tmp/create-payment-modes-table.sql

echo ""
echo "Step 2: Verify payment-modes.js exists..."
if [ -f "/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/payment-modes.js" ]; then
  echo "✅ payment-modes.js exists"
  ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/payment-modes.js
else
  echo "❌ payment-modes.js NOT FOUND"
  exit 1
fi

echo ""
echo "Step 3: Check if route is registered in server.js..."
if grep -q "payment-modes" /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js; then
  echo "✅ Payment modes route is registered"
  grep "payment-modes" /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js
else
  echo "❌ Payment modes route NOT registered"
  echo "Adding route registration..."

  # Find the line with settings route and add payment-modes after it
  sed -i "/app\.use('\/api\/settings'/a app.use('/api/payment-modes', require('./routes/payment-modes'));" /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js

  echo "✅ Route registered"
fi

echo ""
echo "Step 4: Restart backend..."
pm2 restart greenpay-api

echo ""
echo "Step 5: Wait for backend to start..."
sleep 3

echo ""
echo "Step 6: Check logs..."
pm2 logs greenpay-api --lines 20 --nostream

echo ""
echo "========================================="
echo "✅ Troubleshooting Complete"
echo "========================================="
echo ""
echo "Test the endpoint:"
echo "curl -H 'Authorization: Bearer YOUR_TOKEN' https://greenpay.eywademo.cloud/api/payment-modes"
