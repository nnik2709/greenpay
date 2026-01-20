# Brevo SMTP Configuration Guide

**Date**: 2026-01-15
**Purpose**: Replace Gmail SMTP with production-ready Brevo SMTP service
**Free Tier**: 300 emails/day
**Region**: Singapore servers (optimal for Indonesia→PNG)
**Status**: ✅ READY FOR CONFIGURATION

---

## Why Brevo?

- **Free 300 emails/day** - Covers your 150-300 daily volume
- **Singapore servers** - Optimal routing for Indonesia→PNG
- **Drop-in replacement** - No code changes needed (uses Nodemailer)
- **Professional features** - Email templates, analytics, delivery tracking
- **High deliverability** - DKIM/SPF/DMARC configured automatically
- **Transactional focus** - Designed for system emails (not marketing)

---

## Part 1: Create Brevo Account

### Step 1: Sign Up

1. Go to: **https://www.brevo.com/**
2. Click **"Sign up free"**
3. Fill in registration form:
   - **Email**: Use a government/official email (e.g., `admin@greenpay.gov.pg` or work email)
   - **Password**: Strong password (save securely)
   - **Company Name**: `PNG Green Fees System` or `Government of Papua New Guinea`
   - **Country**: Select **Papua New Guinea** (or Indonesia if server location)
4. Click **"Create my account"**

### Step 2: Verify Email

1. Check your email inbox for verification email from Brevo
2. Click verification link
3. Complete any additional onboarding steps (skip marketing features)

### Step 3: Complete Account Setup

1. After login, you'll see the Brevo dashboard
2. Navigate to: **Settings** (gear icon, top right)
3. Go to: **Senders, Domains & Dedicated IPs** → **Senders**
4. Click **"Add a Sender"**
5. Add sender email:
   - **Email**: `noreply@greenpay.gov.pg` (or your domain)
   - **From Name**: `PNG Green Fees System`
6. Click **"Add"**
7. **Verify the sender email** (Brevo will send verification email to `noreply@greenpay.gov.pg`)

**Note**: If you don't have access to `noreply@greenpay.gov.pg` yet, you can temporarily use the email you signed up with and change it later.

---

## Part 2: Generate SMTP Credentials

### Step 1: Access SMTP Settings

1. In Brevo dashboard, go to: **Settings** (gear icon)
2. Click: **SMTP & API**
3. Select the **SMTP** tab

### Step 2: Generate SMTP Key

1. You'll see section: **"SMTP Settings"**
2. Click **"Create a new SMTP key"** (or use existing if shown)
3. Give it a name: `GreenPay Production Server`
4. Click **"Generate"**

### Step 3: Copy SMTP Credentials

**IMPORTANT**: Copy these credentials immediately - you won't see the password again!

You'll see:
```
SMTP Server: smtp-relay.brevo.com
Port: 587
Login: <your-brevo-email>
Password: <generated-smtp-key>
```

**Example**:
```
SMTP Server: smtp-relay.brevo.com
Port: 587
Login: admin@greenpay.gov.pg
Password: xkeysib-a1b2c3d4e5f6...
```

**Copy these to a secure location** (you'll need them for `.env` file).

---

## Part 3: Update Backend Configuration

### Step 1: SSH to Server

```bash
ssh root@165.22.52.100
```

### Step 2: Navigate to Backend Directory

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
```

### Step 3: Backup Current .env File

```bash
cp .env .env.backup-gmail-$(date +%Y%m%d-%H%M%S)

# Verify backup
ls -lh .env.backup-*
```

### Step 4: Update .env File

Open `.env` file for editing:

```bash
nano .env
```

**Find and update these SMTP settings** (replace Gmail values with Brevo):

**BEFORE (Gmail)**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=your-gmail@gmail.com
SMTP_FROM_NAME=PNG Green Fees System
```

**AFTER (Brevo)**:
```env
# Brevo SMTP Configuration
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=admin@greenpay.gov.pg
SMTP_PASS=xkeysib-a1b2c3d4e5f6...
SMTP_FROM=noreply@greenpay.gov.pg
SMTP_FROM_NAME=PNG Green Fees System
```

**Replace**:
- `SMTP_USER` - Your Brevo login email (from Step 2.3 above)
- `SMTP_PASS` - Your generated SMTP key (from Step 2.3 above)
- `SMTP_FROM` - Verified sender email (from Part 1, Step 3.5)

**Save and exit**:
- Press `Ctrl + O` to save
- Press `Enter` to confirm
- Press `Ctrl + X` to exit

### Step 5: Verify .env File

```bash
# Check SMTP settings (without showing password)
grep "SMTP_HOST" .env
grep "SMTP_PORT" .env
grep "SMTP_USER" .env
grep "SMTP_FROM" .env

# Verify file is readable
cat .env | grep SMTP
```

### Step 6: Restart Backend Service

```bash
pm2 restart greenpay-api

# Check status
pm2 list

# Monitor logs for startup errors
pm2 logs greenpay-api --lines 50
```

**Expected output**:
```
0|greenpay-api | Server started on port 5001
0|greenpay-api | Database connected
0|greenpay-api | SMTP configured: smtp-relay.brevo.com
```

---

## Part 4: Test Email Sending

### Test 1: Send Test Email via Backend

**Option A: Use API Endpoint (if available)**

```bash
# Test email endpoint (if your backend has one)
curl -X POST https://greenpay.eywademo.cloud/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@gmail.com"}'
```

**Option B: Trigger Email via Application**

1. Go to: https://greenpay.eywademo.cloud/buy-online
2. Complete a small voucher purchase (K 50)
3. Use your personal email address
4. Check if voucher confirmation email arrives

### Test 2: Check Brevo Dashboard

1. Go to Brevo dashboard: https://app.brevo.com
2. Navigate to: **Statistics** → **Email**
3. Verify:
   - ✅ Email appears in "Sent" list
   - ✅ Status shows "Delivered" (not bounced)
   - ✅ Timestamp is recent

### Test 3: Check Backend Logs

```bash
# Monitor logs while sending test email
ssh root@165.22.52.100 "pm2 logs greenpay-api --lines 100"
```

Look for:
- ✅ "Email sent successfully"
- ✅ No SMTP authentication errors
- ✅ No connection timeouts

### Test 4: Check Email Delivery

1. Check recipient inbox (including spam folder)
2. Verify:
   - ✅ Email delivered successfully
   - ✅ From name: "PNG Green Fees System"
   - ✅ From email: `noreply@greenpay.gov.pg`
   - ✅ Content displays correctly
   - ✅ Not marked as spam

---

## Part 5: Verify notificationService.js (No Changes Needed)

Your existing `backend/services/notificationService.js` is already compatible with Brevo. It uses **Nodemailer**, which supports Brevo out of the box.

**Current code pattern** (should work without changes):
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendEmail(to, subject, htmlBody, textBody, attachments = []) {
  const mailOptions = {
    from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM}>`,
    to,
    subject,
    html: htmlBody,
    text: textBody,
    attachments
  };

  return await transporter.sendMail(mailOptions);
}
```

**This code is Brevo-compatible** - no changes needed, just update `.env` credentials.

---

## Part 6: Monitor Production Usage

### Daily Monitoring (First Week)

1. **Brevo Dashboard**: Check daily email count and delivery rate
   - Go to: **Statistics** → **Email**
   - Monitor: Sent, Delivered, Bounced, Spam reports

2. **Backend Logs**: Monitor for email errors
   ```bash
   ssh root@165.22.52.100 "pm2 logs greenpay-api --lines 200 | grep -i email"
   ```

3. **Check Free Tier Limit**:
   - Brevo allows **300 emails/day**
   - If you exceed, emails will queue for next day
   - Dashboard shows remaining daily quota

### Set Up Alerts (Optional)

1. In Brevo dashboard, go to: **Settings** → **Notifications**
2. Enable email alerts for:
   - High bounce rate
   - Spam complaints
   - Daily limit approaching (90% threshold)

---

## Troubleshooting

### Issue 1: "Authentication Failed" Error

**Cause**: Incorrect SMTP credentials in `.env`

**Solution**:
```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
nano .env
# Verify SMTP_USER and SMTP_PASS match Brevo credentials
# Double-check no extra spaces or quotes
pm2 restart greenpay-api
```

### Issue 2: "Sender Email Not Verified"

**Cause**: Sender email not verified in Brevo

**Solution**:
1. Go to Brevo: **Settings** → **Senders, Domains & Dedicated IPs**
2. Resend verification email to sender address
3. Verify the email
4. Wait 5 minutes and retry

### Issue 3: Emails Going to Spam

**Cause**: SPF/DKIM not configured for your domain

**Solution**:
1. In Brevo dashboard, go to: **Settings** → **Senders, Domains & Dedicated IPs** → **Domains**
2. Click **"Authenticate your domain"**
3. Follow DNS configuration instructions (add TXT records to your domain)
4. This requires access to your domain's DNS settings (e.g., GoDaddy, Cloudflare)

### Issue 4: Connection Timeout

**Cause**: Firewall blocking port 587

**Solution**:
```bash
# Test SMTP connection from server
ssh root@165.22.52.100
telnet smtp-relay.brevo.com 587
# Should connect successfully

# If blocked, check firewall rules
ufw status
# Allow port 587 if needed
ufw allow 587/tcp
```

### Issue 5: Exceeding Daily Limit (300 emails)

**Cause**: More than 300 emails sent in 24 hours

**Solution**:
1. **Short term**: Upgrade to Brevo paid plan ($25/month for 20,000 emails)
2. **Workaround**: Batch non-critical emails (e.g., daily summary instead of per-transaction)
3. **Monitoring**: Add code to track daily count and warn when approaching limit

---

## Rollback Plan (If Brevo Fails)

If Brevo has issues, quickly rollback to Gmail:

```bash
# SSH to server
ssh root@165.22.52.100

# Navigate to backend
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Restore Gmail settings
cp .env.backup-gmail-YYYYMMDD-HHMMSS .env

# Restart backend
pm2 restart greenpay-api

# Verify
pm2 logs greenpay-api --lines 20
```

---

## Success Criteria Checklist

After configuration, verify:
- [ ] Brevo account created and email verified
- [ ] Sender email verified in Brevo
- [ ] SMTP credentials generated
- [ ] `.env` file updated with Brevo credentials
- [ ] Backend restarted without errors
- [ ] Test email sent successfully
- [ ] Test email delivered to inbox (not spam)
- [ ] Email appears in Brevo dashboard as "Delivered"
- [ ] No authentication errors in backend logs
- [ ] From email shows as `noreply@greenpay.gov.pg`
- [ ] From name shows as "PNG Green Fees System"

---

## Expected Behavior After Configuration

### Email Flow
```
Application → notificationService.js → Nodemailer → Brevo SMTP (Singapore) → Recipient (PNG)
```

### Email Types Sent via Brevo
1. **Voucher Confirmations** - After purchase (individual/corporate)
2. **Invoice Notifications** - GST invoices, quotation invoices
3. **Quotation Emails** - Quote PDFs to customers
4. **Password Resets** - User account recovery
5. **System Notifications** - Admin alerts, reports

### Daily Volume Estimate
- **Voucher purchases**: ~50-100 emails/day
- **Invoices/Quotations**: ~30-50 emails/day
- **Password resets**: ~5-10 emails/day
- **System notifications**: ~10-20 emails/day
- **Total**: ~100-180 emails/day (well under 300 limit)

---

## Deployment Commands Summary (Copy/Paste)

```bash
# 1. Backup current .env
ssh root@165.22.52.100 "cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend && cp .env .env.backup-gmail-$(date +%Y%m%d-%H%M%S)"

# 2. Edit .env file (you'll need to manually update SMTP settings)
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
nano .env
# Update SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM as shown in Step 4 above

# 3. Restart backend
pm2 restart greenpay-api && pm2 list

# 4. Monitor logs during test email
pm2 logs greenpay-api --lines 100
```

---

## Additional Brevo Features (Optional)

### 1. Email Templates (Future Enhancement)
- Create HTML templates in Brevo dashboard
- Use template IDs in your code instead of inline HTML
- Easier to update email designs without code changes

### 2. Email Tracking
- Track open rates and click rates
- See which customers opened voucher emails
- Available in Brevo dashboard under **Statistics**

### 3. Webhooks (Advanced)
- Get real-time delivery/bounce notifications
- Useful for tracking failed email deliveries
- Configure in: **Settings** → **Webhooks**

### 4. Contact Lists (Optional)
- Store customer email list in Brevo
- Useful for mass announcements or maintenance notifications
- Not needed for transactional emails

---

**Status**: ✅ CONFIGURATION GUIDE COMPLETE
**Risk Level**: LOW (drop-in replacement, easy rollback)
**Estimated Setup Time**: 20-30 minutes
**Business Impact**: HIGH (production-ready email infrastructure)

---

## Next Steps After Brevo Configuration

1. **Complete Brevo setup** using this guide
2. **Test thoroughly** with real voucher purchases
3. **Monitor first 24 hours** of email delivery
4. **Update email templates** to include "Retrieve Vouchers" link (Phase 2 pending task)
5. **Set up domain authentication** (SPF/DKIM) for better deliverability (optional but recommended)

---

## Contact & Support

**Brevo Support**:
- Email: support@brevo.com
- Help Center: https://help.brevo.com
- Live chat available in dashboard

**System Issues**:
- Check backend logs: `pm2 logs greenpay-api`
- Check Brevo dashboard: https://app.brevo.com
- Rollback to Gmail if critical issue

---
