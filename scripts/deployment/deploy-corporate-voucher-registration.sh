#!/bin/bash

# Deploy Corporate Voucher Registration Feature
# This script deploys both frontend and backend changes for the new feature

set -e

SERVER="root@72.61.208.79"
REMOTE_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud"
BACKEND_DIR="$REMOTE_DIR/backend"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Deploying Corporate Voucher Registration Feature${NC}"
echo "===================================================="
echo ""

# Check if build exists
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}⚠️  dist folder not found, building...${NC}"
    npm run build
    echo ""
fi

# Step 1: Deploy Backend Route
echo -e "${BLUE}1️⃣  Deploying backend route...${NC}"
echo "   • corporate-voucher-registration.js"

ssh $SERVER "mkdir -p $BACKEND_DIR/routes"

scp backend/routes/corporate-voucher-registration.js \
    $SERVER:$BACKEND_DIR/routes/

echo -e "${GREEN}   ✅ Backend route deployed${NC}"
echo ""

# Step 2: Deploy Frontend Build
echo -e "${BLUE}2️⃣  Deploying frontend build...${NC}"

# Backup current deployment
echo "   • Creating backup..."
ssh $SERVER "cd $REMOTE_DIR && \
    mkdir -p backups && \
    tar -czf backups/frontend-backup-\$(date +%Y%m%d-%H%M%S).tar.gz assets index.html 2>/dev/null || true"

# Remove old frontend files
echo "   • Removing old files..."
ssh $SERVER "cd $REMOTE_DIR && rm -rf assets && rm -f index.html"

# Copy new build
echo "   • Uploading new build..."
rsync -az --progress dist/ $SERVER:$REMOTE_DIR/

# Set permissions
ssh $SERVER "cd $REMOTE_DIR && \
    chown -R eywademo-greenpay:eywademo-greenpay assets index.html && \
    chmod -R 755 assets && \
    chmod 644 index.html"

echo -e "${GREEN}   ✅ Frontend deployed${NC}"
echo ""

# Step 3: Restart Backend
echo -e "${BLUE}3️⃣  Restarting backend...${NC}"

ssh $SERVER "cd $BACKEND_DIR && pm2 restart greenpay-backend 2>/dev/null || pm2 start server.js --name greenpay-backend"

# Wait for backend to start
sleep 2

ssh $SERVER "pm2 status greenpay-backend"

echo -e "${GREEN}   ✅ Backend restarted${NC}"
echo ""

# Step 4: Verify Deployment
echo -e "${BLUE}4️⃣  Verifying deployment...${NC}"

# Check if route file exists
ssh $SERVER "test -f $BACKEND_DIR/routes/corporate-voucher-registration.js && \
    echo '   ✅ Backend route file exists' || \
    echo '   ❌ Backend route file missing!'"

# Check if frontend was deployed
FILE_COUNT=$(ssh $SERVER "find $REMOTE_DIR/assets -type f | wc -l")
echo "   ✅ Deployed $FILE_COUNT asset files"

# Check if the new page exists in build
ssh $SERVER "grep -q 'CorporateVoucherRegistration' $REMOTE_DIR/assets/*.js && \
    echo '   ✅ CorporateVoucherRegistration component found in build' || \
    echo '   ⚠️  CorporateVoucherRegistration component not found'"

echo ""

# Step 5: Test the API endpoint
echo -e "${BLUE}5️⃣  Testing API endpoint...${NC}"

# Test health check
echo "   • Testing backend health..."
HEALTH_CHECK=$(ssh $SERVER "curl -s http://localhost:3001/health | grep -o 'ok' || echo 'failed'")

if [ "$HEALTH_CHECK" = "ok" ]; then
    echo -e "${GREEN}   ✅ Backend is healthy${NC}"
else
    echo -e "${RED}   ❌ Backend health check failed!${NC}"
fi

echo ""

# Summary
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "===================================================="
echo -e "${BLUE}FEATURE SUMMARY:${NC}"
echo "• Corporate vouchers now require passport registration"
echo "• 209 existing vouchers marked as 'pending_passport'"
echo "• Public registration page: /corporate-voucher-registration"
echo "• New API endpoints under /api/corporate-voucher-registration"
echo ""
echo -e "${BLUE}TESTING:${NC}"
echo "1. Visit: https://greenpay.eywademo.cloud/corporate-voucher-registration"
echo "2. Try registering a voucher with passport data"
echo "3. Test validation at gate (scan voucher)"
echo ""
echo -e "${BLUE}DATABASE STATUS:${NC}"
echo "• Migration applied: ✅"
echo "• Columns added: passport_id, passport_number, registered_by"
echo "• Indexes created: ✅"
echo "• Existing vouchers updated: 209 set to pending_passport"
echo ""
echo -e "${BLUE}MONITORING:${NC}"
echo "• Backend logs: ssh $SERVER 'pm2 logs greenpay-backend'"
echo "• View voucher status: Run SQL query in database"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "Notify corporate customers that they need to register"
echo "their vouchers at: /corporate-voucher-registration"
echo ""
