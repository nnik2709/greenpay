# 🚀 Invoice Enhancements Deployment Guide

## Overview

This deployment adds two major features to the GreenPay invoice workflow:

1. **GST Toggle** - Allow turning GST on/off when creating invoices (for tax-exempt customers)
2. **Generated Vouchers Modal** - Display voucher list after generation with email and download options

---

## ✅ Features Implemented

### 1. GST Toggle in Quotation Conversion

**Location**: Quotations page → Convert to Invoice dialog

**What Changed**:
- Added Switch component (toggle) to enable/disable GST
- Real-time calculation update when toggle changes
- GST defaults to ON (10%) for backward compatibility
- Visual feedback with amber-colored box

**User Flow**:
1. Navigate to Quotations page
2. Select a quotation and click "Convert to Invoice"
3. In the dialog, see "Apply GST (10%)" toggle switch
4. Toggle OFF to exclude GST for tax-exempt customers
5. See amount calculations update in real-time
6. Click "Convert" to create invoice with selected GST setting

**Backend Support**:
- API accepts `apply_gst: true/false` parameter
- Calculates GST conditionally: `gstAmount = apply_gst ? (amount * 0.10) : 0`
- Stores both GST amount and total in invoice record

---

### 2. Generated Vouchers Modal

**Location**: Invoices page → Generate Vouchers action

**What Changed**:
- After successful voucher generation, modal displays automatically
- Shows comprehensive voucher list in table format
- Includes voucher codes, amounts, validity dates, status badges
- Provides bulk actions: Download All, Email All
- Professional layout with color-coded elements (emerald green for codes)

**User Flow**:
1. Navigate to Invoices page
2. Select a paid invoice
3. Click "Generate Vouchers"
4. After generation completes, modal opens automatically
5. Review all generated vouchers in the table
6. Click "Download All Vouchers" to get single PDF with all vouchers
7. Click "Email Vouchers to Customer" to send via email
8. Close modal when done

**Backend Support**:
- New endpoint: `GET /api/invoices/:id/vouchers-pdf`
- Fetches all vouchers for an invoice
- Validates invoice is paid before generating PDF
- Returns single PDF buffer with all vouchers concatenated
- Proper filename: `{CompanyName}_Vouchers_{InvoiceNumber}.pdf`

---

## 📦 Files Modified

### Frontend Files:

1. **src/pages/Quotations.jsx**
   - Lines 15-20: Added Switch import from shadcn/ui
   - Lines 380-410: Added `applyGst` state and toggle UI
   - Lines 420-425: Conditional GST calculation
   - Lines 460-465: Include `apply_gst` in API call

2. **src/pages/Invoices.jsx**
   - Lines 25-30: Added state for vouchers modal
   - Lines 280-320: Added `handleDownloadVouchers` function
   - Lines 580-720: Complete Generated Vouchers modal component
   - Lines 750-760: Show modal after successful voucher generation

### Backend Files:

3. **backend/routes/invoices-gst.js**
   - Lines 45-48: Accept `apply_gst` parameter in `/from-quotation` endpoint
   - Lines 82-95: Conditional GST calculation logic
   - Lines 520-598: New `/api/invoices/:id/vouchers-pdf` endpoint implementation

---

## 🚀 Deployment Instructions

### Prerequisites:
- SSH access to production server (root@165.22.52.100)
- Production path: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud`

### Option 1: Automated Script (Recommended)

```bash
# Make script executable (if not already)
chmod +x deploy-invoice-enhancements.sh

# Run deployment script
./deploy-invoice-enhancements.sh
```

The script will:
1. ✅ Create backups of existing files
2. ✅ Upload backend routes file
3. ✅ Upload frontend dist folder
4. ✅ Restart PM2 process
5. ✅ Verify deployment

### Option 2: Manual Deployment

```bash
# Step 1: Backup production files
ssh root@165.22.52.100 "cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud && \
  cp backend/routes/invoices-gst.js backend/routes/invoices-gst.js.backup-$(date +%Y%m%d-%H%M%S) && \
  cp -r dist dist.backup-$(date +%Y%m%d-%H%M%S)"

# Step 2: Upload backend file
scp backend/routes/invoices-gst.js root@165.22.52.100:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

# Step 3: Upload frontend assets
ssh root@165.22.52.100 "rm -rf /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/*"
scp -r dist/* root@165.22.52.100:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/

# Step 4: Restart backend
ssh root@165.22.52.100 "pm2 restart greenpay-api"

# Step 5: Check status
ssh root@165.22.52.100 "pm2 list | grep greenpay-api"
```

---

## 🧪 Testing After Deployment

### Test 1: GST Toggle

1. Login to https://greenpay.eywademo.cloud
2. Navigate to **Quotations** page
3. Find a quotation with status "approved" or "sent"
4. Click **"Convert to Invoice"** button
5. **Verify**: Amber box with "Apply GST (10%)" toggle appears
6. **Verify**: Toggle is ON by default
7. **Verify**: Amount breakdown shows GST = 10% of subtotal
8. Click toggle to turn OFF
9. **Verify**: GST amount changes to 0
10. **Verify**: Total = Subtotal (no GST added)
11. Click **"Convert"** to create invoice
12. Navigate to **Invoices** page
13. Find the newly created invoice
14. **Verify**: Invoice shows GST = 0 if toggle was OFF
15. **Verify**: Total amount matches expectation

### Test 2: Generated Vouchers Modal

1. Navigate to **Invoices** page
2. Find an invoice with status "paid"
3. If no paid invoice, mark one as paid:
   - Click "Register Payment" on any invoice
   - Enter payment details and submit
4. Click **"Generate Vouchers"** button on the paid invoice
5. Wait for generation to complete
6. **Verify**: Modal opens automatically with title "Generated Vouchers (N)"
7. **Verify**: Table displays all vouchers with:
   - Row numbers (1, 2, 3...)
   - Voucher codes (in green monospace font)
   - Amounts (PGK XXX)
   - Valid Until dates
   - Status badges
8. Click **"Download All Vouchers"** button
9. **Verify**: PDF downloads with filename format: `{CompanyName}_Vouchers_{InvoiceNumber}.pdf`
10. Open PDF and **verify**: Contains all vouchers in sequence
11. Click **"Email Vouchers to Customer"** button
12. **Verify**: Success toast appears
13. Check customer email and **verify**: Vouchers received

### Test 3: Backward Compatibility

1. Convert a quotation to invoice WITHOUT changing GST toggle (leave ON)
2. **Verify**: Invoice has GST = 10% (same as before)
3. Generate vouchers for an old invoice (created before this deployment)
4. **Verify**: Vouchers generate successfully
5. **Verify**: Modal still works for old invoices

### Test 4: Error Handling

1. Try to download vouchers for unpaid invoice
2. **Verify**: Error message appears
3. Try to download vouchers for invoice with no vouchers generated
4. **Verify**: Appropriate error message
5. Toggle GST on/off multiple times rapidly
6. **Verify**: Calculations update correctly without errors

---

## 📊 Expected Behavior

### GST Toggle Calculations:

**Example Quotation:**
- Subtotal: PGK 1,000
- Discount: PGK 50 (5%)
- Amount after discount: PGK 950

**GST ON (default):**
- GST: PGK 95 (10%)
- Total: PGK 1,045

**GST OFF:**
- GST: PGK 0
- Total: PGK 950

### Voucher PDF Download:

**Single Voucher:**
- 1 page per voucher
- Includes company details, voucher code, barcode, amount, validity
- Unregistered vouchers: QR code for registration
- Registered vouchers: Green box with passport number

**Multiple Vouchers (e.g., 10 vouchers):**
- 10 pages in single PDF
- All vouchers from the same invoice
- Consistent formatting across all pages

---

## 🔍 Verification Commands

### Check Backend Deployment:

```bash
# Verify apply_gst parameter handling
ssh root@165.22.52.100 "grep 'apply_gst' /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/invoices-gst.js | head -5"

# Expected output:
# const { quotation_id, apply_gst = true } = req.body;
# const gstRate = apply_gst ? 10 : 0;
# const gstAmount = apply_gst ? (amountAfterDiscount * 0.10) : 0;
```

### Check Frontend Deployment:

```bash
# Check if new JS bundle includes GST toggle code
ssh root@165.22.52.100 "ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/assets/ | grep Quotations"

# Should show Quotations-*.js with recent timestamp
```

### Check PM2 Status:

```bash
ssh root@165.22.52.100 "pm2 list"

# Expected output:
# greenpay-api │ online │ 0 │ X.X.X │ ...
```

---

## 🔄 Rollback Procedure

If issues occur after deployment, rollback to previous version:

```bash
# Replace BACKUP_TIMESTAMP with actual timestamp from deployment
BACKUP_TIMESTAMP="backup-20251217-HHMMSS"

ssh root@165.22.52.100 "cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud && \
  cp backend/routes/invoices-gst.js.${BACKUP_TIMESTAMP} backend/routes/invoices-gst.js && \
  rm -rf dist && \
  cp -r dist.${BACKUP_TIMESTAMP} dist && \
  pm2 restart greenpay-api"
```

---

## 📝 Database Impact

**No database schema changes required.** These enhancements use existing tables:

- `invoices` table: Already has `gst` and `total_amount` columns
- `corporate_vouchers` table: Already has all required fields
- No migrations needed

---

## 🎯 Success Criteria

Deployment is successful when:

- ✅ Build completes without errors
- ✅ Files uploaded to production
- ✅ PM2 restarts successfully and stays online
- ✅ GST toggle appears in Convert to Invoice dialog
- ✅ GST toggle calculations work correctly (on/off)
- ✅ Generated Vouchers modal displays after voucher generation
- ✅ Voucher list shows all vouchers with correct data
- ✅ Download All Vouchers produces single PDF
- ✅ Email Vouchers sends successfully
- ✅ No console errors in browser
- ✅ No backend errors in PM2 logs
- ✅ Old functionality still works (backward compatible)

---

## 🐛 Common Issues and Solutions

### Issue 1: Modal doesn't appear after voucher generation

**Symptom**: Vouchers generate but modal doesn't show

**Solution**:
- Check browser console for JavaScript errors
- Verify frontend dist folder uploaded completely
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache

### Issue 2: Download All Vouchers returns 404

**Symptom**: Button click results in "Not Found" error

**Solution**:
- Verify backend route file uploaded correctly
- Check PM2 logs: `ssh root@165.22.52.100 "pm2 logs greenpay-api --lines 50"`
- Ensure endpoint path is correct: `/api/invoices/:id/vouchers-pdf`
- Restart backend: `ssh root@165.22.52.100 "pm2 restart greenpay-api"`

### Issue 3: GST toggle doesn't update calculations

**Symptom**: Toggle switches but amounts don't change

**Solution**:
- Check browser console for React errors
- Verify state management code in Quotations.jsx
- Ensure `applyGst` state is properly connected to calculations
- Hard refresh browser and clear cache

### Issue 4: Backend crash after deployment

**Symptom**: PM2 shows greenpay-api as "errored" or "stopped"

**Solution**:
- Check PM2 logs: `ssh root@165.22.52.100 "pm2 logs greenpay-api --err --lines 100"`
- Look for syntax errors or missing dependencies
- Rollback to backup version
- Restore files and restart PM2

---

## 📞 Support

If you encounter issues:

1. Check PM2 logs for backend errors
2. Check browser console for frontend errors
3. Verify all files uploaded correctly
4. Test with different browsers
5. Check network tab for API request/response details

---

**Status**: ✅ Ready for deployment
**Date**: December 17, 2025
**Build Status**: ✅ Completed successfully
**Files Ready**: ✅ All modified files prepared

---

## 🎉 What Users Will See

### Before Deployment:
- Create invoice from quotation → no GST option → always 10% GST
- Generate vouchers → success message → no voucher preview
- Need to navigate separately to download or email vouchers

### After Deployment:
- Create invoice from quotation → **GST toggle visible** → choose 0% or 10% GST
- Generate vouchers → **modal appears automatically** → see all vouchers
- **One-click download all vouchers** as single PDF
- **One-click email all vouchers** to customer
- Professional, streamlined workflow

---

**Ready to deploy!** Run `./deploy-invoice-enhancements.sh` to begin.
