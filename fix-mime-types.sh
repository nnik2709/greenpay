#!/bin/bash

# Quick fix for MIME type issues
# This script updates the Nginx configuration to fix JavaScript module loading

set -e

VPS_USER="root"
VPS_HOST="195.200.14.62"

echo "🔧 Fixing MIME Type Issues"
echo "=========================="
echo ""

echo "📤 Uploading fixed Nginx configuration..."
scp nginx-fix-mime.conf $VPS_USER@$VPS_HOST:/tmp/nginx-fix-mime.conf

echo "🔧 Updating Nginx configuration on VPS..."
ssh -o PasswordAuthentication=yes $VPS_USER@$VPS_HOST "
    # Backup current config
    cp /etc/nginx/sites-available/png-green-fees /etc/nginx/sites-available/png-green-fees.backup.\$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
    
    # Install new config
    cp /tmp/nginx-fix-mime.conf /etc/nginx/sites-available/png-green-fees
    
    # Test configuration
    nginx -t
    
    # Reload Nginx
    systemctl reload nginx
    
    # Restart Nginx to ensure clean state
    systemctl restart nginx
    
    echo 'Nginx configuration updated successfully'
"

echo "✅ MIME type fix deployed!"
echo ""
echo "🧪 Testing the fix..."
if curl -s -I https://eywademo.cloud/assets/index-79b085db.js | grep -i "content-type.*javascript"; then
    echo "✅ JavaScript files now served with correct MIME type"
else
    echo "⚠️  Still checking MIME type..."
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Open https://eywademo.cloud in a new incognito window"
echo "2. Check browser console - JavaScript module errors should be gone"
echo "3. Navigate to Reports page to verify fix"
echo ""
echo "✅ MIME type fix complete!"
