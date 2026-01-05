#!/bin/bash

# Check Backend Dependencies on Legacy Tables
# This script identifies which legacy tables are actively used in backend code

echo "============================================"
echo "  BACKEND LEGACY TABLE DEPENDENCY CHECK"
echo "============================================"
echo ""

BACKEND_PATH="/var/www/greenpay/backend"

if [ ! -d "$BACKEND_PATH" ]; then
    echo "ERROR: Backend path not found: $BACKEND_PATH"
    exit 1
fi

echo "Analyzing backend code in: $BACKEND_PATH"
echo "Date: $(date)"
echo ""

echo "============================================"
echo "1. USER TABLE REFERENCES"
echo "============================================"
echo ""
echo "Files referencing \"User\" table:"
grep -rn 'FROM "User"' $BACKEND_PATH --include="*.js" | grep -v node_modules | head -20
echo ""
echo "Total references: $(grep -r 'FROM "User"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l)"
echo ""

echo "============================================"
echo "2. QUOTATION TABLE REFERENCES"
echo "============================================"
echo ""
echo "Files referencing \"Quotation\" table:"
grep -rn 'FROM "Quotation"' $BACKEND_PATH --include="*.js" | grep -v node_modules | head -20
echo ""
echo "Total references: $(grep -r 'FROM "Quotation"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l)"
echo ""

echo "============================================"
echo "3. INVOICE TABLE REFERENCES"
echo "============================================"
echo ""
echo "Files referencing \"Invoice\" table:"
grep -rn 'FROM "Invoice"' $BACKEND_PATH --include="*.js" | grep -v node_modules | head -20
echo ""
echo "Total references: $(grep -r 'FROM "Invoice"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l)"
echo ""

echo "============================================"
echo "4. ROLE TABLE REFERENCES"
echo "============================================"
echo ""
echo "Files referencing \"Role\" table:"
grep -rn 'FROM "Role"' $BACKEND_PATH --include="*.js" | grep -v node_modules | head -20
echo ""
echo "Total references: $(grep -r 'FROM "Role"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l)"
echo ""

echo "============================================"
echo "5. PAYMENTMODE TABLE REFERENCES"
echo "============================================"
echo ""
echo "Files referencing \"PaymentMode\" table:"
grep -rn 'FROM "PaymentMode"' $BACKEND_PATH --include="*.js" | grep -v node_modules | head -20
echo ""
echo "Total references: $(grep -r 'FROM "PaymentMode"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l)"
echo ""

echo "============================================"
echo "6. PASSPORT TABLE REFERENCES (Should be migrated)"
echo "============================================"
echo ""
echo "Files referencing \"Passport\" table (legacy):"
grep -rn 'FROM "Passport"' $BACKEND_PATH --include="*.js" | grep -v node_modules | head -10
echo ""
echo "Total legacy Passport references: $(grep -r 'FROM "Passport"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l)"
echo ""
echo "Files referencing 'passports' table (modern):"
grep -rn 'FROM passports' $BACKEND_PATH --include="*.js" | grep -v node_modules | head -10
echo ""
echo "Total modern passports references: $(grep -r 'FROM passports' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l)"
echo ""

echo "============================================"
echo "7. SUMMARY: LEGACY TABLE USAGE"
echo "============================================"
echo ""
printf "%-25s %10s %s\n" "TABLE" "REFERENCES" "MIGRATION STATUS"
echo "------------------------------------------------------------"
printf "%-25s %10d %s\n" "\"User\"" $(grep -r 'FROM "User"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) "ACTIVE - Keep for auth"
printf "%-25s %10d %s\n" "\"Role\"" $(grep -r 'FROM "Role"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) "ACTIVE - Keep for auth"
printf "%-25s %10d %s\n" "\"Quotation\"" $(grep -r 'FROM "Quotation"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) "PENDING - Need to migrate"
printf "%-25s %10d %s\n" "\"Invoice\"" $(grep -r 'FROM "Invoice"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) "PENDING - Need to migrate"
printf "%-25s %10d %s\n" "\"PaymentMode\"" $(grep -r 'FROM "PaymentMode"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) "ACTIVE - Keep for config"
printf "%-25s %10d %s\n" "\"Passport\" (legacy)" $(grep -r 'FROM "Passport"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) "OBSOLETE - Should use modern"
printf "%-25s %10d %s\n" "passports (modern)" $(grep -r 'FROM passports' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) "ACTIVE - Modern schema"
echo ""

echo "============================================"
echo "8. VERDICT"
echo "============================================"
echo ""

QUOTATION_REFS=$(grep -r 'FROM "Quotation"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l)
INVOICE_REFS=$(grep -r 'FROM "Invoice"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l)
LEGACY_PASSPORT_REFS=$(grep -r 'FROM "Passport"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l)

if [ "$QUOTATION_REFS" -gt 0 ] || [ "$INVOICE_REFS" -gt 0 ]; then
    echo "⚠️  BACKEND CODE STILL USES LEGACY TABLES"
    echo ""
    echo "Action required BEFORE migration:"
    echo "1. Update backend routes/services to use modern 'quotations' table"
    echo "2. Update backend routes/services to use modern 'invoices' table"
    echo "3. Test thoroughly on staging"
    echo "4. Then run migration scripts"
    echo ""
    echo "Migration risk: MEDIUM-HIGH (code changes required)"
else
    echo "✅ BACKEND CODE READY FOR MIGRATION"
    echo ""
    echo "Backend is already using modern tables or ready to switch."
    echo "Safe to proceed with migration scripts."
    echo ""
    echo "Migration risk: LOW (database only)"
fi

if [ "$LEGACY_PASSPORT_REFS" -gt 0 ]; then
    echo ""
    echo "⚠️  WARNING: Backend still has references to legacy \"Passport\" table"
    echo "These should be updated to use modern 'passports' table"
    echo ""
    echo "Files to update:"
    grep -rn 'FROM "Passport"' $BACKEND_PATH --include="*.js" | grep -v node_modules | cut -d: -f1 | sort -u
fi

echo ""
echo "============================================"
echo "ANALYSIS COMPLETE"
echo "============================================"
echo ""
echo "Date: $(date)"
echo ""
