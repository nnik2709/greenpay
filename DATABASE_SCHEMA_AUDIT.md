# Database Schema Audit Report - INITIAL (SUPERSEDED)

> **⚠️ NOTE:** This initial audit was based on limited information and has been **SUPERSEDED** by the complete analysis.
> **See:** `DATABASE_SCHEMA_AUDIT_UPDATED.md` and `DATABASE_ANALYSIS_SUMMARY.md` for correct findings.

**Date:** 2025-12-19 (Initial audit - partially incorrect)
**Severity:** CRITICAL
**Status:** Major schema mismatches discovered - **BUT** situation is more complex than initially thought

---

## 🚨 CRITICAL FINDING - PARTIALLY INCORRECT

**Initial assessment:** The backend routes were written for a **legacy PostgreSQL database** with Sequelize ORM conventions, but production is running a **completely different schema**.

**Actual finding after schema dump:** Production has **BOTH** legacy AND modern schemas coexisting! Many tables we thought were missing actually exist.

### Schema Mismatch Examples:

| Backend Code Expects | Production Has | Impact |
|---------------------|----------------|--------|
| `"Passport"` table (capitalized) | `passports` (lowercase) | All passport queries fail |
| `"User"` + `"Role"` tables | `profiles` table with `role` TEXT field | User management broken |
| `invoices` table | **Table doesn't exist** | Invoice features completely broken |
| `customer_name`, `customer_email` | **Columns don't exist** | Multiple features broken |
| `redeemed_date` | `used_at` | Corporate voucher queries fail |
| `issued_date` | `created_at` | Date sorting broken |

---

## ROOT CAUSE

**Two different database schemas coexist:**

1. **Legacy PostgreSQL (what backend expects)**
   - CamelCase/PascalCase columns: `"passportNo"`, `"givenName"`, `"createdById"`
   - Separate User/Role tables with foreign keys
   - invoices, customers, invoice_payments tables
   - Sequelize ORM conventions

2. **Current Production (what actually exists)**
   - snake_case columns: `passport_number`, `given_name`, `created_by`
   - Single profiles table linked to Supabase Auth
   - No invoices table
   - PostgreSQL standard conventions

---

## CRITICAL MISSING TABLES

These tables are referenced in backend code but **DO NOT EXIST** in production:

1. **`invoices`** - Referenced in:
   - `backend/routes/invoices-gst.js` (entire file)
   - `backend/routes/vouchers.js`
   - `backend/routes/quotations.js`

2. **`"User"` (capitalized)** - Referenced in:
   - `backend/routes/users.js`
   - `backend/routes/quotations.js`
   - `backend/routes/passports.js`

3. **`"Passport"` (capitalized)** - Referenced in:
   - `backend/routes/passports.js`
   - `backend/routes/individual-purchases.js`

4. **`"Role"` (capitalized)** - Referenced in:
   - `backend/routes/users.js`

5. **`purchase_sessions`** - Referenced in:
   - `backend/routes/public-purchases.js`

6. **`customers`** - Referenced in:
   - `backend/routes/invoices-gst.js`
   - `backend/routes/vouchers.js`

---

## CRITICAL COLUMN MISMATCHES

### Individual Purchases Table

**Production Schema:**
```sql
id, voucher_code, passport_id, passport_number, amount,
payment_method, card_last_four, discount, collected_amount,
returned_amount, used_at, valid_from, valid_until, created_by,
created_at, updated_at
```

**Backend Expects (but don't exist):**
- `customer_name`
- `customer_email`
- `customer_phone`
- `refund_status`
- `refund_payment_method`
- `refund_reason`, `refund_method`, `refund_notes`
- `refunded_at`, `refunded_by`
- `status`
- `payment_mode` (should be `payment_method`)
- `purchase_session_id`
- `payment_gateway_ref`
- `purchased_at` (should be `created_at`)

### Corporate Vouchers Table

**Production Schema:**
```sql
id, batch_id, voucher_code, company_name, employee_name, employee_id,
amount, status, issued_date, redeemed_date, valid_from, valid_until,
invoice_id, is_green_pass, registered_at, passport_id, passport_number,
registered_by
```

**Backend Expects (wrong names):**
- `redeemed_date` exists but backend also checks `used_at`
- `payment_method` (doesn't exist in corporate_vouchers)
- `issued_date` (exists) but sometimes backend uses `created_at`

### Quotations Table

**Production Schema:**
```sql
quotation_number, company_name, contact_person, contact_email, contact_phone,
number_of_passports, amount_per_passport, price_per_passport, total_amount,
discount, discount_amount, amount_after_discount, valid_until, status, notes,
created_by, created_at, updated_at
```

**Backend Tries to INSERT (wrong columns):**
- `customer_name` (should be `company_name`)
- `customer_email` (should be `contact_email`)
- `number_of_vouchers` (should be `number_of_passports`)
- `unit_price` (should be `amount_per_passport`)
- `tax_percentage`, `tax_amount` (don't exist)
- `gst_rate`, `gst_amount` (don't exist)
- `payment_terms` (doesn't exist)
- `line_total` (doesn't exist)
- `discount_percentage` (doesn't exist, only `discount`)

### Passports Table

**Production Schema:**
```sql
passport_number, nationality, surname, given_name, date_of_birth, sex
```

**Backend References (wrong names):**
- `"passportNo"` (should be `passport_number`)
- `"givenName"` (should be `given_name`)
- `"createdAt"` (should be `created_at`)
- `"createdById"` (should be `created_by`)
- `full_name` (doesn't exist - need to concat `surname` + `given_name`)

---

## FILES WITH CRITICAL ISSUES

### 1. `backend/routes/vouchers.js`
**Lines with schema mismatches:**
- Line 48-51: JOIN to `invoices` table (doesn't exist)
- Line 117-138: Uses `redeemed_date` inconsistently
- Line 764: References `full_name` (should concat surname + given_name)
- Line 906: WHERE `batch_id = $1` works
- Line 1104-1129: **FIXED** - now uses `created_at`, `NULL as nationality`
- Line 1131-1158: **FIXED** - now uses `NULL as payment_method`

### 2. `backend/routes/individual-purchases.js`
**Lines with schema mismatches:**
- Line 23-29: JOIN to `"Passport"` (capitalized - wrong table)
- Line 102-117: INSERT works with current schema
- Line 164-169: JOIN to `"Passport"` (capitalized - wrong table)
- Line 222-224: UPDATE references `refund_status`, `refund_payment_method` (don't exist)

### 3. `backend/routes/passports.js`
**Lines with schema mismatches:**
- Line 14-34: SELECT from `"Passport"` (should be `passports`)
- Line 16-17: JOIN to `"User"` table (doesn't exist)
- Line 29: `"passportNo"`, `"givenName"` (should be snake_case)
- Line 88-94: INSERT uses `createdById` (should be `created_by`)

### 4. `backend/routes/quotations.js`
**Lines with schema mismatches:**
- Line 16-41: JOIN to `"User"` table (doesn't exist)
- Line 118-147: INSERT with wrong column names (see above)

### 5. `backend/routes/users.js`
**Lines with schema mismatches:**
- Line 15-20: SELECT from `"User"` + `"Role"` (both tables don't exist)
- Line 74: Checks `email` (OK - exists in profiles)
- Line 87-91: INSERT with `"roleId"` (Supabase uses `role` TEXT field)

### 6. `backend/routes/invoices-gst.js`
**Lines with schema mismatches:**
- Line 184-220: **ALL QUERIES FAIL** - invoices table doesn't exist
- Line 287-303: corporate_vouchers WHERE `invoice_id` (column doesn't exist)
- Line 505-551: INSERT into invoices (table doesn't exist)

### 7. `backend/routes/public-purchases.js`
**Lines with schema mismatches:**
- Line 287: WHERE `purchase_session_id = $1` (column doesn't exist)
- Line 323-329: INSERT uses `payment_mode`, `purchase_session_id`, `payment_gateway_ref` (don't exist)
- Line 436-454: References `purchased_at` (should be `created_at`)

---

## IMPACT ANALYSIS

### ❌ COMPLETELY BROKEN FEATURES

1. **Invoices & GST Management** - invoices table doesn't exist
2. **User Management** - User/Role tables don't exist
3. **Passport CRUD** - Wrong table names
4. **Quotations Create/Update** - Wrong column names
5. **View Vouchers by Passport** - Schema mismatches (partially fixed)
6. **Public Online Purchases** - Missing columns
7. **Refund Processing** - Missing refund columns

### ⚠️ PARTIALLY WORKING FEATURES

1. **Individual Purchase Creation** - Works if not using refunds
2. **Corporate Voucher Creation** - Basic creation works
3. **Passport Lookup** - May work with vouchers-list filter

### ✅ LIKELY WORKING FEATURES

1. **Authentication** - Uses Supabase Auth directly
2. **Basic voucher validation** - If using voucher_code directly
3. **Payment mode configuration** - Separate table

---

## RECOMMENDED SOLUTIONS

### Option 1: Update Backend to Match Production Schema (RECOMMENDED)

**Pros:**
- Clean, maintainable code
- Matches PostgreSQL best practices
- Works with existing data

**Cons:**
- Requires rewriting most backend routes
- Time-intensive
- Need thorough testing

**Steps:**
1. Create schema documentation from actual production DB
2. Rewrite backend routes to use correct table/column names
3. Add missing columns where needed (with migrations)
4. Test all features thoroughly
5. Deploy incrementally

### Option 2: Create Missing Tables/Columns in Production

**Pros:**
- Minimal code changes
- Faster short-term

**Cons:**
- Messy schema with mixed conventions
- Technical debt
- Harder to maintain
- May conflict with Supabase conventions

---

## IMMEDIATE ACTION ITEMS

### Phase 1: Critical Fixes (This Week)

1. **✅ DONE:** Added `card_last_four` column to `individual_purchases`
2. **✅ DONE:** Fixed voucher template (removed registration link)
3. **✅ DONE:** Fixed IT Support navigation

4. **TODO:** Document actual production schema
   ```bash
   # Generate complete schema dump
   pg_dump -h localhost -U greenpay_user -d greenpay_db --schema-only > PRODUCTION_SCHEMA.sql
   ```

5. **TODO:** Disable broken features temporarily:
   - Invoices/GST pages
   - User management (except via Supabase dashboard)
   - Passport CRUD (use passports-list only)
   - Quotations create/edit

### Phase 2: Schema Alignment (Next Week)

1. Add missing columns to `individual_purchases`:
   ```sql
   ALTER TABLE individual_purchases ADD COLUMN customer_name VARCHAR(255);
   ALTER TABLE individual_purchases ADD COLUMN customer_email VARCHAR(255);
   ALTER TABLE individual_purchases ADD COLUMN customer_phone VARCHAR(50);
   ```

2. Create column aliases in queries for name mismatches:
   ```sql
   -- Instead of changing DB:
   SELECT
     surname || ' ' || given_name AS full_name,
     passport_number AS "passportNo"  -- if needed
   FROM passports
   ```

3. Fix all table references:
   - `"Passport"` → `passports`
   - `"User"` → `profiles`
   - Remove `"Role"` references (use profiles.role directly)

### Phase 3: Feature Restoration (Following Week)

1. Create `invoices` table if needed for GST compliance
2. Create `purchase_sessions` table for public purchases
3. Update all backend routes with correct column names
4. Comprehensive testing of all features

---

## TESTING CHECKLIST

Before deploying any fixes, test:

- [ ] View vouchers list (filter by passport number)
- [ ] Create individual purchase
- [ ] Create corporate voucher batch
- [ ] Validate voucher
- [ ] User login/authentication
- [ ] Reports generation
- [ ] Settings management

---

## MIGRATION SCRIPT TEMPLATE

```sql
-- Migration: Align individual_purchases with backend expectations
-- Date: 2025-12-19

BEGIN;

-- Add missing customer columns
ALTER TABLE individual_purchases
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);

-- Add refund columns if needed
ALTER TABLE individual_purchases
ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS refund_reason TEXT,
ADD COLUMN IF NOT EXISTS refund_method VARCHAR(100),
ADD COLUMN IF NOT EXISTS refund_notes TEXT,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS refunded_by INTEGER;

COMMIT;
```

---

## CONCLUSION

The application has **major schema inconsistencies** that explain why many features are broken. The "View Vouchers by Passport" error was just the tip of the iceberg.

**Recommendation:**
1. Generate complete production schema documentation
2. Disable broken features temporarily
3. Plan systematic migration to align backend with production schema
4. Implement changes incrementally with thorough testing

This is a significant undertaking but necessary for application stability.

---

**Prepared by:** Database Audit
**Next Review:** After Phase 1 completion
