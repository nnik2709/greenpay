# Test Version: BSP Flow Before Security Hardening

**Date**: 2026-01-14 23:00 UTC
**Git Commit**: 0899fc9 ("Add deployment package documentation for security fixes")
**Status**: This is the last working version before security hardening

## File Details

**File**: `/Users/nikolay/github/greenpay/deployment-package/buy-online-BEFORE-SECURITY.js`
**Size**: 25 KB
**Lines**: 830
**Status**: BSP DOKU flow WITHOUT security fixes - this was working!

## What This Version Has

✅ **BSP DOKU Payment Integration**: Full BSP flow (no passport data required upfront)
✅ **Webhook Processing**: Same BSP DOKU webhook handlers
✅ **Session Management**: Same payment session logic
✅ **Database Operations**: Same database connection pool

## What This Version Does NOT Have

❌ **HTTPS Enforcement**: No enforceHTTPS middleware
❌ **Rate Limiting**: No rate limits on purchases
❌ **Cryptographic Session IDs**: Using simple timestamp-based IDs
❌ **PII Masking**: Full data in logs
❌ **Generic Error Messages**: Detailed error messages
❌ **HSTS Headers**: No Strict-Transport-Security
❌ **Input Validation**: No validation functions
❌ **Connection Pool Timeout**: No connectionTimeoutMillis limit
❌ **Timing Attack Protection**: No constant-time comparisons

## Quick Test Plan

### Step 1: Upload This Version
1. Via CloudPanel, navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`
2. **Rename current file** to `buy-online-WITH-SECURITY.js` (backup)
3. Upload `buy-online-BEFORE-SECURITY.js` and rename to `buy-online.js`
4. Verify file size: `ls -lh buy-online.js` (should show 25K, not 42K)

### Step 2: Restart Backend
```bash
pm2 restart greenpay-api
```

### Step 3: Test ONE Card
Test with **one** of your 4 test cards to see if payment completes successfully.

### Step 4: Check Results

**If payment succeeds**:
- ✅ Confirms security fixes ARE causing the problem
- Next: Use binary search to find which specific fix breaks payments
- Strategy: Add security fixes back one at a time

**If payment still fails**:
- ✅ Confirms security fixes are NOT the problem
- Next: Restore security fixes and contact BSP DOKU
- Likely: BSP DOKU staging environment issue

### Step 5: Binary Search (If Security Fixes Are The Problem)

If the payment works with this version, we'll add security fixes back in groups to narrow down the culprit:

**Round 1** - Add half the fixes:
1. HTTPS enforcement + HSTS headers
2. Cryptographic session IDs
3. PII masking
4. Generic error messages

**Test**. If works, add more. If fails, remove half.

**Round 2** - Narrow down further based on Round 1 results

**Round 3** - Identify the specific fix

## File Comparison Available

To see exactly what changed in the security hardening:

```bash
diff /Users/nikolay/github/greenpay/deployment-package/buy-online-BEFORE-SECURITY.js \
     /Users/nikolay/github/greenpay/deployment-package/buy-online.js
```

This will show all 9 security fixes that were added.

## Deployment Commands (Copy/Paste for SSH)

```bash
# Check current file size on production
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js

# After uploading via CloudPanel, restart backend
pm2 restart greenpay-api

# Monitor logs during test
pm2 logs greenpay-api --lines 50
```

## Expected Timeline

- **Upload**: 2 minutes (via CloudPanel)
- **Restart**: 10 seconds
- **Test**: 2 minutes (one card payment)
- **Total**: ~5 minutes to get definitive answer

## Important Notes

1. **This version has the same BSP flow** - it will work with your test workflow
2. **Keep security version backed up** - renamed as `buy-online-WITH-SECURITY.js`
3. **Easy to revert** - just rename files and restart PM2
4. **This is a diagnostic test** - we'll restore security fixes after identifying the problem

---

**Status**: Ready for testing
**Next Step**: Upload and test to definitively determine if security fixes are causing BSP DOKU timeouts
**File Size Check**: 25K = before security, 42K = with security
