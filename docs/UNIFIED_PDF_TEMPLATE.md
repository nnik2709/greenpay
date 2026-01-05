# Unified Voucher PDF Template - GREEN CARD

## Summary

All voucher PDFs across the system now use the same **GREEN CARD** template with conditional passport logic.

---

## Template Features

### 🎨 Design Elements
- **Logo Placeholders**: CCDA Logo (left) + PNG National Emblem (right)
- **Title**: Large "GREEN CARD" in green (#4CAF50)
- **Subtitle**: "Foreign Passport Holder"
- **Barcode**: Centered 400px QR code
- **Clean Layout**: Black & white with green accents

### 🔄 Conditional Logic

**WITH Passport Registered:**
```
Coupon Number: ABC12345
[QR CODE]
Passport Number:
AB1234567
```

**WITHOUT Passport (PENDING):**
```
Coupon Number: ABC12345
[QR CODE]
Scan to Register
https://greenpay.eywademo.cloud/register/ABC12345
```

---

## Files Modified

### ✅ Backend - PDF Generator (Core Template)

**File: `backend/utils/pdfGenerator.js`**

**Function 1: `generateVoucherPDF(voucher)`**
- Used for: Individual voucher generation
- Called by: Buy Online, Payment callbacks
- **Status**: ✅ Already using GREEN CARD template

**Function 2: `generateVoucherPDFBuffer(vouchers, companyName)`**
- Used for: Bulk/corporate voucher PDFs
- Called by: Corporate voucher downloads, invoice attachments
- **Status**: ✅ Updated to GREEN CARD template
- **Changes**:
  - Added logo placeholders
  - Added GREEN CARD title and styling
  - Added conditional passport logic
  - Added footer with company name and timestamp
  - Uses QR code generation for barcode

---

### ✅ Backend - Vouchers Route

**File: `backend/routes/vouchers.js`**

**Function: `generateVouchersPDF(vouchers, companyName)`**
- **Before**: Had its own PDF generation with old template
- **After**: Simple wrapper that calls `generateVoucherPDFBuffer()`
- **Status**: ✅ Refactored to use centralized template

**Code:**
```javascript
// OLD: ~100 lines of custom PDF generation
const generateVouchersPDF = async (vouchers, companyName) => {
  // Custom old template code...
};

// NEW: Centralized template
const generateVouchersPDF = async (vouchers, companyName) => {
  return generateVoucherPDFBuffer(vouchers, companyName);
};
```

**Benefits:**
- Single source of truth for template
- Automatic updates when template changes
- Consistent branding across all voucher types

---

## Voucher Types Covered

### ✅ 1. Individual Purchase Vouchers
- **Source**: `backend/routes/buy-online.js`
- **Function**: `generateVoucherPDF()`
- **Trigger**: After online payment completion
- **Passport Logic**: Shows passport if provided, otherwise shows registration link

### ✅ 2. Corporate Vouchers (Bulk)
- **Source**: `backend/routes/vouchers.js`
- **Function**: `generateVouchersPDF()` → calls `generateVoucherPDFBuffer()`
- **Trigger**: Corporate voucher download/email
- **Passport Logic**: Shows "Scan to Register" for all (corporate vouchers require separate registration)

### ✅ 3. Invoice-Attached Vouchers
- **Source**: `backend/routes/invoices-gst.js`
- **Function**: `generateVoucherPDFBuffer()`
- **Trigger**: Invoice email with voucher attachment
- **Passport Logic**: Shows "Scan to Register" for corporate batches

---

## API Endpoints That Generate PDFs

### Individual Vouchers
```
GET  /api/buy-online/voucher/:sessionId/pdf
POST /api/buy-online/voucher/:sessionId/email
```

### Corporate Vouchers
```
POST /api/vouchers/send-batch-email
GET  /api/vouchers/download-batch/:companyName
POST /api/vouchers/:id/send-single
```

### Invoice Vouchers
```
POST /api/invoices/:id/send
```

---

## Passport Registration Flow

### Scenario 1: Voucher WITH Passport
1. ✅ Customer purchases voucher online with passport details
2. ✅ PDF shows passport number prominently
3. ✅ Voucher is immediately ready to scan at airport
4. ✅ No registration step needed

### Scenario 2: Voucher WITHOUT Passport (PENDING)
1. ⚠️ Voucher purchased without passport (or corporate voucher issued)
2. ⚠️ PDF shows "Scan to Register" + URL
3. 👤 Customer scans QR or visits URL
4. 📝 Customer registers passport details
5. ✅ Voucher status changes from PENDING to active
6. ✅ Now ready to scan at airport

---

## Database Field Reference

### Voucher Tables
All voucher tables have `passport_number` field:

```sql
-- individual_purchases
passport_number TEXT  -- Actual passport OR 'PENDING'

-- Corporate vouchers (if table exists)
passport_number TEXT  -- Usually 'PENDING' until registered
```

### Template Logic
```javascript
const passportNumber = voucher.passport_number;
const hasPassport = passportNumber && passportNumber !== 'PENDING';

if (hasPassport) {
  // Show: Passport Number: AB1234567
} else {
  // Show: Scan to Register + URL
}
```

---

## Testing Checklist

### ✅ Test Individual Purchase (WITH Passport)
1. Go to `/buy-online`
2. Fill passport details
3. Complete test payment
4. Download voucher PDF
5. **Expected**: Shows passport number, no registration link

### ✅ Test Individual Purchase (WITHOUT Passport)
1. Go to `/buy-voucher` (simple purchase, no passport)
2. Complete payment
3. Download voucher PDF
4. **Expected**: Shows "Scan to Register" + registration URL

### ✅ Test Corporate Vouchers
1. Admin creates corporate voucher batch
2. Download batch as PDF or send via email
3. **Expected**: All vouchers show "Scan to Register" (corporate requires separate registration)

### ✅ Test Invoice Vouchers
1. Create invoice with vouchers
2. Send invoice via email
3. Check attached voucher PDF
4. **Expected**: Shows GREEN CARD template with registration link

---

## Deployment Instructions

### Files to Deploy

**Backend files:**
```
backend/utils/pdfGenerator.js  → /var/www/greenpay/backend/utils/
backend/routes/vouchers.js     → /var/www/greenpay/backend/routes/
```

**After uploading:**
```bash
cd /var/www/greenpay
pm2 restart greenpay-backend
pm2 logs greenpay-backend --lines 20
```

### Verification

1. **Test PDF Generation**:
   ```bash
   # Check backend logs for PDF generation
   pm2 logs greenpay-backend | grep -i "pdf\|voucher"
   ```

2. **Test Download Endpoints**:
   - Download individual voucher PDF
   - Download corporate batch PDF
   - Send test invoice with vouchers

3. **Verify Template**:
   - ✅ GREEN CARD title visible
   - ✅ Logo placeholders present
   - ✅ Conditional passport logic working
   - ✅ Registration URL correct format

---

## Rollback Plan

If issues occur:

```bash
# Restore backup
cd /var/www/greenpay
cp backend/utils/pdfGenerator.js.backup-YYYYMMDD backend/utils/pdfGenerator.js
cp backend/routes/vouchers.js.backup-YYYYMMDD backend/routes/vouchers.js
pm2 restart greenpay-backend
```

---

## Benefits of Unified Template

### ✅ Consistency
- All vouchers look the same
- Professional branding
- Reduced user confusion

### ✅ Maintainability
- Single template file to update
- Changes apply to all voucher types
- Less code duplication

### ✅ Features
- Conditional passport display
- Registration URL generation
- Logo placeholders ready for real logos
- Clean, modern design

---

## Next Steps (Optional)

### Add Real Logos
1. Download logo images:
   - CCDA Logo: `https://ccda.gov.pg/wp-content/uploads/2025/01/ccda-logo.jpeg`
   - PNG National Emblem: (provide image URL)

2. Update `pdfGenerator.js` to use `doc.image()` instead of placeholders

### Customize Colors/Fonts
- Edit `#4CAF50` (green) in template
- Change fonts from Helvetica to custom fonts
- Adjust spacing/margins

---

**Created**: December 15, 2025
**Status**: ✅ Complete & Ready for Deployment
**Impact**: All voucher PDFs standardized
**Frontend Changes**: ❌ None required
