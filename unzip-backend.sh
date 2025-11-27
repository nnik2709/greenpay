#!/bin/bash

# Unzip Backend with Proper Permissions
# Run this script on the server via CloudPanel Terminal or SSH

echo "🔧 Unzipping Backend Files"
echo "=========================="
echo ""

# Configuration
BACKEND_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"
ZIP_FILE="backend.zip"
OWNER="eywademo-greenpay"
GROUP="eywademo-greenpay"

# Navigate to the parent directory
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud

echo "📍 Current directory: $(pwd)"
echo ""

# Check if zip file exists
if [ ! -f "$ZIP_FILE" ]; then
    echo "❌ Error: $ZIP_FILE not found in $(pwd)"
    echo ""
    echo "Please ensure the zip file is uploaded to:"
    echo "  /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/"
    exit 1
fi

echo "✅ Found $ZIP_FILE"
echo ""

# Create backup of existing backend
if [ -d "$BACKEND_DIR" ]; then
    echo "📦 Creating backup of existing backend..."
    BACKUP_NAME="backend-backup-$(date +%Y%m%d-%H%M%S)"
    mv "$BACKEND_DIR" "$BACKUP_NAME"
    echo "✅ Backup created: $BACKUP_NAME"
    echo ""
fi

# Unzip the file
echo "📂 Unzipping backend files..."
unzip -q "$ZIP_FILE"

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to unzip $ZIP_FILE"
    exit 1
fi

echo "✅ Files unzipped successfully"
echo ""

# Check if backend folder was created
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Error: Backend directory not found after unzip"
    echo "Looking for folders created..."
    ls -la
    exit 1
fi

echo "✅ Backend directory found"
echo ""

# Set proper ownership
echo "👤 Setting ownership to $OWNER:$GROUP..."
chown -R $OWNER:$GROUP "$BACKEND_DIR"

if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Could not set ownership (might need sudo)"
    echo "Run: sudo chown -R $OWNER:$GROUP $BACKEND_DIR"
else
    echo "✅ Ownership set successfully"
fi
echo ""

# Set proper permissions
echo "🔐 Setting file permissions..."

# Directories: 755 (rwxr-xr-x)
find "$BACKEND_DIR" -type d -exec chmod 755 {} \;

# Files: 644 (rw-r--r--)
find "$BACKEND_DIR" -type f -exec chmod 644 {} \;

# Make .sh files executable if any
find "$BACKEND_DIR" -name "*.sh" -exec chmod 755 {} \;

echo "✅ Permissions set successfully"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
cd "$BACKEND_DIR"

if [ -f "package.json" ]; then
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed successfully"
    else
        echo "❌ Error: Failed to install dependencies"
        exit 1
    fi
else
    echo "⚠️  Warning: package.json not found"
fi
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ .env file found"
    chmod 600 .env  # Secure permissions for .env
    echo "✅ .env permissions set to 600"
else
    echo "⚠️  Warning: .env file not found"
    echo "You may need to create it manually"
fi
echo ""

# Display directory structure
echo "📁 Backend directory structure:"
ls -la "$BACKEND_DIR"
echo ""

# Display routes folder
if [ -d "$BACKEND_DIR/routes" ]; then
    echo "📂 Routes folder:"
    ls -la "$BACKEND_DIR/routes"
    echo ""
fi

# Restart PM2
echo "🔄 Restarting backend API..."
pm2 restart greenpay-api

if [ $? -eq 0 ]; then
    echo "✅ Backend API restarted successfully"
else
    echo "⚠️  Could not restart via PM2, trying to start..."
    pm2 start server.js --name greenpay-api
fi
echo ""

# Show PM2 status
echo "📊 PM2 Status:"
pm2 status greenpay-api
echo ""

# Show logs
echo "📋 Recent logs:"
pm2 logs greenpay-api --lines 20 --nostream
echo ""

echo "=========================="
echo "✅ Deployment Complete!"
echo "=========================="
echo ""
echo "Next steps:"
echo "  1. Test the API: curl https://greenpay.eywademo.cloud/api/auth/verify"
echo "  2. Check logs: pm2 logs greenpay-api"
echo "  3. Test frontend: npm run dev (on local machine)"
echo ""
