# Phase 2 Deployment - Buy Online with Atomic Passport+Voucher Creation

**Date:** December 10, 2025
**Status:** ✅ Ready to Deploy
**Build:** Production (600.99 kB, gzip: 189.08 kB)

---

## 🎯 What This Implements

**Passport Data → Payment → Atomic Creation Flow**

```
User enters passport → Backend stores in session → Payment gateway →
Webhook creates passport + voucher ATOMICALLY → Email sent
```

**Key Features:**
- ✅ Passport data collected upfront
- ✅ Stored securely in database session (30-min expiry)
- ✅ Atomic transaction: both passport + voucher created or both fail
- ✅ Payment failure = no data persisted (GDPR compliant)
- ✅ Idempotency protection (no duplicate processing)
- ✅ Session management with automatic cleanup

---

## 📦 Files to Deploy

### 1. Frontend (dist/)
```
dist/
```
**Deploy to:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/`

### 2. Backend Files (3 files)

**File 1:** `backend/routes/buy-online.js` (NEW)
**Deploy to:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`

**File 2:** `backend/routes/public-purchases.js` (MODIFIED)
**Deploy to:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`

**File 3:** `backend/server.js` (MODIFIED)
**Deploy to:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/`

### 3. Database Migration (1 SQL file)

**File:** `backend/migrations/add-passport-data-to-sessions.sql`

---

## 🗄️ SQL Queries to Execute

**Connect to database:**
```bash
ssh root@72.61.208.79
psql -U postgres -d greenpay
# Or with password:
# PGPASSWORD='GreenPay2025!Secure#PG' psql -U postgres -d greenpay
```

**Execute migration:**
```sql
-- Add passport_data column to purchase_sessions
ALTER TABLE purchase_sessions
  ADD COLUMN IF NOT EXISTS passport_data JSONB;

-- Add index for passport data queries
CREATE INDEX IF NOT EXISTS idx_purchase_sessions_passport_data
  ON purchase_sessions USING GIN (passport_data);

-- Add column to track if passport was created
ALTER TABLE purchase_sessions
  ADD COLUMN IF NOT EXISTS passport_created BOOLEAN DEFAULT FALSE;

-- Comments
COMMENT ON COLUMN purchase_sessions.passport_data IS 'Passport information for voucher registration (JSONB): {passport_number, surname, given_name, nationality, dob, sex}';
COMMENT ON COLUMN purchase_sessions.passport_created IS 'Whether passport record was created during webhook processing';
```

**Verify migration:**
```sql
-- Check columns exist
\d purchase_sessions

-- Should see:
-- passport_data     | jsonb                   |
-- passport_created  | boolean                 | default false
```

---

## 📋 Deployment Steps

### Step 1: Database Migration

```bash
ssh root@72.61.208.79

# Execute SQL migration
psql -U postgres -d greenpay -f /path/to/add-passport-data-to-sessions.sql

# Or manually:
psql -U postgres -d greenpay << 'EOF'
ALTER TABLE purchase_sessions ADD COLUMN IF NOT EXISTS passport_data JSONB;
CREATE INDEX IF NOT EXISTS idx_purchase_sessions_passport_data ON purchase_sessions USING GIN (passport_data);
ALTER TABLE purchase_sessions ADD COLUMN IF NOT EXISTS passport_created BOOLEAN DEFAULT FALSE;
EOF

# Verify
psql -U postgres -d greenpay -c "\d purchase_sessions"
```

### Step 2: Deploy Frontend

```bash
# From local machine
cd /Users/nikolay/github/greenpay

rsync -avz --delete dist/ root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/
```

### Step 3: Deploy Backend Files

```bash
# Upload new buy-online route
scp backend/routes/buy-online.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

# Upload modified public-purchases route
scp backend/routes/public-purchases.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/

# Upload modified server.js
scp backend/server.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
```

### Step 4: Restart Backend

```bash
ssh root@72.61.208.79

cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Restart PM2
pm2 restart greenpay-api

# Check status
pm2 status greenpay-api

# Monitor logs
pm2 logs greenpay-api --lines 50
```

---

## 🧪 Testing

### Test 1: Login Page Enhancement

**URL:** https://greenpay.eywademo.cloud/login

**Expected:**
- ✅ "Buy Online" button visible below login form
- ✅ Glass-effect card with shopping cart icon
- ✅ Clicking redirects to `/buy-online`

### Test 2: Buy Online Page

**URL:** https://greenpay.eywademo.cloud/buy-online

**Test Data:**
- Passport Number: `TEST123456`
- Surname: `SMITH`
- Given Name: `JOHN`
- Nationality: `Papua New Guinea`
- DOB: `1990-01-15`
- Sex: `Male`
- Email: `test@example.com`
- Phone: `+675 123 4567`

**Actions:**
1. Fill all fields
2. Click "Continue to Payment"

**Expected:**
- ✅ Loading spinner appears
- ✅ Toast: "Redirecting to Payment"
- ✅ Redirected to payment gateway

### Test 3: Database Session Creation

**Check session was created:**
```sql
SELECT
  id,
  customer_email,
  passport_data,
  payment_status,
  expires_at
FROM purchase_sessions
WHERE customer_email = 'test@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected output:**
```
id: PGKO-1733XXXXX-XXXXXX
customer_email: test@example.com
passport_data: {"sex":"Male","surname":"SMITH","givenName":"JOHN",...}
payment_status: pending
expires_at: [30 minutes from now]
```

### Test 4: Complete Test Payment

**Using Stripe Test Mode:**
- Card Number: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

**Expected:**
1. Payment gateway processes payment
2. Webhook receives notification
3. Backend creates passport + voucher atomically
4. Email sent with voucher details

### Test 5: Verify Atomic Creation

**After successful payment:**
```sql
-- Check passport was created
SELECT id, passport_number, surname, given_name
FROM passports
WHERE passport_number = 'TEST123456';

-- Check voucher was created and linked
SELECT
  ip.id,
  ip.voucher_code,
  ip.passport_id,
  ip.passport_number,
  ip.status,
  ip.purchase_session_id
FROM individual_purchases ip
WHERE ip.passport_number = 'TEST123456'
ORDER BY ip.created_at DESC
LIMIT 1;

-- Check session marked as completed
SELECT
  id,
  payment_status,
  passport_created,
  completed_at
FROM purchase_sessions
WHERE customer_email = 'test@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:**
- ✅ Passport record exists
- ✅ Voucher record exists with `passport_id` linked
- ✅ Session status = `completed`
- ✅ `passport_created` = `true`

### Test 6: Payment Failure Scenario

**Test with declining card:**
- Card Number: `4000 0000 0000 0002`

**Expected:**
- ❌ Payment fails
- ❌ No passport created
- ❌ No voucher created
- ✅ Session remains `pending` or marked `failed`
- ✅ Session expires after 30 minutes

---

## 🔍 API Endpoints

### 1. Prepare Payment
```
POST /api/buy-online/prepare-payment
```

**Request:**
```json
{
  "passportData": {
    "passportNumber": "AB123456",
    "surname": "DOE",
    "givenName": "JOHN",
    "dateOfBirth": "1990-01-15",
    "nationality": "Papua New Guinea",
    "sex": "Male"
  },
  "email": "john@example.com",
  "phone": "+675...",
  "amount": 100.00,
  "returnUrl": "https://greenpay.eywademo.cloud/payment/success",
  "cancelUrl": "https://greenpay.eywademo.cloud/payment/cancelled"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "PGKO-1733XXX-XXX",
    "paymentUrl": "https://payment-gateway.com/...",
    "expiresAt": "2025-12-10T12:30:00Z",
    "gateway": "stripe"
  }
}
```

### 2. Check Payment Status
```
GET /api/buy-online/status/:sessionId
```

**Response:**
```json
{
  "status": "completed",
  "sessionId": "PGKO-XXX",
  "email": "john@example.com",
  "amount": 100.00,
  "completedAt": "2025-12-10T12:15:00Z"
}
```

### 3. Get Voucher Details
```
GET /api/buy-online/voucher/:sessionId
```

**Response:**
```json
{
  "success": true,
  "voucher": {
    "code": "VCH-XXX",
    "amount": 100.00,
    "validFrom": "2025-12-10",
    "validUntil": "2026-01-09",
    "status": "active",
    "passport": {
      "id": 123,
      "passportNumber": "AB123456",
      "surname": "DOE",
      "givenName": "JOHN"
    }
  }
}
```

---

## 🔄 Rollback Procedure

If deployment causes issues:

### Option 1: Rollback Frontend
```bash
ssh root@72.61.208.79
cd /home/eywademo-greenpay/backups
tar -xzf [previous-backup].tar.gz -C /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/
```

### Option 2: Rollback Backend
```bash
# Restore from git
git checkout [previous-commit]
scp backend/routes/public-purchases.js root@72.61.208.79:.../backend/routes/
scp backend/server.js root@72.61.208.79:.../backend/
rm /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js

# Restart
ssh root@72.61.208.79 "cd .../backend && pm2 restart greenpay-api"
```

### Option 3: Rollback Database (if needed)
```sql
-- Remove columns (only if necessary)
ALTER TABLE purchase_sessions DROP COLUMN IF EXISTS passport_data;
ALTER TABLE purchase_sessions DROP COLUMN IF EXISTS passport_created;
DROP INDEX IF EXISTS idx_purchase_sessions_passport_data;
```

---

## 📊 Monitoring

### Check Backend Logs
```bash
ssh root@72.61.208.79
pm2 logs greenpay-api

# Look for:
# "Buy Online: Using gateway..."
# "Buy Online payment session created..."
# "Webhook processed (Buy Online)..."
# "Created new passport: [number]"
# "Created voucher: [code] for passport [number]"
```

### Check Database Activity
```sql
-- Recent sessions with passport data
SELECT
  id,
  customer_email,
  passport_data->>'passportNumber' as passport_num,
  payment_status,
  passport_created,
  created_at
FROM purchase_sessions
WHERE passport_data IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Recent passports created from buy-online
SELECT
  p.id,
  p.passport_number,
  p.surname,
  p.given_name,
  p.created_at,
  ip.voucher_code
FROM passports p
JOIN individual_purchases ip ON p.id = ip.passport_id
WHERE ip.purchase_session_id LIKE 'PGKO-%'
ORDER BY p.created_at DESC
LIMIT 10;
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "passport_data column doesn't exist"
**Solution:** Run database migration (Step 1)

### Issue 2: "Cannot require buy-online.js"
**Solution:** Ensure buy-online.js uploaded to backend/routes/

### Issue 3: Webhook not creating passport
**Solution:**
- Check PM2 logs for errors
- Verify passport_data exists in session
- Check webhook is calling new function

### Issue 4: Payment gateway redirect fails
**Solution:**
- Check FRONTEND_URL env variable
- Verify returnUrl/cancelUrl are correct
- Check payment gateway configuration

---

## ✅ Success Checklist

After deployment, verify:

- [ ] SQL migration executed successfully
- [ ] Frontend deployed (dist/ folder)
- [ ] Backend files uploaded (3 files)
- [ ] PM2 restarted without errors
- [ ] Login page shows "Buy Online" button
- [ ] /buy-online page loads
- [ ] Can enter passport details
- [ ] Redirects to payment gateway
- [ ] Database session created with passport_data
- [ ] Test payment creates passport + voucher
- [ ] Email notification sent
- [ ] Voucher linked to passport_id
- [ ] Failed payment doesn't create records

---

## 📝 What Changed

### Database:
- Added `passport_data` JSONB column to `purchase_sessions`
- Added `passport_created` boolean column
- Added GIN index for passport data queries

### Backend:
- **NEW:** `routes/buy-online.js` - Enhanced payment preparation with passport storage
- **MODIFIED:** `routes/public-purchases.js` - Webhook detects passport data and calls atomic creation
- **MODIFIED:** `server.js` - Registered /api/buy-online routes

### Frontend:
- **MODIFIED:** `pages/Login.jsx` - Added "Buy Online" button
- **MODIFIED:** `pages/BuyOnline.jsx` - Calls new API, stores passport in DB session
- **MODIFIED:** `App.jsx` - Registered /buy-online route

---

## 🎉 Benefits

**Before (Legacy Flow):**
- Buy voucher → Register passport separately
- Orphaned vouchers possible
- Two-step process
- Poor UX

**After (Phase 2):**
- ✅ Single cohesive flow
- ✅ Atomic transactions (all or nothing)
- ✅ No orphaned records
- ✅ GDPR compliant (failed payment = no data)
- ✅ Better user experience
- ✅ Proper audit trail
- ✅ Idempotency protection

---

**Prepared:** December 10, 2025
**Status:** ✅ READY TO DEPLOY
**Build:** Production (600.99 kB)