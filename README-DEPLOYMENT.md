# PNG Green Fees - VPS Deployment Guide

This guide will help you deploy the PNG Green Fees application to your Hostinger VPS running Ubuntu 24.

## Prerequisites

- Hostinger VPS with Ubuntu 24
- Domain name pointing to your VPS IP
- SSH access to your VPS
- Basic knowledge of Linux commands

## Quick Deployment

### 1. Upload Files to VPS

Upload your project files to the VPS. You can use SCP, SFTP, or Git:

```bash
# Using SCP (from your local machine)
scp -r /path/to/greenpay user@your-vps-ip:/var/www/png-green-fees

# Or clone from Git (on VPS)
git clone https://github.com/your-username/greenpay.git /var/www/png-green-fees
```

### 2. Run Deployment Script

SSH into your VPS and run the deployment script:

```bash
ssh user@your-vps-ip
cd /var/www/png-green-fees
chmod +x deploy.sh
./deploy.sh
```

### 3. Configure Domain

Edit the Nginx configuration to use your domain:

```bash
sudo nano /etc/nginx/sites-available/png-green-fees
```

Replace `your-domain.com` with your actual domain name.

### 4. Set Up SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 5. Configure Environment Variables

```bash
cp env.production.example .env.production
nano .env.production
```

Add your Supabase credentials and other environment variables.

## Manual Deployment Steps

If you prefer to deploy manually:

### 1. System Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Application Setup

```bash
# Create directory
sudo mkdir -p /var/www/png-green-fees
sudo chown -R $USER:$USER /var/www/png-green-fees

# Navigate to directory
cd /var/www/png-green-fees

# Install dependencies
npm install

# Build application
npm run build
```

### 3. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
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
```

Start with PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Nginx Configuration

Create `/etc/nginx/sites-available/png-green-fees`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

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
```

Enable the site:

```bash
sudo ln -sf /etc/nginx/sites-available/png-green-fees /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## Updating the Application

To update your application:

```bash
cd /var/www/png-green-fees
chmod +x update.sh
./update.sh
```

Or manually:

```bash
cd /var/www/png-green-fees
npm install
npm run build
pm2 restart png-green-fees
```

## Useful Commands

### PM2 Commands
```bash
pm2 status                    # Check status
pm2 logs png-green-fees       # View logs
pm2 restart png-green-fees    # Restart app
pm2 stop png-green-fees       # Stop app
pm2 delete png-green-fees     # Delete app
```

### Nginx Commands
```bash
sudo systemctl status nginx   # Check status
sudo systemctl restart nginx  # Restart
sudo nginx -t                 # Test config
```

### SSL Certificate
```bash
sudo certbot certificates     # List certificates
sudo certbot renew           # Renew certificates
```

## Troubleshooting

### Check Application Logs
```bash
pm2 logs png-green-fees
```

### Check Nginx Logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check System Resources
```bash
htop
df -h
free -h
```

### Test Application
```bash
curl http://localhost:3000
curl http://your-domain.com
```

## Security Considerations

1. **Firewall**: Configure UFW to only allow necessary ports
2. **SSH**: Use key-based authentication
3. **Updates**: Keep system packages updated
4. **Monitoring**: Set up monitoring for your application
5. **Backups**: Regular backups of your application and database

## Performance Optimization

1. **CDN**: Consider using a CDN for static assets
2. **Caching**: Implement Redis for session storage
3. **Database**: Optimize database queries
4. **Monitoring**: Use PM2 monitoring or external services

## Support

If you encounter issues:
1. Check the logs first
2. Verify all services are running
3. Check firewall and DNS settings
4. Ensure all environment variables are set correctly

## ✅ DEPLOYMENT COMPLETE - WORKING STATUS

### Services Running:
- Nginx: Ports 80 (HTTP) and 443 (HTTPS)
- React App: Port 3000 via serve
- SSL: Let's Encrypt certificate with auto-renewal
- DNS: eywademo.cloud → 195.200.14.62

### Access URLs:
- https://eywademo.cloud ✅
- https://www.eywademo.cloud ✅
- HTTP redirects to HTTPS ✅

### Next Steps:
- Set up PM2 for process management
- Monitor application logs
- Set up monitoring and alerts
