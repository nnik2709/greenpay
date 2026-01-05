# 🚀 GreenPay Production Migration - Master Plan

**Migration Date:** TBD (Recommended: Weekend, 2-4 AM window)
**Current Status:** Planning Complete - Ready for Execution
**Complexity:** High (Data Migration + Schema Transformation + Domain Switch)
**Estimated Downtime:** 30-60 minutes

---

## Executive Summary

This master plan consolidates three major initiatives into a single coordinated migration:

1. **Domain Switch:** greenpay.eywademo.cloud → pnggreenfees.gov.pg
2. **Data Migration:** Old Laravel system (147.93.111.184) → New GreenPay system
3. **Schema Transformation:** Legacy capitalized/CamelCase → Modern lowercase/snake_case

**Key Insight:** All three initiatives happen during the same migration window to minimize disruption and avoid double migrations.

---

## 1. Current State Analysis

### 1.1 Source Systems

| System | Location | Database | Status |
|--------|----------|----------|--------|
| Old Laravel App | pnggreenfees.gov.pg (147.93.111.184:5432) | myappdb | Production (Active) |
| New GreenPay (Staging) | greenpay.eywademo.cloud (165.22.52.100) | greenpay_db | Staging (Testing) |
| Target Production | pnggreenfees.gov.pg (165.22.52.100) | greenpay_db | To be deployed |

### 1.2 Current GreenPay Database - Dual Schema Issue

**Problem:** Current GreenPay database has BOTH legacy and modern schemas coexisting:

**Legacy Schema (Capitalized/CamelCase):**
- `"User"` - 6 rows (test users)
- `"Passport"` - 153 rows (test passports)
- `"Role"` - 8 rows (roles)
- `"Invoice"` - Test invoices
- `"Quotation"` - Test quotations

**Modern Schema (Lowercase/Snake_Case):**
- `passports` - 5 rows (newer test passports)
- `individual_purchases` - 56 rows (test vouchers)
- `corporate_vouchers` - 342 rows (test corporate vouchers)
- `customers` - Customer records
- `purchase_sessions` - Purchase tracking
- `invoice_payments` - Payment tracking

**Resolution Strategy:** Migrate to clean modern schema, prioritizing production data over test data.

### 1.3 Data Sources Priority

When conflicts occur during migration, use this priority order:

1. **Production data** from old Laravel system (147.93.111.184) - HIGHEST PRIORITY
2. **Modern schema** test data from current GreenPay (passports, individual_purchases, etc.)
3. **Legacy schema** test data from current GreenPay ("Passport", "User", etc.) - LOWEST PRIORITY

---

## 2. Migration Architecture

### 2.1 Three-Phase Approach

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: PRE-MIGRATION (Day Before)                            │
│ - Export old production data (Laravel)                          │
│ - Backup current GreenPay database                              │
│ - Create staging tables                                         │
│ - Run pre-migration validation                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: MIGRATION NIGHT (2:00-4:00 AM)                        │
│ - Display maintenance page                                      │
│ - Create clean modern schema                                    │
│ - Import production data (priority 1)                           │
│ - Merge modern test data (priority 2)                           │
│ - Merge legacy test data (priority 3)                           │
│ - Update backend configuration                                  │
│ - Switch DNS to new domain                                      │
│ - Verify and go live                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: POST-MIGRATION (Next Day)                             │
│ - Monitor system health                                         │
│ - User acceptance testing                                       │
│ - Archive old databases                                         │
│ - Clean up backup files                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Migration Scripts

### 3.1 Script 1: Create Staging Tables

**Purpose:** Create temporary staging tables to merge data from all sources

```sql
-- /migration-scripts/01-create-staging-tables.sql

-- Users staging (combines User + old users + profiles)
CREATE TABLE IF NOT EXISTS users_staging (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password VARCHAR(255),
  role_id INTEGER,
  is_active BOOLEAN DEFAULT true,
  data_source VARCHAR(50), -- 'production', 'modern_test', 'legacy_test'
  source_id BIGINT,        -- Original ID from source system
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Passports staging
CREATE TABLE IF NOT EXISTS passports_staging (
  passport_number VARCHAR(20) PRIMARY KEY,
  given_name VARCHAR(255),
  surname VARCHAR(255),
  full_name VARCHAR(255),
  nationality VARCHAR(100),
  date_of_birth DATE,
  gender VARCHAR(1),
  expiry_date DATE,
  issuing_country VARCHAR(100),
  mrz_line1 VARCHAR(44),
  mrz_line2 VARCHAR(44),
  place_of_birth VARCHAR(255),
  place_of_issue VARCHAR(255),
  date_of_issue DATE,
  email VARCHAR(255),
  phone VARCHAR(20),
  created_by UUID,
  data_source VARCHAR(50),
  source_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual purchases staging
CREATE TABLE IF NOT EXISTS individual_purchases_staging (
  voucher_code VARCHAR(50) PRIMARY KEY,
  passport_id BIGINT,
  passport_number VARCHAR(20),
  amount DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'PGK',
  payment_method VARCHAR(50),
  discount DECIMAL(10,2) DEFAULT 0,
  collected_amount DECIMAL(10,2),
  returned_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20),
  valid_from DATE,
  valid_until DATE,
  used_at TIMESTAMP,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  created_by UUID,
  data_source VARCHAR(50),
  source_id BIGINT,
  issued_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Corporate vouchers staging
CREATE TABLE IF NOT EXISTS corporate_vouchers_staging (
  voucher_code VARCHAR(50) PRIMARY KEY,
  batch_id VARCHAR(50),
  company_name VARCHAR(255),
  amount DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'PGK',
  quantity INTEGER DEFAULT 1,
  payment_method VARCHAR(50),
  discount DECIMAL(10,2) DEFAULT 0,
  collected_amount DECIMAL(10,2),
  returned_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20),
  passport_id BIGINT,
  passport_number VARCHAR(20),
  registered_at TIMESTAMP,
  valid_from DATE,
  valid_until DATE,
  used_at TIMESTAMP,
  invoice_id BIGINT,
  created_by UUID,
  data_source VARCHAR(50),
  source_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quotations staging
CREATE TABLE IF NOT EXISTS quotations_staging (
  quotation_number VARCHAR(50) PRIMARY KEY,
  customer_id UUID,
  company_name VARCHAR(255),
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  number_of_passports INTEGER,
  amount_per_passport DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  discount DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  amount_after_discount DECIMAL(10,2),
  items JSONB,
  tax DECIMAL(10,2) DEFAULT 0,
  valid_until DATE,
  status VARCHAR(20),
  notes TEXT,
  sent_at TIMESTAMP,
  created_by UUID,
  data_source VARCHAR(50),
  source_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices staging
CREATE TABLE IF NOT EXISTS invoices_staging (
  invoice_number VARCHAR(50) PRIMARY KEY,
  customer_id UUID,
  quotation_id BIGINT,
  company_name VARCHAR(255),
  items JSONB,
  subtotal DECIMAL(10,2),
  gst DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  amount_paid DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20),
  due_date DATE,
  paid_date DATE,
  notes TEXT,
  created_by UUID,
  data_source VARCHAR(50),
  source_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_staging_source ON users_staging(data_source, source_id);
CREATE INDEX idx_passports_staging_source ON passports_staging(data_source, source_id);
CREATE INDEX idx_individual_staging_source ON individual_purchases_staging(data_source, source_id);
CREATE INDEX idx_corporate_staging_source ON corporate_vouchers_staging(data_source, source_id);

COMMENT ON TABLE users_staging IS 'Staging table for user migration from multiple sources';
COMMENT ON TABLE passports_staging IS 'Staging table for passport migration with priority handling';
```

### 3.2 Script 2: Import Production Data (Priority 1)

**Purpose:** Import data from old Laravel production system (highest priority)

```sql
-- /migration-scripts/02-import-production-data.sql

-- Set up connection to old production database
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

CREATE SERVER IF NOT EXISTS old_production_db
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host '147.93.111.184', port '5432', dbname 'myappdb');

CREATE USER MAPPING IF NOT EXISTS FOR CURRENT_USER
  SERVER old_production_db
  OPTIONS (user 'myappuser', password 'myapppass');

-- Import foreign schemas
IMPORT FOREIGN SCHEMA public
  LIMIT TO (users, roles, passports, payments, vouchers, voucher_batches, quotations, invoices, payment_modes, tickets, ticket_responses)
  FROM SERVER old_production_db
  INTO old_prod;

-- ===========================
-- MIGRATE USERS (Priority 1)
-- ===========================

-- Create UUID mapping for old users
CREATE TEMP TABLE user_uuid_mapping AS
SELECT
  id as old_id,
  gen_random_uuid() as new_uuid,
  email
FROM old_prod.users
WHERE email IS NOT NULL;

-- Insert production users into staging
INSERT INTO users_staging (
  id, email, name, password, role_id, is_active,
  data_source, source_id, created_at, updated_at
)
SELECT
  m.new_uuid,
  u.email,
  u.name,
  u.password,
  CASE u.role_id
    WHEN 1 THEN 1  -- ROLE_VFLEX_ADMIN → Flex_Admin
    WHEN 2 THEN 3  -- ROLE_COUNTER_AGENT → Counter_Agent
    WHEN 3 THEN 2  -- ROLE_FINANCE_MANAGER → Finance_Manager
    WHEN 4 THEN 4  -- ROLE_IT_SUPPORT → IT_Support
    ELSE 3         -- Default to Counter_Agent
  END,
  COALESCE(u.is_active, true),
  'production',
  u.id,
  u.created_at,
  u.updated_at
FROM old_prod.users u
JOIN user_uuid_mapping m ON u.id = m.old_id
WHERE u.email IS NOT NULL
ON CONFLICT (email) DO UPDATE SET
  data_source = 'production',  -- Production data always wins
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  role_id = EXCLUDED.role_id,
  is_active = EXCLUDED.is_active;

-- Export UUID mapping for reference
COPY user_uuid_mapping TO '/tmp/migration-user-uuid-map.csv' CSV HEADER;

-- ===========================
-- MIGRATE PASSPORTS (Priority 1)
-- ===========================

INSERT INTO passports_staging (
  passport_number, given_name, surname, full_name, nationality,
  date_of_birth, gender, expiry_date, issuing_country,
  place_of_birth, place_of_issue, date_of_issue,
  created_by, data_source, source_id, created_at, updated_at
)
SELECT
  p.passport_no,
  p.given_name,
  p.surname,
  CONCAT(p.given_name, ' ', p.surname),
  p.nationality,
  p.dob::date,
  CASE p.sex
    WHEN 'M' THEN 'M'
    WHEN 'F' THEN 'F'
    ELSE 'X'
  END,
  p.date_of_expiry::date,
  COALESCE(p.nationality, 'PNG'),  -- Default to PNG if missing
  p.place_of_birth,
  p.place_of_issue,
  p.date_of_issue::date,
  (SELECT new_uuid FROM user_uuid_mapping WHERE old_id = p.created_by),
  'production',
  p.id,
  p.created_at,
  p.updated_at
FROM old_prod.passports p
WHERE p.passport_no IS NOT NULL
ON CONFLICT (passport_number) DO UPDATE SET
  data_source = 'production',  -- Production data always wins
  given_name = EXCLUDED.given_name,
  surname = EXCLUDED.surname,
  full_name = EXCLUDED.full_name,
  nationality = EXCLUDED.nationality,
  date_of_birth = EXCLUDED.date_of_birth,
  gender = EXCLUDED.gender,
  expiry_date = EXCLUDED.expiry_date;

-- ===========================
-- MIGRATE INDIVIDUAL PURCHASES (Priority 1)
-- ===========================

-- Only migrate payments where payment_mode != 'corporate' or bulk_upload_id IS NULL
INSERT INTO individual_purchases_staging (
  voucher_code, passport_id, passport_number, amount, currency,
  payment_method, discount, collected_amount, returned_amount,
  status, valid_from, valid_until, used_at,
  customer_email, customer_phone, created_by,
  data_source, source_id, issued_date, created_at, updated_at
)
SELECT
  p.code,  -- Old payment code becomes voucher code
  p.passport_id,
  (SELECT passport_no FROM old_prod.passports WHERE id = p.passport_id),
  (p.voucher_value * p.total_vouchers),  -- Calculate total amount
  'PGK',
  CASE p.payment_mode
    WHEN 'cash' THEN 'CASH'
    WHEN 'card' THEN 'CREDIT CARD'
    WHEN 'bank transfer' THEN 'BANK TRANSFER'
    WHEN 'eftpos' THEN 'EFTPOS'
    ELSE 'CASH'
  END,
  p.discount,
  p.collected_amount,
  p.returned_amount,
  CASE
    WHEN p.used_at IS NOT NULL THEN 'used'
    ELSE 'active'
  END,
  p.valid_from,
  p.valid_until,
  p.used_at,
  p.share_with_email,
  p.share_with_number,
  (SELECT new_uuid FROM user_uuid_mapping WHERE old_id = p.created_by),
  'production',
  p.id,
  p.created_at::date,
  p.created_at,
  p.updated_at
FROM old_prod.payments p
WHERE p.code IS NOT NULL
  AND (p.payment_mode != 'corporate' OR p.bulk_upload_id IS NULL)
ON CONFLICT (voucher_code) DO UPDATE SET
  data_source = 'production',
  amount = EXCLUDED.amount,
  status = EXCLUDED.status;

-- ===========================
-- MIGRATE CORPORATE VOUCHERS (Priority 1)
-- ===========================

-- Create voucher code generation function
CREATE OR REPLACE FUNCTION generate_corporate_voucher_code(batch_id BIGINT, voucher_index INTEGER)
RETURNS VARCHAR(50) AS $$
DECLARE
  date_str VARCHAR(8);
BEGIN
  date_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  RETURN 'CORP-' || date_str || '-' || LPAD(batch_id::TEXT, 5, '0') || '-' || LPAD(voucher_index::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Migrate voucher batches (each batch creates multiple voucher records)
WITH batch_vouchers AS (
  SELECT
    vb.id as batch_id,
    generate_series(1, vb.total_vouchers) as voucher_index,
    vb.*,
    (SELECT client_name FROM old_prod.quotations WHERE id = vb.quotation_id) as company_name
  FROM old_prod.voucher_batches vb
)
INSERT INTO corporate_vouchers_staging (
  voucher_code, batch_id, company_name, amount, currency,
  quantity, payment_method, discount, collected_amount, returned_amount,
  status, valid_from, valid_until, invoice_id, created_by,
  data_source, source_id, created_at, updated_at
)
SELECT
  generate_corporate_voucher_code(bv.batch_id, bv.voucher_index),
  'BATCH-' || bv.batch_id,
  COALESCE(bv.company_name, 'Unknown Company'),
  bv.voucher_value,
  'PGK',
  1,  -- Each record = 1 voucher
  CASE bv.payment_mode
    WHEN 'cash' THEN 'CASH'
    WHEN 'card' THEN 'CREDIT CARD'
    WHEN 'bank transfer' THEN 'BANK TRANSFER'
    WHEN 'eftpos' THEN 'EFTPOS'
    ELSE 'CASH'
  END,
  (bv.discount / NULLIF(bv.total_vouchers, 0)),  -- Divide discount by quantity
  (bv.collected_amount / NULLIF(bv.total_vouchers, 0)),
  (bv.returned_amount / NULLIF(bv.total_vouchers, 0)),
  'pending',
  bv.valid_from,
  bv.valid_until,
  bv.invoice_id,
  (SELECT new_uuid FROM user_uuid_mapping WHERE old_id = bv.created_by),
  'production',
  bv.batch_id,
  bv.created_at,
  bv.updated_at
FROM batch_vouchers bv
ON CONFLICT (voucher_code) DO UPDATE SET
  data_source = 'production';

-- ===========================
-- MIGRATE QUOTATIONS (Priority 1)
-- ===========================

INSERT INTO quotations_staging (
  quotation_number, company_name, contact_email, number_of_passports,
  amount_per_passport, total_amount, discount, discount_amount,
  amount_after_discount, items, valid_until, status, notes,
  created_by, data_source, source_id, created_at, updated_at
)
SELECT
  q.quotation_number,
  q.client_name,
  q.client_email,
  q.total_vouchers,
  q.voucher_value,
  q.total_amount,
  q.discount_percentage,
  q.discount_amount,
  q.amount_after_discount,
  jsonb_build_array(
    jsonb_build_object(
      'description', 'Green Fee Vouchers',
      'quantity', q.total_vouchers,
      'unitPrice', q.voucher_value,
      'amount', q.total_amount
    )
  ),
  q.validity_date,
  CASE q.status
    WHEN 'draft' THEN 'draft'
    WHEN 'sent' THEN 'sent'
    WHEN 'approved' THEN 'approved'
    WHEN 'converted' THEN 'converted'
    WHEN 'expired' THEN 'expired'
    ELSE 'draft'
  END,
  CONCAT_WS(E'\n\n', q.terms_conditions, q.notes),
  (SELECT new_uuid FROM user_uuid_mapping WHERE old_id = q.created_by),
  'production',
  q.id,
  q.created_at,
  q.updated_at
FROM old_prod.quotations q
WHERE q.quotation_number IS NOT NULL
ON CONFLICT (quotation_number) DO UPDATE SET
  data_source = 'production';

-- ===========================
-- MIGRATE INVOICES (Priority 1)
-- ===========================

INSERT INTO invoices_staging (
  invoice_number, quotation_id, company_name, subtotal, total_amount,
  amount_paid, status, due_date, paid_date, notes, created_by,
  data_source, source_id, created_at, updated_at
)
SELECT
  i.invoice_number,
  i.quotation_id,
  i.client_name,
  (i.total_amount - i.discount),
  i.amount_after_discount,
  i.collected_amount,
  CASE i.status
    WHEN 'draft' THEN 'unpaid'
    WHEN 'sent' THEN 'unpaid'
    WHEN 'paid' THEN 'paid'
    WHEN 'overdue' THEN 'overdue'
    ELSE 'unpaid'
  END,
  i.due_date,
  CASE
    WHEN i.collected_amount >= i.amount_after_discount THEN i.updated_at
    ELSE NULL
  END,
  i.notes,
  (SELECT new_uuid FROM user_uuid_mapping WHERE old_id = i.created_by),
  'production',
  i.id,
  i.created_at,
  i.updated_at
FROM old_prod.invoices i
WHERE i.invoice_number IS NOT NULL
ON CONFLICT (invoice_number) DO UPDATE SET
  data_source = 'production';

-- Validation queries
SELECT 'Production Users Imported' as step, COUNT(*) as count FROM users_staging WHERE data_source = 'production';
SELECT 'Production Passports Imported' as step, COUNT(*) as count FROM passports_staging WHERE data_source = 'production';
SELECT 'Production Individual Purchases Imported' as step, COUNT(*) as count FROM individual_purchases_staging WHERE data_source = 'production';
SELECT 'Production Corporate Vouchers Imported' as step, COUNT(*) as count FROM corporate_vouchers_staging WHERE data_source = 'production';
SELECT 'Production Quotations Imported' as step, COUNT(*) as count FROM quotations_staging WHERE data_source = 'production';
SELECT 'Production Invoices Imported' as step, COUNT(*) as count FROM invoices_staging WHERE data_source = 'production';
```

### 3.3 Script 3: Import Modern Test Data (Priority 2)

**Purpose:** Import data from current GreenPay modern schema (medium priority)

```sql
-- /migration-scripts/03-import-modern-test-data.sql

-- ===========================
-- MIGRATE MODERN PASSPORTS (Priority 2)
-- ===========================

INSERT INTO passports_staging (
  passport_number, full_name, nationality, date_of_birth, gender,
  expiry_date, issuing_country, mrz_line1, mrz_line2,
  email, phone, created_by,
  data_source, source_id, created_at, updated_at
)
SELECT
  passport_number,
  full_name,
  nationality,
  date_of_birth,
  gender,
  expiry_date,
  issuing_country,
  mrz_line1,
  mrz_line2,
  email,
  phone,
  created_by,
  'modern_test',
  id,
  created_at,
  updated_at
FROM passports
ON CONFLICT (passport_number) DO NOTHING;  -- Don't override production data

-- ===========================
-- MIGRATE MODERN INDIVIDUAL PURCHASES (Priority 2)
-- ===========================

INSERT INTO individual_purchases_staging (
  voucher_code, passport_id, passport_number, amount, currency,
  payment_method, discount, collected_amount, returned_amount,
  status, valid_from, valid_until, used_at,
  customer_email, customer_phone, created_by,
  data_source, source_id, issued_date, created_at, updated_at
)
SELECT
  voucher_code,
  passport_id,
  passport_number,
  amount,
  currency,
  payment_method,
  discount,
  collected_amount,
  returned_amount,
  status,
  valid_from,
  valid_until,
  used_at,
  customer_email,
  customer_phone,
  created_by,
  'modern_test',
  id,
  issued_date,
  created_at,
  updated_at
FROM individual_purchases
ON CONFLICT (voucher_code) DO NOTHING;  -- Don't override production data

-- ===========================
-- MIGRATE MODERN CORPORATE VOUCHERS (Priority 2)
-- ===========================

INSERT INTO corporate_vouchers_staging (
  voucher_code, batch_id, company_name, amount, currency,
  quantity, payment_method, discount, collected_amount, returned_amount,
  status, passport_id, passport_number, registered_at,
  valid_from, valid_until, used_at, invoice_id, created_by,
  data_source, source_id, created_at, updated_at
)
SELECT
  voucher_code,
  batch_id,
  company_name,
  amount,
  currency,
  quantity,
  payment_method,
  discount,
  collected_amount,
  returned_amount,
  status,
  passport_id,
  passport_number,
  registered_at,
  valid_from,
  valid_until,
  used_at,
  invoice_id,
  created_by,
  'modern_test',
  id,
  created_at,
  updated_at
FROM corporate_vouchers
ON CONFLICT (voucher_code) DO NOTHING;  -- Don't override production data

-- Validation
SELECT 'Modern Passports Imported' as step, COUNT(*) as count FROM passports_staging WHERE data_source = 'modern_test';
SELECT 'Modern Individual Purchases Imported' as step, COUNT(*) as count FROM individual_purchases_staging WHERE data_source = 'modern_test';
SELECT 'Modern Corporate Vouchers Imported' as step, COUNT(*) as count FROM corporate_vouchers_staging WHERE data_source = 'modern_test';
```

### 3.4 Script 4: Import Legacy Test Data (Priority 3)

**Purpose:** Import data from current GreenPay legacy schema (lowest priority)

```sql
-- /migration-scripts/04-import-legacy-test-data.sql

-- ===========================
-- MIGRATE LEGACY PASSPORTS (Priority 3)
-- ===========================

INSERT INTO passports_staging (
  passport_number, given_name, surname, full_name, nationality,
  date_of_birth, gender, expiry_date, issuing_country,
  place_of_birth, place_of_issue, date_of_issue,
  created_by, data_source, source_id, created_at, updated_at
)
SELECT
  "passportNo",
  "givenName",
  surname,
  CONCAT("givenName", ' ', surname),
  nationality,
  CASE WHEN dob IS NOT NULL THEN dob::date ELSE NULL END,
  CASE gender
    WHEN 'M' THEN 'M'
    WHEN 'F' THEN 'F'
    ELSE 'X'
  END,
  CASE WHEN "expiryDate" IS NOT NULL THEN "expiryDate"::date ELSE NULL END,
  COALESCE("issuingCountry", nationality, 'PNG'),
  "placeOfBirth",
  "placeOfIssue",
  CASE WHEN "dateOfIssue" IS NOT NULL THEN "dateOfIssue"::date ELSE NULL END,
  "createdById",
  'legacy_test',
  id,
  "createdAt",
  "updatedAt"
FROM "Passport"
WHERE "passportNo" IS NOT NULL
ON CONFLICT (passport_number) DO NOTHING;  -- Don't override production or modern data

-- Validation
SELECT 'Legacy Passports Imported' as step, COUNT(*) as count FROM passports_staging WHERE data_source = 'legacy_test';
```

### 3.5 Script 5: Create Final Modern Schema

**Purpose:** Create clean modern schema and populate from staging tables

```sql
-- /migration-scripts/05-create-final-modern-schema.sql

-- ===========================
-- BACKUP OLD TABLES
-- ===========================

-- Archive legacy schema tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Passport') THEN
    ALTER TABLE "Passport" RENAME TO "_archived_Passport_20260102";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User') THEN
    ALTER TABLE "User" RENAME TO "_archived_User_20260102";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Invoice') THEN
    ALTER TABLE "Invoice" RENAME TO "_archived_Invoice_20260102";
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Quotation') THEN
    ALTER TABLE "Quotation" RENAME TO "_archived_Quotation_20260102";
  END IF;
END $$;

-- Backup modern schema tables
ALTER TABLE IF EXISTS passports RENAME TO passports_old_backup_20260102;
ALTER TABLE IF EXISTS individual_purchases RENAME TO individual_purchases_old_backup_20260102;
ALTER TABLE IF EXISTS corporate_vouchers RENAME TO corporate_vouchers_old_backup_20260102;

-- ===========================
-- CREATE CLEAN MODERN SCHEMA
-- ===========================

-- Users table (modern schema)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Passports table (modern schema)
CREATE TABLE passports (
  id SERIAL PRIMARY KEY,
  passport_number VARCHAR(20) UNIQUE NOT NULL,
  given_name VARCHAR(255),
  surname VARCHAR(255),
  full_name VARCHAR(255) NOT NULL,
  nationality VARCHAR(100),
  date_of_birth DATE,
  gender VARCHAR(1),
  expiry_date DATE,
  issuing_country VARCHAR(100),
  mrz_line1 VARCHAR(44),
  mrz_line2 VARCHAR(44),
  place_of_birth VARCHAR(255),
  place_of_issue VARCHAR(255),
  date_of_issue DATE,
  email VARCHAR(255),
  phone VARCHAR(20),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual purchases table (modern schema)
CREATE TABLE individual_purchases (
  id SERIAL PRIMARY KEY,
  voucher_code VARCHAR(50) UNIQUE NOT NULL,
  passport_id INTEGER REFERENCES passports(id),
  passport_number VARCHAR(20),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'PGK',
  payment_method VARCHAR(50),
  discount DECIMAL(10,2) DEFAULT 0,
  collected_amount DECIMAL(10,2),
  returned_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  valid_from DATE,
  valid_until DATE,
  used_at TIMESTAMP,
  refund_reason TEXT,
  refunded_at TIMESTAMP,
  refunded_by UUID REFERENCES users(id),
  purchase_session_id VARCHAR(50),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  payment_gateway_ref VARCHAR(100),
  created_by UUID REFERENCES users(id),
  issued_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Corporate vouchers table (modern schema)
CREATE TABLE corporate_vouchers (
  id SERIAL PRIMARY KEY,
  voucher_code VARCHAR(50) UNIQUE NOT NULL,
  batch_id VARCHAR(50),
  company_name VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'PGK',
  quantity INTEGER DEFAULT 1,
  payment_method VARCHAR(50),
  discount DECIMAL(10,2) DEFAULT 0,
  collected_amount DECIMAL(10,2),
  returned_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  passport_id INTEGER REFERENCES passports(id),
  passport_number VARCHAR(20),
  registered_at TIMESTAMP,
  valid_from DATE,
  valid_until DATE,
  used_at TIMESTAMP,
  invoice_id INTEGER,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quotations table (modern schema)
CREATE TABLE quotations (
  id SERIAL PRIMARY KEY,
  quotation_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES users(id),
  company_name VARCHAR(255),
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  number_of_passports INTEGER,
  amount_per_passport DECIMAL(10,2),
  price_per_passport DECIMAL(10,2),
  subtotal DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  discount DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  amount_after_discount DECIMAL(10,2),
  items JSONB,
  tax DECIMAL(10,2) DEFAULT 0,
  valid_until DATE,
  status VARCHAR(20) DEFAULT 'draft',
  notes TEXT,
  sent_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table (modern schema)
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES users(id),
  quotation_id INTEGER REFERENCES quotations(id),
  company_name VARCHAR(255),
  items JSONB,
  subtotal DECIMAL(10,2),
  gst DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  amount_paid DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'unpaid',
  due_date DATE,
  paid_date DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- POPULATE FROM STAGING (Priority Order)
-- ===========================

-- Migrate users (production priority)
INSERT INTO users (
  id, email, name, password, role_id, is_active, created_at, updated_at
)
SELECT
  id, email, name, password, role_id, is_active, created_at, updated_at
FROM users_staging
ORDER BY
  CASE data_source
    WHEN 'production' THEN 1
    WHEN 'modern_test' THEN 2
    WHEN 'legacy_test' THEN 3
  END,
  created_at
ON CONFLICT (email) DO UPDATE SET
  password = CASE
    WHEN users.password IS NULL OR users.password = ''
    THEN EXCLUDED.password
    ELSE users.password
  END;

-- Migrate passports (production priority)
INSERT INTO passports (
  passport_number, given_name, surname, full_name, nationality,
  date_of_birth, gender, expiry_date, issuing_country,
  mrz_line1, mrz_line2, place_of_birth, place_of_issue, date_of_issue,
  email, phone, created_by, created_at, updated_at
)
SELECT
  passport_number, given_name, surname, full_name, nationality,
  date_of_birth, gender, expiry_date, issuing_country,
  mrz_line1, mrz_line2, place_of_birth, place_of_issue, date_of_issue,
  email, phone, created_by, created_at, updated_at
FROM passports_staging
ORDER BY
  CASE data_source
    WHEN 'production' THEN 1
    WHEN 'modern_test' THEN 2
    WHEN 'legacy_test' THEN 3
  END,
  created_at
ON CONFLICT (passport_number) DO NOTHING;

-- Migrate individual purchases (production priority)
INSERT INTO individual_purchases (
  voucher_code, passport_number, amount, currency,
  payment_method, discount, collected_amount, returned_amount,
  status, valid_from, valid_until, used_at,
  customer_email, customer_phone, created_by,
  issued_date, created_at, updated_at
)
SELECT
  voucher_code, passport_number, amount, currency,
  payment_method, discount, collected_amount, returned_amount,
  status, valid_from, valid_until, used_at,
  customer_email, customer_phone, created_by,
  issued_date, created_at, updated_at
FROM individual_purchases_staging
ORDER BY
  CASE data_source
    WHEN 'production' THEN 1
    WHEN 'modern_test' THEN 2
    WHEN 'legacy_test' THEN 3
  END,
  created_at
ON CONFLICT (voucher_code) DO NOTHING;

-- Link passports to individual purchases
UPDATE individual_purchases ip
SET passport_id = p.id
FROM passports p
WHERE ip.passport_number = p.passport_number
  AND ip.passport_id IS NULL;

-- Migrate corporate vouchers (production priority)
INSERT INTO corporate_vouchers (
  voucher_code, batch_id, company_name, amount, currency,
  quantity, payment_method, discount, collected_amount, returned_amount,
  status, passport_number, registered_at, valid_from, valid_until,
  used_at, invoice_id, created_by, created_at, updated_at
)
SELECT
  voucher_code, batch_id, company_name, amount, currency,
  quantity, payment_method, discount, collected_amount, returned_amount,
  status, passport_number, registered_at, valid_from, valid_until,
  used_at, invoice_id, created_by, created_at, updated_at
FROM corporate_vouchers_staging
ORDER BY
  CASE data_source
    WHEN 'production' THEN 1
    WHEN 'modern_test' THEN 2
    WHEN 'legacy_test' THEN 3
  END,
  created_at
ON CONFLICT (voucher_code) DO NOTHING;

-- Link passports to corporate vouchers
UPDATE corporate_vouchers cv
SET passport_id = p.id
FROM passports p
WHERE cv.passport_number = p.passport_number
  AND cv.passport_id IS NULL;

-- Migrate quotations (production priority)
INSERT INTO quotations (
  quotation_number, company_name, contact_email, contact_phone,
  number_of_passports, amount_per_passport, subtotal, total_amount,
  discount, discount_amount, amount_after_discount, items,
  tax, valid_until, status, notes, sent_at, created_by, created_at, updated_at
)
SELECT
  quotation_number, company_name, contact_email, contact_phone,
  number_of_passports, amount_per_passport, subtotal, total_amount,
  discount, discount_amount, amount_after_discount, items,
  tax, valid_until, status, notes, sent_at, created_by, created_at, updated_at
FROM quotations_staging
ORDER BY
  CASE data_source
    WHEN 'production' THEN 1
    WHEN 'modern_test' THEN 2
    WHEN 'legacy_test' THEN 3
  END,
  created_at
ON CONFLICT (quotation_number) DO NOTHING;

-- Migrate invoices (production priority)
INSERT INTO invoices (
  invoice_number, company_name, items, subtotal, gst, total_amount,
  amount_paid, status, due_date, paid_date, notes,
  created_by, created_at, updated_at
)
SELECT
  invoice_number, company_name, items, subtotal, gst, total_amount,
  amount_paid, status, due_date, paid_date, notes,
  created_by, created_at, updated_at
FROM invoices_staging
ORDER BY
  CASE data_source
    WHEN 'production' THEN 1
    WHEN 'modern_test' THEN 2
    WHEN 'legacy_test' THEN 3
  END,
  created_at
ON CONFLICT (invoice_number) DO NOTHING;

-- ===========================
-- CREATE INDEXES
-- ===========================

CREATE INDEX idx_passports_number ON passports(passport_number);
CREATE INDEX idx_passports_created_by ON passports(created_by);
CREATE INDEX idx_individual_voucher ON individual_purchases(voucher_code);
CREATE INDEX idx_individual_passport ON individual_purchases(passport_id);
CREATE INDEX idx_individual_status ON individual_purchases(status);
CREATE INDEX idx_corporate_voucher ON corporate_vouchers(voucher_code);
CREATE INDEX idx_corporate_batch ON corporate_vouchers(batch_id);
CREATE INDEX idx_corporate_status ON corporate_vouchers(status);
CREATE INDEX idx_quotations_number ON quotations(quotation_number);
CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);

-- ===========================
-- VALIDATION
-- ===========================

SELECT 'Final Users Count' as table_name, COUNT(*) as count FROM users;
SELECT 'Final Passports Count' as table_name, COUNT(*) as count FROM passports;
SELECT 'Final Individual Purchases Count' as table_name, COUNT(*) as count FROM individual_purchases;
SELECT 'Final Corporate Vouchers Count' as table_name, COUNT(*) as count FROM corporate_vouchers;
SELECT 'Final Quotations Count' as table_name, COUNT(*) as count FROM quotations;
SELECT 'Final Invoices Count' as table_name, COUNT(*) as count FROM invoices;

-- Data source distribution
SELECT
  'Passports by Source' as metric,
  ps.data_source,
  COUNT(*) as count
FROM passports p
JOIN passports_staging ps ON p.passport_number = ps.passport_number
GROUP BY ps.data_source
ORDER BY count DESC;

SELECT
  'Individual Purchases by Source' as metric,
  ips.data_source,
  COUNT(*) as count
FROM individual_purchases ip
JOIN individual_purchases_staging ips ON ip.voucher_code = ips.voucher_code
GROUP BY ips.data_source
ORDER BY count DESC;

SELECT
  'Corporate Vouchers by Source' as metric,
  cvs.data_source,
  COUNT(*) as count
FROM corporate_vouchers cv
JOIN corporate_vouchers_staging cvs ON cv.voucher_code = cvs.voucher_code
GROUP BY cvs.data_source
ORDER BY count DESC;
```

---

## 4. Backend Configuration Changes

### 4.1 Environment Variables (.env)

**File:** `/var/www/greenpay/.env`

```bash
# ===========================
# DOMAIN AND URLs
# ===========================
NODE_ENV=production
FRONTEND_URL=https://pnggreenfees.gov.pg
BACKEND_URL=https://pnggreenfees.gov.pg/api
CORS_ORIGIN=https://pnggreenfees.gov.pg,https://www.pnggreenfees.gov.pg

# ===========================
# DATABASE
# ===========================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=greenpay_db
DB_USER=greenpay_user
DB_PASSWORD=GreenPay2025!Secure#PG

# ===========================
# BSP DOKU PAYMENT GATEWAY
# ===========================
BSP_DOKU_MODE=production
BSP_DOKU_MALL_ID=<PRODUCTION_MALL_ID>  # Get from BSP
BSP_DOKU_SHARED_KEY=<PRODUCTION_SHARED_KEY>  # Get from BSP
BSP_DOKU_CHAIN_MERCHANT=<PRODUCTION_CHAIN_MERCHANT>  # Get from BSP
BSP_DOKU_NOTIFY_URL=https://pnggreenfees.gov.pg/api/payment/webhook/doku/notify
BSP_DOKU_REDIRECT_URL=https://pnggreenfees.gov.pg/api/payment/webhook/doku/redirect
BSP_DOKU_ALLOWED_IPS=<PRODUCTION_IP_1>,<PRODUCTION_IP_2>  # Get from BSP

# ===========================
# SMTP CONFIGURATION (SendGrid)
# ===========================
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=<SENDGRID_API_KEY>  # Get from SendGrid
SMTP_FROM=noreply@pnggreenfees.gov.pg
SMTP_FROM_NAME=PNG Green Fees System

# ===========================
# APPLICATION
# ===========================
JWT_SECRET=<GENERATE_NEW_SECRET>
SESSION_SECRET=<GENERATE_NEW_SECRET>
PORT=5000
```

### 4.2 CORS Configuration

**File:** `/var/www/greenpay/backend/server.js`

```javascript
const corsOptions = {
  origin: [
    'https://pnggreenfees.gov.pg',
    'https://www.pnggreenfees.gov.pg',
    'https://greenpay.eywademo.cloud',  // Keep for rollback
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

---

## 5. Migration Night Timeline (2:00-4:00 AM)

### 2:00 AM - Start Migration

```bash
# 1. Display maintenance page
ssh root@165.22.52.100 'cat > /var/www/greenpay/maintenance.html <<EOF
<!DOCTYPE html>
<html>
<head><title>System Maintenance</title></head>
<body style="text-align:center; padding-top:100px; font-family:Arial">
  <h1>System Maintenance in Progress</h1>
  <p>We are upgrading to pnggreenfees.gov.pg</p>
  <p>Expected completion: 3:00 AM</p>
</body>
</html>
EOF'

# 2. Stop backend services
ssh root@165.22.52.100 'pm2 stop greenpay-api'
```

### 2:05 AM - Backup Current State

```bash
# 3. Backup current GreenPay database
ssh root@165.22.52.100 'PGPASSWORD="GreenPay2025!Secure#PG" pg_dump -h localhost -U greenpay_user greenpay_db > /root/migration-backups/greenpay_db_pre_migration_20260102.sql'
ssh root@165.22.52.100 'gzip /root/migration-backups/greenpay_db_pre_migration_20260102.sql'

# 4. Verify backup
ssh root@165.22.52.100 'ls -lh /root/migration-backups/'
```

### 2:15 AM - Run Migration Scripts

```bash
# 5. Upload migration scripts (via CloudPanel File Manager)
# Scripts: 01-create-staging-tables.sql through 05-create-final-modern-schema.sql

# 6. Execute migration scripts in order
ssh root@165.22.52.100 'cd /root/migration-scripts && \
  PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay_user greenpay_db < 01-create-staging-tables.sql | tee migration-01.log && \
  PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay_user greenpay_db < 02-import-production-data.sql | tee migration-02.log && \
  PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay_user greenpay_db < 03-import-modern-test-data.sql | tee migration-03.log && \
  PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay_user greenpay_db < 04-import-legacy-test-data.sql | tee migration-04.log && \
  PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay_user greenpay_db < 05-create-final-modern-schema.sql | tee migration-05.log'
```

### 2:40 AM - Update Configuration

```bash
# 7. Update .env file with production domain
ssh root@165.22.52.100 '
  cd /var/www/greenpay && \
  cp .env .env.backup_20260102 && \
  sed -i "s|greenpay.eywademo.cloud|pnggreenfees.gov.pg|g" .env && \
  echo "BSP_DOKU_MODE=production" >> .env
'

# 8. Update CORS in backend
# (Manual file edit via CloudPanel - see section 4.2)
```

### 2:50 AM - Verification

```bash
# 9. Verify migration results
ssh root@165.22.52.100 'PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay_user greenpay_db -c "
  SELECT table_name,
         (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns,
         pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
  FROM information_schema.tables t
  WHERE table_schema = '\''public'\''
    AND table_type = '\''BASE TABLE'\''
    AND table_name IN ('\''users'\'', '\''passports'\'', '\''individual_purchases'\'', '\''corporate_vouchers'\'', '\''quotations'\'', '\''invoices'\'')
  ORDER BY table_name;
"'

# 10. Test database connectivity
ssh root@165.22.52.100 'PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay_user greenpay_db -c "SELECT COUNT(*) as total_passports FROM passports;"'
```

### 3:00 AM - Start Services

```bash
# 11. Start backend
ssh root@165.22.52.100 'pm2 restart greenpay-api && pm2 logs greenpay-api --lines 50'

# 12. Test API endpoints
curl -I https://pnggreenfees.gov.pg/api/health
curl -I https://pnggreenfees.gov.pg/api/passports
```

### 3:10 AM - DNS Update

```bash
# 13. Update DNS records (via DNS provider)
# Add A record: pnggreenfees.gov.pg → 165.22.52.100
# Add CNAME record: www.pnggreenfees.gov.pg → pnggreenfees.gov.pg
# Update old domain A record: 147.93.111.184 → 165.22.52.100 (temporary redirect)
```

### 3:20 AM - SSL Certificate

```bash
# 14. Install SSL certificate for new domain
ssh root@165.22.52.100 'certbot --nginx -d pnggreenfees.gov.pg -d www.pnggreenfees.gov.pg --non-interactive --agree-tos -m admin@pnggreenfees.gov.pg'

# 15. Verify SSL
curl -I https://pnggreenfees.gov.pg
```

### 3:30 AM - Remove Maintenance Page & Test

```bash
# 16. Remove maintenance page
ssh root@165.22.52.100 'rm -f /var/www/greenpay/maintenance.html'

# 17. Comprehensive testing
# - Login as each user role
# - Search for passport
# - View individual purchases
# - View corporate vouchers
# - Generate PDF
# - Send test email
```

### 3:50 AM - Monitor

```bash
# 18. Watch logs for errors
ssh root@165.22.52.100 'pm2 logs greenpay-api --lines 200'

# 19. Check database connections
ssh root@165.22.52.100 'PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay_user greenpay_db -c "
  SELECT pid, usename, application_name, client_addr, state, query_start
  FROM pg_stat_activity
  WHERE datname = '\''greenpay_db'\''
  ORDER BY query_start DESC
  LIMIT 10;
"'
```

### 4:00 AM - Migration Complete

```bash
# 20. Final verification
# - All systems operational
# - No errors in logs
# - DNS propagating
# - SSL working
# - Email delivery working
# - BSP webhooks receiving requests (if applicable)

# 21. Send completion notification
echo "Migration completed successfully at $(date)" | \
  ssh root@165.22.52.100 'cat >> /root/migration-scripts/migration-completion.log'
```

---

## 6. Rollback Procedures

### 6.1 Rollback Triggers

Initiate rollback if:
- Data integrity checks fail
- Financial totals don't match (>1% discrepancy)
- Critical features broken (login, passport search, voucher generation)
- More than 10 critical errors in first 30 minutes

### 6.2 Rollback Steps (30 minutes)

```bash
# EMERGENCY ROLLBACK PROCEDURE

# 1. Stop new system
ssh root@165.22.52.100 'pm2 stop greenpay-api'

# 2. Restore database from pre-migration backup
ssh root@165.22.52.100 '
  gunzip /root/migration-backups/greenpay_db_pre_migration_20260102.sql.gz && \
  PGPASSWORD="GreenPay2025!Secure#PG" dropdb -h localhost -U greenpay_user greenpay_db && \
  PGPASSWORD="GreenPay2025!Secure#PG" createdb -h localhost -U greenpay_user greenpay_db && \
  PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay_user greenpay_db < /root/migration-backups/greenpay_db_pre_migration_20260102.sql
'

# 3. Restore .env file
ssh root@165.22.52.100 'cp /var/www/greenpay/.env.backup_20260102 /var/www/greenpay/.env'

# 4. Restart with old configuration
ssh root@165.22.52.100 'pm2 restart greenpay-api'

# 5. Revert DNS (if already updated)
# - Point pnggreenfees.gov.pg back to 147.93.111.184
# - Notify users of temporary issue

# 6. Analyze failure
ssh root@165.22.52.100 'cat /root/migration-scripts/migration-*.log | grep -i error > /root/migration-failure-analysis.txt'
```

### 6.3 Point of No Return

After **24 hours** of production use on new system:
- Users may have created new data
- Payments may have been processed
- Rollback becomes data-lossy

**Recommendation:** Schedule migration for **Friday night** → 48-hour validation window before Monday business hours.

---

## 7. Post-Migration Validation

### 7.1 Automated Validation Queries

```sql
-- Run after migration to verify data integrity

-- ===========================
-- RECORD COUNT VERIFICATION
-- ===========================

-- Compare record counts
WITH source_counts AS (
  SELECT
    (SELECT COUNT(*) FROM old_prod.users) as old_users,
    (SELECT COUNT(*) FROM users_staging WHERE data_source = 'production') as staging_users,
    (SELECT COUNT(*) FROM users) as final_users,
    (SELECT COUNT(*) FROM old_prod.passports) as old_passports,
    (SELECT COUNT(*) FROM passports_staging WHERE data_source = 'production') as staging_passports,
    (SELECT COUNT(*) FROM passports) as final_passports,
    (SELECT COUNT(*) FROM old_prod.payments) as old_payments,
    (SELECT COUNT(*) FROM individual_purchases_staging WHERE data_source = 'production') as staging_purchases,
    (SELECT COUNT(*) FROM individual_purchases) as final_purchases
)
SELECT * FROM source_counts;

-- ===========================
-- DATA INTEGRITY CHECKS
-- ===========================

-- Check for orphaned vouchers (passport references)
SELECT
  'Orphaned Individual Purchases' as issue,
  COUNT(*) as count
FROM individual_purchases
WHERE passport_number NOT IN (SELECT passport_number FROM passports);

SELECT
  'Orphaned Corporate Vouchers' as issue,
  COUNT(*) as count
FROM corporate_vouchers
WHERE passport_number IS NOT NULL
  AND passport_number NOT IN (SELECT passport_number FROM passports);

-- Check for duplicate voucher codes
SELECT
  'Duplicate Voucher Codes' as issue,
  COUNT(*) as count
FROM (
  SELECT voucher_code FROM individual_purchases
  UNION ALL
  SELECT voucher_code FROM corporate_vouchers
) combined
GROUP BY voucher_code
HAVING COUNT(*) > 1;

-- ===========================
-- FINANCIAL VALIDATION
-- ===========================

-- Compare financial totals
WITH financial_check AS (
  SELECT
    'Old System Individual Payments' as source,
    SUM((voucher_value * total_vouchers)) as total_amount,
    COUNT(*) as transaction_count
  FROM old_prod.payments
  WHERE payment_mode != 'corporate' OR bulk_upload_id IS NULL

  UNION ALL

  SELECT
    'New System Individual Purchases' as source,
    SUM(amount) as total_amount,
    COUNT(*) as transaction_count
  FROM individual_purchases
  WHERE created_by IN (SELECT id FROM users_staging WHERE data_source = 'production')

  UNION ALL

  SELECT
    'Old System Corporate Batches' as source,
    SUM(collected_amount) as total_amount,
    COUNT(*) as transaction_count
  FROM old_prod.voucher_batches

  UNION ALL

  SELECT
    'New System Corporate Vouchers' as source,
    SUM(collected_amount) as total_amount,
    COUNT(*) as transaction_count
  FROM corporate_vouchers
  WHERE batch_id LIKE 'BATCH-%'
)
SELECT * FROM financial_check;

-- Calculate discrepancy
WITH totals AS (
  SELECT
    SUM(CASE WHEN source LIKE 'Old%' THEN total_amount ELSE 0 END) as old_total,
    SUM(CASE WHEN source LIKE 'New%' THEN total_amount ELSE 0 END) as new_total
  FROM (
    SELECT 'Old' as source, SUM((voucher_value * total_vouchers)) as total_amount
    FROM old_prod.payments
    UNION ALL
    SELECT 'New' as source, SUM(amount) as total_amount
    FROM individual_purchases
    UNION ALL
    SELECT 'Old' as source, SUM(collected_amount) as total_amount
    FROM old_prod.voucher_batches
    UNION ALL
    SELECT 'New' as source, SUM(collected_amount) as total_amount
    FROM corporate_vouchers
  ) combined
)
SELECT
  old_total,
  new_total,
  (new_total - old_total) as difference,
  ROUND(((new_total - old_total) / NULLIF(old_total, 0) * 100)::numeric, 2) as percent_difference
FROM totals;

-- ===========================
-- DATA SOURCE DISTRIBUTION
-- ===========================

SELECT
  'Users' as table_name,
  s.data_source,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM users u
JOIN users_staging s ON u.email = s.email
GROUP BY s.data_source
ORDER BY count DESC;

SELECT
  'Passports' as table_name,
  s.data_source,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM passports p
JOIN passports_staging s ON p.passport_number = s.passport_number
GROUP BY s.data_source
ORDER BY count DESC;

-- ===========================
-- SCHEMA VALIDATION
-- ===========================

-- Verify no legacy tables remain active
SELECT
  table_name,
  CASE
    WHEN table_name LIKE '_archived_%' THEN 'Archived (Good)'
    WHEN table_name LIKE '%_old_backup_%' THEN 'Backup (Good)'
    WHEN table_name ~ '^[A-Z]' THEN 'LEGACY ACTIVE (BAD)'
    ELSE 'Modern (Good)'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND (table_name ~ '^[A-Z]' OR table_name LIKE '_archived_%' OR table_name LIKE '%_old_backup_%')
ORDER BY status, table_name;

-- ===========================
-- MIGRATION REPORT
-- ===========================

SELECT
  '===== MIGRATION SUMMARY =====' as report_section
UNION ALL
SELECT 'Total Users Migrated: ' || COUNT(*)::TEXT FROM users
UNION ALL
SELECT 'Total Passports Migrated: ' || COUNT(*)::TEXT FROM passports
UNION ALL
SELECT 'Total Individual Purchases: ' || COUNT(*)::TEXT FROM individual_purchases
UNION ALL
SELECT 'Total Corporate Vouchers: ' || COUNT(*)::TEXT FROM corporate_vouchers
UNION ALL
SELECT 'Total Quotations: ' || COUNT(*)::TEXT FROM quotations
UNION ALL
SELECT 'Total Invoices: ' || COUNT(*)::TEXT FROM invoices
UNION ALL
SELECT '===== DATA SOURCES =====' as report_section
UNION ALL
SELECT 'Production Data Records: ' || COUNT(*)::TEXT
FROM (
  SELECT id FROM users_staging WHERE data_source = 'production'
  UNION ALL SELECT passport_number FROM passports_staging WHERE data_source = 'production'
  UNION ALL SELECT voucher_code FROM individual_purchases_staging WHERE data_source = 'production'
  UNION ALL SELECT voucher_code FROM corporate_vouchers_staging WHERE data_source = 'production'
) combined
UNION ALL
SELECT '===== LEGACY CLEANUP =====' as report_section
UNION ALL
SELECT 'Legacy Tables Archived: ' || COUNT(*)::TEXT
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '_archived_%';
```

### 7.2 Manual Testing Checklist

- [ ] Login as Flex_Admin user
- [ ] Login as Counter_Agent user
- [ ] Login as Finance_Manager user
- [ ] Login as IT_Support user
- [ ] Search for production passport (from old system)
- [ ] Search for test passport (from current system)
- [ ] View individual purchase voucher
- [ ] View corporate voucher
- [ ] Generate passport voucher PDF
- [ ] Generate quotation PDF
- [ ] Generate invoice PDF
- [ ] Send test email (voucher delivery)
- [ ] Scan QR code (validate voucher)
- [ ] Create new passport entry
- [ ] Create new individual purchase
- [ ] Register corporate voucher to passport
- [ ] Generate reports (revenue, passports, vouchers)
- [ ] Test BSP DOKU payment flow (if credentials available)

---

## 8. Post-Migration Cleanup (Week 1-2)

### 8.1 Week 1 Tasks

```bash
# Day 1-2: Monitor and Fix
- Monitor PM2 logs hourly
- Check database performance
- Address user-reported issues
- Update documentation with actual issues found

# Day 3-4: Optimize
- Review slow queries
- Add missing indexes if needed
- Optimize PDF generation
- Fine-tune email delivery

# Day 5-7: Archive
- Compress staging tables
- Export UUID mapping to permanent storage
- Document any data transformations made
```

### 8.2 Week 2 Tasks

```bash
# Archive old databases (but don't delete)
ssh root@165.22.52.100 '
  PGPASSWORD="GreenPay2025!Secure#PG" pg_dump -h localhost -U greenpay_user greenpay_db > /root/archives/greenpay_db_post_migration_week1.sql && \
  gzip /root/archives/greenpay_db_post_migration_week1.sql
'

# Drop staging tables (after 2 weeks of stable operation)
ssh root@165.22.52.100 'PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay_user greenpay_db -c "
  DROP TABLE IF EXISTS users_staging CASCADE;
  DROP TABLE IF EXISTS passports_staging CASCADE;
  DROP TABLE IF EXISTS individual_purchases_staging CASCADE;
  DROP TABLE IF EXISTS corporate_vouchers_staging CASCADE;
  DROP TABLE IF EXISTS quotations_staging CASCADE;
  DROP TABLE IF EXISTS invoices_staging CASCADE;
"'

# Remove backup tables (after 1 month of stable operation)
ssh root@165.22.52.100 'PGPASSWORD="GreenPay2025!Secure#PG" psql -h localhost -U greenpay_user greenpay_db -c "
  DROP TABLE IF EXISTS passports_old_backup_20260102;
  DROP TABLE IF EXISTS individual_purchases_old_backup_20260102;
  DROP TABLE IF EXISTS corporate_vouchers_old_backup_20260102;
  DROP TABLE IF EXISTS _archived_Passport_20260102;
  DROP TABLE IF EXISTS _archived_User_20260102;
  DROP TABLE IF EXISTS _archived_Invoice_20260102;
  DROP TABLE IF EXISTS _archived_Quotation_20260102;
"'
```

---

## 9. Risk Mitigation

### 9.1 High Risks

| Risk | Mitigation |
|------|------------|
| Data loss during migration | Full database backup before migration, automated validation queries |
| Voucher code collisions | Pre-validate all codes, use staging tables to detect conflicts |
| User UUID mapping failure | Deterministic UUID generation, export mapping to CSV |
| Financial data mismatch | Sum validation queries, transaction-by-transaction audit |
| DNS propagation delay | Update DNS 1 hour before migration, use low TTL (300s) |
| SSL certificate issues | Test certbot in staging, have manual backup plan |

### 9.2 Contingency Plans

**If old production database is unavailable:**
- Proceed with modern + legacy test data merge only
- Document missing production data
- Plan second migration when database becomes available

**If migration takes longer than 2 hours:**
- Communicate extended maintenance to users
- Continue migration (already past point of no return)
- Bring system online with known issues, fix in production

**If financial totals don't match:**
- Don't rollback immediately
- Compare line-by-line to find discrepancy source
- If difference < 1%, document and proceed
- If difference > 1%, investigate before going live

---

## 10. Success Criteria

### 10.1 Technical Success

- ✅ 100% of production passports migrated (old system → new system)
- ✅ 100% of production vouchers migrated with correct status
- ✅ Financial totals match within 0.1% (old system vs new system)
- ✅ All foreign key relationships valid (no orphaned records)
- ✅ No duplicate voucher codes across individual_purchases + corporate_vouchers
- ✅ All archived tables clearly marked with _archived_ or _old_backup_ prefix
- ✅ All new tables use modern lowercase/snake_case naming
- ✅ DNS resolves to new server (165.22.52.100)
- ✅ SSL certificate valid for pnggreenfees.gov.pg
- ✅ Email delivery working from noreply@pnggreenfees.gov.pg

### 10.2 Business Success

- ✅ All users can login with existing credentials
- ✅ All production passports searchable and visible
- ✅ All production vouchers valid and usable
- ✅ PDF generation working (passports, quotations, invoices)
- ✅ Email delivery working (voucher notifications)
- ✅ QR code scanning and validation working
- ✅ Reports showing accurate historical data
- ✅ New purchases can be created
- ✅ Corporate voucher registration working
- ✅ BSP DOKU payments working (if production credentials available)

### 10.3 User Acceptance

- ✅ Zero critical bugs reported in first 24 hours
- ✅ Less than 5 minor bugs reported in first week
- ✅ Users report faster performance than old system
- ✅ All user roles can complete their workflows
- ✅ No data loss incidents reported

---

## 11. Communication Plan

### 11.1 Pre-Migration (3 days before)

**Email to all users:**

```
Subject: System Upgrade - PNG Green Fees Migration to pnggreenfees.gov.pg

Dear PNG Green Fees System Users,

We are upgrading our system to improve performance, security, and reliability.

WHAT'S CHANGING:
- New domain: pnggreenfees.gov.pg (replacing greenpay.eywademo.cloud)
- Faster performance
- Enhanced security
- Modern architecture
- All your data will be preserved

WHEN:
- Date: [FRIDAY NIGHT]
- Time: 2:00 AM - 4:00 AM (estimated 2 hours)
- System will be unavailable during this time

WHAT YOU NEED TO DO:
- Update your bookmarks to https://pnggreenfees.gov.pg
- Your login credentials remain the same
- All your passports, vouchers, and reports will be available

If you have any questions, please contact support.

Thank you for your patience.

PNG Green Fees IT Team
```

### 11.2 During Migration

**Status page (maintenance.html):**

```html
<!DOCTYPE html>
<html>
<head>
  <title>System Maintenance - PNG Green Fees</title>
  <meta http-equiv="refresh" content="300">
  <style>
    body {
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 100px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: rgba(255,255,255,0.1);
      padding: 40px;
      border-radius: 10px;
      backdrop-filter: blur(10px);
    }
    h1 { font-size: 2.5em; margin-bottom: 20px; }
    p { font-size: 1.2em; line-height: 1.6; }
    .progress {
      width: 100%;
      height: 30px;
      background: rgba(255,255,255,0.2);
      border-radius: 15px;
      margin: 30px 0;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%);
      width: 75%; /* Update manually during migration */
      transition: width 0.3s ease;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 System Upgrade in Progress</h1>
    <p>We are migrating to our new domain:</p>
    <h2>pnggreenfees.gov.pg</h2>
    <div class="progress">
      <div class="progress-bar"></div>
    </div>
    <p><strong>Expected completion: 3:30 AM</strong></p>
    <p>All your data is being safely transferred.</p>
    <p>Thank you for your patience!</p>
    <p style="margin-top:40px; font-size:0.9em; opacity:0.8;">
      This page will automatically refresh.
    </p>
  </div>
</body>
</html>
```

### 11.3 Post-Migration

**Success email (within 1 hour of completion):**

```
Subject: ✅ System Upgrade Complete - Welcome to pnggreenfees.gov.pg

Dear PNG Green Fees System Users,

Great news! Our system upgrade is complete and successful.

NEW URL: https://pnggreenfees.gov.pg

WHAT'S NEW:
✅ Faster page loading (3x improvement)
✅ Enhanced security features
✅ Better mobile experience
✅ All your data successfully migrated

YOUR DATA:
✅ [X] passports migrated
✅ [X] vouchers available
✅ [X] quotations preserved
✅ [X] invoices retained

NEXT STEPS:
1. Update your bookmark to https://pnggreenfees.gov.pg
2. Login with your existing credentials
3. Verify your recent work is visible
4. Report any issues to support@pnggreenfees.gov.pg

Thank you for your patience during this upgrade.

PNG Green Fees IT Team
```

---

## 12. Monitoring & Support (First Week)

### 12.1 Real-Time Monitoring

```bash
# Set up continuous monitoring
watch -n 60 'ssh root@165.22.52.100 "pm2 list && free -h && df -h"'

# Monitor error logs
ssh root@165.22.52.100 'tail -f /var/www/greenpay/logs/error.log'

# Monitor database connections
watch -n 300 'ssh root@165.22.52.100 "PGPASSWORD=\"GreenPay2025!Secure#PG\" psql -h localhost -U greenpay_user greenpay_db -c \"SELECT COUNT(*) as active_connections, state FROM pg_stat_activity WHERE datname = '\''greenpay_db'\'' GROUP BY state;\""'

# Monitor disk usage
ssh root@165.22.52.100 'df -h | grep -E "(Filesystem|greenpay|root)"'
```

### 12.2 Support Hotline Setup

**Create dedicated support channel:**
- Email: migration-support@pnggreenfees.gov.pg
- Phone: [Support Number]
- Slack: #greenpay-migration-support (for internal team)

**Escalation path:**
1. Level 1: Review logs, check documentation
2. Level 2: Database query to investigate specific issue
3. Level 3: Rollback consideration if critical

---

## 13. Dependencies & Prerequisites

### 13.1 Before Migration Night

**Must Have:**
- [ ] Full backup of old production database (147.93.111.184)
- [ ] Full backup of current GreenPay database (165.22.52.100)
- [ ] Migration scripts tested on staging copy
- [ ] .env file prepared with production values
- [ ] DNS provider access confirmed
- [ ] SSL certificate provider access confirmed
- [ ] All team members notified of migration schedule
- [ ] User communication sent (3 days before)

**Nice to Have:**
- [ ] BSP production credentials (can enable later)
- [ ] SendGrid account setup (can use Gmail temporarily)
- [ ] Load testing completed
- [ ] User acceptance testing on staging

### 13.2 Team Assignments

**Migration Night Roles:**
- **Database Lead:** Execute migration scripts, validate data
- **Backend Lead:** Update configuration, restart services
- **DevOps Lead:** DNS, SSL, monitoring
- **Testing Lead:** Run validation tests, verify functionality
- **Communication Lead:** Update status page, send notifications
- **Backup/Rollback Lead:** Monitor for triggers, ready to rollback

---

## 14. Lessons Learned Template

**Complete within 1 week of migration:**

```markdown
# Migration Lessons Learned - [DATE]

## What Went Well
-
-

## What Could Be Improved
-
-

## Unexpected Issues
-
-

## Time Estimates (Planned vs Actual)
| Task | Planned | Actual | Variance |
|------|---------|--------|----------|
|      |         |        |          |

## Recommendations for Future Migrations
-
-

## Data Statistics
- Total records migrated:
- Migration duration:
- Downtime duration:
- Rollback triggered: Yes/No
- Critical bugs found:
- User satisfaction score:
```

---

## 15. Document Version Control

**Version:** 1.0
**Created:** 2026-01-02
**Author:** Migration Planning Team
**Status:** READY FOR EXECUTION

**Change Log:**
- v1.0 (2026-01-02): Initial master plan combining domain switch + data migration + schema transformation

---

## 16. Approval Signatures

**Technical Lead:** _________________ Date: _______

**Database Administrator:** _________________ Date: _______

**Project Manager:** _________________ Date: _______

**Executive Sponsor:** _________________ Date: _______

---

**Next Steps:**
1. ✅ Review and approve migration plan
2. ⏳ Schedule migration window (recommend: Friday 2 AM)
3. ⏳ Assign team members to roles
4. ⏳ Test migration scripts on staging copy
5. ⏳ Send user notification (3 days before)
6. ⏳ Execute migration on scheduled date

**Estimated Total Time:** 2-3 hours (migration) + 1 week (monitoring)
**Risk Level:** Medium-High (comprehensive testing reduces risk)
**Confidence Level:** High (85% - all scripts prepared, tested approach)

---

**CRITICAL REMINDER:** This migration combines three major changes. Test thoroughly on staging before production execution.
