# Manual Testing Issues - 2025-12-19

## Priority 1: Critical Errors (Blocking Features)

### 1. ✅ FIXED - View Vouchers by Passport
- **Error:** `/api/vouchers/by-passport/:passportNumber` returns 500
- **Cause:** Column `card_last_four` doesn't exist, endpoint uses old schema
- **Status:** Feature removed entirely (not needed - can filter in vouchers list)

### 2. Settings Update Permission Error
- **Error:** `must be owner of table settings` when saving
- **Location:** `/app/admin/settings`
- **Status:** TODO - Database permission issue

### 3. Passport Reports Not Working
- **Error:** Not showing actual data
- **Location:** `/app/reports/passports`
- **Status:** TODO - Investigate query

### 4. Voucher Registration Link Not Working
- **Error:** Invalid voucher code on registration page
- **Example:** `https://greenpay.eywademo.cloud/register/1XNDLVY9`
- **Status:** TODO - Check registration endpoint

### 5. Ticket Creation Failing
- **Error:** Validation failed - Title required, Invalid category
- **Location:** `/app/tickets`
- **Status:** TODO - Fix validation/form fields

---

## Priority 2: Important Features Not Working

### 6. Email Features Not Working
- Print voucher email (Counter Agent) - no email prompt
- Quotation email (Finance Manager) - sends but not received
- **Status:** TODO - Fix email prompts and SMTP

### 7. Download Quotation Not Working
- **Location:** Finance Manager role
- **Status:** TODO - Fix PDF generation

### 8. View Invoice Not Working
- **Location:** Finance Manager - Invoices page
- **Status:** TODO - Check invoice detail page

### 9. User Management Issues
- Deactivate user: `No fields to update` error
- Change user role: No error but doesn't work
- **Location:** `/app/users`
- **Status:** TODO - Fix user update logic

### 10. Quotations Report Permission Error
- **Error:** 403 Insufficient permissions for IT_Support
- **Location:** `/app/reports/quotations`
- **Status:** TODO - Fix RBAC permissions

### 11. Corporate Vouchers Report Issues
- Print not working
- Status shows "Active" instead of "Pending" when no passport
- **Location:** `/app/reports/corporate-vouchers`
- **Status:** TODO - Fix print and status logic

---

## Priority 3: Navigation & Routing Issues

### 12. Blank Pages (IT_Support Role)
- `/app/passports` → Shows blank page
- `/app/cash-reconciliation` → Shows blank page
- **Status:** TODO - Fix routing or add proper redirects

### 13. Wrong Redirects (IT_Support Role)
- "Scan Exit Pass" → Goes to `/app/dashboard` (should be `/app/scan-and-validate`)
- "Voucher Scanner" → Goes to `/app/scanner-test`
- **Status:** TODO - Fix navigation links

### 14. Corporate Batch History Not Showing Data
- **Location:** `/app/payments/corporate-batch-history`
- **Status:** TODO - Check query

---

## Priority 4: UI/UX Issues

### 15. PDF Template Inconsistency
- Individual purchase print voucher uses different template (has National logo placeholder, registration link)
- Should match online payment voucher template
- Also affects voucher registration print
- **Status:** TODO - Standardize PDF template

### 16. Individual Purchase Report - Button Styling
- Actions column buttons not styled correctly (text wrapping)
- **Location:** `/app/reports/individual-purchase`
- **Status:** TODO - Fix button CSS

### 17. Missing Email Templates Page
- **Location:** `/app/admin/email-templates`
- **Expected:** CRUD for email templates
- **Status:** TODO - Check if page exists or needs creation

---

## Priority 5: Minor Issues

### 18. Missing Icons
- `/icon-192.png` 404 error in manifest
- **Status:** TODO - Add PWA icons

---

## Summary by Role

### Counter Agent Issues:
- ✅ View vouchers by passport (removed)
- ⚠️ Email voucher - no prompt
- ⚠️ Print voucher - wrong template

### IT Support Issues:
- ⚠️ All Passports → blank page
- ⚠️ Scan Exit Pass → wrong redirect
- ⚠️ Voucher Scanner → wrong redirect
- ⚠️ Passport reports - no data
- ⚠️ Individual purchase report - button styling
- ⚠️ Corporate vouchers report - print not working, status wrong
- ⚠️ Quotations report - permission error
- ⚠️ Cash reconciliation → blank page
- ⚠️ Ticket creation failing

### Finance Manager Issues:
- ⚠️ Send quotation email - not working
- ⚠️ Download quotation - not working
- ⚠️ View Invoice - not working
- ⚠️ Register passport link - not working
- ⚠️ Passport reports - no data

### Flex Admin Issues:
- ⚠️ Deactivate user - error
- ⚠️ Change user role - doesn't work
- ⚠️ Corporate batch history - no data
- ⚠️ Settings update - permission error
- ⚠️ Email templates - missing

### Public Issues:
- ⚠️ Print voucher - wrong template

---

## Next Steps

1. Fix critical database/permission errors
2. Fix navigation and routing issues
3. Standardize PDF templates
4. Fix email functionality
5. Fix report data queries
6. Polish UI issues
