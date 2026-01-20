# Rate Limiting Disabled for Testing

**Date**: 2026-01-14
**File Changed**: `backend/routes/buy-online.js`

## Changes Made

Disabled the 3 purchases per hour rate limiting to allow unrestricted testing:

1. **Line 27-45**: Commented out `purchaseLimiter` definition
2. **Line 246**: Removed `purchaseLimiter` middleware from `/prepare-payment` route

## Impact

- Users can now make unlimited purchase attempts
- No more 429 "Maximum 3 purchases per hour" errors
- Testing can proceed without rate limit restrictions

## Deployment

**File to deploy**: `/Users/nikolay/github/greenpay/backend/routes/buy-online.js`

**Production path**: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js`

**Steps**:
1. Upload `buy-online.js` via CloudPanel File Manager to production path
2. SSH to server and run: `pm2 restart greenpay-api`
3. Test: Make multiple purchases without waiting - should work immediately

## Re-enabling for Production

When testing is complete, uncomment the rate limiter:
- Uncomment lines 27-45 (purchaseLimiter definition)
- Change line 246 back to: `router.post('/prepare-payment', purchaseLimiter, async (req, res) => {`
- Redeploy and restart PM2

---

**Status**: Ready for deployment
**Priority**: Deploy to enable unrestricted testing
