# User Testing Preparation - Ready to Deploy
**Date**: January 21, 2026
**Status**: ✅ All tasks completed

---

## Overview

Three tasks completed for user testing:
1. ✅ Database cleanup script (removes test data, keeps only flexadmin)
2. ✅ Email sending consistency (uses your .env SMTP settings)
3. ✅ No hardcoded values (all configurable via .env)

---

## Your Current .env Settings

### Database Credentials:
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=greenpay_db
DB_USER=greenpay_user
DB_PASSWORD=<your_database_password>
```

### SMTP Settings:
```bash
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=a0282b001@smtp-brevo.com
SMTP_PASS=<your_brevo_smtp_password>
SMTP_FROM_EMAIL=png.greenfees@eywademo.cloud
SMTP_FROM_NAME=PNG Green Fees System
```

✅ All files now use these exact variable names!

---

## What Was Fixed

### Email Sending - All files now use:
```javascript
const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
const fromName = process.env.SMTP_FROM_NAME || 'PNG Green Fees System';
from: `"${fromName}" <${fromEmail}>`
```

This creates: `"PNG Green Fees System" <png.greenfees@eywademo.cloud>`

### Files Modified (4 files):
1. **backend/services/notificationService.js** - Main email service (4 places fixed)
2. **backend/routes/vouchers.js** - Voucher emails (5 places fixed)
3. **backend/routes/buy-online.js** - Online purchase emails (1 place fixed)
4. **backend/routes/invoices-gst.js** - Already using hardcoded display text (no change needed)

**Total**: 10 email sending points now use your .env settings

---

## Database Cleanup

### Backup Command
```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
PGPASSWORD="GreenPay2025!Secure#PG" pg_dump -h localhost -U greenpay_user greenpay_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Cleanup Script
**File**: `database/CLEANUP_FOR_USER_TESTING.sql`

**What it does**:
- Deletes ALL test data (11 tables)
- Keeps ONLY flexadmin user
- Preserves email templates and settings
- Resets ID sequences to 1

**Upload to**: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/database/`

**Run with**:
```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay_user -d greenpay_db < database/CLEANUP_FOR_USER_TESTING.sql
```

**Verify**:
```bash
PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay_user -d greenpay_db -c "SELECT id, name, email, role FROM \"User\";"
```
Should show only 1 row (flexadmin).

---

## Deployment Steps

### 1. Create Database Backup
```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
PGPASSWORD="GreenPay2025!Secure#PG" pg_dump -h localhost -U greenpay_user greenpay_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Upload Files via CloudPanel

**Destination**: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/`

Upload these 3 files:
- `services/notificationService.js`
- `routes/vouchers.js`
- `routes/buy-online.js`

**Also upload SQL to**:
`/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/database/CLEANUP_FOR_USER_TESTING.sql`

### 3. Restart Backend
```bash
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 50
```
Check for errors.

### 4. Run Database Cleanup
```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay_user -d greenpay_db < database/CLEANUP_FOR_USER_TESTING.sql
```

Watch the output - it will show before/after counts.

### 5. Test Email Sending

1. Login as flexadmin
2. Go to Individual Purchase
3. Create a test passport
4. Create a voucher purchase
5. Enter your email address
6. Complete transaction
7. Check your inbox

**Expected email sender**: `"PNG Green Fees System" <png.greenfees@eywademo.cloud>`

---

## Verification Checklist

- [ ] Database backup created successfully
- [ ] 3 backend files uploaded via CloudPanel
- [ ] SQL cleanup script uploaded to database folder
- [ ] PM2 restarted without errors
- [ ] No errors in PM2 logs
- [ ] Database cleanup completed successfully
- [ ] Only 1 user remains (flexadmin)
- [ ] Test voucher purchase completed
- [ ] Email received successfully
- [ ] Email sender shows: PNG Green Fees System <png.greenfees@eywademo.cloud>
- [ ] PDF attachment opens correctly

---

## What Happens After Cleanup

**Database state**:
- All passports: DELETED
- All vouchers: DELETED
- All quotations: DELETED
- All invoices: DELETED
- All purchases: DELETED
- All tickets: DELETED
- All users except flexadmin: DELETED
- ID sequences: RESET to 1
- Email templates: PRESERVED
- Settings: PRESERVED

**Fresh start for testing!**

---

## Troubleshooting

### Email not received?
```bash
# Check PM2 logs for email errors
pm2 logs greenpay-api | grep -i email

# Verify SMTP settings in .env
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
grep SMTP .env
```

### Wrong email sender?
- Check that SMTP_FROM_EMAIL is set correctly in .env
- Restart PM2 after .env changes
- Test again with new transaction

### Database cleanup failed?
- Check you're running as greenpay user (not postgres)
- Verify password is correct
- Check PostgreSQL is accepting connections
- Look for error messages in cleanup output

### Can't login after cleanup?
```bash
# Check flexadmin user exists
PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay_user -d greenpay_db -c "SELECT * FROM \"User\" WHERE role = 'Flex_Admin';"
```

If missing, restore from backup.

---

## Summary

**✅ Ready for deployment!**

- All email sending uses your Brevo SMTP settings from .env
- Database cleanup script ready to wipe test data
- Only flexadmin user will remain
- No hardcoded email addresses in sending code
- All configurable via .env file

**Files to deploy**: 3 backend files + 1 SQL script
**Time to deploy**: ~10 minutes
**Risk**: Low (reversible with database backup)

---

**Deploy when ready! All set for user testing tomorrow.** 🚀
