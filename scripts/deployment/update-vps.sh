#!/bin/bash

# PNG Green Fees - VPS Update Script
# Run this script to update the application on your VPS

set -e  # Exit on any error

VPS_IP="195.200.14.62"
APP_NAME="png-green-fees"
APP_DIR="/var/www/$APP_NAME"
NGINX_SITE="png-green-fees"

echo "🔄 Updating application on VPS ($VPS_IP)..."

# Check if we're running on the VPS
if [ "$(hostname -I | awk '{print $1}')" != "$VPS_IP" ]; then
    echo "⚠️  This script should be run on the VPS ($VPS_IP)"
    echo "   Connect via: ssh root@$VPS_IP"
    echo "   Then run this script on the VPS"
    exit 1
fi

echo "📁 Backing up current application..."
if [ -d "$APP_DIR/dist" ]; then
    cp -r $APP_DIR/dist $APP_DIR/dist.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup created"
else
    echo "⚠️  No existing dist directory found"
fi

echo "📦 Updating system packages..."
apt update

echo "🔄 Restarting Nginx..."
systemctl restart nginx

echo "🔍 Checking application status..."
if [ -d "$APP_DIR/dist" ]; then
    echo "✅ Application directory exists"
    echo "📊 Application size:"
    du -sh $APP_DIR/dist/
    
    echo "🌐 Testing application..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200"; then
        echo "✅ Application is responding"
    else
        echo "⚠️  Application may not be responding properly"
    fi
else
    echo "❌ Application directory not found at $APP_DIR/dist"
    echo "   Please upload your built application files first"
fi

echo ""
echo "🎯 Update completed!"
echo "   Application directory: $APP_DIR/dist/"
echo "   Nginx status: $(systemctl is-active nginx)"
echo ""
echo "🔧 Useful commands:"
echo "   - View application logs: tail -f /var/log/nginx/access.log"
echo "   - Check Nginx status: systemctl status nginx"
echo "   - Restart Nginx: systemctl restart nginx"
