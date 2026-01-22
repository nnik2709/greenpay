# Deploy All Fixes - Complete Deployment Guide

**Date**: January 22, 2026
**Status**: Ready to deploy
**Priority**: CRITICAL - Multiple fixes ready

## Summary of All Fixes

This deployment includes **4 major fixes**:

1. ✅ **Passport registration database errors** (3 schema fixes)
2. ✅ **Public registration success page broken** (API + Frontend)
3. ✅ **Thermal receipt logos missing** (Frontend - VoucherPrintPage)
4. ✅ **Email functionality added** (PublicRegistrationSuccess page)

---

## Fix 1: Passport Registration Database Errors

### Issues Fixed
- Column "sex" doesn't exist in passports table
- Column "passport_id" doesn't exist in individual_purchases table
- Passport registration was completely broken (500 errors)

### Backend Changes
**File**: `backend/routes/public-purchases.js`

1. Removed 'sex' from SELECT query (line 549)
2. Removed 'sex' from INSERT INTO passports (lines 566-577)
3. Removed 'passport_id' from UPDATE individual_purchases (lines 592-606)

### Deployment
```bash
# Upload via CloudPanel
deployment-package/backend/routes/public-purchases.js
  → /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

# Restart
ssh root@165.22.52.100
pm2 restart greenpay-api
```

---

## Fix 2: Public Registration Success Page

### Issues Fixed
- Page crashed (missing Supabase import)
- No passport data displayed
- Both buttons did same thing
- Emojis in UI

### Backend Changes
**File**: `backend/routes/vouchers.js` (lines 1427-1538)

Added LEFT JOIN with passports table to `/api/vouchers/code/:voucherCode` endpoint:
```javascript
SELECT ip.*,
       p.id as passport_id,
       p.passport_number,
       p.full_name,
       p.nationality,
       p.date_of_birth,
       p.expiry_date
FROM individual_purchases ip
LEFT JOIN passports p ON ip.passport_number = p.passport_number
WHERE ip.voucher_code = $1
```

### Frontend Changes
**File**: `src/pages/PublicRegistrationSuccess.jsx`

- Replaced Supabase with API client
- Fixed data structure (voucher.passport)
- Removed emojis, added Lucide icons
- Added email functionality with input field
- Fixed download button

### Deployment
```bash
# Backend
deployment-package/backend/routes/vouchers.js
  → /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

pm2 restart greenpay-api

# Frontend
./deploy.sh
# OR
scp -r dist/* root@165.22.52.100:/var/www/png-green-fees/dist/
```

---

## Fix 3: Thermal Receipt Logos

### Issue Fixed
Print All page showed placeholder text `[CCDA]` and `[PNG Emblem]` instead of actual logos

### Frontend Changes
**File**: `src/pages/VoucherPrintPage.jsx` (lines 193-223)

Replaced placeholder divs with actual image tags:
```jsx
// Before:
<div style={{border: '1px solid #000'}}>[CCDA]</div>

// After:
<img src="/assets/logos/ccda-logo.png" style={{width: '25mm'}} />
```

### Deployment
Included in frontend deployment (same as Fix 2)

**Verification**: After deploying, go to Print All page and check print preview - logos should appear

---

## Fix 4: Email Functionality

### Feature Added
Email button with editable email field on success page

### Frontend Changes
**File**: `src/pages/PublicRegistrationSuccess.jsx`

- Added email input field above Print/Download buttons
- Send button with Mail icon
- Calls `/api/vouchers/:voucherCode/email` endpoint
- Shows toast on success/error
- Enter key support
- Clears field after successful send

### Backend
No changes needed - endpoint already exists at `vouchers.js:1344`

### Deployment
Included in frontend deployment (same as Fix 2)

---

## Complete Deployment Steps

### Step 1: Backend Deployment

Upload these 2 files via CloudPanel File Manager:

```
deployment-package/backend/routes/public-purchases.js
  → /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

deployment-package/backend/routes/vouchers.js
  → /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
```

Then restart:
```bash
ssh root@165.22.52.100
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 30
```

### Step 2: Frontend Deployment

Option A - Using deploy.sh:
```bash
cd /Users/nikolay/github/greenpay
./deploy.sh
```

Option B - Manual SCP:
```bash
cd /Users/nikolay/github/greenpay
scp -r dist/* root@165.22.52.100:/var/www/png-green-fees/dist/
```

Option C - CloudPanel:
- Upload entire `dist/` folder to `/var/www/png-green-fees/dist/`
- Make sure `dist/assets/logos/` is included

---

## Verification Checklist

### Test 1: Passport Registration
1. Go to https://greenpay.eywademo.cloud/app/passports/create
2. Create a batch of 3 vouchers
3. Scan passports for each voucher
4. ✅ Should work without 500 errors
5. ✅ Passports should appear in database
6. ✅ Wizard should advance to completion screen

### Test 2: Public Registration Success Page
1. Go to https://greenpay.eywademo.cloud/register/success/VOUCHER_CODE
2. ✅ Page loads without errors
3. ✅ Passport information displays
4. ✅ No emojis visible
5. ✅ Email input field and Send button visible
6. ✅ Print button works
7. ✅ Download button works
8. ✅ Enter email and click Send - should receive email with PDF

### Test 3: Thermal Receipt Logos
1. Create batch and register passports
2. Click "Print All"
3. Look at print preview
4. ✅ Should see CCDA logo image (not [CCDA] text)
5. ✅ Should see PNG Emblem image (not [PNG Emblem] text)

### Test 4: Check Browser Console
- Should have NO errors
- No Supabase errors
- No 404 errors
- No 500 errors

---

## What Changed - Summary

### Backend Files (2 files):
1. `public-purchases.js` - Removed 3 non-existent columns
2. `vouchers.js` - Added passport JOIN to voucher endpoint

### Frontend Files (2 files):
1. `PublicRegistrationSuccess.jsx` - Complete rewrite (API client, email feature)
2. `VoucherPrintPage.jsx` - Replaced logo placeholders with images

### Assets:
- Logo files already exist in `public/assets/logos/`
- Included in dist build

---

## Rollback Plan

If something breaks:

### Backend Rollback:
```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
# Restore from backup if available
pm2 restart greenpay-api
```

### Frontend Rollback:
```bash
# Re-deploy previous dist/ folder
# Or rebuild from previous git commit
git checkout HEAD~4
npm run build
./deploy.sh
git checkout main
```

---

## Success Criteria

After full deployment:
1. ✅ Passport registration works (no 500 errors)
2. ✅ Passports appear in database
3. ✅ Public success page loads and shows all data
4. ✅ Email feature works
5. ✅ Thermal receipt shows logo images
6. ✅ All Print/Download buttons work correctly
7. ✅ No console errors
8. ✅ Professional appearance (no emojis)

---

## Questions to Check After Deployment

**For thermal printer logos:**
- The fix is in the HTML print (window.print())
- NOT in the server-side PDF generation endpoint
- Logos should appear in browser print preview
- If you're using the API endpoint `/api/vouchers/:code/thermal-receipt`, that's a different file (pdfGenerator.js) which we added diagnostic logging to but didn't deploy yet

**Which thermal printing are you using?**
1. **Print All button** (window.print from browser) → ✅ FIXED in this deployment
2. **Server-side PDF endpoint** → Not deployed yet, needs pdfGenerator.js update

Let me know which one you need!
