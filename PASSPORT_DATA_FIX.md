# Passport Data Storage Fix
**Date**: January 21, 2026
**Status**: Fixed & Ready for Deployment

---

## Problem Discovered

User reported that:
1. Passport list at `/app/passports` is **EMPTY**
2. Passport reports at `/app/reports/passports` are **EMPTY**
3. BUT passport numbers ARE visible in:
   - Individual purchase reports
   - Payments list

**Root Cause**: Passport registration endpoint was only updating `individual_purchases` table, NOT creating records in `passports` table.

---

## Technical Analysis

### What Was Happening (WRONG)

When a passport was scanned and registered with a voucher via `/api/public-purchases/register-passport`:

```javascript
// OLD CODE (backend/routes/public-purchases.js lines 534-553)
UPDATE individual_purchases
SET passport_number = $1,
    customer_name = $2
WHERE voucher_code = $3
```

**Result**:
- Passport data stored ONLY in `individual_purchases` table
- NO record created in `passports` table
- Passport list/reports show ZERO records

### What Should Happen (CORRECT)

The corporate voucher registration was doing it correctly:

```javascript
// CORRECT (backend/routes/corporate-voucher-registration.js lines 250-251)
INSERT INTO passports (
  passport_number,
  full_name,
  nationality,
  date_of_birth,
  expiry_date
) VALUES (...)
```

**Result**:
- Passport record created in `passports` table
- Can be queried by passport list/reports
- Proper data normalization

---

## Fix Applied

### 1. Updated `register-passport` Endpoint

**File**: `backend/routes/public-purchases.js` (lines 534-598)

**Changes**:
1. Check if passport already exists in `passports` table
2. If not, create new passport record
3. Link `individual_purchases.passport_id` to `passports.id`
4. Update voucher with both passport_number AND passport_id

**New Logic**:
```javascript
// Check if passport exists
SELECT id FROM passports WHERE passport_number = $1

// If not exists, create new passport
INSERT INTO passports (
  passport_number,
  full_name,
  nationality,
  date_of_birth,
  passport_type,
  sex
) VALUES (...)
RETURNING id

// Update voucher with passport_id
UPDATE individual_purchases
SET passport_number = $1,
    customer_name = $2,
    passport_id = $3  -- NEW!
WHERE voucher_code = $4
```

### 2. Created Backfill Migration

**File**: `database/migrations/backfill-passports-from-purchases.sql`

**Purpose**: Fix all existing vouchers that were registered BEFORE this fix.

**What it does**:
1. Finds all `individual_purchases` with passport_number but no passport record
2. Creates passport records for each unique passport
3. Links `individual_purchases.passport_id` to the new passport records

**SQL**:
```sql
-- Create passport records
INSERT INTO passports (passport_number, full_name, ...)
SELECT DISTINCT passport_number, customer_name, ...
FROM individual_purchases
WHERE passport_number IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM passports WHERE passport_number = ip.passport_number)

-- Link purchases to passports
UPDATE individual_purchases ip
SET passport_id = p.id
FROM passports p
WHERE ip.passport_number = p.passport_number
  AND ip.passport_id IS NULL
```

---

## Deployment Instructions

### Step 1: Deploy Backend Fix

Since you deploy manually via CloudPanel File Manager:

1. **Upload** `backend/routes/public-purchases.js` to:
   ```
   /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
   ```

2. **Restart backend** (paste in your SSH terminal):
   ```bash
   pm2 restart greenpay-api
   pm2 logs greenpay-api --lines 20
   ```

### Step 2: Run Backfill Migration

**Paste in your SSH terminal**:
```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud

# Run the backfill migration
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay -d greenpay_db -f database/migrations/backfill-passports-from-purchases.sql

# Verify passport records were created
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay -d greenpay_db -c "SELECT COUNT(*) as total_passports FROM passports;"

# Check that purchases are linked to passports
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay -d greenpay_db -c "SELECT COUNT(*) as purchases_with_passport_id FROM individual_purchases WHERE passport_id IS NOT NULL;"
```

### Step 3: Verify Fix

After running the migration, check these pages:

1. **Passport List**: https://greenpay.eywademo.cloud/app/passports
   - Should now show all passports from registered vouchers

2. **Passport Reports**: https://greenpay.eywademo.cloud/app/reports/passports
   - Should now show passport statistics and data

3. **Create a new voucher and register passport**:
   - Go to Individual Purchase
   - Create voucher
   - Register with passport
   - Check that passport appears in passport list immediately

---

## Expected Results

### Before Fix
```sql
SELECT COUNT(*) FROM passports;
-- Result: 0 (or very few from corporate vouchers only)

SELECT COUNT(*) FROM individual_purchases WHERE passport_number IS NOT NULL;
-- Result: Many (shows the missing data)
```

### After Migration
```sql
SELECT COUNT(*) FROM passports;
-- Result: Same as count of individual_purchases with passport_number

SELECT COUNT(*) FROM individual_purchases WHERE passport_id IS NOT NULL;
-- Result: All purchases with passports now linked
```

---

## Testing Checklist

After deployment, test:

- [ ] Passport list shows existing passports
- [ ] Passport reports show correct statistics
- [ ] Create new individual purchase voucher
- [ ] Register passport with voucher
- [ ] Verify passport appears in passport list
- [ ] Verify passport appears in passport reports
- [ ] Check individual purchase reports still show passport numbers
- [ ] Check payments list still shows passport numbers
- [ ] Verify no duplicate passports created

---

## Technical Notes

### Database Schema Changes

No schema changes required! The `passports` table and `individual_purchases.passport_id` column already exist in production schema.

### Backward Compatibility

This fix is fully backward compatible:
- Old vouchers will be backfilled by migration
- New vouchers will automatically create passport records
- All existing queries continue to work
- No breaking changes

### Future Improvements

Consider:
1. Add nationality/DOB fields to individual_purchases for better passport data
2. Implement passport deduplication logic (same passport number from different registrations)
3. Add passport verification/validation service
4. Sync passport data updates across all vouchers using same passport

---

## Summary

The fix ensures that:
1. All passport registrations create records in `passports` table
2. Existing passport data is backfilled from `individual_purchases`
3. Passport list and reports show complete data
4. Future passport registrations work correctly

**Status**: Ready for deployment! 🚀
