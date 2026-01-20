-- Fix ownership and permissions for cash_reconciliations table
-- Run this as the postgres superuser or database owner

-- First, check current ownership
SELECT
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'cash_reconciliations';

-- Option 1: If you need to change owner to 'greenpay' user
-- ALTER TABLE cash_reconciliations OWNER TO greenpay;

-- Option 2: Grant necessary permissions to current user
GRANT ALL PRIVILEGES ON TABLE cash_reconciliations TO greenpay;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO greenpay;

-- If the sequence exists, grant permissions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'cash_reconciliations_id_seq') THEN
        GRANT ALL PRIVILEGES ON SEQUENCE cash_reconciliations_id_seq TO greenpay;
    END IF;
END $$;

-- Verify permissions after changes
SELECT
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'cash_reconciliations';

-- Show final ownership
SELECT
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'cash_reconciliations';
