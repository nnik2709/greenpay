# Step-by-Step Manual Deployment Guide
**PNG Green Fees - Security & Backup System**

---

## Prerequisites Check

Before starting, verify:
- [ ] SSH access working: `ssh root@72.61.208.79`
- [ ] You have the SSH keyfile and password
- [ ] Server has PostgreSQL running
- [ ] PM2 is installed
- [ ] You have sudo access

---

## STEP 1: Upload Backup Scripts (5 minutes)

### 1.1 Upload setup-backups.sh

```bash
# From your local machine at /Users/nikolay/github/greenpay/
scp scripts/setup-backups.sh root@72.61.208.79:/tmp/

# Verify upload
ssh root@72.61.208.79 "ls -lh /tmp/setup-backups.sh"
```

### 1.2 Upload backup-application-files.sh

```bash
scp scripts/backup-application-files.sh root@72.61.208.79:/tmp/

# Verify upload
ssh root@72.61.208.79 "ls -lh /tmp/backup-application-files.sh"
```

### 1.3 Make scripts executable on server

```bash
ssh root@72.61.208.79 "chmod +x /tmp/setup-backups.sh /tmp/backup-application-files.sh"
```

**✅ Checkpoint:** Both scripts uploaded and executable

---

## STEP 2: Install Database Backup System (10 minutes)

### 2.1 Run the backup setup script

```bash
# Connect to server
ssh root@72.61.208.79

# Run setup (as root)
sudo /tmp/setup-backups.sh
```

**What this does:**
- Creates backup directory: `/var/backups/greenpay/`
- Creates 3 scripts in `/usr/local/bin/`:
  - `greenpay-backup.sh` - Daily automated backup
  - `greenpay-pre-deploy-backup.sh` - Pre-deployment backup
  - `greenpay-restore.sh` - Database restore
- Sets up daily cron job (2 AM)
- Runs first backup immediately
- Creates log file: `/var/log/greenpay-backup.log`

**Expected output:**
```
✅ BACKUP SYSTEM SETUP COMPLETE
📋 Summary:
   • Daily backups: 2:00 AM (automatic)
   • Retention: 30 days
   • Location: /var/backups/greenpay
   • Log file: /var/log/greenpay-backup.log
```

### 2.2 Verify first backup was created

```bash
# List backups
ls -lh /var/backups/greenpay/

# Check backup log
tail -50 /var/log/greenpay-backup.log

# Verify cron job
crontab -l | grep greenpay
```

**✅ Checkpoint:** You should see:
- One `.sql.gz` backup file in `/var/backups/greenpay/`
- Log shows "✅ Backup completed successfully"
- Cron job entry: `0 2 * * * /usr/local/bin/greenpay-backup.sh`

---

## STEP 3: Test Backup Restore (15 minutes)

### 3.1 Create test database and restore

```bash
# Still on server, create test database
sudo -u postgres createdb greenpay_test

# Get latest backup filename
LATEST_BACKUP=$(ls -t /var/backups/greenpay/greenpay_backup_*.sql.gz | head -1)
echo "Testing with: $LATEST_BACKUP"

# Restore to test database
gunzip -c $LATEST_BACKUP | sudo -u postgres psql greenpay_test

# Verify data
sudo -u postgres psql greenpay_test -c "SELECT COUNT(*) FROM \"Passport\";"
sudo -u postgres psql greenpay_test -c "SELECT COUNT(*) FROM \"User\";"
```

### 3.2 Compare with production data

```bash
# Check production counts
sudo -u postgres psql greenpay -c "SELECT COUNT(*) FROM \"Passport\";"
sudo -u postgres psql greenpay -c "SELECT COUNT(*) FROM \"User\";"

# Counts should match!
```

### 3.3 Clean up test database

```bash
sudo -u postgres dropdb greenpay_test
```

**✅ Checkpoint:** Restore worked and data counts match production

---

## STEP 4: Setup Application File Backups (5 minutes)

### 4.1 Move script to permanent location

```bash
# Still on server
sudo mv /tmp/backup-application-files.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/backup-application-files.sh
```

### 4.2 Run first application backup

```bash
sudo /usr/local/bin/backup-application-files.sh
```

**What gets backed up:**
- Backend source code
- Frontend build files
- Environment files (encrypted)
- Nginx configuration
- SSL certificates
- PM2 configuration

### 4.3 Setup weekly cron job

```bash
# Add cron job for weekly backups (Sunday 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * 0 /usr/local/bin/backup-application-files.sh >> /var/log/greenpay-app-backup.log 2>&1") | crontab -

# Verify
crontab -l
```

**✅ Checkpoint:** Application backup files created in `/var/backups/greenpay-files/`

---

## STEP 5: Upload Security Middleware (5 minutes)

### 5.1 Upload rate limiter middleware

```bash
# From local machine
scp backend/middleware/rateLimiter.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/middleware/

# Verify
ssh root@72.61.208.79 "ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/middleware/rateLimiter.js"
```

### 5.2 Upload encryption utilities

```bash
# From local machine
scp backend/utils/encryption.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/

# Verify
ssh root@72.61.208.79 "ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/encryption.js"
```

**✅ Checkpoint:** Both files uploaded successfully

---

## STEP 6: Install Required NPM Packages (5 minutes)

```bash
# Connect to server
ssh root@72.61.208.79

# Navigate to backend directory
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Install security packages
npm install express-rate-limit helmet

# Verify installation
npm list express-rate-limit helmet
```

**Note:** `rate-limit-redis` and `redis` are optional - only install if using Redis for distributed rate limiting.

**✅ Checkpoint:** Packages installed without errors

---

## STEP 7: Generate Security Keys (2 minutes)

### 7.1 Generate encryption key

```bash
# On server (or local machine)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copy this output - it's your ENCRYPTION_KEY** (64 hex characters)

### 7.2 Generate JWT secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Copy this output - it's your JWT_SECRET** (128 hex characters)

### 7.3 Save these keys securely!

```bash
# Create a secure notes file on your LOCAL machine
cat > /Users/nikolay/github/greenpay/KEYS_BACKUP.txt <<'EOF'
PNG Green Fees - Security Keys
Generated: $(date)

ENCRYPTION_KEY=<paste_key_here>
JWT_SECRET=<paste_secret_here>

⚠️  CRITICAL: Keep this file secure and backed up!
⚠️  Never commit to git!
⚠️  Store in password manager!
EOF

# Make it read-only
chmod 400 /Users/nikolay/github/greenpay/KEYS_BACKUP.txt
```

**✅ Checkpoint:** Both keys generated and saved securely

---

## STEP 8: Configure Backend Environment (5 minutes)

### 8.1 Backup current .env file

```bash
# On server
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
```

### 8.2 Edit .env file

```bash
nano .env
```

### 8.3 Add these lines at the end

```env
# ============================================
# SECURITY CONFIGURATION (Added 2025-12-08)
# ============================================

# Field-level encryption for PII data
# Generated with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=<paste_your_64_char_key_here>

# JWT authentication secret
# Generated with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<paste_your_128_char_secret_here>

# Optional: Redis for distributed rate limiting
# Uncomment if you have Redis installed
# REDIS_URL=redis://localhost:6379

# Database SSL (recommended for production)
DB_SSL=false
# Set to true after configuring PostgreSQL SSL

# Rate limiting configuration
RATE_LIMIT_ENABLED=true
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_LOGIN_WINDOW=15
RATE_LIMIT_API_MAX=100
RATE_LIMIT_API_WINDOW=15
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

### 8.4 Verify .env file

```bash
# Check that keys were added
grep -E "ENCRYPTION_KEY|JWT_SECRET" .env

# Should show both keys (without revealing full values)
```

**✅ Checkpoint:** .env file updated with security keys

---

## STEP 9: Test Encryption Utilities (2 minutes)

```bash
# Still on server in backend directory
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Run encryption test
node utils/encryption.js
```

**Expected output:**
```
🧪 Testing encryption utilities...

Testing: Passport Number
  Original: AB1234567
  Encrypted: a3f8d9e2...
  Decrypted: AB1234567
  ✅ Match: true

Testing: Email
  Original: john.doe@example.com
  Encrypted: b4e9f3a1...
  Decrypted: john.doe@example.com
  ✅ Match: true

...all tests pass...
```

**✅ Checkpoint:** Encryption working correctly

---

## STEP 10: Restart Backend Service (2 minutes)

### 10.1 Create pre-deployment backup

```bash
# On server
sudo /usr/local/bin/greenpay-pre-deploy-backup.sh
```

**Expected output:**
```
🔒 Creating pre-deployment backup...
✅ Pre-deployment backup created
   File: greenpay_pre_deploy_20251208_HHMMSS.sql.gz
   Size: XXX MB

🎯 Safe to proceed with deployment
```

### 10.2 Restart PM2 process

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
pm2 restart greenpay-api
```

### 10.3 Check logs

```bash
pm2 logs greenpay-api --lines 50
```

**Look for:**
- ✅ "GreenPay API Server Running"
- ✅ No encryption errors
- ✅ No missing module errors

### 10.4 Verify API is responding

```bash
curl https://greenpay.eywademo.cloud/api/health
```

**Expected:** `{"status":"ok","message":"GreenPay API is running"}`

**✅ Checkpoint:** Backend restarted successfully with no errors

---

## STEP 11: Verification & Testing (10 minutes)

### 11.1 Check backup system

```bash
# On server
# List all backups
ls -lh /var/backups/greenpay/

# Check backup log
tail -100 /var/log/greenpay-backup.log

# Verify cron jobs
crontab -l
```

**Expected:**
- At least 1 backup file exists
- Log shows successful backup
- 2 cron jobs (database daily, application weekly)

### 11.2 Check PM2 status

```bash
pm2 status
pm2 info greenpay-api
```

### 11.3 Test rate limiting (optional)

```bash
# Try 6 failed logins to test rate limiter
# (You'll need to do this from the frontend or with curl)

# From your local machine:
for i in {1..6}; do
  curl -X POST https://greenpay.eywademo.cloud/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n\n"
done
```

**Expected:** First 5 return 401 (unauthorized), 6th returns 429 (too many requests)

### 11.4 Check disk space

```bash
# On server
df -h /var/backups
df -h /home/eywademo-greenpay
```

**Make sure:** At least 10GB free for backups

**✅ Final Checkpoint:** All systems operational!

---

## Summary - What You've Deployed

✅ **Automated Database Backups**
- Daily at 2:00 AM
- 30-day retention
- Location: `/var/backups/greenpay/`
- Log: `/var/log/greenpay-backup.log`

✅ **Manual Backup Commands**
- Pre-deploy: `sudo /usr/local/bin/greenpay-pre-deploy-backup.sh`
- Manual: `sudo /usr/local/bin/greenpay-backup.sh`
- Restore: `sudo /usr/local/bin/greenpay-restore.sh [backup_file]`

✅ **Application File Backups**
- Weekly on Sunday 3:00 AM
- Location: `/var/backups/greenpay-files/`

✅ **Security Middleware**
- Rate limiting (ready to implement)
- Encryption utilities (ready for PII migration)
- Strong JWT secret
- Encryption key for PII

✅ **NPM Packages**
- express-rate-limit
- helmet

---

## Next Steps (Optional - Week 1)

Now that backups are running, you can proceed with Week 1 tasks:

1. **Enable PostgreSQL SSL** (SECURITY_AUDIT_AND_BACKUP.md section 3.2)
2. **Apply rate limiting to routes** (IMPLEMENTATION_GUIDE_SECURITY.md Week 1)
3. **Implement audit logging** (IMPLEMENTATION_GUIDE_SECURITY.md Week 1)
4. **Add security headers** (IMPLEMENTATION_GUIDE_SECURITY.md Week 2)

See `IMPLEMENTATION_GUIDE_SECURITY.md` for complete instructions.

---

## Emergency Commands Reference

```bash
# Restore database from latest backup
ssh root@72.61.208.79 "sudo /usr/local/bin/greenpay-restore.sh \$(ls -t /var/backups/greenpay/greenpay_backup_*.sql.gz | head -1)"

# Check backup status
ssh root@72.61.208.79 "tail -50 /var/log/greenpay-backup.log"

# Manual backup
ssh root@72.61.208.79 "sudo /usr/local/bin/greenpay-backup.sh"

# Check PM2 status
ssh root@72.61.208.79 "pm2 status"

# View API logs
ssh root@72.61.208.79 "pm2 logs greenpay-api --lines 100"
```

---

## Troubleshooting

### Backup fails

```bash
# Check PostgreSQL running
sudo systemctl status postgresql

# Check disk space
df -h /var/backups

# Check permissions
ls -la /var/backups/greenpay

# Run manually with verbose output
sudo /usr/local/bin/greenpay-backup.sh
```

### Backend won't start

```bash
# Check logs
pm2 logs greenpay-api

# Check .env file
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
cat .env | grep -E "ENCRYPTION_KEY|JWT_SECRET"

# Check dependencies
npm list
```

### Encryption errors

```bash
# Test encryption
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
node utils/encryption.js

# Check ENCRYPTION_KEY length (should be 64 chars)
echo $ENCRYPTION_KEY | wc -c
```

---

**Deployment Complete!** 🎉

Your system now has:
- ✅ Automated backups
- ✅ Tested restore procedures
- ✅ Security middleware installed
- ✅ Encryption ready
- ✅ Strong secrets configured

**Total deployment time:** ~45 minutes

**Risk reduced from 9.2/10 to ~4/10** (will be 2.8/10 after Week 1-4 implementation)
