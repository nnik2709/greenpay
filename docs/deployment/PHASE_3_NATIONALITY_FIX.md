# Phase 3 - Nationality Field Fix

## Issue Found

The form wasn't auto-filling because the server OCR was returning a 3-letter nationality code (e.g., "PNG") but the form expected the full country name (e.g., "Papua New Guinea").

## Root Cause

- **Python OCR Service** returns: `nationality: "PNG"` (3-letter ISO code)
- **Frontend parseMRZ** returns: `nationality: "Papua New Guinea"` (full name)
- **Form expects**: Full country name

The hybrid OCR implementation was missing the ISO code → full name conversion that the `parseMRZ` function does.

## Fix Applied

Updated `src/components/SimpleCameraScanner.jsx` line 1044-1048:

**Before:**
```javascript
return {
  passportNumber: result.data.passportNumber,
  surname: result.data.surname,
  givenName: result.data.givenName,
  nationality: result.data.nationality,  // ❌ This was "PNG" (3-letter code)
  ...
};
```

**After:**
```javascript
// Transform server response to match expected format
// Convert 3-letter nationality code to full country name
const nationalityCode = result.data.nationality;
const nationalityFullName = ISO_COUNTRY_CODES[nationalityCode] || nationalityCode;

return {
  passportNumber: result.data.passportNumber,
  surname: result.data.surname,
  givenName: result.data.givenName,
  nationality: nationalityFullName,  // ✅ Now "Papua New Guinea" (full name)
  ...
};
```

## Deployment

### Files to Upload

**Source:** `/Users/nikolay/github/greenpay/dist/`

**Destination:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/`

**Build Info:**
- Build time: 7.17 seconds
- Main bundle: 761.90 KB (238.51 KB gzipped)
- Status: ✅ Successfully built

### Deployment Steps

1. **Upload via CloudPanel:**
   - Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/`
   - Delete or rename old `dist/` folder
   - Upload new `dist/` folder from local machine

2. **Test in Browser:**
   - Open: `https://greenpay.eywademo.cloud`
   - **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R) - IMPORTANT!
   - Login and navigate to passport scanner
   - Capture passport image
   - **Verify form auto-fills** with all fields including nationality

## Testing

### Expected Behavior After Fix

1. User captures passport image
2. Toast: "🚀 High-Precision Scan"
3. Toast: "✅ Advanced AI Scan Complete - 98% confidence • JOHN SMITH"
4. **Form auto-fills with:**
   - ✅ Passport Number
   - ✅ Surname
   - ✅ Given Name
   - ✅ **Nationality** (full country name: "Papua New Guinea")
   - ✅ Date of Birth
   - ✅ Sex
   - ✅ Date of Expiry

### Console Output

Check browser console (F12) for:
```
=== STARTING OCR PROCESSING ===
=== ATTEMPTING SERVER-SIDE OCR (Python/PaddleOCR) ===
✅ Server OCR SUCCESS: {passportNumber: "...", surname: "...", nationality: "PNG", ...}
Confidence: 98.5%
Processing time: 523ms
=== OCR SUCCESS ===
Source: server-paddleocr
Passport Data: {passportNumber: "...", nationality: "Papua New Guinea", ...}
                                                      ↑ Now shows full name!
```

## What Was Wrong

The issue was a **data format mismatch**:

1. **Server OCR path:**
   ```
   Python MRZ Parser → Returns "PNG" (3-letter code)
       ↓
   Node.js Backend → Passes through "PNG"
       ↓
   Frontend tryServerOCR → Returns "PNG" (unchanged)
       ↓
   Form → Expects "Papua New Guinea" → ❌ Mismatch!
   ```

2. **Client OCR path (working):**
   ```
   Tesseract.js → Returns MRZ text
       ↓
   parseMRZ → Converts "PNG" → "Papua New Guinea"
       ↓
   Form → Receives "Papua New Guinea" → ✅ Works!
   ```

## Fix Summary

Added the same nationality code conversion in `tryServerOCR` that `parseMRZ` was already doing, ensuring both OCR paths return the same data format.

**Lines changed:** 3 lines added (1045-1047)

**Files affected:** 1 file (`SimpleCameraScanner.jsx`)

**Risk level:** Very low (just adding missing conversion)

---

**Fix Complete!** Upload the new `dist/` folder and clear browser cache to test. 🎉
