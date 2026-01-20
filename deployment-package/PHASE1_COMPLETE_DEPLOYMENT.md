# Phase 1: Complete Deployment Guide

**Date**: 2026-01-15
**Status**: Ready for Deployment
**Priority**: CRITICAL

---

## What Was Built

Phase 1 implements three critical fixes for the multiple voucher system:

### 1. Multiple Voucher Generation ✅
- Webhook now generates correct number of vouchers based on `session.quantity`
- Each voucher gets unique code
- Amount split evenly across all vouchers
- All vouchers sent in single email

### 2. Voucher Generation Tracking ✅
- Database columns added to track voucher generation status
- Prevents lost vouchers from failed generation
- Enables recovery and monitoring

### 3. Voucher Retrieval System ✅
- Safety net endpoint for customers
- Email verification required (security)
- Automatic recovery if vouchers failed to generate
- Rate limiting to prevent abuse

---

## Files to Deploy

### Backend Files (Manual Upload via CloudPanel)

**Path**: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/`

1. **`routes/payment-webhook-doku.js`** (Modified)
   - Lines 216-275: Multiple voucher generation loop
   - Lines 296-315: Send all vouchers in email
   - Line 511: Export `createVoucherFromPayment` function

2. **`routes/voucher-retrieval.js`** (NEW FILE)
   - Voucher retrieval endpoint with security
   - Rate limiting (5 attempts per 5 minutes per IP+email)
   - Automatic voucher recovery for failed generation

3. **`server.js`** (Modified)
   - Line 54: Import voucher retrieval routes
   - Line 76: Register `/api/voucher-retrieval` endpoint

---

## Database Migration

Run this SQL in production database **BEFORE** deploying backend files:

```sql
-- Add voucher generation tracking columns
ALTER TABLE purchase_sessions
ADD COLUMN IF NOT EXISTS vouchers_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS vouchers_generation_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_generation_attempt TIMESTAMP;

-- Add comments for documentation
COMMENT ON COLUMN purchase_sessions.vouchers_generated IS 'TRUE if vouchers were successfully generated for this session';
COMMENT ON COLUMN purchase_sessions.vouchers_generation_attempts IS 'Number of times voucher generation was attempted';
COMMENT ON COLUMN purchase_sessions.last_generation_attempt IS 'Timestamp of last voucher generation attempt';

-- Create index for quick lookup of failed generations
CREATE INDEX IF NOT EXISTS idx_sessions_payment_success_vouchers_failed
ON purchase_sessions(payment_status, vouchers_generated)
WHERE payment_status = 'completed' AND vouchers_generated = FALSE;

-- Verify columns created
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'purchase_sessions'
AND column_name IN ('vouchers_generated', 'vouchers_generation_attempts', 'last_generation_attempt')
ORDER BY ordinal_position;
```

**Expected Output**:
```
column_name                    | data_type | is_nullable | column_default
-------------------------------|-----------+-------------+---------------
vouchers_generated             | boolean   | YES         | false
vouchers_generation_attempts   | integer   | YES         | 0
last_generation_attempt        | timestamp | YES         | NULL
```

---

## Deployment Steps

### Step 1: Database Migration

```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -f /Users/nikolay/github/greenpay/database/migrations/add-voucher-generation-tracking.sql
```

Verify migration succeeded:
```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -c "\d purchase_sessions" | grep vouchers
```

---

### Step 2: Backup Current Files (SSH Terminal)

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

# Backup webhook file
cp payment-webhook-doku.js payment-webhook-doku.js.backup-phase1-$(date +%Y%m%d)

# Backup server.js
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
cp server.js server.js.backup-phase1-$(date +%Y%m%d)

# List backups
ls -lh *.backup-phase1-*
ls -lh routes/*.backup-phase1-*
```

---

### Step 3: Upload Files via CloudPanel

**IMPORTANT**: Use CloudPanel File Manager to upload these files:

1. **Upload `payment-webhook-doku.js`**
   - Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`
   - Upload from: `/Users/nikolay/github/greenpay/backend/routes/payment-webhook-doku.js`
   - Overwrite existing file

2. **Upload `voucher-retrieval.js`** (NEW)
   - Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`
   - Upload from: `/Users/nikolay/github/greenpay/backend/routes/voucher-retrieval.js`
   - This is a NEW file

3. **Upload `server.js`**
   - Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/`
   - Upload from: `/Users/nikolay/github/greenpay/backend/server.js`
   - Overwrite existing file

---

### Step 4: Verify Uploads (SSH Terminal)

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/

# Check files exist and are recent
ls -lh routes/payment-webhook-doku.js
ls -lh routes/voucher-retrieval.js
ls -lh server.js

# Verify voucher retrieval file exists
[ -f routes/voucher-retrieval.js ] && echo "✅ voucher-retrieval.js exists" || echo "❌ voucher-retrieval.js missing"

# Verify webhook exports function (should show line with createVoucherFromPayment)
grep -n "createVoucherFromPayment" routes/payment-webhook-doku.js | tail -1

# Verify server.js includes voucher retrieval route
grep -n "voucher-retrieval" server.js
```

**Expected Output**:
```
✅ voucher-retrieval.js exists
511:module.exports.createVoucherFromPayment = createVoucherFromPayment;
54:const voucherRetrievalRoutes = require('./routes/voucher-retrieval');
76:app.use('/api/voucher-retrieval', voucherRetrievalRoutes);
```

---

### Step 5: Restart Backend (SSH Terminal)

```bash
pm2 restart greenpay-api
```

---

### Step 6: Monitor Startup (SSH Terminal)

```bash
pm2 logs greenpay-api --lines 30
```

**Expected Output**:
```
PNG Green Fees System - Backend API
  Version: 1.0.0
  Environment: production
✅ Connected to PostgreSQL database
🚀 Server running on port 5000
```

**If you see errors**, check:
```bash
# Check for syntax errors
pm2 logs greenpay-api --err --lines 50

# Check process status
pm2 describe greenpay-api
```

---

## Testing Phase 1

### Test 1: Single Voucher Purchase (Baseline)

**Steps**:
1. Complete BSP DOKU payment for 1 voucher (K50)
2. Monitor logs
3. Check database
4. Verify email

**Monitor Logs**:
```bash
pm2 logs greenpay-api --lines 100 | grep "DOKU VOUCHER"
```

**Expected Logs**:
```
[DOKU VOUCHER] Generating 1 voucher(s)
[DOKU VOUCHER] Generating voucher 1 of 1 : ONL-XXXXXXXX
[DOKU VOUCHER] Created voucher: ONL-XXXXXXXX with PENDING status
[DOKU VOUCHER] ✅ Created 1 voucher(s) successfully
[DOKU VOUCHER] Sending email notification to: customer@example.com with 1 voucher(s)
```

**Database Check**:
```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -c "
SELECT
  voucher_code,
  amount,
  status,
  purchase_session_id
FROM individual_purchases
WHERE purchase_session_id = 'PGKO-XXX-XXX';
"
```

**Expected**: 1 row with `amount = 50.00`

---

### Test 2: Multiple Voucher Purchase (CRITICAL)

**Steps**:
1. Complete BSP DOKU payment for 2 vouchers (K100 total)
2. Monitor logs
3. Check database
4. Verify email contains 2 vouchers

**Monitor Logs**:
```bash
pm2 logs greenpay-api --lines 100 | grep "DOKU VOUCHER"
```

**Expected Logs**:
```
[DOKU VOUCHER] Generating 2 voucher(s)
[DOKU VOUCHER] Generating voucher 1 of 2 : ONL-XXXXXXX1
[DOKU VOUCHER] Created voucher: ONL-XXXXXXX1 with PENDING status
[DOKU VOUCHER] Generating voucher 2 of 2 : ONL-XXXXXXX2
[DOKU VOUCHER] Created voucher: ONL-XXXXXXX2 with PENDING status
[DOKU VOUCHER] ✅ Created 2 voucher(s) successfully
[DOKU VOUCHER] Sending email notification to: customer@example.com with 2 voucher(s)
```

**Database Check**:
```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -c "
SELECT
  voucher_code,
  amount,
  status,
  purchase_session_id,
  created_at
FROM individual_purchases
WHERE purchase_session_id = 'PGKO-XXX-XXX'
ORDER BY created_at;
"
```

**Expected**:
- 2 rows
- Both with unique voucher codes
- `amount = 50.00` for each (100 / 2)
- Same `purchase_session_id`

---

### Test 3: Voucher Retrieval (Safety Net)

**Test Successful Retrieval**:

```bash
curl -X POST https://greenpay.eywademo.cloud/api/voucher-retrieval/retrieve \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "PGKO-XXX-XXX",
    "email": "customer@example.com"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Vouchers retrieved successfully",
  "vouchers": [
    {
      "voucher_code": "ONL-XXXXXXX1",
      "amount": "50.00",
      "status": "pending_passport",
      ...
    },
    {
      "voucher_code": "ONL-XXXXXXX2",
      "amount": "50.00",
      "status": "pending_passport",
      ...
    }
  ],
  "recovered": false,
  "emailSent": true
}
```

**Test Email Mismatch (Security)**:
```bash
curl -X POST https://greenpay.eywademo.cloud/api/voucher-retrieval/retrieve \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "PGKO-XXX-XXX",
    "email": "wrong@example.com"
  }'
```

**Expected Response**:
```json
{
  "success": false,
  "error": "Email address does not match the payment session."
}
```

**Test Rate Limiting**:
```bash
# Try 6 times rapidly with wrong email
for i in {1..6}; do
  curl -X POST https://greenpay.eywademo.cloud/api/voucher-retrieval/retrieve \
    -H "Content-Type: application/json" \
    -d '{"sessionId": "PGKO-XXX-XXX", "email": "wrong@example.com"}'
  echo ""
done
```

**Expected**: First 5 fail with 403, 6th fails with 429 (rate limit)

---

## Monitoring Commands

### Watch Logs During Testing

```bash
# Watch all DOKU VOUCHER logs
pm2 logs greenpay-api --lines 200 | grep "DOKU VOUCHER"

# Watch voucher retrieval logs
pm2 logs greenpay-api --lines 200 | grep "VOUCHER RETRIEVAL"
```

### Check Recent Vouchers

```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -c "
SELECT
  voucher_code,
  amount,
  status,
  purchase_session_id,
  customer_email,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created
FROM individual_purchases
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;
"
```

### Check Sessions with Multiple Vouchers

```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -c "
SELECT
  purchase_session_id,
  COUNT(*) as voucher_count,
  SUM(amount) as total_amount,
  STRING_AGG(voucher_code, ', ') as voucher_codes,
  MAX(customer_email) as customer_email
FROM individual_purchases
WHERE purchase_session_id LIKE 'PGKO-%'
GROUP BY purchase_session_id
HAVING COUNT(*) > 1
ORDER BY MAX(created_at) DESC
LIMIT 10;
"
```

### Check Failed Voucher Generations

```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -c "
SELECT
  id,
  customer_email,
  payment_status,
  vouchers_generated,
  vouchers_generation_attempts,
  last_generation_attempt,
  created_at
FROM purchase_sessions
WHERE payment_status = 'completed'
AND (vouchers_generated = FALSE OR vouchers_generated IS NULL)
ORDER BY created_at DESC
LIMIT 10;
"
```

---

## Rollback Plan

If anything goes wrong:

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/

# Restore webhook file
cp routes/payment-webhook-doku.js routes/payment-webhook-doku.js.phase1-failed
cp routes/payment-webhook-doku.js.backup-phase1-$(date +%Y%m%d) routes/payment-webhook-doku.js

# Remove voucher retrieval file
rm routes/voucher-retrieval.js

# Restore server.js
cp server.js server.js.phase1-failed
cp server.js.backup-phase1-$(date +%Y%m%d) server.js

# Restart backend
pm2 restart greenpay-api

# Verify rollback
pm2 logs greenpay-api --lines 20
```

**Database Rollback** (if needed):
```sql
-- Remove tracking columns
ALTER TABLE purchase_sessions
DROP COLUMN IF EXISTS vouchers_generated,
DROP COLUMN IF EXISTS vouchers_generation_attempts,
DROP COLUMN IF EXISTS last_generation_attempt;

-- Remove index
DROP INDEX IF EXISTS idx_sessions_payment_success_vouchers_failed;
```

---

## Success Criteria

- ✅ 1 voucher purchase → 1 voucher created
- ✅ 2 voucher purchase → 2 unique vouchers created
- ✅ 3 voucher purchase → 3 unique vouchers created
- ✅ Amount split correctly (e.g., K100 / 2 = K50 each)
- ✅ All vouchers sent in single email
- ✅ All vouchers linked to same `purchase_session_id`
- ✅ Email shows correct quantity
- ✅ Voucher retrieval endpoint accessible
- ✅ Email verification blocks wrong emails
- ✅ Rate limiting prevents abuse
- ✅ No errors in logs

---

## What's Next (Phase 2)

After Phase 1 is confirmed working:

1. **Email Confirmation Field** - Add "Confirm Email" to purchase forms
2. **Email Validation** - Validate emails match before payment
3. **Frontend Voucher Retrieval Page** - React page at `/retrieve-vouchers`
4. **Link in Emails** - Add "Retrieve Vouchers" link in email footer

**See**: `CRITICAL_VOUCHER_ISSUES.md` for complete Phase 2 & 3 plans

---

**Status**: ✅ PHASE 1 COMPLETE - READY FOR DEPLOYMENT
**Deployment Time**: 5-10 minutes
**Testing Time**: 15-20 minutes
**Risk**: LOW (backward compatible, isolated changes)
**Business Impact**: CRITICAL (fixes voucher quantity bug)
