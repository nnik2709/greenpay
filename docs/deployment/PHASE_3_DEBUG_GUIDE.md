# Phase 3 - Debugging Guide

## Issue: Form Not Auto-Filling After Scan

The scan shows success message but form fields remain empty.

## Debugging Steps

### 1. Deploy Updated Build with Debug Logging

**New build ready:** `/Users/nikolay/github/greenpay/dist/`

**Upload to:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/`

### 2. Test and Capture Console Logs

**On Desktop Browser:**
1. Open `https://greenpay.eywademo.cloud`
2. Press F12 to open Developer Tools
3. Go to **Console** tab
4. Clear console (trash icon)
5. Scan passport
6. **Copy ALL console output** and send to me

**On Mobile (iPhone) - Remote Debugging:**
1. Connect iPhone to Mac via cable
2. On iPhone: Settings → Safari → Advanced → **Enable Web Inspector**
3. On Mac: Open Safari → Develop → [Your iPhone Name] → greenpay.eywademo.cloud
4. Console will show in Mac Safari
5. Scan passport on iPhone
6. **Copy console output** from Mac Safari

### 3. What to Look For

The console should show these logs in order:

**✅ Expected Success Flow:**
```
=== STARTING OCR PROCESSING ===
=== ATTEMPTING SERVER-SIDE OCR (Python/PaddleOCR) ===
✅ Server OCR SUCCESS: {passportNumber: "...", nationality: "PNG", ...}
Confidence: 98.5%
Processing time: 523ms
=== OCR SUCCESS ===
Source: server-paddleocr
Passport Data: {passportNumber: "...", surname: "...", nationality: "Papua New Guinea", ...}
Calling onScanSuccess with: {
  "passportNumber": "AB123456",
  "surname": "SMITH",
  "givenName": "JOHN",
  "nationality": "Papua New Guinea",  ← Should be FULL NAME
  "dateOfBirth": "1990-03-15",
  "sex": "Male",
  "dateOfExpiry": "2030-12-31",
  "mrzConfidence": "high",
  "source": "server-ocr",
  "confidence": 0.98
}
About to call onScanSuccess callback...
onScanSuccess callback called successfully
```

**❌ If you see errors:**
- Network errors → Backend/Python service issue
- "No MRZ detected" → Image quality issue
- "Fallback to Tesseract" → Server OCR failed, using client OCR
- No "onScanSuccess callback called" → Callback not being executed

### 4. Check Network Tab

1. Open DevTools → **Network** tab
2. Filter by "scan-mrz"
3. Scan passport
4. Click on the `scan-mrz` request
5. Check **Response** tab

**Expected response:**
```json
{
  "success": true,
  "data": {
    "passportNumber": "AB123456",
    "surname": "SMITH",
    "givenName": "JOHN",
    "nationality": "PNG",  ← Backend returns 3-letter code
    "dateOfBirth": "1990-03-15",
    "sex": "M",
    "dateOfExpiry": "2030-12-31",
    "confidence": 0.98,
    ...
  },
  "source": "python-ocr",
  "processingTime": 523
}
```

## Possible Issues & Solutions

### Issue 1: Nationality Still 3-Letter Code

**Symptom:** Console shows `nationality: "PNG"` instead of `"Papua New Guinea"`

**Cause:** Browser cache not cleared or old build deployed

**Solution:**
```bash
# Hard refresh browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Or clear all cache
Chrome: Settings → Privacy → Clear browsing data → Cached images and files
Safari: Develop → Empty Caches
```

### Issue 2: onScanSuccess Callback Not Called

**Symptom:** Console shows "Passport Data:" but no "About to call onScanSuccess callback..."

**Cause:** Exception thrown before setTimeout executes

**Solution:** Check for JavaScript errors in console between "Passport Data:" and callback

### Issue 3: Callback Called But Form Not Updating

**Symptom:** Console shows "onScanSuccess callback called successfully" but form empty

**Possible causes:**
1. Form state not updating (React state issue)
2. Form fields have different names than expected
3. Form re-rendering and resetting

**Debug:**
Add this to `BuyOnline.jsx` handleCameraScan function:
```javascript
const handleCameraScan = (passportData) => {
  console.log('handleCameraScan received:', passportData);  // ADD THIS
  setFormData(prev => ({
    ...prev,
    passportNumber: passportData.passportNumber,
    surname: passportData.surname,
    givenName: passportData.givenName,
    nationality: passportData.nationality,
    dateOfBirth: passportData.dateOfBirth,
    sex: passportData.sex
  }));
  console.log('Form data updated');  // ADD THIS
  ...
};
```

### Issue 4: Server OCR Failing, Always Using Tesseract

**Symptom:** Console shows "FALLBACK: CLIENT-SIDE OCR (Tesseract)"

**Check backend:**
```bash
# SSH to server
pm2 list
# Verify both services online:
# greenpay-api  - online
# greenpay-ocr  - online

# Test OCR endpoint
curl http://localhost:3001/api/ocr/health

# Check logs
pm2 logs greenpay-api --lines 50
pm2 logs greenpay-ocr --lines 50
```

## Quick Test Commands

**Test OCR endpoint directly:**
```bash
# On server via SSH
curl http://localhost:3001/api/ocr/health

# Should return:
# {"success":true,"service":"GreenPay OCR Integration",...}
```

**Check both services running:**
```bash
pm2 list | grep greenpay
# Should show:
# greenpay-api  - online
# greenpay-ocr  - online
```

## What I Need From You

Please provide:

1. **Full console output** (copy/paste entire console after scan)
2. **Network tab** `/api/ocr/scan-mrz` response (if request appears)
3. **Screenshot** of console showing the issue
4. **PM2 status** output from `pm2 list`
5. Any **error messages** you see

This will help me identify exactly where the issue is occurring.

---

## Current Status

**Deployed:**
- ✅ Phase 1: Python OCR service (running on port 5000)
- ✅ Phase 2: Backend integration (health endpoint working)
- ⚠️  Phase 3: Frontend hybrid OCR (scan succeeds, form not filling)

**Next Steps:**
1. Deploy new build with debug logging
2. Test scan and capture console output
3. Analyze logs to identify root cause
4. Apply targeted fix based on findings
