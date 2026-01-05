# Production Database Analysis Results

**Date:** 2025-12-19
**Status:** ✅ COMPLETE - All discovery queries executed

---

## 🎯 CRITICAL FINDINGS

### **The Data Distribution is CLEAR:**

Production uses a **HYBRID APPROACH** - some data in legacy tables, some in modern:

| Data Type | Legacy Table | Row Count | Modern Table | Row Count | **WINNER** |
|-----------|-------------|-----------|--------------|-----------|------------|
| **Passports** | `"Passport"` | **153** (98 recent) | `passports` | 5 (5 recent) | **LEGACY** |
| **Users/Auth** | `"User"` | **6** (active) | `profiles` | 0 (empty) | **LEGACY** |
| **Roles** | `"Role"` | **8** | N/A | N/A | **LEGACY** |
| **Invoices** | `"Invoice"` | 0 (empty) | `invoices` | **46** (46 recent) | **MODERN** |
| **Quotations** | `"Quotation"` | 0 (empty) | `quotations` | **26** | **MODERN** |
| **Individual Purchases** | N/A | N/A | `individual_purchases` | **56** (all recent) | **MODERN** |
| **Corporate Vouchers** | N/A | N/A | `corporate_vouchers` | **342** (all recent) | **MODERN** |
| **Customers** | N/A | N/A | `customers` | **3** | **MODERN** |
| **Purchase Sessions** | N/A | N/A | `purchase_sessions` | **103** | **MODERN** |
| **Invoice Payments** | N/A | N/A | `invoice_payments` | **45** | **MODERN** |

---

## 📊 KEY INSIGHTS

### 1. **Passports: LEGACY is Primary** 🚨
- `"Passport"` (capitalized): **153 rows**, **98 created in last 7 days**
- `passports` (lowercase): **5 rows**, all recent (likely test data)
- **Columns in "Passport":** `"passportNo"`, `"givenName"`, `surname`, `"createdAt"`, `"createdById"`

**Action Required:** Backend routes querying `passports` (lowercase) will MISS most data!

### 2. **Users/Auth: LEGACY is Active** 🚨
- `"User"` table: **6 active users** (all system users)
- `profiles` table: **0 rows** (completely empty)
- Users table linked to `"Role"` table (8 roles defined)

**Active Users:**
- agent@greenpay.com (Counter_Agent)
- finance@greenpay.com (Finance_Manager)
- flexadmin@greenpay.com (Flex_Admin)
- support@greenpay.com (IT_Support)
- admin@greenpay.com (Flex_Admin)

**Action Required:** Authentication uses legacy `"User"` + `"Role"` tables, NOT Supabase profiles!

### 3. **Invoices/Quotations: MODERN is Active** ✅
- Modern `invoices`: **46 rows** (all from last 7 days)
- Modern `quotations`: **26 rows**
- Legacy tables are empty

**Action Required:** Backend routes ARE using modern tables correctly!

### 4. **Vouchers: MODERN Only** ✅
- `individual_purchases`: **56 rows** (all recent)
- `corporate_vouchers`: **342 rows** (all recent)
- No legacy equivalents

**Action Required:** Backend routes ARE using modern tables correctly!

---

## 📋 DETAILED TABLE ANALYSIS

### individual_purchases (32 columns) ✅
**Status:** Perfect structure, all columns present

**Key Columns:**
- ✅ `customer_name`, `customer_email`, `customer_phone`
- ✅ `voucher_code`, `passport_number`, `amount`
- ✅ `payment_method`, `card_last_four`
- ✅ `created_at`, `used_at` (NOT `purchased_at`, `redeemed_at`)
- ✅ All refund columns present
- ✅ `invoice_id`, `purchase_session_id`, `payment_gateway_ref`

**Recent Sample:**
```
ID: 143 | Code: T7VN1566 | Passport: 387110389 | Amount: 50 | Method: BANK TRANSFER
ID: 142 | Code: ZZLRHRMR | Passport: 387110389 | Amount: 50 | Method: CASH
```

### corporate_vouchers (18 columns) ⚠️
**Status:** Working, but missing `payment_method` column (as expected)

**Key Columns:**
- ✅ `voucher_code`, `company_name`, `employee_name`, `amount`
- ✅ `status`, `issued_date`, `redeemed_date`
- ✅ `passport_number`, `passport_id`, `registered_at`, `registered_by`
- ✅ `invoice_id`, `batch_id`, `is_green_pass`
- ❌ **NO** `payment_method` (corporate vouchers don't have payment - they're issued from batches/invoices)

**Recent Sample:**
```
All 342 vouchers have status: 'pending_passport'
Company: Test Company | Amount: 50.00 | No passport registered yet
```

### passports (modern - 11 columns) ⚠️
**Status:** EXISTS but has minimal data (5 rows vs 153 in legacy)

**Columns:**
- `passport_number`, `full_name`, `nationality`
- `date_of_birth`, `issue_date`, `expiry_date`
- `created_by`, `created_at`, `updated_at`

**Sample:**
```
387110389 | NIKOLOV NIKOLAY | Bulgaria
TEST987654 | TESTUSER NIKOLAY | Papua New Guinea
```

### "Passport" (legacy - columns unknown, needs inspection)
**Status:** PRIMARY passport table with 153 rows

**Recent Sample Shows:**
- `id`, `"passportNo"`, `"givenName"`, `surname`, `"createdAt"`
- Latest: P1765976543938 | Test User | created 2025-12-17

### invoices (modern - 29 columns) ✅
**Status:** Actively used, well-structured

**Key Columns:**
- `invoice_number`, `customer_name`, `customer_email`, `customer_phone`, `customer_address`, `customer_tin`
- `total_amount`, `subtotal`, `gst_rate`, `gst_amount`, `amount_paid`, `amount_due`
- `status`, `due_date`, `paid_date`, `invoice_date`
- `quotation_id`, `items` (JSONB), `vouchers_generated`, `voucher_batch_id`
- `payment_terms`, `notes`

**46 invoices, all recent** - GST invoicing is ACTIVE

### quotations (modern - 27 columns) ✅
**Status:** Actively used, well-structured

**Key Columns:**
- `quotation_number`, `customer_name`, `customer_email`, `customer_tin`, `customer_address`
- `number_of_vouchers`, `unit_price`, `line_total`
- `discount_percentage`, `discount_amount`
- `subtotal`, `gst_rate`, `gst_amount`, `total_amount`
- `status`, `valid_until`, `payment_terms`
- `converted_to_invoice`, `invoice_id`

**26 quotations** - Quotation system is ACTIVE

---

## 🚨 BACKEND ROUTES THAT NEED FIXES

### Priority 1: HIGH - Data Access Issues

#### 1. `backend/routes/passports.js` 🔴 CRITICAL
**Problem:** Queries `passports` (lowercase) but data is in `"Passport"` (capitalized)

**Lines affected:**
- Line 14-34: SELECT from `passports` → should be `"Passport"`
- Line 88-94: INSERT → likely going to `"Passport"` (check)

**Impact:** Passport CRUD operations may not see most data (153 rows invisible)

**Fix:** Change all `passports` references to `"Passport"` and adjust column names:
- `passport_number` → `"passportNo"`
- `full_name` → `"givenName" || ' ' || surname`
- `created_at` → `"createdAt"`
- `created_by` → `"createdById"`

#### 2. `backend/routes/users.js` 🔴 CRITICAL
**Problem:** Already correctly queries `"User"` + `"Role"` (legacy tables)

**Status:** ✅ **LIKELY WORKING** - uses correct legacy tables

**Verification needed:** Check if queries are using correct column names (`"roleId"`, `"isActive"`, etc.)

#### 3. `backend/routes/individual-purchases.js` ⚠️ MEDIUM
**Problem:** JOINs to `"Passport"` (capitalized) at lines 23-29, 164-169

**Status:** ⚠️ **PARTIALLY CORRECT** - should join to legacy `"Passport"` table
- JOINs are using correct table
- But may have column name mismatches

**Fix:** Ensure JOIN uses `"passportNo"` not `passport_number`

### Priority 2: MEDIUM - Already Using Correct Tables

#### 4. `backend/routes/vouchers.js` ✅ MOSTLY CORRECT
**Status:** Uses modern `individual_purchases` and `corporate_vouchers` tables

**Recent fixes applied:**
- ✅ Uses `created_at` instead of `issued_date`
- ✅ Uses `NULL as nationality` for individual_purchases
- ✅ Uses `NULL as payment_method` for corporate_vouchers

**Remaining issue:** May need to join to `"Passport"` (legacy) not `passports` (modern)

#### 5. `backend/routes/invoices-gst.js` ✅ CORRECT
**Status:** Uses modern `invoices` table (46 rows, actively used)

**Verification:** Queries use lowercase `invoices` with snake_case columns - CORRECT!

#### 6. `backend/routes/quotations.js` ⚠️ MEDIUM
**Problem:** JOINs to `"User"` table (legacy) - this is CORRECT!

**Status:** Likely correct, just verify column names match legacy schema

### Priority 3: LOW - Need Verification

#### 7. `backend/routes/public-purchases.js` ⚠️
**Status:** Uses modern tables (`individual_purchases`, `purchase_sessions`)
- `purchase_sessions`: 103 rows (active)
- Should be working correctly

---

## 🎯 ACTION PLAN

### Phase 1: Fix Passport Route (URGENT)
**File:** `backend/routes/passports.js`

**Changes needed:**
```javascript
// BEFORE (queries empty modern table):
SELECT * FROM passports WHERE passport_number = $1

// AFTER (queries legacy table with data):
SELECT * FROM "Passport" WHERE "passportNo" = $1
```

**Column mapping:**
- `passport_number` → `"passportNo"`
- `full_name` → `CONCAT("givenName", ' ', surname)` or separate fields
- `created_at` → `"createdAt"`
- `created_by` → `"createdById"`
- `nationality` → `nationality` (same)

### Phase 2: Verify Working Routes
**Files to check:**
- `backend/routes/users.js` - verify column names match `"User"` table
- `backend/routes/invoices-gst.js` - verify it uses modern `invoices` (should be OK)
- `backend/routes/quotations.js` - verify it uses modern `quotations` (should be OK)

### Phase 3: Fix JOINs
**Files with passport JOINs:**
- `backend/routes/individual-purchases.js` - JOIN to `"Passport"` (verify column names)
- `backend/routes/vouchers.js` - May need to update passport JOINs

---

## ✅ WHAT'S WORKING

### Modern Tables (Actively Used):
- ✅ `individual_purchases` - 56 rows, all recent
- ✅ `corporate_vouchers` - 342 rows, all recent
- ✅ `invoices` - 46 rows, all recent
- ✅ `quotations` - 26 rows
- ✅ `purchase_sessions` - 103 rows
- ✅ `customers` - 3 rows
- ✅ `invoice_payments` - 45 rows

### Legacy Tables (Actively Used):
- ✅ `"Passport"` - 153 rows, 98 recent (PRIMARY passport data)
- ✅ `"User"` - 6 active users (PRIMARY auth)
- ✅ `"Role"` - 8 roles defined

---

## 🔍 CONCLUSION

**The system uses a HYBRID architecture:**
1. **Authentication & Passports:** Legacy tables (`"User"`, `"Role"`, `"Passport"`)
2. **Business Operations:** Modern tables (`individual_purchases`, `corporate_vouchers`, `invoices`, `quotations`)

**Main issue:** `backend/routes/passports.js` queries the WRONG passport table (modern `passports` with 5 rows instead of legacy `"Passport"` with 153 rows)

**Impact:** Most passport data is invisible to the application!

**Priority Fix:** Update `passports.js` to query `"Passport"` table with correct column names.

---

**Analysis Complete:** 2025-12-19
**Next Step:** Fix passport route to use legacy table
**Expected Impact:** Major improvement in passport-related features
