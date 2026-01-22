# CRITICAL DEPLOYMENT - Fix Passport Registration + Logo Diagnostics

**Date**: January 22, 2026
**Status**: Ready to deploy
**Priority**: URGENT - Passport registration completely broken

## Issues Fixed

1. ✅ **Passport registration 500 error** - column "sex" doesn't exist in database (FIXED in SELECT)
2. ✅ **Passport registration 500 error** - column "passport_id" doesn't exist (FIXED in UPDATE)
3. ✅ **Print All 404 error** - missing `/api/vouchers/code/:voucherCode` endpoint
4. ✅ **Wizard completion bug** - fixed auto-advance after last scan
5. 🔍 **Thermal receipt logos** - added diagnostic logging to find root cause

## Files to Upload via CloudPanel

Upload these **4 files** from `deployment-package/` folder:

### Backend Routes
```
deployment-package/backend/routes/vouchers.js
  → /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

deployment-package/backend/routes/public-purchases.js
  → /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
```

### Backend Utils
```
deployment-package/backend/utils/nationalityNormalizer.js (NEW FILE)
  → /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/

deployment-package/backend/utils/pdfGenerator.js
  → /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/
```

## Deployment Steps

### 1. Upload Files via CloudPanel
- Login to CloudPanel File Manager
- Navigate to each destination folder
- Upload the corresponding file
- **Create `backend/utils/` folder if it doesn't exist**

### 2. Verify Upload (SSH)
```bash
# Check all files are uploaded
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/vouchers.js
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/public-purchases.js
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/nationalityNormalizer.js
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/pdfGenerator.js
```

### 3. Restart Backend
```bash
pm2 restart greenpay-api

# Watch for errors
pm2 logs greenpay-api --lines 30
```

### 4. Test Passport Registration
1. Create a batch of 3 vouchers
2. Scan passport for each voucher
3. **Should now work without 500 errors**
4. Check logs:
```bash
pm2 logs greenpay-api | grep -A 3 "passport created"
```

### 5. Check Logo Loading (NEW)
Generate a thermal receipt and check logs:
```bash
pm2 logs greenpay-api | grep "Thermal Receipt"
```

You should see:
```
[Thermal Receipt] Logo path: /home/.../backend/assets/logos/ccda-logo.png
[Thermal Receipt] Logo exists: true
[Thermal Receipt] Logo added successfully
```

If you see `Logo exists: false`, the path is wrong.
If you see an error, that's the root cause of missing logos.

### 6. Verify Database
```bash
# Check passports were created
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -c "SELECT id, passport_number, full_name, nationality, created_at FROM passports ORDER BY created_at DESC LIMIT 5;"
```

You should see the newly scanned passports.

## What Each File Does

### public-purchases.js
- **CRITICAL FIX #1**: Removed 'sex' column from passport SELECT query (line 549)
- **CRITICAL FIX #2**: Removed 'sex' column from passport INSERT (lines 566-577)
- **CRITICAL FIX #3**: Removed 'passport_id' column from voucher UPDATE (lines 592-606)
- Production database tables don't have these columns
- Was causing all passport registrations to fail with 500 errors

### vouchers.js
- Added `/api/vouchers/code/:voucherCode` endpoint
- Fixes Print All 404 errors

### nationalityNormalizer.js (NEW)
- Utility for converting nationality formats
- "Denmark" → "DNK", "PNG" → "Papua New Guinean", etc.
- Ensures consistent 3-letter ISO codes in database

### pdfGenerator.js
- Added diagnostic logging for thermal receipt logos
- Will help identify why logos aren't showing
- Better error messages

## Expected Behavior After Deployment

### Passport Registration
- ✅ Scan passport → No 500 error
- ✅ Passport created in database
- ✅ Voucher linked to passport
- ✅ Wizard advances to next voucher
- ✅ After last voucher → Goes to completion screen
- ✅ Print All works (no 404)

### Thermal Receipt Logos
- Logs will show if logo file is found
- Logs will show if logo loads successfully
- **If logos still missing**, check the logged path vs actual file location

## Troubleshooting

### Error: "MODULE_NOT_FOUND: nationalityNormalizer"
- You didn't upload `backend/utils/nationalityNormalizer.js`
- Or `backend/utils/` folder doesn't exist
- Create folder and upload file

### Error: "column 'sex' does not exist"
- You didn't upload the new `public-purchases.js`
- Or server cached the old version
- Force restart: `pm2 delete greenpay-api && pm2 start ...`

### Logos still missing in thermal receipt
- Check logs for `[Thermal Receipt]` messages
- Compare logged path with actual file location
- Verify file permissions: `ls -l backend/assets/logos/`

### Print All still shows 404
- You didn't upload new `vouchers.js`
- Clear browser cache
- Check logs: `pm2 logs greenpay-api | grep "GET /api/vouchers/code/"`

## Serial Port Errors (Separate Issue)

The console errors about serial ports are browser-level:
```
'close' on 'SerialPort': The port is already closed
Failed to open serial port
```

These are **normal** when:
- Scanner is unplugged
- Port is in use by another app
- Browser lost connection

Not related to the passport/logo issues.

---

## Success Criteria

After deployment, you should be able to:
1. ✅ Create batch of vouchers
2. ✅ Scan passports without errors
3. ✅ See passports in database
4. ✅ Click "Print All" without 404
5. 🔍 See thermal receipt logo diagnostic logs

Let me know the results after deployment and we'll fix any remaining issues!
