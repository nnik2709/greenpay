#!/bin/bash

# Deploy Backend to Production Server
# This script deploys the backend API to the production server

SERVER="root@72.61.208.79"
REMOTE_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo "🚀 Deploying Backend to Production Server"
echo "=========================================="
echo ""

# Step 1: Create backup of existing backend
echo "1️⃣ Creating backup of existing backend..."
ssh $SERVER "cd $REMOTE_DIR && tar -czf ../backend-backup-\$(date +%Y%m%d-%H%M%S).tar.gz . 2>/dev/null || echo 'No existing backend to backup'"
echo ""

# Step 2: Upload backend files
echo "2️⃣ Uploading backend files..."
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.env' \
  backend/ $SERVER:$REMOTE_DIR/

if [ $? -ne 0 ]; then
    echo "❌ Failed to upload backend files"
    exit 1
fi
echo ""

# Step 3: Upload .env file (if it doesn't exist on server)
echo "3️⃣ Checking .env file on server..."
ssh $SERVER "[ -f $REMOTE_DIR/.env ] && echo '✅ .env already exists on server' || echo '⚠️  .env needs to be created on server'"
echo ""

# Step 4: Install dependencies
echo "4️⃣ Installing dependencies on server..."
ssh $SERVER "cd $REMOTE_DIR && npm install"
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo ""

# Step 5: Restart backend with PM2
echo "5️⃣ Restarting backend with PM2..."
ssh $SERVER "cd $REMOTE_DIR && pm2 restart greenpay-backend || pm2 start server.js --name greenpay-backend"
if [ $? -ne 0 ]; then
    echo "❌ Failed to restart backend"
    exit 1
fi
echo ""

# Step 6: Check status
echo "6️⃣ Checking backend status..."
ssh $SERVER "pm2 status greenpay-backend"
echo ""

echo "=========================================="
echo "✅ Backend deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Check backend logs: ssh $SERVER 'pm2 logs greenpay-backend'"
echo "   2. Test API: curl https://greenpay.eywademo.cloud/api/auth/verify"
echo "   3. Start frontend locally: npm run dev"
echo ""
