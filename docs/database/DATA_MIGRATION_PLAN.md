# 📊 Data Migration Plan: Old PNG Green Fees → GreenPay

## Executive Summary

This document outlines the complete data migration strategy from the old Laravel-based PNG Green Fees application to the new GreenPay system.

**Source Database:** PostgreSQL (147.93.111.184:5432/myappdb)
**Target Database:** PostgreSQL (GreenPay production)
**Migration Complexity:** Medium-High (requires data transformation and relationship mapping)

---

## 1. Database Schema Comparison

### 1.1 Table Mapping Overview

| Old System (Laravel) | New System (GreenPay) | Mapping Status | Notes |
|---------------------|----------------------|----------------|-------|
| users | User | ✅ Direct | Field name differences |
| roles | Role | ✅ Direct | Same structure |
| user_profiles | - | ⚠️ Skip | User profile data not used in new system |
| user_sessions | login_events | ✅ Transform | Different structure, partial mapping |
| passports | Passport | ✅ Transform | Field name differences, MRZ fields new |
| payments | individual_purchases | ✅ Transform | Different structure |
| vouchers | individual_purchases + corporate_vouchers | ⚠️ Split | Based on payment type |
| voucher_batches | corporate_vouchers | ✅ Transform | Batch becomes multiple vouchers |
| bulk_passport_uploads | - | ⚠️ Archive | Keep audit trail, don't migrate data |
| quotations | quotations | ✅ Transform | Field name differences |
| invoices | invoices | ✅ Transform | Field name differences |
| payment_modes | PaymentMode | ✅ Direct | Same concept |
| tickets | tickets | ✅ Transform | Structure differences |
| ticket_responses | tickets.comments | ✅ Merge | Responses become JSONB comments |
| password_reset_tokens | - | ❌ Skip | Not needed for migration |
| sessions | - | ❌ Skip | Laravel framework table |
| cache* | - | ❌ Skip | Laravel framework tables |
| jobs* | - | ❌ Skip | Laravel framework tables |
| failed_jobs | - | ❌ Skip | Laravel framework table |

---

## 2. Detailed Field Mapping

### 2.1 Users → User

| Old Field | New Field | Transformation | Notes |
|-----------|-----------|----------------|-------|
| id | id | UUID generation | Convert BIGINT to UUID |
| name | name | Direct copy | |
| email | email | Direct copy | |
| email_verified_at | - | Skip | Not used |
| password | password | Direct copy | Already bcrypt hashed |
| is_active | isActive | Direct copy | |
| role_id | roleId | Map role IDs | See Role Mapping section |
| remember_token | - | Skip | Not used |
| created_at | createdAt | Direct copy | |
| updated_at | updatedAt | Direct copy | |

**Role Mapping:**
```sql
-- Old role_id → New roleId mapping
1 (ROLE_VFLEX_ADMIN) → 1 (Flex_Admin)
2 (ROLE_COUNTER_AGENT) → 3 (Counter_Agent)
3 (ROLE_FINANCE_MANAGER) → 2 (Finance_Manager)
4 (ROLE_IT_SUPPORT) → 4 (IT_Support)
```

---

### 2.2 Roles → Role

| Old Field | New Field | Transformation | Notes |
|-----------|-----------|----------------|-------|
| id | id | Direct copy | Keep same IDs |
| name | name | Direct copy | |
| created_at | - | Skip | |
| updated_at | - | Skip | |

---

### 2.3 Passports → Passport

| Old Field | New Field | Transformation | Notes |
|-----------|-----------|----------------|-------|
| id | id | Direct copy | |
| passport_no | passportNumber | Direct copy | |
| given_name | givenName | Direct copy | |
| surname | surname | Direct copy | |
| nationality | nationality | Direct copy | |
| dob | dateOfBirth | Direct copy | |
| sex | gender | Map M/F/X | |
| date_of_expiry | expiryDate | Direct copy | |
| - | issuingCountry | Extract from nationality | Default to nationality |
| - | mrzLine1 | Generate if possible | Leave NULL if not available |
| - | mrzLine2 | Generate if possible | Leave NULL if not available |
| place_of_birth | placeOfBirth | Direct copy | |
| place_of_issue | placeOfIssue | Direct copy | |
| date_of_issue | dateOfIssue | Direct copy | |
| - | email | NULL | Not in old system |
| - | phone | NULL | Not in old system |
| created_by | createdById | Map user UUID | Look up new user UUID |
| created_at | createdAt | Direct copy | |
| updated_at | updatedAt | Direct copy | |
| type, code, father_name, mother_name, spouse_name, old_passport_details, file_number, address, photo_path, signature_path, bulk_upload_id | - | Skip | Not used in new system |

---

### 2.4 Payments → individual_purchases

**Condition:** Only migrate payments where payment_mode != 'corporate' or bulk_upload_id IS NULL

| Old Field | New Field | Transformation | Notes |
|-----------|-----------|----------------|-------|
| id | id | Direct copy | |
| passport_id | passport_id | Direct copy | |
| - | passport_number | Lookup from passport | Join with passports table |
| code | voucher_code | Direct copy | Payment code becomes voucher code |
| (voucher_value * total_vouchers) | amount | Calculate | |
| - | currency | Default 'PGK' | |
| payment_mode | payment_method | Map payment modes | See Payment Mode Mapping |
| discount | discount | Direct copy | |
| collected_amount | collected_amount | Direct copy | |
| returned_amount | returned_amount | Direct copy | |
| - | status | Default 'active' | Mark as 'used' if used_at exists |
| valid_from | valid_from | Direct copy | |
| valid_until | valid_until | Direct copy | |
| used_at | used_at | Direct copy | |
| - | refund_reason | NULL | |
| - | refunded_at | NULL | |
| - | refunded_by | NULL | |
| - | purchase_session_id | NULL | |
| share_with_email | customer_email | Direct copy | |
| share_with_number | customer_phone | Direct copy | |
| - | payment_gateway_ref | NULL | |
| created_by | created_by | Map user UUID | Look up new user UUID |
| created_at | issued_date | Direct copy | |
| created_at | created_at | Direct copy | |
| updated_at | updated_at | Direct copy | |
| card_number, card_holder, cvv, expiry_date | - | Skip | Don't migrate sensitive card data |

---

### 2.5 Voucher_Batches → corporate_vouchers

**Note:** Each voucher_batch creates multiple corporate_vouchers (one per voucher)

| Old Field | New Field | Transformation | Notes |
|-----------|-----------|----------------|-------|
| id | batch_id | Convert to TEXT | Use 'BATCH-{id}' format |
| - | company_name | Extract from quotation | Join with quotations.client_name |
| - | voucher_code | Generate new | Create unique codes for each voucher |
| voucher_value | amount | Direct copy | |
| - | currency | Default 'PGK' | |
| - | quantity | 1 | Each record = 1 voucher |
| payment_mode | payment_method | Map payment modes | |
| discount / total_vouchers | discount | Divide by quantity | Per-voucher discount |
| collected_amount / total_vouchers | collected_amount | Divide by quantity | |
| returned_amount / total_vouchers | returned_amount | Divide by quantity | |
| - | status | Default 'pending' | |
| - | passport_id | NULL | To be assigned later |
| - | passport_number | NULL | |
| - | registered_at | NULL | |
| valid_from | valid_from | Direct copy | |
| valid_until | valid_until | Direct copy | |
| - | used_at | NULL | |
| - | invoice_id | Map if exists | Look up migrated invoice ID |
| created_by | created_by | Map user UUID | |
| created_at | created_at | Direct copy | |
| updated_at | updated_at | Direct copy | |
| purchase_order_reference | - | Store in notes | |
| card_number, card_holder, cvv, expiry_date | - | Skip | Don't migrate sensitive data |

**Voucher Code Generation:**
```javascript
// For each voucher in batch, generate unique code
function generateCorporateVoucherCode(batchId, index, total) {
  // Format: CORP-YYYYMMDD-XXXXX
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const uniqueId = `${batchId}-${String(index).padStart(5, '0')}`;
  return `CORP-${date}-${uniqueId}`;
}
```

---

### 2.6 Vouchers → (Conditional Mapping)

**Decision Tree:**
```
IF voucher.payment_id IS NOT NULL:
  → Already handled via payments → individual_purchases

IF voucher.voucher_batch_id IS NOT NULL:
  → Already handled via voucher_batches → corporate_vouchers

IF voucher.bulk_upload_id IS NOT NULL:
  → Create as corporate_voucher with batch_id = 'BULK-{bulk_upload_id}'

ELSE:
  → Orphaned voucher, create as individual_purchase with best-effort data
```

---

### 2.7 Quotations → quotations

| Old Field | New Field | Transformation | Notes |
|-----------|-----------|----------------|-------|
| id | id | Direct copy | |
| quotation_number | quotation_number | Direct copy | |
| - | customer_id | Create customer first | Create customer record from client info |
| client_name | company_name | Direct copy | |
| - | contact_person | Extract from notes | Or default to client_name |
| client_email | contact_email | Direct copy | |
| - | contact_phone | NULL | Not in old system |
| total_vouchers | number_of_passports | Direct copy | |
| voucher_value | amount_per_passport | Direct copy | |
| - | price_per_passport | Same as amount | |
| - | subtotal | total_amount - discount | |
| total_amount | total_amount | Direct copy | |
| discount_percentage | discount | Direct copy | |
| discount_amount | discount_amount | Direct copy | |
| amount_after_discount | amount_after_discount | Direct copy | |
| - | items | Generate JSONB | Create from total_vouchers and voucher_value |
| - | tax | Calculate 10% GST | If applicable |
| validity_date | valid_until | Direct copy | |
| status | status | Map status | See Status Mapping below |
| terms_conditions + notes | notes | Concatenate | |
| - | sent_at | NULL if status = 'draft' | Set if status = 'sent' |
| created_by | created_by | Map user UUID | |
| created_at | created_at | Direct copy | |
| updated_at | updated_at | Direct copy | |
| approved_by, approved_at, converted_at, due_date | - | Skip | Not used in new system |

**Status Mapping:**
```sql
'draft' → 'draft'
'sent' → 'sent'
'approved' → 'approved'
'converted' → 'converted'
'expired' → 'expired'
```

**Items JSONB Generation:**
```json
[
  {
    "description": "Green Fee Vouchers",
    "quantity": {number_of_vouchers},
    "unitPrice": {voucher_value},
    "amount": {total_amount}
  }
]
```

---

### 2.8 Invoices → invoices

| Old Field | New Field | Transformation | Notes |
|-----------|-----------|----------------|-------|
| id | id | Direct copy | |
| invoice_number | invoice_number | Direct copy | |
| - | customer_id | Create customer first | Create from client info |
| quotation_id | quotation_id | Direct copy | |
| client_name | company_name | Direct copy | |
| - | items | Generate JSONB | From vouchers + amount |
| total_amount - discount | subtotal | Calculate | |
| - | gst | Calculate 10% | If applicable |
| amount_after_discount | total_amount | Direct copy | |
| collected_amount | amount_paid | Direct copy | |
| status | status | Map status | See Status Mapping below |
| due_date | due_date | Direct copy | |
| - | paid_date | Set if paid | If amount_paid = total_amount |
| - | notes | Combine fields | |
| created_by | created_by | Map user UUID | |
| created_at | created_at | Direct copy | |
| updated_at | updated_at | Direct copy | |
| voucher_batch_id, client_email, client_phone, client_address, payment_mode, purchase_order_reference, card_number, card_holder, cvv, expiry_date, valid_from, valid_until | - | Skip or move to notes | |

**Status Mapping:**
```sql
'draft' → 'unpaid'
'sent' → 'unpaid'
'paid' → 'paid'
'overdue' → 'overdue'
```

---

### 2.9 Payment_Modes → PaymentMode

| Old Field | New Field | Transformation | Notes |
|-----------|-----------|----------------|-------|
| id | id | Direct copy | |
| name | name | Direct copy | |
| collect_card_details | collectCardDetails | Direct copy | |
| is_active | active | Direct copy | |
| created_at | createdAt | Direct copy | |
| updated_at | updatedAt | Direct copy | |
| slug, created_by | - | Skip | |

---

### 2.10 Tickets + Ticket_Responses → tickets

| Old Field | New Field | Transformation | Notes |
|-----------|-----------|----------------|-------|
| tickets.id | id | Direct copy | |
| - | ticket_number | Generate | Format: TKT-{YYYY}{MM}{DD}-{ID} |
| tickets.subject | subject | Direct copy | |
| tickets.description | description | Direct copy | |
| tickets.priority | priority | Map priority | See Priority Mapping |
| tickets.status | status | Map status | See Status Mapping |
| ticket_responses → JSONB | comments | Transform | Convert responses to comments array |
| tickets.user_id | created_by | Map user UUID | |
| - | assigned_to | NULL | Not in old system |
| tickets.created_at | created_at | Direct copy | |
| tickets.updated_at | updated_at | Direct copy | |
| tickets.category, tickets.attachment | - | Skip | |

**Priority Mapping:**
```sql
'Low' → 'low'
'Medium' → 'medium'
'High' → 'high'
'Urgent' → 'urgent'
```

**Status Mapping:**
```sql
'Open' → 'open'
'In Progress' → 'in_progress'
'Resolved' → 'resolved'
'Closed' → 'closed'
```

**Comments JSONB Structure:**
```json
[
  {
    "user_id": "{responder_id}",
    "user_name": "John Doe",
    "message": "Response message",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

### 2.11 Bulk_Passport_Uploads → Archive Only

**Decision:** Don't migrate to new system, but keep audit trail

Create separate archive table or CSV file with:
- bulk_id
- original_filename
- records_processed
- status
- created_by
- created_at

Reference in notes field of related corporate_vouchers.

---

## 3. Data Integrity Checks

### 3.1 Pre-Migration Validation

```sql
-- Check for orphaned records
SELECT COUNT(*) FROM vouchers WHERE payment_id IS NULL AND voucher_batch_id IS NULL AND bulk_upload_id IS NULL;

-- Check for missing passport references
SELECT COUNT(*) FROM payments WHERE passport_id NOT IN (SELECT id FROM passports);

-- Check for duplicate voucher codes
SELECT code, COUNT(*) FROM vouchers GROUP BY code HAVING COUNT(*) > 1;

-- Check for invalid dates
SELECT * FROM payments WHERE valid_from > valid_until;

-- Check for negative amounts
SELECT * FROM payments WHERE total_amount < 0 OR collected_amount < 0;
```

### 3.2 Post-Migration Validation

```sql
-- Verify record counts
SELECT 'Old passports' as table_name, COUNT(*) FROM old_db.passports
UNION ALL
SELECT 'New Passport', COUNT(*) FROM new_db."Passport";

-- Verify data integrity
SELECT COUNT(*) FROM new_db.individual_purchases WHERE passport_id NOT IN (SELECT id FROM new_db."Passport");

-- Verify voucher code uniqueness
SELECT voucher_code, COUNT(*) FROM (
  SELECT voucher_code FROM new_db.individual_purchases
  UNION ALL
  SELECT voucher_code FROM new_db.corporate_vouchers
) combined GROUP BY voucher_code HAVING COUNT(*) > 1;

-- Verify financial totals match
SELECT
  SUM(total_amount) as old_total,
  (SELECT SUM(amount) FROM new_db.individual_purchases) as new_individual,
  (SELECT SUM(amount) FROM new_db.corporate_vouchers) as new_corporate
FROM old_db.payments;
```

---

## 4. Migration Execution Plan

### Phase 1: Preparation (Day 1)
1. ✅ Create full backup of old database
2. ✅ Set up migration database (temporary)
3. ✅ Create migration scripts
4. ✅ Set up logging and error tracking
5. ✅ Run pre-migration validation checks

### Phase 2: Reference Data (Day 1)
1. ✅ Migrate Roles (simple, no dependencies)
2. ✅ Migrate PaymentMode (simple, no dependencies)
3. ✅ Verify reference data

### Phase 3: User Data (Day 1-2)
1. ✅ Generate UUID mapping for all users (old_id → new_uuid)
2. ✅ Migrate Users with UUID generation
3. ✅ Verify user authentication still works
4. ✅ Update all foreign key mappings

### Phase 4: Core Business Data (Day 2-3)
1. ✅ Migrate Passports
2. ✅ Create Customers from quotations and invoices
3. ✅ Migrate Quotations
4. ✅ Migrate Invoices
5. ✅ Verify quotation → invoice relationships

### Phase 5: Payment & Voucher Data (Day 3-4)
1. ✅ Migrate Payments → individual_purchases
2. ✅ Migrate Voucher_Batches → corporate_vouchers (with code generation)
3. ✅ Handle orphaned vouchers
4. ✅ Verify all vouchers have unique codes
5. ✅ Verify financial totals match

### Phase 6: Support & Audit Data (Day 4)
1. ✅ Migrate Tickets with responses combined
2. ✅ Migrate User_Sessions → login_events (partial)
3. ✅ Archive Bulk_Passport_Uploads data

### Phase 7: Validation & Cutover (Day 5)
1. ✅ Run all post-migration validation checks
2. ✅ Generate migration report with statistics
3. ✅ User acceptance testing
4. ✅ Fix any data issues found
5. ✅ Final backup before cutover
6. ✅ Cutover to new system

---

## 5. Migration Scripts Structure

### 5.1 Script Organization

```
/migration-scripts/
├── 01-prepare/
│   ├── 01-backup-old-database.sh
│   ├── 02-create-migration-db.sh
│   ├── 03-validate-source-data.sql
│   └── 04-generate-uuid-mapping.sql
├── 02-reference-data/
│   ├── 01-migrate-roles.sql
│   ├── 02-migrate-payment-modes.sql
│   └── 03-verify-reference-data.sql
├── 03-users/
│   ├── 01-migrate-users.sql
│   ├── 02-verify-users.sql
│   └── uuid-mapping.csv
├── 04-core-data/
│   ├── 01-migrate-passports.sql
│   ├── 02-create-customers.sql
│   ├── 03-migrate-quotations.sql
│   ├── 04-migrate-invoices.sql
│   └── 05-verify-core-data.sql
├── 05-vouchers/
│   ├── 01-migrate-individual-purchases.sql
│   ├── 02-migrate-corporate-vouchers.sql
│   ├── 03-handle-orphaned-vouchers.sql
│   ├── 04-verify-vouchers.sql
│   └── voucher-code-map.csv
├── 06-support/
│   ├── 01-migrate-tickets.sql
│   ├── 02-migrate-login-events.sql
│   ├── 03-archive-bulk-uploads.sql
│   └── 04-verify-support-data.sql
├── 07-validation/
│   ├── 01-final-validation.sql
│   ├── 02-generate-report.sql
│   └── 03-data-comparison.sql
└── migration.log
```

### 5.2 Sample Migration Script (Users)

```sql
-- 03-users/01-migrate-users.sql

-- Create UUID mapping table
CREATE TEMP TABLE user_uuid_mapping (
  old_id BIGINT PRIMARY KEY,
  new_uuid UUID NOT NULL
);

-- Generate UUIDs for all users
INSERT INTO user_uuid_mapping (old_id, new_uuid)
SELECT id, gen_random_uuid()
FROM old_database.users;

-- Migrate users with UUID mapping
INSERT INTO new_database."User" (
  id, name, email, password, "roleId", "isActive", "createdAt", "updatedAt"
)
SELECT
  m.new_uuid,
  u.name,
  u.email,
  u.password,
  CASE u.role_id
    WHEN 1 THEN 1  -- ROLE_VFLEX_ADMIN → Flex_Admin
    WHEN 2 THEN 3  -- ROLE_COUNTER_AGENT → Counter_Agent
    WHEN 3 THEN 2  -- ROLE_FINANCE_MANAGER → Finance_Manager
    WHEN 4 THEN 4  -- ROLE_IT_SUPPORT → IT_Support
    ELSE 3         -- Default to Counter_Agent
  END,
  COALESCE(u.is_active, true),
  u.created_at,
  u.updated_at
FROM old_database.users u
JOIN user_uuid_mapping m ON u.id = m.old_id
WHERE u.email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- Export UUID mapping to CSV for reference
COPY user_uuid_mapping TO '/migration/uuid-mapping.csv' CSV HEADER;

-- Verification
SELECT COUNT(*) as migrated_users FROM new_database."User";
SELECT COUNT(*) as source_users FROM old_database.users WHERE email IS NOT NULL;
```

---

## 6. Risk Assessment & Mitigation

### 6.1 High Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data loss during migration | High | Low | Full backup before migration, dry run first |
| Voucher code collisions | High | Medium | Pre-validate all codes, generate new if needed |
| User UUID mapping failure | High | Low | Test UUID generation, keep mapping table |
| Relationship integrity issues | High | Medium | Extensive validation checks, foreign key verification |
| Financial data mismatch | High | Low | Sum validation, transaction-by-transaction audit |

### 6.2 Medium Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Missing passport data | Medium | Medium | Create placeholder records, flag for review |
| Payment mode mapping issues | Medium | Low | Manual mapping table, default to CASH |
| Ticket response format issues | Medium | Low | Validate JSONB structure, fallback to text |
| Long migration time | Medium | Medium | Optimize queries, batch processing |

### 6.3 Low Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Login event data incomplete | Low | High | Best-effort migration, not critical |
| Old attachment files missing | Low | Medium | Document missing files, continue |
| Historical session data | Low | High | Skip if not needed |

---

## 7. Rollback Plan

### 7.1 Rollback Triggers
- Data integrity checks fail
- Financial totals don't match
- Critical business function broken
- User acceptance test fails

### 7.2 Rollback Procedure
1. Stop new system immediately
2. Restore old system from backup
3. Update DNS to point to old system
4. Notify all users of rollback
5. Analyze failures and plan retry

### 7.3 Point of No Return
After cutover (Day 5), rollback becomes very difficult if:
- Users have created new data in new system
- Payments have been processed in new system
- More than 24 hours have passed

**Recommendation:** Plan cutover for weekend with 48-hour validation window.

---

## 8. Post-Migration Tasks

### 8.1 Immediate (Day 5-7)
- [ ] Monitor system performance
- [ ] User training sessions
- [ ] Bug fix hotline
- [ ] Daily data integrity checks
- [ ] Performance optimization

### 8.2 Short-term (Week 2-4)
- [ ] Archive old database (don't delete yet)
- [ ] User feedback collection
- [ ] Document migration issues and resolutions
- [ ] Update system documentation
- [ ] Performance tuning based on usage

### 8.3 Long-term (Month 2-3)
- [ ] Final validation of all migrated data
- [ ] Old system decommissioning plan
- [ ] Historical data archival strategy
- [ ] Lessons learned documentation

---

## 9. Success Metrics

### 9.1 Technical Metrics
- ✅ 100% of critical data migrated (users, passports, active vouchers)
- ✅ 0 duplicate voucher codes
- ✅ Financial totals match within 0.01%
- ✅ All foreign key relationships valid
- ✅ System performance acceptable (< 2s page load)

### 9.2 Business Metrics
- ✅ All users can log in successfully
- ✅ All active vouchers are valid and usable
- ✅ Quotation and invoice workflow functions
- ✅ Reports show accurate historical data
- ✅ Payment processing works correctly

### 9.3 User Acceptance
- ✅ 95%+ users successfully complete training
- ✅ < 10 critical bugs reported in first week
- ✅ User satisfaction score > 7/10
- ✅ No data loss incidents reported

---

## 10. Contact & Support

**Migration Team:**
- Technical Lead: [Name]
- Database Administrator: [Name]
- Application Developer: [Name]
- QA Lead: [Name]

**Support During Migration:**
- Hotline: [Phone]
- Email: [Email]
- Slack Channel: #greenpay-migration

**Escalation Path:**
Level 1 → Technical Lead → Database Administrator → CTO

---

## 11. Appendix

### A. Payment Mode Mapping Table

| Old Value | New Value | collectCardDetails |
|-----------|-----------|-------------------|
| cash | CASH | false |
| card | CREDIT CARD | true |
| bank transfer | BANK TRANSFER | false |
| eftpos | EFTPOS | true |

### B. Voucher Code Format

**Old System:**
- Individual: Payment code (various formats)
- Corporate: Voucher code (various formats)

**New System:**
- Individual: `IND-{YYYYMMDD}-{RANDOM5}` (e.g., IND-20240115-A7B9C)
- Corporate: `CORP-{YYYYMMDD}-{BATCHID}-{INDEX}` (e.g., CORP-20240115-B0042-00001)

### C. UUID Generation Strategy

```sql
-- Generate deterministic UUIDs based on old IDs
-- This ensures consistency across multiple migration runs
CREATE OR REPLACE FUNCTION generate_deterministic_uuid(prefix TEXT, old_id BIGINT)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT md5(prefix || '-' || old_id::TEXT)::UUID
  );
END;
$$ LANGUAGE plpgsql;

-- Usage:
SELECT generate_deterministic_uuid('user', 42);
-- Always returns same UUID for user ID 42
```

---

## Document Version

**Version:** 1.0
**Date:** December 16, 2024
**Author:** Migration Planning Team
**Status:** Draft - Ready for Review

**Revision History:**
- v1.0 (2024-12-16): Initial comprehensive migration plan

---

**Next Steps:**
1. Review and approve migration plan
2. Schedule migration window
3. Assign team members to phases
4. Begin Phase 1 preparation
5. Conduct dry run on test database
