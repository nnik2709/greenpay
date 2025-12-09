#!/bin/bash
#
# Emergency Rollback Script
# Restores previous version from backup or GitHub tag
#
# Usage:
#   ./rollback-deployment.sh [backup_name]
#   ./rollback-deployment.sh pre-cleanup-deploy-20251209_120000
#
# Or restore from GitHub:
#   ./rollback-deployment.sh --from-git v1.0.0-cleanup-20251209
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SERVER="root@72.61.208.79"
FRONTEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud"
BACKEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"
BACKUP_DIR="/home/eywademo-greenpay/backups"

echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║              EMERGENCY ROLLBACK PROCEDURE                  ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check arguments
if [ "$1" = "--from-git" ]; then
    # Rollback from Git tag
    if [ -z "$2" ]; then
        echo -e "${RED}✗ Error: Git tag required${NC}"
        echo "  Usage: ./rollback-deployment.sh --from-git <tag>"
        echo ""
        echo "Available tags:"
        git tag -l "v1.0.0-cleanup-*"
        exit 1
    fi

    GIT_TAG="$2"
    echo -e "${YELLOW}Rolling back from Git tag: $GIT_TAG${NC}"
    echo ""

    # Checkout tag
    echo -e "${YELLOW}1. Checking out tag $GIT_TAG...${NC}"
    git checkout "$GIT_TAG"

    # Build
    echo -e "${YELLOW}2. Building from tag...${NC}"
    npm install
    npm run build

    # Deploy
    echo -e "${YELLOW}3. Deploying frontend...${NC}"
    rsync -avz --delete dist/ ${SERVER}:${FRONTEND_PATH}/dist/

    echo -e "${YELLOW}4. Deploying backend...${NC}"
    scp -r backend/routes backend/services backend/middleware backend/utils backend/server.js backend/package.json ${SERVER}:${BACKEND_PATH}/

    echo -e "${YELLOW}5. Restarting services...${NC}"
    ssh $SERVER << 'EOF'
        cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
        npm install --production
        pm2 restart greenpay-api
EOF

    # Return to main branch
    git checkout main

    echo -e "${GREEN}✓ Rollback from Git tag complete${NC}"

elif [ -z "$1" ]; then
    # List available backups
    echo -e "${YELLOW}Available backups on server:${NC}"
    ssh $SERVER "ls -lh $BACKUP_DIR/*.tar.gz 2>/dev/null | tail -10" || echo "No backups found"
    echo ""
    echo "Usage: ./rollback-deployment.sh <backup_name>"
    echo "Example: ./rollback-deployment.sh pre-cleanup-deploy-20251209_120000"
    echo ""
    echo "Or rollback from Git:"
    echo "  ./rollback-deployment.sh --from-git v1.0.0-cleanup-20251209"
    exit 1

else
    # Rollback from backup
    BACKUP_NAME="$1"
    echo -e "${YELLOW}Rolling back from backup: $BACKUP_NAME${NC}"
    echo ""

    # Verify backup exists
    echo -e "${YELLOW}1. Verifying backup exists...${NC}"
    ssh $SERVER << EOF
        if [ ! -f "$BACKUP_DIR/${BACKUP_NAME}-frontend.tar.gz" ]; then
            echo "  ✗ Frontend backup not found"
            exit 1
        fi
        if [ ! -f "$BACKUP_DIR/${BACKUP_NAME}-backend.tar.gz" ]; then
            echo "  ✗ Backend backup not found"
            exit 1
        fi
        echo "  ✓ Backup files found"
EOF

    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Backup not found. Aborting.${NC}"
        exit 1
    fi

    # Restore backup
    echo -e "${YELLOW}2. Restoring backup...${NC}"
    ssh $SERVER << EOF
        set -e

        echo "  Restoring frontend..."
        rm -rf $FRONTEND_PATH/dist
        tar -xzf "$BACKUP_DIR/${BACKUP_NAME}-frontend.tar.gz" -C "$FRONTEND_PATH"

        echo "  Restoring backend..."
        cd $BACKEND_PATH
        tar -xzf "$BACKUP_DIR/${BACKUP_NAME}-backend.tar.gz" -C "$BACKEND_PATH"

        echo "  Installing dependencies..."
        npm install --production

        echo "  Restarting services..."
        pm2 restart greenpay-api

        echo "  ✓ Rollback complete"
EOF

    echo -e "${GREEN}✓ Rollback from backup complete${NC}"
fi

# Health check
echo ""
echo -e "${YELLOW}3. Running health checks...${NC}"
sleep 2

FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://greenpay.eywademo.cloud/)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "  ${GREEN}✓ Frontend responding (HTTP $FRONTEND_STATUS)${NC}"
else
    echo -e "  ${RED}✗ Frontend issue (HTTP $FRONTEND_STATUS)${NC}"
fi

API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://greenpay.eywademo.cloud/api/vouchers/validate/TEST || echo "000")
if [ "$API_STATUS" != "000" ]; then
    echo -e "  ${GREEN}✓ Backend API responding (HTTP $API_STATUS)${NC}"
else
    echo -e "  ${YELLOW}⚠ Backend API check inconclusive${NC}"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  ROLLBACK COMPLETE                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "  1. Test application: https://greenpay.eywademo.cloud"
echo "  2. Verify functionality is restored"
echo "  3. Check logs: ssh $SERVER 'pm2 logs greenpay-api'"
echo ""
