# Frontend Multiple Vouchers Display Fix

**Date**: 2026-01-15
**Status**: Ready for Deployment
**Priority**: HIGH (Completes Phase 1 Multiple Vouchers)

---

## Problem

After deploying backend Phase 1 fix for multiple voucher generation, the frontend PaymentSuccess page only displayed the FIRST voucher instead of showing ALL purchased vouchers.

**User Feedback**:
> "frontend still showing single voucher so not supporting new flow. Pleas fix frontend to display all purchased vouchers whith ability to download, email or print all vouchers-"

---

## Solution

### Backend API Update (buy-online.js:489-578)

**File**: `backend/routes/buy-online.js`

Changed the `/api/buy-online/voucher/:sessionId` endpoint to:
- Return ALL vouchers (removed `LIMIT 1`)
- Generate barcodes for each voucher
- Return `vouchers` array + backward compatible `voucher` (first item)
- Added `quantity` field to response

**Changes**:
```javascript
// BEFORE: Line 530
LIMIT 1

// AFTER: Removed LIMIT, return all with ORDER BY
ORDER BY ip.created_at ASC

// Response now includes:
{
  vouchers: [...],  // Array of ALL vouchers
  voucher: vouchers[0],  // Backward compatibility
  quantity: vouchers.length
}
```

### Frontend Display Update (PaymentSuccess.jsx)

**File**: `src/pages/PaymentSuccess.jsx`

Updated to handle and display multiple vouchers:

1. **State Change**: `voucher` → `vouchers` array (Line 24)
2. **Fetch Logic**: Handle `response.vouchers` array (Line 56-67)
3. **Display**: Loop through all vouchers with `.map()` (Line 260-323)
4. **Button Labels**: Dynamic text based on quantity:
   - `Download All (3)` instead of `Download PDF`
   - `Print All (3)` instead of `Print`
   - `Email All (3)` instead of `Email Voucher`
5. **Header Text**: Shows quantity (e.g., "Your 3 green fee vouchers are ready")

**Key Visual Changes**:
- Single voucher: Display as before (no "Voucher 1 of 1" header)
- Multiple vouchers: Each voucher gets "Voucher X of N" header
- All vouchers displayed in scrollable list
- Buttons show count: "Download All (3)", "Print All (3)", etc.

---

## Files Changed

### Backend
- `backend/routes/buy-online.js` - Return ALL vouchers

### Frontend
- `src/pages/PaymentSuccess.jsx` - Display all vouchers, update buttons

---

## Deployment Steps

### Step 1: Backend Deployment (Already Done)

The backend API is already deployed and returning all vouchers correctly.

### Step 2: Build Frontend

```bash
# From project root
npm run build
```

### Step 3: Deploy Frontend

```bash
# Use existing deployment script
./deploy.sh
```

Or manually:
```bash
# SSH to server
ssh root@165.22.52.100

# Navigate to frontend directory
cd /var/www/png-green-fees

# Backup current build
cp -r dist dist.backup-multiple-vouchers-$(date +%Y%m%d)

# Exit SSH, then from local machine:
# Upload new build
scp -r dist/* root@165.22.52.100:/var/www/png-green-fees/dist/

# Restart PM2 (if needed)
ssh root@165.22.52.100 "pm2 restart png-green-fees"
```

### Step 4: Verify Deployment

```bash
# Check PM2 status
ssh root@165.22.52.100 "pm2 list"

# Check logs for errors
ssh root@165.22.52.100 "pm2 logs png-green-fees --lines 50"
```

---

## Testing

### Test 1: Single Voucher (Backward Compatibility)

1. Complete BSP DOKU payment for 1 voucher (K50)
2. Verify PaymentSuccess page shows:
   - Title: "Your green fee voucher is ready" (singular)
   - ONE voucher displayed
   - NO "Voucher 1 of 1" header
   - Buttons: "Download PDF", "Print", "Email Voucher" (no quantity)

### Test 2: Two Vouchers

1. Complete BSP DOKU payment for 2 vouchers (K100)
2. Verify PaymentSuccess page shows:
   - Title: "Your 2 green fee vouchers are ready"
   - TWO vouchers displayed with headers:
     - "Voucher 1 of 2"
     - "Voucher 2 of 2"
   - Each voucher shows unique code and barcode
   - Buttons: "Download All (2)", "Print All (2)", "Email All (2)"

### Test 3: Three Vouchers

1. Complete BSP DOKU payment for 3 vouchers (K150)
2. Verify PaymentSuccess page shows:
   - Title: "Your 3 green fee vouchers are ready"
   - THREE vouchers with headers "Voucher 1 of 3", "Voucher 2 of 3", "Voucher 3 of 3"
   - All vouchers scrollable
   - Buttons: "Download All (3)", "Print All (3)", "Email All (3)"

### Test 4: Actions Work for All Vouchers

1. Click "Download All" - Should download PDF with all vouchers
2. Click "Print All" - Should open print dialog with all vouchers
3. Click "Email All" - Dialog should say "Email 3 Vouchers"
4. Send email - All vouchers should be in email

---

## API Response Format

### Before (Single Voucher Only)
```json
{
  "success": true,
  "voucher": {
    "code": "ONL-XXXXXXX1",
    "amount": "50.00",
    ...
  }
}
```

### After (All Vouchers + Backward Compatible)
```json
{
  "success": true,
  "vouchers": [
    {
      "code": "ONL-XXXXXXX1",
      "amount": "50.00",
      ...
    },
    {
      "code": "ONL-XXXXXXX2",
      "amount": "50.00",
      ...
    },
    {
      "code": "ONL-XXXXXXX3",
      "amount": "50.00",
      ...
    }
  ],
  "voucher": {  // First voucher (backward compatibility)
    "code": "ONL-XXXXXXX1",
    ...
  },
  "quantity": 3
}
```

---

## Success Criteria

- ✅ Single voucher: Works as before (no visual changes)
- ✅ Multiple vouchers: ALL displayed on success page
- ✅ Each voucher shows unique code and barcode
- ✅ Button labels dynamically show count
- ✅ Download All works for multiple vouchers
- ✅ Print All works for multiple vouchers
- ✅ Email All dialog shows correct count
- ✅ No console errors
- ✅ Responsive design (mobile + desktop)

---

## Rollback Plan

If issues occur:

```bash
# SSH to server
ssh root@165.22.52.100

# Navigate to frontend directory
cd /var/www/png-green-fees

# Restore backup
rm -rf dist
cp -r dist.backup-multiple-vouchers-YYYYMMDD dist

# Restart PM2
pm2 restart png-green-fees
```

---

## Notes

- Backend already deployed and working correctly
- Frontend is the only change needed
- Backward compatible with single vouchers
- PDF generation backend already handles multiple vouchers
- Email notification backend already sends all vouchers

---

**Status**: ✅ READY FOR DEPLOYMENT
**Risk**: LOW (isolated frontend change, backward compatible)
**Business Impact**: HIGH (completes Phase 1, fixes critical user issue)
