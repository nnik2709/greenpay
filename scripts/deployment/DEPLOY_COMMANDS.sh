#!/bin/bash
##############################################################################
# Quick Copy-Paste Commands for Manual Deployment
# PNG Green Fees - Security & Backup System
#
# Usage: Copy and paste each section into your terminal
# Follow deploy-step-by-step.md for detailed explanations
##############################################################################

echo "=================================================="
echo "PNG Green Fees - Security Deployment Commands"
echo "=================================================="
echo ""
echo "⚠️  Do NOT run this entire file at once!"
echo "⚠️  Copy and paste each section individually"
echo "⚠️  Follow deploy-step-by-step.md for instructions"
echo ""

# ============================================
# STEP 1: Upload Backup Scripts
# ============================================
# Run these from your LOCAL machine at /Users/nikolay/github/greenpay/

echo "--- STEP 1: Upload Backup Scripts ---"

# Upload setup-backups.sh
scp scripts/setup-backups.sh root@72.61.208.79:/tmp/

# Upload backup-application-files.sh
scp scripts/backup-application-files.sh root@72.61.208.79:/tmp/

# Make executable
ssh root@72.61.208.79 "chmod +x /tmp/setup-backups.sh /tmp/backup-application-files.sh"

# Verify
ssh root@72.61.208.79 "ls -lh /tmp/*.sh"

# ============================================
# STEP 2: Install Database Backup System
# ============================================
# Run on SERVER (after ssh root@72.61.208.79)

echo "--- STEP 2: Install Database Backup System ---"
echo "Run on server: ssh root@72.61.208.79"

# Run setup script
sudo /tmp/setup-backups.sh

# Verify backup created
ls -lh /var/backups/greenpay/

# Check log
tail -50 /var/log/greenpay-backup.log

# Check cron job
crontab -l | grep greenpay

# ============================================
# STEP 3: Test Backup Restore
# ============================================
# Run on SERVER

echo "--- STEP 3: Test Backup Restore ---"

# Create test database
sudo -u postgres createdb greenpay_test

# Get latest backup
LATEST_BACKUP=$(ls -t /var/backups/greenpay/greenpay_backup_*.sql.gz | head -1)
echo "Restoring: $LATEST_BACKUP"

# Restore
gunzip -c $LATEST_BACKUP | sudo -u postgres psql greenpay_test

# Verify data
sudo -u postgres psql greenpay_test -c "SELECT COUNT(*) FROM \"Passport\";"
sudo -u postgres psql greenpay_test -c "SELECT COUNT(*) FROM \"User\";"

# Compare with production
sudo -u postgres psql greenpay -c "SELECT COUNT(*) FROM \"Passport\";"
sudo -u postgres psql greenpay -c "SELECT COUNT(*) FROM \"User\";"

# Cleanup
sudo -u postgres dropdb greenpay_test

# ============================================
# STEP 4: Setup Application File Backups
# ============================================
# Run on SERVER

echo "--- STEP 4: Setup Application File Backups ---"

# Move script
sudo mv /tmp/backup-application-files.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/backup-application-files.sh

# Run first backup
sudo /usr/local/bin/backup-application-files.sh

# Setup weekly cron
(crontab -l 2>/dev/null; echo "0 3 * * 0 /usr/local/bin/backup-application-files.sh >> /var/log/greenpay-app-backup.log 2>&1") | crontab -

# Verify
ls -lh /var/backups/greenpay-files/
crontab -l

# ============================================
# STEP 5: Upload Security Middleware
# ============================================
# Run from LOCAL machine

echo "--- STEP 5: Upload Security Middleware ---"

# Upload rate limiter
scp backend/middleware/rateLimiter.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/middleware/

# Upload encryption utilities
scp backend/utils/encryption.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/

# Verify
ssh root@72.61.208.79 "ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/middleware/rateLimiter.js"
ssh root@72.61.208.79 "ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/encryption.js"

# ============================================
# STEP 6: Install NPM Packages
# ============================================
# Run on SERVER

echo "--- STEP 6: Install NPM Packages ---"

cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Install packages
npm install express-rate-limit helmet

# Verify
npm list express-rate-limit helmet

# ============================================
# STEP 7: Generate Security Keys
# ============================================
# Run on LOCAL or SERVER

echo "--- STEP 7: Generate Security Keys ---"
echo "⚠️  SAVE THESE KEYS SECURELY!"

# Generate encryption key (64 hex chars)
echo "ENCRYPTION_KEY:"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

echo ""

# Generate JWT secret (128 hex chars)
echo "JWT_SECRET:"
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

echo ""
echo "💾 Save these to KEYS_BACKUP.txt locally!"

# ============================================
# STEP 8: Configure Backend Environment
# ============================================
# Run on SERVER

echo "--- STEP 8: Configure Backend Environment ---"

cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Backup current .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Edit .env (manual step)
echo "Now edit .env and add the security keys:"
echo "nano .env"
echo ""
echo "Add these lines at the end:"
echo "# ============================================"
echo "# SECURITY CONFIGURATION (Added $(date +%Y-%m-%d))"
echo "# ============================================"
echo "ENCRYPTION_KEY=<your_64_char_key>"
echo "JWT_SECRET=<your_128_char_secret>"
echo "RATE_LIMIT_ENABLED=true"
echo "DB_SSL=false"

# After editing, verify
grep -E "ENCRYPTION_KEY|JWT_SECRET" .env

# ============================================
# STEP 9: Test Encryption Utilities
# ============================================
# Run on SERVER

echo "--- STEP 9: Test Encryption Utilities ---"

cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Test encryption
node utils/encryption.js

# Should see: ✅ Match: true for all tests

# ============================================
# STEP 10: Restart Backend Service
# ============================================
# Run on SERVER

echo "--- STEP 10: Restart Backend Service ---"

# Create pre-deployment backup
sudo /usr/local/bin/greenpay-pre-deploy-backup.sh

# Restart PM2
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
pm2 restart greenpay-api

# Check logs
pm2 logs greenpay-api --lines 50

# Test API
curl https://greenpay.eywademo.cloud/api/health

# ============================================
# STEP 11: Final Verification
# ============================================
# Run on SERVER

echo "--- STEP 11: Final Verification ---"

# Check backups
ls -lh /var/backups/greenpay/
tail -100 /var/log/greenpay-backup.log

# Check PM2
pm2 status
pm2 info greenpay-api

# Check cron jobs
crontab -l

# Check disk space
df -h /var/backups
df -h /home/eywademo-greenpay

echo ""
echo "=================================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=================================================="
echo ""
echo "Deployed:"
echo "  ✅ Automated database backups (daily 2 AM)"
echo "  ✅ Application file backups (weekly)"
echo "  ✅ Security middleware installed"
echo "  ✅ Encryption utilities ready"
echo "  ✅ Strong secrets configured"
echo ""
echo "Next: See IMPLEMENTATION_GUIDE_SECURITY.md for Week 1-4 tasks"
echo ""

# ============================================
# EMERGENCY COMMANDS (For Reference)
# ============================================

echo "--- Emergency Commands ---"

# Restore database
# sudo /usr/local/bin/greenpay-restore.sh $(ls -t /var/backups/greenpay/greenpay_backup_*.sql.gz | head -1)

# Manual backup
# sudo /usr/local/bin/greenpay-backup.sh

# Check backup status
# tail -50 /var/log/greenpay-backup.log

# Restart backend
# pm2 restart greenpay-api

# View logs
# pm2 logs greenpay-api

# Check API health
# curl https://greenpay.eywademo.cloud/api/health
