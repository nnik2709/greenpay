# Multi-Voucher Wizard Deployment - 2026-01-20

## Status: ✅ READY FOR MANUAL DEPLOYMENT

**Build completed**: 15.86s
**Files ready**: `dist/` folder

---

## What's New in This Deployment

### Multi-Voucher Registration Wizard - Corrected Layout

**Final Side-by-Side Layout:**
- **Left (3 columns)**: Scrollable voucher cards with color coding and status
- **Right (9 columns)**: Full passport registration form with read-only scanner status

**Key Features:**
1. ✅ Voucher cards on LEFT (3 columns, scrollable)
2. ✅ Registration form on RIGHT (9 columns, full width)
3. ✅ Color coding: Blue = current, Green = registered, Gray = pending
4. ✅ Print/Email buttons on registered voucher cards
5. ✅ MRZ keyboard wedge scanner with read-only status display
6. ✅ Auto-advance to next voucher when scanner populates data
7. ✅ Smart navigation (auto-finds next unregistered voucher)
8. ✅ Field clearing between vouchers
9. ✅ Progress tracking (X of Y registered)

**Scanner Behavior:**
- Scanner status shown as read-only: "MRZ Scanner: Active" or "Not active"
- NO activate/disconnect buttons in wizard (activated before purchase)
- Auto-registers and moves to next voucher when MRZ data scanned (500ms delay)

**Navigation Improvements:**
- "Register & Continue" → automatically goes to next unregistered voucher
- "Skip This One" → skips to next unregistered voucher
- "Next Unregistered Voucher" → when viewing already-registered vouchers
- Automatically goes to completion screen when all done

---

## Files to Deploy

### Option 1: Full Frontend Deployment (Recommended)

**Source folder**: `/Users/nikolay/github/greenpay/dist/`
**Destination**: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/`

**Files to upload** (upload ALL contents of dist/ folder):
```
dist/
├── index.html
├── assets/
│   ├── index-3a442b67.js          (769.58 kB - main bundle)
│   ├── IndividualPurchase-bc943874.js  (21.84 kB - ⭐ UPDATED FILE)
│   ├── index-eda81d31.css         (74.99 kB)
│   └── [all other asset files...]
```

**Important**: Upload the ENTIRE `dist/` folder contents, not just the updated file. Vite uses content hashing in filenames, so you need all files.

---

## Deployment Steps via CloudPanel

### Step 1: Backup Current Deployment

```bash
# Via SSH (paste this in your terminal):
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
cp -r dist dist-backup-20260120-wizard-v2
ls -la | grep dist
```

Expected output:
```
drwxr-xr-x  dist
drwxr-xr-x  dist-backup-20260120-wizard-v2
```

### Step 2: Upload via CloudPanel File Manager

1. **Open CloudPanel**
   - URL: `https://greenpay.eywademo.cloud:8443`
   - Login with your credentials

2. **Navigate to the deployment folder**
   - Go to: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/`

3. **Delete current dist/ folder**
   - Select `dist/` folder
   - Click "Delete"
   - Confirm deletion

4. **Create new dist/ folder**
   - Click "New Folder"
   - Name: `dist`

5. **Upload all files from local dist/ folder**
   - Navigate into the new `dist/` folder
   - Click "Upload Files"
   - Select ALL files from `/Users/nikolay/github/greenpay/dist/`
   - Upload `index.html`
   - Upload ALL files from `dist/assets/` folder

### Step 3: Verify Upload

```bash
# Via SSH (paste this in your terminal):
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist

# Check index.html exists
ls -lh index.html

# Check assets folder
ls -lh assets/ | head -20

# Verify the updated IndividualPurchase file exists
ls -lh assets/IndividualPurchase-*.js
```

Expected output:
```
-rw-r--r-- 1 root root 4.7K Jan 20 XX:XX index.html
-rw-r--r-- 1 root root  22K Jan 20 XX:XX assets/IndividualPurchase-bc943874.js
```

### Step 4: Restart Frontend (PM2)

```bash
# Via SSH (paste this in your terminal):
pm2 restart png-green-fees
pm2 status
pm2 logs png-green-fees --lines 50
```

Expected output:
```
┌─────┬──────────────────┬─────────┬─────────┬──────────┐
│ id  │ name             │ status  │ restart │ uptime   │
├─────┼──────────────────┼─────────┼─────────┼──────────┤
│ 0   │ png-green-fees   │ online  │ X       │ Xs       │
└─────┴──────────────────┴─────────┴─────────┴──────────┘
```

### Step 5: Clear Browser Cache & Test

1. **Clear browser cache**
   - Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
   - Select "Cached images and files"
   - Clear cache
   - Close browser completely
   - Reopen browser

2. **Test the wizard**
   - Go to: `https://greenpay.eywademo.cloud`
   - Login as Counter Agent
   - Navigate to: Individual Purchase
   - Create 3 vouchers
   - Click "Start Registration Wizard"

3. **Verify new layout**
   - ✅ Left side: Registration form (larger, 8 columns)
   - ✅ Right side: Voucher cards (smaller, 4 columns)
   - ✅ All vouchers visible in right sidebar
   - ✅ Scanner shows "Activate Scanner" button
   - ✅ Click voucher cards to jump between vouchers

4. **Test registration flow**
   - Fill in passport details for voucher #1
   - Click "Register & Continue"
   - Should jump to voucher #2 automatically
   - Fill in passport details for voucher #2
   - Click "Skip This One"
   - Should jump to voucher #3
   - Register voucher #3
   - Should go to completion screen
   - Verify completion screen shows:
     - 2 registered vouchers (with details)
     - 1 unregistered voucher (skipped one)
     - "Register Now" button for skipped voucher

---

## Rollback (If Needed)

If you encounter any issues after deployment:

```bash
# Via SSH (paste this in your terminal):
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud

# Remove new dist/
rm -rf dist

# Restore backup
mv dist-backup-20260120-wizard-v2 dist

# Restart PM2
pm2 restart png-green-fees

# Verify
pm2 status
```

---

## Testing Checklist

### Basic Functionality
- [ ] Single voucher: "Start Wizard" button does NOT appear
- [ ] Multiple vouchers: "Start Wizard" button appears
- [ ] Wizard opens with correct layout (form left, cards right)
- [ ] All vouchers visible in right sidebar
- [ ] Click voucher card switches to that voucher
- [ ] Current voucher highlighted with blue border

### Registration Flow
- [ ] MRZ scanner shows "Activate Scanner" button
- [ ] Passport fields clear when moving to new voucher
- [ ] "Register & Continue" saves data and moves to next
- [ ] "Skip This One" moves to next without saving
- [ ] Status icons update correctly (⏳ → ✅)
- [ ] Passport number shows in registered voucher cards

### Completion Screen
- [ ] Shows count: "X of Y registered"
- [ ] Lists all registered vouchers with details
- [ ] Lists all unregistered vouchers (if any)
- [ ] "Register Now" button works for skipped vouchers
- [ ] Can return to wizard from completion

### Edge Cases
- [ ] Register all vouchers → completion shows all green
- [ ] Skip all vouchers → completion shows all yellow
- [ ] Mix of registered/skipped → completion shows both sections
- [ ] Re-register button works (removes from registered set)

---

## Known Issues & Limitations

### Current MVP Limitations
1. **No backend integration yet**: Registration data is stored locally in state (not saved to database)
2. **No bulk actions yet**: Email All, Print All, Download All coming in Phase 2
3. **No persistence**: Browser refresh loses wizard progress
4. **No MRZ scanner actual integration**: Scanner button activates keyboard listener, but actual MRZ parsing needs testing with physical scanner

### What's Coming in Phase 2
- Backend API integration for actual voucher registration
- Bulk email (one email with multiple PDFs)
- Bulk print (concatenated PDF)
- Bulk download (ZIP of PDFs)
- Progress persistence (survive browser refresh)
- Individual voucher actions on completion screen

---

## File Changes Summary

### Modified Files
- `src/pages/IndividualPurchase.jsx` (IndividualPurchase-a004c0f7.js in dist/)
  - **Corrected wizard layout**: Voucher cards LEFT (3 columns), form RIGHT (9 columns)
  - **Removed duplicate form sections** (was causing rendering issues)
  - **Scanner status**: Changed to read-only display (no activate/disconnect buttons)
  - **Auto-advance**: Automatically registers and moves to next voucher when MRZ scanned
  - **Color coding**: Blue border = current, Green = registered with Print/Email, Gray = pending
  - **Smart navigation**: Auto-finds next unregistered voucher
  - **Field clearing**: useEffect clears/populates fields when switching vouchers

### No Backend Changes
This deployment only affects the frontend. No backend files need to be deployed.

---

## Support

If you encounter issues:

1. **Check PM2 logs**:
   ```bash
   pm2 logs png-green-fees --lines 100
   ```

2. **Check browser console** (F12 → Console tab)

3. **Verify file upload**:
   ```bash
   ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/assets/ | grep IndividualPurchase
   ```

4. **Check PM2 is serving from correct path**:
   ```bash
   pm2 describe png-green-fees | grep cwd
   ```

---

## Deployment Verification Commands

Run these after deployment to verify everything is correct:

```bash
# 1. Verify dist folder exists and has files
ssh root@165.22.52.100 "ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/ | head -5"

# 2. Verify assets folder has the new file
ssh root@165.22.52.100 "ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/assets/IndividualPurchase-*.js"

# 3. Check PM2 status
ssh root@165.22.52.100 "pm2 status | grep png-green-fees"

# 4. Check PM2 logs for errors
ssh root@165.22.52.100 "pm2 logs png-green-fees --lines 20 --err"
```

---

**Prepared by**: Claude Code
**Date**: 2026-01-20
**Build time**: 8.99s
**Status**: ✅ Ready for deployment
**Session**: Multi-Voucher Wizard Redesign - Side-by-side layout
