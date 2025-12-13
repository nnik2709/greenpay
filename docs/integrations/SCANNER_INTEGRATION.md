# Hardware Scanner Integration Guide

This document explains how the PNG Green Fees System integrates with USB keyboard wedge scanners for passport MRZ and QR/barcode scanning.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Phase 1: Core Infrastructure](#phase-1-core-infrastructure-completed)
3. [Phase 2: Page Integration](#phase-2-page-integration-next)
4. [Testing](#testing)
5. [Hardware Setup](#hardware-setup)
6. [Configuration](#configuration)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### What We Built (Phase 1)

✅ **Core Scanner Infrastructure**
- React hook for detecting keyboard wedge scanner input
- MRZ parser for passport data extraction
- Reusable scanner input component
- Configuration system for different scanner models
- Interactive test page

### How It Works

1. **USB keyboard wedge scanners** connect to the computer and act as keyboards
2. **No special drivers required** - they just type really fast
3. Our hook **detects rapid typing** (50-100ms between keystrokes)
4. **Auto-parses MRZ format** from passports (88 characters)
5. **Visual feedback** shows scanning status and success

### Supported Devices

- ✅ USB Passport MRZ scanners (keyboard wedge type)
- ✅ USB Barcode/QR scanners (keyboard wedge type)
- ✅ Bluetooth scanners (with slight latency adjustment)
- ✅ Any device that acts as a keyboard

---

## Phase 1: Core Infrastructure ✅ COMPLETED

### Files Created

| File | Purpose |
|------|---------|
| **`src/hooks/useScannerInput.js`** | React hook for scanner detection and processing |
| **`src/lib/mrzParser.js`** | ICAO-compliant MRZ parser |
| **`src/components/ScannerInput.jsx`** | Reusable input component with scanner support |
| **`src/lib/scannerConfig.js`** | Scanner hardware configuration profiles |
| **`src/pages/ScannerTest.jsx`** | Interactive testing page |

### What You Can Do Now

1. **Visit `/scanner-test` in your app** (requires login)
2. **Test with sample MRZ data** (provided on the page)
3. **See scan speed metrics** (chars/sec, duration)
4. **Adjust scanner settings** in real-time
5. **View scan history** with detailed metadata

---

## Phase 2: Page Integration (NEXT)

### Pages to Update

#### Priority 1: Critical Pages

**1. ScanAndValidate.jsx** (`src/pages/ScanAndValidate.jsx`)
- **Current:** Manual input field + camera scanner
- **Add:** `useScannerInput` hook integration
- **Benefit:** Fast voucher validation with external QR scanner
- **Impact:** High - used by IT_Support for validation

**2. IndividualPurchase.jsx** (`src/pages/IndividualPurchase.jsx`)
- **Current:** Paste event listener (unreliable)
- **Replace with:** `useScannerInput` with MRZ parsing
- **Benefit:** Auto-fill passport data from MRZ scan
- **Impact:** Very High - main data entry point

#### Priority 2: Additional Pages

**3. CreatePassport.jsx** (`src/pages/CreatePassport.jsx`)
- **Current:** No scanner support
- **Add:** MRZ scanning for auto-population
- **Impact:** Medium - reduces manual data entry errors

**4. PublicRegistration.jsx** (`src/pages/PublicRegistration.jsx`)
- **Current:** No scanner support
- **Add:** Voucher code + passport MRZ scanning
- **Impact:** High - improves customer experience

**5. CorporateExitPass.jsx** (`src/pages/CorporateExitPass.jsx`)
- **Similar to IndividualPurchase**
- **Add:** MRZ scanning for corporate vouchers
- **Impact:** Medium

### Integration Example

Here's how to add scanner support to any page:

```jsx
import { useScannerInput } from '@/hooks/useScannerInput';
import ScannerInput from '@/components/ScannerInput';

// In your component:
const MyComponent = () => {
  const handleScanComplete = (data) => {
    if (data.type === 'mrz') {
      // MRZ passport scan - auto-fill form
      setFormData({
        passportNumber: data.passportNumber,
        surname: data.surname,
        givenName: data.givenName,
        nationality: data.nationality,
        dob: data.dob,
        sex: data.sex,
        dateOfExpiry: data.dateOfExpiry
      });
    } else {
      // Simple barcode/QR scan
      handleSimpleScan(data.value);
    }
  };

  return (
    <ScannerInput
      onScanComplete={handleScanComplete}
      placeholder="Scan passport or enter manually..."
      enableMrzParsing={true}
      autoFocus={true}
    />
  );
};
```

---

## Testing

### 1. Test Without Hardware (Manual Testing)

**Visit:** `http://localhost:3000/scanner-test` (in dev mode)

**Steps:**
1. Log in as any user with Flex_Admin, IT_Support, or Counter_Agent role
2. Copy the sample MRZ data provided on the page
3. Click in the input field
4. Paste the MRZ data quickly (simulates scanner)
5. View parsed results in scan history

**Sample MRZ Data:**
```
P<PNGDOE<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<AB1234567PNG9001011M2512319<<<<<<<<<<<<<<<06
```

### 2. Test With Hardware (When Available)

**Steps:**
1. Connect your USB scanner to the computer
2. Wait for device recognition (should be instant)
3. Visit `/scanner-test`
4. Click in the "Test Scanner Input" field
5. Scan a passport MRZ or barcode
6. Check scan speed in history (should be 200-500 chars/sec)

**Expected Results:**
- ✅ Scan completes in 100-300ms
- ✅ MRZ data parsed correctly
- ✅ Success beep/visual feedback
- ✅ Data appears in history

### 3. Debug Mode

Enable debug logging to troubleshoot:

```javascript
// In scannerConfig.js, change:
debugMode: true

// Or in ScannerTest page, toggle "Debug Mode" switch
// Then check browser console for detailed logs
```

---

## Hardware Setup

### What You Need

1. **Passport MRZ Scanner**
   - Type: USB keyboard wedge
   - Output: 88-character MRZ string
   - Example models: Honeywell 1900, Zebra DS457, Datalogic Gryphon

2. **QR/Barcode Scanner** (for voucher codes)
   - Type: USB or Bluetooth keyboard wedge
   - Output: Plain text voucher code
   - Example models: Zebra DS2208, Honeywell Voyager 1200g

### Setup Instructions

1. **Plug in USB scanner** (or pair Bluetooth)
2. **Wait for recognition** (usually instant on Windows/Mac/Linux)
3. **No drivers needed** - it acts as a keyboard
4. **Test in text editor** - scan should type text
5. **Test in app** - visit `/scanner-test`

### When You Receive Hardware

Once you have your scanners:

1. **Test the output format** in a text editor
2. **Measure scan speed** (use `/scanner-test`)
3. **Check for prefix/suffix characters** (some scanners add these)
4. **Note the model numbers** for documentation
5. **Update `scannerConfig.js`** if needed

Example - if your scanner adds prefix "]C1":
```javascript
// In scannerConfig.js:
prefixChars: ']C1',
```

---

## Configuration

### Scanner Profiles

Pre-configured profiles in `src/lib/scannerConfig.js`:

| Profile | Scan Timeout | Use Case |
|---------|--------------|----------|
| **generic** | 100ms | Most USB scanners |
| **professional** | 50ms | High-speed scanners (Honeywell, Zebra) |
| **budget** | 150ms | Entry-level scanners |
| **bluetooth** | 120ms | Wireless scanners (account for latency) |
| **testing** | 300ms | Manual testing (allows slow typing) |

### Key Settings

```javascript
{
  scanTimeout: 100,          // Max ms between keystrokes
  minLength: 5,              // Minimum chars for valid scan
  enableMrzParsing: true,    // Auto-parse passport MRZ
  enterKeySubmits: true,     // Some scanners auto-press Enter
  debugMode: false,          // Console logging
  prefixChars: '',           // Strip these from beginning
  suffixChars: '',           // Strip these from end
}
```

### Adjusting Settings

**Option 1: Real-time (Scanner Test Page)**
- Visit `/scanner-test`
- Use the configuration panel
- Adjust settings and test immediately

**Option 2: Code (Global Settings)**
- Edit `src/lib/scannerConfig.js`
- Change `DEFAULT_SCANNER_CONFIG`
- Restart dev server

**Option 3: Per-Component (Page-Specific)**
```jsx
<ScannerInput
  scanTimeout={120}
  minLength={3}
  debugMode={true}
  // ... other props
/>
```

---

## Troubleshooting

### Scans Not Detected

**Problem:** Scanner types but system doesn't recognize it as a scan

**Solutions:**
1. ✅ Increase `scanTimeout` (try 150ms or 200ms)
2. ✅ Decrease `minLength` (try 3 instead of 5)
3. ✅ Enable `debugMode` to see console logs
4. ✅ Test in different browser (Chrome/Firefox/Edge)
5. ✅ Check if scanner is in "keyboard wedge" mode

### MRZ Parsing Fails

**Problem:** Scan detected but MRZ not parsed

**Solutions:**
1. ✅ Check MRZ length (must be exactly 88 characters)
2. ✅ Verify MRZ starts with "P<" (passport identifier)
3. ✅ Test with sample MRZ on scanner test page
4. ✅ Enable `showRawData` to see exact scan output
5. ✅ Check for extra prefix/suffix characters

### Scanner Too Fast/Slow

**Problem:** Scan speed metrics show unexpected values

**Solutions:**
- **Too fast** (>500 chars/sec): Increase `scanTimeout` to 50ms
- **Too slow** (<100 chars/sec): Check USB connection, try different port
- **Inconsistent**: Use "professional" or "budget" profile instead of "generic"

### Duplicate Scans

**Problem:** Same scan appears multiple times

**Solutions:**
1. ✅ Don't hold scanner button down
2. ✅ Single quick press/trigger
3. ✅ Scan completes immediately
4. ✅ System has duplicate prevention (2-second window)

### Scanner Not Working in Production

**Problem:** Works in dev but not production

**Solutions:**
1. ✅ Check HTTPS (required for some features, but keyboard input works on HTTP too)
2. ✅ Verify scanner profile matches production scanner
3. ✅ Test on actual production hardware
4. ✅ Check browser console for errors

---

## Next Steps

### Immediate (When You Get Hardware)

1. ✅ Connect scanners and test output format
2. ✅ Visit `/scanner-test` and verify functionality
3. ✅ Adjust `scannerConfig.js` settings if needed
4. ✅ Document your specific scanner models

### Phase 2 (Integration)

1. ✅ Update `ScanAndValidate.jsx` for QR scanner
2. ✅ Update `IndividualPurchase.jsx` for MRZ scanner
3. ✅ Test with real passport data
4. ✅ Deploy to production

### Optional Enhancements

- Add scanner selection UI (if multiple scanners)
- Add audio/haptic feedback customization
- Add scanner logs to admin dashboard
- Add check digit validation for MRZ
- Add support for ID cards (different MRZ format)

---

## Support

For issues or questions:

1. **Check this document** first
2. **Visit `/scanner-test`** and enable debug mode
3. **Check browser console** for detailed logs
4. **Test in text editor** to verify scanner output
5. **Update `SCANNER_HARDWARE_INFO`** in `scannerConfig.js` with your model details

---

## Summary

✅ **Phase 1 Complete** - Core infrastructure ready
⏳ **Phase 2 Pending** - Page integration (waiting for hardware)
🎯 **Ready to Test** - Visit `/scanner-test` now
📦 **No Dependencies** - Uses standard keyboard events
🔌 **Plug & Play** - No drivers required

**You are ready to test as soon as the hardware arrives!** 🚀
