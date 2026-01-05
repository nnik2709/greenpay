# CRITICAL: Server OCR Returning Empty Data

## The Problem

Python OCR service is returning **90-94% confidence** but the `result.data` object is **completely empty** - all fields are null/undefined.

```
=== FULL SERVER OCR RESPONSE ===
Success: true
Full result.data: [object Object]
Passport number field: null
Document number field: undefined
Confidence: 0.9343938231468201  ← HIGH confidence
```

This means:
1. ✅ Python service is running and responding
2. ✅ Python PaddleOCR is detecting text with high confidence
3. ❌ **Python service is NOT parsing MRZ into fields**
4. ❌ Backend receives empty data structure

## Root Cause

The Python OCR service (`greenpay-ocr`) is likely:
- Detecting text successfully (hence high confidence)
- But **FastMRZ parser is failing** to extract passport fields
- Returning `success: true` with empty/null field values

## Immediate Diagnostic Steps

### Step 1: Check Backend Logs

```bash
ssh root@165.22.52.100
pm2 logs greenpay-api --lines 100
```

**Look for:**
```
[OCR] Python service response: {
  ... what does this show?
}
```

If you see this, **copy the entire JSON and send it to me**.

### Step 2: Check Python OCR Service Logs

```bash
ssh root@165.22.52.100
pm2 logs greenpay-ocr --lines 100
```

**Look for:**
```
ERROR: ... (any errors)
WARNING: ... (any warnings)
MRZ parsing failed: ...
FastMRZ error: ...
```

### Step 3: Test Python Service Directly

Upload a passport image and test the Python service directly:

```bash
# On your local machine, save a test passport image
# Then upload via SSH to test:

ssh root@165.22.52.100
cd /tmp

# Test the OCR service directly
curl -X POST http://127.0.0.1:5000/scan-mrz \
  -F "file=@/path/to/passport.jpg" \
  | python3 -m json.tool

# This will show EXACTLY what Python returns
```

### Step 4: Check Python Service Status

```bash
ssh root@165.22.52.100
pm2 describe greenpay-ocr
```

**Check:**
- Status: online
- Uptime: how long running
- Restart count: (if high, service is crashing)
- Memory usage
- CPU usage

## What to Send Me

Please run the above commands and send me:

1. **Backend logs** showing `[OCR] Python service response:`
2. **Python OCR service logs** showing any errors
3. **Direct curl test** output (what Python returns directly)
4. **pm2 describe greenpay-ocr** output

This will tell us exactly why the Python service is returning empty data.

## Temporary Workaround

Since server OCR isn't working, **re-enable Tesseract fallback** so scanning works:

I can uncomment the Tesseract code and rebuild - just let me know!

## Likely Causes

### Cause 1: FastMRZ Not Installed
```bash
ssh root@165.22.52.100
/path/to/python-ocr-service/venv/bin/pip list | grep fastmrz
```

If not listed, install it:
```bash
/path/to/python-ocr-service/venv/bin/pip install fastmrz
pm2 restart greenpay-ocr
```

### Cause 2: Python Service Code Issue

The Python service might be:
- Catching exceptions silently
- Not calling FastMRZ parser
- Returning success even when parsing fails

### Cause 3: Image Format Issue

The image might be:
- Too processed (binarized) before sending to Python
- Wrong format (Python expects raw JPEG)
- Too large/small

## Frontend Changes Made (This Build)

### 1. Better Logging
Now shows:
```javascript
console.log('Full result object:', JSON.stringify(result, null, 2));
console.log('result.data keys:', Object.keys(result.data));
```

This will reveal the EXACT structure returned by backend.

### 2. Stricter Auto-Capture (Prevents False Positives)

**New thresholds:**
```javascript
edgeRatio > 0.055        // was 0.040 - much stricter
darkRatio > 0.08-0.22    // was 0.04-0.28 - narrow range
horizontalEdgeRatio > 0.020  // was 0.012 - stricter
textDensity > 0.09-0.20  // was 0.05-0.25 - narrow range
```

**Consecutive detections:** 3 (was 2) - prevents random triggers

**Result:** Auto-capture will ONLY trigger on actual MRZ, not random areas.

## Build Info

**Status:** ✅ Built

**Location:** `/Users/nikolay/github/greenpay/dist/`

**Changes:**
- ✅ Enhanced logging (shows full JSON structure)
- ✅ Much stricter auto-capture (prevents false positives)
- ✅ 3 consecutive detections required
- ⚠️ Tesseract still disabled for testing

## Next Steps

**Option A: Diagnose Python Service (Recommended)**
1. Run diagnostic commands above
2. Send me the logs/output
3. I'll fix the Python service issue
4. Then server OCR will work properly

**Option B: Re-enable Tesseract (Quick Fix)**
1. I uncomment Tesseract fallback
2. Rebuild frontend
3. Scanning works again (but server OCR issue remains unresolved)

**Option C: Both**
1. Re-enable Tesseract so scanning works NOW
2. Diagnose Python service in parallel
3. Fix server OCR for future

Which option do you prefer?

---

**The core issue is in the Python OCR service - we need to see its logs!** 🔍
