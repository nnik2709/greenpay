#!/bin/bash

###############################################################################
# BSP DOKU Payment Gateway - Production Deployment Script
#
# This script deploys the BSP DOKU payment gateway integration to production
# Server: root@165.22.52.100
# Domain: greenpay.eywademo.cloud
#
# SECURITY: Ensure you have reviewed BSP_DOKU_SECURITY_AUDIT.md and
#           BSP_SERVER_SECURITY_REQUIREMENTS.md before deploying
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER="root@165.22.52.100"
APP_DIR="/var/www/greenpay"
BACKUP_DIR="/var/backups/greenpay"
PM2_APP_NAME="greenpay-api"

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Pre-deployment checks
print_header "BSP DOKU Payment Gateway - Production Deployment"

print_info "Checking local files..."
if [ ! -f "backend/services/payment-gateways/BSPGateway.js" ]; then
    print_error "BSPGateway.js not found!"
    exit 1
fi

if [ ! -f "backend/routes/payment-webhook-doku.js" ]; then
    print_error "payment-webhook-doku.js not found!"
    exit 1
fi

print_success "All required files present"

# Confirm deployment
echo ""
read -p "Deploy BSP DOKU integration to PRODUCTION? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    print_warning "Deployment cancelled"
    exit 0
fi

# Step 1: Backup current state
print_header "Step 1: Backing Up Current State"
ssh $SERVER "mkdir -p $BACKUP_DIR/$(date +%Y%m%d_%H%M%S)"
ssh $SERVER "cd $APP_DIR && tar -czf $BACKUP_DIR/$(date +%Y%m%d_%H%M%S)/pre-bsp-doku-backup.tar.gz backend/"
print_success "Backup created"

# Step 2: Deploy BSPGateway.js
print_header "Step 2: Deploying BSPGateway.js"
scp backend/services/payment-gateways/BSPGateway.js \
    $SERVER:$APP_DIR/backend/services/payment-gateways/
print_success "BSPGateway.js deployed"

# Step 3: Deploy webhook handler
print_header "Step 3: Deploying Webhook Handler"
scp backend/routes/payment-webhook-doku.js \
    $SERVER:$APP_DIR/backend/routes/
print_success "payment-webhook-doku.js deployed"

# Step 4: Deploy updated server.js (with webhook routes)
print_header "Step 4: Deploying Updated server.js"
scp backend/server.js \
    $SERVER:$APP_DIR/backend/
print_success "server.js deployed"

# Step 5: Check environment variables
print_header "Step 5: Checking Environment Variables"
print_info "Verifying BSP_DOKU credentials on server..."

ssh $SERVER << 'ENDSSH'
cd /var/www/greenpay

# Check if .env exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    exit 1
fi

# Check for required BSP_DOKU variables
MISSING_VARS=""

if ! grep -q "^BSP_DOKU_MALL_ID=" .env; then
    MISSING_VARS="${MISSING_VARS}BSP_DOKU_MALL_ID "
fi

if ! grep -q "^BSP_DOKU_SHARED_KEY=" .env; then
    MISSING_VARS="${MISSING_VARS}BSP_DOKU_SHARED_KEY "
fi

if ! grep -q "^BSP_DOKU_MODE=" .env; then
    MISSING_VARS="${MISSING_VARS}BSP_DOKU_MODE "
fi

if [ -n "$MISSING_VARS" ]; then
    echo ""
    echo "⚠ WARNING: Missing environment variables: $MISSING_VARS"
    echo ""
    echo "Add these to .env file:"
    echo ""
    echo "# BSP DOKU Integration (TEST Environment)"
    echo "BSP_DOKU_MALL_ID=11170"
    echo "BSP_DOKU_SHARED_KEY=ywSd48uOfypN"
    echo "BSP_DOKU_MODE=test"
    echo "BSP_DOKU_CHAIN_MERCHANT=NA"
    echo ""
    echo "For production, replace with production credentials from BSP"
    exit 1
else
    echo "✓ All required BSP_DOKU environment variables present"

    # Show current mode
    MODE=$(grep "^BSP_DOKU_MODE=" .env | cut -d'=' -f2)
    echo ""
    echo "Current BSP_DOKU_MODE: $MODE"

    if [ "$MODE" = "production" ]; then
        echo "⚠ WARNING: Running in PRODUCTION mode"
    else
        echo "ℹ Running in TEST/STAGING mode"
    fi
fi
ENDSSH

if [ $? -ne 0 ]; then
    print_error "Environment variable check failed"
    print_warning "Please add missing BSP_DOKU variables to .env and re-run deployment"
    exit 1
fi

print_success "Environment variables configured"

# Step 6: Restart PM2 service
print_header "Step 6: Restarting Backend Service"
ssh $SERVER "pm2 restart $PM2_APP_NAME"
sleep 3
print_success "PM2 service restarted"

# Step 7: Verify deployment
print_header "Step 7: Verifying Deployment"
ssh $SERVER "pm2 status $PM2_APP_NAME"

# Check if BSP gateway loaded
print_info "Checking BSP gateway initialization..."
ssh $SERVER "pm2 logs $PM2_APP_NAME --lines 50 --nostream | grep -i 'BSP DOKU' || echo 'No BSP DOKU logs yet'"

print_success "Deployment verification complete"

# Step 8: Display post-deployment info
print_header "Deployment Complete!"

cat << 'EOF'

✅ BSP DOKU Payment Gateway Successfully Deployed!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Provide these URLs to BSP Digital Testing Team:

   Test Website:
   https://greenpay.eywademo.cloud/buy-online

   Notify Webhook:
   https://greenpay.eywademo.cloud/api/payment/webhook/doku/notify

   Redirect Webhook:
   https://greenpay.eywademo.cloud/api/payment/webhook/doku/redirect


2. Configure Firewall (IP Whitelisting):

   Test Environment:
   sudo ufw allow from 103.10.130.75 to any port 443 proto tcp comment 'DOKU Staging IP 1'
   sudo ufw allow from 147.139.130.145 to any port 443 proto tcp comment 'DOKU Staging IP 2'

   Production Environment (when ready):
   sudo ufw allow from 103.10.130.35 to any port 443 proto tcp comment 'DOKU Production IP 1'
   sudo ufw allow from 147.139.129.160 to any port 443 proto tcp comment 'DOKU Production IP 2'


3. Test the Integration:

   a) Visit: https://greenpay.eywademo.cloud/buy-online
   b) Enter quantity and customer details
   c) Click "Proceed to Payment"
   d) Should redirect to DOKU hosted payment page

   Monitor logs:
   ssh root@165.22.52.100 "pm2 logs greenpay-api | grep 'BSP DOKU'"


4. Monitor Webhook Activity:

   Watch for webhook notifications:
   ssh root@165.22.52.100 "tail -f /var/www/greenpay/logs/api.log | grep 'DOKU NOTIFY'"


5. Security Checklist:

   ☐ Verify SSL certificate is valid (https://www.ssllabs.com/ssltest/)
   ☐ Check firewall rules are active (ufw status)
   ☐ Ensure BSP_DOKU_MODE is set correctly (test/production)
   ☐ Monitor failed signature verification attempts
   ☐ Review rate limiting logs


6. BSP Testing Timeline:

   - BSP Digital Testing Team: 10 days testing period
   - Fix any issues identified during testing
   - Upon approval: Switch to production credentials
   - Media release and go-live


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 DOCUMENTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

See these files for complete details:

  • BSP_DOKU_INTEGRATION_DETAILS.md - Integration guide
  • BSP_DOKU_IMPLEMENTATION_SUMMARY.md - Implementation summary
  • BSP_DOKU_SECURITY_AUDIT.md - Security audit report
  • BSP_SERVER_SECURITY_REQUIREMENTS.md - Server hardening guide


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 SUPPORT CONTACTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BSP Bank PNG:
  Email: servicebsp@bsp.com.pg
  Phone: +675 3201212

DOKU Support:
  Contact through BSP technical team
  Reference: Mall ID 11170 (test)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF

print_success "Ready for BSP testing!"
print_info "Deployment completed at $(date)"
