#!/bin/bash

# Deploy Passport Creation Fix to Production
# Fixes column name mismatch (snake_case vs camelCase)

echo "========================================="
echo "Deploying Passport Creation Fix"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Server details
SERVER="root@72.61.208.79"
BACKEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

echo -e "${BLUE}Step 1: Copying updated backend route to server...${NC}"
scp backend/routes/passports.js $SERVER:$BACKEND_PATH/routes/

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ File copied successfully${NC}"
else
  echo -e "${RED}✗ File copy failed${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}Step 2: Restarting PM2 backend process...${NC}"
ssh $SERVER "cd $BACKEND_PATH && pm2 restart greenpay-api"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Backend restarted successfully${NC}"
else
  echo -e "${RED}✗ Backend restart failed${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}Step 3: Checking PM2 status...${NC}"
ssh $SERVER "pm2 status greenpay-api"

echo ""
echo "========================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "========================================="
echo ""
echo "The passport creation fix is now deployed."
echo ""
echo "Test it now:"
echo "  1. Go to http://localhost:3000"
echo "  2. Login as agent@greenpay.com"
echo "  3. Navigate to Individual Purchase"
echo "  4. Create a voucher"
echo "  5. Should work without 500 error!"
echo ""
