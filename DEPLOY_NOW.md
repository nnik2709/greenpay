# URGENT DEPLOYMENT - Fix Voucher and Passport Issues

**Date**: January 22, 2026
**Status**: Ready to deploy

## Files to Upload via CloudPanel

Upload these 3 files from `deployment-package/` folder:

### 1. Backend Routes
```
deployment-package/backend/routes/vouchers.js
  → Upload to: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

deployment-package/backend/routes/public-purchases.js
  → Upload to: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
```

### 2. Backend Utils (NEW FILE - must create folder if it doesn't exist)
```
deployment-package/backend/utils/nationalityNormalizer.js
  → Upload to: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/
```

## CloudPanel Upload Steps

1. **Login to CloudPanel**: https://your-cloudpanel-url
2. **Navigate to File Manager**
3. **Upload each file to its correct location** (see paths above)
4. **If `backend/utils/` folder doesn't exist**, create it first

## After Upload: Run in SSH Terminal

```bash
# Verify files are in place
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/vouchers.js
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/public-purchases.js
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/nationalityNormalizer.js

# Restart backend to load new code
pm2 restart greenpay-api

# Watch logs to verify no errors
pm2 logs greenpay-api --lines 20
```

## What This Fixes

✅ **Print All 404 error** - Added `/api/vouchers/code/:voucherCode` endpoint
✅ **Passport table creation** - Now creates records in `passports` table
✅ **Nationality normalization** - Converts "Denmark" → "DNK" consistently
✅ **Missing module error** - Adds `nationalityNormalizer.js` utility

## Testing After Deployment

1. **Create a new batch of 3 vouchers**
2. **Scan passport for each voucher**
3. **Check passports were created**:
   ```bash
   PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -c "SELECT * FROM passports ORDER BY created_at DESC LIMIT 5;"
   ```
4. **Click "Print All"** - Should work without 404 errors
5. **Check logs for any errors**:
   ```bash
   pm2 logs greenpay-api --lines 50 | grep -i error
   ```

## Expected Log Output (After Fix)

When you scan a passport, you should see:
```
New passport created: P212312781 (ID: 1, Nationality: DNK) for voucher ABC123
Passport registered: P212312781 (ID: 1) with voucher ABC123
```

OR if passport already exists:
```
Passport P212312781 already exists (ID: 1), reusing for voucher XYZ789
Passport registered: P212312781 (ID: 1) with voucher XYZ789
```

## Rollback Plan (If Issues Occur)

The backend has been attempting to start with the new code but failing due to missing `nationalityNormalizer.js`. After you upload all 3 files and restart, it should work. If there are still issues:

1. Check logs: `pm2 logs greenpay-api --err`
2. Verify file permissions: `ls -la /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/`
3. If needed, we can remove the nationality normalization temporarily

## Questions?

If you encounter any issues during deployment, paste the error logs and I'll help troubleshoot.
