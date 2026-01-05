# Production Migration with Data Transformation
## From Old System + Legacy Schema → New System + Modern Schema

**Date:** 2026-01-01  
**Source:** Old system on pnggreenfees.gov.pg (unknown schema)  
**Current:** GreenPay on greenpay.eywademo.cloud (dual legacy+modern schema)  
**Target:** GreenPay on pnggreenfees.gov.pg (clean modern schema)  

---

## Executive Summary

**Challenge:** 
- Migrate existing system from pnggreenfees.gov.pg to new GreenPay
- Transform old database schema to modern schema
- Merge with current test data on greenpay.eywademo.cloud
- Minimize downtime (night hours acceptable)

**Strategy:** Three-phase migration with data transformation
**Estimated Downtime:** 30-60 minutes (2-3 AM)
**Risk Level:** Medium (data transformation + domain switch)

---

## Phase 1: Pre-Migration Analysis (Week 1)

### Step 1: Analyze Old System Database (Day 1-2)

**Connect to old production database:**
```bash
# Get database credentials from old system
# Check database type (PostgreSQL/MySQL)
# Export schema

# If PostgreSQL:
pg_dump -h <old_server> -U <user> -d <old_db> --schema-only > OLD_SYSTEM_SCHEMA.sql

# If MySQL:
mysqldump -h <old_server> -u <user> -p <old_db> --no-data > OLD_SYSTEM_SCHEMA.sql
```

**Analyze old schema:**
```sql
-- Check what tables exist
\dt  -- PostgreSQL
SHOW TABLES;  -- MySQL

-- Check passport table structure
DESCRIBE passports;  -- or SELECT * FROM passports LIMIT 1;

-- Check voucher/purchase tables
DESCRIBE individual_purchases;
DESCRIBE corporate_vouchers;

-- Count existing data
SELECT 'passports' as table_name, COUNT(*) FROM passports
UNION ALL
SELECT 'vouchers', COUNT(*) FROM vouchers
UNION ALL  
SELECT 'users', COUNT(*) FROM users;
```

**Document findings:**
```markdown
Old System Database:
- Database Type: PostgreSQL/MySQL
- Passport Table: passports/Passport/"Passport"
- Voucher Tables: vouchers/individual_purchases/corporate_vouchers
- User Table: users/User/"User"
- Total Records:
  - X passports
  - Y vouchers  
  - Z users
```

### Step 2: Analyze Current GreenPay Database (Day 2)

**Check dual schema status:**
```sql
-- On greenpay.eywademo.cloud database
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay_user -d greenpay_db

-- Count data in legacy tables
SELECT 'Legacy Passport' as source, COUNT(*) FROM "Passport"
UNION ALL
SELECT 'Modern passports', COUNT(*) FROM passports
UNION ALL
SELECT 'Legacy User', COUNT(*) FROM "User"
UNION ALL
SELECT 'Modern profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'individual_purchases', COUNT(*) FROM individual_purchases
UNION ALL
SELECT 'corporate_vouchers', COUNT(*) FROM corporate_vouchers;
```

**Expected output** (from DATABASE_STRATEGY_RECOMMENDATION.md):
```
Legacy Passport: 153 (test data)
Modern passports: 5
individual_purchases: 56 (test data)
corporate_vouchers: 342 (test data)
Legacy User: 6 (test accounts)
Modern profiles: 0
```

### Step 3: Create Data Mapping Strategy (Day 3)

**Schema Transformation Map:**

| Old System | Current Legacy | Target Modern | Transformation Required |
|-----------|---------------|---------------|------------------------|
| passports | "Passport" (153) | passports | Merge + transform to snake_case |
| users | "User" (6) | profiles (linked to Supabase) | Transform + create Supabase auth |
| vouchers | individual_purchases (56) | individual_purchases | Merge if compatible |
| corp_vouchers | corporate_vouchers (342) | corporate_vouchers | Merge if compatible |
| invoices | "Invoice"/invoices | invoices | Merge |
| quotations | "Quotation"/quotations | quotations | Merge |

**Data Merge Strategy:**
```sql
-- Example: Merging passports
-- Priority: Production data > Test data
-- Conflict resolution: Keep production, discard test if duplicate passport_number

INSERT INTO passports_temp (
  passport_number, full_name, nationality, date_of_birth, ...
)
-- 1. Get production data from old system
SELECT ... FROM old_production.passports
UNION
-- 2. Get legacy test data (if not duplicate)
SELECT ... FROM "Passport" 
WHERE "passportNo" NOT IN (SELECT passport_number FROM old_production.passports)
UNION
-- 3. Get modern test data (if not duplicate)
SELECT ... FROM passports
WHERE passport_number NOT IN (SELECT passport_number FROM old_production.passports);
```

---

## Phase 2: Data Transformation Scripts (Week 1-2)

### Script 1: Clean Modern Schema Setup

**Goal:** Create clean modern schema, drop legacy tables

**File:** `migration/01_create_modern_schema.sql`

```sql
BEGIN;

-- ================================================
-- PART 1: CREATE TEMPORARY STAGING TABLES
-- ================================================

-- Staging table for merged passports
CREATE TABLE IF NOT EXISTS passports_staging (
  passport_number VARCHAR(20) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  nationality VARCHAR(100),
  date_of_birth DATE,
  sex VARCHAR(10),
  issue_date DATE,
  expiry_date DATE,
  passport_type VARCHAR(50),
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_source VARCHAR(50)  -- 'production', 'legacy_test', 'modern_test'
);

-- Staging table for merged individual purchases
CREATE TABLE IF NOT EXISTS individual_purchases_staging (
  id SERIAL PRIMARY KEY,
  voucher_code VARCHAR(50) UNIQUE NOT NULL,
  passport_number VARCHAR(20),
  full_name VARCHAR(255),
  nationality VARCHAR(100),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(100),
  card_last_four VARCHAR(4),
  discount DECIMAL(10,2) DEFAULT 0,
  collected_amount DECIMAL(10,2),
  returned_amount DECIMAL(10,2),
  used_at TIMESTAMP,
  valid_from DATE,
  valid_until DATE,
  status VARCHAR(50) DEFAULT 'active',
  purchase_session_id VARCHAR(100),
  payment_gateway_ref VARCHAR(255),
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_source VARCHAR(50)
);

-- Staging table for corporate vouchers
CREATE TABLE IF NOT EXISTS corporate_vouchers_staging (
  id SERIAL PRIMARY KEY,
  batch_id VARCHAR(100),
  voucher_code VARCHAR(50) UNIQUE NOT NULL,
  company_name VARCHAR(255),
  employee_name VARCHAR(255),
  employee_id VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  issued_date DATE,
  redeemed_date DATE,
  valid_from DATE,
  valid_until DATE,
  invoice_id INTEGER,
  is_green_pass BOOLEAN DEFAULT FALSE,
  registered_at TIMESTAMP,
  passport_number VARCHAR(20),
  registered_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_source VARCHAR(50)
);

COMMIT;
```

### Script 2: Legacy Data Migration

**File:** `migration/02_migrate_legacy_to_staging.sql`

```sql
BEGIN;

-- ================================================
-- MIGRATE LEGACY PASSPORTS TO STAGING
-- ================================================

INSERT INTO passports_staging (
  passport_number,
  full_name,
  nationality,
  date_of_birth,
  sex,
  issue_date,
  expiry_date,
  passport_type,
  created_by,
  created_at,
  updated_at,
  data_source
)
SELECT
  "passportNo",
  CONCAT("givenName", ' ', surname),
  nationality,
  CASE WHEN dob IS NOT NULL THEN dob::date ELSE NULL END,
  sex,
  CASE WHEN "dateOfIssue" IS NOT NULL THEN "dateOfIssue"::date ELSE NULL END,
  CASE WHEN "dateOfExpiry" IS NOT NULL THEN "dateOfExpiry"::date ELSE NULL END,
  type,
  "createdById",
  "createdAt",
  "updatedAt",
  'legacy_test'
FROM "Passport"
WHERE "passportNo" IS NOT NULL
ON CONFLICT (passport_number) DO NOTHING;

-- ================================================
-- MIGRATE MODERN PASSPORTS TO STAGING (if any)
-- ================================================

INSERT INTO passports_staging (
  passport_number,
  full_name,
  nationality,
  date_of_birth,
  sex,
  issue_date,
  expiry_date,
  passport_type,
  created_by,
  created_at,
  updated_at,
  data_source
)
SELECT
  passport_number,
  full_name,
  nationality,
  date_of_birth,
  sex,
  issue_date,
  expiry_date,
  passport_type,
  created_by,
  created_at,
  updated_at,
  'modern_test'
FROM passports
WHERE passport_number IS NOT NULL
ON CONFLICT (passport_number) DO NOTHING;

-- Verify counts
SELECT data_source, COUNT(*) FROM passports_staging GROUP BY data_source;

COMMIT;
```

### Script 3: Production Data Import

**File:** `migration/03_import_production_data.sql`

**NOTE:** This script will be customized after analyzing old system schema

```sql
BEGIN;

-- ================================================
-- IMPORT PRODUCTION PASSPORTS (highest priority)
-- ================================================

-- OPTION A: If old system has PostgreSQL (same server)
INSERT INTO passports_staging (
  passport_number,
  full_name,
  nationality,
  date_of_birth,
  sex,
  created_at,
  data_source
)
SELECT
  passport_number,  -- Adjust column names based on old schema
  full_name,
  nationality,
  date_of_birth,
  sex,
  created_at,
  'production'
FROM old_production_db.passports  -- Replace with actual schema
WHERE passport_number IS NOT NULL
ON CONFLICT (passport_number) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  nationality = EXCLUDED.nationality,
  date_of_birth = EXCLUDED.date_of_birth,
  data_source = 'production',  -- Override test data
  updated_at = CURRENT_TIMESTAMP;

-- OPTION B: If old system dump file
-- Use pg_restore or \copy command
\copy passports_staging (passport_number, full_name, nationality, ...) FROM '/tmp/old_production_passports.csv' WITH CSV HEADER;

-- Update data_source for imported records
UPDATE passports_staging SET data_source = 'production' WHERE data_source IS NULL;

-- ================================================
-- IMPORT PRODUCTION VOUCHERS
-- ================================================

-- Similar approach for individual_purchases, corporate_vouchers, etc.

COMMIT;
```

### Script 4: Final Migration to Modern Tables

**File:** `migration/04_finalize_modern_schema.sql`

```sql
BEGIN;

-- ================================================
-- BACKUP EXISTING TABLES
-- ================================================

ALTER TABLE passports RENAME TO passports_old_backup;
ALTER TABLE "Passport" RENAME TO "_archived_Passport_20260101";
ALTER TABLE individual_purchases RENAME TO individual_purchases_old_backup;
ALTER TABLE corporate_vouchers RENAME TO corporate_vouchers_old_backup;

-- ================================================
-- CREATE CLEAN MODERN TABLES
-- ================================================

CREATE TABLE passports (
  id SERIAL PRIMARY KEY,
  passport_number VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  nationality VARCHAR(100),
  date_of_birth DATE,
  sex VARCHAR(10),
  issue_date DATE,
  expiry_date DATE,
  passport_type VARCHAR(50),
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_passports_number ON passports(passport_number);
CREATE INDEX idx_passports_name ON passports(full_name);

CREATE TABLE individual_purchases (
  id SERIAL PRIMARY KEY,
  voucher_code VARCHAR(50) UNIQUE NOT NULL,
  passport_number VARCHAR(20),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(100),
  card_last_four VARCHAR(4),
  discount DECIMAL(10,2) DEFAULT 0,
  collected_amount DECIMAL(10,2),
  returned_amount DECIMAL(10,2),
  used_at TIMESTAMP,
  valid_from DATE,
  valid_until DATE,
  status VARCHAR(50) DEFAULT 'active',
  purchase_session_id VARCHAR(100),
  payment_gateway_ref VARCHAR(255),
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (passport_number) REFERENCES passports(passport_number)
);

CREATE INDEX idx_individual_voucher_code ON individual_purchases(voucher_code);
CREATE INDEX idx_individual_passport ON individual_purchases(passport_number);

CREATE TABLE corporate_vouchers (
  id SERIAL PRIMARY KEY,
  batch_id VARCHAR(100),
  voucher_code VARCHAR(50) UNIQUE NOT NULL,
  company_name VARCHAR(255),
  employee_name VARCHAR(255),
  employee_id VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  issued_date DATE,
  redeemed_date DATE,
  valid_from DATE,
  valid_until DATE,
  invoice_id INTEGER,
  is_green_pass BOOLEAN DEFAULT FALSE,
  registered_at TIMESTAMP,
  passport_number VARCHAR(20),
  registered_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (passport_number) REFERENCES passports(passport_number)
);

CREATE INDEX idx_corporate_voucher_code ON corporate_vouchers(voucher_code);
CREATE INDEX idx_corporate_batch ON corporate_vouchers(batch_id);
CREATE INDEX idx_corporate_passport ON corporate_vouchers(passport_number);

-- ================================================
-- MIGRATE DATA FROM STAGING TO FINAL TABLES
-- ================================================

-- Copy passports (production data priority)
INSERT INTO passports (
  passport_number, full_name, nationality, date_of_birth, sex,
  issue_date, expiry_date, passport_type, created_by, created_at, updated_at
)
SELECT
  passport_number, full_name, nationality, date_of_birth, sex,
  issue_date, expiry_date, passport_type, created_by, created_at, updated_at
FROM passports_staging
ORDER BY 
  CASE data_source 
    WHEN 'production' THEN 1 
    WHEN 'modern_test' THEN 2 
    WHEN 'legacy_test' THEN 3 
  END,
  created_at DESC
ON CONFLICT (passport_number) DO NOTHING;

-- Copy individual purchases
INSERT INTO individual_purchases (
  voucher_code, passport_number, customer_name, customer_email, customer_phone,
  amount, payment_method, card_last_four, discount, collected_amount, returned_amount,
  used_at, valid_from, valid_until, status, purchase_session_id, payment_gateway_ref,
  created_by, created_at, updated_at
)
SELECT
  voucher_code, passport_number, customer_name, customer_email, customer_phone,
  amount, payment_method, card_last_four, discount, collected_amount, returned_amount,
  used_at, valid_from, valid_until, status, purchase_session_id, payment_gateway_ref,
  created_by, created_at, updated_at
FROM individual_purchases_staging
ON CONFLICT (voucher_code) DO NOTHING;

-- Copy corporate vouchers
INSERT INTO corporate_vouchers (
  batch_id, voucher_code, company_name, employee_name, employee_id,
  amount, status, issued_date, redeemed_date, valid_from, valid_until,
  invoice_id, is_green_pass, registered_at, passport_number, registered_by, created_at
)
SELECT
  batch_id, voucher_code, company_name, employee_name, employee_id,
  amount, status, issued_date, redeemed_date, valid_from, valid_until,
  invoice_id, is_green_pass, registered_at, passport_number, registered_by, created_at
FROM corporate_vouchers_staging
ON CONFLICT (voucher_code) DO NOTHING;

-- ================================================
-- VERIFY MIGRATION
-- ================================================

SELECT 'passports' as table_name, COUNT(*) as final_count FROM passports
UNION ALL
SELECT 'individual_purchases', COUNT(*) FROM individual_purchases
UNION ALL
SELECT 'corporate_vouchers', COUNT(*) FROM corporate_vouchers;

-- Should show combined counts from all sources

COMMIT;
```

---

## Phase 3: Migration Night Execution (Week 2-3)

### Pre-Migration Checklist (Day Before)

- [ ] Old system database dump created and tested
- [ ] Migration scripts tested on staging environment
- [ ] Backup of current GreenPay database created
- [ ] DNS ready to switch (pnggreenfees.gov.pg A record)
- [ ] SSL certificate ready for pnggreenfees.gov.pg
- [ ] BSP notified of migration (if using production credentials)
- [ ] SendGrid SMTP configured and tested
- [ ] Maintenance page ready
- [ ] Rollback scripts prepared
- [ ] Team on standby (2-3 people)

### Migration Timeline (2:00 AM - 4:00 AM)

**2:00 AM - Display Maintenance Page**
```bash
# On old server - put up maintenance page
# See PRODUCTION_DOMAIN_MIGRATION_PLAN.md for maintenance page HTML
```

**2:05 AM - Export Old Production Data**
```bash
# On old server
pg_dump -h localhost -U old_user -d old_db > /tmp/old_production_full_$(date +%Y%m%d).sql
pg_dump -h localhost -U old_user -d old_db --data-only -t passports -t vouchers > /tmp/old_production_data.sql

# Copy to new server
scp /tmp/old_production_data.sql root@165.22.52.100:/tmp/
```

**2:15 AM - Backup Current GreenPay Database**
```bash
# On new server (165.22.52.100)
PGPASSWORD='GreenPay2025!Secure#PG' pg_dump -h localhost -U greenpay_user -d greenpay_db > /tmp/greenpay_pre_migration_$(date +%Y%m%d_%H%M).sql
gzip /tmp/greenpay_pre_migration_*.sql
```

**2:20 AM - Run Migration Scripts**
```bash
# On new server
cd /tmp

# Script 1: Create staging tables
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db < migration/01_create_modern_schema.sql

# Script 2: Migrate legacy test data
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db < migration/02_migrate_legacy_to_staging.sql

# Script 3: Import production data
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db < migration/03_import_production_data.sql

# Script 4: Finalize modern schema
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db < migration/04_finalize_modern_schema.sql
```

**2:40 AM - Verify Data Migration**
```bash
# Check record counts
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db <<SQL
SELECT 'passports' as table, COUNT(*) FROM passports
UNION ALL
SELECT 'individual_purchases', COUNT(*) FROM individual_purchases  
UNION ALL
SELECT 'corporate_vouchers', COUNT(*) FROM corporate_vouchers;
SQL

# Spot check data quality
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db <<SQL
-- Check for nulls in critical fields
SELECT COUNT(*) as passports_with_no_number FROM passports WHERE passport_number IS NULL;
SELECT COUNT(*) as vouchers_with_no_code FROM individual_purchases WHERE voucher_code IS NULL;

-- Check date ranges
SELECT MIN(created_at), MAX(created_at) FROM passports;
SELECT MIN(created_at), MAX(created_at) FROM individual_purchases;
SQL
```

**2:50 AM - Update Backend Configuration**
```bash
# Activate production domain configuration
cd /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend
cp .env .env.staging_backup
cp .env.production .env

# Update for production domain
sed -i 's|greenpay.eywademo.cloud|pnggreenfees.gov.pg|g' .env

# Restart backend
pm2 restart greenpay-api

# Verify
pm2 logs greenpay-api --lines 50
```

**3:00 AM - Update DNS**
```bash
# Update A record for pnggreenfees.gov.pg
# Point to: 165.22.52.100
# TTL: 300 (5 minutes)
```

**3:05 AM - Monitor DNS Propagation**
```bash
# Check DNS
dig pnggreenfees.gov.pg
nslookup pnggreenfees.gov.pg

# Wait 5-10 minutes for propagation
```

**3:15 AM - Test Production System**
```bash
# Test API
curl -I https://pnggreenfees.gov.pg/api/health

# Test in browser
# - Login
# - View passports
# - View vouchers
# - Check all major features
```

**3:30 AM - Remove Maintenance Page**
```bash
# Old server no longer receiving traffic (DNS switched)
# New system live on pnggreenfees.gov.pg
```

**3:35 AM - Monitor for Issues**
```bash
# Watch logs
pm2 logs greenpay-api

# Check database connections
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -c "\conninfo"

# Monitor server resources
htop
```

**4:00 AM - Migration Complete (if no issues)**

---

## Rollback Procedures

### If Migration Fails Before DNS Switch

**Easy Rollback:**
```bash
# Restore backup
PGPASSWORD='GreenPay2025!Secure#PG' dropdb -h localhost -U greenpay_user -d greenpay_db
PGPASSWORD='GreenPay2025!Secure#PG' createdb -h localhost -U greenpay_user -d greenpay_db
gunzip -c /tmp/greenpay_pre_migration_*.sql.gz | PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db

# Restart backend
pm2 restart greenpay-api

# Old system still live on pnggreenfees.gov.pg
# New system still accessible on greenpay.eywademo.cloud
```

### If Issues After DNS Switch

**Quick Revert:**
```bash
# Option 1: Revert DNS to old server
# Change A record back to old IP
# Wait 5-10 minutes

# Option 2: Restore database on new server
# (Same as above)
# Keep DNS pointing to new server but with old data
```

---

## Post-Migration Tasks (Next Day)

### Verify Migration Success

**Data Integrity Checks:**
```sql
-- Check passport counts match source
SELECT COUNT(*) FROM passports;
-- Compare with: old system count + legacy test (153) + modern test (5)

-- Check voucher counts
SELECT COUNT(*) FROM individual_purchases;
-- Compare with: old system + current (56)

SELECT COUNT(*) FROM corporate_vouchers;  
-- Compare with: old system + current (342)

-- Check for data quality issues
SELECT COUNT(*) FROM passports WHERE full_name IS NULL;
SELECT COUNT(*) FROM individual_purchases WHERE amount <= 0;
SELECT COUNT(*) FROM corporate_vouchers WHERE voucher_code IS NULL;
```

### Clean Up Old Tables

**After 1 Week of Stable Operation:**
```sql
-- Drop backup tables
DROP TABLE IF EXISTS passports_old_backup CASCADE;
DROP TABLE IF EXISTS individual_purchases_old_backup CASCADE;
DROP TABLE IF EXISTS corporate_vouchers_old_backup CASCADE;
DROP TABLE IF EXISTS "_archived_Passport_20260101" CASCADE;

-- Drop staging tables
DROP TABLE IF EXISTS passports_staging CASCADE;
DROP TABLE IF EXISTS individual_purchases_staging CASCADE;
DROP TABLE IF EXISTS corporate_vouchers_staging CASCADE;

-- Drop other legacy tables
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Role" CASCADE;
DROP TABLE IF EXISTS "Invoice" CASCADE;
DROP TABLE IF EXISTS "Quotation" CASCADE;
```

### Update Documentation

- [ ] Update DATABASE_SCHEMA.md with final schema
- [ ] Document migration lessons learned
- [ ] Update backend route documentation
- [ ] Create data dictionary for new schema

---

## Expected Outcomes

### Before Migration

**Old System (pnggreenfees.gov.pg):**
- Production data: X passports, Y vouchers
- Old schema structure
- Running old application

**Current GreenPay (greenpay.eywademo.cloud):**
- Test data: 153 passports (legacy), 5 passports (modern)
- Test data: 56 individual purchases, 342 corporate vouchers
- Dual schema (legacy + modern)

### After Migration

**New System (pnggreenfees.gov.pg):**
- **All production data** + merged test data
- **Clean modern schema** (snake_case, lowercase)
- **No legacy tables** (only modern tables)
- Backend queries optimized for modern schema
- BSP DOKU production credentials active
- SendGrid SMTP configured

**Final Counts Expected:**
```
passports: [old production count] + 153 + 5 = [total]
individual_purchases: [old production count] + 56 = [total]
corporate_vouchers: [old production count] + 342 = [total]
```

---

## Timeline Summary

**Week 1:** Analysis and script preparation
- Day 1-2: Analyze old system database
- Day 3-4: Create migration scripts
- Day 5: Test on staging/local environment

**Week 2:** Pre-migration preparation
- Day 1-2: Final script testing
- Day 3: DNS/SSL/SMTP setup
- Day 4: Team briefing and rehearsal
- Day 5: Final backup and preparation

**Week 3:** Migration execution
- Night of migration (2-4 AM): Execute migration
- Day 1-2: Intensive monitoring
- Day 3-7: Normal monitoring and issue resolution

**Week 4:** Post-migration cleanup
- Remove backup tables
- Update documentation
- Decommission old server (if separate)

---

## Risk Mitigation

### High Risk Items

**1. Data Loss During Migration**
- **Mitigation:** Multiple backups before migration
- **Verification:** Compare record counts before/after
- **Rollback:** Restore from backup within 10 minutes

**2. Schema Transformation Errors**
- **Mitigation:** Test scripts on copy of production data
- **Verification:** Data quality checks after each script
- **Rollback:** Restore backup, fix scripts, retry

**3. Extended Downtime**
- **Mitigation:** Rehearse migration in staging
- **Monitoring:** Real-time progress tracking
- **Fallback:** DNS revert to old system if > 2 hours

### Medium Risk Items

**4. Backend Route Compatibility**
- **Mitigation:** Update routes to use modern schema before migration
- **Testing:** Comprehensive endpoint testing after migration
- **Fix:** Code patches if needed (no database rollback required)

**5. BSP Production Integration**
- **Mitigation:** Test BSP with production credentials on staging first
- **Coordination:** Have BSP support on standby
- **Fallback:** Temporarily use staging credentials if issues

---

## Success Criteria

✅ All production data migrated successfully
✅ No data loss (verified record counts)
✅ Clean modern schema (no legacy tables)
✅ All backend routes working
✅ BSP payments processing
✅ Emails sending via SendGrid
✅ Database backups continuing
✅ Downtime < 60 minutes
✅ No critical errors in first 24 hours

---

**Document Created:** 2026-01-01  
**Status:** READY FOR OLD SYSTEM ANALYSIS  
**Next Step:** Analyze old system database schema  
**Estimated Total Time:** 3-4 weeks  
**Migration Night Duration:** 2 hours (2-4 AM)  
