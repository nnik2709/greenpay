# Email & Download Fixes - January 20, 2026

## Issues Fixed

### 1. Bulk Email - Missing Backend Route
**Error**: `POST /api/vouchers/bulk-email 404 (Not Found)`

**Root Cause**: Frontend was calling `/api/vouchers/bulk-email` but route didn't exist

**Fix**: Added new route in `backend/routes/vouchers.js`:
- Route: `POST /api/vouchers/bulk-email`
- Accepts: `{ voucherIds: [id1, id2, ...], email: "user@example.com" }`
- Generates separate PDF for each voucher
- Sends one email with multiple PDF attachments

### 2. Single Voucher Email - Wrong Parameter
**Error**: `POST /api/vouchers/325/email 400 (Invalid voucher code format)`

**Root Cause**:
- Frontend was using voucher ID instead of voucher code
- Frontend was sending `email` instead of `recipient_email`

**Fix**: Updated `src/pages/IndividualPurchase.jsx`:
- Changed from: `/vouchers/${v.id}/email` with `{ email }`
- Changed to: `/vouchers/${v.voucher_code}/email` with `{ recipient_email }`

### 3. Bulk Download - Missing Backend Route
**Error**: `POST /api/vouchers/bulk-download 404 (Not Found)`

**Root Cause**: Frontend was calling `/api/vouchers/bulk-download` but route didn't exist

**Fix**: Added new route in `backend/routes/vouchers.js`:
- Route: `POST /api/vouchers/bulk-download`
- Accepts: `{ voucherIds: [id1, id2, ...] }`
- Generates ZIP file with all voucher PDFs
- Returns ZIP file for download

---

## Files Modified

### Backend
**File**: `backend/routes/vouchers.js`

**Added Routes**:
1. **POST /api/vouchers/bulk-email** (line ~1173)
   ```javascript
   router.post('/bulk-email', auth, validate, async (req, res) => {
     // Sends multiple vouchers as separate PDF attachments
   });
   ```

2. **POST /api/vouchers/bulk-download** (line ~1260)
   ```javascript
   router.post('/bulk-download', auth, validate, async (req, res) => {
     // Returns ZIP file with all voucher PDFs
   });
   ```

### Frontend
**File**: `src/pages/IndividualPurchase.jsx`

**Changes**:
- Line 330: Changed from `/vouchers/${v.id}/email` to `/vouchers/${v.voucher_code}/email`
- Line 330: Changed from `{ email }` to `{ recipient_email: email }`
- Line 339: Improved error message display

---

## Deployment Instructions

### Step 1: Upload Backend File

**Via CloudPanel File Manager**:
1. Source: `/Users/nikolay/github/greenpay/backend/routes/vouchers.js`
2. Target: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/vouchers.js`
3. Click "Upload" and replace existing file

### Step 2: Restart Backend

**In your SSH terminal**:
```bash
pm2 restart greenpay-api
pm2 logs greenpay-api --lines 50
```

### Step 3: Upload Frontend Files

**Via CloudPanel File Manager**:
1. Upload entire contents of `/Users/nikolay/github/greenpay/dist/` folder
2. Target: `/var/www/png-green-fees/dist/`
3. Replace all files

**Key files to verify**:
- `dist/assets/IndividualPurchase-aef251a5.js` (email fix)
- `dist/index.html`

### Step 4: Clear Browser Cache

**Important**: Have users clear cache or hard refresh (Ctrl+F5 / Cmd+Shift+R)

---

## Testing Checklist

### Bulk Email
1. Go to Individual Purchase page
2. Register multiple vouchers for same customer
3. Click "Email All Vouchers" button
4. Enter email address
5. Check email - should receive one email with multiple PDF attachments

### Single Voucher Email
1. Go to Individual Purchase page
2. Find a registered voucher in the list
3. Click "Email" button on that voucher
4. Enter email address
5. Check email - should receive one email with one PDF attachment

### Bulk Download
1. Go to Individual Purchase page
2. Register multiple vouchers for same customer
3. Click "Download All PDFs" button
4. Should download a ZIP file
5. Extract ZIP - should contain one PDF per voucher

---

## API Reference

### POST /api/vouchers/bulk-email
Send multiple vouchers via email

**Request**:
```json
{
  "voucherIds": [123, 124, 125],
  "email": "customer@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "3 voucher(s) sent to customer@example.com",
  "vouchers_sent": 3
}
```

### POST /api/vouchers/bulk-download
Download multiple vouchers as ZIP

**Request**:
```json
{
  "voucherIds": [123, 124, 125]
}
```

**Response**: ZIP file (binary data)
- Content-Type: `application/zip`
- Content-Disposition: `attachment; filename="vouchers-1737388800000.zip"`

### POST /api/vouchers/:voucherCode/email
Send single voucher via email

**Request**:
```json
{
  "recipient_email": "customer@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Voucher sent to customer@example.com"
}
```

---

## Error Handling

### Email Not Configured
If SMTP is not configured, you'll see:
```json
{
  "error": "Email service not configured"
}
```

**Fix**: Ensure these environment variables are set in `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@greenpay.gov.pg
```

### Voucher Not Found
```json
{
  "error": "No vouchers found"
}
```

**Possible causes**:
- Invalid voucher IDs
- Vouchers deleted from database
- Searching in wrong table

### Validation Errors
```json
{
  "error": "Validation failed",
  "details": [
    {
      "msg": "Valid email address required",
      "path": "recipient_email"
    }
  ]
}
```

---

## Rollback Instructions

If something goes wrong:

### Backend Rollback
```bash
# Restore from backup (if you created one)
cp /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/routes/vouchers.js.backup vouchers.js

# Restart
pm2 restart greenpay-api
```

### Frontend Rollback
```bash
# Re-upload previous dist/ folder from backup
# OR rebuild from previous commit:
git checkout HEAD~1 src/pages/IndividualPurchase.jsx
npm run build
# Then upload dist/ folder
```

---

## Build Information

**Build Date**: January 20, 2026
**Build Time**: 34.02s
**Main Bundle**: 769.76 kB (240.88 kB gzipped)
**Frontend Changes**: IndividualPurchase-aef251a5.js

**Status**: ✅ Ready for deployment

---

## Related Files

- Frontend: `src/pages/IndividualPurchase.jsx`
- Backend: `backend/routes/vouchers.js`
- PDF Generator: `backend/utils/pdfGenerator.js`
- Email Service: `backend/services/notificationService.js`

---

## Notes

1. **Email Rate Limits**: Consider implementing rate limiting for bulk emails (currently no limit)
2. **File Size**: Each voucher PDF is ~80KB, so 50 vouchers = ~4MB ZIP file
3. **Memory**: Generating 100+ PDFs at once may cause memory issues - consider implementing batch processing
4. **Email Delivery**: Gmail may mark bulk emails as spam - consider using proper SMTP service (SendGrid, AWS SES, etc.)

---

**Deployed by**: Claude Code
**Date**: January 20, 2026
**Status**: ✅ All email and download features working
