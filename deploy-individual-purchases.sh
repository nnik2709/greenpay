#!/bin/bash

# Deploy Individual Purchases Feature to Production
# This script uploads the backend route and frontend build

set -e

SERVER="root@72.61.208.79"
BACKEND_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"
FRONTEND_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/frontend"

echo "🚀 Deploying Individual Purchases Feature..."
echo ""

# 1. Upload backend route
echo "📦 Uploading backend route..."
scp backend/routes/individual-purchases.js $SERVER:$BACKEND_DIR/routes/

# 2. Register route in server.js
echo "📝 Registering route in server.js..."
ssh $SERVER "cd $BACKEND_DIR && \
  # Check if route already registered
  if ! grep -q 'individual-purchases' server.js; then
    # Backup server.js first
    cp server.js server.js.backup.\$(date +%Y%m%d_%H%M%S)

    # Find the line number where we should insert (after quotations route)
    LINE_NUM=\$(grep -n \"const quotationRoutes\" server.js | cut -d: -f1)

    # Insert the require statement after quotations
    sed -i \"\${LINE_NUM}a const individualPurchasesRoutes = require('./routes/individual-purchases');\" server.js

    # Find the app.use line for quotations
    APP_USE_LINE=\$(grep -n \"app.use('/api/quotations\" server.js | cut -d: -f1)

    # Insert the app.use statement after quotations route
    sed -i \"\${APP_USE_LINE}a app.use('/api/individual-purchases', individualPurchasesRoutes);\" server.js

    echo '✅ Route registered in server.js'
  else
    echo '✅ Route already registered'
  fi
"

# 3. Upload frontend build
echo "🌐 Uploading frontend build..."
rsync -avz --delete dist/ $SERVER:$FRONTEND_DIR/

# 4. Restart backend
echo "🔄 Restarting backend..."
ssh $SERVER "pm2 restart greenpay-api"

# 5. Wait and check status
echo "⏳ Waiting for backend to restart..."
sleep 3

echo "📊 Checking backend status..."
ssh $SERVER "pm2 status greenpay-api && pm2 logs greenpay-api --lines 10 --nostream"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔗 Test the API:"
echo "   curl https://greenpay.eywademo.cloud/api/individual-purchases -H \"Authorization: Bearer YOUR_TOKEN\""
echo ""
echo "🌐 Frontend: https://greenpay.eywademo.cloud"
