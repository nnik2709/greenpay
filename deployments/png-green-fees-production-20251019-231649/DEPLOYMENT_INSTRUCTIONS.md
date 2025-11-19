# PNG Green Fees Production Deployment Instructions

## Prerequisites
- Node.js 18+ installed
- PM2 process manager installed
- Nginx web server configured
- Supabase database set up

## Deployment Steps

### 1. Upload Files
Upload all files in this directory to your web server (e.g., `/var/www/png-green-fees/`)

### 2. Install Dependencies
```bash
cd /var/www/png-green-fees/
npm install --production
```

### 3. Configure Environment
```bash
# Copy and edit environment file
cp .env.production.example .env.production
nano .env.production
```

### 4. Configure Nginx
Add this configuration to your Nginx sites-available:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/png-green-fees;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 5. Start Application
```bash
# If using PM2 for API server
pm2 start ecosystem.config.cjs

# Or serve static files with a simple server
npx serve -s . -l 3000
```

### 6. Verify Deployment
- Visit your domain
- Test login functionality
- Verify all pages load correctly
- Check console for errors

## Features Included
✅ View Login History with RPC functions
✅ Export Reports functionality
✅ Settings Management
✅ User Profile Management
✅ Fixed React Hook errors
✅ Production-optimized build
✅ All new RPC-based components

## Support
For issues or questions, check the console logs and ensure all environment variables are correctly set.
