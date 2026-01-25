# GREEN CARD Styling Fix - Both Voucher Types
**Date:** January 25, 2026
**Status:** READY TO DEPLOY

---

## 🔍 Root Cause Analysis

### The Problem
The "GREEN CARD" header was showing as plain text instead of white text on green background.

### Why Previous Deployment Didn't Work
**We fixed the WRONG function!**

There are **TWO voucher PDF generation functions**:

1. **`generateVoucherPDFBuffer`** - Regular A4 voucher (used 99% of the time)
   - Size: A4 (595 x 841 points)
   - Shows logos at top
   - Large "GREEN CARD" text (48pt)
   - Used by: Download voucher, email voucher, print voucher
   - **This is what you were seeing in the PDF**

2. **`generateThermalReceiptPDF`** - Thermal printer receipt (rarely used)
   - Size: 80mm thermal paper
   - Compact layout for POS printers
   - Small logos
   - Used by: `/api/vouchers/:code/thermal-receipt` endpoint
   - **Frontend has NO button to download this!**

### What We Fixed Initially
- ✅ Fixed `generateThermalReceiptPDF` (thermal receipt) ← Nobody uses this
- ❌ Did NOT fix `generateVoucherPDFBuffer` (regular voucher) ← This is what everyone uses!

---

## ✅ Complete Fix Applied

### Function 1: `generateVoucherPDFBuffer` (Regular A4 Voucher)

**Location:** Line 45-60

**Before:**
```javascript
// GREEN CARD title
doc.fontSize(48)
   .fillColor('#4CAF50')  // Green text
   .font('Helvetica')
   .text('GREEN CARD', margin, yPos, { width: contentWidth, align: 'center' });

yPos += 65;

// Green line under title
doc.moveTo(margin, yPos)
   .lineTo(pageWidth - margin, yPos)
   .lineWidth(3)
   .stroke('#4CAF50');

yPos += 25;
```

**After:**
```javascript
// GREEN CARD title - white text on dark green background
const titleHeight = 60;
doc.rect(margin, yPos, contentWidth, titleHeight)
   .fillAndStroke('#2d5016', '#2d5016'); // Dark green background

doc.fontSize(48)
   .fillColor('#FFFFFF')  // White text
   .font('Helvetica-Bold')
   .text('GREEN CARD', margin, yPos + 10, { width: contentWidth, align: 'center' });

yPos += titleHeight + 25;
```

**Changes:**
- Added dark green background rectangle (#2d5016)
- Changed text color from green (#4CAF50) to white (#FFFFFF)
- Changed font from Helvetica to Helvetica-Bold
- Removed the green line separator (background provides separation)
- Adjusted spacing for better alignment

### Function 2: `generateThermalReceiptPDF` (Thermal Receipt)

**Location:** Line 949-960

**Before:**
```javascript
// Title
doc.fontSize(14)
   .fillColor('#000000')  // Black text
   .font('Helvetica-Bold')
   .text('GREEN CARD', margin, yPos, { width: contentWidth, align: 'center' });
yPos += 18;

// Separator line
doc.moveTo(margin, yPos)
   .lineTo(receiptWidth - margin, yPos)
   .lineWidth(1)
   .stroke('#000000');
yPos += 8;
```

**After:**
```javascript
// Title - GREEN CARD with white text on dark green background
const titleHeight = 20;
doc.rect(margin, yPos, contentWidth, titleHeight)
   .fillAndStroke('#2d5016', '#2d5016'); // Dark green background

doc.fontSize(14)
   .fillColor('#FFFFFF')  // White text
   .font('Helvetica-Bold')
   .text('GREEN CARD', margin, yPos + 4, { width: contentWidth, align: 'center' });
yPos += titleHeight + 3;

// No separator line needed - background provides separation
```

**Changes:**
- Added dark green background rectangle
- Changed text color from black to white
- Removed separator line
- Adjusted spacing

---

## 🚀 Deployment

### Deploy Updated File

```bash
# From local machine
scp deployment-package/pdfGenerator.js root@165.22.52.100:/tmp/

# SSH to server
ssh root@165.22.52.100

# Backup
cp /var/www/greenpay/backend/utils/pdfGenerator.js \
   /var/www/greenpay/backend/utils/pdfGenerator.js.backup-greencard-both

# Deploy
mv /tmp/pdfGenerator.js /var/www/greenpay/backend/utils/pdfGenerator.js
chown root:root /var/www/greenpay/backend/utils/pdfGenerator.js

# Restart PM2 (CRITICAL!)
pm2 restart greenpay-api

# Verify
pm2 logs greenpay-api --lines 20
```

Or use the deployment script:

```bash
cd deployment-package
./deploy-thermal-greencard.sh
```

---

## 🧪 Testing

### Test Regular Voucher (A4 - Most Common)

1. Go to any voucher in the system
2. Click "Download Voucher" or "Print Voucher"
3. Check the PDF
4. **Expected:** GREEN CARD with white text on dark green background

### Where Regular Vouchers Are Used:
- Individual Purchase vouchers
- Corporate voucher downloads
- Email voucher PDFs
- Print voucher page
- Voucher batch downloads

### Test Thermal Receipt (80mm - Rare)

**Note:** Frontend currently has NO button for thermal receipts!

To test thermal receipt:
1. Get a voucher code (e.g., "HIGPQ243")
2. Call API directly:
   ```
   GET /api/vouchers/HIGPQ243/thermal-receipt
   ```
3. Check the PDF
4. **Expected:** Compact thermal receipt with GREEN CARD background

---

## 📊 Affected Endpoints

### Regular Voucher PDF (`generateVoucherPDFBuffer`)
- `POST /api/corporate-vouchers/batch/:batchId/email` - Email vouchers to customer
- `GET /api/vouchers/batch/:batchId/download` - Download batch ZIP
- `POST /api/vouchers/:voucherCode/email` - Email single voucher
- All voucher print/download functions in frontend

### Thermal Receipt PDF (`generateThermalReceiptPDF`)
- `GET /api/vouchers/:voucherCode/thermal-receipt` - Thermal receipt download
- **No frontend UI for this currently**

---

## ✅ Verification Checklist

After deployment:

- [ ] Download a voucher PDF from Individual Purchase
- [ ] Download a voucher PDF from Corporate Vouchers
- [ ] Print a voucher from Voucher Print page
- [ ] Email a voucher to yourself
- [ ] Verify all show GREEN CARD with white text on green background
- [ ] Verify no green line appears under the text
- [ ] Verify spacing looks correct

---

## 🎨 Design Specs

**Background Color:** #2d5016 (Dark green)
**Text Color:** #FFFFFF (White)
**Font:** Helvetica-Bold
**Background Height:**
- Regular voucher: 60 points
- Thermal receipt: 20 points

This matches the reference image provided.

---

## 📝 Summary

**Problem:** GREEN CARD showing as plain text
**Root Cause:** Fixed thermal receipt function but everyone uses regular voucher function
**Solution:** Updated BOTH functions to use white text on dark green background
**Impact:** All voucher PDFs (A4 and thermal) now have correct GREEN CARD styling

**Status:** ✅ READY TO DEPLOY
**Priority:** HIGH - Affects all voucher downloads and prints
