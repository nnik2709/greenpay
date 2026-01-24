# Deploy: Fix Public Registration Success Page

**Date**: January 22, 2026
**Status**: Ready to deploy
**Priority**: CRITICAL - Public purchase success page completely broken

## What Was Broken

The public registration success page at `/register/success/:voucherCode` was completely broken:

1. **Page crashed** - Missing Supabase import but code still used it
2. **No passport data** - API endpoint didn't include passport info
3. **Emojis in buttons** - ✓, 🖨️, 📥 characters
4. **Both buttons did same thing** - Download just called Print
5. **Wrong layout** - Missing data caused layout issues

## Root Cause

The "Phase 3 Cleanup: Complete Supabase removal" commit (2825a96) removed the Supabase import but didn't update the page to use the new API client. The page was trying to call `supabase.from()` which no longer existed.

## What Was Fixed

### Backend Fix (vouchers.js)

Updated `/api/vouchers/code/:voucherCode` endpoint to include passport data:

```javascript
// Before: Simple SELECT
SELECT * FROM individual_purchases WHERE voucher_code = $1

// After: LEFT JOIN with passports table
SELECT ip.*,
       p.id as passport_id,
       p.passport_number as passport_passport_number,
       p.full_name as passport_full_name,
       p.nationality as passport_nationality,
       p.date_of_birth as passport_date_of_birth,
       p.expiry_date as passport_expiry_date
FROM individual_purchases ip
LEFT JOIN passports p ON ip.passport_number = p.passport_number
WHERE ip.voucher_code = $1
```

Response format:
```json
{
  "success": true,
  "voucher": {
    "id": 123,
    "voucher_code": "ABC123",
    "passport_number": "P1234567",
    "amount": 50,
    "passport": {
      "id": 456,
      "passport_number": "P1234567",
      "full_name": "JOHN DOE",
      "nationality": "DNK",
      "date_of_birth": "1990-01-01",
      "expiry_date": "2030-01-01"
    }
  }
}
```

### Frontend Fix (PublicRegistrationSuccess.jsx)

1. **Added API client import**: `import api from '@/lib/api/client'`
2. **Removed Supabase**: No longer uses supabase library
3. **Updated data fetching**: Uses `api.get('/vouchers/code/${code}')`
4. **Fixed data structure**: Changed `voucher.passports` to `voucher.passport`
5. **Removed emojis**: Replaced with Lucide icons (Printer, Download)
6. **Fixed checkmark**: SVG icon instead of ✓ emoji
7. **Added null safety**: All fields have `|| 'N/A'` fallbacks
8. **Fixed download button**: Now uses html2canvas for image download

## Deployment Steps

### 1. Backend Deployment

Upload via CloudPanel:
```
deployment-package/backend/routes/vouchers.js
  → /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/
```

Then restart:
```bash
ssh root@165.22.52.100
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 30
```

### 2. Frontend Deployment

Option A - Using deploy.sh:
```bash
cd /Users/nikolay/github/greenpay
./deploy.sh
```

Option B - Manual SCP:
```bash
cd /Users/nikolay/github/greenpay
scp -r dist/* root@165.22.52.100:/var/www/png-green-fees/dist/
```

Option C - CloudPanel Manual Upload:
- Upload entire `dist/` folder to `/var/www/png-green-fees/dist/`

## Verification Steps

1. **Test the success page**:
   - Go to https://greenpay.eywademo.cloud/buy-online
   - Complete a purchase (or use existing voucher code)
   - Navigate to https://greenpay.eywademo.cloud/register/success/YOUR_CODE

2. **Check for**:
   - ✅ Page loads without errors
   - ✅ QR code displays
   - ✅ Voucher details show (code, amount, dates)
   - ✅ Passport information displays (name, nationality, DOB)
   - ✅ No emojis - only clean icons
   - ✅ "Print Voucher" button works (opens print dialog)
   - ✅ "Download" button works (downloads PNG or opens print)
   - ✅ Professional clean layout

3. **Check browser console**:
   - Should have NO errors
   - Previously: `supabase is not defined`
   - Now: Clean, no errors

4. **Check API response**:
   - Open DevTools Network tab
   - Look for `/api/vouchers/code/YOUR_CODE` request
   - Should return `passport` nested object with full_name, nationality, etc.

## What to Watch For

### If passport data still missing:
```bash
# Check if backend was uploaded and restarted
ssh root@165.22.52.100
ls -l /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/vouchers.js
pm2 logs greenpay-api --lines 50 | grep "voucher"
```

### If page still crashes:
- Clear browser cache (Cmd+Shift+R / Ctrl+Shift+F5)
- Check that frontend was deployed: https://greenpay.eywademo.cloud/ should load new version
- Look for error in browser console

### If "Download" button doesn't work:
- Expected: Downloads PNG image of voucher
- Fallback: Opens print dialog (same as Print button)
- Requires html2canvas library (already included)

## Files Changed

### Backend:
- `backend/routes/vouchers.js` - Lines 1427-1538
- `deployment-package/backend/routes/vouchers.js` - Same changes

### Frontend:
- `src/pages/PublicRegistrationSuccess.jsx` - Complete rewrite (249 lines)
- Built into `dist/` folder

## Technical Details

### Why JOIN with passports table?
The old Supabase code did: `.select('*, passports(*)')` which automatically joined related tables. PostgreSQL doesn't have this magic, so we explicitly LEFT JOIN and nest the passport data in the response.

### Why LEFT JOIN not INNER JOIN?
Some vouchers might not have passport data yet (edge case). LEFT JOIN ensures we always return the voucher even if passport is missing.

### Why change data structure?
- Old: `voucher.passports` (Supabase's plural convention)
- New: `voucher.passport` (singular, matches actual relationship - one voucher has one passport)

---

## Success Criteria

After deployment:
1. ✅ Page loads without errors
2. ✅ Passport data displays correctly
3. ✅ No emojis visible
4. ✅ Both buttons work correctly
5. ✅ Layout is clean and professional
6. ✅ Works for both online purchases and counter agent registrations

**This was the last remaining Supabase dependency in the codebase.**
