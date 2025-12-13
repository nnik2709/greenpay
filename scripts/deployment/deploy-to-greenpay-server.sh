#!/bin/bash

# Deploy GreenPay Frontend to Production Server
# This script copies the built dist files to the production server

set -e

# Configuration
SERVER="root@72.61.208.79"
REMOTE_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud"
LOCAL_DIST="dist"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Deploying GreenPay Frontend to Production${NC}"
echo "=============================================="
echo ""

# Check if dist folder exists
if [ ! -d "$LOCAL_DIST" ]; then
    echo -e "${YELLOW}❌ dist folder not found!${NC}"
    echo "Please run 'npm run build' first"
    exit 1
fi

echo -e "${GREEN}✅ Build files found${NC}"
echo ""

# Backup current deployment on server
echo -e "${BLUE}📦 Creating backup of current deployment...${NC}"
ssh $SERVER "cd $REMOTE_DIR && \
    mkdir -p backups && \
    tar -czf backups/frontend-backup-\$(date +%Y%m%d-%H%M%S).tar.gz assets index.html 2>/dev/null || echo 'No previous deployment to backup'"

echo -e "${GREEN}✅ Backup created${NC}"
echo ""

# Remove old frontend files (but keep backend folder)
echo -e "${BLUE}🗑️  Removing old frontend files...${NC}"
ssh $SERVER "cd $REMOTE_DIR && \
    rm -rf assets && \
    rm -f index.html"

echo -e "${GREEN}✅ Old files removed${NC}"
echo ""

# Copy new build files
echo -e "${BLUE}📤 Uploading new build files...${NC}"
rsync -avz --progress $LOCAL_DIST/ $SERVER:$REMOTE_DIR/

echo -e "${GREEN}✅ Files uploaded successfully${NC}"
echo ""

# Set proper permissions
echo -e "${BLUE}🔐 Setting file permissions...${NC}"
ssh $SERVER "cd $REMOTE_DIR && \
    chown -R eywademo-greenpay:eywademo-greenpay assets index.html && \
    chmod -R 755 assets && \
    chmod 644 index.html"

echo -e "${GREEN}✅ Permissions set${NC}"
echo ""

# Verify deployment
echo -e "${BLUE}🔍 Verifying deployment...${NC}"
FILE_COUNT=$(ssh $SERVER "find $REMOTE_DIR/assets -type f | wc -l")
echo "Deployed $FILE_COUNT asset files"

# Check if index.html exists
ssh $SERVER "test -f $REMOTE_DIR/index.html && echo '✅ index.html deployed' || echo '❌ index.html missing'"

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "🌐 Application URL: https://greenpay.eywademo.cloud"
echo ""
echo "🧪 Test the following:"
echo "  1. Open https://greenpay.eywademo.cloud in browser"
echo "  2. Check console for errors (should be clean)"
echo "  3. Test user management page"
echo "  4. Verify password reset API is available"
echo ""
echo "📋 Useful commands:"
echo "  • View backend logs: ssh $SERVER 'pm2 logs greenpay-api'"
echo "  • Restore backup: ssh $SERVER 'cd $REMOTE_DIR/backups && ls -lt'"
echo ""
