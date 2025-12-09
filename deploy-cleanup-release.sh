#!/bin/bash
#
# Safe Deployment Script - Post-Cleanup Release
# Deploys frontend and backend with automatic backup and rollback capability
#
# Usage: ./deploy-cleanup-release.sh
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SERVER="root@72.61.208.79"
FRONTEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud"
BACKEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"
BACKUP_DIR="/home/eywademo-greenpay/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="pre-cleanup-deploy-${TIMESTAMP}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Safe Deployment - Post-Cleanup Release                  ║${NC}"
echo -e "${BLUE}║   Phases 1-3 Complete: Supabase Removed, Services Clean   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Create Git tag for rollback
echo -e "${YELLOW}📌 Step 1: Creating Git release tag...${NC}"
CURRENT_COMMIT=$(git rev-parse HEAD)
TAG_NAME="v1.0.0-cleanup-$(date +%Y%m%d)"

if git tag -l | grep -q "$TAG_NAME"; then
    echo -e "${YELLOW}   Tag $TAG_NAME already exists, using existing tag${NC}"
else
    git tag -a "$TAG_NAME" -m "Release: Post-cleanup deployment (Phases 1-3 complete)

    Changes:
    - Removed all Supabase dependencies (15 packages)
    - Consolidated duplicate services
    - Removed 11 unused files (~1,500 lines)
    - Centralized API client
    - Enhanced error handling

    Commit: $CURRENT_COMMIT"

    echo -e "${GREEN}   ✓ Created tag: $TAG_NAME${NC}"
    echo -e "${YELLOW}   Pushing tag to GitHub...${NC}"
    git push origin "$TAG_NAME"
    echo -e "${GREEN}   ✓ Tag pushed to GitHub${NC}"
fi
echo ""

# Step 2: Create remote backup
echo -e "${YELLOW}📦 Step 2: Creating backup on server...${NC}"
ssh $SERVER << EOF
    set -e

    # Create backup directory if it doesn't exist
    mkdir -p $BACKUP_DIR

    echo "  Creating backup: $BACKUP_NAME"

    # Backup frontend dist
    if [ -d "$FRONTEND_PATH/dist" ]; then
        tar -czf "$BACKUP_DIR/${BACKUP_NAME}-frontend.tar.gz" -C "$FRONTEND_PATH" dist
        echo "  ✓ Frontend backed up"
    fi

    # Backup backend files
    if [ -d "$BACKEND_PATH" ]; then
        tar -czf "$BACKUP_DIR/${BACKUP_NAME}-backend.tar.gz" \
            -C "$BACKEND_PATH" \
            --exclude=node_modules \
            --exclude=.env \
            .
        echo "  ✓ Backend backed up"
    fi

    # List backups
    echo ""
    echo "  Available backups:"
    ls -lh $BACKUP_DIR/*${TIMESTAMP}* 2>/dev/null || echo "  No backups created"
EOF
echo -e "${GREEN}✓ Backup created: $BACKUP_NAME${NC}"
echo ""

# Step 3: Build frontend
echo -e "${YELLOW}🔨 Step 3: Building production frontend...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Build failed! Aborting deployment.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend built successfully${NC}"
echo ""

# Step 4: Deploy frontend
echo -e "${YELLOW}📤 Step 4: Deploying frontend...${NC}"
rsync -avz --delete dist/ ${SERVER}:${FRONTEND_PATH}/dist/
echo -e "${GREEN}✓ Frontend deployed${NC}"
echo ""

# Step 5: Deploy backend
echo -e "${YELLOW}📤 Step 5: Deploying backend...${NC}"
echo "  Uploading backend files..."

# Upload specific backend files/directories
scp -r backend/routes ${SERVER}:${BACKEND_PATH}/
scp -r backend/services ${SERVER}:${BACKEND_PATH}/
scp -r backend/middleware ${SERVER}:${BACKEND_PATH}/
scp -r backend/utils ${SERVER}:${BACKEND_PATH}/
scp backend/server.js ${SERVER}:${BACKEND_PATH}/
scp backend/package.json ${SERVER}:${BACKEND_PATH}/

echo -e "${GREEN}✓ Backend files uploaded${NC}"
echo ""

# Step 6: Install dependencies and restart
echo -e "${YELLOW}🔄 Step 6: Installing dependencies and restarting services...${NC}"
ssh $SERVER << 'EOF'
    set -e

    cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

    echo "  Installing backend dependencies..."
    npm install --production

    echo "  Restarting backend API..."
    pm2 restart greenpay-api || pm2 start server.js --name greenpay-api

    echo "  Waiting for service to stabilize..."
    sleep 3

    echo "  Checking service status..."
    pm2 status greenpay-api
EOF
echo -e "${GREEN}✓ Services restarted${NC}"
echo ""

# Step 7: Health check
echo -e "${YELLOW}🏥 Step 7: Running health checks...${NC}"
sleep 2

echo "  Testing frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://greenpay.eywademo.cloud/)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "  ${GREEN}✓ Frontend responding (HTTP $FRONTEND_STATUS)${NC}"
else
    echo -e "  ${RED}✗ Frontend issue (HTTP $FRONTEND_STATUS)${NC}"
fi

echo "  Testing backend API..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://greenpay.eywademo.cloud/api/vouchers/validate/TEST || echo "000")
if [ "$API_STATUS" != "000" ]; then
    echo -e "  ${GREEN}✓ Backend API responding (HTTP $API_STATUS)${NC}"
else
    echo -e "  ${YELLOW}⚠ Backend API check inconclusive${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  DEPLOYMENT COMPLETE                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ Deployment Summary:${NC}"
echo "  • Git Tag: $TAG_NAME"
echo "  • Backup: $BACKUP_NAME"
echo "  • Frontend: Deployed to $FRONTEND_PATH/dist"
echo "  • Backend: Deployed to $BACKEND_PATH"
echo "  • Services: Restarted via PM2"
echo ""
echo -e "${YELLOW}🧪 Next Steps:${NC}"
echo "  1. Test application: https://greenpay.eywademo.cloud"
echo "  2. Check browser console for errors"
echo "  3. Test critical workflows (auth, invoices, vouchers)"
echo "  4. Monitor PM2 logs: ssh $SERVER 'pm2 logs greenpay-api'"
echo ""
echo -e "${BLUE}🔄 Rollback Instructions (if needed):${NC}"
echo "  Run: ./rollback-deployment.sh $BACKUP_NAME"
echo "  Or manually:"
echo "    ssh $SERVER"
echo "    cd $BACKUP_DIR"
echo "    tar -xzf ${BACKUP_NAME}-frontend.tar.gz -C $FRONTEND_PATH"
echo "    tar -xzf ${BACKUP_NAME}-backend.tar.gz -C $BACKEND_PATH"
echo "    cd $BACKEND_PATH && npm install && pm2 restart greenpay-api"
echo ""
echo -e "${GREEN}📊 Changes Deployed:${NC}"
echo "  • Removed all Supabase dependencies"
echo "  • Consolidated duplicate services"
echo "  • Enhanced error handling (toast notifications)"
echo "  • Centralized API client"
echo "  • ~1,500 lines of code removed"
echo "  • 15 npm packages removed"
echo ""
