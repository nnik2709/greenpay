# Phase 1: Multiple Vouchers Generation Fix - READY TO DEPLOY

**Date**: 2026-01-15
**Priority**: CRITICAL
**Status**: Code ready, awaiting deployment and testing

## What Was Fixed

### Fix #1: Generate Correct Number of Vouchers ✅

**Problem**: System only created 1 voucher regardless of quantity purchased

**Root Cause**: Lines 216-260 in `payment-webhook-doku.js` hardcoded single voucher creation

**Solution Implemented**:
- Read `session.quantity` from database (defaults to 1 if not set)
- Loop through quantity to create multiple vouchers
- Each voucher gets unique code via `generateVoucherCode('ONL')`
- Amount split evenly: `session.amount / quantity` per voucher
- All vouchers collected in array for email

**Files Changed**:
- `backend/routes/payment-webhook-doku.js` (lines 216-275)

**Code Changes**:
```javascript
// Before (BROKEN):
const voucherCode = voucherConfig.helpers.generateVoucherCode('ONL');
const voucherResult = await client.query(voucherQuery, voucherValues);
const voucher = voucherResult.rows[0]; // Only 1 voucher

// After (FIXED):
const quantity = session.quantity || 1;
const vouchers = [];

for (let i = 0; i < quantity; i++) {
  const voucherCode = voucherConfig.helpers.generateVoucherCode('ONL');
  const voucherResult = await client.query(voucherQuery, voucherValues);
  vouchers.push(voucherResult.rows[0]); // All vouchers
}
```

---

### Fix #2: Send All Vouchers in Email ✅

**Problem**: Email notification hardcoded `quantity: 1` and only sent 1 voucher

**Root Cause**: Line 294 hardcoded quantity, line 296 only passed single voucher

**Solution Implemented**:
- Use `vouchers.length` for actual quantity
- Pass entire `vouchers` array to notification function
- Return all vouchers from function

**Files Changed**:
- `backend/routes/payment-webhook-doku.js` (lines 296-315)

**Code Changes**:
```javascript
// Before (BROKEN):
sendVoucherNotification({
  customerEmail: session.customer_email,
  customerPhone: null,
  quantity: 1 // ❌ Hardcoded
}, [voucher]); // ❌ Only 1 voucher

return voucher; // ❌ Only 1 voucher

// After (FIXED):
sendVoucherNotification({
  customerEmail: session.customer_email,
  customerPhone: null,
  quantity: vouchers.length // ✅ Actual quantity
}, vouchers); // ✅ All vouchers

return vouchers; // ✅ All vouchers
```

---

## Deployment Instructions

### 1. Upload File via CloudPanel

1. Open CloudPanel File Manager
2. Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`
3. **Backup current file**:
   ```bash
   # Via SSH terminal:
   cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
   cp payment-webhook-doku.js payment-webhook-doku.js.backup-before-multi-voucher
   ```
4. Upload updated `payment-webhook-doku.js` from local repo
5. Verify file size (should be similar, ~15KB)

### 2. Restart Backend

```bash
pm2 restart greenpay-api
```

### 3. Verify Startup

```bash
pm2 logs greenpay-api --lines 20
```

Look for successful startup without errors.

---

## Testing Plan

### Test Case 1: Purchase 1 Voucher (Baseline)

**Steps**:
1. Complete payment for 1 voucher
2. Check logs for voucher generation
3. Verify 1 voucher created in database
4. Verify email contains 1 voucher

**Expected Logs**:
```
[DOKU VOUCHER] Generating 1 voucher(s)
[DOKU VOUCHER] Generating voucher 1 of 1 : ONL-XXXXXXXX
[DOKU VOUCHER] Created voucher: ONL-XXXXXXXX with PENDING status
[DOKU VOUCHER] ✅ Created 1 voucher(s) successfully
[DOKU VOUCHER] Sending email notification to: xxx@xxx.com with 1 voucher(s)
```

**Database Verification**:
```sql
SELECT COUNT(*) as voucher_count
FROM individual_purchases
WHERE purchase_session_id = 'PGKO-XXX';
-- Expected: 1
```

---

### Test Case 2: Purchase 2 Vouchers (CRITICAL TEST)

**Steps**:
1. Complete payment for 2 vouchers
2. Check logs for voucher generation
3. Verify 2 vouchers created with unique codes
4. Verify email contains both vouchers
5. Verify amount split correctly (total/2 per voucher)

**Expected Logs**:
```
[DOKU VOUCHER] Generating 2 voucher(s)
[DOKU VOUCHER] Generating voucher 1 of 2 : ONL-XXXXXXX1
[DOKU VOUCHER] Created voucher: ONL-XXXXXXX1 with PENDING status
[DOKU VOUCHER] Generating voucher 2 of 2 : ONL-XXXXXXX2
[DOKU VOUCHER] Created voucher: ONL-XXXXXXX2 with PENDING status
[DOKU VOUCHER] ✅ Created 2 voucher(s) successfully
[DOKU VOUCHER] Sending email notification to: xxx@xxx.com with 2 voucher(s)
```

**Database Verification**:
```sql
SELECT
  voucher_code,
  amount,
  passport_number,
  status
FROM individual_purchases
WHERE purchase_session_id = 'PGKO-XXX'
ORDER BY created_at;
-- Expected: 2 rows with unique codes, amount split evenly
```

---

### Test Case 3: Purchase 3 Vouchers

**Steps**:
1. Complete payment for 3 vouchers
2. Verify 3 vouchers created
3. Verify all 3 have unique codes
4. Verify amount: total/3 per voucher

**Expected Behavior**:
- 3 unique voucher codes
- Amount evenly split
- All vouchers in single email
- All vouchers linked to same session ID

---

## Monitoring Commands

### Watch Logs in Real-Time

```bash
pm2 logs greenpay-api --lines 200 | grep "DOKU VOUCHER"
```

### Check Recent Vouchers

```sql
SELECT
  voucher_code,
  amount,
  status,
  purchase_session_id,
  created_at
FROM individual_purchases
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;
```

### Verify Multiple Vouchers per Session

```sql
SELECT
  purchase_session_id,
  COUNT(*) as voucher_count,
  SUM(amount) as total_amount,
  STRING_AGG(voucher_code, ', ') as voucher_codes
FROM individual_purchases
WHERE purchase_session_id LIKE 'PGKO-%'
GROUP BY purchase_session_id
HAVING COUNT(*) > 1
ORDER BY MAX(created_at) DESC
LIMIT 5;
```

---

## Rollback Plan

If anything goes wrong:

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
mv payment-webhook-doku.js payment-webhook-doku.js.multi-voucher-failed
mv payment-webhook-doku.js.backup-before-multi-voucher payment-webhook-doku.js
pm2 restart greenpay-api
```

---

## Success Criteria

- ✅ 1 voucher purchase → 1 voucher created
- ✅ 2 voucher purchase → 2 unique vouchers created
- ✅ 3 voucher purchase → 3 unique vouchers created
- ✅ Amount split evenly across all vouchers
- ✅ All vouchers sent in single email
- ✅ All vouchers linked to same session ID
- ✅ No errors in logs
- ✅ Email notification shows correct quantity

---

## What's Next (Phase 2 & 3)

After confirming Phase 1 works:

**Phase 2 (High Priority)**:
1. Add email confirmation field to purchase forms
2. Validate emails match before payment
3. Create voucher retrieval endpoint
4. Create voucher retrieval page

**Phase 3 (Medium Priority)**:
1. Email verification code (optional - adds friction)
2. Database tracking for voucher generation attempts
3. Admin dashboard for manual voucher generation

---

## Notes

- **Backward Compatible**: Single voucher purchases (quantity=1) work exactly as before
- **Default Behavior**: If `quantity` not set in session, defaults to 1
- **Amount Handling**: Total amount split evenly (e.g., K100 for 2 vouchers = K50 each)
- **Email**: All vouchers sent in single email (not separate emails per voucher)
- **Session Linking**: All vouchers share same `purchase_session_id` for tracking

---

**Status**: ✅ READY FOR DEPLOYMENT
**Deployment Time**: 2 minutes
**Testing Time**: 10-15 minutes
**Risk**: LOW (backward compatible, isolated change)
**Financial Impact**: HIGH (fixes underdelivery of paid vouchers)
