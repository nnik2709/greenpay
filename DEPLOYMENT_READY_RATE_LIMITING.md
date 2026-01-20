# Deployment Ready: Passport Lookup Rate Limiting Security Fix

**Date**: 2026-01-17
**Status**: ✅ READY FOR MANUAL DEPLOYMENT
**Priority**: P0 - Security Critical

---

## Files to Deploy

### Backend (1 file)
- `backend/routes/passports.js`

### Frontend (entire dist/ folder)
- `dist/` - All 85 files built successfully

---

## Quick Deployment Checklist

- [ ] Upload `backend/routes/passports.js` via CloudPanel
- [ ] Upload entire `dist/` folder via CloudPanel
- [ ] Restart backend: `pm2 restart greenpay-api`
- [ ] Restart frontend: `pm2 restart png-green-fees`
- [ ] Test rate limiting with curl commands
- [ ] Verify frontend loads correctly

---

## Step-by-Step Deployment Instructions

### Part 1: Backend Deployment

**1. Upload Backend File via CloudPanel**
   - Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`
   - Upload: `backend/routes/passports.js` (overwrite existing)

**2. Restart Backend Service**
```bash
pm2 restart greenpay-api && pm2 logs greenpay-api --lines 20
```

**3. Verify Rate Limiting Works**
```bash
# Test 1: Normal lookup (should work)
curl https://greenpay.eywademo.cloud/api/passports/lookup/P1234567

# Test 2: Rapid requests (should get rate limited after 20)
for i in {1..25}; do
  echo "Request $i:"
  curl -s https://greenpay.eywademo.cloud/api/passports/lookup/TEST$i | jq -r '.error // .success'
  sleep 0.5
done
```

**Expected Result**:
- Requests 1-20: Normal responses (success or 404)
- Requests 21-25: `"Too many passport lookup requests. Please try again in 15 minutes."`

---

### Part 2: Frontend Deployment

**1. Upload Frontend Files via CloudPanel**
   - Navigate to: `/var/www/png-green-fees/`
   - Delete existing `dist/` folder
   - Upload entire new `dist/` folder (85 files)

**2. Restart Frontend Service**
```bash
pm2 restart png-green-fees && pm2 logs png-green-fees --lines 20
```

**3. Verify Frontend Loads**
```bash
# Test frontend is responding
curl -I https://eywademo.cloud
```

**Expected**: HTTP 200 OK response

---

## What This Deployment Fixes

### Security Vulnerability Patched
**Before**: Passport lookup endpoint allowed unlimited enumeration attacks
**After**: Rate limited to 20 requests per 15 minutes per IP

**Attack Scenario (Now Blocked)**:
```bash
# This attack is now blocked by rate limiting:
for i in {1000000..9999999}; do
  curl https://greenpay.eywademo.cloud/api/passports/lookup/P$i
done
```

---

## Backend Changes Summary

### File: `backend/routes/passports.js`

**Line 7** - Added rate limiting dependency:
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

**Line 363** - Applied to `/lookup/:passportNumber` endpoint:
```javascript
router.get('/lookup/:passportNumber', passportLookupLimiter, async (req, res) => {
```

---

## Frontend Build Summary

**Build Time**: 8.83s
**Modules Transformed**: 3,454
**Total Files**: 85
**Main Bundle**: `index-8ef16db9.js` (765.89 KB, gzip: 237.73 KB)

---

## Dependencies Check

**No new npm packages required** - `express-rate-limit` should already exist in `package.json`.

**If deployment fails** with "Cannot find module 'express-rate-limit'":
```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
npm install express-rate-limit
pm2 restart greenpay-api
```

---

## Success Criteria

After deployment, verify:

### Backend Verification
- ✅ Passport lookup endpoint responds normally (first 20 requests)
- ✅ 21st request returns rate limit error
- ✅ Rate limit resets after 15 minutes
- ✅ Different IPs have separate rate limit counters
- ✅ Backend logs show no errors

### Frontend Verification
- ✅ Website loads at https://eywademo.cloud
- ✅ All pages accessible
- ✅ No console errors in browser DevTools
- ✅ PM2 shows "online" status for both services

---

## Rollback Plan (If Needed)

If deployment causes issues:

**Backend Rollback**:
```bash
# Restore previous version from CloudPanel backup
# OR revert git commit and redeploy
pm2 restart greenpay-api
```

**Frontend Rollback**:
```bash
# Restore previous dist/ folder from CloudPanel backup
pm2 restart png-green-fees
```

---

## Post-Deployment Monitoring

**First 24 Hours**:
- Monitor PM2 logs for rate limiting events
- Check for any false positives (legitimate users getting blocked)
- Verify no performance degradation

**Commands**:
```bash
# Monitor backend logs
pm2 logs greenpay-api --lines 100

# Monitor frontend logs
pm2 logs png-green-fees --lines 100

# Check PM2 status
pm2 status
```

---

## Next Steps After Deployment

Once this deployment is complete and verified:

1. **Frontend Device Detection Implementation** (P0 - Next Phase)
   - Add device detection to PublicRegistration.jsx
   - Integrate SimpleCameraScanner for mobile
   - Add manual passport lookup button
   - See: `UX_ARCHITECTURE_REVIEW.md` for requirements

2. **Testing** (P1)
   - Test mobile camera scanner
   - Test desktop MRZ scanner
   - Test passport lookup auto-fill

3. **Monitoring** (P2)
   - Track passport lookup usage patterns
   - Monitor rate limiting effectiveness
   - Gather user feedback

---

## Detailed File Upload Paths

### Backend
**Source**: `backend/routes/passports.js`
**Destination**: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/passports.js`
**Method**: CloudPanel File Manager > Upload (overwrite)

### Frontend
**Source**: `dist/` (entire folder, 85 files)
**Destination**: `/var/www/png-green-fees/dist/`
**Method**: CloudPanel File Manager > Delete old dist/ > Upload new dist/

---

## Support Information

**Documentation Created**:
- `PASSPORT_LOOKUP_RATE_LIMITING_DEPLOYMENT.md` - Detailed backend deployment guide
- `UX_ARCHITECTURE_REVIEW.md` - Comprehensive UX/Architecture review
- `PUBLIC_REGISTRATION_IMPLEMENTATION_PLAN.md` - Frontend implementation plan
- `DEVICE_DETECTION_DEPLOYMENT_SUMMARY.md` - Overview of device detection feature

**PM2 Process Names**:
- Backend: `greenpay-api`
- Frontend: `png-green-fees`

**Deployment Method**: Manual upload via CloudPanel (no automated SSH/SCP access)

---

**Risk Level**: LOW
- Security fix (additive, doesn't break existing functionality)
- Frontend unchanged (rebuild only for consistency)

**Estimated Time**: 10 minutes total
- Backend: 5 minutes upload + restart + test
- Frontend: 5 minutes upload + restart + verify

**Business Impact**: HIGH
- Prevents passport enumeration attacks
- Protects customer personal data
- Compliance with security best practices

---

**Status**: ✅ READY FOR DEPLOYMENT
**Tested**: ✅ Local build successful
**Reviewed**: ✅ UX/Architecture review complete (Grade: B+)
**Security**: ✅ Rate limiting implemented
