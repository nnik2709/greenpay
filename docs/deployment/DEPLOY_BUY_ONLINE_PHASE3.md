# Deploy Buy Online - Phase 3: Enhanced Security & UX

## What Changed

### 🎯 New User Flow:
1. **Buy Online Page**: Enter passport data only (NO email/phone required)
2. **Human Verification**: Math question + honeypot + time check
3. **Payment**: Stripe checkout
4. **Success Page**: Voucher displayed immediately with QR code
5. **Optional**: User can click "Email Voucher" to enter email and receive PDF

### 🔒 Security Features Added:
- **Option 4 Implementation** (ready for reCAPTCHA upgrade):
  - Math question verification (e.g., "What is 5 + 3?")
  - Honeypot field (hidden input that bots might fill)
  - Time-based check (must spend at least 3 seconds on page)
  - Backend validation of all checks

### ✨ UX Improvements:
- Email/phone collection moved to AFTER payment (optional)
- Voucher shown immediately on screen
- Print button for instant printing
- Download PDF button
- "Email Voucher" button opens dialog for email input
- No data required upfront = faster checkout

## Files to Deploy

### Frontend (Built):
```
dist/
```
Deploy to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/`

### Backend:
```
backend/routes/buy-online.js
```
Deploy to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js`

## Deployment Commands

```bash
# 1. Copy backend
scp backend/routes/buy-online.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

# 2. Copy frontend
rsync -avz --delete dist/ root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/

# 3. Restart services
ssh root@72.61.208.79 "pm2 restart greenpay-backend && pm2 restart greenpay-frontend"
```

## Changes Summary

### Frontend Changes:

#### `src/pages/BuyOnline.jsx`:
- ✅ Removed email and phone fields
- ✅ Added math verification question (random each time)
- ✅ Added honeypot field (hidden from users)
- ✅ Added time tracking (starts when page loads)
- ✅ Validation checks all three security measures
- ✅ Sends verification data to backend

#### `src/pages/PaymentSuccess.jsx`:
- ✅ Removed email dependency
- ✅ Shows voucher immediately after payment
- ✅ Added "Email Voucher" button with dialog
- ✅ User enters email only if they want it emailed
- ✅ Print button works instantly
- ✅ Download PDF works instantly

### Backend Changes:

#### `backend/routes/buy-online.js`:
- ✅ Removed email requirement from prepare-payment
- ✅ Added backend verification of math answer
- ✅ Added time-spent validation (min 3 seconds)
- ✅ Stores verification status in session data
- ✅ Voucher creation works without email
- ✅ GET voucher endpoint queries by passport_number (not email)
- ✅ Email endpoint accepts email on-demand

## Anti-Bot Protection Details

### Current Implementation (Option 4):
```javascript
// Frontend checks:
1. Honeypot field must be empty
2. Time on page >= 3 seconds
3. Math answer must be correct

// Backend validation:
- Verifies time spent
- Verifies math answer matches expected
- Logs verification status
```

### Ready for reCAPTCHA v3 (Option 1):
To upgrade to Google reCAPTCHA v3 later:

1. **Get reCAPTCHA keys**: https://www.google.com/recaptcha/admin
2. **Add to .env**:
   ```
   RECAPTCHA_SITE_KEY=your_site_key
   RECAPTCHA_SECRET_KEY=your_secret_key
   ```
3. **Install package**:
   ```bash
   npm install react-google-recaptcha-v3
   ```
4. **Update BuyOnline.jsx**:
   ```javascript
   import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

   const { executeRecaptcha } = useGoogleReCaptcha();

   // In handleContinueToPayment:
   const token = await executeRecaptcha('submit');

   // Send token to backend
   verification: { recaptchaToken: token }
   ```
5. **Update backend** to verify token with Google API

## Testing Checklist

### 1. Test Buy Online Flow:
- [ ] Go to https://greenpay.eywademo.cloud/buy-online
- [ ] Fill in passport details
- [ ] Try submitting immediately (should fail - time check)
- [ ] Wait 3 seconds, enter wrong math answer (should fail)
- [ ] Enter correct math answer
- [ ] Complete payment with test card: `4242 4242 4242 4242`

### 2. Test Success Page:
- [ ] Voucher displays with QR code
- [ ] Print button works
- [ ] Download PDF works
- [ ] Click "Email Voucher"
- [ ] Enter email in dialog
- [ ] Check email for PDF attachment

### 3. Test Anti-Bot Protection:
- [ ] Try to submit form before 3 seconds (should block)
- [ ] Try wrong math answer (should block)
- [ ] Fill honeypot field via browser console: `document.querySelector('[name="website"]').value = "bot"` (should block)

### 4. Verify Data in Admin:
- [ ] Login as admin
- [ ] Check Passports page - new passport should appear
- [ ] Check Individual Purchases - voucher should appear
- [ ] Payment method should show "Card"
- [ ] Customer email should be null or the email provided

## Backend Logs to Watch

After successful payment, you should see:
```
✅ Verification passed
✓ Created new passport: [passport_number] (ID: [id])
✓ Created voucher: VCH-... for passport [passport_number]
✅ Purchase completed for session: PGKO-...
```

## Troubleshooting

### Issue: "Verification failed"
- **Cause**: User filled honeypot, time < 3s, or wrong math answer
- **Solution**: User should refresh page and try again

### Issue: "No payment session found"
- **Cause**: sessionStorage was cleared
- **Solution**: User should complete a fresh payment

### Issue: Voucher not showing after payment
- **Cause**: Webhook still processing or failed
- **Solution**:
  1. Check backend logs: `pm2 logs greenpay-backend --lines 100`
  2. Look for errors in webhook processing
  3. User can refresh page (polling continues)

## Environment Variables (Optional)

To customize verification:
```bash
# Backend .env
MIN_TIME_SECONDS=3  # Minimum time on page
VERIFICATION_REQUIRED=true  # Enable/disable verification
```

## Future Enhancements

1. **Upgrade to reCAPTCHA v3**: Follow instructions above
2. **SMS Voucher**: Add SMS dialog similar to email dialog
3. **Save Voucher to Account**: Allow users to create account and save vouchers
4. **Multi-language**: Add i18n for verification questions

## Rollback Plan

If issues occur, restore previous version:
```bash
# Restore backend
git checkout HEAD~1 backend/routes/buy-online.js
scp backend/routes/buy-online.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

# Restore frontend
git checkout HEAD~1 src/pages/BuyOnline.jsx src/pages/PaymentSuccess.jsx
npm run build
rsync -avz --delete dist/ root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/

# Restart
ssh root@72.61.208.79 "pm2 restart all"
```

## Success Metrics

After deployment, monitor:
- **Conversion Rate**: % of users who start vs complete payment
- **Bot Detection**: Number of verification failures
- **Email Requests**: % of users who email voucher to themselves
- **Support Tickets**: Reduction in "where's my voucher?" tickets

---

**Deployed By**: _____________
**Date**: _____________
**Verified By**: _____________
**Notes**: _____________
