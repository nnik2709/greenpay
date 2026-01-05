# Deploy PDF Download Fix

**Date:** December 20, 2024
**Priority:** HIGH
**Time Required:** 5 minutes

---

## Changes Made

### ✅ Backend (1 new endpoint)
1. **`backend/routes/quotations.js`** - Added GET `/:id/pdf` endpoint (line 431-468)

### ✅ Frontend (2 files updated)
2. **`src/lib/quotationPdfService.js`** - Replaced Supabase calls with backend API
3. **`src/lib/invoicePdfService.js`** - Created new invoice PDF service

**Note:** Invoice PDF endpoint already existed in backend (line 1070 of `backend/routes/invoices-gst.js`)

---

## Files to Deploy

### Backend:
```
backend/routes/quotations.js
```

### Frontend:
```
src/lib/quotationPdfService.js
src/lib/invoicePdfService.js
```

---

## Deployment Steps

### Option 1: Quick Deploy (Using git)

```bash
# On production server
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud

# Pull latest changes
git pull origin main

# Restart backend
pm2 restart greenpay-api

# Rebuild and deploy frontend
npm run build
```

### Option 2: Manual Deploy (If not using git)

**Backend:**
1. Upload `backend/routes/quotations.js` to server
2. Restart PM2: `pm2 restart greenpay-api`

**Frontend:**
1. Build locally: `npm run build`
2. Upload `dist/` folder to server: `/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/dist`

---

## Testing After Deployment

### Test Quotation Download:
1. Login as Finance Manager or Flex_Admin
2. Go to Quotations page
3. Click "Download" button on any quotation
4. Verify PDF downloads with correct filename

### Test Invoice View:
1. Go to Invoices page
2. Click "View" or "Download" button on any invoice
3. Verify PDF opens/downloads correctly

### Expected Results:
- ✅ PDFs download with proper filenames
- ✅ PDFs open correctly in browser
- ✅ No console errors
- ✅ No "Supabase Edge Function not found" errors

---

## Troubleshooting

### Issue: "Failed to download PDF"
**Check:**
1. Backend is running: `pm2 status greenpay-api`
2. No errors in backend logs: `pm2 logs greenpay-api`
3. User is authenticated (check browser localStorage for 'authToken')

### Issue: "Not authenticated"
**Fix:** User needs to log out and log back in

### Issue: PDF opens with garbled content
**Check:** Content-Type header is set to 'application/pdf' in backend

---

## What This Fixes

### Before:
- ❌ Download Quotation button threw "Supabase Edge Function not found" error
- ❌ View Invoice button threw similar error
- ❌ No way to download quotations/invoices as PDF

### After:
- ✅ Download Quotation works - downloads PDF file
- ✅ View Invoice works - opens PDF in new tab
- ✅ Both use backend API endpoints (no Supabase dependency)

---

## Technical Details

### New Backend Endpoint:

**GET /api/quotations/:id/pdf**
- **Auth:** Required (JWT)
- **Roles:** Flex_Admin, Finance_Manager, Counter_Agent
- **Response:** application/pdf binary
- **Headers:**
  - Content-Type: application/pdf
  - Content-Disposition: attachment; filename="Quotation_XXX.pdf"

### Existing Backend Endpoint (Already Working):

**GET /api/invoices/:id/pdf**
- **Auth:** Required (JWT)
- **Roles:** Flex_Admin, Finance_Manager, IT_Support
- **Response:** application/pdf binary
- **Headers:**
  - Content-Type: application/pdf
  - Content-Disposition: attachment; filename="Invoice-XXX.pdf"

### Frontend Services:

**quotationPdfService.js:**
- `downloadQuotationPDF(id, number)` - Downloads PDF
- `viewQuotationPDF(id)` - Opens PDF in new tab
- `emailQuotationPDF(id, email)` - Sends PDF via email

**invoicePdfService.js:** (NEW)
- `downloadInvoicePDF(id, number)` - Downloads PDF
- `viewInvoicePDF(id)` - Opens PDF in new tab
- `emailInvoicePDF(id, email)` - Sends PDF via email

---

## Updated Files Summary

| File | Lines Changed | Type |
|------|---------------|------|
| backend/routes/quotations.js | +38 | New endpoint |
| src/lib/quotationPdfService.js | ~100 (complete rewrite) | API migration |
| src/lib/invoicePdfService.js | +135 | New file |

**Total:** 3 files modified/created

---

## Verification Commands

```bash
# On production server after deployment

# 1. Check backend is running
pm2 status greenpay-api

# 2. Check recent backend logs
pm2 logs greenpay-api --lines 20

# 3. Test quotation PDF endpoint (replace {id} with actual quotation ID)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://greenpay.eywademo.cloud/api/quotations/{id}/pdf \
  --output test-quotation.pdf

# 4. Test invoice PDF endpoint (replace {id} with actual invoice ID)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://greenpay.eywademo.cloud/api/invoices/{id}/pdf \
  --output test-invoice.pdf

# 5. Check if PDFs were created
ls -lh test-*.pdf
```

---

## Rollback Plan

If issues occur:

```bash
# Backend rollback
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud
git log -5 --oneline
git reset --hard <previous-commit-hash>
pm2 restart greenpay-api

# Frontend rollback
# Restore previous dist/ folder from backup
```

---

## Summary

**Problem:** Download Quotation and View Invoice not working (Supabase dependency)

**Solution:**
- Added quotation PDF download endpoint to backend
- Updated frontend services to use backend API instead of Supabase
- Created invoice PDF service (backend endpoint already existed)

**Impact:**
- ✅ Quotation download now works
- ✅ Invoice view now works
- ✅ No Supabase dependency
- ✅ ~2 hours of implementation

**Deployment:**
- Backend: 1 file (quotations.js)
- Frontend: 2 files (quotationPdfService.js, invoicePdfService.js)
- Time: 5 minutes

---

**Document Version:** 1.0
**Last Updated:** December 20, 2024
**Ready for Deployment:** ✅ YES
