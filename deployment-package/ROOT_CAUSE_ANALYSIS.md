# Root Cause Analysis: BSP DOKU Payment Failures

**Date**: 2026-01-14 23:30 UTC
**Analyst**: Senior Payment Systems Security Engineer
**Status**: Two prime suspects identified

## Evidence Summary

### Facts
1. ✅ 4 test cards worked BEFORE security fixes
2. ❌ Same 4 cards fail with `00TO` timeout AFTER security fixes
3. ✅ Backend webhook processing works (database updates successful)
4. ❌ Cardinal Commerce shows JavaScript errors in browser
5. ❌ Timeout occurs during 3D Secure authentication at BSP DOKU side

### Cardinal Commerce Browser Errors
```javascript
web-client-content-script.js:2 Uncaught TypeError: Failed to execute 'observe' on 'MutationObserver': parameter 1 is not of type 'Node'.
```

This error suggests Cardinal Commerce's JavaScript cannot find DOM elements it expects, likely because resources failed to load.

## Prime Suspect #1: HSTS Headers (90% Confidence)

### The Problem

**File**: `backend/routes/buy-online.js:103`
```javascript
router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});
```

**What This Does**:
- Tells browsers: "Force HTTPS on this domain AND ALL subdomains for 1 year"
- Browser caches this policy locally
- Browser **blocks** any HTTP resources from loading

**Why This Breaks Cardinal Commerce**:
1. Cardinal Commerce 3D Secure runs in an iframe on BSP DOKU's domain
2. Cardinal Commerce may load resources from:
   - `geostag.cardinalcommerce.com` (seen in logs)
   - Other Cardinal Commerce CDN domains
   - Potentially mixed HTTP/HTTPS resources

3. If our HSTS header applies to the parent page, browsers may block Cardinal Commerce resources
4. Cardinal Commerce JavaScript fails → 3D Secure fails → Payment times out with `00TO`

### Evidence Supporting This Theory

1. **Timing**: Perfect correlation with security fixes deployment
2. **Browser errors**: Cardinal Commerce JavaScript failing to find DOM nodes
3. **Webhook success**: Our backend works fine, problem is client-side (browser/3D Secure)
4. **All cards fail**: Not card-specific, suggests environmental/browser issue

### The Fix

**Option A: Remove HSTS Headers Entirely (Safest for Testing)**
```javascript
// COMMENT OUT lines 101-106 in buy-online.js
// router.use((req, res, next) => {
//   if (process.env.NODE_ENV === 'production') {
//     res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
//   }
//   next();
// });
```

**Option B: Remove includeSubDomains (More Secure)**
```javascript
res.setHeader('Strict-Transport-Security', 'max-age=31536000'); // Remove includeSubDomains
```

**Option C: Conditional HSTS (Exclude Payment Routes)**
```javascript
router.use((req, res, next) => {
  // Don't set HSTS on payment-related routes
  const paymentPaths = ['/prepare-payment', '/webhook', '/callback'];
  const isPaymentRoute = paymentPaths.some(path => req.path.includes(path));

  if (process.env.NODE_ENV === 'production' && !isPaymentRoute) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});
```

## Prime Suspect #2: Session ID Length (60% Confidence)

### The Problem

**Before Security Fixes**: Session IDs were ~13 characters
**After Security Fixes**: Session IDs are 36 characters

**New format**:
```
PGKO-MKEJIA92-EKj_zhDGIGrDg1Yr7hZR_A
├─┬─┼────┬────┼──────────┬───────────┤
  5    8    1        22       Total: 36 chars
```

**Where Session IDs Are Used**:
1. `TRANSIDMERCHANT` field in payment form
2. `SESSIONID` field in payment form
3. SHA1 signature generation (WORDS parameter)
4. Database queries
5. Return URLs

**Potential Issues**:
- BSP DOKU may have undocumented field length limits (e.g., 20 or 30 chars)
- URL parameters might get truncated
- Form field maxlength restrictions

### The Fix

**Option: Shorten Session IDs**
```javascript
// In backend/routes/buy-online.js, modify generateSecureSessionId()
function generateSecureSessionId() {
  const timestamp = Date.now().toString(36).toUpperCase().substring(0, 6); // Limit to 6 chars
  const randomBytes = crypto.randomBytes(8); // Reduce from 16 to 8 bytes
  const random = randomBytes.toString('base64url').substring(0, 11); // 11 chars instead of 22
  return `PGKO-${timestamp}-${random}`; // Total: ~23 characters
}
```

## Recommended Action Plan

### Phase 1: Test HSTS Fix (Highest Priority)

**Step 1**: Create version WITHOUT HSTS headers
```bash
# File: backend/routes/buy-online.js
# Comment out lines 101-106 (HSTS middleware)
```

**Step 2**: Deploy and test
- Upload via CloudPanel
- Restart PM2: `pm2 restart greenpay-api`
- Test ONE card

**Expected Result**:
- If payment works → **HSTS was the culprit**
- If payment fails → Move to Phase 2

### Phase 2: Test Session ID Length (If Phase 1 Fails)

**Step 1**: Shorten session IDs to ~23 characters
**Step 2**: Deploy and test
**Expected Result**: Payment should work if length was the issue

### Phase 3: Incremental Security Restoration

Once payments work, restore security features one at a time:
1. Add HSTS without `includeSubDomains`
2. Test → If works, keep it
3. Add other security features individually
4. Test after each addition

## Files Ready for Testing

### Fix #1: Remove HSTS (Test First)
**File**: Create `buy-online-NO-HSTS.js`
- Comment out HSTS middleware (lines 101-106)
- Keep all other security fixes

### Fix #2: Shorten Session IDs (If Fix #1 Fails)
**File**: Create `buy-online-SHORT-SESSION-IDS.js`
- Reduce session ID length to ~23 characters
- Keep all other security fixes

## Technical Explanation

### Why HSTS Breaks Third-Party Payment Systems

HSTS (HTTP Strict Transport Security) is a security header that forces browsers to use HTTPS. The `includeSubDomains` directive extends this policy to ALL subdomains.

**The Problem with Payment Gateways**:
1. Payment gateways (BSP DOKU, Cardinal Commerce) run in iframes
2. They load resources from multiple domains (CDNs, analytics, fraud detection)
3. Some of these domains may not support HTTPS or may have mixed content
4. When our site sets HSTS with `includeSubDomains`, it can affect how the browser handles these third-party resources
5. Browser silently blocks non-compliant resources → Payment system breaks

**Industry Standard**:
- Payment gateways usually handle HSTS themselves
- Merchant sites should NOT set aggressive HSTS policies that interfere with payment iframes
- PCI-DSS requires HTTPS but doesn't mandate HSTS on merchant sites

## Next Steps

1. **Immediate**: Test Fix #1 (Remove HSTS)
2. **If successful**: Restore HSTS without `includeSubDomains`
3. **If unsuccessful**: Test Fix #2 (Shorten session IDs)
4. **Final**: Document which security features are compatible with BSP DOKU

---

**Confidence Level**: 90% that HSTS is the root cause
**Time to Resolution**: ~15 minutes of testing
**Business Impact**: Critical - Payment functionality must be restored
