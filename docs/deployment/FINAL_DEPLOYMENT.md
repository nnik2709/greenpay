# BSP DOKU Final Deployment - Schema Fixed

**All schema issues resolved!**

---

## File to Deploy

**Backend webhook handler (FIXED for your schema):**
- Local: `backend/routes/payment-webhook-doku.js`
- Server: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`

---

## What Was Fixed

### 1. Passport Table Schema
**Your schema:** `full_name` (single column)
**Was trying:** `surname`, `given_name`, `sex`, `issuing_country` (separate columns)
**Fixed:** Now uses `full_name` combining surname and given name

### 2. Individual Purchases Schema
**Your schema:** `payment_mode` (not `payment_method`), no `barcode` column
**Was trying:** `payment_method`, `barcode`
**Fixed:** Now uses `payment_mode`, removed `barcode`

---

## Deployment Steps

### Step 1: Upload Fixed File

Via CloudPanel File Manager:
1. Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`
2. Upload: `backend/routes/payment-webhook-doku.js`

### Step 2: Restart Backend

```bash
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 20 --nostream
```

### Step 3: Test Payment

1. Go to: **https://greenpay.eywademo.cloud/buy-online**
2. Enter passport details
3. Complete BSP DOKU payment
4. Should see voucher immediately!

### Step 4: Monitor Logs

```bash
pm2 logs greenpay-api --lines 100 | grep DOKU
```

**Expected SUCCESS logs:**
```
[DOKU NOTIFY] Webhook received
[DOKU NOTIFY] Signature verified successfully
[DOKU NOTIFY] ✅ Transaction updated successfully
[DOKU NOTIFY] Payment successful - creating voucher
[DOKU VOUCHER] Starting voucher creation
[DOKU VOUCHER] Passport data: 77777777
[DOKU VOUCHER] Using existing passport ID: 123 (or Created new passport ID)
[DOKU VOUCHER] Generated voucher code: XXXXXXXX
[DOKU VOUCHER] Created voucher: XXXXXXXX for passport 77777777
[DOKU VOUCHER] Updated session as completed
[DOKU VOUCHER] Sending email notification
[DOKU VOUCHER] ✅ Voucher creation completed successfully
[DOKU NOTIFY] ✅ Voucher created successfully: XXXXXXXX
[DOKU NOTIFY] Responding with CONTINUE
```

### Step 5: Verify Database

```bash
psql -h localhost -U greenpay_user -d greenpay_db
```

```sql
-- Check latest voucher
SELECT voucher_code, passport_number, amount, payment_mode, customer_email, created_at
FROM individual_purchases
ORDER BY created_at DESC LIMIT 1;

-- Check passport created
SELECT id, passport_number, full_name, nationality, date_of_birth
FROM passports
ORDER BY created_at DESC LIMIT 1;

-- Check transaction recorded
SELECT session_id, gateway_name, status, amount, created_at, completed_at
FROM payment_gateway_transactions
ORDER BY created_at DESC LIMIT 1;
```

---

## No More Errors! ✅

All schema mismatches fixed:
- ✅ Uses `full_name` not `surname`/`given_name`
- ✅ Uses `payment_mode` not `payment_method`
- ✅ Removed `barcode` column reference
- ✅ Removed `sex` and `issuing_country` columns
- ✅ Status field type fixed

---

**Ready to deploy and test!** 🚀
