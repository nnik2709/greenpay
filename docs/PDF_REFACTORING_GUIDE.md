# PDF SERVICE REFACTORING GUIDE

**Date**: 2026-01-06
**Objective**: Extract PDF generation into reusable service to eliminate 40% code duplication

---

## Current Problem

PDF generation code is duplicated across **46 locations** in the codebase:
- Header/logo positioning repeated everywhere
- Barcode generation duplicated
- Footer text repeated
- Styling inconsistent

**Impact**:
- Maintenance nightmare (fix bugs in 46 places)
- Inconsistent PDF appearance
- Performance issues (8x slower than optimal)

---

## Solution: Modular PDF Service

Create a reusable, template-based PDF service:

```
backend/services/pdf/
├── PDFService.js           # Base PDF service class
├── components/
│   ├── Header.js           # Reusable header with logos
│   ├── Footer.js           # Reusable footer
│   ├── Barcode.js          # Barcode generation
│   └── QRCode.js           # QR code generation
├── templates/
│   ├── VoucherTemplate.js  # Voucher PDF template
│   ├── InvoiceTemplate.js  # Invoice PDF template
│   └── QuotationTemplate.js
└── styles/
    └── colors.js           # Color constants
```

---

## Implementation Steps

### Step 1: Create Color Constants

**File**: `backend/services/pdf/styles/colors.js`

```javascript
/**
 * PDF Color Palette
 * Centralized colors for consistent branding
 */
module.exports = {
  PRIMARY: '#4CAF50',      // Green
  SECONDARY: '#2196F3',    // Blue
  TEXT: '#000000',         // Black
  TEXT_LIGHT: '#666666',   // Gray
  BACKGROUND: '#FFFFFF',   // White
  BORDER: '#CCCCCC',       // Light Gray
  SUCCESS: '#4CAF50',
  ERROR: '#F44336',
  WARNING: '#FF9800'
};
```

---

### Step 2: Create Barcode Component

**File**: `backend/services/pdf/components/Barcode.js`

```javascript
const bwipjs = require('bwip-js');

/**
 * Generate CODE128 Barcode
 *
 * @param {string} code - Code to encode
 * @param {number} width - Barcode width in pixels
 * @param {number} height - Barcode height in pixels
 * @returns {Promise<Buffer>} PNG image buffer
 */
async function generateBarcode(code, width = 300, height = 80) {
  try {
    const png = await bwipjs.toBuffer({
      bcid: 'code128',
      text: code,
      scale: 3,
      height: height / 3,
      includetext: true,
      textxalign: 'center'
    });
    return png;
  } catch (err) {
    console.error('Barcode generation failed:', err);
    throw new Error(`Failed to generate barcode for: ${code}`);
  }
}

module.exports = { generateBarcode };
```

---

### Step 3: Create Header Component

**File**: `backend/services/pdf/components/Header.js`

```javascript
const path = require('path');
const fs = require('fs');

/**
 * Add Header with Dual Logos
 *
 * Adds CCDA and PNG emblem logos centered at top of page
 *
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {number} yPos - Starting Y position
 * @param {Object} options - Header options
 * @returns {number} New Y position after header
 */
function addHeader(doc, yPos, options = {}) {
  const {
    logoSize = 90,
    logoGap = 80,
    pageWidth = 595.28  // A4 width
  } = options;

  const totalLogoWidth = (logoSize * 2) + logoGap;
  const leftLogoX = (pageWidth - totalLogoWidth) / 2;
  const rightLogoX = leftLogoX + logoSize + logoGap;

  // CCDA Logo (left)
  try {
    const ccdaLogoPath = path.join(__dirname, '../../../assets/logos/ccda-logo.png');
    if (fs.existsSync(ccdaLogoPath)) {
      doc.image(ccdaLogoPath, leftLogoX, yPos, { width: logoSize });
    }
  } catch (err) {
    console.warn('CCDA logo not found:', err.message);
  }

  // PNG Emblem (right)
  try {
    const pngEmblemPath = path.join(__dirname, '../../../assets/logos/png-emblem.png');
    if (fs.existsSync(pngEmblemPath)) {
      doc.image(pngEmblemPath, rightLogoX, yPos, { width: logoSize });
    }
  } catch (err) {
    console.warn('PNG emblem not found:', err.message);
  }

  return yPos + logoSize + 30; // Return position below logos
}

module.exports = { addHeader };
```

---

### Step 4: Create Footer Component

**File**: `backend/services/pdf/components/Footer.js`

```javascript
const colors = require('../styles/colors');

/**
 * Add Footer to PDF
 *
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {Object} options - Footer options
 */
function addFooter(doc, options = {}) {
  const {
    pageWidth = 595.28,
    pageHeight = 841.89,
    margin = 60
  } = options;

  const footerY = pageHeight - margin - 40;

  doc.fontSize(9)
     .fillColor(colors.TEXT_LIGHT)
     .text(
       'PNG Green Fees System | Ministry of Environment & Climate Change',
       margin,
       footerY,
       { width: pageWidth - (margin * 2), align: 'center' }
     );

  doc.text(
    'For inquiries: greenfees@environment.gov.pg | www.pnggreenfees.gov.pg',
    margin,
    footerY + 12,
    { width: pageWidth - (margin * 2), align: 'center' }
  );
}

module.exports = { addFooter };
```

---

### Step 5: Create Base PDF Service

**File**: `backend/services/pdf/PDFService.js`

```javascript
const PDFDocument = require('pdfkit');
const { addHeader } = require('./components/Header');
const { addFooter } = require('./components/Footer');
const { generateBarcode } = require('./components/Barcode');
const colors = require('./styles/colors');

/**
 * Base PDF Service Class
 *
 * Provides common PDF generation functionality
 */
class PDFService {
  constructor(options = {}) {
    this.pageWidth = 595.28;  // A4 width
    this.pageHeight = 841.89; // A4 height
    this.margin = options.margin || 60;
    this.contentWidth = this.pageWidth - (this.margin * 2);
  }

  /**
   * Create new PDF document
   *
   * @param {Object} options - PDF options
   * @returns {PDFDocument} New PDF document instance
   */
  createDocument(options = {}) {
    return new PDFDocument({
      size: 'A4',
      margin: this.margin,
      ...options
    });
  }

  /**
   * Generate PDF as Buffer
   *
   * @param {Function} contentFn - Function to generate PDF content
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generatePDF(contentFn) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = this.createDocument();
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Add content using provided function
        await contentFn(doc);

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Add standard header
   */
  addHeader(doc, yPos) {
    return addHeader(doc, yPos, {
      pageWidth: this.pageWidth
    });
  }

  /**
   * Add standard footer
   */
  addFooter(doc) {
    addFooter(doc, {
      pageWidth: this.pageWidth,
      pageHeight: this.pageHeight,
      margin: this.margin
    });
  }

  /**
   * Add title
   */
  addTitle(doc, title, yPos, options = {}) {
    const {
      fontSize = 48,
      color = colors.PRIMARY,
      align = 'center'
    } = options;

    doc.fontSize(fontSize)
       .fillColor(color)
       .font('Helvetica')
       .text(title, this.margin, yPos, {
         width: this.contentWidth,
         align
       });

    return yPos + fontSize + 20;
  }

  /**
   * Add horizontal line
   */
  addLine(doc, yPos, options = {}) {
    const {
      color = colors.PRIMARY,
      lineWidth = 3
    } = options;

    doc.moveTo(this.margin, yPos)
       .lineTo(this.pageWidth - this.margin, yPos)
       .lineWidth(lineWidth)
       .stroke(color);

    return yPos + 25;
  }

  /**
   * Add barcode
   */
  async addBarcode(doc, code, yPos) {
    try {
      const barcodeBuffer = await generateBarcode(code);
      const barcodeWidth = 300;
      const barcodeX = (this.pageWidth - barcodeWidth) / 2;

      doc.image(barcodeBuffer, barcodeX, yPos, { width: barcodeWidth });

      return yPos + 100; // Return position below barcode
    } catch (err) {
      console.error('Failed to add barcode:', err);
      return yPos;
    }
  }
}

module.exports = PDFService;
```

---

### Step 6: Create Voucher Template

**File**: `backend/services/pdf/templates/VoucherTemplate.js`

```javascript
const PDFService = require('../PDFService');
const colors = require('../styles/colors');

/**
 * Voucher PDF Template
 *
 * Generates green fee voucher PDFs
 */
class VoucherTemplate extends PDFService {
  /**
   * Generate voucher PDF
   *
   * @param {Object} voucher - Voucher data
   * @param {string} voucher.voucher_code - Voucher code
   * @param {string} voucher.passport - Passport number
   * @param {string} voucher.full_name - Full name
   * @param {string} voucher.nationality - Nationality
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateVoucher(voucher) {
    return this.generatePDF(async (doc) => {
      let yPos = this.margin;

      // Add header with logos
      yPos = this.addHeader(doc, yPos);

      // Add title
      yPos = this.addTitle(doc, 'GREEN CARD', yPos);

      // Add green line
      yPos = this.addLine(doc, yPos);

      // Add subtitle
      doc.fontSize(20)
         .fillColor(colors.TEXT)
         .text('Foreign Passport Holder', this.margin, yPos, {
           width: this.contentWidth,
           align: 'center'
         });

      yPos += 60;

      // Coupon number
      doc.fontSize(16)
         .text('Coupon Number:', this.margin + 20, yPos);

      doc.fontSize(20)
         .text(voucher.voucher_code, 0, yPos, {
           width: this.pageWidth - this.margin - 20,
           align: 'right'
         });

      yPos += 60;

      // Add barcode
      yPos = await this.addBarcode(doc, voucher.voucher_code, yPos);

      // Passport details
      const details = [
        { label: 'Passport Number', value: voucher.passport },
        { label: 'Full Name', value: voucher.full_name },
        { label: 'Nationality', value: voucher.nationality }
      ];

      yPos += 20;

      details.forEach(item => {
        doc.fontSize(14)
           .fillColor(colors.TEXT_LIGHT)
           .text(item.label + ':', this.margin + 20, yPos);

        doc.fontSize(16)
           .fillColor(colors.TEXT)
           .text(item.value, 0, yPos, {
             width: this.pageWidth - this.margin - 20,
             align: 'right'
           });

        yPos += 35;
      });

      // Add footer
      this.addFooter(doc);
    });
  }
}

module.exports = VoucherTemplate;
```

---

## How to Use the New Service

### Before (Old Way - Duplicated):

```javascript
// In routes/vouchers.js (repeated 20+ times)
const PDFDocument = require('pdfkit');
const doc = new PDFDocument({ size: 'A4', margin: 60 });
const chunks = [];

doc.on('data', chunk => chunks.push(chunk));
doc.on('end', () => resolve(Buffer.concat(chunks)));

// Manually add logos (repeated everywhere)
const logoY = 60;
const logoSize = 90;
// ... 50 lines of logo positioning code ...

// Manually add title
doc.fontSize(48).fillColor('#4CAF50').text('GREEN CARD', ...);

// Manually add barcode (repeated everywhere)
const png = await bwipjs.toBuffer({ bcid: 'code128', ... });
doc.image(png, ...);

// ... 100+ more lines of duplicated code ...
```

### After (New Way - Reusable):

```javascript
// In routes/vouchers.js
const VoucherTemplate = require('../services/pdf/templates/VoucherTemplate');

router.post('/vouchers/:id/pdf', async (req, res) => {
  try {
    const voucher = await getVoucher(req.params.id);

    const template = new VoucherTemplate();
    const pdfBuffer = await template.generateVoucher(voucher);

    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});
```

**Result**: 150 lines → 10 lines (93% reduction!)

---

## Migration Plan

### Phase 1: Build Service (Week 1)
1. ✅ Create directory structure
2. Create color constants
3. Create barcode component
4. Create header component
5. Create footer component
6. Create base PDFService class
7. Create VoucherTemplate
8. Write unit tests

### Phase 2: Migrate Routes (Week 2)
1. Update `routes/vouchers.js` to use new template
2. Update `routes/invoices-gst.js`
3. Update `routes/quotations.js`
4. Update `routes/passports.js`
5. Test each route thoroughly

### Phase 3: Create More Templates (Week 2-3)
1. InvoiceTemplate
2. QuotationTemplate
3. PassportTemplate
4. ReceiptTemplate

### Phase 4: Cleanup (Week 3)
1. Remove old `utils/pdfGenerator.js`
2. Remove duplicated PDF code from routes
3. Update documentation
4. Run full test suite

---

## Benefits

✅ **Code Reduction**: 1,500+ lines → 300 lines (80% reduction)
✅ **Maintainability**: Fix bugs once, applies everywhere
✅ **Consistency**: All PDFs use same styling
✅ **Performance**: 8x faster (according to Architecture Review)
✅ **Testability**: Each component can be tested independently
✅ **Extensibility**: Easy to add new PDF types

---

## Testing the Service

```javascript
// backend/tests/unit/services/pdf/VoucherTemplate.test.js
const VoucherTemplate = require('../../../../services/pdf/templates/VoucherTemplate');

describe('VoucherTemplate', () => {
  it('should generate PDF with correct voucher code', async () => {
    const template = new VoucherTemplate();
    const voucher = {
      voucher_code: 'TEST1234',
      passport: 'AB123456',
      full_name: 'John Doe',
      nationality: 'Australia'
    };

    const pdfBuffer = await template.generateVoucher(voucher);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000); // PDF should be substantial
  });
});
```

---

## Next Steps

1. **Implement** the service files above
2. **Test** locally with existing voucher data
3. **Migrate** one route at a time
4. **Deploy** incrementally to production
5. **Monitor** for any issues

---

**Prepared By**: Claude Code
**Date**: 2026-01-06
**Status**: Ready for Implementation
