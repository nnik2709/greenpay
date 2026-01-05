# Voucher Registration Route Rename - Deployment Guide

**Build Date:** December 15, 2025, 6:45 AM
**Build Status:** ✅ FRONTEND SUCCESS (9.21s) | ⚠️ BACKEND MANUAL REQUIRED
**Change:** Renamed `/corporate-voucher-registration` → `/voucher-registration`

---

## 🎯 What Changed

### Route Rename (Complete)

**Old Route:**
- Frontend: `https://greenpay.eywademo.cloud/corporate-voucher-registration`
- Backend: `/api/corporate-voucher-registration/*`

**New Route:**
- Frontend: `https://greenpay.eywademo.cloud/voucher-registration`
- Backend: `/api/voucher-registration/*`

### Files Modified

#### Frontend (4 files):
1. **src/App.jsx** (line 146)
   - Route: `/corporate-voucher-registration` → `/voucher-registration`

2. **src/pages/AgentLanding.jsx** (line 63)
   - Action card 3 path: `/corporate-voucher-registration` → `/voucher-registration`

3. **src/pages/CorporateVoucherRegistration.jsx** (lines 16, 140, 203, 343-347)
   - Page title: "Corporate Voucher Registration" → "Voucher Registration"
   - API endpoints updated
   - Description updated to include all voucher types

#### Backend (1 file):
4. **backend/server.js** (line 62)
   - API route: `/api/corporate-voucher-registration` → `/api/voucher-registration`
   - Comment updated to reflect all voucher types

---

## 📦 Frontend Deployment

### Files to Deploy

**CRITICAL FILES:**

```
dist/index.html (4.74 KB)
dist/assets/index-2602fe5b.js (661.13 KB) - Main bundle
dist/assets/AgentLanding-81aacc8c.js (6.61 KB) - Agent landing
dist/assets/CorporateVoucherRegistration-0d95f489.js (14.69 KB) - Voucher registration page
dist/assets/index-d34c08f0.css (72.52 KB)
```

### Deployment Command

```bash
cd /Users/nikolay/github/greenpay
rsync -avz --delete dist/ root@greenpay.eywademo.cloud:/var/www/html/
```

### Alternative (Manual FTP/SFTP):

1. Delete old files on server:
   - `/var/www/html/index.html`
   - `/var/www/html/assets/` folder

2. Upload new files:
   - Upload `dist/index.html` → `/var/www/html/`
   - Upload `dist/assets/` → `/var/www/html/assets/`

3. Set permissions:
```bash
ssh root@greenpay.eywademo.cloud "chown -R www-data:www-data /var/www/html && chmod -R 755 /var/www/html"
```

---

## 🔧 Backend Deployment

### File to Deploy

**CRITICAL FILE:**
```
backend/server.js (line 62 changed)
```

### Deployment Steps

**Option 1: Direct File Upload**

```bash
# Upload single file
scp backend/server.js root@greenpay.eywademo.cloud:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/

# Restart backend service
ssh root@greenpay.eywademo.cloud "pm2 restart greenpay-backend"
```

**Option 2: Full Backend Deploy**

```bash
# Upload entire backend folder
rsync -avz --exclude 'node_modules' backend/ root@greenpay.eywademo.cloud:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/

# Restart backend
ssh root@greenpay.eywademo.cloud "pm2 restart greenpay-backend"
```

---

## ✅ Testing Checklist

### 1. Test New Route (Frontend)

**Old URL (Should NOT work):**
```
https://greenpay.eywademo.cloud/corporate-voucher-registration
```
**Expected:** 404 or blank page

**New URL (Should work):**
```
https://greenpay.eywademo.cloud/voucher-registration
```
**Expected:** Voucher Registration page loads

### 2. Test Agent Landing (Card 3)

**Login as Counter_Agent:**
```
Email: agent@greenpay.pg
Password: Agent123!@#
```

**Steps:**
1. Login → Should go to `/app/agent`
2. Click Card 3 ("Add Passport to Voucher")
3. Should navigate to `/voucher-registration` ✅
4. Should see "Voucher Registration" title (NOT "Corporate Voucher Registration") ✅

### 3. Test API Endpoints (Backend)

**Old endpoint (Should NOT work):**
```bash
curl https://greenpay.eywademo.cloud/api/corporate-voucher-registration/voucher/ABC12345
```
**Expected:** 404

**New endpoint (Should work):**
```bash
curl https://greenpay.eywademo.cloud/api/voucher-registration/voucher/ABC12345
```
**Expected:** JSON response (voucher not found is OK, endpoint should respond)

### 4. Test Full Workflow

1. Go to `/voucher-registration`
2. Enter test voucher code (8-character or CORP-)
3. Click "Find Voucher"
4. API should call `/api/voucher-registration/voucher/{code}` ✅
5. Enter passport data
6. Click "Register Voucher"
7. API should call `/api/voucher-registration/register` ✅

---

## 🔄 Backward Compatibility

### Breaking Change Warning

⚠️ **This is a BREAKING CHANGE**

**Old URLs will stop working:**
- `https://greenpay.eywademo.cloud/corporate-voucher-registration` → 404
- `/api/corporate-voucher-registration/*` → 404

**Impact:**
- Any bookmarks pointing to old URL will break
- Any emails with old URL will not work
- Any QR codes with old URL will fail

**Mitigation (Optional):**

Add redirect in Nginx config:
```nginx
location /corporate-voucher-registration {
    return 301 /voucher-registration$is_args$args;
}

location /api/corporate-voucher-registration {
    return 301 /api/voucher-registration$is_args$args;
}
```

---

## 📊 Summary

### Frontend Changes:
- ✅ Route renamed in App.jsx
- ✅ AgentLanding card path updated
- ✅ Page title and description updated
- ✅ API endpoints updated
- ✅ Build successful (9.21s)

### Backend Changes:
- ✅ API route renamed in server.js
- ⚠️ Requires manual deployment

### Files to Deploy:
- **Frontend:** Entire `dist/` folder (65 files, 3.2 MB)
- **Backend:** `backend/server.js` (1 file)

### Testing Required:
- [ ] Test `/voucher-registration` loads
- [ ] Test `/corporate-voucher-registration` returns 404
- [ ] Test Agent Card 3 navigates to new route
- [ ] Test API `/api/voucher-registration/voucher/{code}` works
- [ ] Test API `/api/voucher-registration/register` works
- [ ] Test full voucher registration workflow

---

## 🚀 Quick Deploy Commands

### Frontend Only:
```bash
rsync -avz --delete dist/ root@greenpay.eywademo.cloud:/var/www/html/
```

### Backend Only:
```bash
scp backend/server.js root@greenpay.eywademo.cloud:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
ssh root@greenpay.eywademo.cloud "pm2 restart greenpay-backend"
```

### Both (Frontend + Backend):
```bash
# Frontend
rsync -avz --delete dist/ root@greenpay.eywademo.cloud:/var/www/html/

# Backend
scp backend/server.js root@greenpay.eywademo.cloud:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
ssh root@greenpay.eywademo.cloud "pm2 restart greenpay-backend"
```

---

## 🆘 Troubleshooting

### Issue 1: Old URL Still Works

**Cause:** Browser cache or old files not deleted

**Solution:**
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Verify new `index.html` uploaded
3. Clear Nginx cache: `ssh root@greenpay.eywademo.cloud "systemctl reload nginx"`

### Issue 2: New URL Returns 404

**Cause:** New files not uploaded

**Solution:**
1. Verify `index-2602fe5b.js` exists on server
2. Check `dist/index.html` references correct bundle hash
3. Re-upload entire `dist/` folder

### Issue 3: API Calls Fail

**Cause:** Backend not deployed or not restarted

**Solution:**
1. Verify `backend/server.js` line 62 has `/api/voucher-registration`
2. Restart backend: `ssh root@greenpay.eywademo.cloud "pm2 restart greenpay-backend"`
3. Check PM2 logs: `ssh root@greenpay.eywademo.cloud "pm2 logs greenpay-backend"`

### Issue 4: Card 3 Still Points to Old Route

**Cause:** Old JavaScript bundle cached

**Solution:**
1. Hard refresh browser
2. Verify `AgentLanding-81aacc8c.js` uploaded
3. Check browser console for errors

---

**Ready to Deploy!** ✅

All code changes complete. Frontend built successfully. Backend requires manual deployment.
