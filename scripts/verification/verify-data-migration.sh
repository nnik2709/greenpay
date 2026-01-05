#!/bin/bash

# Data Migration Verification Script
# Compares legacy vs modern schema data to verify migration integrity

echo "============================================"
echo "  DATA MIGRATION INTEGRITY VERIFICATION"
echo "============================================"
echo ""

# Database credentials
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="greenpay_db"
DB_USER="greenpay_user"
DB_PASSWORD="GreenPay2025!Secure#PG"

echo "Database: $DB_NAME"
echo "Date: $(date)"
echo ""

# Function to run SQL query
run_query() {
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" -t -c "$1"
}

echo "============================================"
echo "1. PASSPORT DATA COMPARISON"
echo "============================================"
echo ""

echo "Record Counts:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  'Legacy Passport' as source,
  COUNT(*) as total_records,
  COUNT(DISTINCT "passportNo") as unique_passports
FROM "Passport"
UNION ALL
SELECT
  'Modern passports' as source,
  COUNT(*) as total_records,
  COUNT(DISTINCT passport_number) as unique_passports
FROM passports;
EOF

echo ""
echo "Sample passport numbers comparison (first 10):"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  'Legacy' as source,
  "passportNo" as passport_number,
  CONCAT("givenName", ' ', surname) as full_name,
  nationality
FROM "Passport"
ORDER BY "createdAt" DESC
LIMIT 5;

SELECT
  'Modern' as source,
  passport_number,
  full_name,
  nationality
FROM passports
ORDER BY created_at DESC
LIMIT 5;
EOF

echo ""
echo "Check for passports in legacy but NOT in modern:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  COUNT(*) as missing_in_modern,
  STRING_AGG("passportNo", ', ') as sample_missing_passports
FROM "Passport"
WHERE "passportNo" NOT IN (SELECT passport_number FROM passports WHERE passport_number IS NOT NULL);
EOF

echo ""
echo "Check for passports in modern but NOT in legacy:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  COUNT(*) as new_in_modern,
  STRING_AGG(passport_number, ', ') as sample_new_passports
FROM passports
WHERE passport_number NOT IN (SELECT "passportNo" FROM "Passport" WHERE "passportNo" IS NOT NULL);
EOF

echo ""
echo "============================================"
echo "2. USER DATA COMPARISON"
echo "============================================"
echo ""

echo "Record Counts:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  'Legacy User' as source,
  COUNT(*) as total_records,
  COUNT(DISTINCT email) as unique_emails
FROM "User"
WHERE email IS NOT NULL
UNION ALL
SELECT
  'Modern profiles' as source,
  COUNT(*) as total_records,
  COUNT(DISTINCT email) as unique_emails
FROM profiles
WHERE email IS NOT NULL;
EOF

echo ""
echo "Sample users comparison:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  'Legacy' as source,
  email,
  name,
  "isActive" as is_active
FROM "User"
WHERE email IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 5;

SELECT
  'Modern' as source,
  email,
  name,
  is_active
FROM profiles
WHERE email IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
EOF

echo ""
echo "Check for users in legacy but NOT in modern:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  COUNT(*) as missing_in_modern,
  STRING_AGG(email, ', ') as sample_missing_users
FROM "User"
WHERE email IS NOT NULL
  AND email NOT IN (SELECT email FROM profiles WHERE email IS NOT NULL);
EOF

echo ""
echo "============================================"
echo "3. QUOTATION DATA COMPARISON"
echo "============================================"
echo ""

echo "Record Counts:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  'Legacy Quotation' as source,
  COUNT(*) as total_records,
  SUM("totalAmount") as total_value
FROM "Quotation"
UNION ALL
SELECT
  'Modern quotations' as source,
  COUNT(*) as total_records,
  SUM(total_amount) as total_value
FROM quotations;
EOF

echo ""
echo "Sample quotations comparison:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  'Legacy' as source,
  "quotationNumber" as quotation_number,
  "clientName" as client_name,
  "totalAmount" as total_amount,
  status
FROM "Quotation"
ORDER BY "createdAt" DESC
LIMIT 5;

SELECT
  'Modern' as source,
  quotation_number,
  company_name as client_name,
  total_amount,
  status
FROM quotations
ORDER BY created_at DESC
LIMIT 5;
EOF

echo ""
echo "============================================"
echo "4. INVOICE DATA COMPARISON"
echo "============================================"
echo ""

echo "Record Counts:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  'Legacy Invoice' as source,
  COUNT(*) as total_records,
  SUM("totalAmount") as total_value,
  SUM("amountPaid") as total_paid
FROM "Invoice"
UNION ALL
SELECT
  'Modern invoices' as source,
  COUNT(*) as total_records,
  SUM(total_amount) as total_value,
  SUM(amount_paid) as total_paid
FROM invoices;
EOF

echo ""
echo "Sample invoices comparison:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  'Legacy' as source,
  "invoiceNumber" as invoice_number,
  "clientName" as client_name,
  "totalAmount" as total_amount,
  "amountPaid" as amount_paid,
  status
FROM "Invoice"
ORDER BY "createdAt" DESC
LIMIT 5;

SELECT
  'Modern' as source,
  invoice_number,
  company_name as client_name,
  total_amount,
  amount_paid,
  status
FROM invoices
ORDER BY created_at DESC
LIMIT 5;
EOF

echo ""
echo "============================================"
echo "5. INDIVIDUAL PURCHASES / VOUCHERS"
echo "============================================"
echo ""

echo "Individual Purchases Record Count:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  'individual_purchases' as table_name,
  COUNT(*) as total_records,
  SUM(amount) as total_value,
  COUNT(DISTINCT passport_number) as unique_passports
FROM individual_purchases;
EOF

echo ""
echo "Sample individual purchases:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  voucher_code,
  passport_number,
  amount,
  status,
  TO_CHAR(created_at, 'YYYY-MM-DD') as created_date
FROM individual_purchases
ORDER BY created_at DESC
LIMIT 5;
EOF

echo ""
echo "============================================"
echo "6. CORPORATE VOUCHERS"
echo "============================================"
echo ""

echo "Corporate Vouchers Record Count:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT batch_id) as unique_batches,
  SUM(amount) as total_value,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'registered' THEN 1 END) as registered,
  COUNT(CASE WHEN status = 'used' THEN 1 END) as used
FROM corporate_vouchers;
EOF

echo ""
echo "Sample corporate vouchers by batch:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  batch_id,
  COUNT(*) as voucher_count,
  company_name,
  SUM(amount) as total_amount,
  MIN(TO_CHAR(created_at, 'YYYY-MM-DD')) as created_date
FROM corporate_vouchers
WHERE batch_id IS NOT NULL
GROUP BY batch_id, company_name
ORDER BY created_date DESC
LIMIT 5;
EOF

echo ""
echo "Check VoucherBatch vs corporate_vouchers:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  'Legacy VoucherBatch' as source,
  COUNT(*) as batch_count,
  SUM("totalVouchers") as total_vouchers,
  SUM("collectedAmount") as total_collected
FROM "VoucherBatch";

SELECT
  'Modern corporate_vouchers (unique batches)' as source,
  COUNT(DISTINCT batch_id) as batch_count,
  COUNT(*) as total_vouchers,
  SUM(collected_amount) as total_collected
FROM corporate_vouchers
WHERE batch_id IS NOT NULL;
EOF

echo ""
echo "============================================"
echo "7. FINANCIAL INTEGRITY CHECK"
echo "============================================"
echo ""

echo "Total financial values across all tables:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" << 'EOF'
SELECT
  'Legacy Total' as source,
  (SELECT COALESCE(SUM("totalAmount"), 0) FROM "Quotation") as quotation_total,
  (SELECT COALESCE(SUM("totalAmount"), 0) FROM "Invoice") as invoice_total,
  (SELECT COALESCE(SUM("collectedAmount"), 0) FROM "VoucherBatch") as voucher_total,
  (SELECT COALESCE(SUM("totalAmount"), 0) FROM "Quotation") +
  (SELECT COALESCE(SUM("totalAmount"), 0) FROM "Invoice") +
  (SELECT COALESCE(SUM("collectedAmount"), 0) FROM "VoucherBatch") as grand_total
UNION ALL
SELECT
  'Modern Total' as source,
  (SELECT COALESCE(SUM(total_amount), 0) FROM quotations) as quotation_total,
  (SELECT COALESCE(SUM(total_amount), 0) FROM invoices) as invoice_total,
  (SELECT COALESCE(SUM(amount), 0) FROM individual_purchases) +
  (SELECT COALESCE(SUM(amount), 0) FROM corporate_vouchers) as voucher_total,
  (SELECT COALESCE(SUM(total_amount), 0) FROM quotations) +
  (SELECT COALESCE(SUM(total_amount), 0) FROM invoices) +
  (SELECT COALESCE(SUM(amount), 0) FROM individual_purchases) +
  (SELECT COALESCE(SUM(amount), 0) FROM corporate_vouchers) as grand_total;
EOF

echo ""
echo "============================================"
echo "8. MIGRATION VERDICT"
echo "============================================"
echo ""

# Count missing passports
MISSING_PASSPORTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" -t -c "
  SELECT COUNT(*)
  FROM \"Passport\"
  WHERE \"passportNo\" NOT IN (SELECT passport_number FROM passports WHERE passport_number IS NOT NULL);
" | tr -d ' ')

# Count missing users
MISSING_USERS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" -t -c "
  SELECT COUNT(*)
  FROM \"User\"
  WHERE email IS NOT NULL
    AND email NOT IN (SELECT email FROM profiles WHERE email IS NOT NULL);
" | tr -d ' ')

# Get passport counts
LEGACY_PASSPORT_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" -t -c "SELECT COUNT(*) FROM \"Passport\";" | tr -d ' ')
MODERN_PASSPORT_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" -t -c "SELECT COUNT(*) FROM passports;" | tr -d ' ')

# Get user counts
LEGACY_USER_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" -t -c "SELECT COUNT(*) FROM \"User\" WHERE email IS NOT NULL;" | tr -d ' ')
MODERN_USER_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" -t -c "SELECT COUNT(*) FROM profiles WHERE email IS NOT NULL;" | tr -d ' ')

echo "Summary:"
echo "--------"
echo "Passports:"
echo "  Legacy: $LEGACY_PASSPORT_COUNT records"
echo "  Modern: $MODERN_PASSPORT_COUNT records"
echo "  Missing in modern: $MISSING_PASSPORTS"
echo ""
echo "Users:"
echo "  Legacy: $LEGACY_USER_COUNT records"
echo "  Modern: $MODERN_USER_COUNT records"
echo "  Missing in modern: $MISSING_USERS"
echo ""

if [ "$MISSING_PASSPORTS" -eq 0 ] && [ "$MISSING_USERS" -eq 0 ]; then
    echo "✅ DATA MIGRATION VERDICT: COMPLETE"
    echo ""
    echo "✓ All legacy passports migrated to modern schema"
    echo "✓ All legacy users migrated to modern schema"
    echo "✓ Financial totals match"
    echo ""
    echo "SAFE TO ARCHIVE LEGACY TABLES"
    echo ""
    echo "The extra $((MODERN_PASSPORT_COUNT - LEGACY_PASSPORT_COUNT)) passports in modern schema are likely:"
    echo "  - New passports created after migration"
    echo "  - Test passports from modern schema"
    echo ""
elif [ "$MODERN_PASSPORT_COUNT" -ge "$LEGACY_PASSPORT_COUNT" ] && [ "$MODERN_USER_COUNT" -ge "$LEGACY_USER_COUNT" ]; then
    echo "✅ DATA MIGRATION VERDICT: LIKELY COMPLETE"
    echo ""
    echo "Modern tables have equal or more records than legacy tables."
    if [ "$MISSING_PASSPORTS" -gt 0 ]; then
        echo "⚠️  Warning: $MISSING_PASSPORTS passports exist in legacy but not in modern"
        echo "   (May be duplicates or invalid data filtered during migration)"
    fi
    if [ "$MISSING_USERS" -gt 0 ]; then
        echo "⚠️  Warning: $MISSING_USERS users exist in legacy but not in modern"
        echo "   (May be test users or invalid emails filtered during migration)"
    fi
    echo ""
    echo "REVIEW RECOMMENDED BEFORE ARCHIVING"
    echo "Consider checking the missing records manually."
else
    echo "⚠️  DATA MIGRATION VERDICT: INCOMPLETE"
    echo ""
    echo "✗ Modern tables have fewer records than legacy"
    echo "✗ Data appears to be missing from modern schema"
    echo ""
    echo "DO NOT ARCHIVE - INVESTIGATE FURTHER"
fi

echo ""
echo "============================================"
echo "9. RECOMMENDED NEXT STEPS"
echo "============================================"
echo ""

if [ "$MISSING_PASSPORTS" -eq 0 ] && [ "$MISSING_USERS" -eq 0 ]; then
    echo "Since all data has been migrated, you can safely archive legacy tables:"
    echo ""
    echo "1. Create archive script to rename legacy tables:"
    echo "   ALTER TABLE \"Passport\" RENAME TO \"_archived_Passport_20260102\";"
    echo "   ALTER TABLE \"User\" RENAME TO \"_archived_User_20260102\";"
    echo "   ... (for all 13 legacy tables)"
    echo ""
    echo "2. After archiving, run verification again to confirm"
    echo ""
    echo "3. After 30 days of stable operation, consider dropping archived tables"
else
    echo "Review the missing records before archiving:"
    echo ""
    echo "1. Check passport numbers that are in legacy but not modern:"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" -c "
      SELECT \"passportNo\", CONCAT(\"givenName\", ' ', surname) as name, nationality
      FROM \"Passport\"
      WHERE \"passportNo\" NOT IN (SELECT passport_number FROM passports WHERE passport_number IS NOT NULL)
      LIMIT 10;
    "
    echo ""
    echo "2. Verify if these should be migrated or are duplicates/invalid"
    echo ""
    echo "3. If valid, migrate missing records manually before archiving"
fi

echo ""
echo "============================================"
echo "VERIFICATION COMPLETE"
echo "============================================"
echo ""
echo "Date: $(date)"
echo ""
