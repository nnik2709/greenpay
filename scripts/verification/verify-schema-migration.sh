#!/bin/bash

# Schema Migration Verification Script
# Run this on the production server to verify if legacy to modern schema migration is complete

echo "============================================"
echo "  DATABASE SCHEMA MIGRATION VERIFICATION"
echo "============================================"
echo ""

# Database credentials
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="greenpay_db"
DB_USER="greenpay_user"
DB_PASSWORD="GreenPay2025!Secure#PG"

echo "Checking database: $DB_NAME"
echo "Date: $(date)"
echo ""

# Function to run SQL query
run_query() {
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" -t -c "$1"
}

echo "============================================"
echo "1. TABLE SCHEMA TYPE ANALYSIS"
echo "============================================"
echo ""

PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  table_name,
  CASE
    WHEN table_name ~ '^[A-Z]' AND table_name NOT LIKE '_archived_%' THEN 'LEGACY (Active - Capitalized)'
    WHEN table_name LIKE '_archived_%' THEN 'ARCHIVED (Safe)'
    WHEN table_name LIKE '%_old_backup_%' THEN 'BACKUP (Safe)'
    WHEN table_name LIKE '%_staging' THEN 'STAGING (Temporary)'
    WHEN table_name ~ '^[a-z]' THEN 'MODERN (lowercase)'
    ELSE 'UNKNOWN'
  END as schema_type,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY
  CASE
    WHEN table_name ~ '^[A-Z]' AND table_name NOT LIKE '_archived_%' THEN 1
    WHEN table_name LIKE '_archived_%' THEN 4
    WHEN table_name LIKE '%_old_backup_%' THEN 5
    WHEN table_name LIKE '%_staging' THEN 3
    ELSE 2
  END,
  table_name;
EOF

echo ""
echo "============================================"
echo "2. SCHEMA TYPE SUMMARY"
echo "============================================"
echo ""

PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  CASE
    WHEN table_name ~ '^[A-Z]' AND table_name NOT LIKE '_archived_%' THEN 'LEGACY (Active)'
    WHEN table_name LIKE '_archived_%' THEN 'ARCHIVED'
    WHEN table_name LIKE '%_old_backup_%' THEN 'BACKUP'
    WHEN table_name LIKE '%_staging' THEN 'STAGING'
    WHEN table_name ~ '^[a-z]' THEN 'MODERN'
    ELSE 'UNKNOWN'
  END as schema_type,
  COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
GROUP BY schema_type
ORDER BY schema_type;
EOF

echo ""
echo "============================================"
echo "3. CRITICAL TABLES CHECK"
echo "============================================"
echo ""

echo "Checking for critical tables in both legacy and modern schemas..."
echo ""

PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'passports') THEN '✓'
    ELSE '✗'
  END as "passports (modern)",
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Passport' AND table_name NOT LIKE '_archived_%') THEN '✗ FOUND'
    ELSE '✓ GONE'
  END as "Passport (legacy)",
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'individual_purchases') THEN '✓'
    ELSE '✗'
  END as "individual_purchases",
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'corporate_vouchers') THEN '✓'
    ELSE '✗'
  END as "corporate_vouchers",
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User' AND table_name NOT LIKE '_archived_%') THEN '✗ FOUND'
    ELSE '✓ GONE'
  END as "User (legacy)";
EOF

echo ""
echo "============================================"
echo "4. RECORD COUNT COMPARISON"
echo "============================================"
echo ""

echo "Counting records in key tables..."
echo ""

PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  'passports (modern)' as table_name,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'passports')
    THEN (SELECT COUNT(*)::text FROM passports)
    ELSE 'TABLE NOT FOUND'
  END as record_count
UNION ALL
SELECT
  'Passport (legacy)',
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Passport' AND table_name NOT LIKE '_archived_%')
    THEN (SELECT COUNT(*)::text FROM "Passport")
    ELSE 'TABLE NOT FOUND OR ARCHIVED'
  END
UNION ALL
SELECT
  '_archived_Passport',
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name LIKE '_archived_Passport%')
    THEN (SELECT COUNT(*)::text FROM (SELECT * FROM information_schema.tables WHERE table_name LIKE '_archived_Passport%' LIMIT 1) t, LATERAL (SELECT COUNT(*) FROM pg_class WHERE relname = t.table_name) c)
    ELSE 'NOT FOUND'
  END
UNION ALL
SELECT
  'individual_purchases',
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'individual_purchases')
    THEN (SELECT COUNT(*)::text FROM individual_purchases)
    ELSE 'TABLE NOT FOUND'
  END
UNION ALL
SELECT
  'corporate_vouchers',
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'corporate_vouchers')
    THEN (SELECT COUNT(*)::text FROM corporate_vouchers)
    ELSE 'TABLE NOT FOUND'
  END
UNION ALL
SELECT
  'quotations',
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quotations')
    THEN (SELECT COUNT(*)::text FROM quotations)
    ELSE 'TABLE NOT FOUND'
  END
UNION ALL
SELECT
  'invoices',
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices')
    THEN (SELECT COUNT(*)::text FROM invoices)
    ELSE 'TABLE NOT FOUND'
  END;
EOF

echo ""
echo "============================================"
echo "5. MIGRATION STATUS VERDICT"
echo "============================================"
echo ""

# Check if any active legacy tables exist
LEGACY_ACTIVE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" -t -c "
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name ~ '^[A-Z]'
    AND table_name NOT LIKE '_archived_%'
    AND table_name NOT LIKE '%_old_backup_%';
" | tr -d ' ')

# Check if modern tables exist
MODERN_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" -t -c "
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name IN ('passports', 'individual_purchases', 'corporate_vouchers', 'quotations', 'invoices');
" | tr -d ' ')

echo "Active Legacy Tables (Capitalized): $LEGACY_ACTIVE_COUNT"
echo "Modern Tables (lowercase): $MODERN_COUNT (expected: 5 minimum)"
echo ""

if [ "$LEGACY_ACTIVE_COUNT" -eq 0 ] && [ "$MODERN_COUNT" -ge 5 ]; then
    echo "✅ MIGRATION STATUS: COMPLETE"
    echo ""
    echo "✓ No active legacy tables found (all archived or removed)"
    echo "✓ All modern tables present (passports, individual_purchases, corporate_vouchers, quotations, invoices)"
    echo ""
    echo "The database schema migration from legacy (Capitalized) to modern (lowercase) is COMPLETE."
elif [ "$LEGACY_ACTIVE_COUNT" -gt 0 ] && [ "$MODERN_COUNT" -ge 5 ]; then
    echo "⚠️  MIGRATION STATUS: PARTIALLY COMPLETE"
    echo ""
    echo "✓ Modern tables exist and active"
    echo "✗ Legacy tables still active (need to be archived)"
    echo ""
    echo "Action required: Archive or remove the $LEGACY_ACTIVE_COUNT active legacy tables."
    echo ""
    echo "Legacy tables found:"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" -t -c "
      SELECT '  - ' || table_name || ' (' || pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) || ')'
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name ~ '^[A-Z]'
        AND table_name NOT LIKE '_archived_%'
        AND table_name NOT LIKE '%_old_backup_%'
      ORDER BY table_name;
    "
elif [ "$MODERN_COUNT" -lt 5 ]; then
    echo "❌ MIGRATION STATUS: NOT COMPLETE"
    echo ""
    echo "✗ Modern tables missing or incomplete"
    echo "Found $MODERN_COUNT modern tables, expected at least 5"
    echo ""
    echo "Migration has NOT been executed yet."
else
    echo "⚠️  MIGRATION STATUS: UNKNOWN"
    echo ""
    echo "Unable to determine migration status."
fi

echo ""
echo "============================================"
echo "6. ARCHIVED TABLES (Should Exist After Migration)"
echo "============================================"
echo ""

PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND (table_name LIKE '_archived_%' OR table_name LIKE '%_old_backup_%')
ORDER BY table_name;
EOF

echo ""
echo "============================================"
echo "VERIFICATION COMPLETE"
echo "============================================"
echo ""
echo "Date: $(date)"
echo ""
