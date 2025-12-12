# Voucher Configuration Architecture

**Date:** December 12, 2025
**Purpose:** Centralized configuration system for vouchers across the entire application

---

## Problem Statement

Previously, voucher configuration was scattered across multiple files:
- ❌ Barcode settings defined in 5+ different components
- ❌ Validity period hardcoded in 3+ different places
- ❌ Styling and labels duplicated everywhere
- ❌ Changing one parameter required editing multiple files
- ❌ Risk of inconsistency between frontend and backend

**Example of scattered config:**
```javascript
// In VoucherPrint.jsx
JsBarcode(canvas, code, { format: 'CODE128', height: 60, fontSize: 16, ... });

// In PassportVoucherReceipt.jsx
JsBarcode(canvas, code, { format: 'CODE128', height: 60, fontSize: 16, ... });

// In buy-online.js
JsBarcode(canvas, code, { format: 'CODE128', height: 60, fontSize: 16, ... });

// Validity in buy-online.js
validUntil.setDate(validUntil.getDate() + 365);

// Validity fallback in PaymentSuccess.jsx
{voucher?.validUntil ? ... : '1 year'}
```

**Problem:** Change barcode height? Edit 5+ files. Change validity? Edit 3+ files.

---

## Solution: Centralized Configuration

### Architecture Overview

```
┌─────────────────────────────────────────────┐
│    Centralized Voucher Configuration        │
│                                             │
│  backend/config/voucherConfig.js            │
│  src/config/voucherConfig.js                │
│                                             │
│  Single Source of Truth for:                │
│  - Barcode settings                         │
│  - Validity periods                         │
│  - Display labels                           │
│  - Styling                                  │
│  - Helper functions                         │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│   Backend     │       │   Frontend    │
│   Components  │       │   Components  │
├───────────────┤       ├───────────────┤
│ • buy-online  │       │ • VoucherPrint│
│ • vouchers    │       │ • PassportRcp │
│ • PDF gen     │       │ • PaySuccess  │
│ • Email       │       │ • IndivPurch  │
└───────────────┘       └───────────────┘
```

---

## Configuration Files

### Backend: `backend/config/voucherConfig.js`

**Purpose:** Server-side configuration for voucher generation, validation, and PDF creation

**Sections:**
1. **barcode** - Barcode generation settings (CODE-128, dimensions, colors)
2. **validity** - Validity period (365 days, description)
3. **display** - Code format, labels, styling
4. **pdf** - PDF generation settings
5. **types** - Voucher types (Individual, Corporate, Online)
6. **statuses** - Voucher statuses (Valid, Used, Expired, Cancelled)
7. **helpers** - Utility functions

**Usage:**
```javascript
const voucherConfig = require('./config/voucherConfig');

// Generate barcode with centralized settings
JsBarcode(canvas, code, voucherConfig.barcode);

// Calculate validity
const validUntil = voucherConfig.helpers.calculateValidUntil();

// Generate voucher code
const code = voucherConfig.helpers.generateVoucherCode('ONL');
```

---

### Frontend: `src/config/voucherConfig.js`

**Purpose:** Client-side configuration for voucher display and UI

**Sections:**
1. **barcode** - Barcode display settings + Tailwind classes
2. **validity** - Validity display settings
3. **display** - Labels, styling, Tailwind classes
4. **layout** - Component layout settings
5. **helpers** - Utility functions

**Usage:**
```javascript
import voucherConfig from '@/config/voucherConfig';

// Generate barcode with centralized settings
const options = voucherConfig.helpers.getBarcodeOptions();
JsBarcode(canvas, code, options);

// Display validity
const validityText = voucherConfig.helpers.formatDate(validUntil);

// Use centralized labels
<p>{voucherConfig.display.labels.scanInstruction}</p>
```

---

## Configuration Structure

### Barcode Configuration

```javascript
barcode: {
  format: 'CODE128',           // ← Change format once, affects everywhere
  width: 2,                     // ← Change bar width once
  height: 60,                   // ← Change height once
  displayValue: true,           // ← Show/hide code below barcode
  fontSize: 16,                 // ← Change font size once
  margin: 10,
  background: '#ffffff',
  lineColor: '#000000',
  canvas: {                     // Backend only
    width: 400,
    height: 120
  },
  // Frontend only
  className: '...',             // Tailwind classes
  containerClass: '...',
  imageClass: '...'
}
```

**Used by:**
- Backend: `buy-online.js`, `vouchers.js`, `pdfGenerator.js`
- Frontend: `VoucherPrint.jsx`, `PassportVoucherReceipt.jsx`, `PaymentSuccess.jsx`

---

### Validity Configuration

```javascript
validity: {
  durationDays: 365,            // ← Change validity once (1 year)
  description: '1 year',        // ← Change description once
  fallbackText: '1 year'        // Frontend only
}
```

**Used by:**
- Backend: `buy-online.js` (line 680), `individual-purchases.js`, `corporate-vouchers.js`
- Frontend: `PaymentSuccess.jsx`, `VoucherPrint.jsx`, `IndividualPurchase.jsx`

---

### Display Configuration

```javascript
display: {
  labels: {
    scanInstruction: 'Scan barcode at gate',     // ← Change once
    presentInstruction: '...',
    validityLabel: 'Valid Until',
    codeLabel: 'Voucher Code',
    statusValid: '✓ VALID'
  },
  styling: {
    primaryColor: '#10b981',                     // ← Change colors once
    primaryColorDark: '#059669',
    // ... Tailwind classes
  }
}
```

**Used by:**
- All frontend components that display vouchers
- PDF generator for consistent styling

---

## Benefits

### 1. Single Source of Truth

```javascript
// BEFORE: Change in 5+ files
VoucherPrint.jsx:     height: 60
PassportReceipt.jsx:  height: 60
buy-online.js:        height: 60
vouchers.js:          height: 60
pdfGenerator.js:      height: 60

// AFTER: Change in 1 file
voucherConfig.js:     height: 60
// All components automatically updated
```

### 2. Consistency Guaranteed

```javascript
// Backend
const barcodeOptions = voucherConfig.barcode;
JsBarcode(canvas, code, barcodeOptions);

// Frontend
const barcodeOptions = voucherConfig.helpers.getBarcodeOptions();
JsBarcode(canvas, code, barcodeOptions);

// Result: Identical barcodes everywhere
```

### 3. Easy Customization

**Change barcode height from 60px to 80px:**
```javascript
// Edit only this:
barcode: {
  height: 80  // Was 60
}

// Affected automatically:
// - All voucher components (frontend)
// - PDF generation (backend)
// - Email attachments (backend)
// - Payment success page (frontend)
```

**Change validity from 1 year to 2 years:**
```javascript
// Edit only this:
validity: {
  durationDays: 730,      // Was 365
  description: '2 years'  // Was '1 year'
}

// Affected automatically:
// - Voucher creation (backend)
// - Display text (frontend)
// - Validation logic (backend)
```

### 4. Type Safety with Helper Functions

```javascript
// Bad: Manual calculation everywhere
const validUntil = new Date();
validUntil.setDate(validUntil.getDate() + 365); // Magic number

// Good: Centralized helper
const validUntil = voucherConfig.helpers.calculateValidUntil();
// Uses configured duration, consistent everywhere
```

### 5. Easy Testing

```javascript
// Test with different configurations
const testConfig = {
  ...voucherConfig,
  validity: { durationDays: 7 } // Test with 7 days
};

// All functions use test config
const validUntil = testConfig.helpers.calculateValidUntil();
```

---

## Migration Strategy

### Phase 1: Create Config Files ✅ DONE
- Created `backend/config/voucherConfig.js`
- Created `src/config/voucherConfig.js`

### Phase 2: Update Core Components (TODO)
1. Update `backend/routes/buy-online.js` to use config
2. Update `src/components/VoucherPrint.jsx` to use config
3. Update `src/components/PassportVoucherReceipt.jsx` to use config
4. Update `src/pages/PaymentSuccess.jsx` to use config

### Phase 3: Update Supporting Files (TODO)
5. Update `backend/utils/pdfGenerator.js` to use config
6. Update `backend/routes/vouchers.js` to use config
7. Update `src/pages/IndividualPurchase.jsx` to use config
8. Update `src/pages/CorporateExitPass.jsx` to use config

### Phase 4: Update Services (TODO)
9. Update `src/lib/individualPurchasesService.js` to use config
10. Update `src/lib/corporateVouchersService.js` to use config

### Phase 5: Testing & Documentation (TODO)
11. Test all voucher flows
12. Update documentation
13. Create migration guide

---

## Implementation Examples

### Example 1: Update buy-online.js

**BEFORE:**
```javascript
// Scattered configuration
function generateBarcodeDataURL(code) {
  const canvas = createCanvas(400, 120);
  JsBarcode(canvas, code, {
    format: 'CODE128',
    width: 2,
    height: 60,
    displayValue: true,
    fontSize: 16,
    margin: 10,
    background: '#ffffff',
    lineColor: '#000000'
  });
  return canvas.toDataURL('image/png');
}

// Hardcoded validity
validUntil.setDate(validUntil.getDate() + 365);
```

**AFTER:**
```javascript
const voucherConfig = require('../config/voucherConfig');

// Use centralized configuration
function generateBarcodeDataURL(code) {
  const canvas = createCanvas(
    voucherConfig.barcode.canvas.width,
    voucherConfig.barcode.canvas.height
  );
  JsBarcode(canvas, code, voucherConfig.barcode);
  return canvas.toDataURL('image/png');
}

// Use helper function
const validUntil = voucherConfig.helpers.calculateValidUntil();
```

---

### Example 2: Update VoucherPrint.jsx

**BEFORE:**
```javascript
// Hardcoded settings
JsBarcode(canvas, voucher.voucher_code, {
  format: 'CODE128',
  width: 2,
  height: 60,
  displayValue: true,
  fontSize: 16,
  margin: 10,
  background: '#ffffff',
  lineColor: '#000000'
});

// Hardcoded label
<p>Scan the barcode or enter the code manually for validation.</p>
```

**AFTER:**
```javascript
import voucherConfig from '@/config/voucherConfig';

// Use centralized configuration
const barcodeOptions = voucherConfig.helpers.getBarcodeOptions();
JsBarcode(canvas, voucher.voucher_code, barcodeOptions);

// Use centralized label
<p>{voucherConfig.display.labels.scanInstruction}</p>
```

---

### Example 3: Update PaymentSuccess.jsx

**BEFORE:**
```javascript
// Hardcoded fallback text
{voucher?.validUntil
  ? new Date(voucher.validUntil).toLocaleDateString()
  : '1 year'}

// Hardcoded label
<p className="text-xs text-center text-slate-500 mt-2">
  Scan barcode at gate
</p>
```

**AFTER:**
```javascript
import voucherConfig from '@/config/voucherConfig';

// Use centralized helper
{voucherConfig.helpers.formatDate(voucher?.validUntil)}

// Use centralized label
<p className="text-xs text-center text-slate-500 mt-2">
  {voucherConfig.display.labels.scanInstruction}
</p>
```

---

## Configuration Reference

### All Configurable Parameters

| Parameter | Location | Default | Purpose |
|-----------|----------|---------|---------|
| `barcode.format` | Both | CODE128 | Barcode format |
| `barcode.width` | Both | 2 | Bar width multiplier |
| `barcode.height` | Both | 60 | Bar height (px) |
| `barcode.fontSize` | Both | 16 | Code text size |
| `validity.durationDays` | Both | 365 | Validity period |
| `validity.description` | Both | "1 year" | Human-readable |
| `display.labels.*` | Both | Various | UI text labels |
| `display.styling.*` | Frontend | Various | Colors, classes |
| `pdf.*` | Backend | Various | PDF settings |
| `types.*` | Backend | Various | Voucher types |
| `statuses.*` | Backend | Various | Voucher statuses |

---

## Testing Strategy

### Unit Tests

```javascript
// Test helper functions
describe('voucherConfig.helpers', () => {
  test('calculateValidUntil adds 365 days', () => {
    const start = new Date('2025-01-01');
    const end = voucherConfig.helpers.calculateValidUntil(start);
    expect(end).toEqual(new Date('2026-01-01'));
  });

  test('isExpired returns true for past dates', () => {
    const pastDate = new Date('2020-01-01');
    expect(voucherConfig.helpers.isExpired(pastDate)).toBe(true);
  });
});
```

### Integration Tests

```javascript
// Test voucher creation with config
test('Create voucher with configured validity', async () => {
  const voucher = await createVoucher({...});
  const expectedDate = voucherConfig.helpers.calculateValidUntil();
  expect(voucher.valid_until).toBeCloseTo(expectedDate);
});
```

---

## Future Enhancements

### 1. Environment-Based Configuration

```javascript
// Different configs for dev/staging/production
const config = process.env.NODE_ENV === 'production'
  ? productionConfig
  : developmentConfig;
```

### 2. Admin UI for Configuration

```javascript
// Allow admins to change settings via UI
POST /api/admin/voucher-config
{
  "validity": { "durationDays": 730 }, // Change to 2 years
  "barcode": { "height": 80 }           // Change height
}
```

### 3. Configuration Versioning

```javascript
// Track configuration changes over time
{
  version: '2.0',
  effectiveDate: '2026-01-01',
  changes: ['validity: 365 → 730 days']
}
```

### 4. Multi-Tenant Configuration

```javascript
// Different configs per organization
const config = getConfigForOrganization(orgId);
```

---

## Rollout Plan

### Step 1: Deploy Config Files (Current Step)
- ✅ Create `backend/config/voucherConfig.js`
- ✅ Create `src/config/voucherConfig.js`
- ⏳ Commit to repository

### Step 2: Update Components (Next Steps)
- Update buy-online routes
- Update voucher components
- Update PDF generator
- Test all flows

### Step 3: Remove Hardcoded Values
- Search for hardcoded "365"
- Search for hardcoded "CODE128"
- Search for hardcoded "height: 60"
- Replace with config references

### Step 4: Documentation
- Update CLAUDE.md
- Create developer guide
- Update API documentation

---

## Summary

### Before Centralization:
- ❌ Configuration scattered across 15+ files
- ❌ Risk of inconsistency
- ❌ Difficult to maintain
- ❌ Requires 5+ file edits for simple changes

### After Centralization:
- ✅ Single source of truth
- ✅ Guaranteed consistency
- ✅ Easy to maintain
- ✅ Change once, update everywhere
- ✅ Type-safe helper functions
- ✅ Environment-ready
- ✅ Testable

**Next Step:** Update components to use centralized configuration.

---

**End of Document**
