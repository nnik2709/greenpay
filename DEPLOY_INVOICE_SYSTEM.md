# Production Deployment - Invoice System
## Customer Management + PDF + Email Features

**Target Server:** greenpay.eywademo.cloud (72.61.208.79)
**Date:** 2025-11-27
**Features:** Customers, PDF Generation, Email Invoices

---

## 📋 Pre-Flight Checklist

Before starting deployment, ensure you have:

- [ ] SSH access to server: `ssh root@72.61.208.79`
- [ ] Database credentials (PostgreSQL)
- [ ] Email account for SMTP (Gmail, Office 365, or custom)
- [ ] Backup created (see Step 1)
- [ ] 30 minutes of uninterrupted time

---

## 🗄️ STEP 1: Database Backup & Migration

### 1.1 Create Backup

```bash
# SSH into server
ssh root@72.61.208.79

# Create backup directory if it doesn't exist
mkdir -p /var/backups/greenpay

# Backup database
pg_dump -U postgres greenpay > /var/backups/greenpay/backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup created
ls -lh /var/backups/greenpay/
```

### 1.2 Copy Migration Files to Server

```bash
# From your local machine
scp migrations/06-create-customers-table.sql root@72.61.208.79:/tmp/
scp migrations/07-link-quotations-to-customers.sql root@72.61.208.79:/tmp/
```

### 1.3 Run Migrations

```bash
# On server, connect to database
psql -U postgres -d greenpay

# Run customer table migration
\i /tmp/06-create-customers-table.sql

# Run quotation linking migration
\i /tmp/07-link-quotations-to-customers.sql

# Verify tables created
\dt customers
\d customers

# Verify customer_id added to quotations
\d quotations

# Exit
\q
```

**Expected Output:**
```
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
COMMENT
```

---

## 📦 STEP 2: Backend Deployment

### 2.1 Navigate to Backend Directory

```bash
# Find backend location
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Or search for it
find /home -name "backend" -type d 2>/dev/null | grep greenpay
```

### 2.2 Pull Latest Code

```bash
# Stash any local changes (if needed)
git stash

# Pull latest from GitHub
git pull origin main

# Verify correct commit
git log --oneline -5

# Should see:
# e87160d Add comprehensive completion documentation
# f29b7b1 Add email invoice functionality
# 0ba9af4 Add PNG-compliant invoice PDF generator
```

### 2.3 Install New Dependencies

```bash
# Install pdfkit and nodemailer
npm install

# Verify installations
npm list | grep pdfkit
npm list | grep nodemailer

# Should see:
# ├── pdfkit@0.14.0
# ├── nodemailer@6.9.7
```

---

## 📧 STEP 3: Email Configuration (SMTP Setup)

### Option A: Gmail (Easiest - Recommended for Initial Setup)

#### 3.1 Create/Prepare Gmail Account

1. Use existing Gmail or create new: `greenpay@gmail.com`
2. Enable 2-Factor Authentication:
   - Go to: https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Complete setup

#### 3.2 Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other** → Type: **"GreenPay Server"**
4. Click **Generate**
5. **COPY THE 16-CHARACTER PASSWORD** (example: `abcd efgh ijkl mnop`)
6. **IMPORTANT:** Remove spaces when entering in .env

#### 3.3 Configure .env File

```bash
# Edit backend .env file
nano /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env
```

**Add these lines at the end:**

```env
# SMTP Email Configuration for Invoice Delivery
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=greenpay@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
SMTP_FROM_EMAIL=greenpay@gmail.com
SMTP_FROM_NAME=PNG Green Fees System
```

**Replace `abcdefghijklmnop` with your actual app password (no spaces)**

Save and exit: `Ctrl+X`, `Y`, `Enter`

#### 3.4 Test SMTP Connection

```bash
# Test if SMTP works
node -e "
require('dotenv').config();
const { verifyEmailConfig } = require('./utils/emailService');
verifyEmailConfig().then(result => {
  console.log(result ? '✅ SMTP configured correctly' : '❌ SMTP configuration failed');
  process.exit(result ? 0 : 1);
});
"
```

**Expected output:** `✅ Email service is configured and ready`

---

### Option B: Custom Domain Email (greenpay@eywademo.cloud)

If you want to use your own domain email:

#### 3.1 Get SMTP Settings from Your Email Provider

Contact your email hosting provider for:
- SMTP hostname (usually `mail.yourdomain.com`)
- SMTP port (usually 587 or 465)
- Username (usually full email address)
- Password

Common providers:

**cPanel/WHM:**
```env
SMTP_HOST=mail.eywademo.cloud
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=greenpay@eywademo.cloud
SMTP_PASSWORD=your-email-password
```

**Namecheap:**
```env
SMTP_HOST=mail.privateemail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=greenpay@eywademo.cloud
SMTP_PASSWORD=your-email-password
```

#### 3.2 Test SMTP Manually

```bash
# Test connection with telnet
telnet mail.eywademo.cloud 587

# If connects, type: QUIT and press Enter
# If doesn't connect, check firewall/hostname
```

#### 3.3 Configure and Test

Follow same steps as Gmail (3.3 and 3.4 above) with your custom settings.

---

## 🔄 STEP 4: Restart Backend Service

### 4.1 Restart with PM2

```bash
# If using PM2
pm2 restart greenpay-backend

# Or restart all
pm2 restart all

# Check status
pm2 status

# View logs to verify startup
pm2 logs greenpay-backend --lines 50
```

**Look for these in logs:**
```
✅ GreenPay API Server Running
✅ Port: 3001
✅ Database: greenpay
✅ Email service is configured and ready (if SMTP configured)
```

### 4.2 Alternative: Direct Node (if not using PM2)

```bash
# Stop current process
pkill -f "node server.js"

# Start in background
nohup node server.js > /var/log/greenpay-backend.log 2>&1 &

# Check if running
ps aux | grep "node server.js"
```

---

## 🎨 STEP 5: Frontend Deployment (if needed)

### 5.1 Pull Frontend Code

```bash
# Navigate to frontend directory
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud

# Pull latest changes
git pull origin main
```

### 5.2 Install Dependencies and Build

```bash
# Install any new dependencies
npm install

# Build production bundle
npm run build

# Verify build completed
ls -lh dist/
```

### 5.3 Restart Frontend (if using PM2)

```bash
pm2 restart greenpay-frontend

# Or if serving with Nginx, no restart needed
# Files in dist/ are served directly
```

---

## ⚙️ STEP 6: Configure Company Settings

### Option A: Via Database (Faster)

```bash
# Connect to database
psql -U postgres -d greenpay

-- Insert company settings
INSERT INTO settings (key, value, created_at) VALUES
  ('company_name', 'PNG Green Fees System', NOW()),
  ('company_address_line1', 'Sample Street 123', NOW()),
  ('company_city', 'Port Moresby', NOW()),
  ('company_province', 'National Capital District', NOW()),
  ('company_postal_code', '111', NOW()),
  ('company_country', 'Papua New Guinea', NOW()),
  ('company_tin', 'TIN123456789', NOW()),
  ('company_phone', '+675 XXX XXXX', NOW()),
  ('company_email', 'greenpay@eywademo.cloud', NOW())
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, updated_at = NOW();

-- Verify
SELECT key, value FROM settings WHERE key LIKE 'company_%';

-- Exit
\q
```

### Option B: Via Web Interface (Easier)

1. Open browser: https://greenpay.eywademo.cloud
2. Login as **Flex_Admin**
3. Navigate to: **Admin → System Settings**
4. Fill in company details:
   - **Company Name:** PNG Green Fees System
   - **Address Line 1:** Your street address
   - **City:** Port Moresby
   - **Province:** National Capital District
   - **Postal Code:** 111
   - **Country:** Papua New Guinea
   - **TIN:** Your TIN number
   - **Phone:** +675 XXX XXXX
   - **Email:** greenpay@eywademo.cloud
5. Click **Save**

**These settings will appear on all PDF invoices**

---

## 🧪 STEP 7: Testing

### Test 1: Verify Backend API

```bash
# Test health endpoint
curl http://localhost:3001/health

# Expected: {"status":"ok","message":"GreenPay API is running"}

# Test customers endpoint (replace TOKEN with actual JWT)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/customers

# Expected: [] or list of customers
```

### Test 2: Customer Management (via UI)

1. Login to https://greenpay.eywademo.cloud
2. Go to: **Admin → Customers**
3. Click **Add Customer**
4. Fill in:
   - Name: **Test Customer Ltd**
   - Address Line 1: **Test Street 123**
   - Email: **test@example.com**
   - TIN: **1234567890**
5. Click **Save**
6. ✅ Verify customer appears in list

### Test 3: PDF Generation

1. Go to: **Invoices** page
2. Find any existing invoice
3. Click **📄 Download PDF** button
4. ✅ Verify PDF downloads
5. Open PDF and verify:
   - Company name and TIN appear
   - Customer details appear
   - GST breakdown is correct (10%)
   - PNG compliance notice at bottom

### Test 4: Email Sending

**Prerequisites:** SMTP must be configured (Step 3)

1. Go to: **Invoices** page
2. Find any invoice
3. Click **✉️ Email Invoice** button
4. Enter your test email address
5. Click **Send Email**
6. ✅ Check your inbox
7. Verify:
   - Email received
   - Professional HTML formatting
   - PDF is attached
   - Invoice details are correct

### Test 5: Full Workflow

Complete end-to-end test:

1. **Create Customer:**
   - Admin → Customers → Add Customer
   - Name: "ABC Company"
   - Complete all fields

2. **Create Quotation** (if you have quotation module)

3. **Convert to Invoice:**
   - Quotations → Convert to Invoice

4. **Download PDF:**
   - Invoices → Download PDF

5. **Email Invoice:**
   - Invoices → Email Invoice
   - Send to your email
   - Verify receipt

---

## 🐛 STEP 8: Troubleshooting

### Issue 1: "Email service is not configured"

**Check .env file:**
```bash
grep SMTP_ /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env
```

**Verify values are set:**
```bash
node -e "
require('dotenv').config({ path: '/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env' });
console.log('SMTP User:', process.env.SMTP_USER || 'NOT SET');
console.log('SMTP Host:', process.env.SMTP_HOST || 'NOT SET');
console.log('Password Set:', process.env.SMTP_PASSWORD ? 'YES' : 'NO');
"
```

**Restart backend after fixing:**
```bash
pm2 restart greenpay-backend
```

### Issue 2: "Failed to generate PDF"

**Check pdfkit installed:**
```bash
npm list pdfkit
# Should show: pdfkit@0.14.0
```

**Reinstall if missing:**
```bash
npm install pdfkit
pm2 restart greenpay-backend
```

**Check company settings exist:**
```bash
psql -U postgres -d greenpay -c "SELECT COUNT(*) FROM settings WHERE key LIKE 'company_%';"
# Should show: count > 0
```

### Issue 3: "relation 'customers' does not exist"

**Check table exists:**
```bash
psql -U postgres -d greenpay -c "\dt customers"
```

**If not, run migration again:**
```bash
psql -U postgres -d greenpay -f /tmp/06-create-customers-table.sql
```

### Issue 4: Port 587 Blocked (Email)

**Check firewall:**
```bash
# Allow outbound SMTP
sudo ufw allow out 587/tcp
sudo ufw allow out 465/tcp

# Reload firewall
sudo ufw reload
```

**Test connection:**
```bash
telnet smtp.gmail.com 587
# Should connect. Type QUIT to exit
```

---

## 📊 STEP 9: Monitoring

### Check Backend Logs

```bash
# View live logs
pm2 logs greenpay-backend

# View last 100 lines
pm2 logs greenpay-backend --lines 100

# Filter for errors
pm2 logs greenpay-backend --err

# Check for email confirmations
pm2 logs greenpay-backend | grep "emailed"
```

### Check PostgreSQL Logs

```bash
# Ubuntu/Debian
tail -f /var/log/postgresql/postgresql-*.log

# Or
journalctl -u postgresql -f
```

### Check Nginx Logs (if using Nginx)

```bash
# Access log
tail -f /var/log/nginx/access.log

# Error log
tail -f /var/log/nginx/error.log
```

---

## ✅ STEP 10: Post-Deployment Checklist

Mark each item as you verify:

- [ ] Database migrations completed successfully
- [ ] Backend dependencies installed (pdfkit, nodemailer)
- [ ] SMTP configured in .env
- [ ] SMTP connection tested successfully
- [ ] Backend service restarted
- [ ] Company settings configured
- [ ] Customer creation tested
- [ ] Customer search tested
- [ ] PDF download tested
- [ ] PDF content verified (TIN, GST, etc.)
- [ ] Email sending tested
- [ ] Email received and verified
- [ ] Full workflow tested (create → invoice → PDF → email)
- [ ] Logs reviewed (no errors)
- [ ] Team notified of new features

---

## 🔐 Security Notes

### Protect .env File

```bash
# Check permissions
ls -l /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env

# Should be: -rw------- (600)
# If not, fix:
chmod 600 /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env

# Verify not in git
grep -q "^\.env$" .gitignore && echo "✅ .env protected" || echo "⚠️ Add .env to .gitignore"
```

### SMTP Best Practices

- ✅ Use App Passwords (not account passwords)
- ✅ Enable 2FA on email account
- ✅ Monitor sent emails regularly
- ✅ Set up SPF/DKIM records for custom domains
- ✅ Never commit SMTP passwords to git

---

## 🔄 Rollback Procedure

If something goes wrong:

```bash
# 1. Restore database from backup
psql -U postgres greenpay < /var/backups/greenpay/backup_YYYYMMDD_HHMMSS.sql

# 2. Revert code to previous commit
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
git reset --hard HEAD~6  # Goes back 6 commits

# 3. Rebuild and restart
cd backend
npm install
pm2 restart greenpay-backend

# 4. Verify system
curl http://localhost:3001/health
```

---

## 📞 Quick Command Reference

```bash
# SSH to server
ssh root@72.61.208.79

# Go to backend
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Pull code
git pull origin main

# Install deps
npm install

# Edit .env
nano .env

# Restart
pm2 restart greenpay-backend

# View logs
pm2 logs greenpay-backend

# Test SMTP
node -e "require('dotenv').config(); const {verifyEmailConfig} = require('./utils/emailService'); verifyEmailConfig().then(console.log);"

# Run migrations
psql -U postgres -d greenpay -f /tmp/06-create-customers-table.sql
psql -U postgres -d greenpay -f /tmp/07-link-quotations-to-customers.sql

# Backup DB
pg_dump -U postgres greenpay > backup_$(date +%Y%m%d).sql
```

---

## 📝 Deployment Summary Template

```
DEPLOYMENT DATE: _______________
DEPLOYED BY: _______________
TIME STARTED: _______________
TIME COMPLETED: _______________

✅ Database:
   - Backup created: [ ]
   - Migration 06 run: [ ]
   - Migration 07 run: [ ]
   - Tables verified: [ ]

✅ Backend:
   - Code pulled: [ ]
   - Dependencies installed: [ ]
   - SMTP configured: [ ]
   - Service restarted: [ ]

✅ Testing:
   - Customer CRUD: [ ]
   - PDF download: [ ]
   - Email sending: [ ]
   - Full workflow: [ ]

SMTP PROVIDER: _______________
FROM EMAIL: _______________

ISSUES ENCOUNTERED:
_________________________________
_________________________________

NOTES:
_________________________________
_________________________________
```

---

## 🎉 Success Criteria

Deployment is successful when:

- ✅ All database migrations run without errors
- ✅ Backend starts with no errors in logs
- ✅ SMTP test shows "configured and ready"
- ✅ Customer can be created via UI
- ✅ Invoice PDF can be downloaded
- ✅ Invoice can be emailed successfully
- ✅ Email arrives with PDF attachment
- ✅ All PNG IRC compliance fields present in PDF

---

**Ready to Deploy! Follow steps 1-10 in order. Good luck! 🚀**

**Time Estimate:** 30-45 minutes
**Difficulty:** Intermediate
**Risk Level:** Low (database backup created first)
