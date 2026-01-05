# Production Testing - Issues Summary & Action Plan

**Date:** 2025-12-18
**Environment:** https://greenpay.eywademo.cloud
**Testing Scope:** All user roles (Agent, IT Support, Finance Manager, Flex Admin, Public)

---

## 🚨 CRITICAL ISSUES (Must Fix First)

### 1. Database Schema - Missing Column `card_last_four`
**Severity:** CRITICAL
**Impact:** Breaks "View Vouchers" functionality for all users
**Error:** `column "card_last_four" does not exist`
**Location:** `/backend/routes/vouchers.js:1160`
**Affected:** All roles trying to view vouchers by passport

**Root Cause:**
- Backend query expects `card_last_four` column in individual_purchases table
- Column doesn't exist in production database schema

**Fix:**
```sql
-- Add missing column to individual_purchases table
ALTER TABLE individual_purchases
ADD COLUMN IF NOT EXISTS card_last_four VARCHAR(4);
```

**Files to Update:**
- Database migration SQL
- Verify backend query in `backend/routes/vouchers.js:1160`

---

### 2. Database Permissions - Settings Table Owner
**Severity:** CRITICAL
**Impact:** Flex Admin cannot update system settings
**Error:** `must be owner of table settings`
**Location:** `/app/admin/settings`
**Affected:** Flex Admin role

**Root Cause:**
- Database user lacks ownership/permissions on settings table
- RLS policies may be too restrictive

**Fix:**
```sql
-- Grant proper permissions to app user
GRANT ALL ON TABLE settings TO your_app_db_user;
ALTER TABLE settings OWNER TO your_app_db_user;

-- Or fix RLS policy to allow Flex_Admin role
CREATE POLICY flex_admin_settings ON settings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'Flex_Admin'
  ));
```

**Files to Check:**
- `backend/routes/settings.js`
- Database RLS policies

---

## 🔴 HIGH PRIORITY ISSUES

### AGENT ROLE

#### 3. Email Voucher - No Email Input Prompt
**Severity:** HIGH
**Impact:** Agents cannot email vouchers to customers
**Location:** `/app/passports/create` (Individual Purchase - Step 3)
**Current Behavior:** "Email Voucher" button exists but no way to enter/change email

**Fix:**
- Add email input field in Step 1 (Passport Details) ✅ **ALREADY FIXED IN PREVIOUS SESSION**
- Verify email handler validates email exists before sending
- Add ability to edit email in Step 3 before sending

**Files:**
- `src/pages/IndividualPurchase.jsx` (verify email field at line 537-551)
- Implement actual email sending service

---

#### 4. Print Voucher - Wrong Template
**Severity:** HIGH
**Impact:** Printed vouchers show wrong template with registration link
**Location:** `/app/passports/create` (Individual Purchase - Step 3)
**Current Behavior:**
- Shows "National logo placeholder"
- Shows "Scan to Register" link even though passport already registered
- Different from online payment voucher template

**Expected:** Match template from `voucher-92WMHJ05.pdf`:
- Two logos (green circular + PNG coat of arms)
- GREEN CARD title
- Coupon number + barcode
- **Passport number displayed**
- **NO registration link**
- **NO placeholder logos**

**Fix:**
- Update `src/components/VoucherPrint.jsx`
- Accept `showRegistrationLink` prop
- Conditionally hide registration section when passport registered
- Add passport number display
- Remove placeholder logo

**Files:**
- `src/components/VoucherPrint.jsx`

---

### IT SUPPORT ROLE

#### 5. Broken Navigation Routes
**Severity:** HIGH
**Impact:** IT Support cannot access assigned features

**Issues:**
| Menu Item | Current URL | Expected URL | Status |
|-----------|-------------|--------------|--------|
| All Passports | `/app` (blank) | `/app/passports` | ❌ Broken |
| Scan Exit Pass | `/app/dashboard` | `/app/scan` | ❌ Wrong |
| Voucher Scanner | `/app/scanner-test` | `/app/scanner-test` | ✅ Correct |
| Cash Reconciliation | `/app` (blank) | `/app/cash-reconciliation` | ❌ Broken |

**Fix:**
- Check `src/components/MainLayout.jsx` navigation links for IT_Support role
- Verify route definitions in `src/App.jsx`
- Update navigation menu items for IT_Support

**Files:**
- `src/components/MainLayout.jsx`
- `src/App.jsx`

---

#### 6. Quotations Report - Permission Denied
**Severity:** HIGH
**Impact:** IT Support cannot access quotations report
**Error:** `403 Insufficient permissions`
**Location:** `/app/reports/quotations`

**Fix:**
- Update backend API permissions for `/api/quotations` endpoint
- Allow IT_Support role to read (view-only) quotations
- Update RLS policy or route middleware

**Files:**
- `backend/routes/quotations.js`
- Database RLS policy for quotations table

---

#### 7. Reports Not Showing Actual Data
**Severity:** HIGH
**Impact:** Reports are useless for IT Support
**Location:**
- `/app/reports/passports` - Not showing actual data
- `/app/reports/individual-purchase` - Button styling broken

**Fix:**
- Verify database queries in `src/lib/reportsService.js`
- Check RLS policies allow IT_Support to read data
- Fix button styling (text should be one line)

**Files:**
- `src/lib/reportsService.js`
- `src/pages/reports/*`

---

#### 8. Corporate Vouchers Report Issues
**Severity:** MEDIUM
**Location:** `/app/reports/corporate-vouchers`

**Issues:**
- Print feature not working
- Status shows "Active" but should show "Pending" when no passport associated

**Fix:**
- Implement print functionality
- Fix status logic to check if passport is registered:
  - `Pending` = no passport_number
  - `Active` = has passport_number, valid
  - `Used` = has been validated
  - `Expired` = past expiry date

**Files:**
- `src/pages/reports/CorporateVouchersReport.jsx`

---

#### 9. Tickets Creation Failing
**Severity:** MEDIUM
**Impact:** IT Support cannot create support tickets
**Error:** `Validation failed: Title is required, Invalid category`
**Location:** `/app/tickets`

**Fix:**
- Check form validation in `src/pages/Tickets.jsx`
- Ensure title and category fields are properly bound
- Verify backend validation in `backend/routes/tickets.js`

**Files:**
- `src/pages/Tickets.jsx`
- `backend/routes/tickets.js`

---

### FINANCE MANAGER ROLE

#### 10. Send Quotation by Email - Not Working
**Severity:** HIGH
**Impact:** Cannot email quotations to customers
**Location:** Quotations page
**Current Behavior:** Shows "success" message but no email received

**Issues:**
- No ability to change/confirm email before sending
- Email service not configured or failing silently

**Fix:**
- Add email confirmation dialog before sending
- Implement actual email service integration
- Add error handling with meaningful feedback
- Log email attempts for debugging

**Files:**
- `src/pages/Quotations.jsx`
- `backend/services/emailService.js` (create if missing)

---

#### 11. Download Quotation - Not Working
**Severity:** HIGH
**Impact:** Cannot provide quotations to customers
**Location:** Quotations page

**Fix:**
- Implement PDF generation for quotations
- Use similar template as invoices
- Add download functionality

**Files:**
- `src/pages/Quotations.jsx`
- Create quotation PDF template component

---

#### 12. View Invoice - Not Working
**Severity:** HIGH
**Impact:** Cannot view generated invoices
**Location:** `/app/invoices`

**Fix:**
- Check invoice view/dialog component
- Verify invoice data loading
- Debug console errors

**Files:**
- `src/pages/Invoices.jsx`

---

#### 13. Register Passport Link - 404 Invalid Voucher
**Severity:** MEDIUM
**Impact:** Corporate voucher holders cannot register passports
**Error:** "Invalid voucher code"
**Location:** `https://greenpay.eywademo.cloud/register/1XNDLVY9`

**Issues:**
- Wrong URL format (should be `/voucher-registration`)
- Voucher validation failing

**Fix:**
- Correct registration URL in corporate voucher emails/PDFs
- Should be: `https://greenpay.eywademo.cloud/voucher-registration?code=1XNDLVY9`
- Verify voucher code validation logic

**Files:**
- Corporate voucher email templates
- `backend/routes/vouchers.js` (validation endpoint)

---

### FLEX ADMIN ROLE

#### 14. Deactivate User - Error
**Severity:** HIGH
**Impact:** Cannot manage user accounts
**Error:** `No fields to update`
**Location:** `/app/users`

**Fix:**
- Check `src/lib/usersService.js` update function
- Ensure `is_active` or `status` field is being sent
- Verify backend expects correct field names

**Files:**
- `src/lib/usersService.js`
- `backend/routes/users.js`

---

#### 15. Change User Role - Not Working
**Severity:** HIGH
**Impact:** Cannot update user permissions
**Location:** `/app/users`
**Current Behavior:** Shows success but role doesn't change

**Fix:**
- Check if role field is being sent in update request
- Verify backend updates role in database
- Check if frontend refetches user data after update

**Files:**
- `src/pages/Users.jsx`
- `src/lib/usersService.js`
- `backend/routes/users.js`

---

#### 16. Corporate Batch History - Incorrect Data
**Severity:** MEDIUM
**Impact:** Cannot track corporate voucher batches
**Location:** `/app/payments/corporate-batch-history`

**Fix:**
- Verify database query in backend
- Check data transformation/mapping
- Ensure correct joins for batch data

**Files:**
- `backend/routes/corporate-vouchers.js`
- `src/pages/CorporateBatchHistory.jsx`

---

#### 17. Email Templates Page - Missing
**Severity:** MEDIUM
**Impact:** Cannot customize email templates
**Location:** `/app/admin/email-templates`

**Fix:**
- Check if route exists in `src/App.jsx`
- Verify component file exists
- If missing, create email templates management page

**Files:**
- `src/App.jsx`
- `src/pages/admin/EmailTemplates.jsx` (may need to create)

---

## 🟡 MEDIUM PRIORITY ISSUES

### PUBLIC ROLE

#### 18. Voucher Registration - Template Inconsistency
**Severity:** MEDIUM
**Impact:** Print voucher shows different template
**Location:** `/voucher-registration`

**Current Behavior:**
- Print voucher: Wrong template (different from Email/Download)
- Email voucher: Correct template
- Download voucher: Correct template

**Fix:**
- Ensure all three actions (Print, Email, Download) use same template
- Should match `voucher-92WMHJ05.pdf` format

**Files:**
- `src/pages/PublicVoucherPurchase.jsx` (or similar)
- Voucher print component

---

## 🔵 LOW PRIORITY ISSUES

#### 19. Service Worker & Icon Warnings
**Severity:** LOW
**Impact:** Console warnings, no functional impact
**Error:** `icon-192.png 404 Not Found`

**Fix:**
- Add missing PWA icons to public folder
- Or remove manifest.json if PWA not needed

**Files:**
- `public/icon-192.png`
- `public/icon-512.png`
- `public/manifest.json`

---

## 📋 ACTION PLAN

### Phase 1: Critical Database Fixes (Day 1)
1. ✅ Add `card_last_four` column to individual_purchases table
2. ✅ Fix settings table permissions for Flex_Admin
3. ✅ Test voucher viewing functionality
4. ✅ Test settings save functionality

### Phase 2: High Priority Fixes (Days 2-3)
1. Fix Agent voucher template (remove registration link, add passport number)
2. Implement email voucher functionality with email input
3. Fix IT Support navigation routes
4. Fix quotations report permissions
5. Fix user deactivate/role change functionality
6. Fix quotation email and download features

### Phase 3: Medium Priority Fixes (Days 4-5)
1. Fix corporate vouchers report (print, status logic)
2. Fix invoice viewing
3. Fix passport registration link URL
4. Fix reports data loading
5. Fix tickets creation validation
6. Fix corporate batch history data
7. Create email templates management page

### Phase 4: Polish & Testing (Day 6)
1. Fix button styling issues
2. Fix voucher template consistency (public registration)
3. Add missing PWA icons
4. Comprehensive regression testing
5. User acceptance testing

---

## 🔧 RECOMMENDED APPROACH

### Secure & Reliable Fix Strategy:

1. **Create Feature Branch**
   ```bash
   git checkout -b fix/production-issues-2025-12-18
   ```

2. **Database Migrations First**
   - Create migration SQL file with all schema changes
   - Test in development environment
   - Apply to production with backup

3. **Backend Fixes**
   - Fix permissions and validation
   - Add error handling
   - Log all critical operations

4. **Frontend Fixes**
   - Fix routing and navigation
   - Fix templates and UI
   - Improve error messages

5. **Testing Protocol**
   - Test each fix in isolation
   - Regression test related features
   - User acceptance test by role

6. **Deployment**
   - Deploy backend first (DB + API)
   - Deploy frontend second
   - Monitor logs for errors
   - Have rollback plan ready

---

## 📝 FILES TO MODIFY

### Database
- `database/migrations/add_card_last_four_column.sql` (create)
- `database/migrations/fix_settings_permissions.sql` (create)

### Backend
- `backend/routes/vouchers.js` (card_last_four query)
- `backend/routes/settings.js` (permissions)
- `backend/routes/quotations.js` (IT Support permissions)
- `backend/routes/users.js` (deactivate, role change)
- `backend/routes/tickets.js` (validation)
- `backend/services/emailService.js` (implement)

### Frontend
- `src/components/MainLayout.jsx` (IT Support navigation)
- `src/components/VoucherPrint.jsx` (template fixes)
- `src/pages/IndividualPurchase.jsx` (email functionality)
- `src/pages/Users.jsx` (user management)
- `src/pages/Quotations.jsx` (email, download)
- `src/pages/Invoices.jsx` (view invoice)
- `src/pages/Tickets.jsx` (validation)
- `src/pages/reports/*` (data loading, styling)
- `src/lib/usersService.js` (update logic)
- `src/lib/reportsService.js` (data queries)

---

## ⚠️ RISKS & MITIGATION

| Risk | Mitigation |
|------|------------|
| Database migration breaks existing data | Backup before migration, use IF NOT EXISTS |
| Permission changes affect other roles | Test all roles after changes |
| Template changes break existing vouchers | Keep both templates, use flag to switch |
| Email service not configured | Add configuration check, fail gracefully |
| Routing changes break bookmarks | Keep old routes as redirects |

---

## ✅ SUCCESS CRITERIA

- [ ] All critical errors resolved (500 errors, database issues)
- [ ] All user roles can access their designated features
- [ ] Email functionality works end-to-end
- [ ] Voucher templates are consistent across all flows
- [ ] Reports show actual data for all roles
- [ ] User management works (activate/deactivate/role change)
- [ ] No console errors on any page
- [ ] All features tested by actual users (UAT)

---

**Next Steps:**
1. Review and prioritize this action plan
2. Start with Phase 1 (critical database fixes)
3. Create database migration scripts
4. Deploy and test incrementally
5. Document each fix for future reference
