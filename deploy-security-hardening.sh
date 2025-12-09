#!/bin/bash

##############################################################################
# Deploy Security Hardening and Backup System
# PNG Green Fees System
#
# This script deploys:
# 1. Backup system (database + application files)
# 2. Rate limiting middleware
# 3. Encryption utilities (preparation for PII encryption)
# 4. Security configuration updates
#
# Usage: ./deploy-security-hardening.sh
##############################################################################

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   🔒 PNG Green Fees - Security Hardening Deployment       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

SERVER="root@72.61.208.79"
REMOTE_DIR="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"
BACKUP_SCRIPTS_DIR="/usr/local/bin"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📋 Pre-deployment Checklist:"
echo ""
read -p "Have you reviewed SECURITY_AUDIT_AND_BACKUP.md? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please review the security audit document first"
    exit 1
fi

echo ""
echo "🔑 IMPORTANT: You will need to configure these secrets:"
echo "   1. ENCRYPTION_KEY - 64 character hex string"
echo "   2. JWT_SECRET - Strong random string"
echo "   3. REDIS_URL (optional) - For distributed rate limiting"
echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 1: Upload Backup Scripts"
echo "════════════════════════════════════════════════════════════"
echo ""

# Upload backup setup script
echo "📤 Uploading backup setup script..."
scp scripts/setup-backups.sh $SERVER:/tmp/
ssh $SERVER "chmod +x /tmp/setup-backups.sh"
echo "   ✅ Uploaded: setup-backups.sh"

# Upload application backup script
echo "📤 Uploading application backup script..."
scp scripts/backup-application-files.sh $SERVER:/tmp/
ssh $SERVER "chmod +x /tmp/backup-application-files.sh"
echo "   ✅ Uploaded: backup-application-files.sh"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 2: Install Backup System"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "⚙️  Running backup system setup on server..."
ssh $SERVER "sudo /tmp/setup-backups.sh"

if [ $? -eq 0 ]; then
    echo ""
    echo "${GREEN}✅ Backup system installed successfully${NC}"
else
    echo ""
    echo "${RED}❌ Backup system installation failed${NC}"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 3: Upload Security Middleware"
echo "════════════════════════════════════════════════════════════"
echo ""

# Upload rate limiter middleware
echo "📤 Uploading rate limiter middleware..."
scp backend/middleware/rateLimiter.js $SERVER:$REMOTE_DIR/middleware/
echo "   ✅ Uploaded: rateLimiter.js"

# Upload encryption utilities
echo "📤 Uploading encryption utilities..."
ssh $SERVER "mkdir -p $REMOTE_DIR/utils"
scp backend/utils/encryption.js $SERVER:$REMOTE_DIR/utils/
echo "   ✅ Uploaded: encryption.js"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 4: Install Required NPM Packages"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "📦 Installing security packages..."
ssh $SERVER "cd $REMOTE_DIR && npm install express-rate-limit rate-limit-redis redis helmet"

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Packages installed successfully${NC}"
else
    echo "${YELLOW}⚠️  Some packages may have failed to install. Check manually.${NC}"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 5: Generate Security Keys"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "🔑 Generating encryption key..."
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "   Generated: ENCRYPTION_KEY"

echo ""
echo "🔑 Generating JWT secret..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo "   Generated: JWT_SECRET"

echo ""
echo "${YELLOW}⚠️  IMPORTANT: Save these keys securely!${NC}"
echo ""
echo "Add these to your backend/.env file on the server:"
echo ""
echo "════════════════════════════════════════════════════════════"
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo "JWT_SECRET=$JWT_SECRET"
echo ""
echo "# Optional: Redis for distributed rate limiting"
echo "# REDIS_URL=redis://localhost:6379"
echo "════════════════════════════════════════════════════════════"
echo ""

read -p "Press Enter to continue after saving these keys..."

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 6: Update Server Configuration"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "⚙️  Configuring PostgreSQL for SSL (recommended)..."
echo "   Manual step required:"
echo "   1. SSH to server: ssh $SERVER"
echo "   2. Edit postgresql.conf: sudo nano /etc/postgresql/*/main/postgresql.conf"
echo "   3. Set: ssl = on"
echo "   4. Restart: sudo systemctl restart postgresql"
echo ""

echo "⚙️  Configuring Nginx security headers (recommended)..."
echo "   Manual step required:"
echo "   1. SSH to server: ssh $SERVER"
echo "   2. Edit Nginx config: sudo nano /etc/nginx/sites-available/greenpay.eywademo.cloud"
echo "   3. Add security headers (see SECURITY_AUDIT_AND_BACKUP.md section 3.2)"
echo "   4. Test: sudo nginx -t"
echo "   5. Reload: sudo nginx -s reload"
echo ""

read -p "Press Enter when configuration is complete..."

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 7: Restart Backend Service"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "🔄 Restarting backend service..."
ssh $SERVER "cd $REMOTE_DIR && pm2 restart greenpay-api"

if [ $? -eq 0 ]; then
    echo "${GREEN}✅ Backend restarted successfully${NC}"
else
    echo "${RED}❌ Backend restart failed${NC}"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  STEP 8: Verify Deployment"
echo "════════════════════════════════════════════════════════════"
echo ""

echo "🔍 Checking API health..."
sleep 3
curl -s https://greenpay.eywademo.cloud/api/health | jq .

echo ""
echo "🔍 Checking backup system..."
ssh $SERVER "ls -lh /var/backups/greenpay/ | tail -5"

echo ""
echo "🔍 Checking PM2 status..."
ssh $SERVER "pm2 status greenpay-api"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   ✅ SECURITY HARDENING DEPLOYMENT COMPLETE               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "📋 Summary of Changes:"
echo ""
echo "   ✅ Automated database backups (daily at 2 AM)"
echo "   ✅ Application file backup scripts"
echo "   ✅ Rate limiting middleware (ready to implement)"
echo "   ✅ Encryption utilities (ready for PII migration)"
echo "   ✅ Security keys generated"
echo ""

echo "🔔 NEXT STEPS (see SECURITY_AUDIT_AND_BACKUP.md):"
echo ""
echo "   WEEK 1 (Immediate):"
echo "   [ ] 1. Test database backup restore procedure"
echo "   [ ] 2. Apply rate limiting to auth routes"
echo "   [ ] 3. Enable PostgreSQL SSL connections"
echo "   [ ] 4. Add Nginx security headers"
echo "   [ ] 5. Implement audit logging"
echo ""
echo "   WEEK 2-3 (High Priority):"
echo "   [ ] 6. Migrate PII fields to encrypted storage"
echo "   [ ] 7. Setup monitoring and alerts"
echo "   [ ] 8. File upload validation"
echo "   [ ] 9. Session timeout enforcement"
echo ""
echo "   WEEK 4+ (Medium Priority):"
echo "   [ ] 10. Two-factor authentication for admins"
echo "   [ ] 11. Cloud backup sync (S3/Backblaze)"
echo "   [ ] 12. Security penetration testing"
echo ""

echo "📖 Documentation:"
echo "   • Security Audit: SECURITY_AUDIT_AND_BACKUP.md"
echo "   • Backup Logs: ssh $SERVER 'tail -f /var/log/greenpay-backup.log'"
echo "   • Manual Backup: ssh $SERVER 'sudo /usr/local/bin/greenpay-backup.sh'"
echo "   • Restore DB: ssh $SERVER 'sudo /usr/local/bin/greenpay-restore.sh [backup_file]'"
echo ""

echo "⚠️  CRITICAL REMINDERS:"
echo "   1. Keep ENCRYPTION_KEY and JWT_SECRET safe and backed up offline"
echo "   2. Test restore procedure monthly"
echo "   3. Monitor backup logs weekly"
echo "   4. Never commit .env files to git"
echo "   5. Rotate JWT_SECRET quarterly"
echo ""

echo "🎉 Security hardening deployment completed successfully!"
echo ""
