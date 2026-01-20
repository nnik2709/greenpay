# Deploy Voucher Creation Fix for BSP Flow

**Date**: 2026-01-15 16:15 UTC
**Purpose**: Fix webhook to support BSP flow (vouchers without passport data)
**Status**: Ready for deployment

## Root Cause

The webhook (`payment-webhook-doku.js`) was throwing error when `passport_data` was missing from the session:

```
Error: No passport data in session
at createVoucherFromPayment (payment-webhook-doku.js:166:13)
```

This was blocking the NEW BSP flow where vouchers are created WITHOUT passport data initially.

## The Fix

Updated `createVoucherFromPayment()` function to support BOTH flows:

1. **Flow 1 (With Passport)**: Passport data collected upfront → Create passport + voucher atomically → Status: `active` (ready to scan)
2. **Flow 2 (BSP Flow)**: No passport data → Create voucher with `passport_number = 'PENDING'` → Status: `pending_passport` (requires registration)

## Changes Made

**File**: `backend/routes/payment-webhook-doku.js`

**Lines 163-214**: Made passport data optional and added support for PENDING vouchers
**Lines 243-257**: Updated voucher creation to use dynamic passport number and status
**Lines 262-266**: Updated logging to reflect the correct flow

### Key Changes:

1. Passport data is now **optional** (not required)
2. If missing → `passportNumber = 'PENDING'`, `status = 'pending_passport'`
3. If present → Normal flow (create passport + voucher atomically)
4. Customer name falls back to email if no passport data

## Deployment Steps

### 1. Upload via CloudPanel (Manual)

1. Open CloudPanel File Manager
2. Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`
3. **Backup current file**:
   ```bash
   # In SSH terminal, run:
   cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
   cp payment-webhook-doku.js payment-webhook-doku.js.backup-2026-01-15
   ```
4. Upload `payment-webhook-doku.js` from local repo
5. Verify file uploaded correctly

### 2. Restart Backend (SSH Terminal)

```bash
pm2 restart greenpay-api
```

### 3. Verify Startup (SSH Terminal)

```bash
pm2 logs greenpay-api --lines 20
```

Look for:
```
PNG Green Fees System - Backend API
  Version: 1.0.0
  Environment: production
✅ Connected to PostgreSQL database
```

### 4. Test Payment (Already Completed Session)

Check the existing completed payment session `PGKO-MKFMH4-8k0a4LxPbSE`:

```bash
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay -c "
SELECT
  voucher_code,
  passport_number,
  status,
  customer_name,
  customer_email,
  amount
FROM individual_purchases
WHERE purchase_session_id = 'PGKO-MKFMH4-8k0a4LxPbSE';
"
```

**Expected result**:
- Voucher should exist with `passport_number = 'PENDING'`
- Status: `pending_passport`
- Customer can register passport later via `/register/:voucherCode`

### 5. Test New Payment (Optional)

Complete a new BSP payment and verify:
- Payment completes successfully ✅
- Webhook creates voucher without error ✅
- Voucher has PENDING status ✅
- Email sent to customer ✅

### 6. Monitor Logs (SSH Terminal)

```bash
pm2 logs greenpay-api --lines 100 | grep "DOKU VOUCHER"
```

Look for:
```
[DOKU VOUCHER] Starting voucher creation for session: PGKO-XXX
[DOKU VOUCHER] No passport data - creating PENDING voucher for BSP flow
[DOKU VOUCHER] Generated voucher code: ONL-XXX
[DOKU VOUCHER] Created voucher: ONL-XXX with PENDING status (BSP flow - registration required)
[DOKU VOUCHER] ✅ Voucher creation completed successfully
```

## Expected Behavior After Fix

### Scenario 1: Payment WITH Passport Data
- User enters passport details on `/buy-online` page
- Webhook creates passport record + voucher
- Voucher status: `active`
- Passport number: Actual passport number
- **Ready to scan immediately** ✅

### Scenario 2: Payment WITHOUT Passport Data (BSP Flow)
- User pays first (no passport required)
- Webhook creates voucher with PENDING status
- Voucher status: `pending_passport`
- Passport number: `'PENDING'`
- **Must register passport via `/register/:voucherCode` before scanning** ⚠️

## Rollback Plan

If anything goes wrong:

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
mv payment-webhook-doku.js payment-webhook-doku.js.new
mv payment-webhook-doku.js.backup-2026-01-15 payment-webhook-doku.js
pm2 restart greenpay-api
```

## Success Criteria

- ✅ Payment gateway working (already fixed with session ID format)
- ✅ Webhook handles sessions WITH passport data (original flow)
- ✅ Webhook handles sessions WITHOUT passport data (NEW BSP flow)
- ✅ PENDING vouchers created successfully
- ✅ Email notifications sent
- ✅ No errors in webhook processing

## Related Documentation

- `SUCCESS_PAYMENT_FIXED.md` - Payment gateway fix (session ID format)
- `BUY_ONLINE_COMPLETE_FLOW.md` - Complete user flow with passport data
- `PASSPORT_VOUCHER_FLOW.md` - Two-flow system explanation

---

**Status**: Ready for deployment
**Priority**: HIGH - Required for BSP flow to work correctly
**Impact**: Unblocks voucher creation for payments without passport data
**Deployment Time**: 2 minutes
**Risk**: LOW - Backward compatible with existing flow
