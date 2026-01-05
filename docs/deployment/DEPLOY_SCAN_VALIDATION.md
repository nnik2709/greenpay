# Voucher Scan & Validation - Deployment Guide

## Changes Made

### Backend: Strict Validation Logic (`backend/routes/vouchers.js`)

**Fixed Column Name Issues:**
- Individual vouchers: Uses `used_at` column
- Corporate vouchers: Uses `redeemed_date` column (aliased as `used_at` in SELECT)
- Both tables now work correctly

**Fixed Status Computation (Line 108):**
- Changed individual_purchases query from `END as status` to `END as computed_status`
- This fixes the "Status: undefined" issue where valid vouchers showed as invalid
- Both individual and corporate queries now return `computed_status` consistently

**New Behavior:**
- ✅ **ONLY "active" status** returns success (green flash + beep)
- ❌ **ALL other statuses** return error (red flash + alert sound):
  - `used` - Already used
  - `expired` - Past expiration date
  - `pending_passport` - No passport registered
  - Any other status

**Auto-Mark as Used:**
- When a voucher with status "active" is scanned and validated
- Backend automatically updates the appropriate column:
  - Individual: `used_at = NOW()`
  - Corporate: `redeemed_date = NOW()`
- Prevents the same voucher from being used twice
- Returns `markedAsUsed: true` in the response

**Status Flow:**
```
active → (scan) → used (with used_at timestamp)
expired → (scan) → error (red flash)
pending_passport → (scan) → error (red flash)
used → (scan) → error (red flash)
```

### Frontend: Enhanced Mobile UX (`src/pages/ScanAndValidate.jsx`)

**Mobile-First Design:**
- Larger camera button (h-28 on mobile)
- Clearer instructions with step-by-step guide
- Collapsible manual entry (hidden by default)
- USB scanner status indicator

**Better Debugging:**
- Comprehensive console logging (`[Scanner]` prefix)
- Error handling for camera permissions
- Validation error details in console

**Sound/Visual Feedback:**
- ✅ Green flash + success beep = VALID (active → used)
- ❌ Red flash + error alert = INVALID (any other status)

## Deployment Steps

### 1. Deploy Backend

```bash
# SSH to production server
ssh root@165.22.52.100

# Navigate to backend directory
cd /var/www/greenpay/backend/routes

# Backup current file
cp vouchers.js vouchers.js.backup-$(date +%Y%m%d-%H%M%S)

# Upload the new vouchers.js file (from your local machine)
# On local machine:
scp backend/routes/vouchers.js root@165.22.52.100:/var/www/greenpay/backend/routes/

# Restart PM2
pm2 restart greenpay-api

# Monitor logs
pm2 logs greenpay-api --lines 50
```

### 2. Deploy Frontend

```bash
# On local machine (already built in dist/)

# Deploy to production
scp -r dist/* root@165.22.52.100:/var/www/greenpay/

# Frontend is served by Nginx, no restart needed
```

### 3. Test the Changes

**Test 1: Manual Entry with Active Voucher**
1. Go to https://greenpay.eywademo.cloud/app/scan
2. Expand "Manual Entry"
3. Enter a voucher code with status "active"
4. Expected: Green flash + beep + "✅ VALID - Entry approved"
5. Scan the same code again
6. Expected: Red flash + alert + "INVALID - Already used on [date]"

**Test 2: Mobile Camera Scan**
1. Open on mobile phone: https://greenpay.eywademo.cloud/app/scan
2. Tap "Scan Voucher Barcode"
3. Allow camera access
4. Point at barcode/QR code
5. Expected: Auto-scan + validation with sound/flash feedback

**Test 3: Error Cases**
Test with vouchers in different states:
- `expired` voucher → Red flash + "INVALID - Expired on [date]"
- `pending_passport` voucher → Red flash + "INVALID - Passport not registered"
- `used` voucher → Red flash + "INVALID - Already used on [date]"
- Invalid code → Red flash + "INVALID - Voucher code not found"

**Test 4: Check Browser Console**
Open browser console (F12) and check for:
- `[Scanner]` debug messages (camera initialization)
- Validation API calls and responses
- Error details if validation fails

### 4. Verify Database Updates

```sql
-- Check if vouchers are being marked as used
SELECT
  voucher_code,
  passport_number,
  used_at,
  valid_until,
  CASE
    WHEN used_at IS NOT NULL THEN 'used'
    WHEN valid_until < NOW() THEN 'expired'
    WHEN passport_number IS NOT NULL THEN 'active'
    ELSE 'pending_passport'
  END as computed_status
FROM individual_purchases
WHERE voucher_code = 'YOUR_TEST_CODE'

UNION ALL

SELECT
  voucher_code,
  passport_number,
  used_at,
  valid_until,
  CASE
    WHEN used_at IS NOT NULL THEN 'used'
    WHEN valid_until < NOW() THEN 'expired'
    WHEN passport_number IS NOT NULL THEN 'active'
    ELSE 'pending_passport'
  END as computed_status
FROM corporate_vouchers
WHERE voucher_code = 'YOUR_TEST_CODE';
```

## Validation Logic Summary

| Status | Has Passport? | Expired? | Used? | Result | Sound |
|--------|--------------|----------|-------|--------|-------|
| `active` | ✅ Yes | ❌ No | ❌ No | ✅ VALID | Green + Beep |
| `active` | ✅ Yes | ❌ No | ❌ No (2nd scan) | ❌ INVALID (now used) | Red + Alert |
| `used` | Any | Any | ✅ Yes | ❌ INVALID | Red + Alert |
| `expired` | Any | ✅ Yes | Any | ❌ INVALID | Red + Alert |
| `pending_passport` | ❌ No | Any | Any | ❌ INVALID | Red + Alert |
| Not found | N/A | N/A | N/A | ❌ INVALID | Red + Alert |

## Rollback Plan

If issues occur:

### Rollback Backend:
```bash
ssh root@165.22.52.100
cd /var/www/greenpay/backend/routes
cp vouchers.js.backup-YYYYMMDD-HHMMSS vouchers.js
pm2 restart greenpay-api
```

### Rollback Frontend:
Re-deploy previous dist/ folder from backup.

## Support

If camera scanning doesn't work:
1. Check browser console for `[Scanner]` logs
2. Verify HTTPS is working (camera requires secure context)
3. Test camera permissions in browser settings
4. Try USB scanner as fallback

If validation errors occur:
1. Check PM2 logs: `pm2 logs greenpay-api`
2. Verify database schema matches expected columns
3. Check voucher status in database
4. Review browser console for API error details
