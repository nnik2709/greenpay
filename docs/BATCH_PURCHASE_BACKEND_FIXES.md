# Batch Purchase Backend Fixes - Deployment Guide

**Date:** 2026-01-19
**Fix ID:** BATCH-BACKEND-001
**Status:** READY FOR DEPLOYMENT

---

## Problem Summary

After deploying the batch purchase frontend, three sequential backend errors were discovered during testing:

### Error 1: "Full name is required" ✅ FIXED (Frontend)
- Frontend sent `givenName` and `surname` separately
- Backend expected `fullName` field
- **Fix:** Frontend now combines fields before sending to API

### Error 2: "db.connect is not a function" ✅ FIXED (Backend)
- Line 306: Used incorrect method `db.connect()`
- Correct method is `db.getClient()` per database.js:26
- **Fix:** Changed to use correct connection pool method

### Error 3: "column 'gender' of relation 'passports' does not exist" ✅ FIXED (Backend)
- Lines 331, 340: INSERT query used `gender` column
- Actual database schema uses `sex` column (per PRODUCTION_SCHEMA.sql)
- **Fix:** Changed all references from `gender` to `sex`

---

## Fixes Applied

### Fix 1: Database Connection Method (Line 306)

**File:** `backend/routes/individual-purchases.js`

**BEFORE:**
```javascript
const client = await db.connect();
```

**AFTER:**
```javascript
const client = await db.getClient();
```

**Reason:** The database module exports `getClient()`, not `connect()`. This is defined in `backend/config/database.js:26` as `getClient: () => pool.connect()`.

---

### Fix 2: Database Schema Alignment (Lines 326-343)

**File:** `backend/routes/individual-purchases.js`

**BEFORE:**
```sql
INSERT INTO passports (
  passport_number,
  full_name,
  nationality,
  date_of_birth,
  gender,              -- ❌ INCORRECT COLUMN NAME
  passport_expiry,
  created_at
) VALUES ($1, $2, $3, $4, $5, $6, NOW())
ON CONFLICT (passport_number)
DO UPDATE SET
  full_name = EXCLUDED.full_name,
  nationality = EXCLUDED.nationality,
  date_of_birth = EXCLUDED.date_of_birth,
  gender = EXCLUDED.gender,    -- ❌ INCORRECT COLUMN NAME
  passport_expiry = EXCLUDED.passport_expiry
RETURNING *
```

**AFTER:**
```sql
INSERT INTO passports (
  passport_number,
  full_name,
  nationality,
  date_of_birth,
  sex,                 -- ✅ CORRECT COLUMN NAME
  passport_expiry,
  created_at
) VALUES ($1, $2, $3, $4, $5, $6, NOW())
ON CONFLICT (passport_number)
DO UPDATE SET
  full_name = EXCLUDED.full_name,
  nationality = EXCLUDED.nationality,
  date_of_birth = EXCLUDED.date_of_birth,
  sex = EXCLUDED.sex,          -- ✅ CORRECT COLUMN NAME
  passport_expiry = EXCLUDED.passport_expiry
RETURNING *
```

**Reason:** The actual database schema (PRODUCTION_SCHEMA.sql) defines the column as `sex`, not `gender`. This matches the existing single-voucher purchase flow.

---

## Files Modified

### Backend (REQUIRES DEPLOYMENT)
- ✅ `backend/routes/individual-purchases.js`
  - Line 306: Fixed connection method
  - Lines 331, 340: Fixed column name from `gender` to `sex`

### Frontend (ALREADY DEPLOYED)
- ✅ `dist/assets/IndividualPurchase-9fb2fdf3.js` (deployed previously)

---

## Deployment Instructions

### Step 1: Upload Backend File

**CRITICAL:** This file MUST be uploaded to the correct backend location.

**Correct Path:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js`

**Method:** CloudPanel File Manager
1. Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`
2. Upload: `backend/routes/individual-purchases.js` (overwrite existing)
3. Verify file size is ~30KB (batch endpoints included)

---

### Step 2: Verify Upload (SSH Commands)

Copy/paste these commands in your SSH terminal:

```bash
# 1. Check file size (should be ~30KB with batch endpoints)
ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js

# 2. Verify db.getClient() is present (should show 1 match)
grep -n "db.getClient()" /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js | head -1

# 3. Verify 'sex' column is used (should show 2 matches at lines ~331 and ~340)
grep -n "sex," /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js | grep -E "(331|340)"

# 4. Confirm NO 'gender' column references remain (should show 0 matches in SQL)
grep -n "gender" /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/individual-purchases.js | grep -v "// gender"
```

**Expected Output:**
- File size: ~30,000 bytes
- Line 306: `const client = await db.getClient();`
- Lines 331, 340: `sex,` and `sex = EXCLUDED.sex`
- No `gender` column references in SQL queries

---

### Step 3: Restart Backend Service

```bash
# Restart the backend API
pm2 restart greenpay-api

# Verify service is running
pm2 status greenpay-api

# Monitor logs during restart
pm2 logs greenpay-api --lines 20
```

**Expected Output:**
- Status: `online`
- Uptime: `0s` (just restarted)
- No errors in logs

---

### Step 4: Test Batch Purchase Flow

**Test Case 1: Manual Entry - 2 Vouchers**
1. Navigate to: `https://greenpay.eywademo.cloud/individual-purchase`
2. Select quantity: **2**
3. Manually enter first passport details
4. Click "Add Passport (0/2)"
5. Should see toast: "Passport 1/2 Added"
6. Form should clear automatically
7. Manually enter second passport details
8. Click "Add Passport (1/2)"
9. Should see toast: "Passport 2/2 Added"
10. Click "Proceed to Payment (2 Passports) →"
11. Complete payment
12. **Expected:** 2 vouchers created successfully with same batch_id

**Test Case 2: Scanner Entry - 3 Vouchers**
1. Select quantity: **3**
2. Scan first passport with MRZ scanner
3. Should see toast: "Passport 1/3 Added"
4. Scan second passport
5. Should see toast: "Passport 2/3 Added"
6. Scan third passport
7. Should see toast: "Passport 3/3 Added"
8. Click "Proceed to Payment (3 Passports) →"
9. Complete payment
10. **Expected:** 3 vouchers created successfully with same batch_id

**Test Case 3: Mixed Entry - 2 Vouchers**
1. Select quantity: **2**
2. **Scan** first passport
3. **Manually enter** second passport
4. Complete payment
5. **Expected:** 2 vouchers created successfully

---

### Step 5: Monitor Backend Logs

While testing, keep logs running in a separate terminal:

```bash
pm2 logs greenpay-api --lines 50
```

**Watch For:**
- ✅ `[BATCH_PURCHASE] Creating batch of X vouchers`
- ✅ `Batch vouchers created successfully. Batch ID: ...`
- ❌ Any errors containing "column", "gender", "db.connect", "fullName"

---

## Database Verification (Optional)

After successful test, verify batch purchases in database:

```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 72.61.208.79 -U greenpay_user -d greenpay_db -c "
SELECT
  batch_id,
  COUNT(*) as voucher_count,
  STRING_AGG(voucher_code, ', ') as voucher_codes,
  MIN(created_at) as batch_created
FROM individual_purchases
WHERE batch_id IS NOT NULL
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY batch_id
ORDER BY batch_created DESC
LIMIT 5;
"
```

**Expected Output:**
- Recent batch_id entries
- Correct voucher_count (2-5 per batch)
- Multiple voucher codes per batch_id
- All vouchers in batch created at same time

---

## Rollback Plan

### If Issues Occur After Deployment

**Option 1: Revert Backend File**
1. Re-upload previous version of `individual-purchases.js` (backup recommended before deployment)
2. Restart: `pm2 restart greenpay-api`

**Option 2: Disable Batch Feature (Frontend)**
Frontend can still work in single-mode even with new backend:
- Users selecting quantity = 1 will use existing single-voucher flow
- Batch endpoint won't be called

**Option 3: Database Rollback**
Not needed - no database migrations in this fix, only SQL query corrections

---

## Error Reference

### Error 1 (RESOLVED): Full Name Required
**Error Message:** `[BATCH_PURCHASE] Error: Error: Passport 1: Full name is required`
**Location:** Frontend validation in `batchPurchaseService.js:38`
**Fix:** Frontend now sends `fullName: "${givenName} ${surname}"`

### Error 2 (RESOLVED): db.connect is not a function
**Error Message:** `TypeError: db.connect is not a function at .../individual-purchases.js:306:29`
**Location:** Backend line 306
**Fix:** Changed to `db.getClient()`

### Error 3 (RESOLVED): Column 'gender' does not exist
**Error Message:** `error: column "gender" of relation "passports" does not exist at .../individual-purchases.js:354:32`
**PostgreSQL Error Code:** 42703 (undefined column)
**Location:** Backend lines 331, 340
**Fix:** Changed `gender` to `sex` to match database schema

---

## Success Criteria

✅ **Deployment Successful When:**
1. Backend file uploaded to correct path
2. `pm2 restart greenpay-api` completes without errors
3. Service status shows `online`
4. Manual entry batch purchase works (2+ vouchers)
5. Scanner entry batch purchase works (2+ vouchers)
6. Mixed entry (manual + scanner) batch purchase works
7. All vouchers in batch have same `batch_id` in database
8. Payment calculation correct (quantity × 50 PGK)
9. No errors in PM2 logs during test transactions
10. Browser console shows no errors

---

## Technical Notes

### Why These Errors Occurred

1. **db.connect() Error:**
   - Batch endpoint was new code
   - Developer assumed `connect()` method name
   - Existing single-voucher endpoints use `db.query()` directly (no transaction)
   - Batch endpoint needs transaction, so used `db.getClient()` pattern

2. **Gender vs Sex Column:**
   - Frontend form uses "Sex" label (M/F dropdown)
   - Backend API initially mapped to `gender` column
   - Actual database schema uses `sex` column (per PNG government standards)
   - Single-voucher flow doesn't expose this issue (uses different code path)

3. **Sequential Discovery:**
   - Each fix revealed the next issue only after deployment
   - Frontend validation caught first issue
   - Connection method issue appeared after frontend fix
   - Schema mismatch appeared only after connection fix
   - This is normal for new feature deployment - issues cascade

---

## Additional Testing (Recommended)

### Stress Testing
- Create batch with maximum quantity (5 vouchers)
- Test duplicate detection (scan same passport twice)
- Test batch full prevention (try to add 6th passport to 5-voucher batch)
- Test payment failure handling (what happens if payment fails after batch created?)

### Edge Cases
- Empty optional fields (date_of_birth, sex, passport_expiry all null)
- Very long names (>100 characters)
- Special characters in names (apostrophes, hyphens, accents)
- Passport numbers with varying formats

### Concurrent Usage
- Two agents creating batches simultaneously
- Same passport in different batches (should be allowed)
- Batch purchase while single purchases happening

---

## Support Information

**Fixes Implemented By:** Claude Code
**Deployment Date:** 2026-01-19
**Backend File Modified:** `backend/routes/individual-purchases.js`
**Frontend Status:** Already deployed (no changes needed)
**Database Status:** No migrations needed (only query corrections)

**Contact:** For issues, check:
1. PM2 logs: `pm2 logs greenpay-api`
2. Browser console (F12 → Console)
3. Network tab (F12 → Network) for API responses

---

**END OF DOCUMENT**
