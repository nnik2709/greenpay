# BSP DOKU Complete Deployment - Frontend + Backend + Database

**Date**: 2025-12-31
**Status**: Ready to Deploy
**Includes**: All fixes for voucher creation

---

## Files to Deploy

### 1. Frontend (dist folder)
   - Upload entire `dist/` folder to: `/var/www/greenpay/dist/`
   - **Fix included**: `PaymentSuccess.jsx` now accepts `?session=` parameter from BSP redirect

### 2. Backend (webhook handler)
   - Upload: `backend/routes/payment-webhook-doku.js`
   - To: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`
   - **Fix included**: Changed `pool` to `db` for database connection

### 3. Database (SQL migration)
   - Run SQL below to create `payment_gateway_transactions` table

---

## Step 1: Create Database Table

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

CREATE INDEX IF NOT EXISTS idx_payment_gateway_session_id ON payment_gateway_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_status ON payment_gateway_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_created_at ON payment_gateway_transactions(created_at);

\d payment_gateway_transactions
EOF
```

---

## Step 2: Upload Frontend (dist folder)

**Via CloudPanel File Manager:**

1. Navigate to: `/var/www/greenpay/`
2. Delete old `dist/` folder
3. Upload new `dist/` folder from local machine

**OR via command line:**

```bash
# From your local machine
cd /Users/nikolay/github/greenpay
tar -czf dist.tar.gz dist/

# Upload
scp dist.tar.gz root@165.22.52.100:/var/www/greenpay/

# SSH to server and extract
ssh root@165.22.52.100
cd /var/www/greenpay
rm -rf dist
tar -xzf dist.tar.gz
rm dist.tar.gz
ls -lh dist/
```

---

## Step 3: Upload Backend Webhook Handler

**Via CloudPanel File Manager:**

1. Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`
2. Upload: `backend/routes/payment-webhook-doku.js`

---

## Step 4: Restart Backend

```bash
# Verify file uploaded
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
ls -lh payment-webhook-doku.js
echo ""

# Restart PM2
pm2 restart greenpay-api
echo ""

# Check for startup errors
pm2 logs greenpay-api --lines 20 --nostream | grep -i error
```

---

## Step 5: Test Complete Flow

### Make Test Payment

1. Go to: `https://greenpay.eywademo.cloud/public/buy`
2. Enter passport details
3. Click "Pay with Credit Card"
4. Complete payment on BSP DOKU staging page

### Monitor Backend Logs

```bash
pm2 logs greenpay-api --lines 100 | grep DOKU
```

**Expected success logs:**

```
[DOKU NOTIFY] Webhook received at: 2025-12-31...
[DOKU NOTIFY] Signature verified successfully
✅ Connected to PostgreSQL database
[DOKU NOTIFY] ✅ Transaction updated successfully
[DOKU NOTIFY] Payment successful - creating voucher
[DOKU VOUCHER] Starting voucher creation for session: PGKO-xxx
[DOKU VOUCHER] Passport data: ABC123456
[DOKU VOUCHER] Generated voucher code: XXXXXXXX
[DOKU VOUCHER] Created voucher: XXXXXXXX for passport ABC123456
[DOKU VOUCHER] Updated session as completed
[DOKU VOUCHER] Sending email notification to: test@test.com
[DOKU VOUCHER] ✅ Voucher creation completed successfully
[DOKU NOTIFY] ✅ Voucher created successfully: XXXXXXXX
[DOKU NOTIFY] Responding with CONTINUE
```

### Verify Frontend Shows Voucher

- **Before fix:** "Payment not completed" error after 20 seconds
- **After fix:** Voucher displays within 1-2 seconds with barcode

### Check Database

```bash
# Verify voucher created
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay \
  -c "SELECT voucher_code, passport_number, amount, payment_method, customer_email, created_at
      FROM individual_purchases ORDER BY created_at DESC LIMIT 1;"

# Verify transaction recorded
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay \
  -c "SELECT session_id, gateway_name, status, amount, created_at, completed_at
      FROM payment_gateway_transactions ORDER BY created_at DESC LIMIT 1;"
```

---

## What Was Fixed

### Frontend Fix (PaymentSuccess.jsx)

**Problem:** BSP redirect sends `?session=PGKO-xxx` but code expected `?payment_session=`

**Before:**
```javascript
const rawPaymentSessionId = searchParams.get('payment_session') || sessionStorage.getItem('paymentSessionId');
```

**After:**
```javascript
const rawPaymentSessionId = searchParams.get('payment_session') || searchParams.get('session') || sessionStorage.getItem('paymentSessionId');
```

### Backend Fix (payment-webhook-doku.js)

**Problem:** `pool.connect is not a function`

**Before:**
```javascript
const pool = require('../config/database');
const client = await pool.connect();
await pool.query(...);
```

**After:**
```javascript
const db = require('../config/database');
const client = await db.getClient();
await db.query(...);
```

### Database Fix

**Problem:** Table `payment_gateway_transactions` did not exist

**Solution:** Created table with Step 1 SQL

---

## Success Checklist

After deployment, verify:

- [ ] **Database table exists:** `\d payment_gateway_transactions` shows table structure
- [ ] **Frontend uploaded:** Visit `https://greenpay.eywademo.cloud/` shows updated app
- [ ] **Backend restarted:** `pm2 status` shows `greenpay-api` online
- [ ] **No startup errors:** `pm2 logs greenpay-api --err` shows no errors
- [ ] **Test payment successful:** Complete BSP DOKU test payment
- [ ] **Webhook received:** Logs show `[DOKU NOTIFY] Webhook received`
- [ ] **Voucher created:** Logs show `[DOKU VOUCHER] ✅ Voucher creation completed`
- [ ] **Success page works:** Shows voucher within 1-2 seconds (no timeout)
- [ ] **Database updated:** `individual_purchases` has new voucher record
- [ ] **Email sent:** Customer receives voucher email

---

## Troubleshooting

### Error: "relation payment_gateway_transactions does not exist"
**Solution:** Run Step 1 SQL to create table

### Error: "pool.connect is not a function"
**Solution:** Re-upload `payment-webhook-doku.js` and restart PM2

### Error: "Payment not completed" on success page
**Causes:**
1. Frontend not updated → Upload dist folder again
2. Webhook not creating voucher → Check backend logs
3. Session ID mismatch → Check URL has `?session=PGKO-xxx`

### Success page still shows timeout
**Solution:** Hard refresh browser (Cmd+Shift+R) to clear cache

---

## Quick Commands Summary

```bash
# Step 1: Create database table
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay < create-table.sql

# Step 2: Upload files via CloudPanel UI

# Step 3: Restart backend
pm2 restart greenpay-api

# Step 4: Monitor logs
pm2 logs greenpay-api --lines 100 | grep DOKU

# Step 5: Verify database
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay \
  -c "SELECT * FROM individual_purchases ORDER BY created_at DESC LIMIT 1;"
```

---

**Deployment Complete!** 🚀

Test payment should now create voucher immediately and display on success page within 1-2 seconds.
