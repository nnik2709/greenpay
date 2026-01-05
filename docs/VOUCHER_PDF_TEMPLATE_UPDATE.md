# Voucher PDF Template Update

## Summary

Updated the voucher PDF generator to match the agreed GREEN CARD template with proper conditional logic for passport data.

---

## Files Modified

### 1. `backend/utils/pdfGenerator.js` ✅

**Changes Made:**
- ✅ Updated to GREEN CARD template (matches your reference image)
- ✅ Added logo placeholders at top (CCDA Logo left, PNG Emblem right)
- ✅ Removed all color backgrounds, kept black/white with green title
- ✅ Added authorizing officer name and generation date in footer
- ✅ **Conditional Logic:**
  - **WITH passport data**: Shows passport number prominently
  - **WITHOUT passport data**: Shows "Scan to Register" + registration URL

---

## Template Features

### Header Section
- **Two logo placeholders** at top (dashed circles)
  - Left: CCDA Logo placeholder
  - Right: PNG National Emblem placeholder
- **GREEN CARD** title (48pt, green color #4CAF50)
- Green horizontal line separator
- **Foreign Passport Holder** subtitle

### Body Section
- **Coupon Number**: Left-aligned label, right-aligned value
- **Barcode**: Centered, 400px wide
- **Conditional Section**:

  **SCENARIO A - Passport Attached** (passport_number exists and !== 'PENDING'):
  ```
  Passport Number:
  [PASSPORT NUMBER DISPLAYED]
  ```

  **SCENARIO B - No Passport** (passport_number is null or 'PENDING'):
  ```
  Scan to Register
  https://greenpay.eywademo.cloud/register/[VOUCHER_CODE]
  ```

### Footer Section
- Horizontal separator line
- **Left**: Authorizing Officer name (if available)
- **Right**: Generation timestamp

---

## Registration URL

The registration link in the PDF is:
```
https://greenpay.eywademo.cloud/register/{voucherCode}
```

### Registration Flow (PUBLIC - No Auth Required)

1. **Route**: `/register/:voucherCode`
2. **Component**: `src/pages/PublicRegistration.jsx`
3. **Access**: Public (no authentication required)
4. **Functionality**:
   - Validates voucher exists and is unregistered
   - Allows customer to enter passport details
   - Supports hardware MRZ scanner for auto-fill
   - Links passport to voucher
   - Updates voucher status to 'active'

### Testing Registration

```bash
# Test registration link (example)
https://greenpay.eywademo.cloud/register/3IEW5268
```

This should:
- Load registration form
- Allow passport data entry
- Submit and link passport to voucher
- Redirect to success page

---

## Deployment Instructions

### 1. Deploy Backend File

```bash
# Backup existing file
ssh root@165.22.52.100 "cd /var/www/greenpay && cp backend/utils/pdfGenerator.js backend/utils/pdfGenerator.js.backup-$(date +%Y%m%d-%H%M%S)"

# Upload new file
scp backend/utils/pdfGenerator.js root@165.22.52.100:/var/www/greenpay/backend/utils/

# Restart backend
ssh root@165.22.52.100 "cd /var/www/greenpay && pm2 restart greenpay-backend"
```

### 2. Verify Deployment

```bash
# Check backend logs
ssh root@165.22.52.100 "pm2 logs greenpay-backend --lines 50"

# Check service status
ssh root@165.22.52.100 "pm2 status"
```

---

## Testing Checklist

### Test 1: PDF with Passport Data ✅

1. **Query**: Find voucher with passport:
   ```sql
   SELECT voucher_code, passport_number FROM individual_purchases
   WHERE passport_number IS NOT NULL AND passport_number != 'PENDING'
   LIMIT 1;
   ```

2. **Action**: Download/print voucher PDF from admin panel or via API

3. **Expected Result**:
   - ✅ Shows "Passport Number: [NUMBER]"
   - ✅ Does NOT show "Scan to Register"
   - ✅ Does NOT show registration URL

### Test 2: PDF without Passport Data ✅

1. **Query**: Find voucher without passport:
   ```sql
   SELECT voucher_code FROM individual_purchases
   WHERE passport_number IS NULL OR passport_number = 'PENDING'
   LIMIT 1;
   ```

2. **Action**: Download/print voucher PDF

3. **Expected Result**:
   - ✅ Shows "Scan to Register"
   - ✅ Shows registration URL: `https://greenpay.eywademo.cloud/register/{CODE}`
   - ✅ Does NOT show passport number

### Test 3: Registration Link Works ✅

1. **Copy URL** from PDF (e.g., `https://greenpay.eywademo.cloud/register/ABC123`)

2. **Open in browser** (any user, no login required)

3. **Expected Result**:
   - ✅ Registration form loads
   - ✅ Voucher details displayed
   - ✅ Can enter passport data
   - ✅ Can submit successfully
   - ✅ Voucher status changes to 'active'

---

## Rollback Plan

If issues occur:

```bash
# Restore backup
ssh root@165.22.52.100 "cd /var/www/greenpay && cp backend/utils/pdfGenerator.js.backup-YYYYMMDD-HHMMSS backend/utils/pdfGenerator.js && pm2 restart greenpay-backend"
```

---

## Notes

### Logo Placeholders
Currently showing dashed circle placeholders for logos. To add real logos:

1. Download/save logo images to server:
   - CCDA Logo: `https://ccda.gov.pg/wp-content/uploads/2025/01/ccda-logo.jpeg`
   - PNG Emblem: (provide PNG national emblem image)

2. Update code to use `doc.image()` instead of placeholder circles

### Frontend Build
**NOT REQUIRED** - This is backend-only change (PDF generation).

---

## Related Files

- `backend/utils/pdfGenerator.js` - PDF generator (MODIFIED)
- `src/pages/PublicRegistration.jsx` - Registration page (existing, no changes)
- `src/pages/PublicRegistrationSuccess.jsx` - Success page (existing)
- `src/App.jsx` - Routes configuration (existing)

---

**Created**: December 15, 2025
**Status**: ✅ Ready for Deployment
**Frontend Build**: ❌ Not Required
