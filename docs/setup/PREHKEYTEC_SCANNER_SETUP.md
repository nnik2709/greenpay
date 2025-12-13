# PrehKeyTec MC 147 A S Scanner Setup Guide

## Scanner Information

**Model:** PrehKeyTec MC 147 A S Autodetect
**Type:** USB Keyboard Wedge
**Manufacturer:** PrehKeyTec GmbH (Germany)
**Capabilities:** MRZ, 1D/2D Barcodes, QR Codes

## Good News!

✅ **Your scanner will work out of the box** with the current implementation!

The PrehKeyTec MC 147 A S is a professional keyboard wedge scanner that acts as a standard USB keyboard. No special drivers or configuration needed.

## How It Works

1. **Plug & Play:** Connect scanner via USB
2. **Automatic Detection:** Scanner detected as USB keyboard
3. **Scan Passport:** Position MRZ in scan area
4. **Instant Input:** Scanner types the MRZ data at ~30-50ms per character
5. **Auto-Parse:** Application detects fast typing and parses MRZ

## Application Configuration

The application now has a dedicated profile for your scanner:

```javascript
// In src/lib/scannerConfig.js
SCANNER_PROFILES.prehkeytec = {
  scanTimeout: 60,         // Optimized for PrehKeyTec speed
  enterKeySubmits: true,   // Handles Enter key after scan
  enableMrzParsing: true,  // Auto-parse MRZ format
  autoSubmit: true         // Auto-submit on scan complete
}
```

## Testing Your Scanner

### Step 1: Basic Test (Text Editor)
1. Open Notepad/TextEdit
2. Scan a passport
3. Verify output:
   - Should be exactly 88 characters
   - Two lines of 44 characters each
   - Starts with `P<` (e.g., `P<PNGSMITH<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<`)
   - All uppercase letters, numbers, and `<` symbols

### Step 2: Measure Scan Speed
1. Time how fast the scan completes
2. PrehKeyTec should complete 88 characters in ~2-4 seconds
3. If slower, may need to adjust `scanTimeout` setting

### Step 3: Check for Prefix/Suffix
Look for any extra characters:
- **At the start:** Some scanners add prefix like `]C1` or `]E0`
- **At the end:** Some scanners add Enter key or special characters

If you see extra characters, update the config:
```javascript
prefixChars: ']C1',  // Characters to remove from start
suffixChars: '\r\n'  // Characters to remove from end
```

### Step 4: Test in Application
1. Go to https://greenpay.eywademo.cloud/scanner-test
2. Scan a passport with your PrehKeyTec
3. Verify:
   - ✅ Scan detected automatically
   - ✅ MRZ parsed correctly
   - ✅ All fields populated (name, passport #, DOB, etc.)

## Scanner Configuration (If Needed)

The PrehKeyTec MC 147 A S usually comes pre-configured, but you can adjust settings if needed:

### Common Configuration Barcodes

Scan these barcodes from the PrehKeyTec manual to configure:

1. **Keyboard Wedge Mode** - Ensure scanner is in USB keyboard mode
2. **Add Enter After Scan** - Recommended for auto-submit
3. **Scan MRZ Format** - Should be enabled by default (autodetect)
4. **No Prefix/Suffix** - Recommended for cleanest data

Consult your PrehKeyTec manual for specific configuration barcodes.

## Application Pages That Support Scanner

The scanner will work automatically on these pages:

1. **Scanner Test Page** (`/scanner-test`)
   - Best place to verify scanner is working
   - Shows real-time scan detection
   - Displays parsed MRZ data

2. **Individual Purchase** (`/passports/create`)
   - Scan passport to auto-fill purchase form
   - Enter key in passport field, then scan

3. **Scan & Validate** (`/scan`)
   - Scan passport or voucher QR code
   - Validates and shows details

4. **Create Passport** (Manual entry pages)
   - Can scan to auto-fill form fields

## Troubleshooting

### Scanner Not Working?

**Problem:** Scan doesn't register in application

**Solutions:**
1. Verify scanner is recognized as USB keyboard (Device Manager/System Preferences)
2. Test in text editor first (see Step 1 above)
3. Check `/scanner-test` page for detailed diagnostics
4. Enable debug mode: Set `debugMode: true` in scanner config
5. Check browser console for scan detection logs

### Scan Detected But Not Parsed?

**Problem:** Application detects input but doesn't recognize as MRZ

**Possible causes:**
- MRZ length not exactly 88 characters
- Contains invalid characters (not A-Z, 0-9, or `<`)
- Prefix/suffix characters need to be configured

**Solution:**
1. Scan into text editor, count characters
2. Look for extra characters at start/end
3. Update `prefixChars` and `suffixChars` in config if needed

### Scan Too Fast/Slow?

**Problem:** Scanner speed doesn't match config

**Solution:**
Adjust `scanTimeout` in `/src/lib/scannerConfig.js`:

```javascript
// For very fast scans (< 2 seconds):
scanTimeout: 40

// For normal speed (2-3 seconds):
scanTimeout: 60  // Current default for PrehKeyTec

// For slower scans (> 3 seconds):
scanTimeout: 100
```

## Performance Tips

1. **Good Lighting:** Ensure passport is well-lit
2. **Flat Surface:** Place passport on flat, dark surface
3. **Steady Position:** Keep scanner steady during scan
4. **Clean Lens:** Wipe scanner lens regularly
5. **Direct Angle:** Hold scanner perpendicular to passport

## Scanner Capabilities

Your PrehKeyTec MC 147 A S can scan:

✅ **Passport MRZ** - Machine Readable Zone (2 lines, 88 chars)
✅ **QR Codes** - Voucher codes, payment codes
✅ **1D Barcodes** - Standard retail barcodes
✅ **2D Barcodes** - PDF417, Data Matrix, etc.
✅ **Auto-detect** - Automatically identifies format

## Next Steps

1. ✅ **Configuration Added** - PrehKeyTec profile now in application
2. **Test Scanner** - Visit `/scanner-test` to verify
3. **Deploy Update** - Rebuild and deploy frontend if needed
4. **Train Users** - Show staff how to use scanner

## Need Help?

If you encounter any issues:

1. Check `/scanner-test` page diagnostics
2. Review browser console logs (F12)
3. Verify scanner in text editor first
4. Check PrehKeyTec manual for configuration barcodes
5. Adjust `scanTimeout` if needed based on actual scan speed

---

**Summary:** Your PrehKeyTec MC 147 A S will work immediately with no changes required. The application is already configured to handle keyboard wedge scanners. Just plug it in and start scanning!
