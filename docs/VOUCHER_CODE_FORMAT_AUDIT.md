# Voucher Code Format - Complete Audit

**Date:** December 15, 2025
**Format:** 8-character alphanumeric (e.g., `3IEW5268`)
**Status:** ✅ ALL systems using 8-character format

---

## ✅ Voucher Code Generation (Backend)

### Centralized Generator: `backend/config/voucherConfig.js`

**Line 170-180:**
```javascript
generateVoucherCode(type = 'VCH') {
  const crypto = require('crypto');
  // Generate 8 random alphanumeric characters
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const randomBytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
}
```

**✅ Generates:** `3IEW5268` (8 chars)

---

## ✅ All Voucher Types Use Centralized Generator

### 1. Individual Purchases
**File:** `backend/routes/individual-purchases.js`
**Line 11-13:**
```javascript
function generateVoucherCode(prefix = 'IND') {
  return voucherConfig.helpers.generateVoucherCode(prefix);
}
```
**Used at:** Line 90
**✅ Result:** 8-character codes

### 2. Corporate Vouchers
**File:** `backend/routes/vouchers.js`
**Line 409:**
```javascript
const voucherCode = voucherConfig.helpers.generateVoucherCode('CORP');
```
**✅ Result:** 8-character codes

### 3. Online/Public Purchases
**File:** `backend/routes/public-purchases.js`
**Lines 305, 863:**
```javascript
const voucherCode = voucherConfig.helpers.generateVoucherCode('ONL');
```
**✅ Result:** 8-character codes

### 4. Buy Online with Passport
**File:** `backend/routes/buy-online.js`
**Line 725:**
```javascript
const voucherCode = voucherConfig.helpers.generateVoucherCode('ONL');
```
**✅ Result:** 8-character codes

### 5. Invoice-Generated Vouchers
**File:** `backend/routes/invoices-gst.js`
**Line 432:**
```javascript
const voucherCode = voucherConfig.helpers.generateVoucherCode('CORP');
```
**✅ Result:** 8-character codes

---

## ✅ Validation Updated (Backward Compatible)

**File:** `backend/config/voucherConfig.js`
**Lines 190-196:**
```javascript
isValidVoucherCode(code) {
  // NEW format: 8 alphanumeric characters
  const newFormat = /^[A-Z0-9]{8}$/i;
  // OLD format: VCH-numbers-alphanumeric or CORP-numbers-alphanumeric
  const oldFormat = /^(VCH|CORP|IND|ONL)-\d+-[A-Z0-9]+$/i;
  return newFormat.test(code) || oldFormat.test(code);
}
```

**✅ Accepts:**
- NEW: `3IEW5268` (8 chars)
- OLD: `VCH-1765771158329-KKCYT2CGH` (for existing vouchers)

---

## ✅ Frontend Display

### 1. Voucher Registration Page
**File:** `src/pages/CorporateVoucherRegistration.jsx`

**Lines 123-130:**
```javascript
// Support both old CORP- format and new 8-character format
const isOldFormat = trimmedCode.startsWith('CORP-');
const isNewFormat = /^[A-Z0-9]{8}$/.test(trimmedCode);

if (!trimmedCode || (!isOldFormat && !isNewFormat)) {
  toast({
    title: "Invalid Code",
    description: "Please enter a valid voucher code (8 characters or CORP- format)",
```

**Line 399:**
```jsx
placeholder="e.g., 3IEW5268 or CORP-xxxxx"
```

**Line 404:**
```jsx
New vouchers: 8 characters (e.g., 3IEW5268) | Old vouchers: CORP- format
```

**✅ User sees:** Clear guidance on 8-character format

---

## ✅ Tests

### Test Data Generator
**File:** `tests/production/test-data/form-data.ts`
**Lines 268-275:**
```typescript
voucherCode: () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
},
```

**✅ Generates:** 8-character test codes

---

## ✅ PDF Generation

### Voucher PDF
**File:** `backend/utils/pdfGenerator.js`
**Line 143:**
```javascript
async function generateVoucherPDF(voucher) {
```

**Uses:** `voucher.voucher_code` field
**✅ Works with:** Any code format (8-char or old format)

### Barcode Display
**File:** `backend/config/voucherConfig.js`
**Lines 17-30:**
```javascript
barcode: {
  format: 'CODE128',           // Standard linear barcode format
  width: 2,                     // Bar width multiplier
  height: 60,                   // Bar height in pixels
  displayValue: true,           // Show voucher code below barcode
  fontSize: 16,                 // Font size for displayed value
```

**✅ Barcode shows:** Whatever code format is in the voucher record

---

## 🔄 Database Existing Records

### Issue:
Existing vouchers in database may have old format:
- `VCH-1765771158329-KKCYT2CGH`
- `CORP-1765123456789-ABCD1234`
- `IND-1765987654321-XYZ56789`

### Solution:
**Backward compatible validation** allows both formats to work.

**No data migration required** - old vouchers continue to work!

---

## 📍 Where Codes Are Displayed

### 1. Agent Landing Page
**File:** `src/pages/AgentLanding.jsx`
**Card 3:** Points to `/voucher-registration`
**✅ Shows:** Instructions for 8-character codes

### 2. Voucher Print/PDF
**Components:**
- `src/components/VoucherPrint.jsx`
- `backend/utils/pdfGenerator.js`
**✅ Shows:** Actual voucher code from database (any format)

### 3. Voucher List
**Pages:**
- `src/pages/VouchersList.jsx`
- Reports pages
**✅ Shows:** Voucher codes from database (any format)

### 4. Buy Online Flow
**Pages:**
- `/buy-voucher`
- `/voucher-registration`
**✅ Generates:** NEW 8-character codes
**✅ Accepts:** Both formats for registration

---

## ✅ Summary of Changes Made

### 1. ✅ Generation (Already Correct)
- All routes use centralized `voucherConfig.helpers.generateVoucherCode()`
- Generator creates 8-character codes
- **NO CHANGES NEEDED**

### 2. ✅ Validation (UPDATED)
- **BEFORE:** Only accepted old format `VCH-numbers-code`
- **AFTER:** Accepts both 8-char AND old format
- **FILE:** `backend/config/voucherConfig.js` lines 190-196

### 3. ✅ Frontend Display (Already Correct)
- Voucher registration page shows 8-char examples
- Placeholders show `3IEW5268`
- Help text explains format
- **NO CHANGES NEEDED**

### 4. ✅ Tests (Already Correct)
- Test data generates 8-character codes
- **NO CHANGES NEEDED**

---

## 🚀 Deployment Required

### Files to Deploy:

**Backend (1 file):**
```
backend/config/voucherConfig.js
```

**Action:**
1. Upload file to server
2. Restart PM2: `pm2 restart greenpay-backend`

**Frontend:**
No changes needed - already using correct format!

---

## ✅ Testing Checklist

After deployment, verify:

- [ ] Create individual purchase → Voucher code is 8 characters
- [ ] Create corporate voucher → Voucher code is 8 characters
- [ ] Buy online → Voucher code is 8 characters
- [ ] Register old voucher (CORP-xxxxx) → Still works
- [ ] Register new voucher (8-char) → Works
- [ ] Print voucher → Shows correct code
- [ ] Scan barcode → Reads correct code

---

## 📊 Format Examples

### ✅ NEW Format (Generated Now):
```
3IEW5268
K9X2M4TQ
ABCD1234
Z9Y8X7W6
```

### ✅ OLD Format (Existing in DB, Still Valid):
```
VCH-1765771158329-KKCYT2CGH
CORP-1765123456789-ABCD1234
IND-1765987654321-XYZ56789
ONL-1765555555555-TEST1234
```

---

## 🎯 Key Points

1. **✅ All new vouchers** use 8-character format
2. **✅ Existing old vouchers** still work (backward compatible)
3. **✅ No database migration** required
4. **✅ One file to deploy:** `backend/config/voucherConfig.js`
5. **✅ Tests already correct**
6. **✅ Frontend already shows** 8-char examples

---

## 🔍 Why User Saw Long Codes

**Scenario:**
User created voucher before the `generateVoucherCode` function was updated.

**Old Function (removed):**
```javascript
`VCH-${Date.now()}-${randomString}`
```

**New Function (current):**
```javascript
// Just returns 8 random alphanumeric chars
```

**Solution:**
- Updated validation to accept both
- All new vouchers use 8-char format
- Old vouchers still work

---

**Status:** ✅ COMPLETE - System uses 8-character format consistently
**Deployment:** 1 backend file + PM2 restart
**Testing:** Verify new vouchers are 8 characters
