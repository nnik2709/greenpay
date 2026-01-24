# Passport Lookup Rate Limiting - Security Fix Deployment

**Date**: 2026-01-17
**Status**: ✅ Ready for Deployment
**Priority**: P0 - Security Critical

---

## What This Fixes

**Security Vulnerability**: The passport lookup endpoint was vulnerable to enumeration attacks, allowing unlimited attempts to discover passport numbers and personal data.

**Attack Scenario**:
```bash
# Attacker could run this:
for i in {1000000..9999999}; do
  curl https://greenpay.eywademo.cloud/api/passports/lookup/P$i
done
```

**Fix**: Added rate limiting - maximum 20 requests per 15 minutes per IP address.

---

## Files to Deploy

**1 Backend File:**
- `backend/routes/passports.js`

---

## Deployment Steps

### Step 1: Upload File via CloudPanel

1. Open CloudPanel File Manager
2. Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`
3. Upload `backend/routes/passports.js` (overwrite existing)

### Step 2: Restart Backend

Paste this command in your SSH terminal:

```bash
pm2 restart greenpay-api && pm2 logs greenpay-api --lines 20
```

### Step 3: Verify Rate Limiting Works

Test the rate limiting with these commands:

```bash
# Test 1: Normal lookup should work
curl https://greenpay.eywademo.cloud/api/passports/lookup/P1234567

# Test 2: Rapid-fire 25 requests (should get rate limited after 20)
for i in {1..25}; do
  echo "Request $i:"
  curl -s https://greenpay.eywademo.cloud/api/passports/lookup/TEST$i | jq -r '.error // .success'
  sleep 0.5
done
```

**Expected Result**:
- First 20 requests: Normal response (success or 404)
- Requests 21-25: Rate limit error message:
```json
{
  "success": false,
  "error": "Too many passport lookup requests. Please try again in 15 minutes."
}
```

---

## Changes Made

### `backend/routes/passports.js`

**Line 7** - Added rate limiting import:
```javascript
const rateLimit = require('express-rate-limit');
```

**Lines 342-353** - Rate limiter configuration:
```javascript
const passportLookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per 15 minutes
  message: {
    success: false,
    error: 'Too many passport lookup requests. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

**Line 363** - Applied to endpoint:
```javascript
router.get('/lookup/:passportNumber', passportLookupLimiter, async (req, res) => {
```

---

## Dependencies

**No new npm packages required** - `express-rate-limit` should already be in `package.json` from other endpoints.

If deployment fails with "Cannot find module 'express-rate-limit'", run:

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
npm install express-rate-limit
pm2 restart greenpay-api
```

---

## Success Criteria

After deployment:
- ✅ Passport lookup endpoint responds normally for first 20 requests
- ✅ 21st request within 15 minutes returns rate limit error
- ✅ Rate limit resets after 15 minutes
- ✅ Backend logs show no errors
- ✅ Different IP addresses have separate rate limit counters

---

## Security Impact

**Before**: Attacker could enumerate all passports in database
**After**: Attacker limited to 20 attempts per 15 minutes

**Additional Recommendation** (P1 - Future Enhancement):
Consider requiring voucher code context for lookup to further restrict access.

---

## Next Steps After Deployment

Once backend is deployed and verified:

1. **Frontend Implementation**: Add device detection and passport lookup UI to PublicRegistration.jsx
2. **User Testing**: Test mobile camera scanner and desktop MRZ scanner
3. **Monitoring**: Track passport lookup usage patterns

---

**Risk Level**: LOW (additive security feature, doesn't affect existing functionality)
**Estimated Time**: 5 minutes deployment + 2 minutes testing
**Business Impact**: Prevents passport data enumeration attacks
