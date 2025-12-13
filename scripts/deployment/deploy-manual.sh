#!/bin/bash

# Manual Deployment Helper for GreenPay
# Creates a deployment package when SSH keys are not configured

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📦 Creating GreenPay Deployment Package${NC}"
echo "==========================================="
echo ""

# Check if dist exists
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ dist folder not found!${NC}"
    echo "Please run 'npm run build' first"
    exit 1
fi

# Create deployment package
PACKAGE_NAME="greenpay-frontend-$(date +%Y%m%d-%H%M%S).tar.gz"
echo -e "${BLUE}Creating tarball: $PACKAGE_NAME${NC}"
tar -czf "$PACKAGE_NAME" -C dist .

echo -e "${GREEN}✅ Package created: $PACKAGE_NAME${NC}"
echo ""

# Get package size
SIZE=$(du -h "$PACKAGE_NAME" | cut -f1)
FILE_COUNT=$(find dist -type f | wc -l | tr -d ' ')

echo -e "${GREEN}📊 Package Details:${NC}"
echo "  Size: $SIZE"
echo "  Files: $FILE_COUNT"
echo ""

# Create deployment instructions
cat > deploy-instructions.txt << EOF
GreenPay Frontend Deployment Instructions
==========================================

Package: $PACKAGE_NAME
Created: $(date)

STEP-BY-STEP DEPLOYMENT:

Step 1: Transfer the package to the server
-------------------------------------------
Choose one of these methods:

Method A - Using SCP (if you have password):
  scp $PACKAGE_NAME root@72.61.208.79:/tmp/

Method B - Using SFTP client (Cyberduck, FileZilla, etc.):
  1. Connect to: 72.61.208.79
  2. Username: root
  3. Upload $PACKAGE_NAME to /tmp/ folder

Method C - Using rsync (if available):
  rsync -avz --progress $PACKAGE_NAME root@72.61.208.79:/tmp/


Step 2: SSH into the server
----------------------------
ssh root@72.61.208.79


Step 3: Deploy the files (run on server)
-----------------------------------------
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud

# Create backup
mkdir -p backups
tar -czf backups/frontend-backup-\$(date +%Y%m%d-%H%M%S).tar.gz assets index.html 2>/dev/null || echo "No previous deployment to backup"

# Remove old frontend files (keep backend folder!)
rm -rf assets
rm -f index.html

# Extract new deployment
tar -xzf /tmp/$PACKAGE_NAME

# Set permissions
chown -R eywademo-greenpay:eywademo-greenpay assets index.html
chmod -R 755 assets
chmod 644 index.html

# Verify deployment
ls -la
find assets -type f | wc -l

# Clean up
rm /tmp/$PACKAGE_NAME

echo "✅ Deployment complete!"


Step 4: Test the deployment
----------------------------
1. Open browser: https://greenpay.eywademo.cloud
2. Check console for errors (F12)
3. Test login with: admin@greenpay.com / Admin123!
4. Verify all pages load correctly


ROLLBACK (if needed):
---------------------
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backups
ls -lt
tar -xzf frontend-backup-YYYYMMDD-HHMMSS.tar.gz -C ../


EOF

echo -e "${GREEN}✅ Created deployment instructions: deploy-instructions.txt${NC}"
echo ""
echo -e "${YELLOW}================================================${NC}"
echo -e "${YELLOW}📋 NEXT STEPS:${NC}"
echo -e "${YELLOW}================================================${NC}"
echo ""
echo "1. Read the instructions:"
echo -e "   ${BLUE}cat deploy-instructions.txt${NC}"
echo ""
echo "2. Transfer $PACKAGE_NAME to server /tmp/ folder"
echo ""
echo "3. SSH into server and run the deployment commands"
echo ""
echo -e "${GREEN}Good luck! 🚀${NC}"
echo ""
