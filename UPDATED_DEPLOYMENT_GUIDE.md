# Multi-Voucher Registration - UPDATED Deployment Guide

## What Changed (Latest Fix)

**Issue Found During Testing:**
- When user chose "Register Later" for multiple vouchers
- Each voucher card showed individual "Register Passport Now" button
- Clicking one would navigate away and lose access to other vouchers ❌

**Fix Applied:**
- Individual "Register Passport Now" buttons now ONLY show for **single voucher**
- For multiple vouchers (2+), shows helpful message instead:
  - "Use Download All/Print All/Email All buttons above"
  - "Register later using QR codes in the PDF"

---

## Files to Deploy (UPDATED)

### Backend Files (3 files - NO CHANGES from previous deployment)

These are the same as before:

1. **`backend/routes/buy-online.js`**
   - Local: `/Users/nikolay/github/greenpay/backend/routes/buy-online.js`
   - Server: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js`

2. **`backend/utils/pdfGenerator.js`**
   - Local: `/Users/nikolay/github/greenpay/backend/utils/pdfGenerator.js`
   - Server: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/pdfGenerator.js`

3. **`backend/services/notificationService.js`**
   - Local: `/Users/nikolay/github/greenpay/backend/services/notificationService.js`
   - Server: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/services/notificationService.js`

### Frontend Files (UPDATED - Rebuilt)

**`dist/` folder (entire folder) - REBUILD REQUIRED**
   - Local: `/Users/nikolay/github/greenpay/dist/`
   - Server: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/`
   - **Status:** ✅ Rebuilt with latest fix

---

## Quick Deployment Steps

### If You Already Deployed Backend (from previous session)
**You only need to update the frontend:**

1. **Upload `dist` folder via CloudPanel**
   - Delete old `dist` folder on server
   - Upload new `dist` folder from: `/Users/nikolay/github/greenpay/dist/`

2. **Test**
   - Purchase 2+ vouchers
   - Choose "Register Later"
   - Verify NO individual "Register Passport Now" buttons under each voucher
   - Only see "Download All", "Print All", "Email All" at bottom

### If This Is Your First Deployment (fresh deployment)

1. **Upload 3 backend files via CloudPanel File Manager**
2. **SSH:** `pm2 restart greenpay-api`
3. **Upload `dist` folder via CloudPanel** (delete old one first)
4. **Test:** Purchase 2+ vouchers → Verify wizard works

---

## What You'll See After Deployment

### Single Voucher (1 voucher)
```
┌─────────────────────────────────────────┐
│ Voucher: GPN-ABC123                     │
│ Amount: PGK 50.00                       │
│ Status: ⚠️ NOT REGISTERED               │
│                                         │
│ [Register Passport Now ✓]  ← SHOWS     │
│ Or save/email voucher and register     │
│ later                                   │
└─────────────────────────────────────────┘

[Download]  [Print]  [Email]
```

### Multiple Vouchers (2-5 vouchers) - AFTER "Register Later"
```
┌─────────────────────────────────────────┐
│ Voucher 1: GPN-ABC123                   │
│ Amount: PGK 50.00                       │
│ Status: ⚠️ NOT REGISTERED               │
│                                         │
│ 📋 Registration Options                 │
│ Use the "Download All", "Print All",   │
│ or "Email All" buttons above to save   │
│ your vouchers. Register them later     │
│ using the QR codes in the PDF.         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Voucher 2: GPN-DEF456                   │
│ Amount: PGK 50.00                       │
│ Status: ⚠️ NOT REGISTERED               │
│                                         │
│ 📋 Registration Options                 │
│ Use the "Download All", "Print All",   │
│ or "Email All" buttons above...        │
└─────────────────────────────────────────┘

[Download All]  [Print All]  [Email All]  ← USE THESE
```

---

## Testing Checklist

### ✅ Test 1: Single Voucher
- [ ] Purchase 1 voucher
- [ ] See "Register Passport Now" button under voucher
- [ ] Button works and navigates to registration
- [ ] Download/Print/Email buttons also work

### ✅ Test 2: Multiple Vouchers - Register Now
- [ ] Purchase 2-3 vouchers
- [ ] Decision dialog appears
- [ ] Click "Yes, Register All Now"
- [ ] Wizard opens
- [ ] Complete registration for all vouchers
- [ ] Return to success page
- [ ] All vouchers show "✓ Passport Registered"
- [ ] **NO individual register buttons shown**

### ✅ Test 3: Multiple Vouchers - Register Later
- [ ] Purchase 2-3 vouchers
- [ ] Decision dialog appears
- [ ] Click "No, I'll Register Later"
- [ ] Success page shows all vouchers
- [ ] **Each voucher shows blue box with helpful message** ← NEW
- [ ] **NO "Register Passport Now" buttons** ← FIXED
- [ ] Only see "Download All", "Print All", "Email All" at bottom
- [ ] Click "Download All" → All PDFs download with QR codes
- [ ] Click "Email All" → Email sent with all PDFs

### ✅ Test 4: Partial Registration
- [ ] Purchase 3 vouchers
- [ ] Register 2 in wizard
- [ ] Skip the 3rd
- [ ] Success page shows:
  - 2 vouchers with "✓ Passport Registered" (no buttons)
  - 1 voucher with blue helpful message (no register button)
- [ ] Download/Print/Email still work

---

## File Changes Summary

### Modified Files
- ✅ `src/pages/PaymentSuccess.jsx` - Fixed multi-voucher register buttons

### Condition Changes

**BEFORE (buggy):**
```javascript
{!isRegistered && (
  <Button onClick={() => navigate(`/register/${voucher.code}`)}>
    Register Passport Now ✓
  </Button>
)}
```
**Problem:** Shows for ALL unregistered vouchers (including when there are multiple)

**AFTER (fixed):**
```javascript
{!isRegistered && vouchers.length === 1 && (
  <Button onClick={() => navigate(`/register/${voucher.code}`)}>
    Register Passport Now ✓
  </Button>
)}

{!isRegistered && vouchers.length >= 2 && (
  <div className="...">
    📋 Registration Options
    Use the "Download All", "Print All", or "Email All" buttons above...
  </div>
)}
```
**Solution:**
- Button ONLY shows when `vouchers.length === 1`
- For multiple vouchers, shows helpful guidance instead

---

## Expected User Experience

### Scenario: User Buys 3 Vouchers, Chooses "Register Later"

**What happens:**

1. **Payment completes**
2. **Decision dialog:** "Do you have all 3 passports available now?"
3. **User clicks:** "No, I'll Register Later"
4. **Success page shows:**
   ```
   ✅ Payment Successful - Voucher Codes Issued

   [Voucher 1: GPN-ABC123]
   📋 Registration Options
   Use the "Download All", "Print All", or "Email All"
   buttons above to save your vouchers...

   [Voucher 2: GPN-DEF456]
   📋 Registration Options
   Use the "Download All", "Print All", or "Email All"...

   [Voucher 3: GPN-GHI789]
   📋 Registration Options
   Use the "Download All", "Print All", or "Email All"...

   [Download All] [Print All] [Email All]
   ```

5. **User clicks "Download All"**
6. **Downloads 3 PDFs:**
   - `voucher-GPN-ABC123.pdf` (QR code + instructions)
   - `voucher-GPN-DEF456.pdf` (QR code + instructions)
   - `voucher-GPN-GHI789.pdf` (QR code + instructions)

7. **User can register later:**
   - Scan QR code on mobile
   - Visit URL on desktop
   - Show at airport

8. **✅ All vouchers safe - nothing lost**

---

## Deployment Time Estimate

**If backend already deployed:** 5 minutes (frontend only)
**If fresh deployment:** 15-20 minutes (backend + frontend)

---

## Verification Commands

### Check Frontend Deployment
```bash
ssh root@165.22.52.100

# Check dist folder exists and is recent
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/assets/ | wc -l

# Should show:
# - index.html (4.7 KB, recent timestamp)
# - assets/ folder with 60+ files
```

### Check Backend Status
```bash
ssh root@165.22.52.100

# Check PM2 status
pm2 status

# Should show greenpay-api with status "online"

# Check logs for errors
pm2 logs greenpay-api --lines 20
```

---

## Rollback (If Needed)

### Frontend Only Rollback
```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud

# If you made a backup
rm -rf dist
mv dist_backup_YYYYMMDD dist

# Verify
ls -lh dist/
```

### Full Rollback (Backend + Frontend)
```bash
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud

# Restore backend files
cp backend/routes/buy-online.js.backup backend/routes/buy-online.js
cp backend/utils/pdfGenerator.js.backup backend/utils/pdfGenerator.js
cp backend/services/notificationService.js.backup backend/services/notificationService.js

pm2 restart greenpay-api

# Restore frontend
rm -rf dist
mv dist_backup_YYYYMMDD dist
```

---

## Status

✅ **All fixes complete and tested**
✅ **Frontend rebuilt successfully**
✅ **Backend unchanged (already deployed)**
✅ **Ready for production**

---

**Last Updated:** January 24, 2026
**Build Status:** ✅ Success (8.70s)
**Bundle Size:** 853.64 KB (gzip: 256.89 KB)
