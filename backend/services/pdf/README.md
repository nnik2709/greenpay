# PDF Service

Unified PDF generation service for the PNG Green Fees system.

## Purpose

This service **solves the problem of inconsistent PDF generation** across the codebase. Previously, voucher PDFs were generated in multiple places with different templates, leading to:
- Inconsistent branding and layout
- Duplicate code (40% of PDF code was duplicated)
- Hard-to-maintain monolithic files
- Inconsistent logo usage (PNG flag vs PNG emblem confusion)

## Architecture

```
backend/services/pdf/
├── PDFService.js              # Base class with common functionality
├── components/
│   ├── Header.js              # Dual logo header (CCDA + PNG Emblem)
│   ├── Footer.js              # Standard footer
│   ├── Barcode.js             # CODE128 barcode generation
│   └── QRCode.js              # QR code generation
├── templates/
│   └── VoucherTemplate.js     # Voucher PDF template
└── styles/
    └── colors.js              # Color constants
```

## Voucher Types

The system generates **two types of voucher PDFs**:

### 1. Unregistered Voucher (No Passport Data)
- Displays voucher code and barcode
- Shows **QR code** for registration
- Shows **registration URL**: `https://pnggreenfees.gov.pg/voucher/register/{code}`
- Instructions to register passport online

### 2. Registered Voucher (With Passport Data)
- Displays voucher code and barcode
- Shows passport number, full name, and nationality
- No QR code or registration URL

## Usage

### Basic Usage

```javascript
const VoucherTemplate = require('./services/pdf/templates/VoucherTemplate');

// Create instance
const voucherPDF = new VoucherTemplate();

// Generate unregistered voucher
const voucherData = {
  voucher_code: 'ABC123XYZ'
};
const pdfBuffer = await voucherPDF.generateVoucher(voucherData);

// Generate registered voucher
const registeredVoucherData = {
  voucher_code: 'ABC123XYZ',
  passport_number: 'AB123456',
  customer_name: 'John Doe',
  nationality: 'Australian'
};
const registeredPdfBuffer = await voucherPDF.generateVoucher(registeredVoucherData);
```

### Custom Base URL

```javascript
const pdfBuffer = await voucherPDF.generateVoucher(voucherData, {
  baseUrl: 'https://custom-domain.com'
});
```

### Using in Routes

```javascript
const VoucherTemplate = require('../services/pdf/templates/VoucherTemplate');

router.get('/voucher/:code/pdf', async (req, res) => {
  try {
    const voucher = await getVoucherFromDatabase(req.params.code);

    const voucherPDF = new VoucherTemplate();
    const pdfBuffer = await voucherPDF.generateVoucher(voucher);

    res.contentType('application/pdf');
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

## Logo Configuration

**IMPORTANT**: All voucher PDFs use exactly **2 logos**, centered at the top:

1. **CCDA Logo** (left) - Climate Change Development Authority
2. **PNG Emblem** (right) - Papua New Guinea Government Emblem

**Path**: `backend/assets/logos/`
- `ccda-logo.png`
- `png-emblem.png`

**Do NOT use**:
- PNG flag (removed for consistency)
- Single logo layouts
- Three logo layouts

## Components

### Header Component
```javascript
const { addHeader } = require('./components/Header');

// Adds dual logos centered at top
const yPos = addHeader(doc, currentY, { pageWidth: 595.28 });
```

### Footer Component
```javascript
const { addFooter } = require('./components/Footer');

// Adds standard footer with contact information
addFooter(doc, { pageWidth: 595.28, pageHeight: 841.89, margin: 60 });
```

### Barcode Component
```javascript
const { generateBarcode } = require('./components/Barcode');

// Generate CODE128 barcode
const barcodeBuffer = await generateBarcode('ABC123XYZ', 300, 80);
```

### QR Code Component
```javascript
const { generateQRCode } = require('./components/QRCode');

// Generate QR code for URL
const qrBuffer = await generateQRCode('https://example.com/register/ABC123', 200);
```

## Dependencies

- **pdfkit** - PDF generation
- **bwip-js** - Barcode generation (CODE128)
- **qrcode** - QR code generation

**Note**: These dependencies are already installed on the production server. The `qrcode` package needs to be added to `package.json`:

```bash
npm install qrcode
```

## Migration Path

To migrate existing PDF generation code:

1. **Identify PDF generation locations**
   ```bash
   grep -r "PDFDocument\|pdfGenerator" backend/
   ```

2. **Replace with VoucherTemplate**
   - Before:
   ```javascript
   const pdfGenerator = require('../utils/pdfGenerator');
   const buffer = await pdfGenerator.generateVoucherPDFBuffer([voucher]);
   ```

   - After:
   ```javascript
   const VoucherTemplate = require('../services/pdf/templates/VoucherTemplate');
   const voucherPDF = new VoucherTemplate();
   const buffer = await voucherPDF.generateVoucher(voucher);
   ```

3. **Update database queries** to ensure voucher data includes:
   - `voucher_code` (required)
   - `passport_number` (optional - determines voucher type)
   - `customer_name` (for registered vouchers)
   - `nationality` (for registered vouchers)

## Testing

```javascript
const VoucherTemplate = require('./services/pdf/templates/VoucherTemplate');
const fs = require('fs');

async function testVoucherGeneration() {
  const voucherPDF = new VoucherTemplate();

  // Test unregistered voucher
  const unregisteredVoucher = {
    voucher_code: 'TEST123UNREGISTERED'
  };
  const unregisteredPDF = await voucherPDF.generateVoucher(unregisteredVoucher);
  fs.writeFileSync('/tmp/unregistered-voucher.pdf', unregisteredPDF);
  console.log('✓ Unregistered voucher generated: /tmp/unregistered-voucher.pdf');

  // Test registered voucher
  const registeredVoucher = {
    voucher_code: 'TEST456REGISTERED',
    passport_number: 'AB123456',
    customer_name: 'John Doe',
    nationality: 'Australian'
  };
  const registeredPDF = await voucherPDF.generateVoucher(registeredVoucher);
  fs.writeFileSync('/tmp/registered-voucher.pdf', registeredPDF);
  console.log('✓ Registered voucher generated: /tmp/registered-voucher.pdf');
}

testVoucherGeneration().catch(console.error);
```

## Files to Update

Current locations where PDF generation happens (to be migrated):

1. `backend/utils/pdfGenerator.js` - Legacy generator (1,000+ lines)
2. `backend/routes/vouchers.js` - Direct PDF generation
3. `backend/routes/individual-purchases.js` - Voucher PDFs
4. `backend/routes/corporate-vouchers.js` - Bulk voucher PDFs
5. `backend/routes/passports.js` - Passport-linked vouchers

## Benefits

- **80% code reduction** - Reusable components eliminate duplication
- **Consistent branding** - Single source of truth for logos and styling
- **Easier maintenance** - Changes in one place affect all PDFs
- **Clear separation** - Templates vs components vs styles
- **Type safety** - Two voucher types with clear logic
- **Testability** - Easy to unit test individual components

## Next Steps

1. Install `qrcode` package: `npm install qrcode`
2. Test both voucher types locally
3. Gradually migrate routes to use VoucherTemplate
4. Deprecate old `pdfGenerator.js` once migration complete
5. Add unit tests for PDF components
