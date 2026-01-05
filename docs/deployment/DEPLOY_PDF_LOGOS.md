# Deploy PDF with Real Logos

## Summary

Updated voucher PDF template to use real CCDA and PNG National Emblem logos instead of placeholders.

---

## Changes Made

### ✅ **1. Downloaded Logos**

**CCDA Logo:**
- Source: `https://ccda.gov.pg/wp-content/uploads/2025/01/ccda-logo.jpeg`
- Saved to: `backend/assets/logos/ccda-logo.jpeg`
- Size: 15KB

**PNG National Emblem:**
- Source: `https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Coat_of_arms_of_Papua_New_Guinea.svg/500px-Coat_of_arms_of_Papua_New_Guinea.svg.png`
- Saved to: `backend/assets/logos/png-emblem.png`
- Size: 2KB

### ✅ **2. Updated PDF Generator**

**File: `backend/utils/pdfGenerator.js`**

**Changes:**
- Added `path` and `fs` imports for file access
- Replaced logo placeholder circles with actual `doc.image()` calls
- Added error handling for missing logo files
- Updated both functions:
  - `generateVoucherPDFBuffer()` - Bulk/corporate vouchers
  - `generateVoucherPDF()` - Individual vouchers

**Before (Placeholders):**
```javascript
// Circle with dashed border
doc.circle(leftLogoX + logoSize/2, logoY + logoSize/2, logoSize/2)
   .lineWidth(1)
   .dash(5, { space: 3 })
   .stroke('#999999');
doc.text('CCDA Logo', ...);
```

**After (Real Images):**
```javascript
// Real logo image
const ccdaLogoPath = path.join(__dirname, '../assets/logos/ccda-logo.jpeg');
if (fs.existsSync(ccdaLogoPath)) {
  doc.image(ccdaLogoPath, leftLogoX, logoY, {
    width: logoSize,
    height: logoSize,
    fit: [logoSize, logoSize]
  });
}
```

---

## Files to Deploy

### 1. Logo Files (NEW)
```
backend/assets/logos/ccda-logo.jpeg  → /var/www/greenpay/backend/assets/logos/
backend/assets/logos/png-emblem.png  → /var/www/greenpay/backend/assets/logos/
```

### 2. Updated PDF Generator
```
backend/utils/pdfGenerator.js  → /var/www/greenpay/backend/utils/
```

---

## Deployment Steps

### Step 1: Create Logo Directory on Server
```bash
ssh root@165.22.52.100
cd /var/www/greenpay
mkdir -p backend/assets/logos
exit
```

### Step 2: Upload Logo Files
```bash
scp backend/assets/logos/ccda-logo.jpeg root@165.22.52.100:/var/www/greenpay/backend/assets/logos/
scp backend/assets/logos/png-emblem.png root@165.22.52.100:/var/www/greenpay/backend/assets/logos/
```

### Step 3: Verify Logos Uploaded
```bash
ssh root@165.22.52.100 "ls -lh /var/www/greenpay/backend/assets/logos/"
```

**Expected output:**
```
-rw-r--r-- 1 root root  15K Dec 15 20:56 ccda-logo.jpeg
-rw-r--r-- 1 root root 2.0K Dec 15 20:56 png-emblem.png
```

### Step 4: Upload Updated PDF Generator
```bash
# Backup existing file
ssh root@165.22.52.100 "cd /var/www/greenpay && cp backend/utils/pdfGenerator.js backend/utils/pdfGenerator.js.backup-$(date +%Y%m%d-%H%M%S)"

# Upload new file
scp backend/utils/pdfGenerator.js root@165.22.52.100:/var/www/greenpay/backend/utils/
```

### Step 5: Restart Backend
```bash
ssh root@165.22.52.100 "cd /var/www/greenpay && pm2 restart greenpay-backend"
```

### Step 6: Verify Deployment
```bash
# Check backend logs
ssh root@165.22.52.100 "pm2 logs greenpay-backend --lines 30"

# Check PM2 status
ssh root@165.22.52.100 "pm2 status"
```

---

## Testing After Deployment

### Test 1: Download Individual Voucher PDF
1. Go to Buy Online page
2. Purchase test voucher
3. Download PDF
4. **Expected**: See CCDA logo (left) and PNG emblem (right) instead of placeholders

### Test 2: Download Corporate Voucher Batch
1. Admin creates corporate voucher batch
2. Download batch as PDF
3. **Expected**: All vouchers show real logos

### Test 3: Email with Voucher Attachment
1. Send voucher via email
2. Open attached PDF
3. **Expected**: Real logos visible

### Test 4: Check Logs for Errors
```bash
ssh root@165.22.52.100 "pm2 logs greenpay-backend --lines 50 | grep -i 'logo\|image\|error'"
```

**Expected**: No errors about missing logo files

---

## Rollback Plan

If logos don't display or cause issues:

```bash
# Restore backup
ssh root@165.22.52.100 "cd /var/www/greenpay && cp backend/utils/pdfGenerator.js.backup-YYYYMMDD-HHMMSS backend/utils/pdfGenerator.js && pm2 restart greenpay-backend"
```

This will restore placeholder circles until issue is resolved.

---

## Troubleshooting

### Issue: Logos Not Showing in PDF

**Possible Causes:**
1. Logo files not uploaded to server
2. Wrong file path
3. File permissions issue

**Solutions:**
```bash
# Check files exist
ssh root@165.22.52.100 "ls -la /var/www/greenpay/backend/assets/logos/"

# Check file permissions
ssh root@165.22.52.100 "chmod 644 /var/www/greenpay/backend/assets/logos/*"

# Check backend logs
ssh root@165.22.52.100 "pm2 logs greenpay-backend | grep -i logo"
```

### Issue: "File not found" Error

**Solution:**
Verify the `__dirname` path is correct:
```bash
ssh root@165.22.52.100
cd /var/www/greenpay
node -e "console.log(require('path').join(__dirname, 'backend/utils/../assets/logos/ccda-logo.jpeg'))"
```

### Issue: Images Distorted

**Solution:**
The `fit` option ensures images maintain aspect ratio. If distorted, adjust:
```javascript
doc.image(logoPath, x, y, {
  width: logoSize,
  height: logoSize,
  fit: [logoSize, logoSize],  // Ensures aspect ratio maintained
  align: 'center',
  valign: 'center'
});
```

---

## Future Enhancements

### Option 1: Add Authorizing Officer Signature
Update footer to include officer signature image:
```javascript
const signaturePath = path.join(__dirname, '../assets/signatures/officer.png');
doc.image(signaturePath, x, y, { width: 100 });
```

### Option 2: Add Watermark
Add background watermark for security:
```javascript
doc.image(watermarkPath, 0, 0, {
  width: pageWidth,
  height: pageHeight,
  opacity: 0.1
});
```

### Option 3: Replace Logos with Higher Resolution
- Download higher resolution versions
- Update file paths in code
- Test PDF quality

---

## Technical Details

### Logo Sizing
- Logo size: 80pt × 80pt
- Logo spacing: 140pt from center
- Position: Centered horizontally at top of page
- Fit mode: Maintains aspect ratio within 80×80 box

### Supported Image Formats
PDFKit supports:
- JPEG/JPG ✅ (CCDA logo)
- PNG ✅ (PNG emblem)
- PDF (for vector logos)

### Error Handling
- Graceful fallback: If logos missing, PDF still generates (just without logos)
- Errors logged to console but don't crash PDF generation
- `fs.existsSync()` checks prevent file-not-found errors

---

## Benefits

### ✅ Professional Appearance
- Official government branding
- No placeholder text/circles
- Print-ready quality

### ✅ Brand Consistency
- CCDA logo recognition
- PNG national identity
- Matches official documentation

### ✅ Security
- Harder to forge with real logos
- Official appearance deters fraud
- Watermark-ready for future

---

**Created**: December 15, 2025
**Status**: ✅ Ready for Deployment
**Impact**: Visual improvement to all voucher PDFs
**Frontend Changes**: ❌ None required
