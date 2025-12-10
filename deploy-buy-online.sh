#!/bin/bash
#
# Deploy Buy Online Feature
# Deploys frontend (dist) and backend routes
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

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Deploy Buy Online Feature                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Deploy Frontend
echo -e "${YELLOW}📤 Step 1: Deploying frontend...${NC}"
rsync -avz --delete dist/ ${SERVER}:${FRONTEND_PATH}/dist/
echo -e "${GREEN}✓ Frontend deployed${NC}"
echo ""

# Step 2: Deploy Backend Files
echo -e "${YELLOW}📤 Step 2: Deploying backend files...${NC}"

# Upload new route
scp backend/routes/publicPurchase.js ${SERVER}:${BACKEND_PATH}/routes/

# Upload updated server.js
scp backend/server.js ${SERVER}:${BACKEND_PATH}/

echo -e "${GREEN}✓ Backend files uploaded${NC}"
echo ""

# Step 3: Restart Backend Service
echo -e "${YELLOW}🔄 Step 3: Restarting backend service...${NC}"
ssh $SERVER << 'EOF'
    cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
    pm2 restart greenpay-api
    sleep 2
    pm2 status greenpay-api
EOF
echo -e "${GREEN}✓ Backend service restarted${NC}"
echo ""

# Step 4: Health Check
echo -e "${YELLOW}🏥 Step 4: Running health checks...${NC}"
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
echo -e "${BLUE}║              DEPLOYMENT COMPLETE                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ Deployment Summary:${NC}"
echo "  • Frontend: Deployed with Buy Online feature"
echo "  • Backend: New route /api/public/purchase"
echo "  • Service: PM2 restarted"
echo ""
echo -e "${YELLOW}🧪 Test the feature:${NC}"
echo "  1. Visit: https://greenpay.eywademo.cloud/login"
echo "  2. Click: '🛒 Buy Online' button"
echo "  3. Test purchase flow"
echo ""
echo -e "${BLUE}📝 Notes:${NC}"
echo "  • Buy Online link appears below login form"
echo "  • No authentication required for /buy-online"
echo "  • Backend endpoint: POST /api/public/purchase"
echo "  • Email service may need configuration"
echo ""
