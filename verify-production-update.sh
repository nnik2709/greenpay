#!/bin/bash

# Verify Production Update
echo "🔍 Verifying PNG Green Fees Update on Production Server..."

SERVER="root@195.200.14.62"
URL="https://eywademo.cloud/"

echo "🌐 Checking application at: $URL"

# Test if the application is responding
echo "📡 Testing application response..."
if curl -s -o /dev/null -w "%{http_code}" "$URL" | grep -q "200"; then
    echo "✅ Application is responding (HTTP 200)"
else
    echo "❌ Application not responding properly"
    exit 1
fi

# Check server status
echo "🖥️ Checking server status..."
ssh $SERVER << 'EOF'
echo "📊 PM2 Process Status:"
pm2 status

echo ""
echo "📁 Frontend Directory:"
ls -la /var/www/png-green-fees/frontend/

echo ""
echo "📄 Latest Files:"
ls -la /var/www/png-green-fees/frontend/ | head -10

echo ""
echo "🔧 Environment Check:"
if [ -f "/var/www/png-green-fees/frontend/.env.production" ]; then
    echo "✅ Environment file exists"
else
    echo "⚠️ Environment file not found"
fi

echo ""
echo "📦 Package Status:"
cd /var/www/png-green-fees/frontend && npm list --depth=0 2>/dev/null | head -5
EOF

echo ""
echo "🎯 Manual Verification Steps:"
echo "1. Visit https://eywademo.cloud/"
echo "2. Test login functionality"
echo "3. Navigate to Users page"
echo "4. Click 'View Login History' button"
echo "5. Test export functionality"
echo "6. Check Settings page (admin only)"
echo "7. Check Profile Settings page"
echo "8. Verify no blank pages or console errors"
echo ""
echo "✅ Update verification complete!"
