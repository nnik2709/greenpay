# Deploy: Passport-Voucher Integration

## Overview

This deployment enables customers to optionally include passport details when purchasing vouchers online, eliminating the need for a separate registration step.

## Changes Made

### ✅ Frontend Changes

**File: `src/pages/PublicVoucherPurchase.jsx`**

1. Added optional passport fields to form state
2. Added checkbox to toggle passport field visibility
3. Added passport input fields (Passport Number, Surname, Given Name, DOB, Nationality, Sex)
4. Updated validation to check passport fields when checkbox is enabled
5. Updated submission logic to include `passportData` in API call
6. Updated "What Happens Next" section to show different flows

**UI Improvements:**
- Passport fields appear with animation when checkbox is checked
- Clear visual feedback about benefits of including passport
- Force quantity to 1 when passport is included (one voucher per passport)
- Form auto-saves to localStorage

### ✅ Backend Changes

**File: `backend/routes/public-purchases.js`**

1. Updated `POST /api/public-purchases/create-payment-session` to accept `passportData`
2. Modified database INSERT to include `passport_data` column
3. Added logging for passport data when provided

**Existing Infrastructure (No Changes Needed):**
- Webhook handler already checks for `passport_data` (lines 805-820)
- `completePurchaseWithPassport()` function already exists in `buy-online.js`
- Database schema already has `passport_data` JSONB column

### ✅ Database Schema

**Already migrated!** The `purchase_sessions` table already has:
```sql
ALTER TABLE purchase_sessions
  ADD COLUMN IF NOT EXISTS passport_data JSONB;
```

Migration file: `backend/migrations/add-passport-data-to-sessions.sql`

---

## Deployment Steps

### Step 1: Verify Database Schema

```bash
# Connect to production database
psql -h localhost -U greenpay_user -d greenpay_db

# Check if passport_data column exists
\d purchase_sessions

# Should show:
# passport_data | jsonb |
```

If column doesn't exist, run migration:
```bash
psql -h localhost -U greenpay_user -d greenpay_db < backend/migrations/add-passport-data-to-sessions.sql
```

### Step 2: Deploy Backend

```bash
# Navigate to project root
cd /path/to/greenpay

# Pull latest changes
git pull origin main

# Deploy backend
./deploy-backend.sh

# Or manually:
rsync -avz --exclude node_modules backend/ user@server:/path/to/backend/
ssh user@server "cd /path/to/backend && npm install --production"
ssh user@server "pm2 restart greenpay-backend"
```

### Step 3: Deploy Frontend

```bash
# Build frontend
npm run build

# Deploy frontend
./deploy-to-greenpay-server.sh

# Or manually:
rsync -avz --delete dist/ user@server:/path/to/frontend/
```

### Step 4: Verify Deployment

**Test Flow 1: With Passport Data**
1. Go to https://greenpay.eywademo.cloud/buy-voucher
2. Fill in email/phone
3. ✅ Check "Include passport details now"
4. Fill in passport fields
5. Complete payment (test mode)
6. Verify voucher created with passport_number (not 'PENDING')
7. Try scanning voucher → Should validate successfully

**Test Flow 2: Without Passport Data (Legacy)**
1. Go to https://greenpay.eywademo.cloud/buy-voucher
2. Fill in email/phone only
3. ❌ Leave "Include passport details" unchecked
4. Complete payment
5. Verify voucher created with passport_number = 'PENDING'
6. Try scanning → Should show "Registration required"
7. Register passport at `/register/:code`
8. Try scanning again → Should validate successfully

**Test Flow 3: Buy Online (Existing)**
1. Go to https://greenpay.eywademo.cloud/buy-online
2. Fill in passport details (required)
3. Complete payment
4. Verify voucher created with passport linked
5. Should work as before

---

## API Changes

### `POST /api/public-purchases/create-payment-session`

**New Request Body:**
```json
{
  "customerEmail": "customer@example.com",
  "customerPhone": "+675XXXXXXXX",
  "quantity": 1,
  "amount": 50,
  "currency": "PGK",
  "deliveryMethod": "Email",
  "returnUrl": "https://greenpay.eywademo.cloud/purchase/callback",
  "cancelUrl": "https://greenpay.eywademo.cloud/buy-voucher",
  "passportData": {  // 🆕 NEW: Optional
    "passportNumber": "AB123456",
    "surname": "DOE",
    "givenName": "JOHN",
    "dateOfBirth": "1990-01-15",
    "nationality": "Papua New Guinea",
    "sex": "Male"
  }
}
```

**Backward Compatible:**
- If `passportData` is null/undefined → Legacy flow (PENDING registration)
- If `passportData` is provided → Atomic passport + voucher creation

---

## Webhook Flow

The webhook handler automatically detects passport data:

```javascript
// public-purchases.js:805-820
const sessionCheck = await pool.query(
  'SELECT passport_data FROM purchase_sessions WHERE id = $1',
  [sessionId]
);

if (sessionCheck.rows[0].passport_data) {
  // Has passport → Atomic creation via buy-online module
  const { completePurchaseWithPassport } = require('./buy-online');
  await completePurchaseWithPassport(sessionId, data);
} else {
  // No passport → Legacy flow (voucher with PENDING status)
  await completeVoucherPurchase(sessionId, data);
}
```

---

## Rollback Plan

If issues occur, rollback is safe:

### Option 1: Frontend Only Rollback
```bash
# Revert frontend to previous build
git checkout HEAD~1 src/pages/PublicVoucherPurchase.jsx
npm run build
./deploy-to-greenpay-server.sh
```

**Impact:** Form will revert to simple email/phone only. Backend still accepts `passportData` but won't receive it.

### Option 2: Full Rollback
```bash
# Revert both frontend and backend
git revert <commit-hash>
npm run build
./deploy-backend.sh
./deploy-to-greenpay-server.sh
```

**Impact:** Back to legacy flow (all vouchers require registration).

---

## Monitoring

### Check Logs

```bash
# Backend logs
pm2 logs greenpay-backend

# Look for:
# "📋 Passport data included: AB123456 (DOE, JOHN)"
# "✅ Webhook processed (Buy Online) for session: PGKB-..."

# Database queries
psql -h localhost -U greenpay_user -d greenpay_db

# Check recent sessions with passport data
SELECT
  id,
  customer_email,
  payment_status,
  passport_data->>'passportNumber' as passport,
  created_at
FROM purchase_sessions
WHERE passport_data IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

# Check vouchers linked to passports
SELECT
  voucher_code,
  passport_number,
  customer_name,
  valid_from,
  valid_until,
  used_at
FROM individual_purchases
WHERE passport_number != 'PENDING'
  AND created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
```

### Success Metrics

**After 24 hours:**
- % of vouchers with passport data vs PENDING
- Registration completion rate (should decrease)
- Average time from purchase to airport scan (should decrease)

---

## User Documentation

### For Customers

**Option 1: Include Passport Now (Recommended)**
✅ Skip registration step
✅ Voucher ready to scan immediately
✅ Faster airport processing

**Option 2: Register Later**
- Purchase voucher with just email/phone
- Register passport within 30 days
- Use voucher code at `/register/:code`

### For Corporate Customers

Corporate vouchers **still require separate registration**:
- Company purchases bulk vouchers
- Distributes voucher codes to employees
- Each employee registers their own passport
- Prevents duplicate passport registrations

---

## Technical Notes

### Database Transaction Safety

All voucher creation uses **ATOMIC transactions**:
```javascript
await client.query('BEGIN');
try {
  // 1. Create/update Passport
  // 2. Create Voucher linked to Passport
  // 3. Update session status
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  // No partial states!
}
```

### Idempotency

Webhook handler is idempotent:
- Checks if session already completed
- Prevents duplicate voucher creation
- Safe for payment gateway retries

### Security

- Rate limiting on validation endpoints
- Input sanitization on all passport fields
- Uppercase normalization for passport numbers
- HTTPS enforced for all payment flows

---

## FAQ

**Q: What if user provides wrong passport number?**
A: They can contact support. Admin can update passport record via Users page.

**Q: Can user buy multiple vouchers with one passport?**
A: No, when passport checkbox is enabled, quantity is locked to 1.

**Q: What about bulk purchases?**
A: Bulk purchases (quantity > 1) automatically disable passport checkbox. Use `/buy-online` for single passport-linked vouchers.

**Q: Can corporate vouchers include passport data upfront?**
A: No, corporate flow intentionally requires separate registration per employee.

**Q: What if passport already exists in system?**
A: `completePurchaseWithPassport()` updates existing passport record and creates new voucher.

---

## Support Contacts

**Technical Issues:**
- Logs: `pm2 logs greenpay-backend`
- Database: `psql -U greenpay_user greenpay_db`
- Frontend errors: Browser console (F12)

**User Support:**
- Email: support@greenpay.gov.pg
- Phone: +675 XXX XXXX

---

## Checklist

- [ ] Database migration verified
- [ ] Backend deployed and restarted
- [ ] Frontend built and deployed
- [ ] Test voucher with passport (successful)
- [ ] Test voucher without passport (successful)
- [ ] Test voucher scanning (both flows)
- [ ] Monitor logs for 24 hours
- [ ] Update user documentation
- [ ] Train support staff on new flow

---

**Deployed By:** _________________
**Date:** _________________
**Verified By:** _________________
**Sign-off:** _________________
