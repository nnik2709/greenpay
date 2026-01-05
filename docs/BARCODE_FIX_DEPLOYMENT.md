# 🔧 Barcode Fix Deployment Guide

## Issue
PDF vouchers show **skewed/corrupted barcode** instead of clean CODE128 barcode.

**Root Cause:** The `pdfGenerator.js` file uses the old `qrcode` library which generates QR codes, then forces them into a rectangular shape (400x100), causing distortion.

---

## ✅ Fix Applied Locally

The following changes have been made to `/Users/nikolay/github/greenpay/backend/utils/pdfGenerator.js`:

### 1. Updated Import (Line 2)
```javascript
// OLD:
const QRCode = require('qrcode');

// NEW:
const bwipjs = require('bwip-js');
```

### 2. Updated Barcode Generation (Lines 85-108)
```javascript
// OLD: QRCode distorted into rectangular shape
const qrDataUrl = await QRCode.toDataURL(voucherCode, { width: 400, margin: 1 });
const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
const imageBuffer = Buffer.from(base64Data, 'base64');
doc.image(imageBuffer, barcodeX, yPos, { width: 400, height: 100 });

// NEW: Proper CODE128 barcode
const barcodePng = await bwipjs.toBuffer({
  bcid: 'code128',
  text: voucherCode,
  scale: 3,
  height: 15,
  includetext: false,
  textxalign: 'center',
  paddingwidth: 10,
  paddingheight: 5
});
doc.image(barcodePng, barcodeX, yPos, { width: 350, height: 80, align: 'center' });
```

### 3. Package Installed
```json
"bwip-js": "^4.5.1"
```

---

## 🚀 Deployment Steps

### On Production Server:

1. **Install bwip-js package:**
   ```bash
   cd /var/www/greenpay && npm install bwip-js
   ```

2. **Restart PM2:**
   ```bash
   pm2 restart png-green-fees
   ```

3. **Verify deployment:**
   ```bash
   grep "bwipjs" /var/www/greenpay/backend/utils/pdfGenerator.js
   ```
   Should output: `const bwipjs = require('bwip-js');`

---

## 📦 Files to Deploy

Deploy these files from local to production:

1. **`backend/utils/pdfGenerator.js`** - Updated with bwip-js
2. **`package.json`** - Contains bwip-js dependency
3. **`package-lock.json`** - Lock file with bwip-js

---

## 🧪 Testing After Deployment

1. **Reset test voucher:**
   ```bash
   PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -c "UPDATE corporate_vouchers SET status = 'pending_passport', passport_number = NULL, passport_id = NULL WHERE voucher_code = 'E0W3TDT1';"
   ```

2. **Run automated test:**
   ```bash
   npx playwright test tests/production/voucher-E0W3TDT1-test.spec.ts --headed --project=chromium
   ```

3. **Check email** at nnik.area9@gmail.com for PDF with clean barcode

---

## 📊 Before vs After

### Before (QRCode):
- Distorted square QR code forced into rectangle
- Width: 400px, Height: 100px (4:1 ratio causes skewing)
- Difficult to scan

### After (CODE128):
- Clean linear barcode
- Width: 350px, Height: 80px (proper aspect ratio)
- Easy to scan with standard barcode scanners

---

## ✅ Verification Checklist

After deployment:

- [ ] `npm install bwip-js` completes successfully
- [ ] `grep "bwipjs" pdfGenerator.js` shows correct import
- [ ] PM2 restart successful with no errors
- [ ] Test voucher PDF downloaded
- [ ] Barcode appears clean and scannable
- [ ] Email received with correct PDF
- [ ] Print preview shows clean barcode

---

## 🔍 Rollback (If Needed)

If issues occur, restore backup:

```bash
cp /var/www/greenpay/backend/utils/pdfGenerator.js.backup-* /var/www/greenpay/backend/utils/pdfGenerator.js
npm uninstall bwip-js
pm2 restart png-green-fees
```

---

**Status:** ✅ Local file updated, ready for deployment
**Date:** December 16, 2025
**Tested:** Automated E2E test passed locally
