#!/bin/bash

# PNG Green Fees Deployment Script for Ubuntu 24 VPS
# Run this script on your VPS server

set -e

echo "🚀 Starting PNG Green Fees deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Install Certbot for SSL
echo "📦 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/png-green-fees
sudo chown -R $USER:$USER /var/www/png-green-fees

# Install application dependencies
echo "📦 Installing application dependencies..."
cd /var/www/png-green-fees
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Create PM2 ecosystem file
echo "⚙️ Creating PM2 configuration..."
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'png-green-fees',
    script: 'npm',
    args: 'run preview',
    cwd: '/var/www/png-green-fees',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Create Nginx configuration
echo "⚙️ Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/png-green-fees << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your actual domain

    root /var/www/png-green-fees/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
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
echo "🔗 Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/png-green-fees /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Start services
echo "🚀 Starting services..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Start PM2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update your domain name in /etc/nginx/sites-available/png-green-fees"
echo "2. Run: sudo certbot --nginx -d your-domain.com -d www.your-domain.com"
echo "3. Your application will be available at http://your-domain.com"
echo ""
echo "🔧 Useful commands:"
echo "- Check PM2 status: pm2 status"
echo "- View logs: pm2 logs png-green-fees"
echo "- Restart app: pm2 restart png-green-fees"
echo "- Check Nginx status: sudo systemctl status nginx"
