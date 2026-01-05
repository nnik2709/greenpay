# Phase 2 Complete Deployment - Backend + Frontend

## 📦 What to Deploy

### Backend Files (3 files)
**Source:** `/Users/nikolay/github/greenpay/backend/`
**Destination:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/`

```
✓ routes/ocr.js         (NEW - 9.5 KB)
✓ server.js             (UPDATED - overwrite existing)
✓ package.json          (UPDATED - overwrite existing)
```

### Frontend Files (entire dist folder)
**Source:** `/Users/nikolay/github/greenpay/dist/`
**Destination:** `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/`

```
✓ dist/                 (ENTIRE FOLDER - overwrite existing)
  ├── index.html
  ├── assets/
  │   ├── index-53bad574.css
  │   ├── index-52f1b512.js
  │   └── ... (all other assets)
```

**Frontend Build Info:**
- Built: ✅ Successfully
- Build time: 7.40s
- Total size: ~3.3 MB (760 KB main bundle)
- Gzipped: ~240 KB (optimized)

---

## 🚀 Deployment Steps

### Part 1: Upload Backend Files via CloudPanel

1. Open CloudPanel File Manager
2. Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/`
3. Upload/overwrite these files:
   - `routes/ocr.js` (upload to routes/ folder)
   - `server.js` (overwrite)
   - `package.json` (overwrite)

### Part 2: Upload Frontend Files via CloudPanel

1. Navigate to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/`
2. **Delete old dist/ folder** (or rename to dist-backup/)
3. **Upload entire new dist/ folder** from your local machine

### Part 3: Install Backend Dependencies (SSH)

```bash
# Navigate to backend
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Install new dependencies (multer, node-fetch, form-data)
npm install

# Verify installation
npm list multer node-fetch form-data
```

**Expected output:**
```
├── multer@1.4.5-lts.1
├── node-fetch@2.7.0
└── form-data@4.0.0
```

### Part 4: Restart Backend (SSH)

```bash
# Restart Node.js backend
pm2 restart greenpay-api

# Check status
pm2 list

# Should show both services online:
# greenpay-api  - online
# greenpay-ocr  - online
```

### Part 5: Verify Backend Integration (SSH)

```bash
# Test OCR health endpoint
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

✅ **If you see this, backend integration is working!**

### Part 6: Check Backend Logs (SSH)

```bash
# Check for any errors
pm2 logs greenpay-api --lines 30

# Should see no errors, just normal startup messages
```

### Part 7: Test Frontend (Browser)

1. Open: `https://greenpay.eywademo.cloud`
2. Should load normally
3. All existing features should work as before
4. **Note:** Frontend doesn't use OCR endpoint yet (Phase 3)

---

## ✅ Verification Checklist

### Backend Verification

- [ ] `npm install` completed without errors
- [ ] `pm2 restart greenpay-api` succeeded
- [ ] `pm2 list` shows both services online (greenpay-api, greenpay-ocr)
- [ ] `curl http://localhost:3001/api/ocr/health` returns success
- [ ] `pm2 logs greenpay-api --err` shows no errors
- [ ] Restart count didn't increase significantly

### Frontend Verification

- [ ] Website loads: `https://greenpay.eywademo.cloud`
- [ ] Login page appears
- [ ] Can login successfully
- [ ] Dashboard loads
- [ ] All existing features work (buy-online, passports, etc.)
- [ ] No console errors (F12 → Console)

### Overall System Verification

```bash
# Both services running
pm2 list

# Expected output:
┌────┬──────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name         │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼──────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ greenpay-api │ fork     │ X    │ online    │ 0%       │ XXX.Xmb  │
│ 1  │ greenpay-ocr │ fork     │ 0    │ online    │ 0%       │ XXX.Xmb  │
└────┴──────────────┴──────────┴──────┴───────────┴──────────┴──────────┘

# Overall server health
free -h
df -h /

# Both should show plenty of available resources
```

---

## 🎯 What Changed

### Backend Changes

**New Endpoint:**
- `GET /api/ocr/health` - Check Python OCR service status
- `POST /api/ocr/scan-mrz` - Upload passport image, get MRZ data

**New Dependencies:**
- `multer` - File upload handling
- `node-fetch` - HTTP client for Python service
- `form-data` - Multipart form data

**Integration:**
- Node.js backend → Python OCR service (localhost:5000)
- Timeout handling (10 seconds)
- Graceful error handling with fallback suggestions

### Frontend Changes

**No functional changes** - Phase 2 only adds backend integration

**Build updated:**
- All assets re-bundled
- Same features as before
- Optimized production build

---

## 🔍 Testing the Integration

### Test 1: Health Check (SSH)

```bash
curl http://localhost:3001/api/ocr/health
```

Should return `{"success":true,...}`

### Test 2: Upload Test (SSH, if you have passport image on server)

```bash
# If you have a test passport image
curl -X POST http://localhost:3001/api/ocr/scan-mrz \
  -F "file=@/path/to/passport.jpg"
```

Should return parsed MRZ data with `{"success":true,...}`

### Test 3: Error Handling (SSH)

```bash
# Test with no file
curl -X POST http://localhost:3001/api/ocr/scan-mrz
```

Should return `{"success":false,"error":"No image file uploaded",...}`

### Test 4: Frontend Accessibility (Browser)

From browser console (F12):

```javascript
// Test health endpoint
fetch('https://greenpay.eywademo.cloud/api/ocr/health')
  .then(r => r.json())
  .then(console.log);

// Should log: {success: true, ...}
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'multer'"

**Cause:** Dependencies not installed

**Solution:**
```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
npm install
pm2 restart greenpay-api
```

### Issue: "OCR service unavailable"

**Cause:** Python OCR service not running

**Solution:**
```bash
pm2 list
# If greenpay-ocr not online:
pm2 restart greenpay-ocr
```

### Issue: Backend won't restart

**Cause:** Syntax error or missing dependency

**Solution:**
```bash
pm2 logs greenpay-api --err --lines 50
# Fix error shown in logs
pm2 restart greenpay-api
```

### Issue: Frontend not loading

**Cause:** Old dist/ folder not replaced

**Solution:**
1. Delete `/home/.../htdocs/greenpay.eywademo.cloud/dist/`
2. Re-upload new `dist/` folder
3. Clear browser cache (Ctrl+Shift+R)

### Issue: 404 on /api/ocr/health

**Cause:** OCR route not registered in server.js

**Solution:**
```bash
# Verify server.js has OCR route
grep "ocrRoutes" /home/.../backend/server.js

# Should show:
# const ocrRoutes = require('./routes/ocr');
# app.use('/api/ocr', ocrRoutes);

# If missing, re-upload server.js
pm2 restart greenpay-api
```

---

## 📊 Performance Expectations

### Backend Response Times

- `/api/ocr/health`: < 50ms
- `/api/ocr/scan-mrz`: 500-1500ms (depends on image quality)
- Timeout: 10 seconds max

### Frontend Load Time

- Initial load: < 3 seconds (cached: < 1 second)
- No changes from previous build

### Memory Usage

- Node.js backend: No increase (proxies only)
- Python OCR service: Same as Phase 1 (~27-400MB)

---

## 🔄 Rollback Procedure

### Backend Rollback

```bash
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Remove OCR route
rm routes/ocr.js

# Uninstall dependencies
npm uninstall multer node-fetch form-data

# Restore original server.js and package.json (if backed up)
# Or manually remove OCR route lines

# Restart
pm2 restart greenpay-api
```

### Frontend Rollback

```bash
# Restore old dist/ folder (if backed up as dist-backup/)
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
rm -rf dist
mv dist-backup dist
```

**No data loss** - all changes are code-only, no database modifications.

---

## 📈 Current System Status

### Services Running

```
greenpay-api  (Node.js)  - Port 3001 (localhost)
greenpay-ocr  (Python)   - Port 5000 (localhost)
nginx         (Proxy)    - Port 443  (public HTTPS)
PostgreSQL    (Database) - Port 5432 (localhost)
```

### API Endpoints Available

**Existing (unchanged):**
- `/api/auth/*`
- `/api/users/*`
- `/api/passports/*`
- `/api/buy-online/*`
- `/api/payment/webhook/doku/*`
- ... (all other routes)

**New (Phase 2):**
- `/api/ocr/health` ✨
- `/api/ocr/scan-mrz` ✨

---

## 🎯 What's Next: Phase 3

**After Phase 2 is deployed and verified:**

Phase 3 will update the frontend to use the new OCR endpoint:

1. Update `src/components/SimpleCameraScanner.jsx`
2. Add API call to `/api/ocr/scan-mrz`
3. Keep Tesseract.js as fallback
4. Test on real devices (Android, iOS)
5. Deploy updated frontend

**Estimated time:** 1-2 days

---

## 📋 Deployment Summary

**Time Required:**
- File upload: 10-15 minutes
- npm install: 2-3 minutes
- Testing: 5 minutes
- **Total: ~20 minutes**

**Files Changed:**
- Backend: 3 files (1 new, 2 updated)
- Frontend: Entire dist/ folder rebuilt
- Dependencies: +3 npm packages

**Risk Level:** Low
- No database changes
- No authentication changes
- New routes only (existing routes unchanged)
- Easy rollback available

---

## ✅ Success Criteria

Deployment is successful when:

1. ✅ Both services online in `pm2 list`
2. ✅ `curl http://localhost:3001/api/ocr/health` returns success
3. ✅ No errors in `pm2 logs greenpay-api`
4. ✅ Website loads: `https://greenpay.eywademo.cloud`
5. ✅ Can login and use existing features
6. ✅ No console errors in browser

---

## 🚀 Quick Deployment Commands

```bash
# After uploading all files via CloudPanel:

# 1. Install dependencies
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
npm install

# 2. Restart backend
pm2 restart greenpay-api

# 3. Verify both services
pm2 list

# 4. Test OCR health
curl http://localhost:3001/api/ocr/health

# 5. Check logs
pm2 logs greenpay-api --lines 20

# 6. Open browser and test
# https://greenpay.eywademo.cloud

# Done! ✅
```

---

**Phase 2 Ready to Deploy!** 🎉

Upload the backend files, upload the dist/ folder, run the commands, and verify everything works!
