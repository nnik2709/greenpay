# Pending Fixes - Manual Testing Issues

**Last Updated:** December 20, 2024

## Completed ✅

1. **Settings Update Permission Error** - Fixed table structure migration
2. **Quotations Report Missing Column** - Added company_name column
3. **User Deactivation Failed** - Fixed field name mapping (active → isActive, role → roleId)
4. **Passport Reports Pagination** - Fixed to show all 147 passports (added limit parameter)
5. **Passport Reports Blank Names** - Fixed full_name parsing into surname and givenName
6. **Voucher Registration Validation Error** - Fixed corporate voucher detection for code 1XNDLVY9
7. **Voucher Logos** - Removed national flag placeholder, added actual PNG emblem to all voucher templates:
   - `src/components/VoucherPrint.jsx` (HTML print template)
   - `src/components/PassportVoucherReceipt.jsx` (HTML print template)
   - `backend/utils/pdfGenerator.js` (2 functions: generateVoucherPDFBuffer, generateVoucherPDF)

## High Priority - Completed ✅

All high-priority issues have been diagnosed and fixed!

---

## High Priority - Original Issues 🔴

1. **Email functionality not working** ✅ CONFIGURED
   - **Root Cause:** SMTP credentials were not configured
   - **Current Status:** SMTP configured with Gmail (nikolov1969@gmail.com)
   - **Configuration:**
     - SMTP_HOST=smtp.gmail.com
     - SMTP_PORT=587
     - SMTP_USER=nikolov1969@gmail.com
     - SMTP_PASS=wjkpavkwwlzpgrcu (App Password)
   - **See:** `EMAIL_FUNCTIONALITY_ISSUE.md` for complete setup guide
   - **Status:** Ready for testing
   - Affects: Print voucher, Quotation email, Invoice email, Voucher notifications

2. **Download Quotation not working** ✅ FIXED
   - **Root Cause:** Frontend called non-existent Supabase Edge Functions
   - **Fix Applied:**
     - Added GET `/api/quotations/:id/pdf` backend endpoint
     - Rewrote `src/lib/quotationPdfService.js` to use backend API
   - **Files Changed:**
     - `backend/routes/quotations.js` (+38 lines)
     - `src/lib/quotationPdfService.js` (complete rewrite)
   - **See:** `DEPLOY_PDF_DOWNLOAD_FIX.md` for deployment guide
   - **Status:** Ready to deploy

3. **View Invoice not working** ✅ FIXED
   - **Root Cause:** Frontend called non-existent Supabase Edge Functions
   - **Fix Applied:**
     - Backend endpoint already existed (line 1070 of invoices-gst.js)
     - Created `src/lib/invoicePdfService.js` to use backend API
   - **Files Changed:**
     - `src/lib/invoicePdfService.js` (new file, +135 lines)
   - **See:** `DEPLOY_PDF_DOWNLOAD_FIX.md` for deployment guide
   - **Status:** Ready to deploy

## Medium Priority - Completed ✅

4. **Corporate Batch History showing no data** ✅ FIXED
   - **Root Cause:** Schema mismatch between frontend code and production database
   - **Issues Found:**
     1. Frontend expected `contact_email` column (doesn't exist in production DB)
     2. Frontend expected `created_by_name` column (doesn't exist in production DB)
     3. Frontend used `used_at` field (should be `redeemed_date`)
     4. Frontend used `created_at` field (should be `issued_date`)
   - **Fix Applied:**
     - Updated `src/pages/CorporateBatchHistory.jsx` to use correct column names
     - Changed `contact_email` → hardcoded 'N/A' (column doesn't exist)
     - Changed `created_by_name` → hardcoded 'System' (column doesn't exist)
     - Changed `used_at` → `redeemed_date`
     - Changed `created_at` → `issued_date`
   - **Data Status:** 551 corporate vouchers exist, but 0 have batch_id (all are NULL)
   - **Files Changed:** `src/pages/CorporateBatchHistory.jsx`
   - **Status:** Ready to deploy

## Medium Priority - Completed ✅

5. **Navigation issues** ✅ FIXED
   - **Root Cause:** AgentLanding.jsx linked to public `/voucher-registration` route instead of staying in authenticated `/app` area
   - **Issue:** When agents clicked "Add Passport to Voucher", they were redirected OUT of the authenticated app to a public route
   - **Fix Applied:**
     - Changed path from `/voucher-registration` to `/app/scan` in AgentLanding.jsx (line 56)
     - Agents now stay within authenticated area and can scan vouchers to add passport data
   - **Files Changed:** `src/pages/AgentLanding.jsx`
   - **Status:** Built and ready to deploy

## Low Priority - Not Yet Addressed 🟢

- PDF template inconsistency
- Button styling issues
- Missing Email Templates page
- Missing PWA icons

## Notes

- All fixes deployed to production require both frontend (`/dist`) and backend (`/backend`) deployment
- Hard refresh (Ctrl+Shift+R) required after deployment to clear cached JavaScript
- Backend changes require PM2 restart: `pm2 restart greenpay-api`
