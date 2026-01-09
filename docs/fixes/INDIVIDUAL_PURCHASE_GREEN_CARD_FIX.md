# Individual Purchase GREEN CARD Template Fix

## Issue

Individual purchase vouchers (voucher-URW6RM1A.pdf) were using the **OLD template** with:
- ❌ Basic layout (no "GREEN CARD" title)
- ❌ Centered CCDA logo only
- ❌ Plain passport number and voucher code display

Instead of the unified **GREEN CARD template** with:
- ✅ GREEN CARD title in green color
- ✅ Centered CCDA logo
- ✅ Professional layout with green borders and styling
- ✅ CODE128 barcode

## Root Cause

The `/backend/routes/buy-online.js` route was calling the OLD `generateVoucherPDF()` function instead of the NEW unified `generateVoucherPDFBuffer()` function.

There were **two PDF generation functions** in `backend/utils/pdfGenerator.js`:
1. `generateVoucherPDFBuffer()` - Unified GREEN CARD template (lines 8-252) ✅
2. `generateVoucherPDF()` - Old basic template (lines 471-593) ❌

## Files Changed

### `/backend/routes/buy-online.js`

**Line 21:** Changed import
```javascript
// OLD:
const { generateVoucherPDF } = require('../utils/pdfGenerator');

// NEW:
const { generateVoucherPDFBuffer } = require('../utils/pdfGenerator');
```

**Lines 404-408:** Updated PDF download endpoint
```javascript
// OLD:
const pdfBuffer = await generateVoucherPDF({
  ...voucher,
  barcode: barcodeDataUrl,
  qrCode: barcodeDataUrl
});

// NEW:
const pdfBuffer = await generateVoucherPDFBuffer([{
  ...voucher,
  barcode: barcodeDataUrl,
  qrCode: barcodeDataUrl
}]);
```

**Lines 475-479:** Updated PDF email endpoint
```javascript
// OLD:
const pdfBuffer = await generateVoucherPDF({
  ...voucher,
  barcode: barcodeDataUrl,
  qrCode: barcodeDataUrl
});

// NEW:
const pdfBuffer = await generateVoucherPDFBuffer([{
  ...voucher,
  barcode: barcodeDataUrl,
  qrCode: barcodeDataUrl
}]);
```

## Deployment Steps

### 1. Upload File via CloudPanel

Upload the updated file to production:
```
backend/routes/buy-online.js
```

**Destination path:**
```
/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js
```

### 2. Restart Backend

```bash
# Connect to server
ssh root@165.22.52.100

# Navigate to backend directory
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Verify file uploaded correctly
ls -lh routes/buy-online.js

# Restart backend
pm2 restart greenpay-api

# Monitor logs for errors
pm2 logs greenpay-api --lines 50
```

## Testing

### Test Case: Individual Purchase Voucher

1. **Create New Individual Purchase:**
   - Login as Counter_Agent
   - Navigate to Individual Purchase page
   - Enter passport details:
     ```
     Passport Number: N9876543
     Full Name: Jane Test Doe
     Nationality: United States
     Date of Birth: 1985-05-20
     Gender: Female
     Email: jane@example.com
     Phone: +675 98765432
     ```
   - Complete payment

2. **Download Voucher PDF**

3. **Verify GREEN CARD Template:**
   - [ ] ✅ CCDA logo centered at top
   - [ ] ✅ "GREEN CARD" title in green color
   - [ ] ✅ Voucher code displayed prominently
   - [ ] ✅ CODE128 barcode visible and centered
   - [ ] ✅ Passport number displayed in green bordered box
   - [ ] ✅ Professional layout with green styling
   - [ ] ❌ **NO QR code** (only for unregistered corporate vouchers)
   - [ ] ❌ **NO registration URL** (only for unregistered corporate vouchers)
   - [ ] ❌ **NO "Authorizing Officer" field** (only for corporate vouchers)
   - [ ] ✅ "Registered on [Date]" in footer

### Expected Result

Individual purchase vouchers should now match the unified GREEN CARD template used by corporate vouchers.

## Verification Commands

```bash
# Check file size to confirm template change
ssh root@165.22.52.100 "ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/buy-online.js"

# Check backend is running
ssh root@165.22.52.100 "pm2 list | grep greenpay-api"

# Monitor logs during testing
ssh root@165.22.52.100 "pm2 logs greenpay-api --lines 100"
```

## Summary

**Before:** Individual purchases used old template (no GREEN CARD branding)
**After:** Individual purchases use unified GREEN CARD template (professional, consistent branding)

All voucher types now use the **same unified GREEN CARD PDF template**:
- ✅ Corporate vouchers (unregistered): GREEN CARD template with QR code + URL + authorizing officer
- ✅ Corporate vouchers (registered): GREEN CARD template with passport + authorizing officer
- ✅ Individual purchases: GREEN CARD template with passport (NO authorizing officer)

**Deployment Status:** Ready to deploy
**Files to upload:** 1 file (`backend/routes/buy-online.js`)
**Database changes:** None
**Frontend changes:** None
