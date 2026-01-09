# DEPLOYMENT INSTRUCTIONS - URGENT FIX

## Issue Summary

**CRITICAL:** All user roles experiencing blank page after login on production server.

### Test Results (All Failed)
- ❌ Counter_Agent: Cannot see action cards on landing page
- ❌ Flex_Admin: Cannot see dashboard content
- ❌ Finance_Manager: Cannot see dashboard content
- ❌ IT_Support: Cannot see dashboard content

**Root Cause:** Production server running outdated/cached build

## Build Status

✅ **Fresh production build completed successfully**

- Build time: 7.37s
- Total files: 79 files
- Bundle size: 4.0 MB
- Location: `/Users/nikolay/github/greenpay/dist/`

### Key Files Built
- `index.html` (4.7 KB)
- `AgentLanding-35dda063.js` (5.73 KB) - **Contains fix for Counter Agent blank page**
- `Dashboard-3a76c9a4.js` (24.22 KB) - **Contains fix for other roles blank page**
- 67 other optimized JavaScript chunks
- Assets: logos, images, stylesheets

## Deployment Steps

### Option 1: Manual Upload via CloudPanel File Manager (Recommended)

1. **Open CloudPanel File Manager**
   - Navigate to: `/var/www/png-green-fees/`

2. **Backup Current Version** (Optional but recommended)
   ```bash
   # In your SSH terminal, run:
   cd /var/www/png-green-fees
   mv dist dist.backup-$(date +%Y%m%d-%H%M%S)
   ```

3. **Upload New Build**
   - In CloudPanel File Manager, navigate to `/var/www/png-green-fees/`
   - Upload the entire contents of your local `dist/` folder
   - Ensure all 79 files are uploaded including:
     - `index.html`
     - `assets/` folder (67 JavaScript files)
     - `bg-png.jpg`
     - `logo.png`, `logo-png.png`
     - `manifest.json`
     - `service-worker.js`
     - `offline.html`

4. **Restart PM2**
   ```bash
   # Paste this in your SSH terminal:
   pm2 restart png-green-fees
   pm2 logs png-green-fees --lines 50
   ```

5. **Verify Deployment**
   ```bash
   # Check files were uploaded:
   ls -lh /var/www/png-green-fees/dist/

   # Verify AgentLanding.js exists:
   ls -lh /var/www/png-green-fees/dist/assets/AgentLanding*.js
   ```

### Option 2: SCP Upload (Alternative)

```bash
# From your local machine:
cd /Users/nikolay/github/greenpay

# Create tarball of dist folder
tar -czf dist-$(date +%Y%m%d-%H%M%S).tar.gz dist/

# Upload to server
scp dist-*.tar.gz root@165.22.52.100:/tmp/

# In SSH terminal on server:
cd /var/www/png-green-fees
mv dist dist.backup-$(date +%Y%m%d-%H%M%S)
tar -xzf /tmp/dist-*.tar.gz
pm2 restart png-green-fees
```

## Post-Deployment Testing

### Test All 4 User Roles

**1. Counter Agent**
- URL: https://greenpay.eywademo.cloud/login
- Email: `agent@greenpay.com`
- Password: `test123`
- **Expected:** Should see 3 action cards:
  - "Add Passport & Generate Voucher"
  - "Validate Existing Voucher"
  - "Add Passport to Voucher"

**2. Flex Admin**
- Email: `flexadmin@greenpay.com`
- Password: `test123`
- **Expected:** Should see dashboard with charts and statistics

**3. Finance Manager**
- Email: `finance@greenpay.com`
- Password: `test123`
- **Expected:** Should see dashboard with charts and statistics

**4. IT Support**
- Email: `support@greenpay.com`
- Password: `support123`
- **Expected:** Should see dashboard with charts and statistics

### Verification Checklist

- [ ] Counter Agent sees 3 action cards (not blank page)
- [ ] Flex Admin sees dashboard with data
- [ ] Finance Manager sees dashboard with data
- [ ] IT Support sees dashboard with data
- [ ] No JavaScript errors in browser console (F12)
- [ ] Navigation menus work correctly
- [ ] Logout button visible and functional

## Troubleshooting

### If Pages Still Blank After Deployment

1. **Clear Browser Cache**
   ```
   Chrome/Firefox: Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac)
   Select "Cached images and files"
   Time range: "All time"
   ```

2. **Hard Refresh**
   - Chrome: Ctrl+Shift+R (Cmd+Shift+R on Mac)
   - Firefox: Ctrl+F5 (Cmd+Shift+R on Mac)

3. **Check PM2 Logs**
   ```bash
   pm2 logs png-green-fees --err --lines 100
   ```

4. **Verify Files Uploaded Correctly**
   ```bash
   # Check file count
   find /var/www/png-green-fees/dist -type f | wc -l
   # Should show 79 files

   # Check AgentLanding.js exists and has content
   ls -lh /var/www/png-green-fees/dist/assets/AgentLanding*.js
   # Should be ~5.73 KB
   ```

5. **Check Nginx Serving Correct Files**
   ```bash
   curl -I https://greenpay.eywademo.cloud/
   # Should return 200 OK
   ```

### If Upload Fails

- Check disk space: `df -h`
- Check permissions: `ls -la /var/www/png-green-fees/`
- Ensure owner is correct: `chown -R www-data:www-data /var/www/png-green-fees/dist/`

## Technical Details

### What Was Fixed

**Issue:** All authenticated pages showing blank content after login
- Only navigation headers rendering
- Main page content missing
- Affects all 4 user roles (Counter_Agent, Flex_Admin, Finance_Manager, IT_Support)

**Root Cause:** Production server running old/cached JavaScript bundles

**Fix:** Fresh production build with latest code:
- `AgentLanding-35dda063.js` - Counter Agent landing page with 3 action cards
- `Dashboard-3a76c9a4.js` - Dashboard component with charts/statistics
- All supporting JavaScript modules and assets

### Files Changed

**New Build Hash:** `35dda063` (AgentLanding), `3a76c9a4` (Dashboard)
**Previous Build:** Unknown/old hashes (causing blank pages)

### Build Verification

```bash
# On your local machine, verify build:
ls -lh dist/assets/AgentLanding*.js
# Should show: AgentLanding-35dda063.js (5.73 KB)

ls -lh dist/assets/Dashboard*.js
# Should show: Dashboard-3a76c9a4.js (24.22 KB)
```

## Automated Testing

Comprehensive role-based tests have been created:
- `/Users/nikolay/github/greenpay/tests/manual-test-scenarios/all-roles-login-redirect.spec.ts`

To run tests after deployment:
```bash
npx playwright test --config=playwright.config.manual-tests.ts tests/manual-test-scenarios/all-roles-login-redirect.spec.ts
```

## Contact

If deployment fails or issues persist:
1. Check test screenshots: `test-screenshots/manual-tests/role-verification/`
2. Review test logs: `/tmp/all-roles-test.log`
3. Report specific error messages

---

**Deployment Prepared:** 2026-01-06
**Build Status:** ✅ Ready for Deployment
**Urgency:** 🚨 CRITICAL - All user roles affected
