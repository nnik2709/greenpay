#!/bin/bash
# Diagnostic script to check payment modes 500 error
# Run this ON THE SERVER

echo "========================================="
echo "Payment Modes Diagnostic"
echo "========================================="

echo ""
echo "1. Checking if PaymentMode table exists in database..."
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -c "\dt \"PaymentMode\""

echo ""
echo "2. Checking table structure if it exists..."
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -c "\d \"PaymentMode\"" 2>&1

echo ""
echo "3. Checking row count if table exists..."
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -c "SELECT COUNT(*) as count FROM \"PaymentMode\";" 2>&1

echo ""
echo "4. Checking if payment-modes.js route file exists..."
if [ -f "/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/payment-modes.js" ]; then
  echo "✅ File exists"
  ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/payment-modes.js
else
  echo "❌ File NOT FOUND"
fi

echo ""
echo "5. Checking if route is registered in server.js..."
if grep -q "payment-modes" /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js; then
  echo "✅ Route registered:"
  grep -n "payment-modes" /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js
else
  echo "❌ Route NOT registered in server.js"
fi

echo ""
echo "6. Checking backend process status..."
pm2 status greenpay-api

echo ""
echo "7. Checking recent backend logs..."
pm2 logs greenpay-api --lines 20 --nostream

echo ""
echo "========================================="
echo "Diagnostic Complete"
echo "========================================="
