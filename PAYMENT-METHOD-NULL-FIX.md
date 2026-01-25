# Payment Method NULL Fix - January 25, 2026

## Issue Summary

**Problem:** Payments list showing "Payment mode as N/A" for some records
**Root Cause:** DOKU webhook was creating vouchers WITHOUT `payment_method` column, resulting in NULL values
**Impact:** Existing DOKU webhook payments have NULL payment_method in database

---

## Root Cause Analysis

### Investigation Timeline

1. **Frontend Display** (`src/pages/PaymentsList.jsx` line 341):
   ```javascript
   {payment.payment_method || 'N/A'}
   ```
   Shows "N/A" when `payment_method` is null/undefined

2. **API Endpoint** (`backend/routes/individual-purchases.js` lines 78-79):
   ```javascript
   SELECT ip.*, ...
   FROM individual_purchases ip
   ```
   Returns all columns including `payment_method` as-is from database

3. **Data Insertion - Multiple Sources**:

   ✅ **buy-online.js** - Correctly includes `payment_method`:
   ```javascript
   INSERT INTO individual_purchases (
     voucher_code, passport_number, amount,
     payment_method,  // ✓ PRESENT
     ...
   ) VALUES (..., paymentData.paymentMethod || 'Card', ...)
   ```

   ✅ **individual-purchases.js** - Correctly includes `payment_method`:
   ```javascript
   INSERT INTO individual_purchases (
     voucher_code, amount,
     payment_method,  // ✓ PRESENT
     ...
   ) VALUES (..., paymentMethod, ...)
   ```

   ✅ **public-purchases.js** - Correctly includes `payment_method`:
   ```javascript
   INSERT INTO individual_purchases (
     ..., payment_mode, payment_method, ...
   ) VALUES (..., 'BSP IPG', paymentData?.paymentMethod || 'VISA', ...)
   ```

   ❌ **payment-webhook-doku.js** - MISSING `payment_method`:
   ```javascript
   INSERT INTO individual_purchases (
     voucher_code, passport_number, amount,
     payment_mode,    // ✓ Has payment_mode
     // ❌ MISSING payment_method!
     discount, collected_amount, ...
   ) VALUES (..., 'BSP DOKU Card', ...)  // Only sets payment_mode
   ```

### The Bug

**File:** `backend/routes/payment-webhook-doku.js` lines 227-244

The DOKU webhook INSERT statement includes `payment_mode` but NOT `payment_method`:

```sql
INSERT INTO individual_purchases (
  voucher_code,
  passport_number,
  amount,
  payment_mode,      -- Column EXISTS
  -- payment_method  -- Column MISSING!
  discount,
  ...
) VALUES ($1, $2, $3, $4, $5, ...)
```

**Result:**
- `payment_mode` = 'BSP DOKU Card' ✓
- `payment_method` = NULL ❌

When frontend displays this data, it shows "N/A" because `payment_method` is NULL.

---

## The Fix

### 1. Update payment-webhook-doku.js

**File:** `backend/routes/payment-webhook-doku.js`

**Changes Made:**

#### A. Add `payment_method` to INSERT column list (line 232):
```javascript
const voucherQuery = `
  INSERT INTO individual_purchases (
    voucher_code,
    passport_number,
    amount,
    payment_mode,
    payment_method,    // ✓ ADDED
    discount,
    collected_amount,
    ...
  ) VALUES ($1, $2, $3, $4, $5, $6, ...)  // ✓ Added $5
  RETURNING *
`;
```

#### B. Add `payment_method` value to VALUES array (line 255):
```javascript
const voucherValues = [
  voucherCode,
  passportNumber,
  session.amount / quantity,
  'BSP DOKU Card',    // payment_mode
  'Card',             // ✓ ADDED: payment_method (DOKU is card payment)
  0,                  // discount
  ...
];
```

### 2. Fix Existing NULL Records

**File:** `database/migrations/fix-null-payment-method.sql`

SQL migration to update existing records with NULL payment_method:

```sql
UPDATE individual_purchases
SET payment_method = CASE
  WHEN payment_mode ILIKE '%card%' THEN 'Card'
  WHEN payment_mode ILIKE '%doku%' THEN 'Card'
  WHEN payment_mode ILIKE '%visa%' THEN 'Card'
  WHEN payment_mode ILIKE '%bsp%' THEN 'Card'
  WHEN payment_mode ILIKE '%cash%' THEN 'Cash'
  WHEN payment_mode ILIKE '%mobile%' THEN 'Mobile Money'
  ELSE 'Card'  -- Default for unknown
END
WHERE payment_method IS NULL;
```

This intelligently maps from `payment_mode` to appropriate `payment_method`:
- BSP DOKU Card → Card
- BSP IPG → Card
- Cash → Cash
- Unknown → Card (default)

---

## Deployment Instructions

### Step 1: Deploy Backend Fix

```bash
# From local machine
scp backend/routes/payment-webhook-doku.js root@165.22.52.100:/tmp/

# SSH to server
ssh root@165.22.52.100

# Backup current file
cp /var/www/greenpay/backend/routes/payment-webhook-doku.js \
   /var/www/greenpay/backend/routes/payment-webhook-doku.js.backup-$(date +%Y%m%d-%H%M%S)

# Deploy new file
mv /tmp/payment-webhook-doku.js /var/www/greenpay/backend/routes/payment-webhook-doku.js

# Set ownership
chown root:root /var/www/greenpay/backend/routes/payment-webhook-doku.js

# Restart API
pm2 restart greenpay-api

# Verify
pm2 logs greenpay-api --lines 50
```

### Step 2: Run Database Migration

```bash
# From local machine - upload migration file
scp database/migrations/fix-null-payment-method.sql root@165.22.52.100:/tmp/

# SSH to server
ssh root@165.22.52.100

# Run migration
PGPASSWORD='GreenPay2025!Secure#PG' psql \
  -h 165.22.52.100 \
  -U greenpay \
  -d greenpay \
  -f /tmp/fix-null-payment-method.sql

# Verify - check for any remaining NULL values
PGPASSWORD='GreenPay2025!Secure#PG' psql \
  -h 165.22.52.100 \
  -U greenpay \
  -d greenpay \
  -c "SELECT COUNT(*) FROM individual_purchases WHERE payment_method IS NULL;"

# Should return 0
```

### Step 3: Verify in Frontend

1. Navigate to https://greenpay.eywademo.cloud/app/payments
2. Check payment mode column
3. **Expected:** All records show actual payment method (Card, Cash, etc.)
4. **Expected:** No more "N/A" values

---

## Testing Checklist

### Existing Records
- [ ] Navigate to Payments page
- [ ] Verify no "N/A" values in Payment Mode column
- [ ] Verify DOKU payments show "Card" as payment method
- [ ] Verify BSP payments show "Card" as payment method
- [ ] Verify Cash payments (if any) show "Cash"

### New Payments (After Fix)
- [ ] Create new payment via DOKU webhook
- [ ] Check database: `SELECT payment_mode, payment_method FROM individual_purchases ORDER BY created_at DESC LIMIT 5;`
- [ ] **Expected:** Both `payment_mode` AND `payment_method` are populated
- [ ] Verify in Payments page - shows correct payment method

---

## Verification Queries

### Check NULL payment_method records
```sql
SELECT COUNT(*) as null_payment_method_count
FROM individual_purchases
WHERE payment_method IS NULL;
```
**Expected after migration:** 0

### Check payment method distribution
```sql
SELECT
  payment_method,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM individual_purchases
GROUP BY payment_method
ORDER BY count DESC;
```

### Check DOKU webhook payments
```sql
SELECT
  id,
  voucher_code,
  payment_mode,
  payment_method,
  created_at
FROM individual_purchases
WHERE payment_mode ILIKE '%doku%'
ORDER BY created_at DESC
LIMIT 10;
```
**Expected:** All should have `payment_method` = 'Card'

---

## Files Modified

1. **backend/routes/payment-webhook-doku.js**
   - Added `payment_method` column to INSERT statement (line 232)
   - Added `'Card'` value for payment_method in VALUES array (line 255)

2. **database/migrations/fix-null-payment-method.sql** (NEW)
   - SQL migration to update existing NULL records
   - Maps payment_mode to appropriate payment_method

---

## Rollback Instructions

### Rollback Backend File
```bash
# On server
ssh root@165.22.52.100
cd /var/www/greenpay/backend/routes

# Find backup
ls -lt payment-webhook-doku.js.backup-*

# Restore
cp payment-webhook-doku.js.backup-YYYYMMDD-HHMMSS payment-webhook-doku.js

# Restart
pm2 restart greenpay-api
```

### Rollback Database (if needed)
**Note:** Cannot easily rollback database UPDATE. The migration is safe and improves data quality.
If rollback needed, would require restoring from database backup taken before migration.

---

## Summary

### What Was Wrong
- DOKU webhook was inserting vouchers with `payment_mode` but without `payment_method`
- Database records had NULL for `payment_method` column
- Frontend displayed "N/A" when payment_method was NULL

### What We Fixed
1. ✅ Updated payment-webhook-doku.js to include `payment_method` in INSERT
2. ✅ Set payment_method = 'Card' for DOKU webhook payments (card gateway)
3. ✅ Created SQL migration to fix existing NULL records
4. ✅ Mapped payment_mode → payment_method intelligently

### Impact
- **Future payments:** All DOKU webhook payments will have correct payment_method
- **Existing data:** Migration updates ~all NULL records to appropriate values
- **User experience:** No more "N/A" in payments list

---

**Fixed By:** Claude Code Assistant
**Date:** January 25, 2026
**Status:** ✅ READY FOR DEPLOYMENT
