# Post-Cleanup Testing Checklist

**Date:** 2025-12-09
**Cleanup Phases Completed:** 1, 2, 3
**Changes:** Removed Supabase, consolidated services, removed duplicates

---

## ✅ Server Status

- [x] Dev server running: http://localhost:3000
- [x] No build errors
- [x] Hot module reload working
- [x] All Supabase references removed from logs

---

## Critical Functionality Tests

### 1. Authentication ⚠️ TEST REQUIRED
**Files Affected:** AuthContext.jsx, api/client.js

**Test Steps:**
1. [ ] Navigate to login page
2. [ ] Login with valid credentials
3. [ ] Verify token storage in localStorage
4. [ ] Check user session persists on page reload
5. [ ] Test logout functionality
6. [ ] Verify protected routes work correctly

**Expected:** Auth should work via REST API (no Supabase)

---

### 2. Passport Management ⚠️ TEST REQUIRED
**Files Affected:** passportsService.js (consolidated), EditPassport.jsx

**Test Steps:**
1. [ ] View passport list (/passports)
2. [ ] Create new passport
3. [ ] Edit existing passport (uses new passportsService)
4. [ ] Search for passport by number
5. [ ] Delete passport
6. [ ] Check for console errors

**Expected:** All CRUD operations work with consolidated service

---

### 3. Invoice & Voucher Generation ⚠️ TEST REQUIRED
**Files Affected:** invoiceService.js, Invoices.jsx, api/client.js

**Test Steps:**
1. [ ] Navigate to invoices page
2. [ ] Convert quotation to invoice
3. [ ] Register payment on invoice
4. [ ] Generate vouchers (duplicate prevention should work)
5. [ ] Try generating vouchers again (should show error toast)
6. [ ] Email vouchers to customer
7. [ ] Download invoice PDF

**Expected:**
- Toast notifications display correctly (not just console)
- Voucher generation works
- Email functionality works

---

### 4. Individual Purchases ⚠️ TEST REQUIRED
**Files Affected:** individualPurchasesService.js (removed duplicate fetchAPI)

**Test Steps:**
1. [ ] Navigate to individual purchases
2. [ ] Create new purchase
3. [ ] Validate voucher code
4. [ ] Mark voucher as used
5. [ ] Check transaction history

**Expected:** Purchases work with centralized API client

---

### 5. Bulk Upload ⚠️ TEST REQUIRED
**Files Affected:** bulkUploadService.js (Supabase import removed)

**Test Steps:**
1. [ ] Navigate to bulk passport upload
2. [ ] Upload CSV file with passports
3. [ ] Verify passports are created
4. [ ] Check error handling for invalid data

**Expected:** CSV processing works (no Supabase needed for local parsing)

---

### 6. Corporate Vouchers ⚠️ TEST REQUIRED
**Files Affected:** corporateVouchersService.js (Supabase import removed)

**Test Steps:**
1. [ ] Navigate to corporate exit pass
2. [ ] Create corporate vouchers
3. [ ] View vouchers list
4. [ ] Generate voucher PDFs
5. [ ] Email vouchers

**Expected:** Corporate voucher flow works

---

### 7. Reports ⚠️ TEST REQUIRED
**Files Affected:** reportsService.js (Supabase import removed)

**Test Steps:**
1. [ ] Navigate to each report type:
   - [ ] Passport Reports
   - [ ] Individual Purchase Reports
   - [ ] Corporate Voucher Reports
   - [ ] Revenue Reports
   - [ ] Bulk Upload Reports
   - [ ] Quotation Reports
2. [ ] Apply filters
3. [ ] Export data
4. [ ] Check for errors

**Expected:** All reports load and display data correctly

---

### 8. Email & SMS ⚠️ TEST REQUIRED
**Files Affected:** emailTemplatesService.js, smsService.js (Supabase imports removed)

**Test Steps:**
1. [ ] Navigate to email templates
2. [ ] View/edit templates
3. [ ] Test email sending (quotations, invoices)
4. [ ] Navigate to SMS settings
5. [ ] Test SMS functionality if configured

**Expected:** Email/SMS services work via REST API

---

### 9. Payment Gateway ⚠️ TEST REQUIRED
**Files Affected:** paymentGatewayService.js (Supabase import removed)

**Test Steps:**
1. [ ] Navigate to public voucher purchase page
2. [ ] Initiate payment session
3. [ ] Complete payment flow
4. [ ] Verify callback handling
5. [ ] Check voucher generation after payment

**Expected:** Payment gateway abstraction works

---

### 10. User Management ⚠️ TEST REQUIRED
**Files Affected:** usersService.js, Users.jsx

**Test Steps:**
1. [ ] Navigate to users page (admin only)
2. [ ] Create new user
3. [ ] Edit user profile
4. [ ] Change password
5. [ ] Reset password flow
6. [ ] View login history

**Expected:** User management works with REST API

---

## Browser Console Checks

### Expected Clean Console ✓
- [ ] No "Supabase" errors
- [ ] No "Cannot find module" errors
- [ ] No 404s for deleted files
- [ ] No authentication errors
- [ ] API calls succeed

### Known Issues (Document Any)
```
// List any console errors/warnings found during testing
```

---

## Performance Checks

- [ ] Page load times acceptable
- [ ] No memory leaks
- [ ] Bundle size reduced (check Network tab)
- [ ] Hot reload still fast

---

## Backend Health Checks

```bash
# Test backend endpoints
curl http://localhost:3000/api/health  # If health endpoint exists

# Check logs for errors
# Monitor server console during testing
```

---

## Testing Summary

**Date Tested:** ____________
**Tested By:** ____________
**Overall Status:** ⚠️ PENDING

### Issues Found:
1.
2.
3.

### Critical Bugs:
-

### Minor Issues:
-

---

## Recommended Next Steps

**If All Tests Pass:**
1. Deploy to production
2. Monitor for 24 hours
3. Close cleanup initiative

**If Issues Found:**
1. Document specific errors
2. Fix critical issues first
3. Re-test affected areas
4. Update this checklist

---

**Testing Notes:**
- Test with multiple user roles (Flex_Admin, Counter_Agent, Finance_Manager, IT_Support)
- Test on different browsers (Chrome, Firefox, Safari)
- Test both desktop and mobile views
- Check production build: `npm run build && npm run preview`

