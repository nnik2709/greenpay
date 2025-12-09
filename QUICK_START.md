# Quick Start Deployment Guide
**PNG Green Fees - Security & Backup System**

Your SSH: `ssh -i ~/.ssh/eywa eywa@31.97.51.225`

---

## 🚀 Quick Deployment (45 minutes)

Copy and paste these commands into your terminal. Each section has explanations.

---

### **STEP 1: Upload Scripts (2 min)**

From your local machine at `/Users/nikolay/github/greenpay/`:

```bash
# Upload backup setup script
scp -i ~/.ssh/eywa scripts/setup-backups.sh eywa@31.97.51.225:/tmp/

# Upload application backup script
scp -i ~/.ssh/eywa scripts/backup-application-files.sh eywa@31.97.51.225:/tmp/

# Make executable
ssh -i ~/.ssh/eywa eywa@31.97.51.225 "sudo chmod +x /tmp/*.sh"

# Verify upload
ssh -i ~/.ssh/eywa eywa@31.97.51.225 "ls -lh /tmp/*.sh"
```

✅ **Expected:** Two .sh files listed with execute permissions

---

### **STEP 2: Install Backup System (10 min)**

Connect to server:

```bash
ssh -i ~/.ssh/eywa eywa@31.97.51.225
```

Run installer:

```bash
# Install backup system
sudo /tmp/setup-backups.sh
```

**What happens:**
- Creates `/var/backups/greenpay/` directory
- Installs 3 backup scripts in `/usr/local/bin/`
- Sets up daily cron job (2 AM)
- Runs first backup immediately
- Creates log file

✅ **Expected output:**
```
✅ BACKUP SYSTEM SETUP COMPLETE
📋 Summary:
   • Daily backups: 2:00 AM (automatic)
   • Retention: 30 days
   • Location: /var/backups/greenpay
```

Verify:

```bash
# Check backup was created
ls -lh /var/backups/greenpay/

# View log
tail -50 /var/log/greenpay-backup.log

# Check cron job
crontab -l | grep greenpay
```

✅ **Checkpoint:** At least 1 `.sql.gz` file exists in `/var/backups/greenpay/`

---

### **STEP 3: Test Restore (10 min)**

Still on server:

```bash
# Create test database
sudo -u postgres createdb greenpay_test

# Get latest backup
LATEST_BACKUP=$(ls -t /var/backups/greenpay/greenpay_backup_*.sql.gz | head -1)
echo "Testing restore with: $LATEST_BACKUP"

# Restore backup to test database
gunzip -c $LATEST_BACKUP | sudo -u postgres psql greenpay_test

# Verify data in test database
sudo -u postgres psql greenpay_test -c "SELECT COUNT(*) FROM \"Passport\";"
sudo -u postgres psql greenpay_test -c "SELECT COUNT(*) FROM \"User\";"

# Compare with production
sudo -u postgres psql greenpay -c "SELECT COUNT(*) FROM \"Passport\";"
sudo -u postgres psql greenpay -c "SELECT COUNT(*) FROM \"User\";"

# Clean up test database
sudo -u postgres dropdb greenpay_test
```

✅ **Checkpoint:** Counts from test DB match production DB

---

### **STEP 4: Application Backups (5 min)**

Still on server:

```bash
# Move script to permanent location
sudo mv /tmp/backup-application-files.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/backup-application-files.sh

# Run first backup
sudo /usr/local/bin/backup-application-files.sh

# Setup weekly cron (Sunday 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * 0 /usr/local/bin/backup-application-files.sh >> /var/log/greenpay-app-backup.log 2>&1") | crontab -

# Verify
ls -lh /var/backups/greenpay-files/
crontab -l
```

✅ **Checkpoint:** Files created in `/var/backups/greenpay-files/`

---

### **STEP 5: Upload Security Files (3 min)**

Exit server and run from your LOCAL machine:

```bash
# Upload rate limiter
scp -i ~/.ssh/eywa backend/middleware/rateLimiter.js eywa@31.97.51.225:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/middleware/

# Upload encryption utilities
scp -i ~/.ssh/eywa backend/utils/encryption.js eywa@31.97.51.225:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/

# Verify uploads
ssh -i ~/.ssh/eywa eywa@31.97.51.225 "ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/middleware/rateLimiter.js"
ssh -i ~/.ssh/eywa eywa@31.97.51.225 "ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/encryption.js"
```

✅ **Checkpoint:** Both files uploaded successfully

---

### **STEP 6: Install Packages (5 min)**

Connect back to server:

```bash
ssh -i ~/.ssh/eywa eywa@31.97.51.225
```

Install NPM packages:

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Install security packages
npm install express-rate-limit helmet

# Verify
npm list express-rate-limit helmet
```

✅ **Checkpoint:** Packages installed without errors

---

### **STEP 7: Generate Security Keys (2 min)**

On server or local machine:

```bash
# Generate encryption key
echo "ENCRYPTION_KEY:"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

echo ""

# Generate JWT secret
echo "JWT_SECRET:"
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**⚠️ CRITICAL:** Copy both keys and save them!

On your LOCAL machine, save keys:

```bash
cat > ~/GREENPAY_KEYS_BACKUP.txt <<'EOF'
PNG Green Fees - Security Keys
Generated: $(date)

ENCRYPTION_KEY=<paste_64_char_key_here>
JWT_SECRET=<paste_128_char_secret_here>

⚠️  CRITICAL: Keep secure! Never commit to git!
EOF

chmod 400 ~/GREENPAY_KEYS_BACKUP.txt
```

✅ **Checkpoint:** Both keys saved securely locally

---

### **STEP 8: Configure .env (5 min)**

On server:

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Backup current .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Edit .env
nano .env
```

**Add these lines at the end** (paste your actual keys):

```env
# ============================================
# SECURITY CONFIGURATION (Added 2025-12-08)
# ============================================

# Field-level encryption for PII
ENCRYPTION_KEY=your_64_character_key_here

# JWT authentication secret
JWT_SECRET=your_128_character_secret_here

# Rate limiting
RATE_LIMIT_ENABLED=true

# Database SSL (enable after PostgreSQL SSL configured)
DB_SSL=false
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

Verify:

```bash
# Check keys were added (won't show full values)
grep -E "ENCRYPTION_KEY|JWT_SECRET" .env
```

✅ **Checkpoint:** Both keys appear in .env file

---

### **STEP 9: Test Encryption (2 min)**

On server:

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Test encryption utilities
node utils/encryption.js
```

✅ **Expected output:**
```
🧪 Testing encryption utilities...

Testing: Passport Number
  Original: AB1234567
  Encrypted: ...
  Decrypted: AB1234567
  ✅ Match: true

...all tests pass...
```

---

### **STEP 10: Deploy (5 min)**

On server:

```bash
# Create pre-deployment backup
sudo /usr/local/bin/greenpay-pre-deploy-backup.sh
```

✅ **Expected:**
```
✅ Pre-deployment backup created
🎯 Safe to proceed with deployment
```

Restart backend:

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Restart PM2
pm2 restart greenpay-api

# Check logs (press Ctrl+C to exit)
pm2 logs greenpay-api --lines 50
```

✅ **Look for:**
- "GreenPay API Server Running"
- No encryption errors
- No missing module errors

Test API:

```bash
curl https://greenpay.eywademo.cloud/api/health
```

✅ **Expected:** `{"status":"ok","message":"GreenPay API is running"}`

---

### **STEP 11: Final Verification (5 min)**

```bash
# Check all backups
ls -lh /var/backups/greenpay/
ls -lh /var/backups/greenpay-files/

# Check logs
tail -100 /var/log/greenpay-backup.log

# Check PM2
pm2 status
pm2 info greenpay-api

# Check cron jobs
crontab -l

# Check disk space
df -h /var/backups
```

✅ **Checkpoint:** All systems operational!

---

## ✅ Deployment Complete!

### What's Now Running:

✅ **Automated Database Backups**
- Daily at 2:00 AM
- 30-day retention
- Location: `/var/backups/greenpay/`

✅ **Application File Backups**
- Weekly on Sunday 3:00 AM
- 90-day retention
- Location: `/var/backups/greenpay-files/`

✅ **Security Middleware**
- Rate limiting installed
- Encryption utilities ready
- Strong secrets configured

✅ **Emergency Commands Available**
- `/usr/local/bin/greenpay-backup.sh` - Manual backup
- `/usr/local/bin/greenpay-pre-deploy-backup.sh` - Pre-deployment backup
- `/usr/local/bin/greenpay-restore.sh` - Database restore

---

## 🔧 Useful Commands

### Connect to server:
```bash
ssh -i ~/.ssh/eywa eywa@31.97.51.225
```

### Check backup status:
```bash
ssh -i ~/.ssh/eywa eywa@31.97.51.225 "tail -50 /var/log/greenpay-backup.log"
```

### Manual backup:
```bash
ssh -i ~/.ssh/eywa eywa@31.97.51.225 "sudo /usr/local/bin/greenpay-backup.sh"
```

### Restore database:
```bash
ssh -i ~/.ssh/eywa eywa@31.97.51.225
sudo /usr/local/bin/greenpay-restore.sh $(ls -t /var/backups/greenpay/greenpay_backup_*.sql.gz | head -1)
```

### Check API:
```bash
curl https://greenpay.eywademo.cloud/api/health
```

### View logs:
```bash
ssh -i ~/.ssh/eywa eywa@31.97.51.225 "pm2 logs greenpay-api --lines 100"
```

---

## 📅 Next Steps (Optional)

See `IMPLEMENTATION_GUIDE_SECURITY.md` for:

**Week 1:**
- Enable PostgreSQL SSL
- Apply rate limiting to routes
- Implement audit logging

**Week 2-4:**
- Security headers
- PII encryption migration
- Security testing

---

## 🆘 Troubleshooting

### Backup fails:
```bash
# Check PostgreSQL running
sudo systemctl status postgresql

# Check disk space
df -h /var/backups

# Run manually with output
sudo /usr/local/bin/greenpay-backup.sh
```

### Backend won't start:
```bash
# Check logs
pm2 logs greenpay-api

# Check .env
grep ENCRYPTION_KEY /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env

# Restart
pm2 restart greenpay-api
```

### Encryption errors:
```bash
# Test utilities
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
node utils/encryption.js

# Check key length (should output 65, including newline)
echo $ENCRYPTION_KEY | wc -c
```

---

**🎉 You're all set! Your system is now protected with automated backups and security hardening.**

For detailed documentation, see:
- `SECURITY_AUDIT_AND_BACKUP.md` - Complete audit
- `IMPLEMENTATION_GUIDE_SECURITY.md` - 4-week plan
- `SECURITY_QUICK_REFERENCE.md` - Emergency procedures
