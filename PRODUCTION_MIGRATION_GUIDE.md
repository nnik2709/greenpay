# Production Migration Guide - PNG Green Fees System

## Overview
This guide provides step-by-step instructions for migrating the PNG Green Fees System database to production with the latest schema changes.

**Migration Date:** 2025-01-20
**Version:** v2.0 (Discount & Email Features)

---

## ⚠️ Pre-Migration Checklist

### 1. Backup Current Production Database
```bash
# From Supabase Dashboard:
# 1. Go to Database → Backups
# 2. Create manual backup with description: "Pre-migration backup - 2025-01-20"
# 3. Download backup file for local storage
# 4. Verify backup file integrity
```

### 2. Environment Verification
- [ ] Confirm you have admin access to Supabase project
- [ ] Verify current database schema version
- [ ] Check for any pending transactions or locks
- [ ] Ensure adequate database storage space
- [ ] Notify users of scheduled maintenance window

### 3. Review Dependencies
- [ ] Check if any users are currently logged in
- [ ] Verify no long-running queries are active
- [ ] Review application connection pool status

---

## 📋 Migration Order

The migrations must be applied in this exact order:

### Existing Migrations (Should Already Be Applied)
1. `000_extensions.sql` - PostgreSQL extensions
2. `006_cash_reconciliation.sql` - Cash reconciliation tables
3. `007_sms_settings.sql` - SMS configuration
4. `008_audit_logs.sql` - Audit logging
5. `009_login_events.sql` - Login tracking
6. `010_ticket_responses.sql` - Support tickets
7. `011_invoices.sql` - Invoice management
8. `012_report_views.sql` - Reporting views
9. `013_passport_file_storage.sql` - File storage
10. `014_quotation_workflow.sql` - Quotation workflow
11. `015_discount_tracking.sql` - Discount tracking
12. `016_email_templates_data.sql` - Email templates
13. `017_update_login_events.sql` - Login events update
14. `018_create_rpc_functions.sql` - RPC functions
15. `019_kina_bank_payment_gateway.sql` - Payment gateway
16. `20250111000000_create_email_logs.sql` - Email logging

### New Migrations (To Be Applied)
17. **`020_add_discount_and_returned_amount.sql`** - NEW
    - Adds discount tracking to purchases and vouchers
    - Adds collected_amount and returned_amount fields
    - Critical for revenue reporting accuracy

18. **`021_add_discount_to_quotations.sql`** - NEW
    - Adds discount fields to quotations table
    - Required for quotation creation to work properly

---

## 🚀 Migration Execution Steps

### Step 1: Enter Maintenance Mode
1. Put application in maintenance mode (if possible)
2. Post notice to users about downtime
3. Wait for active sessions to complete

### Step 2: Verify Current State
```sql
-- Check which migrations have been applied
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 10;

-- Check table structures
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Step 3: Apply Migration 020 - Discount & Returned Amount
```sql
-- File: 020_add_discount_and_returned_amount.sql
-- Purpose: Add discount and change tracking to purchases

-- Execute in Supabase SQL Editor:
-- Copy contents of supabase/migrations/020_add_discount_and_returned_amount.sql
-- Verify no errors in output

-- Verification query:
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('individual_purchases', 'corporate_vouchers')
  AND column_name IN ('discount', 'collected_amount', 'returned_amount')
ORDER BY table_name, column_name;

-- Expected: 6 rows (3 columns × 2 tables)
```

### Step 4: Apply Migration 021 - Quotation Discounts
```sql
-- File: 021_add_discount_to_quotations.sql
-- Purpose: Add discount tracking to quotations

-- Execute in Supabase SQL Editor:
-- Copy contents of supabase/migrations/021_add_discount_to_quotations.sql
-- Verify no errors in output

-- Verification query:
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'quotations'
  AND column_name IN ('discount', 'discount_amount', 'amount_after_discount', 'price_per_passport')
ORDER BY column_name;

-- Expected: 4 rows
```

### Step 5: Verify Data Integrity
```sql
-- Check for null values in new columns
SELECT
  COUNT(*) as total_purchases,
  COUNT(*) FILTER (WHERE discount IS NULL) as null_discount,
  COUNT(*) FILTER (WHERE returned_amount IS NULL) as null_returned
FROM individual_purchases;

SELECT
  COUNT(*) as total_vouchers,
  COUNT(*) FILTER (WHERE discount IS NULL) as null_discount,
  COUNT(*) FILTER (WHERE returned_amount IS NULL) as null_returned
FROM corporate_vouchers;

SELECT
  COUNT(*) as total_quotations,
  COUNT(*) FILTER (WHERE discount IS NULL) as null_discount,
  COUNT(*) FILTER (WHERE amount_after_discount IS NULL) as null_amount_after_discount
FROM quotations;

-- All null counts should be 0
```

### Step 6: Test Core Functionality
```sql
-- Test insert with new fields (individual purchase)
INSERT INTO individual_purchases (
  voucher_code, passport_number, amount, payment_method,
  discount, collected_amount, returned_amount,
  valid_until, created_by
) VALUES (
  'TEST-' || gen_random_uuid()::text,
  'TEST123456',
  100.00,
  'cash',
  10.00,
  110.00,
  10.00,
  NOW() + INTERVAL '30 days',
  (SELECT id FROM profiles LIMIT 1)
) RETURNING *;

-- Delete test record
DELETE FROM individual_purchases WHERE passport_number = 'TEST123456';

-- Test quotation creation with discount
INSERT INTO quotations (
  quotation_number, company_name, contact_person, contact_email,
  number_of_passports, amount_per_passport, total_amount,
  discount, discount_amount, amount_after_discount,
  valid_until, created_by
) VALUES (
  'TEST-' || gen_random_uuid()::text,
  'Test Company',
  'Test Person',
  'test@example.com',
  10,
  50.00,
  500.00,
  10.00,
  50.00,
  450.00,
  CURRENT_DATE + INTERVAL '30 days',
  (SELECT id FROM profiles LIMIT 1)
) RETURNING *;

-- Delete test record
DELETE FROM quotations WHERE company_name = 'Test Company';
```

---

## 🔄 Rollback Procedures

### If Migration 021 Fails (Quotations)
```sql
-- Rollback 021_add_discount_to_quotations.sql
ALTER TABLE public.quotations DROP COLUMN IF EXISTS discount;
ALTER TABLE public.quotations DROP COLUMN IF EXISTS discount_amount;
ALTER TABLE public.quotations DROP COLUMN IF EXISTS amount_after_discount;
ALTER TABLE public.quotations DROP COLUMN IF EXISTS price_per_passport;

DROP INDEX IF EXISTS idx_quotations_discount;
```

### If Migration 020 Fails (Purchases/Vouchers)
```sql
-- Rollback 020_add_discount_and_returned_amount.sql
ALTER TABLE public.individual_purchases DROP COLUMN IF EXISTS discount;
ALTER TABLE public.individual_purchases DROP COLUMN IF EXISTS collected_amount;
ALTER TABLE public.individual_purchases DROP COLUMN IF EXISTS returned_amount;

ALTER TABLE public.corporate_vouchers DROP COLUMN IF EXISTS discount;
ALTER TABLE public.corporate_vouchers DROP COLUMN IF EXISTS collected_amount;
ALTER TABLE public.corporate_vouchers DROP COLUMN IF EXISTS returned_amount;

DROP INDEX IF EXISTS idx_individual_purchases_discount;
DROP INDEX IF EXISTS idx_corporate_vouchers_discount;
DROP INDEX IF EXISTS idx_individual_purchases_returned;
DROP INDEX IF EXISTS idx_corporate_vouchers_returned;
```

### Full Database Restore
```sql
-- If critical issues occur, restore from backup:
-- 1. Go to Supabase Dashboard → Database → Backups
-- 2. Select pre-migration backup
-- 3. Click "Restore"
-- 4. Confirm restoration
-- 5. Wait for completion (may take 5-30 minutes)
-- 6. Verify data integrity after restore
```

---

## ✅ Post-Migration Verification

### 1. Schema Verification
```sql
-- Verify all new columns exist
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('individual_purchases', 'corporate_vouchers', 'quotations')
  AND column_name IN ('discount', 'collected_amount', 'returned_amount', 'discount_amount', 'amount_after_discount', 'price_per_passport')
ORDER BY table_name, column_name;

-- Expected: 10 rows total
```

### 2. Index Verification
```sql
-- Verify indexes were created
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%discount%' OR indexname LIKE '%returned%'
ORDER BY tablename, indexname;

-- Expected: 4 indexes
```

### 3. RLS Policy Verification
```sql
-- Ensure RLS policies still work
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('individual_purchases', 'corporate_vouchers', 'quotations')
ORDER BY tablename, policyname;
```

### 4. Application Testing Checklist
- [ ] Login to application as each role (Admin, Finance, Agent, IT Support)
- [ ] Create a new individual purchase with discount
- [ ] Create a new quotation with discount
- [ ] View revenue report and verify discount columns appear
- [ ] Test quotation email sending
- [ ] Test bulk voucher upload
- [ ] Verify all existing data displays correctly

### 5. Performance Check
```sql
-- Check query performance on new indexes
EXPLAIN ANALYZE
SELECT * FROM individual_purchases
WHERE discount > 0
ORDER BY created_at DESC
LIMIT 100;

-- Should use idx_individual_purchases_discount index
```

---

## 📊 Monitoring Post-Migration

### First 24 Hours
- Monitor error logs in Supabase Dashboard
- Watch for slow queries or timeouts
- Check application performance metrics
- Monitor user feedback for issues

### First Week
- Review revenue reports for accuracy
- Verify discount calculations are correct
- Check email functionality
- Monitor database size and growth

---

## 🔧 Configuration Changes Required

### Environment Variables (Supabase Edge Functions)
After migration, configure these in Supabase Dashboard → Edge Functions → Settings:

```bash
# Email Service (Required for email features)
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=PNG Green Fees <noreply@yourdomain.com>

# Already configured (verify)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Application Environment (.env)
```bash
# Add if not already present
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

---

## 📞 Support & Troubleshooting

### Common Issues

#### Issue: "column already exists" Error
**Solution:** The migration has already been applied. Verify with:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'individual_purchases' AND column_name = 'discount';
```

#### Issue: Quotation Creation Fails
**Check:**
1. Migration 021 was applied successfully
2. All required fields have values
3. User has proper role (Finance_Manager or Flex_Admin)

#### Issue: Revenue Report Shows Zeros for Discount
**Check:**
1. Migration 020 was applied successfully
2. Frontend code was updated (RevenueGeneratedReports.jsx)
3. Browser cache was cleared

### Emergency Contacts
- **Database Admin:** [Your DBA contact]
- **System Admin:** [Your sysadmin contact]
- **Supabase Support:** https://supabase.com/support

---

## 📝 Migration Log Template

```
Migration Execution Log
Date: YYYY-MM-DD
Time Started: HH:MM
Performed By: [Your Name]

Pre-Migration:
[ ] Backup created: [Backup ID/Name]
[ ] Users notified: [Yes/No]
[ ] Maintenance mode: [Yes/No]

Migration Execution:
[ ] 020_add_discount_and_returned_amount.sql - [Success/Failed] - [Time: HH:MM]
[ ] 021_add_discount_to_quotations.sql - [Success/Failed] - [Time: HH:MM]

Post-Migration:
[ ] Schema verification: [Pass/Fail]
[ ] Data integrity check: [Pass/Fail]
[ ] Application testing: [Pass/Fail]
[ ] Users notified: [Yes/No]
[ ] Maintenance mode disabled: [Yes/No]

Time Completed: HH:MM
Total Duration: [X] minutes

Issues Encountered:
[List any issues and resolutions]

Notes:
[Any additional observations]
```

---

## 🎯 Success Criteria

Migration is considered successful when:
- ✅ All SQL migrations execute without errors
- ✅ All new columns exist with correct data types
- ✅ All indexes are created and functional
- ✅ Existing data remains intact (record counts match)
- ✅ Application can create quotations with discounts
- ✅ Revenue reports display discount information correctly
- ✅ No performance degradation observed
- ✅ All user roles can access their features
- ✅ Email functionality works (if configured)

---

## 📚 Related Documentation
- `SUPABASE_SETUP.md` - Initial database setup
- `CLAUDE.md` - Project overview
- `FIX_EMAIL_CONFIRMATION.md` - Email configuration
- `TEST_EMAIL_FUNCTIONALITY.md` - Email testing guide
- `BSP_POS_INTEGRATION_CHECKLIST.md` - Payment gateway integration

---

**Last Updated:** 2025-01-20
**Document Version:** 1.0
**Prepared By:** Claude Code Assistant
