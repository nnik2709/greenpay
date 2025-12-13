#!/bin/bash

# GreenPay Frontend Deployment Commands
# Run these commands after establishing SSH connection

set -e

SERVER="root@72.61.208.79"
REMOTE_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud"
LOCAL_DIST="dist"

echo "=================================================="
echo "GreenPay Frontend Deployment"
echo "=================================================="
echo ""
echo "Testing SSH connection..."

# Test SSH connection
if ! ssh -o ConnectTimeout=5 $SERVER "echo 'Connected'" 2>/dev/null; then
    echo "❌ Cannot connect to server via SSH"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check if server is running"
    echo "  2. Verify SSH service is active on server"
    echo "  3. Try manual SSH: ssh $SERVER"
    echo "  4. Check if port 22 is open"
    echo ""
    echo "Alternative: Use manual deployment with SFTP"
    echo "  Package file: greenpay-frontend-20251125-195934.tar.gz"
    echo "  Instructions: deploy-instructions.txt"
    echo ""
    exit 1
fi

echo "✅ SSH connection successful"
echo ""

# Create backup
echo "📦 Creating backup..."
ssh $SERVER "cd $REMOTE_DIR && mkdir -p backups && tar -czf backups/frontend-backup-\$(date +%Y%m%d-%H%M%S).tar.gz assets index.html 2>/dev/null || echo 'No previous deployment to backup'"
echo "✅ Backup created"
echo ""

# Remove old files
echo "🗑️  Removing old frontend files..."
ssh $SERVER "cd $REMOTE_DIR && rm -rf assets && rm -f index.html"
echo "✅ Old files removed"
echo ""

# Upload new files
echo "📤 Uploading new build files..."
rsync -avz --progress $LOCAL_DIST/ $SERVER:$REMOTE_DIR/
echo "✅ Files uploaded"
echo ""

# Set permissions
echo "🔐 Setting permissions..."
ssh $SERVER "cd $REMOTE_DIR && chown -R eywademo-greenpay:eywademo-greenpay assets index.html && chmod -R 755 assets && chmod 644 index.html"
echo "✅ Permissions set"
echo ""

# Verify
echo "🔍 Verifying deployment..."
FILE_COUNT=$(ssh $SERVER "find $REMOTE_DIR/assets -type f | wc -l")
echo "Deployed $FILE_COUNT files"

ssh $SERVER "test -f $REMOTE_DIR/index.html && echo '✅ index.html exists' || echo '❌ index.html missing'"
echo ""

echo "=================================================="
echo "🎉 Deployment Complete!"
echo "=================================================="
echo ""
echo "🌐 Application: https://greenpay.eywademo.cloud"
echo ""
echo "Next steps:"
echo "  1. Open https://greenpay.eywademo.cloud"
echo "  2. Login with: admin@greenpay.com / Admin123!"
echo "  3. Check console for errors"
echo ""
