# Phase 2 Deployment Guide - Node.js OCR Integration

## Overview

Phase 2 adds Express.js routes to integrate the Python OCR service with your Node.js backend, making it accessible to the frontend.

**What's Being Deployed:**
- New route: `backend/routes/ocr.js`
- Updated: `backend/server.js` (added OCR route registration)
- Updated: `backend/package.json` (added multer, form-data, node-fetch)

**New API Endpoints:**
- `GET /api/ocr/health` - Check Python OCR service status
- `POST /api/ocr/scan-mrz` - Upload passport image, get MRZ data

---

## Files Changed

### 1. New File: `backend/routes/ocr.js`

**Location:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/ocr.js`

**What it does:**
- Accepts passport image uploads (multipart/form-data)
- Proxies requests to Python OCR service (localhost:5000)
- Handles errors gracefully
- Provides fallback suggestions if Python service unavailable
- Includes timeout handling (10 seconds)

**Key Features:**
- Memory storage (no disk writes for security)
- 10MB file size limit
- Image-only validation
- AbortController for request timeout
- Detailed error messages

### 2. Updated: `backend/server.js`

**Changes:**
- Added `const ocrRoutes = require('./routes/ocr');` (line 54)
- Added `app.use('/api/ocr', ocrRoutes);` (line 74)

**No authentication required** - OCR endpoints are public (same as `/api/buy-online`)

### 3. Updated: `backend/package.json`

**New dependencies:**
```json
"multer": "^1.4.5-lts.1",        // File upload handling
"node-fetch": "^2.7.0",          // HTTP client for Python service
"form-data": "^4.0.0"            // FormData for multipart uploads
```

---

## Deployment Steps

### Step 1: Upload Updated Files via CloudPanel

**Files to upload:**

1. **New file:** `backend/routes/ocr.js`
   - Upload to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/`

2. **Updated file:** `backend/server.js`
   - Upload to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/`
   - **Overwrites existing file**

3. **Updated file:** `backend/package.json`
   - Upload to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/`
   - **Overwrites existing file**

### Step 2: Install New Dependencies (SSH)

```bash
# Navigate to backend directory
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Install new dependencies
npm install

# Should install: multer, node-fetch, form-data
```

**Expected output:**
```
added 3 packages in 5s
```

### Step 3: Verify Files

```bash
# Verify ocr.js exists
ls -lh routes/ocr.js

# Should show: -rw-r--r-- 1 ... 9.5K ... routes/ocr.js

# Verify dependencies installed
npm list multer node-fetch form-data
```

**Expected:**
```
├── multer@1.4.5-lts.1
├── node-fetch@2.7.0
└── form-data@4.0.0
```

### Step 4: Restart Node.js Backend

```bash
# Restart greenpay-api
pm2 restart greenpay-api

# Check status
pm2 list

# Should show both services online:
# greenpay-api  - online
# greenpay-ocr  - online
```

### Step 5: Verify OCR Routes Loaded

```bash
# Check logs for startup
pm2 logs greenpay-api --lines 20

# Should NOT see any errors about missing modules
```

---

## Testing the Integration

### Test 1: Health Check

```bash
curl http://localhost:3001/api/ocr/health
```

**Expected response:**
```json
{
  "success": true,
  "service": "GreenPay OCR Integration",
  "backend": {
    "status": "healthy",
    "service": "GreenPay MRZ OCR",
    "version": "1.0.0"
  },
  "serviceUrl": "http://127.0.0.1:5000"
}
```

✅ **If you see this, integration is working!**

### Test 2: Upload Test (if you have a passport image)

```bash
# Test with a passport image
curl -X POST http://localhost:3001/api/ocr/scan-mrz \
  -F "file=@/path/to/passport.jpg"
```

**Expected success response:**
```json
{
  "success": true,
  "data": {
    "passportNumber": "N1234567",
    "surname": "SMITH",
    "givenName": "JOHN ROBERT",
    "nationality": "USA",
    "dateOfBirth": "1985-03-15",
    "sex": "M",
    "dateOfExpiry": "2030-12-31",
    "confidence": 0.98
  },
  "source": "python-ocr",
  "processingTime": 523,
  "ocrProcessingTime": 0.52
}
```

### Test 3: Error Handling (no file uploaded)

```bash
curl -X POST http://localhost:3001/api/ocr/scan-mrz
```

**Expected error response:**
```json
{
  "success": false,
  "error": "No image file uploaded",
  "message": "Please upload a passport image (JPG or PNG)"
}
```

---

## API Documentation

### GET /api/ocr/health

Check if Python OCR service is available.

**Response (Success):**
```json
{
  "success": true,
  "service": "GreenPay OCR Integration",
  "backend": {
    "status": "healthy",
    "service": "GreenPay MRZ OCR",
    "version": "1.0.0"
  },
  "serviceUrl": "http://127.0.0.1:5000"
}
```

**Response (Service Down):**
```json
{
  "success": false,
  "error": "OCR service unavailable",
  "message": "...",
  "serviceUrl": "http://127.0.0.1:5000",
  "fallback": "Client-side Tesseract.js available"
}
```

### POST /api/ocr/scan-mrz

Upload passport image and extract MRZ data.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Field: `file` (passport image)
- Max size: 10MB
- Formats: JPG, PNG

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "passportNumber": "string",
    "surname": "string",
    "givenName": "string",
    "nationality": "string",
    "dateOfBirth": "YYYY-MM-DD",
    "sex": "M" | "F",
    "dateOfExpiry": "YYYY-MM-DD",
    "issuingCountry": "string",
    "personalNumber": "string" | null,
    "confidence": 0.0-1.0,
    "validCheckDigits": boolean,
    "mrzText": "string"
  },
  "source": "python-ocr",
  "processingTime": number (ms),
  "ocrProcessingTime": number (seconds)
}
```

**Response (No MRZ Detected):**
```json
{
  "success": false,
  "error": "No MRZ detected in image",
  "confidence": 0.45,
  "source": "python-ocr",
  "fallback": "client-tesseract",
  "message": "Try using client-side scanner or retake photo"
}
```

**Response (Service Unavailable):**
```json
{
  "success": false,
  "error": "OCR service temporarily unavailable",
  "message": "Python OCR service not responding",
  "fallback": "client-tesseract",
  "suggestion": "Please use client-side scanner or try again later",
  "serviceUrl": "http://127.0.0.1:5000"
}
```

**Response (Timeout):**
```json
{
  "success": false,
  "error": "OCR service temporarily unavailable",
  "message": "OCR processing timeout (>10s)",
  "fallback": "client-tesseract",
  "suggestion": "Please use client-side scanner or try again later"
}
```

---

## Troubleshooting

### Issue: "Cannot find module 'multer'"

**Solution:**
```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
npm install multer node-fetch form-data
pm2 restart greenpay-api
```

### Issue: "OCR service unavailable"

**Check Python service:**
```bash
pm2 list

# Should show greenpay-ocr online
# If not:
pm2 restart greenpay-ocr
curl http://localhost:5000/health
```

### Issue: "Route not found"

**Verify route registration:**
```bash
grep "ocrRoutes" backend/server.js

# Should show 2 lines:
# const ocrRoutes = require('./routes/ocr');
# app.use('/api/ocr', ocrRoutes);
```

### Issue: Backend won't restart

**Check logs:**
```bash
pm2 logs greenpay-api --err --lines 50

# Look for syntax errors or missing modules
```

---

## Environment Variables (Optional)

Add to `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/.env`:

```bash
# Python OCR Service Configuration
OCR_SERVICE_URL=http://127.0.0.1:5000
OCR_TIMEOUT=10000  # 10 seconds
```

**Default values** (if not set):
- OCR_SERVICE_URL: `http://127.0.0.1:5000`
- OCR_TIMEOUT: `10000` (10 seconds)

---

## Integration Flow

```
Frontend (SimpleCameraScanner)
    ↓ (uploads passport image)
POST /api/ocr/scan-mrz
    ↓
Node.js Backend (backend/routes/ocr.js)
    ↓ (proxies request)
Python OCR Service (localhost:5000)
    ↓ (PaddleOCR + FastMRZ)
Extracts MRZ data
    ↓
Returns structured JSON
    ↓
Node.js Backend (validates, adds metadata)
    ↓
Frontend (receives parsed passport data)
```

**Error Path:**
```
Python Service Down/Timeout
    ↓
Node.js returns error with fallback: "client-tesseract"
    ↓
Frontend uses Tesseract.js (client-side OCR)
    ↓
User still gets MRZ scan (80-90% accuracy)
```

---

## Performance Expectations

**Response Times:**
- Health check: < 50ms
- OCR scan (success): 500-1500ms
- OCR scan (timeout): 10 seconds (then fallback)

**Throughput:**
- Concurrent scans: 4 (limited by Python service workers)
- Queue time if >4: +500ms per request

**Memory Usage:**
- Node.js backend: No increase (proxies only)
- Python service: +50-100MB per scan (temporary)

---

## Security Notes

**Network Security:**
- ✅ OCR service only accessible via localhost
- ✅ No direct internet access to Python service
- ✅ All requests go through Node.js (port 3001)

**File Upload Security:**
- ✅ Memory storage only (no disk writes)
- ✅ 10MB size limit
- ✅ Image-only validation
- ✅ No persistent storage of uploaded images

**Rate Limiting:**
- Python service: 60 requests/minute per IP
- Node.js: Can add express-rate-limit if needed

---

## Rollback Procedure

If Phase 2 causes issues:

### Quick Rollback (Remove OCR Route)

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Remove OCR route file
rm routes/ocr.js

# Restore original server.js (if you have backup)
# Or manually remove lines 54 and 74 from server.js

# Restart
pm2 restart greenpay-api
```

**Frontend will continue using Tesseract.js** (no changes needed in Phase 2).

### Full Rollback (Remove All Changes)

```bash
# Uninstall dependencies
npm uninstall multer node-fetch form-data

# Remove OCR route
rm routes/ocr.js

# Restore server.js and package.json from backup

# Restart
pm2 restart greenpay-api
```

---

## Next Steps: Phase 3 - Frontend Integration

After Phase 2 is deployed and tested:

**Phase 3 will update:**
- `src/components/SimpleCameraScanner.jsx`
- Add API call to `/api/ocr/scan-mrz`
- Keep Tesseract.js as fallback
- Test on real devices (Android, iOS)

**Estimated time:** 1-2 days

---

## Success Criteria

Phase 2 is successful if:

- [x] `npm install` completes without errors
- [x] `pm2 restart greenpay-api` succeeds
- [x] `curl http://localhost:3001/api/ocr/health` returns success
- [x] No errors in `pm2 logs greenpay-api`
- [x] Both services (greenpay-api, greenpay-ocr) remain online
- [x] Test passport upload returns valid MRZ data

---

## Quick Deployment Commands

```bash
# Step 1: Navigate to backend
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Step 2: Install dependencies
npm install

# Step 3: Verify files
ls -lh routes/ocr.js
grep "ocrRoutes" server.js

# Step 4: Restart backend
pm2 restart greenpay-api

# Step 5: Test
curl http://localhost:3001/api/ocr/health

# Step 6: Check logs
pm2 logs greenpay-api --lines 20

# Step 7: Verify both services online
pm2 list
```

---

**Phase 2 Deployment Ready!** Upload the files and run these commands to integrate Node.js with Python OCR service.
