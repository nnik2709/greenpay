# BSP DOKU Payment Failure Diagnosis Plan

**Date**: 2026-01-14 22:50 UTC
**Current Status**: All 4 test cards failing with `00TO` timeout

## What We Know

### ✅ Working Correctly
- Database connection timeout: 60 seconds (already deployed)
- Webhook processing: Successfully updating database
- All security fixes: Functioning as expected
- Debug logging: Active and providing good diagnostics

### ❌ Failing
- BSP DOKU payments: Timing out with `00TO` error
- Cardinal Commerce 3D Secure: JavaScript errors in browser
- All 4 test cards that worked before: Now failing

## Critical Question

**Are our security fixes causing the BSP DOKU timeouts?**

The timeline suggests yes (cards worked before, fail after security deployment), but the logs show our code is working correctly. We need to definitively determine the cause.

## Recommended Diagnostic Steps

### Step 1: Test with Old Working Version (QUICK TEST)

**Purpose**: Definitively determine if security fixes are causing the problem

**Action**:
1. Upload the old working version temporarily: `/Users/nikolay/github/greenpay/deployment-package/buy-online-WORKING.js` (26 KB)
2. Rename current file to `buy-online-with-security.js` (backup)
3. Rename `buy-online-WORKING.js` to `buy-online.js`
4. Restart PM2: `pm2 restart greenpay-api`
5. Test ONE card

**Expected Results**:
- **If card works**: Security fixes ARE causing the problem → investigate further
- **If card fails**: Security fixes are NOT the problem → BSP DOKU staging issue

**Time**: 5 minutes

### Step 2A: If Old Version Works (Security Fixes Causing Problem)

This means something in our security fixes is interfering with BSP DOKU/Cardinal Commerce.

**Investigate**:
1. Check if HSTS headers are interfering
2. Check if rate limiting is blocking Cardinal Commerce requests
3. Check if PII masking is breaking payment data
4. Add security fixes back one at a time to isolate the problem

**Strategy**: Binary search - add half the fixes, test, narrow down which specific fix breaks payments

### Step 2B: If Old Version Also Fails (BSP DOKU Issue)

This confirms the problem is external (BSP DOKU staging environment or Cardinal Commerce).

**Actions**:
1. **Restore security fixes** - Upload `buy-online-with-security.js` back as `buy-online.js`
2. **Contact BSP DOKU support** about:
   - Recent staging environment changes
   - Test card availability issues
   - Cardinal Commerce 3D Secure timeout problems
   - `00TO` error code spike
3. **Try production environment** if available (not staging)
4. **Wait and retry** - Staging issue might resolve itself

## Files Available

### Working Version (Before Security Fixes)
- **Path**: `/Users/nikolay/github/greenpay/deployment-package/buy-online-WORKING.js`
- **Size**: 26 KB
- **Status**: Known working version
- **Security Fixes**: None

### Current Version (With Security Fixes)
- **Path**: `/Users/nikolay/github/greenpay/deployment-package/buy-online.js`
- **Size**: 42 KB
- **Status**: Currently deployed on production
- **Security Fixes**: All 9 banking-grade fixes
- **Database Timeout**: 60 seconds

## Quick Test Commands

### Upload Old Version via CloudPanel
1. Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`
2. Rename `buy-online.js` to `buy-online-with-security.js` (backup)
3. Upload `buy-online-WORKING.js` and rename to `buy-online.js`
4. SSH command: `pm2 restart greenpay-api`
5. Test ONE card to see if it works

### Check File Size to Confirm
```bash
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js
# Should show: 26K = old version, 42K = new version with security
```

### Monitor Logs
```bash
pm2 logs greenpay-api --lines 50
```

Look for:
- Payment session creation
- BSP DOKU response
- Webhook processing
- Any `00TO` errors

## Expected Outcome

After 5-minute test:
- **Definitive answer** on whether security fixes are causing the problem
- **Clear next steps** based on test results
- **No permanent changes** (easy to revert either way)

## My Recommendation

**Test the old version first.** This is the fastest way to get a definitive answer. If the old version works, we know to investigate our security fixes. If it also fails, we know it's a BSP DOKU issue and can restore security fixes with confidence.

---

**Next Step**: Your decision:
1. Test old version (5 minutes, definitive answer)
2. Investigate security fixes first (longer, less certain)
3. Contact BSP DOKU support first (slowest, requires their response)
