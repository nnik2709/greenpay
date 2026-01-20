# WebSerial Scanner Integration Deployment - 2026-01-20

## ✅ Status: READY FOR MANUAL DEPLOYMENT

**Build completed**: 15.78s
**Build time**: 2026-01-20
**Critical Fix**: MRZ Scanner now uses WebSerial API for proper USB connection

---

## What's Fixed in This Deployment

### ✅ WebSerial USB Scanner Integration

**Issue Reported**: "Activate Scanner do not work same way as Connect Scanner - KB ACCEPT light still RED. It should go OFF when KB Scanner is connected via webserial USB"

**Root Cause**: The multi-voucher wizard was using `useScannerInput` hook (keyboard wedge listener only) instead of `useWebSerial` hook (proper USB connection with DTR/RTS signals).

**Solution Implemented**:
- ✅ Replaced `useScannerInput` with `useWebSerial` in multi-voucher wizard
- ✅ Scanner now establishes proper WebSerial USB connection
- ✅ Sets DTR/RTS signals to turn ACCEPT light from RED → GREEN
- ✅ Auto-connects to remembered scanner on page load
- ✅ Auto-reconnects if scanner is unplugged and replugged
- ✅ Shows proper connection states: "Not Connected", "Connecting...", "Connected", "Ready (LED Green)"

**File Modified**: `src/pages/IndividualPurchase.jsx`

**Changes Made**:
1. Replaced import: `useScannerInput` → `useWebSerial`
2. Updated scanner initialization with proper WebSerial options:
   ```javascript
   const scanner = useWebSerial({
     autoConnect: true,
     autoReconnect: true,
     onScan: (scannedData) => { /* ... */ }
   });
   ```
3. Updated scanner status display to show WebSerial connection states:
   - Green background + "Ready (LED Green)" when scanner is ready
   - Yellow background + "Connecting..." when establishing connection
   - Gray background + "Not Connected" when disconnected
   - Shows error messages if connection fails
   - Shows scan count when scanner is active

**How It Works Now**:
1. User clicks "Connect Scanner" button (one time only)
2. Browser shows USB device picker
3. User selects the MRZ scanner device
4. WebSerial establishes USB connection
5. Sets DTR/RTS signals → ACCEPT light changes from RED to GREEN
6. Scanner is ready to scan passports
7. Browser remembers the device - auto-connects next time!

---

## Files to Deploy

### Frontend Deployment (Recommended)

**Source folder**: `/Users/nikolay/github/greenpay/dist/`
**Destination**: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/`

**Key Files Updated**:
- `assets/IndividualPurchase-66e3babf.js` (19.45 kB) - ⭐ Multi-voucher wizard with WebSerial
- `assets/useWebSerial-63ba021a.js` (10.01 kB) - ⭐ WebSerial USB connection hook
- `assets/QuotationsReports-4ed8a4de.js` (4.15 kB) - Fixed filtering (from previous deployment)

**Important**: Upload ALL contents of dist/ folder (Vite uses content hashing, so all files are needed).

---

## Deployment Steps via CloudPanel

### Step 1: Backup Current Deployment

```bash
# Via SSH (paste this in your terminal):
ssh root@165.22.52.100
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
cp -r dist dist-backup-20260120-webserial
ls -la | grep dist
```

Expected output:
```
drwxr-xr-x  dist
drwxr-xr-x  dist-backup-20260120-webserial
```

### Step 2: Upload via CloudPanel File Manager

1. **Open CloudPanel**
   - URL: `https://greenpay.eywademo.cloud:8443`
   - Login with your credentials

2. **Navigate to deployment folder**
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

# Verify the updated files exist
ls -lh assets/IndividualPurchase-*.js
ls -lh assets/useWebSerial-*.js
ls -lh assets/QuotationsReports-*.js
```

Expected output:
```
-rw-r--r-- 1 root root 4.7K Jan 20 XX:XX index.html
-rw-r--r-- 1 root root  20K Jan 20 XX:XX assets/IndividualPurchase-66e3babf.js
-rw-r--r-- 1 root root  10K Jan 20 XX:XX assets/useWebSerial-63ba021a.js
-rw-r--r-- 1 root root 4.2K Jan 20 XX:XX assets/QuotationsReports-4ed8a4de.js
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

2. **Test WebSerial scanner connection**
   - Go to: `https://greenpay.eywademo.cloud/app/individual-purchase`
   - Login as Counter Agent
   - Create 2-3 vouchers
   - Click "Start Registration Wizard"
   - **CRITICAL**: Click "Connect Scanner" button
   - Browser should show USB device picker
   - Select the MRZ scanner device
   - Status should change to "Ready (LED Green)"
   - **VERIFY**: Scanner ACCEPT light should turn from RED to GREEN ✅
   - Scan a passport with the MRZ scanner
   - Data should auto-fill in the form
   - Voucher should auto-register and advance to next

3. **Test auto-reconnect**
   - Refresh the page
   - Scanner should auto-connect (no need to click button again)
   - Status should automatically show "Ready (LED Green)"
   - ACCEPT light should be GREEN

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
mv dist-backup-20260120-webserial dist

# Restart PM2
pm2 restart png-green-fees

# Verify
pm2 status
```

---

## Testing Checklist

### WebSerial Scanner Connection
- [ ] Login as Counter_Agent
- [ ] Navigate to Individual Purchase
- [ ] Create 2-3 vouchers
- [ ] Click "Start Registration Wizard"
- [ ] Status shows "Not Connected" with gray dot
- [ ] Click "Connect Scanner" button
- [ ] Browser shows USB device picker
- [ ] Select MRZ scanner device from list
- [ ] Status changes to "Connecting..." with yellow pulsing dot
- [ ] Status changes to "Ready (LED Green)" with green dot
- [ ] **VERIFY**: Physical scanner ACCEPT light is GREEN (not RED) ✅
- [ ] Scan a passport with MRZ scanner
- [ ] Passport data auto-fills in form fields
- [ ] Voucher auto-registers and moves to next

### Auto-Connect & Auto-Reconnect
- [ ] Refresh page (Ctrl+R)
- [ ] Scanner should auto-connect without clicking button
- [ ] Status should show "Ready (LED Green)" automatically
- [ ] ACCEPT light should be GREEN
- [ ] Unplug scanner USB cable
- [ ] Status should show "Not Connected"
- [ ] Plug scanner back in
- [ ] Scanner should auto-reconnect within 5 seconds
- [ ] Status should show "Ready (LED Green)"
- [ ] ACCEPT light should be GREEN again

### Multi-Voucher Wizard (Already Working)
- [ ] Wizard layout: LEFT = voucher cards, RIGHT = form
- [ ] Scanner integration works in wizard
- [ ] Auto-advance after scanning
- [ ] Navigation between vouchers works
- [ ] Completion screen shows registered vouchers

### Quotation Reports Filtering (From Previous Deployment)
- [ ] Login as Flex_Admin or Finance_Manager
- [ ] Navigate to Reports → Quotations
- [ ] Type "sent" in Status filter → shows only "Sent" quotations
- [ ] Type customer name → shows only that customer
- [ ] Select date range → filters by date correctly

---

## Technical Details

### WebSerial API vs Keyboard Wedge

**Old Approach (useScannerInput)**:
- Only listened for keyboard input patterns
- No actual USB device connection
- No DTR/RTS signals sent
- ACCEPT light stays RED
- Unreliable connection

**New Approach (useWebSerial)**:
- Establishes proper WebSerial USB connection
- Requests USB port access from browser
- Opens serial port with 9600 baud rate
- Sets DTR/RTS signals to enable scanner
- ACCEPT light turns GREEN ✅
- Reads data directly from serial port
- Auto-reconnects on USB disconnect/reconnect
- Browser remembers device for auto-connect

### Browser Requirements

**WebSerial API Support**:
- ✅ Chrome 89+ (Windows, macOS, Linux)
- ✅ Edge 89+ (Windows, macOS)
- ❌ Firefox (not supported)
- ❌ Safari (not supported)

**HTTPS Requirement**:
- WebSerial API only works on HTTPS or localhost
- Production site uses HTTPS ✅

### Scanner Hardware Settings

**PrehKeyTec MC147 Serial Settings**:
```javascript
{
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  flowControl: 'none'
}
```

**DTR/RTS Signals**:
- Set to `true` to enable scanner (LED GREEN)
- Set to `false` to disable scanner (LED RED)
- Hook sets both signals on connection

---

## Known Issues & Limitations

### Browser Compatibility
- **Firefox & Safari**: WebSerial API not supported. Users must use Chrome or Edge.
- **Mobile browsers**: WebSerial API not available on mobile devices.

### First-Time Setup
- User must click "Connect Scanner" button once to grant USB permissions
- Browser shows device picker - user must select correct scanner
- Permissions are saved per-origin (remembered permanently)

### Connection States
- **Disconnected**: Gray dot, "Not Connected"
- **Connecting**: Yellow pulsing dot, "Connecting..."
- **Connected**: Status changes quickly to "Ready"
- **Ready**: Green dot, "Ready (LED Green)" - scanner is ready to scan
- **Error**: Red text shows error message

---

## Support

If you encounter issues:

1. **Check PM2 logs**:
   ```bash
   pm2 logs png-green-fees --lines 100
   ```

2. **Check browser console** (F12 → Console tab)
   - Look for WebSerial connection logs
   - Check for "Web Serial API not supported" error

3. **Verify file upload**:
   ```bash
   ls -lh /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist/assets/ | grep -E "(IndividualPurchase|useWebSerial|QuotationsReports)"
   ```

4. **Verify browser compatibility**:
   - Ensure using Chrome or Edge (not Firefox or Safari)
   - Check browser version is recent (Chrome 89+)

5. **Check USB device connection**:
   - In browser console, type: `navigator.serial.getPorts()`
   - Should return array with scanner device if connected

---

## Summary

**✅ Fixed in This Deployment**:
1. WebSerial USB scanner integration - ACCEPT light now turns GREEN
2. Auto-connect to remembered scanner device
3. Auto-reconnect on USB disconnect/reconnect
4. Proper connection state indicators
5. Error messaging for connection issues

**✅ Already Working (From Previous Deployments)**:
- Multi-voucher registration wizard layout
- Quotation reports filtering
- MRZ data parsing and auto-fill

**🔧 How to Verify Success**:
After deployment, the scanner ACCEPT light should turn from RED to GREEN when you click "Connect Scanner". If it stays RED, the WebSerial connection failed.

---

**Prepared by**: Claude Code
**Date**: 2026-01-20
**Build time**: 15.78s
**Status**: ✅ Ready for deployment
**Session**: WebSerial USB Scanner Integration Fix
