# GREEN CARD Voucher Template Implementation

**Date:** December 12, 2025
**Commit:** 5f1ea9e
**Reference:** /Users/nikolay/Downloads/voucher_3IEW5268.pdf

---

## Overview

Complete redesign of the voucher system to match the official PNG government GREEN CARD template. All vouchers now display as professional "Foreign Passport Holder" documents with consistent government branding.

---

## Template Design Specification

### Visual Layout

```
┌─────────────────────────────────────────────┐
│                                             │
│     [PNG Logo]      [National Emblem]      │
│                                             │
│             GREEN CARD                      │
│    ──────────────────────────────           │
│                                             │
│      Foreign Passport Holder                │
│                                             │
│  Coupon Number:           3IEW5268          │
│                                             │
│         |||||||||||||||||||||||             │
│         |||||||||||||||||||||||             │
│         |||||||||||||||||||||||             │
│                                             │
│          Scan to Register                   │
│                                             │
│  https://pnggreenfees.gov.pg/voucher/...    │
│                                             │
│                                             │
│  ─────────────────────────────────────      │
│                                             │
│  EMILY MULINA              Generated on     │
│  Authorizing Officer       Oct 29, 2025...  │
└─────────────────────────────────────────────┘
```

### Design Elements

| Element | Specification |
|---------|--------------|
| **Page Size** | A4 (595.28 x 841.89 points) |
| **Margins** | 60pt all sides |
| **Logos** | Two circular placeholders, 50pt radius, centered at top |
| **Title** | "GREEN CARD" - 44pt, Helvetica Bold, #4CAF50, centered |
| **Title Line** | 3pt horizontal line, #4CAF50, full width |
| **Subtitle** | "Foreign Passport Holder" - 22pt, Helvetica Bold, centered |
| **Coupon Label** | "Coupon Number:" - 18pt, Bold, left-aligned |
| **Coupon Value** | 8-char code - 22pt, Bold, right-aligned, letter-spacing: 2px |
| **Barcode** | CODE-128, centered, 350px wide (PDF), 400px (HTML) |
| **CTA** | "Scan to Register" - 18pt, centered |
| **URL** | 12pt, gray (#666), centered |
| **Footer Line** | 1pt horizontal line, #CCC, above footer |
| **Officer Name** | 14pt, Bold, uppercase, left side |
| **Officer Title** | 11pt, gray (#666), below name |
| **Timestamp** | 10pt, gray (#666), right side |

---

## Implementation Files

### 1. Frontend: VoucherPrint.jsx

**Location:** `src/components/VoucherPrint.jsx`

**Purpose:** Print dialog for vouchers from individual/corporate purchase pages

**Key Changes:**
```javascript
// Barcode settings
JsBarcode(canvas, voucher.voucher_code, {
  format: 'CODE128',
  width: 3,        // Was 2
  height: 80,      // Was 60
  displayValue: false  // We show code separately
});

// Registration URL
const registrationUrl = `https://pnggreenfees.gov.pg/voucher/register/${voucher.voucher_code}`;

// Authorizing officer
const authorizingOfficer = voucher.created_by_name || 'AUTHORIZED OFFICER';
```

**HTML Structure:**
```jsx
<div className="voucher-printable">
  {/* Two logos */}
  <div className="logos">...</div>

  {/* GREEN CARD title */}
  <h1>GREEN CARD</h1>
  <div className="green-line"></div>

  {/* Subtitle */}
  <p>Foreign Passport Holder</p>

  {/* Coupon number */}
  <div className="coupon-row">
    <span>Coupon Number:</span>
    <span>{code}</span>
  </div>

  {/* Barcode */}
  <img src={barcodeDataUrl} />
  <p>Scan to Register</p>
  <p>{registrationUrl}</p>

  {/* Footer */}
  <div className="footer">
    <div>
      <p>{officer}</p>
      <p>Authorizing Officer</p>
    </div>
    <div>
      <p>Generated on {date}</p>
    </div>
  </div>
</div>
```

**Print Function:**
Creates a new window with standalone HTML/CSS matching the template exactly.

---

### 2. Frontend: PassportVoucherReceipt.jsx

**Location:** `src/components/PassportVoucherReceipt.jsx`

**Purpose:** Print dialog for passport-linked vouchers

**Changes:** Identical to VoucherPrint.jsx

**Why Separate:** Used in different contexts (passport purchases vs general vouchers), but both now use same GREEN CARD template for consistency.

---

### 3. Backend: pdfGenerator.js

**Location:** `backend/utils/pdfGenerator.js`

**Purpose:** Generate PDF vouchers for download/email

**Function:** `generateVoucherPDF(voucher)`

**Key Implementation:**
```javascript
async function generateVoucherPDF(voucher) {
  const doc = new PDFDocument({ size: 'A4', margin: 60 });

  // Logo placeholders (dashed circles)
  doc.circle(leftLogoX, logoY, 50)
     .dash(5, { space: 3 })
     .stroke('#cccccc');

  // GREEN CARD title
  doc.fontSize(44)
     .fillColor('#4CAF50')
     .font('Helvetica-Bold')
     .text('GREEN CARD', { align: 'center' });

  // Green line
  doc.moveTo(margin, yPos)
     .lineTo(pageWidth - margin, yPos)
     .lineWidth(3)
     .stroke('#4CAF50');

  // Barcode
  if (voucher.barcode) {
    const base64Data = voucher.barcode.replace(/^data:image\/png;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    doc.image(imageBuffer, x, y, { width: 350, height: 90 });
  }

  // Footer
  doc.text(authorizingOfficer.toUpperCase(), margin, yPos);
  doc.text('Authorizing Officer', margin, yPos + 18);
  doc.text(`Generated on ${dateString}`, 0, yPos + 10, {
    width: pageWidth - margin,
    align: 'right'
  });
}
```

**Barcode Requirement:** Voucher must have `barcode` field with base64 data URL.

---

## Data Flow

### Frontend Voucher Print

```
User clicks "Print Voucher"
    ↓
VoucherPrint dialog opens
    ↓
JsBarcode generates barcode from voucher_code
    ↓
Barcode set as base64 data URL
    ↓
Template rendered with all elements
    ↓
User clicks "Print"
    ↓
New window opens with standalone HTML
    ↓
Browser print dialog
```

### PDF Generation (Backend)

```
User clicks "Download PDF" or payment succeeds
    ↓
Backend receives voucher data
    ↓
buy-online.js generates barcode with JsBarcode/canvas
    ↓
Barcode added to voucher object as base64
    ↓
pdfGenerator.generateVoucherPDF(voucher)
    ↓
PDFKit creates GREEN CARD template
    ↓
Barcode embedded from voucher.barcode
    ↓
PDF buffer returned
    ↓
Download or email attachment
```

---

## Logo Integration

### Current State: Placeholders

Frontend components and PDF generator show dashed circle placeholders:
- Left circle: "PNG Govt Logo"
- Right circle: "National Emblem"

### Adding Actual Logos

**Step 1: Add logo files**
```bash
# Place logo files in appropriate locations
public/logos/png-govt-logo.png         # For frontend
public/logos/national-emblem.png       # For frontend

backend/assets/png-govt-logo.png       # For PDF generation
backend/assets/national-emblem.png     # For PDF generation
```

**Step 2: Update Frontend Components**

In `VoucherPrint.jsx` and `PassportVoucherReceipt.jsx`, replace placeholder divs (around line 300):

```jsx
// REPLACE THIS:
<div className="w-28 h-28 border-2 border-dashed...">
  PNG Govt<br/>Logo
</div>

// WITH THIS:
<img
  src="/logos/png-govt-logo.png"
  alt="PNG Government Logo"
  className="w-28 h-28 object-contain"
/>
```

**Step 3: Update PDF Generator**

In `pdfGenerator.js`, replace circle placeholders (around line 165):

```javascript
// REPLACE dashed circles WITH:
const fs = require('fs');
const path = require('path');

const leftLogoPath = path.join(__dirname, '../assets/png-govt-logo.png');
const rightLogoPath = path.join(__dirname, '../assets/national-emblem.png');

// Left logo
doc.image(leftLogoPath, leftLogoX - 50, logoY - 50, {
  width: 100,
  height: 100
});

// Right logo
doc.image(rightLogoPath, rightLogoX - 50, logoY - 50, {
  width: 100,
  height: 100
});
```

**Logo Specifications:**
- Format: PNG with transparency
- Size: 200x200px minimum (for good quality)
- Aspect: Square or circular
- Background: Transparent
- Color: Full color (no need for B&W)

---

## Voucher Code Format

The template now uses **8-character alphanumeric codes** (e.g., `3IEW5268`).

**Generation:** `voucherConfig.helpers.generateVoucherCode()`

**Display:**
- Label: "Coupon Number:" (official terminology)
- Format: 8 uppercase characters (A-Z, 0-9)
- Spacing: 2px letter-spacing for readability

---

## Registration URL

**Format:** `https://pnggreenfees.gov.pg/voucher/register/{CODE}`

**Example:** `https://pnggreenfees.gov.pg/voucher/register/3IEW5268`

**Purpose:**
- Allows users to manually register their voucher
- Provides alternative to barcode scanning
- Shows in both frontend and PDF templates

**Note:** This URL is for display purposes. Backend route implementation may differ.

---

## Authorizing Officer

**Field:** `voucher.created_by_name`

**Display:**
- Name shown in uppercase (e.g., "EMILY MULINA")
- Title: "Authorizing Officer"
- Position: Left side of footer

**Fallback:** "AUTHORIZED OFFICER" if created_by_name not available

**Source:** Should be populated from user creating the voucher:
```javascript
{
  voucher_code: '3IEW5268',
  created_by_name: 'Emily Mulina',  // From user.full_name or user.email
  created_at: '2025-10-29T09:53:00Z'
}
```

---

## Generation Timestamp

**Field:** `voucher.created_at`

**Format:** "Generated on {Month Day, Year, Hour:Minute AM/PM}"

**Example:** "Generated on October 29, 2025, 9:53 AM"

**Implementation:**
```javascript
const generationDate = new Date(voucher.created_at || new Date());
const dateOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
};
const dateString = generationDate.toLocaleString('en-US', dateOptions);
```

---

## Color Palette

| Element | Hex Code | RGB | Usage |
|---------|----------|-----|-------|
| **Green Primary** | `#4CAF50` | rgb(76, 175, 80) | Title, line, accents |
| **Black** | `#000000` | rgb(0, 0, 0) | Main text |
| **Dark Gray** | `#666666` | rgb(102, 102, 102) | Subtitle text, URL |
| **Light Gray** | `#CCCCCC` | rgb(204, 204, 204) | Lines, placeholders |
| **Placeholder** | `#999999` | rgb(153, 153, 153) | Placeholder text |

---

## Typography

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| **Title** | Helvetica | 44pt | Bold | Green |
| **Subtitle** | Helvetica | 22pt | Bold | Black |
| **Coupon Label** | Helvetica | 18pt | Bold | Black |
| **Coupon Value** | Helvetica | 22pt | Bold | Black |
| **CTA** | Helvetica | 18pt | Normal | Black |
| **URL** | Helvetica | 12pt | Normal | Gray |
| **Officer Name** | Helvetica | 14pt | Bold | Black |
| **Officer Title** | Helvetica | 11pt | Normal | Gray |
| **Timestamp** | Helvetica | 10pt | Normal | Gray |

---

## Barcode Specifications

### Frontend (JsBarcode)

```javascript
{
  format: 'CODE128',
  width: 3,              // Bar width multiplier
  height: 80,            // Bar height in pixels
  displayValue: false,   // Don't show code below (we display separately)
  margin: 10,            // Margin around barcode
  background: '#ffffff', // White background
  lineColor: '#000000'   // Black bars
}
```

**Canvas Size:** Auto-calculated by JsBarcode
**Output:** Data URL (`data:image/png;base64,...`)

### Backend (PDF)

**Embedded from:** `voucher.barcode` (base64 data URL)

**Dimensions:**
- Width: 350pt (approx 12.3cm)
- Height: 90pt (approx 3.2cm)

**Position:** Centered horizontally on page

---

## Testing Checklist

### Frontend Testing

- [ ] Individual Purchase → Create → Print Voucher
  - [ ] GREEN CARD title displays
  - [ ] 8-char coupon code shows correctly
  - [ ] Barcode generates and displays
  - [ ] "Scan to Register" text present
  - [ ] Registration URL shows full path
  - [ ] Authorizing officer name displays
  - [ ] Generation timestamp formatted correctly
  - [ ] Print preview opens correctly
  - [ ] Actual print works (Ctrl+P/Cmd+P)

- [ ] Corporate Voucher → Create → Print
  - [ ] Same GREEN CARD template
  - [ ] All elements present

- [ ] Passport Voucher Receipt
  - [ ] GREEN CARD template
  - [ ] Passport number included

### Backend Testing

- [ ] Buy Online → Payment Success → Download PDF
  - [ ] PDF opens correctly
  - [ ] GREEN CARD title renders
  - [ ] Barcode embedded correctly
  - [ ] All text elements present
  - [ ] Logo placeholders shown
  - [ ] Footer formatted correctly

- [ ] Email Voucher
  - [ ] PDF attached to email
  - [ ] PDF opens on mobile
  - [ ] PDF opens on desktop
  - [ ] All elements readable

### Cross-Browser Testing

- [ ] Chrome/Edge (Desktop)
- [ ] Firefox (Desktop)
- [ ] Safari (macOS)
- [ ] Safari (iOS)
- [ ] Chrome (Android)

---

## Known Issues & Limitations

### Logo Placeholders

**Issue:** Dashed circles instead of actual logos

**Reason:** Actual government logo files not provided

**Fix:** Add logo files and update components (see Logo Integration section)

**Impact:** Visual only, template functions correctly

### Print Margins

**Issue:** Some browsers may adjust margins during print

**Workaround:** Use "Print to PDF" for exact layout, then print the PDF

**Fix:** CSS `@page` rules (limited browser support)

### Mobile Print

**Issue:** Mobile browsers have limited print support

**Recommendation:** Use "Download PDF" button instead of "Print" on mobile

**Alternative:** Email voucher PDF for printing later

---

## Comparison: Old vs New

### Old Template

```
┌────────────────────────────────┐
│  🌿 PNG Green Fees             │
│  Environmental Exit Voucher    │
├────────────────────────────────┤
│                                │
│  Voucher Type: Individual      │
│  Passport: X12345678           │
│  Valid Until: 31/12/2025       │
│  Amount: PGK 50.00             │
│                                │
│  [Large Barcode]               │
│  VCH-12345-XYZ                 │
│  ✓ VALID                       │
│                                │
├────────────────────────────────┤
│  Instructions: Present at...   │
│  Issued by: PNG Dept...        │
└────────────────────────────────┘
```

**Problems:**
- Informal emoji (🌿)
- Too much information
- Not government-standard
- Two-column layout
- Generic appearance

### New Template (GREEN CARD)

```
┌────────────────────────────────┐
│  [Logo]        [Logo]          │
│                                │
│      GREEN CARD                │
│  ───────────────────           │
│                                │
│  Foreign Passport Holder       │
│                                │
│  Coupon Number:     3IEW5268   │
│                                │
│        [Barcode]               │
│                                │
│     Scan to Register           │
│  https://png...                │
│                                │
│  ─────────────────────         │
│  OFFICER           Date...     │
└────────────────────────────────┘
```

**Improvements:**
✅ Official government appearance
✅ Clean, minimal design
✅ Consistent branding
✅ Professional layout
✅ Clear call-to-action
✅ Single-column focus
✅ Matches government standards

---

## Future Enhancements

### 1. QR Code Addition

Add QR code alongside barcode for smartphone scanning:

```javascript
// Generate QR code from registration URL
const QRCode = require('qrcode');
const qrUrl = await QRCode.toDataURL(registrationUrl);

// Display in corner or back of voucher
```

### 2. Multi-Language Support

Add translations for common languages:
- English (default)
- Tok Pisin
- Hiri Motu

### 3. Watermark

Add security watermark:
```javascript
doc.fontSize(60)
   .fillColor('#f0f0f0')
   .opacity(0.1)
   .text('OFFICIAL', 0, 400, {
     angle: -45,
     align: 'center'
   });
```

### 4. Security Features

- Holographic overlay indication
- Serial number in footer
- Microtext border
- UV-reactive ink marker (print only)

### 5. Batch Printing

Optimize for printing multiple vouchers:
- Multiple vouchers per page
- Page breaks between vouchers
- Index/cover sheet

---

## Deployment Instructions

### Files to Deploy

**Frontend:**
```bash
dist/                    # Complete build output
```

**Backend:**
```bash
backend/utils/pdfGenerator.js
```

**Optional (Logos):**
```bash
public/logos/png-govt-logo.png
public/logos/national-emblem.png
backend/assets/png-govt-logo.png
backend/assets/national-emblem.png
```

### Deployment Steps

1. **Build Frontend:**
   ```bash
   npm run build
   ```

2. **Deploy Frontend:**
   ```bash
   # Copy dist/ to server
   scp -r dist/* user@server:/var/www/png-green-fees/dist/
   ```

3. **Deploy Backend:**
   ```bash
   # Copy updated PDF generator
   scp backend/utils/pdfGenerator.js user@server:/path/to/backend/utils/
   ```

4. **Restart Services:**
   ```bash
   pm2 restart png-green-fees
   ```

5. **Test:**
   - Create test voucher
   - Print to verify template
   - Download PDF to verify
   - Email voucher to verify attachment

### Rollback Plan

If issues occur:
```bash
git revert 5f1ea9e
npm run build
# Deploy previous version
```

---

## Support & Maintenance

### Common Issues

**Q: Logo placeholders showing instead of actual logos**
A: Add logo files to public/logos/ and backend/assets/, update components

**Q: Barcode not showing in PDF**
A: Ensure voucher.barcode field is populated with base64 data URL

**Q: Officer name showing "AUTHORIZED OFFICER"**
A: Populate voucher.created_by_name when creating voucher

**Q: Print margins different from preview**
A: Browser-specific, recommend "Print to PDF" then print PDF

**Q: Mobile print doesn't work**
A: Use "Download PDF" button on mobile instead

### Debug Mode

To debug voucher generation, add to browser console:
```javascript
// Check barcode generation
console.log('Voucher Code:', voucher.voucher_code);
console.log('Barcode Data URL:', barcodeDataUrl);

// Check PDF data
console.log('Voucher Object:', JSON.stringify(voucher, null, 2));
```

---

## Changelog

### Version 2.0 (December 12, 2025) - GREEN CARD Template

- Complete redesign to match official government template
- Added logo placeholders for government emblems
- Implemented "Coupon Number:" terminology
- Added "Scan to Register" instruction
- Added registration URL display
- Added authorizing officer in footer
- Added generation timestamp
- Increased barcode size (width: 3, height: 80)
- Changed from two-column to single-column layout
- Updated PDF generator with new template
- Updated all frontend voucher components

### Version 1.0 (Previous)

- Basic voucher template
- QR code support
- Two-column layout
- General voucher information

---

## Credits

**Template Design:** Based on official PNG government document
**Reference File:** /Users/nikolay/Downloads/voucher_3IEW5268.pdf
**Implementation:** Claude Code
**Date:** December 12, 2025

---

**End of Document**
