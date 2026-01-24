# Batch Purchase - Final Backend Fix

**Date:** 2026-01-19
**Issue:** Column "sex" does not exist in passports table
**Status:** FIXED - Ready for deployment

---

## Root Cause

The `passports` table in production **does NOT have a `sex` or `gender` column**. The batch purchase INSERT statement was trying to insert into a non-existent column.

### Evidence:
- Error message: `column "sex" of relation "passports" does not exist`
- Database listing shows `passports` table exists (line item in \dt output)
- Only 4 data columns exist: `passport_number`, `full_name`, `nationality`, `date_of_birth`, `passport_expiry`, `created_at`

---

## Fix Applied

**File:** `backend/routes/individual-purchases.js`
**Lines:** 325-349

### Changes:

**BEFORE (6 parameters - INCORRECT):**
```javascript
const passportQuery = `
  INSERT INTO passports (
    passport_number,
    full_name,
    nationality,
    date_of_birth,
    sex,                 // ❌ DOESN'T EXIST
    passport_expiry,
    created_at
  ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
  ON CONFLICT (passport_number)
  DO UPDATE SET
    full_name = EXCLUDED.full_name,
    nationality = EXCLUDED.nationality,
    date_of_birth = EXCLUDED.date_of_birth,
    sex = EXCLUDED.sex,  // ❌ DOESN'T EXIST
    passport_expiry = EXCLUDED.passport_expiry
  RETURNING *
`;

const passportValues = [
  passport.passportNumber,
  passport.fullName,
  passport.nationality,
  passport.dateOfBirth || null,
  passport.gender || null,      // ❌ EXTRA PARAMETER
  passport.passportExpiry || null
];
```

**AFTER (5 parameters - CORRECT):**
```javascript
const passportQuery = `
  INSERT INTO passports (
    passport_number,
    full_name,
    nationality,
    date_of_birth,
    passport_expiry,     // ✅ REMOVED sex column
    created_at
  ) VALUES ($1, $2, $3, $4, $5, NOW())
  ON CONFLICT (passport_number)
  DO UPDATE SET
    full_name = EXCLUDED.full_name,
    nationality = EXCLUDED.nationality,
    date_of_birth = EXCLUDED.date_of_birth,
    passport_expiry = EXCLUDED.passport_expiry  // ✅ REMOVED sex update
  RETURNING *
`;

const passportValues = [
  passport.passportNumber,
  passport.fullName,
  passport.nationality,
  passport.dateOfBirth || null,
  passport.passportExpiry || null  // ✅ REMOVED gender parameter
];
```

---

## Deployment Steps

### 1. Upload Backend File

**Method:** CloudPanel File Manager (manual upload)

**Source File:** `backend/routes/individual-purchases.js` (from your local machine)

**Target Path:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js`

**Steps:**
1. Open CloudPanel File Manager
2. Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`
3. Upload `individual-purchases.js` (overwrite existing file)
4. Confirm file size is approximately 30KB

---

### 2. Verify Upload (SSH Commands)

Copy and paste these commands in your SSH terminal:

```bash
# Check file was uploaded
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js

# Verify the INSERT has 5 VALUES placeholders (should show: VALUES ($1, $2, $3, $4, $5, NOW()))
grep -A 2 "INSERT INTO passports" /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js | grep VALUES

# Confirm NO sex or gender column references (should return nothing or only comments)
grep -n "sex\|gender" /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js | grep -v "success" | grep -v "//"

# Count the passportValues array (should be 5 items)
grep -A 6 "const passportValues = " /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js | head -8
```

**Expected Output:**
- File size: ~30KB
- VALUES clause: `VALUES ($1, $2, $3, $4, $5, NOW())`
- No `sex` or `gender` in column names
- passportValues array has 5 elements

---

### 3. Restart Backend Service

```bash
pm2 restart greenpay-api
```

**Expected Output:**
```
[PM2] Applying action restartProcessId on app [greenpay-api](ids: [ 0 ])
[PM2] [greenpay-api](0) ✓
```

---

### 4. Verify Service Running

```bash
pm2 status greenpay-api
```

**Expected Output:**
- **Status:** `online`
- **Uptime:** `0s` (just restarted)
- **Restarts:** Incremented by 1

---

### 5. Monitor Logs During Test

Open a separate terminal and run:

```bash
pm2 logs greenpay-api --lines 50
```

Keep this running while you test the batch purchase.

---

## Testing the Fix

### Test Case: Batch Purchase with 2 Vouchers

1. Navigate to: `https://greenpay.eywademo.cloud/individual-purchase`
2. Select **Quantity: 2**
3. **Enter first passport manually:**
   - Passport Number: `TEST001`
   - Nationality: `PNG`
   - Given Name: `John`
   - Surname: `Doe`
4. Click **"Add Passport (0/2)"**
5. **Expected:** Toast message "Passport 1/2 Added: John Doe"
6. Form should clear automatically
7. **Enter second passport:**
   - Passport Number: `TEST002`
   - Nationality: `PNG`
   - Given Name: `Jane`
   - Surname: `Smith`
8. Click **"Add Passport (1/2)"**
9. **Expected:** Toast message "Passport 2/2 Added: Jane Smith"
10. **"Proceed to Payment (2 Passports) →"** button appears
11. Click to proceed to payment
12. Select payment method: **CASH**
13. Enter collected amount: **100**
14. Click **"Process Payment"**

### Expected Success:
- ✅ No errors in browser console
- ✅ Success message: "Batch Created Successfully! 2 vouchers created."
- ✅ Redirected to voucher success page showing both vouchers
- ✅ Both vouchers have the same `batch_id`

### If Successful:
Check PM2 logs - you should see:
```
[BATCH_PURCHASE] Creating batch of 2 vouchers
[BATCH_PURCHASE] Batch vouchers created successfully. Batch ID: xxxxx
```

---

## Error Scenarios

### If Error Still Occurs:

**1. Check if backend file was uploaded correctly:**
```bash
md5sum /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js
```
Compare with local file checksum.

**2. Check if PM2 restarted correctly:**
```bash
pm2 describe greenpay-api | grep "uptime"
```
Should show recent restart time.

**3. Check for syntax errors:**
```bash
node -c /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js
```
Should output nothing (no errors).

**4. Check PM2 error logs:**
```bash
pm2 logs greenpay-api --err --lines 50
```

---

## Database Verification (After Successful Test)

Verify batch purchases were created correctly:

```bash
# Connect to database
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay

# Check recent batch purchases
SELECT
  batch_id,
  COUNT(*) as voucher_count,
  STRING_AGG(voucher_code, ', ') as vouchers,
  MIN(created_at) as created
FROM individual_purchases
WHERE batch_id IS NOT NULL
  AND created_at > NOW() - INTERVAL '10 minutes'
GROUP BY batch_id
ORDER BY created DESC
LIMIT 5;

# Exit psql
\q
```

**Expected Output:**
- Batch ID should appear
- `voucher_count` should be 2
- Two voucher codes listed
- Created timestamp should be very recent

---

## Rollback Plan

If issues persist after deployment:

**Option 1: Revert Backend File**
1. Re-upload previous version of `individual-purchases.js`
2. Run: `pm2 restart greenpay-api`

**Option 2: Disable Batch Feature**
Users can still purchase single vouchers (quantity = 1) which won't use the batch endpoint.

**Option 3: Check Database Schema**
If errors continue, verify actual passports table schema:
```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -c "\d passports"
```

---

## Why This Error Occurred

1. **Initial implementation** assumed `gender`/`sex` column existed based on PRODUCTION_SCHEMA.sql file
2. **Actual production database** doesn't have this column (possibly removed in a migration or never existed)
3. **Single-voucher purchases** never exposed this issue because they don't insert passport records directly
4. **Batch purchases** hit this error immediately because they create new passport records

---

## Summary of All Fixes

This deployment includes fixes for **3 sequential errors**:

### Error 1: "Full name is required" ✅ FIXED (Frontend)
- **Location:** Frontend - `IndividualPurchase.jsx`
- **Fix:** Combined `givenName` + `surname` into `fullName` before sending to API

### Error 2: "db.connect is not a function" ✅ FIXED (Backend)
- **Location:** Backend - Line 306
- **Fix:** Changed to `db.getClient()`

### Error 3: "column 'sex' does not exist" ✅ FIXED (Backend - THIS FIX)
- **Location:** Backend - Lines 325-349
- **Fix:** Removed `sex` column from INSERT statement and VALUES array

---

## Files Modified

- ✅ `backend/routes/individual-purchases.js` (Lines 306, 325-349)
- ✅ `src/pages/IndividualPurchase.jsx` (Already deployed)
- ✅ Frontend build: `dist/` (Already deployed)

---

## Success Criteria

✅ **Deployment Successful When:**
1. Backend file uploaded successfully
2. PM2 restart shows `online` status
3. Test batch purchase (2 vouchers) completes without errors
4. Browser console shows no errors
5. Success message displays with batch ID
6. Database shows both vouchers with same `batch_id`
7. PM2 logs show: "Batch vouchers created successfully"

---

**Status:** Ready for Deployment
**Next Step:** Upload `backend/routes/individual-purchases.js` via CloudPanel

---
