# PostgreSQL Migration Plan - Complete Guide

**Migration Date:** November 23, 2025
**Status:** 🟡 IN PROGRESS
**Progress:** 15% Complete

---

## 🎯 Migration Overview

Migrating GreenPay React application from Supabase to self-hosted PostgreSQL with custom Node.js API backend.

**Server:** 72.61.208.79 (Hostinger VPS with CloudPanel)
**Database:** PostgreSQL `greenpay_db`
**API:** Node.js/Express on port 3001
**Frontend:** React + Vite

---

## ✅ Completed (Phase 1 - 15%)

### 1. Database Setup ✅
- [x] PostgreSQL installed and configured
- [x] Database created: `greenpay_db`
- [x] User created: `greenpay_user`
- [x] Schema imported (41 tables)
- [x] Default data inserted (roles, payment modes)
- [x] Permissions configured

### 2. Backend API ✅
- [x] Node.js/Express backend created
- [x] JWT authentication implemented
- [x] Basic CRUD endpoints for:
  - Auth (login, register, logout, me)
  - Users
  - Passports
  - Vouchers
  - Invoices
  - Quotations
  - Tickets
- [x] PM2 process manager configured
- [x] Nginx reverse proxy configured
- [x] SSL/HTTPS enabled

### 3. React Frontend (Partial) ✅
- [x] API client created (`src/lib/api/client.js`)
- [x] AuthContext migrated to use API
- [x] Supabase compatibility shim created
- [x] Login/logout working
- [x] Role mapping fixed (Admin → Flex_Admin)
- [x] Navigation menu displaying correctly

---

## 🔄 In Progress (Phase 2 - Current)

### Priority 1: Critical Pages

#### Dashboard (src/pages/Dashboard.jsx)
**Status:** ⚠️ Not Loading Data
**What Needs Migration:**
```javascript
// OLD (Supabase)
const { data } = await supabase
  .from('passports')
  .select('count');

// NEW (API)
const data = await api.passports.getAll({ limit: 10 });
```

**Required API Endpoints:**
- [ ] `GET /api/dashboard/stats` - Overall statistics
- [ ] `GET /api/dashboard/recent-activity` - Recent transactions
- [ ] `GET /api/dashboard/revenue` - Revenue data

**Files to Update:**
- `src/pages/Dashboard.jsx`

---

#### Users Management (src/pages/Users.jsx)
**Status:** ⚠️ Uses Supabase
**What Needs Migration:**
- User listing with pagination
- User creation
- User updates
- User deletion
- Role management

**API Endpoints (Already Exist):**
- [x] `GET /api/users` - List users
- [x] `GET /api/users/:id` - Get user
- [x] `PUT /api/users/:id` - Update user
- [x] `DELETE /api/users/:id` - Delete user
- [x] `GET /api/users/roles/all` - Get roles

**Files to Update:**
- `src/pages/Users.jsx`
- `src/lib/usersService.js` (convert to API)

---

#### Passports (src/pages/Passports.jsx)
**Status:** ⚠️ Uses Supabase
**What Needs Migration:**
- Passport listing
- Search/filter
- Create passport
- Edit passport
- Delete passport

**API Endpoints (Already Exist):**
- [x] `GET /api/passports` - List passports
- [x] `GET /api/passports/:id` - Get passport
- [x] `POST /api/passports` - Create passport
- [x] `PUT /api/passports/:id` - Update passport
- [x] `DELETE /api/passports/:id` - Delete passport

**Files to Update:**
- `src/pages/Passports.jsx`
- `src/pages/EditPassport.jsx`
- `src/pages/IndividualPurchase.jsx`
- `src/lib/passportsService.js` (convert to API)

---

### Priority 2: Financial Operations

#### Purchases (src/pages/Purchases.jsx)
**Status:** ⚠️ Uses Supabase
**What Needs Migration:**
- Payment processing
- Voucher generation
- Transaction recording

**Required API Endpoints:**
- [ ] `POST /api/purchases` - Create purchase
- [ ] `GET /api/purchases` - List purchases
- [ ] `GET /api/purchases/:id` - Get purchase details

**Files to Update:**
- `src/pages/Purchases.jsx`

---

#### Quotations (src/pages/Quotations.jsx)
**Status:** ⚠️ Uses Supabase
**What Needs Migration:**
- Quotation creation
- Quotation listing
- Quotation approval workflow

**API Endpoints (Already Exist):**
- [x] `GET /api/quotations` - List quotations
- [x] `GET /api/quotations/:id` - Get quotation
- [x] `POST /api/quotations` - Create quotation

**Files to Update:**
- `src/pages/Quotations.jsx`
- `src/pages/CreateQuotation.jsx`
- `src/lib/quotationsService.js` (convert to API)

---

### Priority 3: Bulk Operations

#### Bulk Upload (src/pages/BulkPassportUpload.jsx)
**Status:** ⚠️ Uses Supabase
**What Needs Migration:**
- CSV file upload
- Batch processing
- Validation
- Error handling

**Required API Endpoints:**
- [ ] `POST /api/passports/bulk` - Bulk upload
- [ ] `GET /api/bulk-uploads` - Upload history
- [ ] `GET /api/bulk-uploads/:id` - Upload details

**Files to Update:**
- `src/pages/BulkPassportUpload.jsx`
- `src/lib/bulkUploadService.js` (convert to API)

---

### Priority 4: Reporting

#### All Report Pages (src/pages/reports/*.jsx)
**Status:** ⚠️ All Use Supabase
**What Needs Migration:**
- Passport reports
- Individual purchase reports
- Corporate voucher reports
- Revenue reports
- Bulk upload reports
- Quotation reports

**Required API Endpoints:**
- [ ] `GET /api/reports/passports` - Passport statistics
- [ ] `GET /api/reports/purchases` - Purchase data
- [ ] `GET /api/reports/revenue` - Revenue analysis
- [ ] `GET /api/reports/bulk-uploads` - Upload statistics

**Files to Update:**
- `src/pages/reports/PassportReports.jsx`
- `src/pages/reports/IndividualPurchaseReports.jsx`
- `src/pages/reports/CorporateVoucherReports.jsx`
- `src/pages/reports/RevenueGeneratedReports.jsx`
- `src/pages/reports/BulkPassportUploadReports.jsx`
- `src/pages/reports/QuotationsReports.jsx`
- `src/lib/reportsService.js` (convert to API)

---

### Priority 5: Admin & Settings

#### Admin Pages
**Status:** ⚠️ Use Supabase
**What Needs Migration:**
- Settings management
- Payment modes
- Email templates
- SMS settings
- Login history

**Required API Endpoints:**
- [ ] `GET /api/admin/settings` - Get settings
- [ ] `PUT /api/admin/settings` - Update settings
- [ ] `GET /api/admin/payment-modes` - List payment modes
- [ ] `POST /api/admin/payment-modes` - Create payment mode
- [ ] `GET /api/admin/email-templates` - List templates
- [ ] `POST /api/admin/email-templates` - Create template

**Files to Update:**
- `src/pages/admin/Settings.jsx`
- `src/pages/admin/PaymentModes.jsx`
- `src/pages/admin/EmailTemplates.jsx`
- `src/pages/admin/SMSSettings.jsx`
- `src/pages/admin/LoginHistory.jsx`

---

## 📋 Complete File Inventory

### Files Still Using Supabase (Need Migration):

```bash
Core Pages (High Priority):
✅ src/contexts/AuthContext.jsx - MIGRATED
⚠️ src/pages/Dashboard.jsx
⚠️ src/pages/Passports.jsx
⚠️ src/pages/Users.jsx
⚠️ src/pages/Tickets.jsx
⚠️ src/pages/Quotations.jsx
⚠️ src/pages/Purchases.jsx

Purchase Flows:
⚠️ src/pages/IndividualPurchase.jsx
⚠️ src/pages/BulkPassportUpload.jsx
⚠️ src/pages/CorporateExitPass.jsx
⚠️ src/pages/CorporateBatchHistory.jsx

User Management:
⚠️ src/pages/ProfileSettings.jsx
⚠️ src/pages/ResetPassword.jsx
⚠️ src/pages/PublicRegistration.jsx

Validation:
⚠️ src/pages/ScanAndValidate.jsx

Admin Pages:
⚠️ src/pages/admin/Settings.jsx
⚠️ src/pages/admin/SMSSettings.jsx
⚠️ src/pages/admin/LoginHistory.jsx
⚠️ src/pages/admin/PaymentModes.jsx
⚠️ src/pages/admin/EmailTemplates.jsx

Reports (All):
⚠️ src/pages/reports/PassportReports.jsx
⚠️ src/pages/reports/IndividualPurchaseReports.jsx
⚠️ src/pages/reports/CorporateVoucherReports.jsx
⚠️ src/pages/reports/RevenueGeneratedReports.jsx
⚠️ src/pages/reports/BulkPassportUploadReports.jsx
⚠️ src/pages/reports/QuotationsReports.jsx

Service Files:
⚠️ src/lib/passportsService.js
⚠️ src/lib/individualPurchasesService.js
⚠️ src/lib/corporateVouchersService.js
⚠️ src/lib/quotationsService.js
⚠️ src/lib/usersService.js
⚠️ src/lib/bulkUploadsService.js
⚠️ src/lib/reportsService.js
⚠️ src/lib/paymentModesStorage.js
⚠️ src/lib/ticketStorage.js

Components:
⚠️ src/components/AdminPasswordResetModal.jsx
⚠️ src/components/PasswordChangeModal.jsx
```

**Total Files:** ~35 files need migration
**Completed:** ~3 files (AuthContext, API client, compatibility shim)
**Remaining:** ~32 files

---

## 🛠️ Migration Strategy

### Step-by-Step Approach:

#### Phase 2A: Core Data Loading (Week 1)
1. **Dashboard** - Get basic stats displaying
2. **Passports List** - Core passport management
3. **Users List** - User administration

#### Phase 2B: Financial Operations (Week 2)
4. **Purchases** - Payment processing
5. **Quotations** - Quote management
6. **Tickets** - Support system

#### Phase 2C: Bulk & Advanced (Week 3)
7. **Bulk Upload** - CSV processing
8. **Corporate Features** - Batch operations
9. **Scan & Validate** - QR code scanning

#### Phase 2D: Reports & Settings (Week 4)
10. **All Report Pages** - Data analytics
11. **Admin Settings** - Configuration
12. **User Profile** - Self-service

---

## 🔧 Migration Pattern

### Standard Migration Steps:

#### 1. Identify Supabase Calls:
```bash
grep -n "supabase\." src/pages/YourPage.jsx
```

#### 2. Map to API Endpoints:
```javascript
// OLD
const { data } = await supabase
  .from('passports')
  .select('*')
  .eq('id', id);

// NEW
const data = await api.passports.getById(id);
```

#### 3. Update Error Handling:
```javascript
// OLD
if (error) {
  console.error(error);
}

// NEW
try {
  const data = await api.passports.getById(id);
} catch (error) {
  console.error('API Error:', error.message);
}
```

#### 4. Update Data Structure:
Backend might return slightly different field names - map as needed

#### 5. Test Thoroughly:
- CRUD operations
- Pagination
- Search/filter
- Error cases

---

## 📊 Progress Tracking

### Completion Status:

| Phase | Component | Status | Priority |
|-------|-----------|--------|----------|
| 1 | Database Setup | ✅ Complete | Critical |
| 1 | Backend API | ✅ Complete | Critical |
| 1 | Auth System | ✅ Complete | Critical |
| 1 | Navigation Fix | ✅ Complete | Critical |
| 2A | Dashboard | ⚠️ Pending | High |
| 2A | Passports | ⚠️ Pending | High |
| 2A | Users | ⚠️ Pending | High |
| 2B | Purchases | ⚠️ Pending | High |
| 2B | Quotations | ⚠️ Pending | Medium |
| 2B | Tickets | ⚠️ Pending | Medium |
| 2C | Bulk Upload | ⚠️ Pending | Medium |
| 2C | Corporate | ⚠️ Pending | Low |
| 2C | Scan/Validate | ⚠️ Pending | Low |
| 2D | Reports | ⚠️ Pending | Low |
| 2D | Admin Settings | ⚠️ Pending | Low |

**Overall Progress:** 15% (4/27 major components)

---

## 🧪 Testing Checklist

### After Each Migration:

- [ ] Login still works
- [ ] Navigation displays correctly
- [ ] Page loads without errors
- [ ] Data displays correctly
- [ ] Create operation works
- [ ] Update operation works
- [ ] Delete operation works
- [ ] Search/filter works
- [ ] Pagination works
- [ ] Error handling works
- [ ] No console errors
- [ ] No Supabase calls remaining

---

## 🚀 Next Immediate Steps

### Priority Tasks (This Session):

1. **Dashboard Migration** ⭐
   - Create dashboard stats endpoint
   - Update Dashboard.jsx to use API
   - Test data loading

2. **Passports List Migration** ⭐
   - Update Passports.jsx to use existing API
   - Test CRUD operations
   - Verify pagination

3. **Users Management Migration** ⭐
   - Update Users.jsx to use existing API
   - Test user creation/updates
   - Verify role assignment

### Commands to Run:

```bash
# Start local dev server
cd /Users/nikolay/github/greenpay
npm run dev

# Check for Supabase usage
grep -r "supabase\." src/pages/ | wc -l

# Test backend API
curl https://greenpay.eywademo.cloud/api/health
```

---

## 📝 Notes & Considerations

### Important Reminders:

1. **Always Test Locally First** - Don't push broken code
2. **One Component at a Time** - Easier to debug
3. **Keep Backups** - Original files in .backup
4. **Check Error Handling** - API errors differ from Supabase
5. **Update Field Names** - Backend might use different naming
6. **Test All User Roles** - Ensure permissions work

### Known Issues to Watch:

- Date formatting differences
- Enum type handling
- Null vs undefined
- Array vs object responses
- Pagination format

---

## 🎯 Success Criteria

Migration is complete when:

- [ ] All pages load without Supabase errors
- [ ] All CRUD operations work via API
- [ ] All reports generate correctly
- [ ] All user roles work properly
- [ ] No `supabase.` calls in production code
- [ ] All tests pass
- [ ] Performance is acceptable
- [ ] Error handling is robust

---

**Last Updated:** November 23, 2025
**Next Review:** After Phase 2A completion
**Estimated Completion:** 4 weeks

---
