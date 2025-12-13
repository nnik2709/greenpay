#!/bin/bash

# PNG Green Fees - Production Build Deployment Script
# This script creates a production-ready deployment package

echo "🚀 Creating PNG Green Fees Production Build Package..."

# Create timestamp for the build
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BUILD_NAME="png-green-fees-production-${TIMESTAMP}"

# Create deployment directory
mkdir -p "deployments/${BUILD_NAME}"

# Copy production build
echo "📦 Copying production build files..."
cp -r dist/* "deployments/${BUILD_NAME}/"

# Copy necessary server files
echo "📄 Copying server configuration files..."
cp ecosystem.config.cjs "deployments/${BUILD_NAME}/"
cp package.json "deployments/${BUILD_NAME}/"
cp package-lock.json "deployments/${BUILD_NAME}/"

# Create production environment file template
echo "⚙️ Creating production environment template..."
cat > "deployments/${BUILD_NAME}/.env.production.example" << 'EOF'
# PNG Green Fees Production Environment Variables
# Copy this file to .env.production and update with your values

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Admin Configuration
VITE_ADMIN_EMAIL=admin@example.com

# API Configuration (if using separate API server)
VITE_API_URL=http://localhost:3001/api

# Application Configuration
VITE_APP_NAME=PNG Green Fees System
VITE_APP_VERSION=1.0.0
EOF

# Create deployment instructions
echo "📋 Creating deployment instructions..."
cat > "deployments/${BUILD_NAME}/DEPLOYMENT_INSTRUCTIONS.md" << 'EOF'
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
EOF

# Create a simple server.js for serving the static files
echo "🌐 Creating simple server for static file serving..."
cat > "deployments/${BUILD_NAME}/server.js" << 'EOF'
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 PNG Green Fees System running on port ${PORT}`);
  console.log(`📱 Access the application at http://localhost:${PORT}`);
});
EOF

# Create package.json for the deployment
echo "📦 Creating deployment package.json..."
cat > "deployments/${BUILD_NAME}/package.json" << 'EOF'
{
  "name": "png-green-fees-production",
  "version": "1.0.0",
  "description": "PNG Green Fees System - Production Build",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "serve": "npx serve -s . -l 3000"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Create a tar.gz package for easy deployment
echo "📦 Creating deployment package..."
cd deployments
tar -czf "${BUILD_NAME}.tar.gz" "${BUILD_NAME}/"
cd ..

echo "✅ Production build package created successfully!"
echo "📁 Location: deployments/${BUILD_NAME}/"
echo "📦 Archive: deployments/${BUILD_NAME}.tar.gz"
echo ""
echo "🚀 Ready for deployment to webserver!"
echo ""
echo "To deploy:"
echo "1. Upload deployments/${BUILD_NAME}.tar.gz to your server"
echo "2. Extract: tar -xzf ${BUILD_NAME}.tar.gz"
echo "3. Follow DEPLOYMENT_INSTRUCTIONS.md"
echo ""
echo "Build includes:"
echo "✅ All new RPC-based components"
echo "✅ Login History with export functionality"
echo "✅ Settings and Profile management"
echo "✅ Production-optimized assets"
echo "✅ Fixed React Hook errors"
