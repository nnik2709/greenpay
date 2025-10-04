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

Create `.env.production` on VPS with:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
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
