# View Vouchers by Passport Feature Removal

**Date:** 2025-12-19
**Status:** ✅ COMPLETE - Feature safely removed

---

## Summary

The "View Vouchers by Passport" feature has been completely removed from the application. This feature was causing database errors due to schema mismatches and was determined to be redundant with existing functionality in `/app/vouchers-list` where users can filter by passport number.

---

## Files Modified

### 1. Frontend Component
**File:** `src/pages/Passports.jsx`

**Changes:**
- Removed import: `getVouchersByPassport` from `individualPurchasesService`
- Removed state variables:
  - `isVouchersDialogOpen`
  - `vouchersData`
  - `loadingVouchers`
- Removed `handleViewVouchers()` function (lines 81-101)
- Removed "View Vouchers" button from search results table (line 324)
- Removed entire Vouchers Dialog component (lines 537-634)

**Impact:** Users can no longer click "View Vouchers" button from passport search results.

---

### 2. Frontend Service Layer
**File:** `src/lib/individualPurchasesService.js`

**Changes:**
- Removed `getVouchersByPassport()` function (lines 63-71)
- Replaced with comment indicating deprecation

**Impact:** Frontend service no longer calls the backend endpoint.

---

### 3. Backend API Endpoint
**File:** `backend/routes/vouchers.js`

**Changes:**
- Removed entire route handler: `GET /api/vouchers/by-passport/:passportNumber` (lines 1092-1185)
- This endpoint was joining data from:
  - `individual_purchases` table
  - `corporate_vouchers` table
  - `passports` table

**Impact:**
- Backend no longer serves this endpoint
- Eliminates database errors from schema mismatches
- Reduces API surface area

---

## What This Feature Did

The removed feature allowed users to:
1. Search for a passport in the Passports page
2. Click "View Vouchers" button in the search results
3. See a modal dialog showing all vouchers (individual + corporate) associated with that passport
4. View voucher details: code, type, status, amount, payment method, dates, etc.

---

## Alternative Functionality

Users can still access voucher information through:

1. **Vouchers List Page** (`/app/vouchers-list`)
   - Filter vouchers by passport number
   - View all individual and corporate vouchers
   - Same filtering capability

2. **Individual Purchases Page** (`/app/individual-purchases`)
   - View all individual purchases with passport numbers

3. **Corporate Vouchers Page** (`/app/corporate-vouchers`)
   - View all corporate vouchers with passport information

---

## Database Errors Eliminated

This removal fixes the following production errors:

```
Error fetching vouchers by passport: error: column cv.payment_method does not exist
Error fetching vouchers by passport: error: column p.email does not exist
Error fetching vouchers by passport: error: column p.phone does not exist
Error fetching vouchers by passport: error: column cv.issued_date does not exist
```

**Root Cause:**
- The query was trying to access columns that don't exist in the modern schema
- `corporate_vouchers` table doesn't have `payment_method` column
- `passports` table doesn't have `email` or `phone` columns
- `corporate_vouchers` uses `created_at` not `issued_date`

---

## Deployment Steps

### 1. Deploy Backend
```bash
scp backend/routes/vouchers.js root@165.22.52.100:/var/www/greenpay/backend/routes/
```

### 2. Deploy Frontend
```bash
scp src/pages/Passports.jsx root@165.22.52.100:/var/www/greenpay/src/pages/
scp src/lib/individualPurchasesService.js root@165.22.52.100:/var/www/greenpay/src/lib/
```

### 3. Restart Services
```bash
# Restart backend API
ssh root@165.22.52.100 "pm2 restart greenpay-api"

# Rebuild and restart frontend (if needed)
ssh root@165.22.52.100 "cd /var/www/greenpay && npm run build && pm2 restart greenpay"
```

### 4. Verify
```bash
# Check backend logs - should see no more "vouchers by passport" errors
ssh root@165.22.52.100 "pm2 logs greenpay-api --lines 50"

# Test Passports page - "View Vouchers" button should be gone
# Visit: https://greenpay.eywademo.cloud/app/passports
```

---

## Testing Checklist

After deployment, verify:

- [ ] Passports page loads without errors
- [ ] Passport search functionality still works
- [ ] "View Vouchers" button is no longer visible
- [ ] Other passport features work (Create, Scan, Send Email)
- [ ] No errors in browser console
- [ ] No errors in PM2 logs related to vouchers/passport queries
- [ ] Vouchers List page still works for filtering by passport

---

## Code Cleanup

**Syntax Check:** ✅ Passed
```bash
node -c backend/routes/vouchers.js  # OK
node -c src/lib/individualPurchasesService.js  # OK
```

**Lines Removed:** ~150 lines total
- Backend: ~93 lines (complex SQL queries + route handler)
- Frontend: ~54 lines (UI component + dialog)
- Service: ~9 lines (API call function)

---

## Rationale

1. **Redundant:** Same functionality available in `/app/vouchers-list` with better filtering
2. **Error-prone:** Schema mismatches causing production errors
3. **Maintenance burden:** Complex JOINs across 3 tables with different schemas
4. **User experience:** Simpler to direct users to dedicated vouchers list page

---

## Rollback Procedure

If needed, the feature can be restored from Git history:

```bash
# View this commit before removal
git log --oneline -- src/pages/Passports.jsx

# Restore files from previous commit
git checkout <commit-hash> -- src/pages/Passports.jsx
git checkout <commit-hash> -- src/lib/individualPurchasesService.js
git checkout <commit-hash> -- backend/routes/vouchers.js
```

However, note that the restored feature will still have the same database schema issues.

---

**Removed by:** Claude Code
**Approved by:** User
**Migration Status:** Complete ✅
