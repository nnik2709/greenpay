# Email Functionality Issue - Diagnosis & Fix

**Date:** December 20, 2024
**Status:** ✅ SMTP CONFIGURED (Gmail)
**Priority:** HIGH - TESTING REQUIRED

---

## Status Update

**SMTP is now configured** on production server with Gmail credentials:
- SMTP_USER: nikolov1969@gmail.com
- SMTP configured and ready to send emails

**Next Step:** Test email functionality to confirm it's working.

## Original Issue Summary

Email functionality was not working because SMTP credentials were not configured in the production environment.

### Affected Features:
1. **Print Voucher Email** - Cannot send voucher PDFs to customers
2. **Quotation Email** - Cannot send quotation PDFs to customers
3. **Invoice Email** - Cannot send invoice PDFs to customers
4. **Voucher Notifications** - Cannot send purchase confirmation emails

---

## Root Cause

The backend email service requires SMTP configuration, but the current `.env` file contains placeholder values:

```bash
# Current configuration (INVALID):
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com          # ❌ PLACEHOLDER
SMTP_PASS=your-app-password             # ❌ PLACEHOLDER
SMTP_FROM="GreenPay Support <noreply@greenpay.com>"
```

When email functions are called, the service detects missing/invalid credentials and fails with:
```
⚠️  SMTP credentials not configured. Email sending is disabled.
   Please set SMTP_USER and SMTP_PASS in your .env file
```

---

## How Email System Works

### Backend Services:
1. **`backend/services/notificationService.js`**
   - `sendQuotationEmail()` - Sends quotation with PDF attachment
   - `sendInvoiceEmail()` - Sends invoice with PDF attachment
   - `sendVoucherNotification()` - Sends voucher codes after payment
   - `sendEmail()` - Generic email sender with SMTP

2. **`backend/utils/emailService.js`**
   - Alternative invoice email service
   - Uses same SMTP configuration

### SMTP Flow:
```
User clicks "Email Quotation"
  ↓
Frontend calls API: POST /api/quotations/:id/email
  ↓
Backend route handler calls sendQuotationEmail()
  ↓
notificationService checks SMTP credentials
  ↓
If invalid: Returns error "Email service not configured"
If valid: Sends email via nodemailer
```

---

## Solution Options

### Option 1: Gmail SMTP (Easiest for Testing)

**Setup Steps:**

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "GreenPay" as the name
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

3. **Update `.env` file on production server:**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-actual-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   SMTP_FROM_EMAIL=your-actual-email@gmail.com
   SMTP_FROM_NAME=PNG Green Fees System
   ```

4. **Restart backend:**
   ```bash
   pm2 restart greenpay-api
   ```

**Pros:**
- ✅ Free
- ✅ Easy to set up
- ✅ Works immediately
- ✅ Good for testing

**Cons:**
- ❌ 500 emails/day limit
- ❌ Not professional for production
- ❌ Gmail branding in headers

---

### Option 2: Government SMTP Server (Recommended for Production)

If PNG government has an SMTP server:

```bash
SMTP_HOST=mail.gov.pg                    # Or smtp.ccda.gov.pg
SMTP_PORT=587                            # Or 25, 465
SMTP_SECURE=false                        # true for port 465
SMTP_USER=greenpay@ccda.gov.pg
SMTP_PASS=your-government-smtp-password
SMTP_FROM_EMAIL=greenpay@ccda.gov.pg
SMTP_FROM_NAME=PNG Green Fees System
```

**Contact IT department for:**
- SMTP server hostname
- Port number
- Authentication credentials
- TLS/SSL requirements

**Pros:**
- ✅ Professional email address
- ✅ No sending limits
- ✅ Government domain credibility
- ✅ Full control

---

### Option 3: Commercial Email Service (Most Reliable)

Professional email services with high deliverability:

#### **SendGrid** (Recommended)
- Free tier: 100 emails/day
- Paid: Starting at $15/month for 40,000 emails

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM_EMAIL=noreply@greenpay.gov.pg
SMTP_FROM_NAME=PNG Green Fees System
```

Setup: https://sendgrid.com/

#### **AWS SES** (Cost-effective, requires AWS account)
- $0.10 per 1,000 emails
- Very reliable

```bash
SMTP_HOST=email-smtp.ap-southeast-2.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-ses-username
SMTP_PASS=your-aws-ses-password
SMTP_FROM_EMAIL=noreply@greenpay.gov.pg
SMTP_FROM_NAME=PNG Green Fees System
```

Setup: https://aws.amazon.com/ses/

#### **Mailgun**
- Free tier: 1,000 emails/month
- Paid: Starting at $35/month

```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.yourdomain.com
SMTP_PASS=your-mailgun-smtp-password
SMTP_FROM_EMAIL=noreply@greenpay.gov.pg
SMTP_FROM_NAME=PNG Green Fees System
```

**Pros:**
- ✅ Professional
- ✅ High deliverability
- ✅ Analytics & tracking
- ✅ Dedicated support

**Cons:**
- ❌ Monthly cost
- ❌ Requires account setup

---

## Deployment Steps

### Step 1: Choose SMTP Provider
Choose from options above (Gmail for testing, Government/Commercial for production)

### Step 2: Update Production .env

Connect to production server and edit `.env`:

```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
nano .env
```

Add/update these lines (example with Gmail):
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourrealemail@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM_EMAIL=yourrealemail@gmail.com
SMTP_FROM_NAME=PNG Green Fees System
```

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

### Step 3: Restart Backend

```bash
pm2 restart greenpay-api
```

### Step 4: Verify Configuration

Check PM2 logs for SMTP verification:
```bash
pm2 logs greenpay-api --lines 20
```

Look for:
```
✅ SMTP connection verified
```

If you see:
```
⚠️ SMTP not configured - using mock mode
```
Then credentials are still invalid.

### Step 5: Test Email Functionality

1. Log into GreenPay as Finance Manager
2. Go to Quotations
3. Click "Email" on any quotation
4. Check if email is sent successfully

---

## Testing Email Locally

To test email functionality in development:

1. **Update `backend/.env`:**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-test-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM_EMAIL=your-test-email@gmail.com
   SMTP_FROM_NAME=GreenPay Dev
   ```

2. **Start backend:**
   ```bash
   cd backend
   npm run dev
   ```

3. **Test quotation email:**
   - Create a quotation in the UI
   - Click "Email" button
   - Check your inbox

---

## Code References

### Quotation Email Endpoint
**File:** `backend/routes/quotations.js`
```javascript
// POST /api/quotations/:id/email
router.post('/:id/email', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { recipient_email } = req.body;

  // ... get quotation from database ...

  const result = await sendQuotationEmail(recipient_email, quotation);
  res.json({ success: true, messageId: result.messageId });
});
```

### Email Service
**File:** `backend/services/notificationService.js:262-446`
```javascript
async function sendQuotationEmail(recipientEmail, quotation) {
  // Check if SMTP is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    throw new Error('Email service not configured');
  }

  // Generate PDF
  const pdfBuffer = await generateQuotationPDF(quotation);

  // Send email with attachment
  const transporter = nodemailer.createTransporter({ ... });
  await transporter.sendMail({ ... });
}
```

---

## Environment Variable Reference

### Required Variables:
```bash
SMTP_HOST=smtp.example.com         # SMTP server hostname
SMTP_PORT=587                      # SMTP port (25, 465, 587)
SMTP_USER=user@example.com         # SMTP username/email
SMTP_PASS=your-password-here       # SMTP password or app password
```

### Optional Variables:
```bash
SMTP_SECURE=false                  # true for port 465, false for 25/587
SMTP_FROM_EMAIL=noreply@example.com  # Sender email (defaults to SMTP_USER)
SMTP_FROM_NAME=PNG Green Fees      # Sender name
```

### Variable Name Compatibility:
The code checks for both:
- `SMTP_PASS` (preferred, used in notificationService.js)
- `SMTP_PASSWORD` (legacy, used in emailService.js)

Both work, but `SMTP_PASS` is recommended.

---

## Common Issues & Troubleshooting

### Issue 1: "Email service not configured"
**Cause:** SMTP_USER or SMTP_HOST not set
**Fix:** Add proper SMTP credentials to `.env`

### Issue 2: "Invalid login" or "Authentication failed"
**Cause:** Wrong username/password
**Fix:**
- For Gmail: Use App Password, not regular password
- Check credentials are correct
- Ensure no extra spaces in `.env`

### Issue 3: "Connection timeout"
**Cause:** Firewall blocking SMTP port
**Fix:** Ensure port 587 (or 25/465) is open on server

### Issue 4: Emails go to spam
**Cause:** SPF/DKIM not configured
**Fix:**
- Use commercial service (SendGrid, SES)
- OR configure SPF/DKIM for your domain
- OR use government SMTP server

### Issue 5: "TLS/SSL error"
**Cause:** Wrong SMTP_SECURE setting
**Fix:**
- Port 587: `SMTP_SECURE=false`
- Port 465: `SMTP_SECURE=true`
- Port 25: `SMTP_SECURE=false`

---

## Security Best Practices

1. **Never commit SMTP credentials to git**
   - Use `.env` file only
   - Add `.env` to `.gitignore`

2. **Use App Passwords for Gmail**
   - Never use your actual Gmail password
   - Generate dedicated app password

3. **Restrict .env file permissions**
   ```bash
   chmod 600 backend/.env
   ```

4. **Rotate passwords periodically**
   - Change SMTP passwords every 90 days
   - Update `.env` after rotation

5. **Use dedicated email account**
   - Don't use personal email
   - Create `noreply@yourdomain.com` or similar

---

## Quick Start (For Testing)

**Fastest way to get emails working:**

1. **Use your Gmail account:**
   ```bash
   # Enable 2FA on your Gmail account
   # Generate App Password at: https://myaccount.google.com/apppasswords
   ```

2. **Update production `.env`:**
   ```bash
   SMTP_USER=your.email@gmail.com
   SMTP_PASS=abcd efgh ijkl mnop
   ```

3. **Restart:**
   ```bash
   pm2 restart greenpay-api
   ```

4. **Test immediately** - emails should now work!

---

## Next Steps

1. **Immediate (Testing):**
   - ✅ Set up Gmail SMTP for testing
   - ✅ Test quotation email
   - ✅ Test invoice email
   - ✅ Test voucher email

2. **Short-term (Production):**
   - 📋 Contact IT for government SMTP server details
   - 📋 OR sign up for SendGrid/SES
   - 📋 Configure production-grade SMTP
   - 📋 Set up SPF/DKIM records

3. **Long-term (Optimization):**
   - 📋 Monitor email delivery rates
   - 📋 Set up email analytics
   - 📋 Create email templates in UI
   - 📋 Add email queue for high volume

---

## Summary

**Problem:** Email not working because SMTP not configured

**Solution:** Configure SMTP credentials in `backend/.env`

**Quick Fix:** Use Gmail App Password (5 minutes setup)

**Production Fix:** Use government SMTP or commercial service

**Files to Update:**
- `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env` (production)
- Restart: `pm2 restart greenpay-api`

---

**Document Version:** 1.0
**Last Updated:** December 20, 2024
**Ready for Deployment:** ⚠️ REQUIRES SMTP CONFIGURATION
