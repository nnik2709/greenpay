#!/bin/bash

# Deploy Invoice Backend to Server
# This script uploads the invoice routes and registers them in server.js

SERVER="root@72.61.208.79"
BACKEND_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo "🚀 Deploying Invoice Backend System..."
echo ""

# Step 1: Upload invoice routes file
echo "📤 Step 1: Uploading invoice routes file..."
scp backend/routes/invoices-gst.js $SERVER:$BACKEND_DIR/routes/
if [ $? -eq 0 ]; then
    echo "✅ Invoice routes uploaded successfully"
else
    echo "❌ Failed to upload invoice routes"
    exit 1
fi
echo ""

# Step 2: Check if routes are already registered
echo "🔍 Step 2: Checking if invoice routes are already registered..."
ssh $SERVER "grep -q 'invoices-gst' $BACKEND_DIR/server.js"
if [ $? -eq 0 ]; then
    echo "ℹ️  Invoice routes already registered in server.js"
else
    echo "📝 Adding invoice routes to server.js..."

    # Backup server.js first
    ssh $SERVER "cp $BACKEND_DIR/server.js $BACKEND_DIR/server.js.backup-$(date +%Y%m%d-%H%M%S)"

    # Add the require statement after other route requires
    ssh $SERVER "sed -i \"/const.*Router = require.*routes/a const invoicesRouter = require('./routes/invoices-gst');\" $BACKEND_DIR/server.js"

    # Add the route registration after other app.use statements
    ssh $SERVER "sed -i \"/app.use.*\/api\//a app.use('/api/invoices', invoicesRouter);\" $BACKEND_DIR/server.js"

    echo "✅ Invoice routes registered in server.js"
fi
echo ""

# Step 3: Restart PM2
echo "🔄 Step 3: Restarting backend server..."
ssh $SERVER "cd $BACKEND_DIR && pm2 restart greenpay-api"
if [ $? -eq 0 ]; then
    echo "✅ Backend server restarted successfully"
else
    echo "❌ Failed to restart backend server"
    exit 1
fi
echo ""

# Step 4: Check PM2 logs for errors
echo "📋 Step 4: Checking server logs..."
sleep 2
ssh $SERVER "pm2 logs greenpay-api --lines 20 --nostream"
echo ""

echo "✅ Invoice backend deployment complete!"
echo ""
echo "Next steps:"
echo "1. Build frontend: npm run build"
echo "2. Deploy frontend: rsync -avz --delete dist/ $SERVER:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/"
echo "3. Test the invoice system at: http://greenpay.eywademo.cloud/invoices"
