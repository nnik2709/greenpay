# Deployment Guide - Post-Cleanup Release

**Release:** v1.0.0-cleanup-20251209 ✅ (Tagged in GitHub)
**Status:** Ready to Deploy
**Safety:** Full rollback capability via Git tag

---

## 🎯 What's Being Deployed

### Changes (Phases 1-3 Complete):
- ✅ Removed all Supabase dependencies (15 packages)
- ✅ Consolidated duplicate services
- ✅ Removed 11 unused files (~1,500 lines)
- ✅ Centralized API client
- ✅ Enhanced error handling (toast notifications)
- ✅ Code reduction: 25-30%

### Git Tag Created:
```bash
Tag: v1.0.0-cleanup-20251209
Commit: $(git rev-parse HEAD)
Status: Pushed to GitHub ✅
```

---

## 📋 Pre-Deployment Checklist

- [x] Git tag created and pushed
- [ ] Build production frontend
- [ ] SSH access to server confirmed
- [ ] Backup current deployment
- [ ] Deploy frontend
- [ ] Deploy backend
- [ ] Restart PM2 services
- [ ] Run health checks
- [ ] Test application

---

## 🚀 Deployment Steps

### Step 1: Build Production Frontend

```bash
cd /Users/nikolay/github/greenpay
npm run build
```

**Expected:** Build completes without errors
**Output:** `dist/` directory created

---

### Step 2: Backup Current Deployment

```bash
# SSH into server
ssh root@72.61.208.79

# Create backup directory
mkdir -p /home/eywademo-greenpay/backups

# Backup frontend
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
tar -czf /home/eywademo-greenpay/backups/pre-cleanup-$(date +%Y%m%d_%H%M%S)-frontend.tar.gz dist/

# Backup backend
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
tar -czf /home/eywademo-greenpay/backups/pre-cleanup-$(date +%Y%m%d_%H%M%S)-backend.tar.gz \
    --exclude=node_modules \
    --exclude=.env \
    .

# Verify backups
ls -lh /home/eywademo-greenpay/backups/

# Exit SSH
exit
```

**Important:** Note the backup filename for rollback if needed

---

### Step 3: Deploy Frontend

```bash
# From local machine
cd /Users/nikolay/github/greenpay

# Deploy dist folder
rsync -avz --delete dist/ root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/
```

**Expected:** Files uploaded successfully
**What's deployed:** React production build (no Supabase dependencies)

---

### Step 4: Deploy Backend

```bash
# From local machine
cd /Users/nikolay/github/greenpay

# Deploy backend files
scp -r backend/routes root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
scp -r backend/services root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
scp -r backend/middleware root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
scp -r backend/utils root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
scp backend/server.js root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
scp backend/package.json root@72.61.208.79:/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/
```

**What's deployed:** Updated routes, services, server code

---

### Step 5: Install Dependencies & Restart

```bash
# SSH into server
ssh root@72.61.208.79

# Navigate to backend
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend

# Install dependencies (Supabase packages will be removed)
npm install --production

# Restart PM2 service
pm2 restart greenpay-api

# Wait for stabilization
sleep 3

# Check status
pm2 status greenpay-api
pm2 logs greenpay-api --lines 50

# Exit SSH
exit
```

**Expected:**
- npm installs without Supabase packages
- PM2 restart successful
- No errors in logs

---

### Step 6: Health Checks

```bash
# Test frontend
curl -I https://greenpay.eywademo.cloud/
# Expected: HTTP 200 OK

# Test backend API
curl -I https://greenpay.eywademo.cloud/api/vouchers/validate/TEST
# Expected: HTTP 404 or 200 (endpoint responds)

# Open in browser
open https://greenpay.eywademo.cloud
```

**Check:**
- [ ] Frontend loads
- [ ] No console errors about Supabase
- [ ] Login works
- [ ] Dashboard displays
- [ ] API calls succeed

---

### Step 7: Critical Functionality Tests

**Test these immediately after deployment:**

1. **Authentication**
   ```
   https://greenpay.eywademo.cloud/login
   - Login with valid credentials
   - Verify dashboard loads
   - Check user session persists
   ```

2. **Passports**
   ```
   https://greenpay.eywademo.cloud/passports
   - View passport list
   - Edit passport (uses new consolidated service)
   - Create new passport
   ```

3. **Invoices & Vouchers**
   ```
   https://greenpay.eywademo.cloud/invoices
   - View invoices
   - Register payment
   - Generate vouchers
   - Check error toast displays correctly
   ```

4. **Browser Console**
   ```
   Open DevTools (F12)
   Check for:
   - ❌ No Supabase errors
   - ❌ No "Cannot find module" errors
   - ✅ API calls succeed
   ```

---

## 🔄 Rollback Procedure (If Needed)

### Option 1: Rollback from Backup

```bash
# SSH into server
ssh root@72.61.208.79

# List backups
ls -lh /home/eywademo-greenpay/backups/

# Restore frontend (use your backup filename)
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
rm -rf dist
tar -xzf /home/eywademo-greenpay/backups/pre-cleanup-YYYYMMDD_HHMMSS-frontend.tar.gz

# Restore backend
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
tar -xzf /home/eywademo-greenpay/backups/pre-cleanup-YYYYMMDD_HHMMSS-backend.tar.gz

# Reinstall dependencies
npm install --production

# Restart service
pm2 restart greenpay-api

# Exit SSH
exit
```

### Option 2: Rollback from Git Tag

```bash
# On local machine
cd /Users/nikolay/github/greenpay

# Get previous tag (before cleanup)
git tag -l | grep -v cleanup | tail -1

# Checkout previous version
git checkout <previous-tag>

# Build and deploy
npm install
npm run build

# Deploy (repeat steps 3-5 above)
```

---

## 📊 Deployment Verification

### Success Indicators:
- ✅ Frontend loads at https://greenpay.eywademo.cloud
- ✅ No Supabase errors in browser console
- ✅ Login/authentication works
- ✅ Passport editing works (new service)
- ✅ Invoice voucher generation works
- ✅ Toast notifications display correctly
- ✅ PM2 service running without crashes

### Failure Indicators:
- ❌ White screen / blank page
- ❌ Console errors about missing modules
- ❌ Authentication fails
- ❌ API calls return 500 errors
- ❌ PM2 service crashes repeatedly

If any failure indicators occur: **ROLLBACK IMMEDIATELY**

---

## 📞 Support & Monitoring

### Monitor Logs:
```bash
# SSH into server
ssh root@72.61.208.79

# Watch PM2 logs in real-time
pm2 logs greenpay-api

# Check specific log files
pm2 logs greenpay-api --lines 100 --err
```

### Common Issues:

**Issue: "Cannot find module @supabase/supabase-js"**
- **Cause:** Old node_modules cache
- **Fix:** `rm -rf node_modules && npm install`

**Issue: Frontend 404s**
- **Cause:** Incorrect dist path
- **Fix:** Verify dist uploaded to correct location

**Issue: API 500 errors**
- **Cause:** Missing environment variables or DB connection
- **Fix:** Check .env file, verify DB_HOST, DB_PASSWORD

---

## 📝 Post-Deployment Checklist

After successful deployment:

- [ ] Test with all user roles (Flex_Admin, Counter_Agent, etc.)
- [ ] Verify critical workflows (invoices, vouchers, passports)
- [ ] Monitor for 1 hour for any errors
- [ ] Check PM2 logs for warnings
- [ ] Test from different browsers
- [ ] Verify mobile responsiveness
- [ ] Update TESTING_SUMMARY.md with results
- [ ] Notify team of successful deployment
- [ ] Archive deployment documentation

---

## 🎉 Deployment Complete!

**What Changed:**
- Zero Supabase dependencies
- Cleaner, more maintainable code
- Consolidated services
- Enhanced error handling
- 25-30% less code

**Rollback Available:**
- Git Tag: v1.0.0-cleanup-20251209
- Backup Archives: /home/eywademo-greenpay/backups/
- GitHub Release: Ready to redeploy previous version

---

*Deployment prepared: December 9, 2025*
*Release: v1.0.0-cleanup-20251209*
*Status: READY TO DEPLOY*
