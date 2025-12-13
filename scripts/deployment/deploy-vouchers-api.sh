#!/bin/bash

echo "========================================"
echo "GreenPay Vouchers API Deployment"
echo "========================================"

SERVER_USER="root"
SERVER_HOST="72.61.208.79"
BACKEND_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo ""
echo "Step 1: Uploading vouchers.js route file..."
scp /Users/nikolay/github/greenpay/backend/routes/vouchers.js ${SERVER_USER}@${SERVER_HOST}:${BACKEND_DIR}/routes/vouchers.js

if [ $? -eq 0 ]; then
  echo "✅ vouchers.js uploaded successfully"
else
  echo "❌ Failed to upload vouchers.js"
  exit 1
fi

echo ""
echo "Step 2: Checking if vouchers route is already registered in server.js..."

ssh ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
BACKEND_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"
SERVER_FILE="${BACKEND_DIR}/server.js"

# Check if route is already registered
if grep -q "vouchers" "$SERVER_FILE"; then
  echo "✅ Vouchers route is already registered:"
  grep -n "vouchers" "$SERVER_FILE"
else
  echo "⚙️  Registering vouchers route in server.js..."

  # Backup server.js
  cp "$SERVER_FILE" "$SERVER_FILE.backup.$(date +%Y%m%d_%H%M%S)"
  echo "✅ Backup created"

  # Add vouchers route after tickets route
  sed -i "/app\.use('\/api\/tickets'/a app.use('/api/vouchers', require('./routes/vouchers'));" "$SERVER_FILE"

  if grep -q "vouchers" "$SERVER_FILE"; then
    echo "✅ Vouchers route registered successfully"
    echo ""
    echo "Route registrations in server.js:"
    grep "app.use('/api" "$SERVER_FILE"
  else
    echo "❌ Failed to register vouchers route"
    exit 1
  fi
fi

echo ""
echo "Step 3: Restarting backend API..."
cd "$BACKEND_DIR"
pm2 restart greenpay-api

if [ $? -eq 0 ]; then
  echo "✅ Backend API restarted successfully"
else
  echo "❌ Failed to restart backend API"
  exit 1
fi

echo ""
echo "Step 4: Checking backend status..."
pm2 status greenpay-api
pm2 logs greenpay-api --lines 20 --nostream

ENDSSH

echo ""
echo "========================================"
echo "✅ Vouchers API Deployment Complete!"
echo "========================================"
echo ""
echo "Test the API:"
echo "  curl https://greenpay.eywademo.cloud/api/vouchers/validate/TEST123 -H 'Authorization: Bearer YOUR_TOKEN'"
echo ""
