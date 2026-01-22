# Deploy Frontend - Fix Thermal Receipt Logos

**Date**: January 22, 2026
**Status**: Ready to deploy
**Priority**: High - Logos missing in thermal receipts

## What Was Fixed

Thermal receipt print page (Print All) was showing placeholder text `[CCDA]` and `[PNG Emblem]` instead of actual logo images.

**Fixed**: VoucherPrintPage.jsx now uses actual image tags pointing to `/assets/logos/ccda-logo.png` and `/assets/logos/png-emblem.png`

## Deployment Steps

### Option 1: Using deploy.sh (Recommended)

```bash
cd /Users/nikolay/github/greenpay
./deploy.sh
```

This will:
1. Build the frontend
2. Upload to server via SCP
3. Restart PM2

### Option 2: Manual Upload via CloudPanel

1. **Build is already done** - `dist/` folder is ready
2. **Upload these folders** via CloudPanel File Manager:
   - `/Users/nikolay/github/greenpay/dist/` → `/var/www/png-green-fees/dist/`
   - Make sure to include `dist/assets/logos/` folder

3. **Verify logos exist on server**:
```bash
ssh root@165.22.52.100
ls -lh /var/www/png-green-fees/dist/assets/logos/
```

You should see:
- ccda-logo.png
- png-emblem.png

4. **No PM2 restart needed** - frontend is static files

### Option 3: Using SCP Directly

```bash
cd /Users/nikolay/github/greenpay
scp -r dist/* root@165.22.52.100:/var/www/png-green-fees/dist/
```

## Verification

1. Go to https://greenpay.eywademo.cloud/app/passports/create
2. Create a batch of vouchers
3. Register passports
4. Click "Print All"
5. **Check the print preview** - you should see:
   - CCDA logo (circular, left side)
   - PNG Emblem (right side)
   - Not placeholder boxes with text

## What Changed

### Before:
```jsx
<div style={{border: '1px solid #000'}}>
  [CCDA]
</div>
<div style={{border: '1px solid #000'}}>
  [PNG Emblem]
</div>
```

### After:
```jsx
<img src="/assets/logos/ccda-logo.png" alt="CCDA Logo" style={{width: '25mm'}} />
<img src="/assets/logos/png-emblem.png" alt="PNG Emblem" style={{width: '25mm'}} />
```

## Notes

- This fix is for the **HTML thermal print** (browser window.print())
- The server-side thermal receipt PDF endpoint (`/api/vouchers/:code/thermal-receipt`) already has logos in the code but needs the pdfGenerator.js update for diagnostic logging
- Logo files already exist in `public/assets/logos/` and are included in the build

## Troubleshooting

### Logos still not showing after deployment

1. **Check browser cache** - Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
2. **Verify logos uploaded**:
   ```bash
   ssh root@165.22.52.100
   ls -lh /var/www/png-green-fees/dist/assets/logos/
   file /var/www/png-green-fees/dist/assets/logos/ccda-logo.png
   ```
3. **Check browser console** - Look for 404 errors on image URLs
4. **Verify paths** - Images should be accessible at:
   - https://greenpay.eywademo.cloud/assets/logos/ccda-logo.png
   - https://greenpay.eywademo.cloud/assets/logos/png-emblem.png

### 404 on logo images

- The `dist/assets/logos/` folder wasn't uploaded
- Re-upload the entire `dist/` folder

---

**Next Steps**: After deploying, test the Print All functionality and confirm logos appear in the print preview.
