#!/bin/bash

#
# DAY 3 SECURITY FIXES DEPLOYMENT SCRIPT
# ========================================
#
# This script deploys Day 3 security hardening:
# - Helmet security headers
# - Input validation schemas
# - Audit logging system
# - Database migration for audit_logs table
#

set -e  # Exit on error

echo "================================================"
echo "   DAY 3 SECURITY FIXES DEPLOYMENT"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SERVER="root@165.22.52.100"
BACKEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"
DB_USER="greenpay"
DB_NAME="greenpay"
DB_PASSWORD="GreenPay2025!Secure#PG"

echo -e "${YELLOW}Step 1: Installing Helmet on production server...${NC}"
ssh $SERVER "cd $BACKEND_PATH && npm install helmet"
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Helmet installed${NC}"
else
  echo -e "${RED}✗ Failed to install Helmet${NC}"
  exit 1
fi
echo ""

echo -e "${YELLOW}Step 2: Backing up current server.js...${NC}"
ssh $SERVER "cd $BACKEND_PATH && cp server.js server.js.backup-day3-\$(date +%Y%m%d-%H%M%S)"
echo -e "${GREEN}✓ Backup created${NC}"
echo ""

echo -e "${YELLOW}Step 3: Uploading new server.js with Helmet configuration...${NC}"
scp backend/server.js.day3 $SERVER:$BACKEND_PATH/server.js
echo -e "${GREEN}✓ server.js updated${NC}"
echo ""

echo -e "${YELLOW}Step 4: Creating validators directory...${NC}"
ssh $SERVER "mkdir -p $BACKEND_PATH/validators"
echo -e "${GREEN}✓ validators directory created${NC}"
echo ""

echo -e "${YELLOW}Step 5: Uploading validation schemas...${NC}"
scp backend/validators/schemas.js $SERVER:$BACKEND_PATH/validators/
echo -e "${GREEN}✓ Validation schemas uploaded${NC}"
echo ""

echo -e "${YELLOW}Step 6: Creating services directory if not exists...${NC}"
ssh $SERVER "mkdir -p $BACKEND_PATH/services"
echo -e "${GREEN}✓ services directory ready${NC}"
echo ""

echo -e "${YELLOW}Step 7: Uploading audit logging service...${NC}"
scp backend/services/auditLogger.js $SERVER:$BACKEND_PATH/services/
echo -e "${GREEN}✓ Audit logger uploaded${NC}"
echo ""

echo -e "${YELLOW}Step 8: Running database migration for audit_logs table...${NC}"
scp database/migrations/create-audit-logs-table.sql $SERVER:/tmp/
ssh $SERVER "PGPASSWORD='$DB_PASSWORD' psql -h 165.22.52.100 -U $DB_USER -d $DB_NAME -f /tmp/create-audit-logs-table.sql"
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ audit_logs table created${NC}"
else
  echo -e "${RED}✗ Failed to create audit_logs table${NC}"
  exit 1
fi
ssh $SERVER "rm /tmp/create-audit-logs-table.sql"
echo ""

echo -e "${YELLOW}Step 9: Verifying Helmet installation...${NC}"
ssh $SERVER "cd $BACKEND_PATH && npm list helmet | grep helmet"
echo ""

echo -e "${YELLOW}Step 10: Restarting backend service...${NC}"
ssh $SERVER "pm2 restart greenpay-api"
sleep 3
echo -e "${GREEN}✓ Backend restarted${NC}"
echo ""

echo -e "${YELLOW}Step 11: Checking backend status...${NC}"
ssh $SERVER "pm2 list | grep greenpay-api"
echo ""

echo -e "${YELLOW}Step 12: Checking logs for Helmet confirmation...${NC}"
ssh $SERVER "pm2 logs greenpay-api --lines 20 --nostream | grep -E '(Helmet|Security|GreenPay API Server Running)'"
echo ""

echo "================================================"
echo "   DEPLOYMENT COMPLETE"
echo "================================================"
echo ""
echo -e "${GREEN}Day 3 security fixes have been deployed:${NC}"
echo "  ✓ Helmet security headers configured"
echo "  ✓ Input validation schemas ready"
echo "  ✓ Audit logging service installed"
echo "  ✓ audit_logs table created"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Test security headers: curl -I https://greenpay.eywademo.cloud/api/health"
echo "  2. Verify audit logging: Check database for audit_logs entries"
echo "  3. Apply validation schemas to routes (manual step)"
echo "  4. Add audit logging to auth routes (manual step)"
echo ""
echo -e "${YELLOW}Monitoring:${NC}"
echo "  - Watch logs: pm2 logs greenpay-api"
echo "  - Check audit logs: SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20;"
echo ""
