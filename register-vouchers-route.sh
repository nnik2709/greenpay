#!/bin/bash

echo "========================================"
echo "Register Vouchers Route in server.js"
echo "========================================"
echo ""

# Copy the script to server and execute
ssh root@72.61.208.79 'bash -s' << 'ENDSSH'

SERVER_FILE="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/server.js"

echo "Step 1: Checking if vouchers route is already registered..."
if grep -q "vouchers" "$SERVER_FILE"; then
  echo "✅ Vouchers route is already registered:"
  grep -n "vouchers" "$SERVER_FILE"
  echo ""
  echo "Current routes in server.js:"
  grep "app.use('/api" "$SERVER_FILE" | nl
  exit 0
fi

echo "⚙️  Registering vouchers route..."

# Backup server.js first
echo "Creating backup..."
cp "$SERVER_FILE" "$SERVER_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created: $SERVER_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo ""

# Add vouchers route after tickets route
echo "Adding route registration..."
sed -i "/app\.use('\/api\/tickets'/a app.use('/api/vouchers', require('./routes/vouchers'));" "$SERVER_FILE"

if grep -q "vouchers" "$SERVER_FILE"; then
  echo "✅ Vouchers route registered successfully!"
  echo ""
  echo "All API routes in server.js:"
  grep "app.use('/api" "$SERVER_FILE" | nl
  echo ""

  echo "Step 2: Restarting backend..."
  cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
  pm2 restart greenpay-api
  echo "✅ Backend restarted"

  echo ""
  echo "Step 3: Checking backend status..."
  pm2 status greenpay-api
else
  echo "❌ Failed to register route"
  exit 1
fi

ENDSSH

echo ""
echo "========================================"
echo "✅ Done!"
echo "========================================"
