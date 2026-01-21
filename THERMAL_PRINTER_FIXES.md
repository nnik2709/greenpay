# Thermal Printer & Auto-Scan Fixes
**Date**: January 21, 2026
**Status**: ✅ Fixed & Built

---

## Issues Fixed

### Issue 1: Route Not Found for "Print All"
**Problem**: Clicking "Print All" button after registration showed "route not found"

**Root Cause**: Button tried to open `/api/vouchers/bulk-print` which doesn't exist

**Solution**:
- Created new page `/app/voucher-print` that accepts multiple voucher codes
- Optimized specifically for 80mm thermal POS printers
- Button now navigates to: `/app/voucher-print?codes=CODE1,CODE2,CODE3`

---

### Issue 2: Error Scanning 5th Voucher
**Problem**: After scanning 5th voucher, got error "This voucher has already been registered"

**Root Cause**: Auto-scan callback didn't check if voucher was already registered before attempting to register again

**Solution**: Added duplicate registration check in auto-scan callback:
```javascript
// Check if already registered - prevent duplicate registration
if (wizardProgress.registeredVouchers.has(currentVoucher.id)) {
  console.log('[Auto-scan] Voucher already registered, skipping');
  return;
}
```

---

### Issue 3: Missing Completion Flow
**Problem**: After last passport scanned, should show all vouchers with "Print All to Thermal Printer" button

**Solution**: Completion screen already exists, just fixed the "Print All" button to:
- Navigate to proper route
- Styled as prominent green button with printer icon
- Labeled: "🖨️ Print All to Thermal Printer (5)"

---

## New Feature: Thermal Printer Page

**File**: `src/pages/VoucherPrintPage.jsx`

**Route**: `/app/voucher-print?codes=CODE1,CODE2,CODE3`

**Features**:
1. **80mm Thermal Printer Optimized**
   - Page width: 80mm exactly
   - Margin: 8mm padding, 5mm sides
   - Font sizes optimized for thermal printing
   - High-contrast black/white design

2. **Screen Preview**
   - Shows list of vouchers to be printed
   - Large green "Print All Vouchers" button
   - Count and status for each voucher
   - Back button to return to completion screen

3. **Print Layout** (what actually prints)
   - PNG Green Fees System header
   - Large voucher code in bordered box
   - CODE-128 barcode (high quality for scanning)
   - Voucher details table (passport, amount, validity, status)
   - Footer with contact info and timestamp
   - Page breaks between vouchers

4. **Print Styling**:
   ```css
   @page {
     size: 80mm auto;  /* Auto height for thermal roll */
     margin: 0;
   }
   ```

5. **Barcode Generation**:
   - Uses JsBarcode library
   - Format: CODE-128 (best for receipts)
   - Width: 4px, Height: 80px
   - White background, black bars

---

## User Flow After Fixes

### Old Flow (Broken):
```
1. Scan 5 passports
2. Last scan completes
3. Completion screen shows
4. Click "Print All" button
5. ❌ Route not found error
```

### New Flow (Fixed):
```
1. Scan 5 passports
2. Last scan completes (no duplicate error ✅)
3. Completion screen shows
4. Click "🖨️ Print All to Thermal Printer (5)"
5. ✅ Navigate to print page
6. ✅ See preview of all 5 vouchers
7. Click "Print All Vouchers"
8. ✅ Browser print dialog opens
9. Select thermal printer
10. ✅ All vouchers print sequentially
```

---

## Files Modified

### 1. `src/pages/IndividualPurchase.jsx`
**Changes**:
- Added duplicate registration check in auto-scan callback (line ~60)
- Fixed "Print All" button to navigate to `/app/voucher-print` (line ~246)
- Made button more prominent with green styling and printer icon

**Auto-scan fix**:
```javascript
// Before: Would try to register even if already registered
await api.post('/public-purchases/register-passport', {...});

// After: Checks first
if (wizardProgress.registeredVouchers.has(currentVoucher.id)) {
  return; // Skip if already registered
}
await api.post('/public-purchases/register-passport', {...});
```

**Print button fix**:
```javascript
// Before: Tried to use non-existent API route
window.open(`/api/vouchers/bulk-print?codes=${codes}`, '_blank');

// After: Navigate to proper page
navigate(`/app/voucher-print?codes=${codes}`);
```

### 2. `src/pages/VoucherPrintPage.jsx` (NEW)
**Purpose**: Dedicated page for thermal printer bulk printing

**Key Features**:
- Loads vouchers by codes from URL params
- Generates barcodes for all vouchers
- Shows screen preview with print button
- Optimized print layout for 80mm thermal
- Page breaks between vouchers
- Professional receipt-style formatting

### 3. `src/App.jsx`
**Changes**:
- Added lazy import for VoucherPrintPage
- Added route: `/app/voucher-print` with proper role protection

---

## Thermal Printer Specifications

**Tested For**: 80mm POS thermal printers (standard receipt printers)

**Print Settings**:
- **Width**: 80mm (fixed)
- **Height**: Auto (thermal roll)
- **Margins**: 0 (handled in page padding)
- **Font**: Arial (clear on thermal)
- **Barcode**: CODE-128 (standard for receipts)
- **Colors**: Black & White only (thermal printers don't support color)

**Page Layout**:
```
┌──────────────────────────┐
│  PNG GREEN FEES SYSTEM   │  (Header)
│  ────────────────────    │  (Divider)
│  AIRPORT EXIT VOUCHER    │  (Subtitle)
│                          │
│  ┌──────────────────┐   │  (Voucher Code Box)
│  │   X2KNKJ2B       │   │
│  └──────────────────┘   │
│                          │
│  ▐█▌▐█▌▐█▌▐█▌▐█▌▐█▌     │  (Barcode)
│                          │
│  Passport: 212312781     │  (Details Table)
│  Amount: PGK 50.00       │
│  Valid Until: Jul 20...  │
│  Status: VALID           │
│                          │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │  (Dashed line)
│  Cashier Climate Change  │  (Footer)
│  png.greenfees@ccda...   │
│  Printed: Jan 21, 2026   │
└──────────────────────────┘
```

**Paper Usage**: ~10-12cm per voucher (depending on details)

---

## Testing Steps

### Test 1: Single Voucher Print
1. Create 1 voucher
2. Register passport
3. On completion screen, click voucher code
4. Should see voucher details (existing functionality)

### Test 2: Multiple Vouchers - Thermal Print
1. Create 5 vouchers
2. Scan 5 passports with MRZ scanner
3. All 5 register successfully (no duplicate errors ✅)
4. Completion screen shows "🖨️ Print All to Thermal Printer (5)"
5. Click print button
6. Navigate to print page ✅
7. See preview of all 5 vouchers
8. Click "Print All Vouchers"
9. Browser print dialog opens
10. Select thermal printer (80mm POS printer)
11. Print completes with 5 sequential vouchers ✅

### Test 3: Duplicate Scan Prevention
1. Create 2 vouchers
2. Scan first passport - registers successfully
3. Scan same passport again on same voucher
4. Should skip with console message: "[Auto-scan] Voucher already registered, skipping"
5. No error toast shown ✅
6. Move to second voucher manually
7. Scan different passport - registers successfully

---

## Console Logs for Debugging

When duplicate scan detected:
```
[WebSerial] Complete scan data received
[WebSerial] Parsed MRZ: 212312781 NIKOLOV NIKOLAY STOYANOV
[Auto-scan] Voucher already registered, skipping: X2KNKJ2B
```

When print page loads:
```
Loading vouchers: X2KNKJ2B,004NCMD3,ABC123XY,DEF456ZZ,GHI789QQ
Vouchers loaded: 5
Barcodes generated: 5
```

---

## Browser Compatibility

**Print Page**:
- ✅ Chrome/Edge (full support)
- ✅ Firefox (full support)
- ✅ Safari (full support)
- ❌ Mobile browsers (print dialog limited)

**Thermal Printer Drivers**:
- Most modern 80mm thermal printers support browser printing
- Some require printer-specific drivers
- Test with your specific printer model

---

## Deployment

**Files to Upload via CloudPanel**:
- `/dist` folder → `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/`

**No backend changes needed** - all fixes are frontend-only

**Clear browser cache** after deployment (Ctrl+Shift+R)

---

## Future Enhancements (Optional)

1. **Direct ESC/POS Commands**: Send raw thermal printer commands for faster printing
2. **Batch Print Progress**: Show "Printing voucher 3 of 5..."
3. **Print Preview Modal**: Show what will print before opening print dialog
4. **Save as PDF**: Option to save all vouchers as single PDF file
5. **Email All**: Send all vouchers to customer email in one message
6. **Custom Page Size**: Allow user to configure printer width (58mm, 80mm, etc.)

---

**Ready to print! 🖨️**

The "Print All" button now works correctly and opens a thermal printer-optimized page with all registered vouchers.
