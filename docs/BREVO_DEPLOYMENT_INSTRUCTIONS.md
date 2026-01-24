# Brevo SMTP Deployment Instructions

**Date**: 2026-01-15
**Status**: Ready for deployment
**Your Brevo Account**: a0282b001@smtp-brevo.com

---

## Your Brevo SMTP Credentials

```
SMTP Server: smtp-relay.brevo.com
Port: 587
Login: a0282b001@smtp-brevo.com
Password: [YOUR_SMTP_KEY - see below]
```

**IMPORTANT**: You need to copy your **SMTP key** from Brevo dashboard:
1. Go to: https://app.brevo.com
2. Navigate to: **Settings** → **SMTP & API** → **SMTP** tab
3. You should see your generated SMTP key (starts with `xkeysib-`)
4. Copy this key - you'll need it in Step 3 below

---

## Deployment Steps (Copy/Paste into SSH Terminal)

### Step 1: Backup Current .env File

```bash
ssh root@165.22.52.100 "cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend && cp .env .env.backup-gmail-$(date +%Y%m%d-%H%M%S) && ls -lh .env.backup-*"
```

### Step 2: View Current SMTP Settings

```bash
ssh root@165.22.52.100 "cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend && grep SMTP .env"
```

This will show your current Gmail settings. You'll replace these with Brevo settings.

### Step 3: Update .env File with Brevo Settings

**CRITICAL**: You'll need to manually edit the .env file. SSH to the server:

```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
nano .env
```

**Find these lines** (Gmail settings):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=your-gmail@gmail.com
SMTP_FROM_NAME=PNG Green Fees System
```

**Replace with Brevo settings**:
```env
# Brevo SMTP Configuration
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=a0282b001@smtp-brevo.com
SMTP_PASS=YOUR_SMTP_KEY_HERE
SMTP_FROM=png.greenfees@eywademo.cloud
SMTP_FROM_NAME=PNG Green Fees System
```

**REPLACE `YOUR_SMTP_KEY_HERE`** with the actual SMTP key from Brevo dashboard (starts with `xkeysib-`)

**Save and exit**:
- Press `Ctrl + O` to save
- Press `Enter` to confirm
- Press `Ctrl + X` to exit

---

## IMPORTANT: Sender Email Verification

You've set `SMTP_FROM=png.greenfees@eywademo.cloud` in the config above.

**You MUST verify this sender email in Brevo** before emails will send:

1. Go to Brevo dashboard: https://app.brevo.com
2. Navigate to: **Settings** → **Senders, Domains & Dedicated IPs** → **Senders** tab
3. Click **"Add a Sender"**
4. Add email: `png.greenfees@eywademo.cloud`
5. Brevo will send verification email to `png.greenfees@eywademo.cloud`
6. Access that email inbox and click verification link

**NOTE**: Since you already have access to `png.greenfees@eywademo.cloud`, you should be able to verify it immediately. This is better than using the generic Brevo email because it's your official domain.

---

## Step 4: Verify Configuration

```bash
# Still in SSH session, verify SMTP settings (won't show password)
grep SMTP_HOST .env
grep SMTP_PORT .env
grep SMTP_USER .env
grep SMTP_FROM .env

# Check all SMTP lines
grep SMTP .env
```

**Expected output**:
```
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=a0282b001@smtp-brevo.com
SMTP_PASS=xkeysib-...
SMTP_FROM=noreply@greenpay.gov.pg
SMTP_FROM_NAME=PNG Green Fees System
```

---

## Step 5: Restart Backend

```bash
pm2 restart greenpay-api

# Check status
pm2 list

# Monitor logs for startup
pm2 logs greenpay-api --lines 50
```

**Expected logs**:
```
0|greenpay-api | Server started on port 5001
0|greenpay-api | Database connected
```

**Look for errors**:
- ❌ "Authentication failed" → Check SMTP_USER and SMTP_PASS
- ❌ "Connection refused" → Check SMTP_HOST and SMTP_PORT
- ✅ No errors → Configuration successful

---

## Step 6: Test Email Sending

### Test Method 1: Voucher Purchase

1. Go to: https://greenpay.eywademo.cloud/buy-online
2. Purchase a small voucher (K 50)
3. Use your personal email address
4. Complete payment
5. Check your email inbox (and spam folder)

### Test Method 2: Check Backend Logs

While testing, monitor logs in real-time:

```bash
ssh root@165.22.52.100 "pm2 logs greenpay-api --lines 100"
```

**Look for**:
- ✅ "Email sent successfully"
- ✅ Recipient email address
- ❌ SMTP authentication errors
- ❌ Connection timeouts

### Test Method 3: Brevo Dashboard

1. Go to: https://app.brevo.com
2. Navigate to: **Statistics** → **Email**
3. Check recent sends:
   - ✅ Email appears in "Sent" list
   - ✅ Status: "Delivered"
   - ✅ Timestamp is recent

---

## Troubleshooting

### Issue 1: "535 Authentication Failed"

**Cause**: Wrong SMTP credentials

**Fix**:
```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
nano .env
# Double-check SMTP_USER and SMTP_PASS
# Make sure no extra spaces or quotes
# Save and restart: pm2 restart greenpay-api
```

### Issue 2: "Sender not verified"

**Cause**: SMTP_FROM email not verified in Brevo

**Fix**:
1. Go to Brevo: **Settings** → **Senders**
2. Verify `noreply@greenpay.gov.pg`
3. OR temporarily use `a0282b001@smtp-brevo.com` (already verified)

### Issue 3: Emails not arriving

**Check**:
1. Spam folder in recipient inbox
2. Brevo dashboard → Statistics → Email (check delivery status)
3. Backend logs for SMTP errors: `pm2 logs greenpay-api --err`

### Issue 4: Connection timeout

**Check firewall**:
```bash
ssh root@165.22.52.100
telnet smtp-relay.brevo.com 587
# Should connect. If not, firewall may be blocking port 587
```

---

## Rollback Plan (If Brevo Fails)

Quickly restore Gmail SMTP:

```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# List backups
ls -lh .env.backup-*

# Restore (replace timestamp with actual)
cp .env.backup-gmail-YYYYMMDD-HHMMSS .env

# Restart
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 20
```

---

## Success Checklist

After deployment, verify:
- [ ] `.env` file updated with Brevo credentials
- [ ] Backend restarted without errors
- [ ] Sender email verified in Brevo (or using verified email temporarily)
- [ ] Test voucher email sent successfully
- [ ] Test email delivered to inbox (not spam)
- [ ] Email appears in Brevo dashboard as "Delivered"
- [ ] From email shows correct sender
- [ ] No SMTP errors in backend logs

---

## Your Next Steps

1. **Get your SMTP key** from Brevo dashboard (Settings → SMTP & API)
2. **Run Step 1** - Backup current .env
3. **Run Step 3** - Update .env with Brevo credentials (including SMTP key)
4. **Verify sender email** in Brevo (or use `a0282b001@smtp-brevo.com` temporarily)
5. **Run Step 5** - Restart backend
6. **Run Step 6** - Test email sending
7. **Monitor** Brevo dashboard and backend logs

---

## Quick Copy/Paste Commands

```bash
# 1. Backup
ssh root@165.22.52.100 "cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend && cp .env .env.backup-gmail-$(date +%Y%m%d-%H%M%S)"

# 2. View current settings
ssh root@165.22.52.100 "cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend && grep SMTP .env"

# 3. Edit .env (then manually update with Brevo credentials)
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
nano .env

# 4. Verify settings
grep SMTP .env

# 5. Restart backend
pm2 restart greenpay-api && pm2 list

# 6. Monitor logs during test
pm2 logs greenpay-api --lines 100
```

---

**Configuration Summary**:
- **SMTP Server**: smtp-relay.brevo.com
- **Port**: 587
- **Login**: a0282b001@smtp-brevo.com
- **Password**: [Your SMTP key from Brevo]
- **From Email**: noreply@greenpay.gov.pg (verify in Brevo first)
- **From Name**: PNG Green Fees System

---

**Status**: ✅ READY FOR DEPLOYMENT
**Risk**: LOW (easy rollback to Gmail)
**Time**: 10-15 minutes
**Impact**: Production-ready email infrastructure
