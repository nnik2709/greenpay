# Database Migrations Guide

## Overview
This folder contains SQL migration scripts to fix critical production issues discovered during testing on 2025-12-18.

## Migration Files

| File | Priority | Description | Impact |
|------|----------|-------------|--------|
| `001_add_card_last_four_column.sql` | CRITICAL | Adds missing `card_last_four` column | Fixes "View Vouchers" 500 error |
| `002_fix_settings_table_permissions.sql` | CRITICAL | Fixes settings table permissions | Allows Flex_Admin to save settings |

## Pre-Migration Checklist

- [ ] **Backup database** before running any migrations
- [ ] Test migrations in development/staging environment first
- [ ] Verify database connection details
- [ ] Ensure you have superuser or owner privileges
- [ ] Review each SQL file before execution
- [ ] Have rollback plan ready

## How to Apply Migrations

### Method 1: Using psql Command Line

```bash
# Connect to production database
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db

# Or if using default postgres user
PGPASSWORD='your_password' psql -h localhost -U postgres -d greenpay_db

# Run migrations in order
\i database/migrations/001_add_card_last_four_column.sql
\i database/migrations/002_fix_settings_table_permissions.sql

# Verify migrations
SELECT * FROM information_schema.columns
WHERE table_name = 'individual_purchases' AND column_name = 'card_last_four';

SELECT tablename, tableowner FROM pg_tables WHERE tablename = 'settings';
```

### Method 2: SSH to Server and Run Directly

```bash
# SSH to production server
ssh root@165.22.52.100

# Navigate to project directory
cd /var/www/greenpay

# Apply migrations
PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -f database/migrations/001_add_card_last_four_column.sql

PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user -d greenpay_db -f database/migrations/002_fix_settings_table_permissions.sql
```

### Method 3: Using Database Management Tool

1. Connect to production database using DBeaver, pgAdmin, or similar
2. Open each migration file
3. Execute SQL in order
4. Verify results

## Post-Migration Verification

### Test 1: Verify card_last_four Column

```sql
-- Check column exists
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'individual_purchases'
AND column_name = 'card_last_four';

-- Expected result:
-- column_name      | data_type       | character_maximum_length
-- card_last_four   | character varying | 4
```

### Test 2: Verify Settings Permissions

```sql
-- Check table owner and permissions
SELECT tablename, tableowner
FROM pg_tables
WHERE tablename = 'settings';

-- Check RLS policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'settings';

-- Expected: At least 2 policies (flex_admin_settings_all, all_users_settings_read)
```

### Test 3: Application Testing

1. **Test View Vouchers Feature**
   - Login as Agent
   - Go to All Passports
   - Search for passport "387110389"
   - Click "View Vouchers"
   - Should load without 500 error

2. **Test Settings Update**
   - Login as Flex_Admin
   - Go to `/app/admin/settings`
   - Change any setting
   - Click Save
   - Should save without "must be owner" error

## Rollback Instructions

### Rollback Migration 001 (card_last_four)

```sql
-- Remove the column if needed
ALTER TABLE individual_purchases
DROP COLUMN IF EXISTS card_last_four;
```

**Note:** Only rollback if column causes issues. The column being missing was the original problem.

### Rollback Migration 002 (settings permissions)

```sql
-- Drop new policies
DROP POLICY IF EXISTS flex_admin_settings_all ON settings;
DROP POLICY IF EXISTS all_users_settings_read ON settings;

-- Revert to previous owner (if you know what it was)
-- ALTER TABLE settings OWNER TO previous_owner;

-- Disable RLS if it wasn't enabled before
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
```

## Common Issues & Solutions

### Issue: "permission denied for table settings"

**Solution:**
```sql
-- Grant permissions to your app user
GRANT ALL PRIVILEGES ON TABLE settings TO greenpay_user;
```

### Issue: "must be owner of table to alter"

**Solution:**
- Connect as postgres superuser
- Or use `sudo -u postgres psql`
- Then run migrations

### Issue: "relation 'individual_purchases' does not exist"

**Solution:**
- Verify you're connected to correct database
- Check table name (might be in different schema)
```sql
SELECT schemaname, tablename
FROM pg_tables
WHERE tablename LIKE '%purchase%';
```

### Issue: RLS policies preventing updates

**Solution:**
```sql
-- Temporarily disable RLS for testing
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Test if it works
-- Then re-enable and fix policies
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
```

## Migration Log

| Date | Migration | Applied By | Status | Notes |
|------|-----------|------------|--------|-------|
| 2025-12-18 | 001 | [Your Name] | ⏳ Pending | To be applied |
| 2025-12-18 | 002 | [Your Name] | ⏳ Pending | To be applied |

## Next Steps After Migrations

1. Restart backend API server
   ```bash
   pm2 restart greenpay-api
   ```

2. Clear any application caches

3. Test all affected features (see Post-Migration Verification above)

4. Monitor PM2 logs for errors
   ```bash
   pm2 logs greenpay-api --lines 100
   ```

5. Monitor database logs
   ```bash
   tail -f /var/log/postgresql/postgresql-*.log
   ```

## Support

If migrations fail or cause issues:
1. Check PM2 logs: `pm2 logs greenpay-api`
2. Check PostgreSQL logs
3. Verify database connection details
4. Contact database administrator
5. Have backup ready for restore

## Additional Migrations Needed (Future)

Based on testing findings, these may also need migrations:

- Add email templates table (if missing)
- Add/update RLS policies for quotations (IT_Support read access)
- Update voucher status logic for corporate vouchers
- Add audit logging tables

---

**Last Updated:** 2025-12-18
**Author:** Development Team
**Version:** 1.0
