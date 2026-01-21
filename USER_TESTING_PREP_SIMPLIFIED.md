# User Testing Preparation - Simplified
**Date**: January 21, 2026
**Status**: ✅ Ready

---

## Task 1 & 2: Database Cleanup ✅

### File Created
`database/CLEANUP_FOR_USER_TESTING.sql`

### What It Does
- Removes ALL test data (passports, vouchers, quotations, invoices, purchases, etc.)
- Keeps ONLY flexadmin user
- Preserves system config (email templates, settings)
- Resets ID sequences to start fresh

### How to Run

**1. Create backup first:**
```bash
ssh root@165.22.52.100
PGPASSWORD='GreenPay2025!Secure#PG' pg_dump -h 165.22.52.100 -U greenpay greenpay > backup_$(date +%Y%m%d_%H%M%S).sql
```

**2. Upload SQL file via CloudPanel to:**
`/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/database/`

**3. Run cleanup:**
```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay < database/CLEANUP_FOR_USER_TESTING.sql
```

**4. Verify:**
```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -c "SELECT id, name, email, role FROM \"User\";"
```
Should show only 1 user (flexadmin).

---

## Task 3: Email Sending Consistency ✅

### What Was Fixed
All email sending now uses `process.env.SMTP_FROM` consistently - removed fallback hardcoded addresses.

### Files Modified (5)
1. `backend/services/notificationService.js` - Main email service
2. `backend/routes/vouchers.js` - Voucher emails
3. `backend/routes/buy-online.js` - Online purchase emails
4. `backend/routes/invoices-gst.js` - Invoice emails (minor fix)
5. `backend/utils/pdfGenerator.js` - No changes needed (reverted)

### What Changed
**Before:**
```javascript
from: process.env.SMTP_FROM || '"PNG Green Fees" <noreply@greenpay.gov.pg>'
```

**After:**
```javascript
from: process.env.SMTP_FROM
```

This ensures all emails use the same sender address from .env file.

### .env Requirements
Your production .env must have:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="PNG Green Fees" <noreply@greenpay.gov.pg>
```

**Note:** Code looks for `SMTP_PASS` not `SMTP_PASSWORD`.

---

## Deployment Steps

### Step 1: Upload Modified Backend Files

Via CloudPanel, upload to `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/`:
- `services/notificationService.js`
- `routes/vouchers.js`
- `routes/buy-online.js`
- `routes/invoices-gst.js`

### Step 2: Verify .env File

SSH and check:
```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
grep SMTP .env
```

Ensure these exist:
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS (or SMTP_PASSWORD - if PASSWORD, need to update code)
- SMTP_FROM

### Step 3: Restart Backend

```bash
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 50
```

Check for errors.

### Step 4: Run Database Cleanup

(See Task 1 & 2 above)

### Step 5: Test Email Sending

1. Login as flexadmin
2. Create a test individual purchase
3. Enter your email address
4. Complete transaction
5. Check inbox - email should arrive
6. Verify sender matches SMTP_FROM from .env

---

## Verification Checklist

- [ ] Database backup created
- [ ] Modified backend files uploaded
- [ ] SMTP_FROM set in .env
- [ ] PM2 restarted successfully
- [ ] Database cleanup completed
- [ ] Only flexadmin user remains
- [ ] Test email sent successfully
- [ ] Email sender matches .env setting
- [ ] No errors in PM2 logs

---

## What Was NOT Changed

- Contact emails displayed in PDFs (still hardcoded: png.greenfees@ccda.gov.pg)
- Support email in email footers (still hardcoded: support@greenpay.gov.pg)
- Phone numbers
- Company info

These are display-only text, not sending addresses, so they don't need to be in .env.

---

## Summary

**Database**: Clean slate for testing, only flexadmin remains
**Emails**: All sending uses same SMTP from .env
**No new .env variables needed**: Uses existing SMTP settings

Simple and focused on what you asked for! 🎯
