# Phase 3 - Server OCR Debugging & Field Name Flexibility

## Issue

Server OCR consistently returns **91-93% confidence** but still falls back to Tesseract because the passport number is null/undefined.

**Evidence from console logs:**
```
Server OCR returned no valid MRZ data or low confidence: 0.9140589833259583
Server OCR returned no valid MRZ data or low confidence: 0.9126834273338318
Server OCR returned no valid MRZ data or low confidence: 0.9318840503692627
```

All confidence values are **well above 50%**, but validation fails on `!result.data.passportNumber`.

## Root Cause Hypothesis

The Python OCR service may be using different field names than expected:
- Frontend expects: `passportNumber` (camelCase)
- Python might return: `documentNumber`, `passport_number`, or `document_number` (snake_case)

This is common when integrating Python backends (snake_case) with JavaScript frontends (camelCase).

## Solution: Debug Logging + Field Name Flexibility

### 1. Added Detailed Debug Logging

**New logging in tryServerOCR (lines 1038-1044):**
```javascript
const result = await ocrResponse.json();

// Debug: Log complete server response
console.log('=== FULL SERVER OCR RESPONSE ===');
console.log('Success:', result.success);
console.log('Full result.data:', JSON.stringify(result.data, null, 2));
console.log('Passport number field:', result.data.passportNumber);
console.log('Document number field:', result.data.documentNumber);
console.log('Confidence:', result.data.confidence);
```

**Benefit:**
- Shows exact JSON structure from Python service
- Reveals which field names are actually being used
- Helps identify data structure mismatches

### 2. Flexible Field Name Mapping

**Updated validation (line 1053):**
```javascript
// Try both passportNumber and documentNumber field names
const passportNum = result.data.passportNumber || result.data.documentNumber || result.data.passport_number;

if (!passportNum || result.data.confidence < 0.5) {
  console.warn('Server OCR returned no valid MRZ data or low confidence:', result.data.confidence);
  console.warn('Passport number value:', passportNum);
  throw new Error('No valid MRZ detected by server OCR');
}
```

**Updated return statement (lines 1070-1081):**
```javascript
return {
  passportNumber: passportNum, // Use the validated passport number
  surname: result.data.surname,
  givenName: result.data.givenName || result.data.given_name,
  nationality: nationalityFullName,
  dateOfBirth: result.data.dateOfBirth || result.data.date_of_birth,
  sex: result.data.sex === 'M' ? 'Male' : (result.data.sex === 'F' ? 'Female' : 'Unspecified'),
  dateOfExpiry: result.data.dateOfExpiry || result.data.date_of_expiry,
  mrzConfidence: result.data.confidence >= 0.95 ? 'high' : (result.data.confidence >= 0.85 ? 'medium' : 'low'),
  source: 'server-ocr',
  confidence: result.data.confidence
};
```

**Benefit:**
- Supports both camelCase and snake_case field names
- Works with `passportNumber`, `documentNumber`, or `passport_number`
- Handles `givenName`/`given_name`, `dateOfBirth`/`date_of_birth`, etc.

## Expected Console Output After Fix

### Scenario 1: Field Name Mismatch (Before Fix)

**Before:**
```
=== ATTEMPTING SERVER-SIDE OCR (Python/PaddleOCR) ===
Server OCR returned no valid MRZ data or low confidence: 0.9140589833259583
→ Falls back to Tesseract (unnecessary!)
```

**After:**
```
=== ATTEMPTING SERVER-SIDE OCR (Python/PaddleOCR) ===
=== FULL SERVER OCR RESPONSE ===
Success: true
Full result.data: {
  "documentNumber": "3834890962",  ← Field name revealed!
  "surname": "NIKOLOV",
  "givenName": "NIKOLAY STOYANOY",
  "nationality": "BGR",
  "dateOfBirth": "1969-09-27",
  "sex": "M",
  "dateOfExpiry": "2025-09-13",
  "confidence": 0.9140589833259583
}
Passport number field: undefined
Document number field: "3834890962"  ← Found it!
Confidence: 0.9140589833259583
✅ Server OCR SUCCESS: {...}
Confidence: 91.4%
→ Form auto-fills with server OCR data ✅
```

### Scenario 2: Server OCR Success (Both Field Names Work)

```
=== FULL SERVER OCR RESPONSE ===
Success: true
Full result.data: {
  "passportNumber": "3871103896",  ← Either field name works
  "surname": "NIKOLOV",
  "given_name": "NIKOLAY STOYANOV",  ← Snake_case also supported
  "nationality": "BGR",
  "date_of_birth": "1969-09-27",  ← Snake_case also supported
  "sex": "M",
  "date_of_expiry": "2025-09-17",  ← Snake_case also supported
  "confidence": 0.9126834273338318
}
Passport number field: "3871103896"
Confidence: 91.3%
✅ Server OCR SUCCESS
→ Form auto-fills immediately ✅
```

## Testing Instructions

After deploying this build:

1. **Upload to production** via CloudPanel File Manager
2. **Clear browser cache** (Cmd+Shift+R / Ctrl+Shift+R)
3. **Scan a passport**
4. **Open browser console** and look for:
   ```
   === FULL SERVER OCR RESPONSE ===
   ```
5. **Check the JSON output** to see:
   - Which field name contains the passport number?
   - Are other fields using camelCase or snake_case?
   - What is the actual data structure?

6. **Share the JSON output** with me so we can:
   - Confirm the field name mapping is correct
   - Fix any remaining mismatches
   - Update the Python service if needed

## Build Info

**Status:** ✅ Built successfully

**Location:** `/Users/nikolay/github/greenpay/dist/`

**Build time:** 7.27 seconds

**Main bundle:** 755.72 KB (237.94 KB gzipped)

**Changes:**
- ✅ Added detailed server OCR response logging
- ✅ Flexible field name mapping (camelCase + snake_case)
- ✅ Enhanced error messages with actual values
- ✅ Precision improvements from previous fix (3 consecutive detections, stricter thresholds)

## Next Steps

1. Deploy this build to production
2. Scan a passport and capture console output
3. Look for `=== FULL SERVER OCR RESPONSE ===` in console
4. Share the JSON output to identify field name mismatch
5. If needed, we can:
   - Update Python service to use camelCase
   - Or add more field name aliases in frontend
   - Or fix any other data structure issues

---

**This debug build will reveal exactly what the Python OCR service is returning!** 🔍
