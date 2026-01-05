# Testing Checklist - December 15, 2025

## Overview

Testing all features deployed today:
1. Revenue Report fixes
2. Cash Reconciliation API
3. Unified PDF templates
4. Real logos in PDFs

---

## ✅ Test 1: Revenue Generated Report

### Test 1.1: Page Loads Without Errors

**URL:** https://greenpay.eywademo.cloud/app/reports/revenue-generated

**Steps:**
1. Login as Flex_Admin, Finance_Manager, or IT_Support
2. Navigate to Reports → Revenue Generated
3. Wait for page to load

**Expected Results:**
- ✅ Page loads successfully
- ✅ No console errors (press F12 to check)
- ✅ Stats cards display with "PGK 0.00" format
- ✅ Data table visible (may be empty if no data)

**Test Status:** [ ] Pass  [ ] Fail

**Notes:**
_________________________________

---

### Test 1.2: Date Filtering Works

**Steps:**
1. On Revenue Report page
2. Select "Date From" (e.g., 2025-12-01)
3. Select "Date To" (e.g., 2025-12-15)
4. Wait for data to load

**Expected Results:**
- ✅ Data filters by date range
- ✅ Stats update correctly
- ✅ No errors in console

**Test Status:** [ ] Pass  [ ] Fail

**Notes:**
_________________________________

---

### Test 1.3: Stats Display Correctly

**Check all stat cards:**
- [ ] Total Records - Shows number (not "NaN")
- [ ] Total Exit Pass - Shows number
- [ ] Total Amount - Shows "PGK X.XX" format
- [ ] Total Collected - Shows "PGK X.XX" format
- [ ] Total Discount - Shows "PGK X.XX" format
- [ ] Total Returned - Shows "PGK X.XX" format

**Test Status:** [ ] Pass  [ ] Fail

**Notes:**
_________________________________

---

## ✅ Test 2: Cash Reconciliation

### Test 2.1: Page Loads Without 404 Error

**URL:** https://greenpay.eywademo.cloud/app/reports/cash-reconciliation

**Steps:**
1. Login as Counter_Agent or Flex_Admin
2. Navigate to Cash Reconciliation page
3. Wait for page to load

**Expected Results:**
- ✅ Page loads successfully
- ✅ No 404 error
- ✅ No 500 error
- ✅ Form displays correctly

**Test Status:** [ ] Pass  [ ] Fail

**Notes:**
_________________________________

---

### Test 2.2: Transaction Summary Loads

**Steps:**
1. On Cash Reconciliation page
2. Select today's date
3. Wait for transaction summary to load

**Expected Results:**
- ✅ API call succeeds (check Network tab in F12)
- ✅ Transaction summary displays
- ✅ Shows totals: Cash, Card, Bank Transfer, EFTPOS
- ✅ Transaction count displays

**API Endpoint Check:**
```
GET /api/cash-reconciliations/transactions?date=YYYY-MM-DD&agent_id=X
Status: 200 OK
```

**Test Status:** [ ] Pass  [ ] Fail

**Notes:**
_________________________________

---

### Test 2.3: Create Reconciliation (Optional)

**Steps:**
1. Fill in denomination counts
2. Add notes
3. Click "Submit Reconciliation"

**Expected Results:**
- ✅ Reconciliation creates successfully
- ✅ Confirmation message appears
- ✅ Data saved to database

**Test Status:** [ ] Pass  [ ] Fail  [ ] Skipped

**Notes:**
_________________________________

---

## ✅ Test 3: Unified PDF Template

### Test 3.1: Individual Voucher PDF (WITH Passport)

**Steps:**
1. Go to `/buy-online` or create individual purchase with passport
2. Download voucher PDF
3. Open PDF and inspect

**Expected Results:**
- ✅ GREEN CARD title visible (green color, large font)
- ✅ "Foreign Passport Holder" subtitle
- ✅ Coupon Number displays correctly
- ✅ Barcode/QR code visible
- ✅ **Shows "Passport Number: XXXXXXX"** (not "Scan to Register")
- ✅ Footer with generation date

**Test Status:** [ ] Pass  [ ] Fail

**Screenshot/Notes:**
_________________________________

---

### Test 3.2: Individual Voucher PDF (WITHOUT Passport)

**Steps:**
1. Create voucher without passport data (PENDING status)
2. Download voucher PDF
3. Open PDF and inspect

**Expected Results:**
- ✅ GREEN CARD title visible
- ✅ "Foreign Passport Holder" subtitle
- ✅ Coupon Number displays
- ✅ Barcode/QR code visible
- ✅ **Shows "Scan to Register"**
- ✅ **Shows registration URL**: `https://greenpay.eywademo.cloud/register/XXXXX`
- ✅ Footer with generation date

**Test Status:** [ ] Pass  [ ] Fail

**Screenshot/Notes:**
_________________________________

---

### Test 3.3: Corporate Voucher Batch PDF

**Steps:**
1. Admin creates corporate voucher batch
2. Download batch as PDF (or send via email)
3. Open PDF and inspect all pages

**Expected Results:**
- ✅ Each voucher on separate page
- ✅ All vouchers use GREEN CARD template
- ✅ All show "Scan to Register" (corporate vouchers need registration)
- ✅ Registration URLs unique per voucher
- ✅ Footer shows company name

**Test Status:** [ ] Pass  [ ] Fail

**Screenshot/Notes:**
_________________________________

---

## ✅ Test 4: Real Logos in PDFs

### Test 4.1: Logos Display in Individual Voucher

**Steps:**
1. Download any individual voucher PDF
2. Open and zoom to top of page
3. Inspect logo area

**Expected Results:**
- ✅ **Left logo**: CCDA logo visible (blue/green circular logo)
- ✅ **Right logo**: PNG National Emblem visible (bird of paradise)
- ✅ No placeholder circles or text
- ✅ Logos are clear and not distorted
- ✅ Logos properly sized and positioned

**Test Status:** [ ] Pass  [ ] Fail

**Screenshot/Notes:**
_________________________________

---

### Test 4.2: Logos Display in Corporate Voucher

**Steps:**
1. Download corporate voucher batch PDF
2. Check first page for logos
3. Check 2-3 additional pages

**Expected Results:**
- ✅ CCDA logo displays on all pages
- ✅ PNG emblem displays on all pages
- ✅ Logos consistent across all vouchers
- ✅ No missing images or broken links

**Test Status:** [ ] Pass  [ ] Fail

**Screenshot/Notes:**
_________________________________

---

### Test 4.3: Backend Logs Check

**Steps:**
1. SSH to server or check PM2 logs
2. Look for logo-related errors

**Command:**
```bash
ssh root@165.22.52.100 "pm2 logs greenpay-backend --lines 100 | grep -i 'logo\|image\|error'"
```

**Expected Results:**
- ✅ No "File not found" errors for logos
- ✅ No "Error loading CCDA logo" messages
- ✅ No "Error loading PNG emblem" messages
- ✅ PDF generation succeeds without errors

**Test Status:** [ ] Pass  [ ] Fail

**Log Output:**
_________________________________

---

## ✅ Test 5: Registration Flow (End-to-End)

### Test 5.1: Voucher WITHOUT Passport → Registration → Active

**Steps:**
1. Purchase voucher without passport (PENDING status)
2. Note the voucher code from PDF
3. Copy registration URL from PDF
4. Visit registration URL in browser
5. Fill in passport details
6. Submit registration
7. Try to scan/validate voucher

**Expected Results:**
- ✅ Registration page loads from URL in PDF
- ✅ Voucher code pre-filled
- ✅ Can enter passport details
- ✅ Registration succeeds
- ✅ Voucher status changes from PENDING to active
- ✅ Can now scan voucher successfully

**Test Status:** [ ] Pass  [ ] Fail

**Notes:**
_________________________________

---

## ✅ Test 6: Cross-Browser Testing

### Test 6.1: Chrome/Edge
- [ ] Revenue Report works
- [ ] Cash Reconciliation works
- [ ] PDFs download correctly
- [ ] Logos display in PDFs

### Test 6.2: Firefox
- [ ] Revenue Report works
- [ ] Cash Reconciliation works
- [ ] PDFs download correctly
- [ ] Logos display in PDFs

### Test 6.3: Safari (if available)
- [ ] Revenue Report works
- [ ] Cash Reconciliation works
- [ ] PDFs download correctly
- [ ] Logos display in PDFs

**Test Status:** [ ] Pass  [ ] Fail  [ ] Skipped

**Notes:**
_________________________________

---

## ✅ Test 7: Mobile/Responsive Testing

### Test 7.1: Mobile Browser (Phone)

**Steps:**
1. Open on mobile device or use Chrome DevTools mobile view
2. Test Revenue Report
3. Test Cash Reconciliation
4. Download and view PDF

**Expected Results:**
- ✅ Pages responsive on mobile
- ✅ Can download PDFs on mobile
- ✅ PDFs readable on mobile
- ✅ Logos display correctly

**Test Status:** [ ] Pass  [ ] Fail  [ ] Skipped

**Notes:**
_________________________________

---

## ✅ Test 8: Performance Testing

### Test 8.1: PDF Generation Speed

**Steps:**
1. Create individual voucher → Download PDF
2. Note time taken
3. Create corporate batch (10 vouchers) → Download PDF
4. Note time taken

**Expected Results:**
- ✅ Individual PDF: < 3 seconds
- ✅ Batch PDF (10 vouchers): < 10 seconds
- ✅ No timeout errors
- ✅ No memory issues

**Test Status:** [ ] Pass  [ ] Fail

**Timing:**
- Individual: _______ seconds
- Batch (10): _______ seconds

---

## 🐛 Issues Found

### Issue #1
**Description:**
_________________________________

**Severity:** [ ] Critical  [ ] High  [ ] Medium  [ ] Low

**Steps to Reproduce:**
_________________________________

**Expected vs Actual:**
_________________________________

---

### Issue #2
**Description:**
_________________________________

**Severity:** [ ] Critical  [ ] High  [ ] Medium  [ ] Low

**Steps to Reproduce:**
_________________________________

**Expected vs Actual:**
_________________________________

---

## 📊 Test Summary

**Total Tests:** ___ / 25
**Passed:** ___
**Failed:** ___
**Skipped:** ___

**Overall Status:** [ ] All Pass  [ ] Minor Issues  [ ] Major Issues

---

## ✅ Sign-Off

**Tested By:** _________________
**Date:** December 15, 2025
**Time:** _________________
**Environment:** Production (greenpay.eywademo.cloud)

**Approved for Production:** [ ] Yes  [ ] No  [ ] With Conditions

**Notes:**
_________________________________

---

## 📞 Support

If you find any issues during testing:
1. Note the exact steps to reproduce
2. Take screenshots if visual issue
3. Check browser console for errors (F12)
4. Check backend logs if API error
5. Document in "Issues Found" section above

**Quick Debug Commands:**
```bash
# Check backend logs
ssh root@165.22.52.100 "pm2 logs greenpay-backend --lines 50"

# Check backend status
ssh root@165.22.52.100 "pm2 status"

# Check logo files exist
ssh root@165.22.52.100 "ls -la /var/www/greenpay/backend/assets/logos/"
```

---

**Document Version:** 1.0
**Last Updated:** December 15, 2025
