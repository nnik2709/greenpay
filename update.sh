#!/bin/bash

# PNG Green Fees Update Script
# Run this script to update your deployed application

set -e

echo "🔄 Updating PNG Green Fees application..."

# Navigate to application directory
cd /var/www/png-green-fees

# Pull latest changes (if using git)
# echo "📥 Pulling latest changes..."
# git pull origin main

# Install/update dependencies
echo "📦 Updating dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Restart PM2 process
echo "🔄 Restarting application..."
pm2 restart png-green-fees

# Reload Nginx (if needed)
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Update completed successfully!"
echo "🌐 Your application is now updated and running"
