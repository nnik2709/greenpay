# Nationality Field Fix - Ready for Deployment

## Issue Fixed
Nationality field not populating when scanning passport at `/voucher-registration`

## Root Cause
The country code mapper was converting `'DNK'` → `'Danish'` (nationality/demonym), but the `NationalityCombobox` dropdown expects `'Denmark'` (country name). This caused a mismatch where the scanned value couldn't be found in the dropdown options.

## Fix Applied
Changed `/src/lib/countryCodeMapper.js` to return country names instead of nationalities:
- `'DNK': 'Danish'` → `'DNK': 'Denmark'`
- `'DJI': 'Djiboutian'` → `'DJI': 'Djibouti'`
- `'DMA': 'Dominican'` → `'DMA': 'Dominica'`
- `'DOM': 'Dominican'` → `'DOM': 'Dominican Republic'`

## Why It Works in CreatePassport but Not VoucherRegistration

**CreatePassport** (`/app/passports/create`):
- Uses regular `<Input>` text field for nationality
- Accepts any text value → "Denmark" or "Danish" both work

**VoucherRegistration** (`/voucher-registration`):
- Uses `<NationalityCombobox>` SELECT dropdown
- Only accepts values from countries list → Must be "Denmark", not "Danish"

## Files Modified
- `src/lib/countryCodeMapper.js` - Lines 67-70

## Build Status
✅ Production build completed successfully (11.69s)
✅ Build ready in `/dist` folder

## Deployment Steps

### Option 1: Manual Upload via CloudPanel
1. Navigate to CloudPanel File Manager
2. Go to `/var/www/png-green-fees/`
3. Upload entire contents of local `/Users/nikolay/github/greenpay/dist/` folder
4. Overwrite existing files when prompted
5. Restart frontend: `pm2 restart png-green-fees`

### Option 2: SSH Terminal
```bash
# On your local machine (not in SSH)
# Compress the dist folder
cd /Users/nikolay/github/greenpay
tar -czf dist-nationality-fix.tar.gz dist/

# Then upload via CloudPanel File Manager or scp
```

Then in SSH terminal:
```bash
# Navigate to deployment directory
cd /var/www/png-green-fees/

# Extract uploaded archive (if using tar method)
tar -xzf dist-nationality-fix.tar.gz

# Or if you uploaded dist folder directly via CloudPanel, just restart
pm2 restart png-green-fees

# Verify restart
pm2 status
pm2 logs png-green-fees --lines 20
```

## Verification After Deployment

### Test 1: Voucher Registration Page (PRIMARY FIX)
1. Navigate to `https://greenpay.eywademo.cloud/voucher-registration`
2. Enter a voucher code and proceed to Step 2
3. Scan a Danish passport with PrehKeyTec scanner
4. ✅ **Verify: Nationality dropdown shows "Denmark"**
5. ✅ **Verify: All other fields populate correctly**

### Test 2: Create Passport Page (Should Still Work)
1. Navigate to `https://greenpay.eywademo.cloud/app/passports/create`
2. Scan a Danish passport
3. ✅ **Verify: Nationality field shows "Denmark"** (was already working, should continue to work)

### Test 3: Multiple Countries
Test with passports from different countries to ensure the fix works broadly:
- Denmark (DNK) → "Denmark"
- Australia (AUS) → Should show country name
- United Kingdom (GBR) → Should show country name

## Console Verification
After scanning in voucher registration, you should see:
```
[VoucherRegistration] Processing scanned passport: {
  nationality: 'Denmark',  // Changed from 'Danish'
  ...other fields
}
```

NOT:
```
nationality: 'Danish'  // Old broken version
```

## Rollback Plan
If issues occur, revert by:
1. Get previous dist folder from backup
2. Upload to `/var/www/png-green-fees/`
3. Restart: `pm2 restart png-green-fees`

## Notes
- This fix affects ALL country code conversions from MRZ scans
- CreatePassport page uses plain text input, so it's unaffected
- VoucherRegistration uses dropdown, so this fix is critical for it
- The change is backward compatible with existing data
