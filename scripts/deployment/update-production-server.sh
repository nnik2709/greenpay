#!/bin/bash

# PNG Green Fees - Update Production Server
# This script updates the existing production server at 195.200.14.62

echo "🚀 Updating PNG Green Fees on Production Server..."

# Server details
SERVER="root@195.200.14.62"
REMOTE_PATH="/var/www/png-green-fees"
BACKUP_PATH="/var/www/png-green-fees-backup-$(date +%Y%m%d-%H%M%S)"

# Get the latest build
LATEST_BUILD=$(ls -t deployments/png-green-fees-production-* | head -1)
BUILD_DIR=$(basename "$LATEST_BUILD" .tar.gz)

echo "📦 Using build: $BUILD_DIR"
echo "🌐 Target server: $SERVER"
echo "📁 Remote path: $REMOTE_PATH"

# Create backup of current deployment
echo "💾 Creating backup of current deployment..."
ssh $SERVER "cp -r $REMOTE_PATH $BACKUP_PATH"

# Upload the new build
echo "📤 Uploading new build to server..."
scp "deployments/$LATEST_BUILD.tar.gz" $SERVER:/tmp/

# Extract and deploy on server
echo "🔄 Deploying new build on server..."
ssh $SERVER << 'EOF'
cd /var/www/
tar -xzf /tmp/png-green-fees-production-*.tar.gz
rm /tmp/png-green-fees-production-*.tar.gz

# Stop current services
pm2 stop png-green-fees || true
pm2 stop all || true

# Backup current frontend
if [ -d "png-green-fees/frontend" ]; then
    mv png-green-fees/frontend png-green-fees/frontend-backup-$(date +%Y%m%d-%H%M%S)
fi

# Move new build to frontend directory
mkdir -p png-green-fees/frontend
mv png-green-fees-production-*/* png-green-fees/frontend/

# Install dependencies
cd png-green-fees/frontend
npm install --production

# Set proper permissions
chown -R www-data:www-data /var/www/png-green-fees/frontend
chmod -R 755 /var/www/png-green-fees/frontend

# Restart services
pm2 restart all || pm2 start ecosystem.config.cjs
pm2 save

echo "✅ Deployment completed successfully!"
echo "🌐 Application should be available at https://eywademo.cloud/"
EOF

echo ""
echo "🎉 Update completed successfully!"
echo "🌐 Your updated application is now live at: https://eywademo.cloud/"
echo ""
echo "📋 What's been updated:"
echo "✅ View Login History with RPC functions"
echo "✅ Export Reports functionality"
echo "✅ Settings and Profile management"
echo "✅ Fixed React Hook errors"
echo "✅ All new RPC-based components"
echo ""
echo "💾 Backup created at: $BACKUP_PATH"
echo "🔍 Check the application to verify all features are working!"
