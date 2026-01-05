# Database Schema Audit Report - UPDATED

**Date:** 2025-12-19 (Updated after full schema review)
**Severity:** CRITICAL
**Status:** Dual schema architecture discovered

---

## 🚨 CRITICAL FINDING - REVISED

The production database has **TWO COMPLETE SCHEMAS COEXISTING**:

1. **Legacy Schema** (Capitalized table names, CamelCase columns) - OLD SYSTEM
2. **Modern Schema** (lowercase table names, snake_case columns) - CURRENT SYSTEM

### Tables with DUAL Existence:

| Legacy Table (Capitalized) | Modern Table (lowercase) | Which Has Data? |
|---------------------------|-------------------------|----------------|
| `"Passport"` | `passports` | **NEED TO CHECK** |
| `"User"` | `profiles` | **User has data, profiles linked to Supabase** |
| `"Invoice"` | `invoices` | **BOTH might have data** |
| `"Quotation"` | `quotations` | **BOTH might have data** |

### Tables That Only Exist in ONE Schema:

**Only in Modern (lowercase):**
- `individual_purchases` ✅ (backend uses this correctly)
- `corporate_vouchers` ✅ (backend uses this correctly)
- `customers` ✅ **EXISTS** (contrary to initial audit)
- `purchase_sessions` ✅ **EXISTS** (contrary to initial audit)
- `invoice_payments` ✅ (for partial payments)

**Only in Legacy (Capitalized):**
- `"Role"` (modern uses `role` TEXT field in profiles)
- `"VoucherBatch"` (legacy voucher batching)
- `"Ticket"` vs lowercase `tickets` (BOTH exist!)

---

## ROOT CAUSE - REVISED UNDERSTANDING

The system went through a **MIGRATION** from legacy to modern schema, but:
1. Legacy tables were NOT dropped (kept for data preservation)
2. Backend code was partially updated (some routes use modern, some use legacy)
3. **The issue is NOT missing tables** - it's **which table has the actual data**

---

## ACTUAL PROBLEMS DISCOVERED

### Problem 1: "View Vouchers by Passport" Error Chain

**Error Sequence:**
1. ❌ `card_last_four` didn't exist in `individual_purchases`
   - **FIXED**: Added column manually
2. ❌ `issued_date` didn't exist in `individual_purchases`
   - **FIXED**: Changed to `created_at`
3. ❌ `nationality` doesn't exist in `individual_purchases`
   - **FIXED**: Used `NULL as nationality`
4. ❌ `payment_method` doesn't exist in `corporate_vouchers`
   - **FIXED**: Used `NULL as payment_method`

**Status:** User abandoned feature - alternative method exists

### Problem 2: Backend Routes Query Wrong Table

**Scenario:** Backend queries `passports` (lowercase) but data might be in `"Passport"` (capitalized), or vice versa.

**Critical Questions to Answer:**
1. Which table has the actual passport data - `"Passport"` or `passports`?
2. Which table has the actual user data - `"User"` or `profiles`?
3. Which invoice table is actively used - `"Invoice"` or `invoices`?

---

## TABLES ANALYSIS - WHAT EXISTS IN PRODUCTION

### ✅ Tables That EXIST (Modern Schema):

| Table Name | Columns Present | Backend Compatible? |
|-----------|----------------|-------------------|
| `individual_purchases` | id, customer_name, customer_email, customer_phone, voucher_code, amount, payment_method, card_last_four, created_at, passport_number, etc. | ✅ YES |
| `corporate_vouchers` | id, batch_id, voucher_code, company_name, employee_name, amount, status, issued_date, passport_number, registered_at, etc. | ⚠️ Missing: payment_method |
| `invoices` | id, invoice_number, customer_name, customer_email, total_amount, gst_amount, status, quotation_id, items (jsonb), vouchers_generated, etc. | ✅ **EXISTS!** |
| `customers` | id, name, company_name, email, phone, address_line1, tin, is_gst_registered, status, etc. | ✅ **EXISTS!** |
| `purchase_sessions` | id, customer_email, quantity, amount, payment_status, passport_data (jsonb), expires_at, etc. | ✅ **EXISTS!** |
| `passports` | id, passport_number, full_name, nationality, date_of_birth, created_by, etc. | ✅ YES |
| `profiles` | id, user_id, first_name, last_name, phone, company_name, etc. | ✅ YES |
| `quotations` | id, quotation_number, customer_name, gst_amount, number_of_vouchers, unit_price, etc. | ⚠️ Column names don't match backend expectations |
| `invoice_payments` | id, invoice_id, payment_date, amount, payment_method, reference_number, etc. | ✅ YES |

### ✅ Tables That EXIST (Legacy Schema):

| Table Name (Capitalized) | Still Used? | Backend Routes Using It |
|-------------------------|------------|----------------------|
| `"User"` | ✅ YES | backend/routes/users.js, backend/routes/quotations.js, backend/routes/passports.js |
| `"Passport"` | ❓ UNCLEAR | backend/routes/passports.js, backend/routes/individual-purchases.js |
| `"Role"` | ✅ YES | backend/routes/users.js |
| `"Invoice"` | ❓ UNCLEAR | May be legacy, modern uses `invoices` |
| `"Quotation"` | ❓ UNCLEAR | May be legacy, modern uses `quotations` |
| `"Ticket"` | ✅ YES | Backend ticket system |
| `"VoucherBatch"` | ✅ YES | Corporate voucher batching |

---

## CRITICAL COLUMN MISMATCHES IN MODERN TABLES

### 1. quotations Table

**Production Schema:**
```sql
id, quotation_number, customer_name, customer_email, customer_tin, customer_address,
number_of_vouchers, unit_price, line_total, discount_percentage, discount_amount,
subtotal, gst_rate, gst_amount, total_amount, status, valid_until, payment_terms,
converted_to_invoice, invoice_id, created_by, created_at, updated_at
```

**Backend Tries to INSERT (backend/routes/quotations.js:118-147):**
- ❌ `customer_name` ✅ EXISTS (correct!)
- ❌ `customer_email` ✅ EXISTS (correct!)
- ✅ `number_of_vouchers` EXISTS (correct!)
- ✅ `unit_price` EXISTS (correct!)
- ❌ Backend might use wrong column names for older code

**Status:** quotations table structure looks GOOD - need to verify backend queries

### 2. corporate_vouchers Table

**Missing Column:**
- `payment_method` - doesn't exist (corporate vouchers don't have payment method since they're issued from batches/invoices)

**Backend Fix:** Use `NULL as payment_method` in SELECT queries (already applied in vouchers.js)

---

## RECOMMENDED NEXT STEPS

### Phase 1: Data Location Discovery (URGENT)

Run these queries on production to determine where the actual data is:

```sql
-- Check which passport table has data
SELECT 'Legacy Passport' as table_name, COUNT(*) as row_count FROM "Passport"
UNION ALL
SELECT 'Modern passports' as table_name, COUNT(*) as row_count FROM passports;

-- Check which user table is primary
SELECT 'Legacy User' as table_name, COUNT(*) as row_count FROM "User"
UNION ALL
SELECT 'Modern profiles' as table_name, COUNT(*) as row_count FROM profiles;

-- Check which invoice table has data
SELECT 'Legacy Invoice' as table_name, COUNT(*) as row_count FROM "Invoice"
UNION ALL
SELECT 'Modern invoices' as table_name, COUNT(*) as row_count FROM invoices;

-- Check vouchers
SELECT COUNT(*) FROM individual_purchases;
SELECT COUNT(*) FROM corporate_vouchers;

-- Check quotations
SELECT 'Legacy Quotation' as table_name, COUNT(*) as row_count FROM "Quotation"
UNION ALL
SELECT 'Modern quotations' as table_name, COUNT(*) as row_count FROM quotations;
```

### Phase 2: Route-by-Route Analysis

For each backend route file, determine:
1. Which table does it query?
2. Where is the actual data?
3. Does it need to query the other table instead?

### Phase 3: Backend Route Updates (Based on Phase 1 Results)

**If legacy tables have the data:**
- Keep backend queries as-is (they're already querying legacy tables)
- Modern tables might be unused/empty

**If modern tables have the data:**
- Update backend routes to query modern tables instead of legacy
- Most queries already use modern tables correctly!

---

## FILES REQUIRING ATTENTION (Priority Order)

### 1. `backend/routes/passports.js` ⚠️ HIGH PRIORITY
**Issue:** Queries `"Passport"` (capitalized) - might need to query `passports` (lowercase) instead

**Lines to check:**
- Line 14-34: SELECT from `"Passport"` with JOIN to `"User"`
- Line 88-94: INSERT with `createdById` (should be `created_by`?)

**Action:** Determine if data is in `"Passport"` or `passports`, then update queries accordingly

### 2. `backend/routes/users.js` ⚠️ HIGH PRIORITY
**Issue:** Queries `"User"` + `"Role"` tables (legacy) - might need profiles table instead

**Lines to check:**
- Line 15-20: SELECT from `"User"` + `"Role"`
- Line 87-91: INSERT with `"roleId"`

**Action:** Check if using Supabase Auth (profiles) or legacy User table

### 3. `backend/routes/quotations.js` ⚠️ MEDIUM PRIORITY
**Issue:** JOIN to `"User"` table, might need profiles

**Lines to check:**
- Line 16-41: JOIN to `"User"` table
- Line 118-147: INSERT column names

**Action:** Verify quotations table column names match, update User reference

### 4. `backend/routes/invoices-gst.js` ⚠️ MEDIUM PRIORITY
**Issue:** Might query wrong invoice table

**Lines to check:**
- Line 184-220: Query invoices table (lowercase - CORRECT!)
- Line 505-551: INSERT into invoices

**Action:** Verify this uses `invoices` (lowercase) not `"Invoice"` - **LOOKS GOOD**

### 5. `backend/routes/vouchers.js` ✅ MOSTLY FIXED
**Status:** Already uses modern tables (`individual_purchases`, `corporate_vouchers`)
- Recent fixes applied for missing columns
- Uses NULL for columns that don't exist in corporate_vouchers

### 6. `backend/routes/individual-purchases.js` ⚠️ LOW PRIORITY
**Issue:** JOIN to `"Passport"` (capitalized) - line 23-29, 164-169

**Action:** Check if should join to `passports` (lowercase) instead

---

## CONCLUSION - REVISED

The database architecture is MORE COMPLEX than initially thought:

1. ✅ **Good news:** Most critical tables exist (invoices, customers, purchase_sessions)
2. ⚠️ **Challenge:** Data might be split between legacy and modern tables
3. 🎯 **Priority:** Run discovery queries to determine which table has the data
4. 📋 **Next:** Update backend routes to query the correct table based on where data lives

**The "view vouchers by passport" errors were a SYMPTOM of:**
- Missing columns in modern tables (card_last_four, etc.) - FIXED
- Backend querying columns that don't exist (nationality in individual_purchases) - FIXED with NULL
- Backend querying columns that don't exist in corporate vouchers (payment_method) - FIXED with NULL

**NOT a symptom of missing tables** - the tables exist!

---

**Status:** Ready for Phase 1 discovery queries
**Next Action:** Run row count queries to determine data location
**Expected Time:** 5-10 minutes for discovery, then targeted fixes

---

**Prepared by:** Comprehensive Database Schema Analysis
**Next Review:** After Phase 1 discovery queries
