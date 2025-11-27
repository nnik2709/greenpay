# Camera MRZ Scanner - Current Status

## What Exists

✅ **CameraMRZScanner Component** (`src/components/CameraMRZScanner.jsx`)
- Already implemented and being used in Passports page
- Uses `html5-qrcode` library for camera access
- Has MRZ parsing logic built-in
- Mobile-friendly with camera switching support

## Current Limitation

❌ **html5-qrcode is for QR/Barcodes, NOT text OCR**
- The library scans QR codes and barcodes
- MRZ is plain text, not a barcode
- **Current implementation will NOT work for scanning passport MRZ text**

## What's Actually Needed for MRZ Text Scanning

To scan MRZ text from a passport using a mobile camera, you need **OCR (Optical Character Recognition)**:

### Option 1: Add Tesseract.js (Client-side OCR)
```bash
npm install tesseract.js
```

**Pros:**
- Works offline
- No backend required
- Free and open-source

**Cons:**
- Large library (~2MB)
- Slower processing (5-10 seconds)
- Accuracy depends on image quality
- Requires good lighting and steady hands

### Option 2: Use Keyboard Wedge Scanner (Recommended)
**This is what you already have working!**

The USB keyboard wedge scanner is:
- ✅ Fast (instant)
- ✅ Accurate (99.9%)
- ✅ No processing delay
- ✅ Works in any lighting
- ✅ Already implemented in `useScannerInput` hook

## Current Scanner Solution

You already have a **working scanner infrastructure**:

1. **USB Keyboard Wedge Scanners** - Primary method
   - Files: `src/hooks/useScannerInput.js`, `src/lib/mrzParser.js`
   - Used in: IndividualPurchase, ScanAndValidate pages
   - Status: ✅ Working

2. **Manual Entry** - Backup method
   - All passport forms have manual input fields
   - Status: ✅ Working

3. **Camera Scanner (Barcode)** - Currently doesn't work for MRZ
   - File: `src/components/CameraMRZScanner.jsx`
   - Uses: html5-qrcode (wrong tool for MRZ text)
   - Status: ❌ Won't work for MRZ text scanning

## Recommendation

### For Production Use:
1. **Primary:** USB Keyboard Wedge Scanner (already working)
2. **Backup:** Manual entry (already working)
3. **Don't implement camera OCR** because:
   - It's slow and unreliable
   - You already have 2 working methods
   - Users with broken scanners can use manual entry
   - Mobile users won't have USB scanners anyway, they'll use manual entry

### If You Still Want Camera OCR:

I can implement it, but be aware of the limitations:

**Steps required:**
1. Install Tesseract.js (`npm install tesseract.js`)
2. Update CameraMRZScanner to use OCR instead of barcode scanning
3. Add image preprocessing for better accuracy
4. Add retry logic and manual correction interface
5. Test extensively on different phones and lighting conditions

**Expected user experience:**
1. User opens camera
2. Aligns passport MRZ in frame
3. Takes photo (must be clear, well-lit, steady)
4. Wait 5-10 seconds for OCR processing
5. Review extracted data (may have errors)
6. Correct any errors manually
7. Submit

**Vs. current keyboard scanner:**
1. Scan passport
2. Done (1 second)

## Decision

Do you want me to:

**A)** Keep the current solution (USB scanner + manual entry) ✅ Recommended

**B)** Add Tesseract.js OCR for camera scanning (will add ~2MB to bundle, slower UX)

**C)** Remove the non-functional CameraMRZScanner component to avoid confusion

Let me know which option you prefer!
