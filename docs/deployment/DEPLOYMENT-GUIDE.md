# PNG Green Fees - Production Deployment Guide

This guide covers deploying the PNG Green Fees application to your Hostinger VPS.

## 🚀 Quick Start

### 1. Local Development Setup
```bash
# Install dependencies
npm install

# Run tests
npm run test

# Build for production
npm run build
```

### 2. VPS Deployment

#### Option A: Automated Deployment (Recommended)
```bash
# 1. Build the application locally
./build-production.sh

# 2. Upload to VPS
./upload-to-vps.sh
```

#### Option B: Manual Deployment
```bash
# 1. Connect to VPS
ssh root@195.200.14.62

# 2. Run deployment script
./deploy-vps.sh

# 3. Upload your built files (from local machine)
scp -r dist/ root@195.200.14.62:/var/www/png-green-fees/
```

## 📋 Prerequisites

### Local Machine
- Node.js 18+ and npm
- Git
- SSH access to VPS

### VPS Requirements
- Ubuntu 20.04+ (Hostinger VPS)
- Root access
- Domain pointing to VPS IP (195.200.14.62)

## 🔧 Scripts Overview

### `build-production.sh`
- Builds the application for production
- Installs production dependencies
- Creates optimized dist/ folder

### `deploy-vps.sh`
- Sets up Nginx configuration
- Configures SSL with Let's Encrypt
- Sets up firewall rules
- **Run this ONCE on the VPS**

### `upload-to-vps.sh`
- Uploads built application to VPS
- Sets proper permissions
- Restarts Nginx
- **Run this from your local machine**

### `update-vps.sh`
- Updates application on VPS
- Creates backups
- Restarts services
- **Run this on the VPS for updates**

## 🌐 Application URLs

- **Production**: https://eywademo.cloud
- **WWW**: https://www.eywademo.cloud
- **IP**: http://195.200.14.62

## 🔒 Security Features

- SSL/TLS encryption (Let's Encrypt)
- Security headers (XSS, CSRF protection)
- Firewall configuration (UFW)
- Gzip compression
- Static asset caching

## 🧪 Testing

### Test Local Development
```bash
# Test local development environment
./test-deployment.sh local
# or
npm run test:local
```

### Test Production Environment
```bash
# Test production environment
./test-deployment.sh remote
# or
npm run test:production
```

### Test Both Environments
```bash
# Test both local and production
./test-deployment.sh all
```

### Available Test Commands
- `npm run test` - Default test (localhost)
- `npm run test:local` - Explicit local testing
- `npm run test:remote` - Test production environment
- `npm run test:production` - Same as remote
- `npm run test:ui` - Interactive test UI
- `npm run test:headed` - Run tests with browser visible
- `npm run test:report` - View HTML test report

## 📊 Monitoring & Maintenance

### Check Application Status
```bash
# On VPS
systemctl status nginx
curl -I https://eywademo.cloud
```

### View Logs
```bash
# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx -f
```

### Update Application
```bash
# 1. Build new version locally
npm run build

# 2. Upload to VPS
./upload-to-vps.sh

# 3. Or update on VPS
ssh root@195.200.14.62
./update-vps.sh
```

## 🛠️ Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   ```bash
   # Check Nginx status
   systemctl status nginx
   
   # Check if files exist
   ls -la /var/www/png-green-fees/dist/
   ```

2. **SSL Certificate Issues**
   ```bash
   # Renew certificate
   certbot renew
   
   # Check certificate status
   certbot certificates
   ```

3. **Permission Issues**
   ```bash
   # Fix permissions
   chown -R www-data:www-data /var/www/png-green-fees/
   chmod -R 755 /var/www/png-green-fees/
   ```

### File Locations

- **Application**: `/var/www/png-green-fees/dist/`
- **Nginx Config**: `/etc/nginx/sites-available/png-green-fees`
- **SSL Certs**: `/etc/letsencrypt/live/eywademo.cloud/`
- **Logs**: `/var/log/nginx/`

## 🔄 Environment Variables

### Option 1: Automated Setup (Recommended)
```bash
# On VPS, run the environment setup script
ssh root@195.200.14.62
./setup-env.sh
```

### Option 2: Manual Setup
Create `.env.production` on VPS with:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Option 3: Local Build with Environment Variables
```bash
# Create .env.production locally
echo "VITE_SUPABASE_URL=https://your-project-ref.supabase.co" > .env.production
echo "VITE_SUPABASE_ANON_KEY=your_anon_key_here" >> .env.production

# Build with environment variables
./build-production.sh

# Upload (environment variables will be included)
./upload-to-vps.sh
```

## 📈 Performance Optimization

- Gzip compression enabled
- Static assets cached for 1 year
- Optimized build with Vite
- Security headers configured

## 🆘 Support

If you encounter issues:
1. Check the logs (see Monitoring section)
2. Verify file permissions
3. Test Nginx configuration: `nginx -t`
4. Check SSL certificate: `certbot certificates`

## 📝 Notes

- The application uses client-side routing (React Router)
- Nginx is configured to serve `index.html` for all routes
- SSL certificate auto-renews via cron job
- Firewall allows only SSH and HTTP/HTTPS traffic
