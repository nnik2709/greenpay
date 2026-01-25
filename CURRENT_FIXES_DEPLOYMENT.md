# Current Fixes - Deployment Guide

**Date:** 2026-01-25
**Status:** Ready for Deployment
**Purpose:** Deploy bug fixes to make current system error-free

---

## 🔧 Fixes Included

### Frontend Fixes (10 fixes)
1. ✅ **Public Registration** - Removed DOB/Sex auto-population from passport scan
2. ✅ **Quotations Menu** - Renamed "Download PDF" → "Download Quotation"
3. ✅ **Invoices Menu** - Split into "View Invoice" + "Download Invoice"
4. ✅ **Thermal Print Back Button** - Fixed navigation to preserve voucher list
5. ✅ **Regular Print Back Button** - Fixed navigation to preserve voucher list
6. ✅ **Individual Purchase Response Parsing** - Correct API response parsing (no breaking changes)
7. ✅ **Batch Voucher Creation Error** - Added error handling and validation for missing batchId/vouchers
8. ✅ **Bulk Download All as ZIP** - Fixed to download ALL vouchers (not just registered ones)
9. ✅ **Individual Purchase Passport Fields** - Added Nationality* and Passport Expiry fields (MRZ scanner populates all)
10. ✅ **Build** - Production bundle ready in `dist/` folder

### Backend Fixes (4 fixes)
1. ✅ **Corporate Voucher Email** - Send separate PDFs instead of combined (10 MB limit)
2. ✅ **Database Column Fix** - Changed `passport_expiry` → `expiry_date`
3. ✅ **Thermal Receipt** - Fixed `amount.toFixed` error with `parseFloat()`
4. ✅ **Passport Registration API** - Added passportExpiry field to store expiry date in DB

---

## 📦 Files to Deploy

### Frontend (via CloudPanel File Manager)
Upload the entire `dist/` folder to replace existing frontend:

**Destination:** `/var/www/png-green-fees/dist/`

**Method:**
1. Open CloudPanel File Manager
2. Navigate to `/var/www/png-green-fees/`
3. Delete old `dist/` folder (or rename to `dist.backup`)
4. Upload new `dist/` folder from local machine

---

### Backend (via CloudPanel File Manager)
Upload these 3 files:

| Local File | Server Destination |
|------------|-------------------|
| `backend/routes/vouchers.js` | `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/vouchers.js` |
| `backend/routes/individual-purchases.js` | `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js` |
| `backend/routes/public-purchases.js` | `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/public-purchases.js` |
| `backend/utils/pdfGenerator.js` | `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/pdfGenerator.js` |

---

## 🚀 Deployment Steps

### Step 1: Verify Current State
Paste in your SSH terminal:

```bash
# Check PM2 process is running
pm2 list

# Verify backend path
pm2 describe greenpay-api | grep script

# Check current frontend deployment
ls -lh /var/www/png-green-fees/dist/
```

---

### Step 2: Deploy Frontend

**Via CloudPanel File Manager:**
1. Login to CloudPanel
2. Navigate to `/var/www/png-green-fees/`
3. Rename current `dist/` to `dist.backup` (for rollback safety)
4. Upload new `dist/` folder from your local: `/Users/nikolay/github/greenpay/dist/`
5. Verify upload completed successfully

**Verify:**
```bash
# Check new files uploaded
ls -lh /var/www/png-green-fees/dist/
ls /var/www/png-green-fees/dist/assets/ | wc -l
```

---

### Step 3: Deploy Backend Files

**Via CloudPanel File Manager:**

Upload each backend file to correct location:

1. **vouchers.js**
   - Local: `/Users/nikolay/github/greenpay/backend/routes/vouchers.js`
   - Server: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/vouchers.js`

2. **individual-purchases.js**
   - Local: `/Users/nikolay/github/greenpay/backend/routes/individual-purchases.js`
   - Server: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js`

3. **pdfGenerator.js**
   - Local: `/Users/nikolay/github/greenpay/backend/utils/pdfGenerator.js`
   - Server: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/pdfGenerator.js`

**Verify:**
```bash
# Verify files uploaded and have recent timestamp
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/vouchers.js
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/utils/pdfGenerator.js
```

---

### Step 4: Restart Backend

Paste in your SSH terminal:

```bash
# Restart backend API to load new code
pm2 restart greenpay-api

# Restart frontend (if needed)
pm2 restart png-green-fees

# Verify both processes running
pm2 list

# Monitor logs for any startup errors
pm2 logs greenpay-api --lines 50
```

---

### Step 5: Clear Browser Cache

**Important:** Clear browser cache to load new frontend code

```bash
# Hard refresh in browser:
# - Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
# - Firefox: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
# - Safari: Cmd+Option+R (Mac)
```

Or use Incognito/Private window for testing.

---

## 🔍 Check Build Version (NEW!)

After deployment, verify you're running the latest build:

**In Browser Console (F12 → Console):**

You'll see:
```
🚀 GreenPay Build Info
Version: 0.0.0
Build Time: 01/25/2026, 14:29:15
Git: main@5ea9e4c
Environment: production
Timestamp: 1769347755483
```

**Quick Check:**
```javascript
window.__BUILD_INFO__
// Should show timestamp: 1769347755483 (from build output above)
```

**If you see old timestamp** → Old build still cached → Hard refresh (Ctrl+Shift+R)

---

## ✅ Verification Tests

### Test 1: Public Registration Page
1. Visit: `https://greenpay.eywademo.cloud/register/<any-voucher-code>`
2. Scan a passport or lookup passport from database
3. ✅ **Verify:** DOB and Sex fields should remain EMPTY
4. ✅ **Verify:** Surname, Passport Number, Nationality should populate

---

### Test 2: Quotations Dropdown
1. Login as agent
2. Visit: `https://greenpay.eywademo.cloud/app/quotations`
3. Click action menu (⋮) on any quotation
4. ✅ **Verify:** Menu shows "Download Quotation" (not "Download PDF")

---

### Test 3: Invoices Dropdown
1. Visit: `https://greenpay.eywademo.cloud/app/invoices`
2. Click action menu (⋮) on any invoice
3. ✅ **Verify:** Menu shows both "View Invoice" AND "Download Invoice"
4. Test download works without errors

---

### Test 4: Individual Purchase (3 Vouchers) - CRITICAL FIX
1. Visit: `https://greenpay.eywademo.cloud/app/passports/create`
2. Create 3 individual vouchers:
   - Quantity: 3
   - Payment: CASH
   - Amount: 150.00
3. Click "Create Vouchers"
4. ✅ **Verify:** No "Cannot read properties of undefined (reading 'batchId')" error
5. ✅ **Verify:** Check browser console - should show "Individual Purchase API Response: {...}"
6. ✅ **Verify:** Vouchers created successfully
7. ✅ **Verify:** Wizard starts for passport registration
8. ✅ **Verify:** If error occurs, error message is clear and descriptive

---

### Test 5: Thermal Print Back Button
1. After creating vouchers above
2. Click "Print Thermal Receipt"
3. On thermal print page, click "Back" button
4. ✅ **Verify:** Returns to completion page with voucher list (not start page)

---

### Test 6: Corporate Voucher Email
1. Visit: `https://greenpay.eywademo.cloud/app/corporate-batches`
2. Find a batch with 5-10 vouchers
3. Click "Email Batch"
4. Send to test email
5. ✅ **Verify:** Email received with SEPARATE PDF files (not one combined PDF)
6. ✅ **Verify:** Each PDF named: `CompanyName_Voucher_CODE.pdf`
7. ✅ **Verify:** No error if batch has many vouchers (size limit check)

---

### Test 7: Thermal Receipt Generation
1. Create new individual purchase
2. Generate thermal receipt
3. ✅ **Verify:** No "amount.toFixed is not a function" error in PM2 logs
4. ✅ **Verify:** Amount displays correctly as "K50.00"

---

### Test 8: Bulk Download All as ZIP - CRITICAL FIX
1. Create 3 vouchers via Individual Purchase
2. On completion page, click "Download All as ZIP"
3. ✅ **Verify:** Check browser console - should show "Bulk download - All vouchers: [...]"
4. ✅ **Verify:** Should show "Bulk download - Voucher IDs: [123, 124, 125]"
5. ✅ **Verify:** No "Validation failed" or "At least one voucher ID required" error
6. ✅ **Verify:** ZIP file downloads successfully
7. ✅ **Verify:** Works even if NO passports are registered yet

---

### Test 9: Regular Print Back Button
1. Create 3 vouchers via Individual Purchase
2. On completion page, click "Print Vouchers (Regular)"
3. Opens: `https://greenpay.eywademo.cloud/app/voucher-print?codes=...`
4. Click "Back" button
5. ✅ **Verify:** Returns to completion page (not start page)
6. ✅ **Verify:** Voucher list still visible

---

## 🔍 Monitor for Errors

After deployment, monitor PM2 logs:

```bash
# Watch logs in real-time
pm2 logs greenpay-api --lines 100

# Check for specific errors
pm2 logs greenpay-api --err

# If you see errors, check these common issues:
# 1. File upload paths correct?
# 2. PM2 restarted successfully?
# 3. Browser cache cleared?
```

---

## 🔄 Rollback Plan (If Needed)

If something goes wrong:

### Frontend Rollback
```bash
# Restore backup
cd /var/www/png-green-fees/
rm -rf dist
mv dist.backup dist

# Restart frontend
pm2 restart png-green-fees
```

### Backend Rollback
Option 1: Use CloudPanel File Manager to restore previous versions
Option 2: Re-upload old files from git history

---

## 📊 Expected Results After Deployment

✅ All 7 verification tests pass
✅ No PM2 errors in logs
✅ No browser console errors
✅ Voucher creation works smoothly
✅ Corporate emails send separate PDFs
✅ Thermal receipts generate without errors
✅ Navigation works correctly

---

## 📞 Support

If you encounter issues:

1. Check PM2 logs: `pm2 logs greenpay-api --lines 100`
2. Check browser console (F12 → Console tab)
3. Verify files uploaded to correct paths
4. Ensure PM2 restarted successfully
5. Clear browser cache and try again

---

## 📝 Summary

**What's Fixed:**
- ✅ Public registration DOB/Sex fields
- ✅ Invoice/Quotation menu consistency
- ✅ Corporate voucher separate PDFs
- ✅ Database column mismatch
- ✅ Thermal receipt amount error
- ✅ Thermal print back button navigation

**What's NOT Changed:**
- ❌ API response structure (keeping current format)
- ❌ Database schema (no migrations needed)
- ❌ Authentication flow
- ❌ Other features

**Deployment Time:** ~15-20 minutes

**Next Steps:**
- Review API Standardization Proposal when planning next release
- Consider implementing comprehensive testing
- Monitor system for any new issues

---

**End of Deployment Guide**
