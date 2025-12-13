# Production Deployment Guide

## 🚀 Latest Build: Scanner Integration (Nov 21, 2024)

### Build Information
- **Build Size:** 3.1 MB
- **Asset Files:** 78 files
- **Commit:** 7fc3f6f
- **Branch:** main
- **Vite Version:** 4.5.14

---

## 📦 What's in This Build

### New Features
✅ **Hardware Scanner Integration**
- USB/Bluetooth keyboard wedge scanner support
- Automatic MRZ passport parsing (88 characters)
- QR code and barcode scanning
- Visual feedback during scanning
- Works on all updated pages

### Updated Pages
1. **ScanAndValidate.jsx** - QR/Voucher validation with hardware scanner
2. **IndividualPurchase.jsx** - Full MRZ auto-fill for passport purchase
3. **CreatePassport.jsx** - MRZ scanning for manual passport entry
4. **PublicRegistration.jsx** - Customer self-service with scanner
5. **ScannerTest.jsx** - NEW: Interactive scanner testing page

### New Infrastructure
- `useScannerInput` hook - Scanner detection system
- `mrzParser.js` - ICAO-compliant MRZ parser
- `ScannerInput` component - Reusable scanner input
- `scannerConfig.js` - Scanner configuration profiles

---

## 🔧 Deployment Steps

### Option 1: Using Deployment Scripts (Recommended)

```bash
# On your VPS (as root or with sudo):
cd /var/www/png-green-fees

# Pull latest changes
git pull origin main

# Install dependencies (if needed)
npm install

# Build production bundle
npm run build

# Restart PM2
pm2 restart png-green-fees

# Check status
pm2 status
pm2 logs png-green-fees --lines 50
```

### Option 2: Manual Deployment

```bash
# 1. On your local machine (already done):
npm run build
# Build is in ./dist/

# 2. Copy dist folder to server:
scp -r dist/* user@your-server:/var/www/png-green-fees/dist/

# 3. On server, restart PM2:
pm2 restart png-green-fees
```

### Option 3: Using update.sh Script

```bash
# On your VPS:
cd /var/www/png-green-fees
./update.sh
```

---

## ✅ Post-Deployment Verification

### 1. Check Application is Running
```bash
pm2 status
# Should show: png-green-fees | online
```

### 2. Check Logs
```bash
pm2 logs png-green-fees --lines 50
# Should show no errors
```

### 3. Test in Browser

Visit these URLs to verify:

1. **Main App:** https://eywademo.cloud
2. **Login:** https://eywademo.cloud/login
3. **Scanner Test:** https://eywademo.cloud/scanner-test (requires login)

### 4. Test Scanner Integration

**Without Hardware:**
1. Login as admin or agent
2. Visit any passport entry page
3. Look for "Ready for Hardware Scanner" indicator
4. Verify manual entry still works

**With Hardware (when available):**
1. Connect USB scanner
2. Visit `/scanner-test`
3. Scan passport MRZ or test barcode
4. Verify scan is detected and parsed
5. Check scan history for metrics

---

## 🔍 Troubleshooting

### Build Issues
```bash
# Clear node_modules and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### PM2 Not Starting
```bash
# Check PM2 configuration
pm2 describe png-green-fees

# Restart with fresh logs
pm2 delete png-green-fees
pm2 start npm --name png-green-fees -- run preview
pm2 save
```

### Nginx Not Serving
```bash
# Check Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check logs
sudo tail -f /var/log/nginx/error.log
```

### Scanner Not Working
1. **Check browser console** for errors
2. **Visit `/scanner-test`** page for debugging
3. **Enable debug mode** in scanner config
4. **Check scanner profile** in `scannerConfig.js`

---

## 📊 Server Configuration

### Current Setup
- **Build Location:** `/var/www/png-green-fees/dist`
- **PM2 App Name:** `png-green-fees`
- **Server Port:** 3000
- **Domain:** eywademo.cloud (HTTPS enabled)
- **Nginx Proxy:** Port 80/443 → Port 3000

### PM2 Configuration
```bash
# Current running command:
npm run preview

# Equivalent to:
vite preview --port 3000 --host ::
```

---

## 🆕 New Routes

Added in this deployment:

| Route | Access | Description |
|-------|--------|-------------|
| `/scanner-test` | Flex_Admin, IT_Support, Counter_Agent | Interactive scanner testing page |

---

## 📝 Environment Variables

Required (already configured in your `.env`):
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

No new environment variables required for scanner integration.

---

## 🔐 Security Notes

- Scanner integration uses standard keyboard events (no special permissions)
- No new external dependencies added
- All scanner logic runs client-side
- No sensitive data transmitted during scanning
- MRZ parsing happens in browser (no server calls)

---

## 📈 Performance Impact

- **Bundle size increase:** ~30 KB (compressed)
- **New lazy-loaded pages:** 1 (ScannerTest)
- **Runtime performance:** No impact (scanner hook is idle until used)
- **Network requests:** No additional API calls

---

## 🎯 Testing Checklist

Before considering deployment complete:

- [ ] Application loads successfully
- [ ] Login works
- [ ] Existing pages work normally
- [ ] Scanner indicator shows on updated pages
- [ ] Manual data entry still works
- [ ] Forms submit correctly
- [ ] No console errors
- [ ] `/scanner-test` page accessible (when logged in)

---

## 📞 Rollback Plan

If issues occur, rollback to previous version:

```bash
# On server:
cd /var/www/png-green-fees

# Check previous commit
git log --oneline -5

# Rollback to previous commit (replace COMMIT_HASH)
git reset --hard 5671107  # Previous stable commit

# Rebuild and restart
npm run build
pm2 restart png-green-fees
```

Previous stable commit: `5671107` (before scanner integration)

---

## 📚 Documentation

- **Scanner Integration Guide:** `SCANNER_INTEGRATION.md`
- **Quick Start Guide:** `SCANNER_QUICK_START.md`
- **Project Documentation:** `CLAUDE.md` (updated)
- **User Instructions:** See "How to Use" cards on each page

---

## 🎉 Success Indicators

Deployment is successful when:

1. ✅ Application loads without errors
2. ✅ All existing features work normally
3. ✅ Scanner status indicators visible on updated pages
4. ✅ `/scanner-test` route accessible
5. ✅ No console errors in browser
6. ✅ PM2 shows status: "online"
7. ✅ Nginx serves app correctly

---

## 📧 Support

If you encounter issues:

1. Check PM2 logs: `pm2 logs png-green-fees`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check browser console for client-side errors
4. Review this deployment guide
5. Refer to scanner documentation

---

**Deployment prepared:** November 21, 2024
**Build version:** 1.0.0-scanner-integration
**Status:** ✅ Ready for Production

---

## Quick Deploy Command (All-in-One)

```bash
cd /var/www/png-green-fees && \
git pull origin main && \
npm install && \
npm run build && \
pm2 restart png-green-fees && \
pm2 logs png-green-fees --lines 20
```

Copy and paste this single command on your server for quick deployment! 🚀
