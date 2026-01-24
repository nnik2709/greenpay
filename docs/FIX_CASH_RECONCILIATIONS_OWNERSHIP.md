# Fix Cash Reconciliations Table Ownership Issue

## Problem
When trying to create or modify the `cash_reconciliations` table, you get:
```
ERROR: must be owner of table cash_reconciliations
```

This happens because the table exists but is owned by a different PostgreSQL user than the one you're connected as.

## Solution

### Option 1: Quick Fix - Grant Permissions (Recommended)

If you just need to use the table without changing ownership:

```bash
# Connect to the production database
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay

# Run these commands:
GRANT ALL PRIVILEGES ON TABLE cash_reconciliations TO greenpay;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO greenpay;

# If the sequence exists for the ID column:
GRANT ALL PRIVILEGES ON SEQUENCE cash_reconciliations_id_seq TO greenpay;

# Verify permissions were granted:
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'cash_reconciliations';
```

### Option 2: Change Table Owner (If You Have Superuser Access)

If you need to change the owner to match your user:

```bash
# Connect as postgres superuser or database owner
psql -h 165.22.52.100 -U postgres -d greenpay

# Change ownership:
ALTER TABLE cash_reconciliations OWNER TO greenpay;

# Also change sequence ownership if it exists:
ALTER SEQUENCE cash_reconciliations_id_seq OWNER TO greenpay;
```

### Option 3: Drop and Recreate (If Table is Empty)

⚠️ **WARNING**: Only do this if the table has no data you need to keep!

```bash
# Connect to the database
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay

# Check if table has data:
SELECT COUNT(*) FROM cash_reconciliations;

# If count is 0, you can safely drop and recreate:
DROP TABLE IF EXISTS cash_reconciliations CASCADE;

# Then run the CREATE TABLE statement from your migration file:
\i backend/migrations/create-cash-reconciliations-table.sql
```

## Verify the Fix

After applying one of the solutions above, verify everything works:

```bash
# Connect to database
PGPASSWORD='GreenPay2025!Secure#PG' psql -h 165.22.52.100 -U greenpay -d greenpay

# Check table ownership:
SELECT tablename, tableowner
FROM pg_tables
WHERE tablename = 'cash_reconciliations';

# Check your permissions:
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'cash_reconciliations'
  AND grantee = 'greenpay';

# Test inserting data:
INSERT INTO cash_reconciliations (
    user_id,
    reconciliation_date,
    opening_float,
    total_cash_sales,
    status
) VALUES (
    1,
    CURRENT_DATE,
    100.00,
    500.00,
    'pending'
) RETURNING id;

# If that works, clean up the test record:
DELETE FROM cash_reconciliations WHERE total_cash_sales = 500.00;
```

## Common Causes

This issue typically happens when:
1. Table was created by a different PostgreSQL user (e.g., `postgres` instead of `greenpay`)
2. Table was restored from a backup with different ownership
3. Migration was run with superuser privileges instead of application user

## Prevention

To prevent this in the future:
1. Always run migrations as the `greenpay` user
2. Check table ownership after creating new tables
3. Use `CREATE TABLE IF NOT EXISTS` cautiously - it won't update ownership

## Related Files

- Migration file: `backend/migrations/create-cash-reconciliations-table.sql`
- Route handler: `backend/routes/cash-reconciliations.js`
- Fix script: `database/fix-cash-reconciliations-ownership.sql`
