#!/bin/bash

# PNG Green Fees - Deploy with Password Authentication
# Simple deployment script that prompts for VPS password

set -e

VPS_USER="root"
VPS_HOST="195.200.14.62"
VPS_APP_DIR="/var/www/png-green-fees"

echo "🚀 PNG Green Fees - Deploy to VPS"
echo "================================="
echo ""

# Check if required files exist
echo "📋 Checking files..."
if [ ! -d "dist" ]; then
    echo "❌ dist/ folder not found. Run 'npm run build' first."
    exit 1
fi

if [ ! -f ".env.production" ]; then
    echo "❌ .env.production not found. Please create it first."
    exit 1
fi

echo "✅ Files found"
echo ""

# Get VPS password from user
echo "🔐 VPS Authentication"
echo "====================="
echo "VPS: $VPS_USER@$VPS_HOST"
echo "You will be prompted for the VPS password multiple times during deployment."
echo ""

read -p "Press Enter to continue..." -r
echo ""

# Test SSH connection
echo "🔗 Testing SSH connection..."
ssh -o ConnectTimeout=10 -o PasswordAuthentication=yes $VPS_USER@$VPS_HOST exit
echo "✅ SSH connection successful"
echo ""

# Create application directory
echo "📁 Creating application directory..."
ssh -o PasswordAuthentication=yes $VPS_USER@$VPS_HOST "mkdir -p $VPS_APP_DIR"
echo "✅ Directory created"
echo ""

# Backup existing deployment
echo "💾 Creating backup..."
ssh -o PasswordAuthentication=yes $VPS_USER@$VPS_HOST "
    if [ -d '$VPS_APP_DIR/dist' ]; then
        mv '$VPS_APP_DIR/dist' '$VPS_APP_DIR/dist.backup.\$(date +%Y%m%d-%H%M%S)' 2>/dev/null || true
        echo 'Backup created'
    else
        echo 'No existing deployment to backup'
    fi
"
echo "✅ Backup completed"
echo ""

# Copy application files
echo "📤 Copying application files..."
echo "This may take a few minutes..."
rsync -avz --progress --delete dist/ $VPS_USER@$VPS_HOST:$VPS_APP_DIR/dist/
echo "✅ Application files copied"
echo ""

# Copy environment file
echo "⚙️  Copying environment variables..."
scp .env.production $VPS_USER@$VPS_HOST:$VPS_APP_DIR/.env.production
echo "✅ Environment variables copied"
echo ""

# Copy Nginx configuration
echo "🔧 Copying Nginx configuration..."
scp nginx-config.conf $VPS_USER@$VPS_HOST:/tmp/png-green-fees-nginx.conf
echo "✅ Nginx configuration copied"
echo ""

# Set permissions
echo "🔧 Setting file permissions..."
ssh -o PasswordAuthentication=yes $VPS_USER@$VPS_HOST "
    chown -R www-data:www-data $VPS_APP_DIR
    chmod -R 755 $VPS_APP_DIR
    chmod 600 $VPS_APP_DIR/.env.production
"
echo "✅ Permissions set"
echo ""

# Update Nginx configuration
echo "🔧 Updating Nginx configuration..."
ssh -o PasswordAuthentication=yes $VPS_USER@$VPS_HOST "
    cp /tmp/png-green-fees-nginx.conf /etc/nginx/sites-available/png-green-fees
    nginx -t && systemctl reload nginx
"
echo "✅ Nginx configuration updated"
echo ""

# Restart Nginx
echo "🔄 Restarting Nginx..."
ssh -o PasswordAuthentication=yes $VPS_USER@$VPS_HOST "systemctl restart nginx"
echo "✅ Nginx restarted"
echo ""

# Test deployment
echo "🧪 Testing deployment..."
if ssh -o PasswordAuthentication=yes $VPS_USER@$VPS_HOST "systemctl status nginx --no-pager -l" | grep -q "active (running)"; then
    echo "✅ Nginx is running"
else
    echo "⚠️  Nginx status unclear"
fi

# Count deployed files
FILE_COUNT=$(ssh -o PasswordAuthentication=yes $VPS_USER@$VPS_HOST "find $VPS_APP_DIR/dist -type f | wc -l")
echo "✅ Deployed $FILE_COUNT files"

# Test application
echo "🌐 Testing application..."
if curl -s -o /dev/null -w "%{http_code}" https://eywademo.cloud | grep -q "200"; then
    echo "✅ Application is responding"
else
    echo "⚠️  Application may not be responding"
fi

echo ""
echo "🎉 DEPLOYMENT COMPLETED!"
echo "========================"
echo ""
echo "🌐 Application URLs:"
echo "   • https://eywademo.cloud"
echo "   • https://www.eywademo.cloud"
echo ""
echo "🔐 Login Credentials:"
echo "   • Email: admin@example.com"
echo "   • Password: password123"
echo ""
echo "🧪 Next Steps:"
echo "   1. Open https://eywademo.cloud in a new incognito window"
echo "   2. Login with admin@example.com / password123"
echo "   3. Verify no blank screen appears"
echo "   4. Test all features"
echo ""
echo "🔧 If you need to troubleshoot:"
echo "   • SSH: ssh $VPS_USER@$VPS_HOST"
echo "   • Check logs: tail -f /var/log/nginx/error.log"
echo "   • Check files: ls -la $VPS_APP_DIR/dist/"
echo ""
echo "✅ The blank screen issue should now be resolved!"
