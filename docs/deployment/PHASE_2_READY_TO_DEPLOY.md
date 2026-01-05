# Phase 2 Ready to Deploy - Quick Summary

## ✅ What's Ready

**3 files ready to upload:**

1. **NEW:** `backend/routes/ocr.js` (9.5 KB)
   - OCR endpoint implementation
   - File upload handling with multer
   - Python service integration

2. **UPDATED:** `backend/server.js`
   - Added OCR route registration (2 lines)
   - Line 54: `const ocrRoutes = require('./routes/ocr');`
   - Line 74: `app.use('/api/ocr', ocrRoutes);`

3. **UPDATED:** `backend/package.json`
   - Added 3 dependencies:
     - `multer@1.4.5-lts.1`
     - `node-fetch@2.7.0`
     - `form-data@4.0.0`

---

## 📁 Files to Upload via CloudPanel

**Source (local):** `/Users/nikolay/github/greenpay/backend/`

**Destination (server):** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/`

```
Upload these files:
✓ routes/ocr.js         (new file)
✓ server.js             (overwrite existing)
✓ package.json          (overwrite existing)
```

---

## 🚀 Deployment Commands (SSH)

After uploading files, run these commands:

```bash
# Navigate to backend
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Install new dependencies
npm install

# Restart backend
pm2 restart greenpay-api

# Test health endpoint
curl http://localhost:3001/api/ocr/health

# Check logs
pm2 logs greenpay-api --lines 20

# Verify both services online
pm2 list
```

**Expected time:** ~5 minutes

---

## ✅ Success Criteria

Phase 2 deployment is successful if:

```bash
# 1. Dependencies installed
$ npm list multer node-fetch form-data
├── multer@1.4.5-lts.1
├── node-fetch@2.7.0
└── form-data@4.0.0

# 2. Health check works
$ curl http://localhost:3001/api/ocr/health
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

# 3. Both services online
$ pm2 list
┌────┬──────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name         │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼──────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ greenpay-api │ fork     │ X    │ online    │ 0%       │ XXX.Xmb  │
│ 1  │ greenpay-ocr │ fork     │ 0    │ online    │ 0%       │ XXX.Xmb  │
└────┴──────────────┴──────────┴──────┴───────────┴──────────┴──────────┘

# 4. No errors in logs
$ pm2 logs greenpay-api --err --lines 20
# Should show no errors
```

---

## 🎯 What This Enables

**New API Endpoints:**

1. **GET /api/ocr/health**
   - Check if Python OCR service is available
   - Used by frontend to determine OCR availability

2. **POST /api/ocr/scan-mrz**
   - Upload passport image
   - Receive parsed MRZ data
   - Automatic fallback suggestion if service down

**Integration Flow:**
```
Frontend → Node.js (/api/ocr/scan-mrz) → Python (localhost:5000) → Response
```

**Error Handling:**
- Python service down? → Returns error with "fallback: client-tesseract"
- Invalid image? → Returns error with helpful message
- Timeout (>10s)? → Aborts and suggests fallback

---

## 📚 Documentation

- **Detailed Guide:** `PHASE_2_DEPLOYMENT_GUIDE.md` (full documentation)
- **This File:** Quick deployment reference
- **API Docs:** Included in deployment guide

---

## 🔄 What Happens After Deployment

**Immediate:**
- `/api/ocr/health` endpoint available
- `/api/ocr/scan-mrz` endpoint available
- Can test with curl or Postman

**Next (Phase 3):**
- Update SimpleCameraScanner.jsx to call `/api/ocr/scan-mrz`
- Add fallback to Tesseract.js if API fails
- Test on real devices (Android, iOS)

---

## ⚠️ Important Notes

**Zero Impact on Existing Features:**
- ✅ New routes only (no existing routes modified)
- ✅ No authentication required (same as /api/buy-online)
- ✅ No database changes
- ✅ No frontend changes (Phase 3)
- ✅ Existing MRZ scanner continues working

**Rollback:**
- Just delete `routes/ocr.js` and restart: `pm2 restart greenpay-api`
- Everything returns to normal

---

## 🚦 Ready to Deploy?

**Checklist:**
- [x] Files prepared and ready to upload
- [x] CloudPanel File Manager access
- [x] SSH terminal session open
- [x] Understand deployment steps
- [x] Know success criteria

**If all checked, you're ready!**

---

## Quick Deploy Steps

1. **Upload 3 files** via CloudPanel to `backend/` folder
2. **SSH:** `cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend`
3. **SSH:** `npm install`
4. **SSH:** `pm2 restart greenpay-api`
5. **SSH:** `curl http://localhost:3001/api/ocr/health`
6. **Verify:** Should return `{"success":true,...}`

**Done!** Phase 2 deployed. 🎉

---

**Questions?** Check `PHASE_2_DEPLOYMENT_GUIDE.md` for detailed troubleshooting and API documentation.
