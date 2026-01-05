#!/bin/bash

# ROLLBACK SCRIPT - Restore Archived Tables
# Use this if anything breaks after archiving
# Date: 2026-01-02

echo "============================================"
echo "  ROLLBACK: RESTORE ARCHIVED TABLES"
echo "============================================"
echo ""
echo "This will restore the following tables:"
echo "  - _archived_Passport_20260102 → Passport"
echo "  - _archived_Quotation_20260102 → Quotation"
echo "  - _archived_Invoice_20260102 → Invoice"
echo ""
read -p "Are you sure you want to rollback? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Rollback cancelled."
    exit 0
fi

echo ""
echo "Starting rollback..."
echo ""

PGPASSWORD='GreenPay2025!Secure#PG' psql -h localhost -U greenpay_user greenpay_db << 'EOF'

BEGIN;

-- Restore Passport table
ALTER TABLE "_archived_Passport_20260102" RENAME TO "Passport";
COMMENT ON TABLE "Passport" IS 'Restored from archive on rollback';

-- Restore Quotation table
ALTER TABLE "_archived_Quotation_20260102" RENAME TO "Quotation";
COMMENT ON TABLE "Quotation" IS 'Restored from archive on rollback';

-- Restore Invoice table
ALTER TABLE "_archived_Invoice_20260102" RENAME TO "Invoice";
COMMENT ON TABLE "Invoice" IS 'Restored from archive on rollback';

-- Verify restoration
SELECT
  table_name,
  CASE
    WHEN table_name LIKE '_archived_%' THEN 'ARCHIVED'
    WHEN table_name ~ '^[A-Z]' THEN 'LEGACY (Active) ✓'
    ELSE 'MODERN'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN ('Passport', 'Quotation', 'Invoice',
                     '_archived_Passport_20260102',
                     '_archived_Quotation_20260102',
                     '_archived_Invoice_20260102')
ORDER BY table_name;

COMMIT;

EOF

echo ""
echo "============================================"
echo "ROLLBACK COMPLETE"
echo "============================================"
echo ""
echo "Legacy tables have been restored."
echo "System should now work as before archiving."
echo ""
