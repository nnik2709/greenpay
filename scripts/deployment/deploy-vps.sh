#!/bin/bash

# PNG Green Fees - VPS Deployment Script
# Run this script on your Hostinger VPS to deploy the application

set -e  # Exit on any error

VPS_IP="195.200.14.62"
APP_NAME="png-green-fees"
APP_DIR="/var/www/$APP_NAME"
NGINX_SITE="png-green-fees"
DOMAIN="eywademo.cloud"

echo "🚀 Starting deployment to VPS ($VPS_IP)..."

# Check if we're running on the VPS
if [ "$(hostname -I | awk '{print $1}')" != "$VPS_IP" ]; then
    echo "⚠️  This script should be run on the VPS ($VPS_IP)"
    echo "   Connect via: ssh root@$VPS_IP"
    echo "   Then run this script on the VPS"
    exit 1
fi

echo "📋 Updating system packages..."
apt update && apt upgrade -y

echo "📦 Installing required packages..."
apt install -y nginx certbot python3-certbot-nginx ufw

echo "🔧 Setting up application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

echo "📁 Setting up directory permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/$NGINX_SITE << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN $VPS_IP;
    
    root $APP_DIR/dist;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    
    # Handle client-side routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security
    location ~ /\. {
        deny all;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "🔧 Testing Nginx configuration..."
nginx -t

echo "🔄 Restarting Nginx..."
systemctl restart nginx
systemctl enable nginx

echo "🔥 Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'

echo "🔒 Setting up SSL certificate..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

echo "📝 Setting up environment variables..."
cat > $APP_DIR/.env.production << 'EOF'
# Production Environment Variables
NODE_ENV=production

# Supabase Configuration
# Replace these with your actual Supabase credentials
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
EOF

echo "🔧 Setting environment file permissions..."
chown www-data:www-data $APP_DIR/.env.production
chmod 600 $APP_DIR/.env.production

echo "✅ Deployment completed successfully!"
echo ""
echo "🎯 Application is now available at:"
echo "   🌐 https://$DOMAIN"
echo "   🌐 https://www.$DOMAIN"
echo ""
echo "📋 Next steps:"
echo "1. Upload your built application files to: $APP_DIR/dist/"
echo "2. Set proper file permissions: chown -R www-data:www-data $APP_DIR"
echo "3. Test the application in your browser"
echo ""
echo "🔧 Useful commands:"
echo "   - Check Nginx status: systemctl status nginx"
echo "   - View Nginx logs: tail -f /var/log/nginx/error.log"
echo "   - Restart Nginx: systemctl restart nginx"
echo "   - Check SSL certificate: certbot certificates"
