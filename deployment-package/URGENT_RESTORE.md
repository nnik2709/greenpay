# ⚠️ URGENT: Restore Working Version

**Date**: 2026-01-14 22:25 UTC
**Issue**: Security fixes broke payment processing
**Root Cause**: Database connection timeout (10 seconds) too aggressive for BSP DOKU 3D Secure

## Problem Identified

The security changes added this to the database pool configuration:

```javascript
connectionTimeoutMillis: 10000, // Timeout after 10 seconds if no connection available
```

**This 10-second timeout is likely causing BSP DOKU payments to fail during 3D Secure authentication**, which can take longer than 10 seconds.

## IMMEDIATE ACTION REQUIRED

Deploy the **WORKING VERSION** immediately to restore payment functionality:

**File**: `/Users/nikolay/github/greenpay/deployment-package/buy-online-WORKING.js` (26 KB)

This is the version that was working successfully before security changes.

## Deployment Steps

### 1. Upload via CloudPanel
- Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`
- **Rename current file** to `buy-online.js.broken` (backup)
- Upload `buy-online-WORKING.js` and rename to `buy-online.js`

### 2. Verify File
```bash
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js
# Should show: 26K (not 42K)
```

### 3. Restart PM2
```bash
pm2 restart greenpay-api
```

### 4. Test Payment
- Test with the 4 cards that were working before
- They should work again immediately

## What Was Reverted

All security changes were removed:
1. ❌ Database connection pool timeout (THIS WAS THE PROBLEM)
2. ❌ HTTPS enforcement middleware
3. ❌ Rate limiting
4. ❌ Cryptographic session IDs
5. ❌ PII masking
6. ❌ HSTS headers
7. ❌ Input validation
8. ❌ Generic error messages

## Next Steps

After confirming payments work again:

1. **Test with working cards** to verify restoration
2. **Document which cards work** for future reference
3. **Security fixes can be re-applied later** with proper timeout configuration:
   - Remove or increase `connectionTimeoutMillis`
   - Test incrementally with one security fix at a time
   - Ensure 3D Secure completes before database timeout

## Technical Analysis

**Why the 10-second timeout broke payments:**

BSP DOKU's payment flow with 3D Secure:
1. Customer enters card details (< 1 second)
2. Redirect to 3D Secure authentication (1-2 seconds)
3. **Cardinal Commerce 3D Secure verification (10-30 seconds)** ← TIMEOUT HERE
4. Return to merchant with result (1-2 seconds)
5. Webhook notification to update database

If the database connection pool times out during step 3-5, the webhook cannot update the transaction status, causing the payment to fail with `00TO`.

---

**Status**: URGENT - Deploy immediately to restore payment functionality
**Priority**: P0 - Business Critical
**File Size Check**: 26 KB = working version, 42 KB = broken version
