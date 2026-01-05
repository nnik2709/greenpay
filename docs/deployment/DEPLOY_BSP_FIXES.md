# BSP DOKU Webhook - Complete Deployment (Fixes Included)

**Date**: 2025-12-31
**Critical Fixes**: Database table + pool.connect error

---

## Files to Deploy

**1. Backend webhook handler (FIXED):**
   - Local: `backend/routes/payment-webhook-doku.js`
   - Server: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`

---

## Step 1: Create Missing Database Table

**Run this SQL first:**

```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay << 'EOF'
CREATE TABLE IF NOT EXISTS payment_gateway_transactions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  gateway_name VARCHAR(50) NOT NULL,
  gateway_session_id VARCHAR(255),
  customer_email VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'PGK',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  gateway_response JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_gateway_session_id
  ON payment_gateway_transactions(session_id);

CREATE INDEX IF NOT EXISTS idx_payment_gateway_status
  ON payment_gateway_transactions(status);

CREATE INDEX IF NOT EXISTS idx_payment_gateway_created_at
  ON payment_gateway_transactions(created_at);

-- Verify table created
\d payment_gateway_transactions
EOF
```

**Expected output:**
```
CREATE TABLE
CREATE INDEX
CREATE INDEX
CREATE INDEX
                         Table "public.payment_gateway_transactions"
       Column        |          Type          | Collation | Nullable |         Default
---------------------+------------------------+-----------+----------+---------------------------
 id                  | integer                |           | not null | nextval('...'::regclass)
 session_id          | character varying(255) |           | not null |
 gateway_name        | character varying(50)  |           | not null |
 ...
```

---

## Step 2: Upload Fixed Webhook File

**Via CloudPanel File Manager:**

1. Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`
2. Upload: `backend/routes/payment-webhook-doku.js`

**What was fixed in this file:**
- ❌ Was: `const pool = require('../config/database');`
- ✅ Now: `const db = require('../config/database');`
- ❌ Was: `const client = await pool.connect();`
- ✅ Now: `const client = await db.getClient();`
- ❌ Was: `await pool.query(...)`
- ✅ Now: `await db.query(...)`

---

## Step 3: Restart Backend

```bash
# Verify file uploaded
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
ls -lh payment-webhook-doku.js
echo ""

# Restart PM2
pm2 restart greenpay-api
echo ""

# Watch for errors
pm2 logs greenpay-api --lines 20 --nostream | grep -i error
```

---

## Step 4: Test Payment

Make a test payment at: `https://greenpay.eywademo.cloud/public/buy`

**Monitor logs:**
```bash
pm2 logs greenpay-api --lines 100 | grep DOKU
```

**Expected logs (SUCCESSFUL):**
```
[DOKU NOTIFY] Webhook received
[DOKU NOTIFY] Signature verified successfully
✅ Connected to PostgreSQL database
[DOKU NOTIFY] ✅ Transaction updated successfully
[DOKU NOTIFY] Payment successful - creating voucher
[DOKU VOUCHER] Starting voucher creation for session: PGKO-xxx
[DOKU VOUCHER] Passport data: ABC123456
[DOKU VOUCHER] Generated voucher code: XXXXXXXX
[DOKU VOUCHER] Created voucher: XXXXXXXX
[DOKU VOUCHER] Updated session as completed
[DOKU VOUCHER] Sending email notification
[DOKU VOUCHER] ✅ Voucher creation completed successfully
[DOKU NOTIFY] ✅ Voucher created successfully: XXXXXXXX
[DOKU NOTIFY] Responding with CONTINUE
```

**If you see these errors, deployment failed:**
```
❌ relation "payment_gateway_transactions" does not exist
   → Run Step 1 SQL script

❌ pool.connect is not a function
   → Re-upload payment-webhook-doku.js and restart PM2
```

---

## Step 5: Verify Voucher Created

```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay \
  -c "SELECT voucher_code, passport_number, amount, payment_method, customer_email, created_at
      FROM individual_purchases
      ORDER BY created_at DESC LIMIT 1;"
```

**Expected output:**
```
 voucher_code | passport_number | amount | payment_method  | customer_email | created_at
--------------+-----------------+--------+-----------------+----------------+------------
 XXXXXXXX     | ABC123456       |  50.00 | BSP DOKU Card   | test@test.com  | 2025-12-31...
```

---

## Errors Fixed

### Error 1: Table Missing
```
[DOKU NOTIFY] ❌ Database update error: relation "payment_gateway_transactions" does not exist
[DOKU NOTIFY] SQL State: 42P01
```
**Fix:** Created table in Step 1

### Error 2: pool.connect Not a Function
```
[DOKU NOTIFY] ❌ Voucher creation failed: pool.connect is not a function
```
**Fix:** Changed `pool` to `db` and used `db.getClient()` instead of `pool.connect()`

---

## Quick Deployment Checklist

- [ ] Step 1: Run SQL to create `payment_gateway_transactions` table
- [ ] Step 2: Upload `payment-webhook-doku.js` via CloudPanel
- [ ] Step 3: Restart PM2: `pm2 restart greenpay-api`
- [ ] Step 4: Make test payment
- [ ] Step 5: Check logs for `[DOKU VOUCHER] ✅ Voucher creation completed successfully`
- [ ] Step 6: Verify voucher in database
- [ ] Step 7: Confirm success page shows voucher immediately (1-2 seconds)

---

## Success Criteria

✅ No database errors in logs
✅ Voucher created in `individual_purchases` table
✅ Passport created in `passports` table (if new)
✅ Transaction status updated in `payment_gateway_transactions`
✅ Purchase session marked as completed
✅ Email sent to customer
✅ Success page shows voucher immediately (no timeout)

---

**Ready to deploy!**

1. Run Step 1 SQL
2. Upload file
3. Restart PM2
4. Test payment
