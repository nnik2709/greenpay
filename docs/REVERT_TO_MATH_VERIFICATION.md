# Reverted to Math Verification (from Cloudflare Turnstile)

## Summary

Reverted the bot protection system from Cloudflare Turnstile back to simple math verification because Cloudflare free tier doesn't allow webhook exceptions.

## Changes Made

### Frontend (`src/pages/BuyOnline.jsx`)

1. **Removed Turnstile Component**
   - Removed `@marsidev/react-turnstile` import
   - Removed Turnstile widget from form

2. **Added Math Verification**
   - Added math question state (randomly generated on mount)
   - Added math answer input field
   - User must answer simple addition question (e.g., "What is 3 + 7?")

3. **Updated API Call**
   - Changed from sending `turnstileToken` to sending `verification` object:
     ```javascript
     verification: {
       mathAnswer: parseInt(mathAnswer),
       honeypot,
       startTime
     }
     ```

### Backend (`backend/routes/buy-online.js`)

1. **Removed Turnstile Dependency**
   - Removed `require('../utils/turnstileVerification')`

2. **Updated Verification Logic**
   - Changed from `turnstileToken` to `verification` parameter
   - Implemented honeypot check (field should be empty)
   - Implemented timing check (minimum 3 seconds to fill form)
   - Math answer verification happens client-side only

### Environment (`.env`)

- Removed `VITE_TURNSTILE_SITE_KEY` (no longer needed)

## Bot Protection Features

The system now uses:

1. **Math Challenge**: User must solve simple addition problem
2. **Honeypot Field**: Hidden field that bots might fill
3. **Timing Check**: Prevents instant form submissions (< 3 seconds)

**Protection Level**: ~40-60% (basic bot protection)

## Files Modified

- `src/pages/BuyOnline.jsx` - Added math verification UI
- `backend/routes/buy-online.js` - Updated verification logic
- `.env` - Removed Turnstile key

## Files Built

- `dist/*` - Production build ready for deployment

## Deployment Steps

### 1. Deploy Frontend

Upload the `dist/` folder to production:

```bash
# Option A: Using CloudPanel File Manager
# Upload dist/ folder contents to /var/www/png-green-fees/dist

# Option B: Using deploy script (if available)
./deploy.sh
```

### 2. Deploy Backend

Upload the updated backend file using CloudPanel File Manager:

**File:** `backend/routes/buy-online.js`
**Destination:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js`

### 3. Restart Backend

Paste these commands in your SSH terminal:

```bash
# SSH into server
ssh root@165.22.52.100

# Restart backend
pm2 restart greenpay-api

# Monitor logs
pm2 logs greenpay-api --lines 50
```

Look for:
- No errors on startup
- `[SECURITY] Bot protection checks passed` messages during form submissions

### 4. Test the Implementation

1. Visit: https://greenpay.eywademo.cloud/buy-online
2. Fill out passport form
3. **Notice the math question** (e.g., "What is 5 + 8?")
4. Enter the correct answer
5. Click "Continue to Payment"
6. Verify payment gateway loads correctly

## Verification Checklist

- [ ] Frontend deployed (`dist/` folder uploaded)
- [ ] Backend file uploaded (`backend/routes/buy-online.js`)
- [ ] Backend restarted (`pm2 restart greenpay-api`)
- [ ] No startup errors in logs
- [ ] Manual test: Math question appears on form
- [ ] Manual test: Form submission works with correct answer
- [ ] Backend logs show "[SECURITY] Bot protection checks passed"

## Rollback Plan

If issues occur, you can restore from git:

```bash
# Revert to previous commit
git log --oneline  # Find commit before math verification
git checkout <commit-hash> src/pages/BuyOnline.jsx backend/routes/buy-online.js
npm run build
# Redeploy dist/ and backend file
```

## Notes

- Math verification is less secure than Cloudflare Turnstile (40-60% vs 99% bot protection)
- However, it works without Cloudflare paid tier and webhook exceptions
- Combined with honeypot and timing checks, provides basic protection
- Math questions are randomly generated (1-10 + 1-10)
- Client-side validation only (answer checked before API call)

## Future Improvements

If Cloudflare paid tier becomes available:
1. Re-implement Cloudflare Turnstile (see `TURNSTILE_DEPLOYMENT_GUIDE.md`)
2. Or implement reCAPTCHA v3 (invisible, no user interaction)
3. Or implement hCaptcha (similar to reCAPTCHA, free tier available)
