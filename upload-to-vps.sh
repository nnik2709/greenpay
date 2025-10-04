#!/bin/bash

# PNG Green Fees - Upload to VPS Script
# Run this script from your local machine to upload the built application to VPS

set -e  # Exit on any error

VPS_IP="195.200.14.62"
APP_NAME="png-green-fees"
APP_DIR="/var/www/$APP_NAME"
LOCAL_DIST="dist"

echo "📤 Uploading application to VPS ($VPS_IP)..."

# Check if dist directory exists
if [ ! -d "$LOCAL_DIST" ]; then
    echo "❌ Local dist directory not found!"
    echo "   Please run 'npm run build' first to create the production build"
    exit 1
fi

# Check if SSH key is available
if [ ! -f ~/.ssh/id_rsa ] && [ ! -f ~/.ssh/id_ed25519 ]; then
    echo "⚠️  No SSH key found. You may need to enter your password."
fi

echo "📁 Creating application directory on VPS..."
ssh root@$VPS_IP "mkdir -p $APP_DIR"

echo "📤 Uploading application files..."
rsync -avz --delete $LOCAL_DIST/ root@$VPS_IP:$APP_DIR/dist/

echo "🔧 Setting proper permissions..."
ssh root@$VPS_IP "chown -R www-data:www-data $APP_DIR && chmod -R 755 $APP_DIR"

echo "🔄 Restarting Nginx on VPS..."
ssh root@$VPS_IP "systemctl restart nginx"

echo "✅ Upload completed successfully!"
echo ""
echo "🎯 Application is now available at:"
echo "   🌐 https://eywademo.cloud"
echo "   🌐 https://www.eywademo.cloud"
echo ""
echo "🔍 Testing application..."
if curl -s -o /dev/null -w "%{http_code}" https://eywademo.cloud | grep -q "200"; then
    echo "✅ Application is responding correctly"
else
    echo "⚠️  Application may not be responding. Check VPS logs:"
    echo "   ssh root@$VPS_IP 'tail -f /var/log/nginx/error.log'"
fi
