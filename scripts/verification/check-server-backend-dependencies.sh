#!/bin/bash

# Check Backend Dependencies on Production Server
# Run this script on the production server to verify which legacy tables are in use
# Server path: /home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend/

echo "============================================"
echo "  BACKEND LEGACY TABLE DEPENDENCY CHECK"
echo "  Production Server Analysis"
echo "============================================"
echo ""

BACKEND_PATH="/home/eywademo-greenpay/htdocs/greenpay.eywademo.cloud/backend"

if [ ! -d "$BACKEND_PATH" ]; then
    echo "ERROR: Backend path not found: $BACKEND_PATH"
    echo "Please verify the correct backend path on your server."
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
echo "Files referencing \"Quotation\" table (legacy):"
grep -rn 'FROM "Quotation"' $BACKEND_PATH --include="*.js" | grep -v node_modules | head -10
echo ""
echo "Total legacy Quotation references: $(grep -r 'FROM "Quotation"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l)"
echo ""
echo "Files referencing 'quotations' table (modern):"
grep -rn 'FROM quotations' $BACKEND_PATH --include="*.js" | grep -v node_modules | head -10
echo ""
echo "Total modern quotations references: $(grep -r 'FROM quotations' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l)"
echo ""

echo "============================================"
echo "3. INVOICE TABLE REFERENCES"
echo "============================================"
echo ""
echo "Files referencing \"Invoice\" table (legacy):"
grep -rn 'FROM "Invoice"' $BACKEND_PATH --include="*.js" | grep -v node_modules | head -10
echo ""
echo "Total legacy Invoice references: $(grep -r 'FROM "Invoice"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l)"
echo ""
echo "Files referencing 'invoices' table (modern):"
grep -rn 'FROM invoices' $BACKEND_PATH --include="*.js" | grep -v node_modules | head -10
echo ""
echo "Total modern invoices references: $(grep -r 'FROM invoices' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l)"
echo ""

echo "============================================"
echo "4. ROLE TABLE REFERENCES"
echo "============================================"
echo ""
echo "Files referencing \"Role\" table:"
grep -rn 'FROM "Role"' $BACKEND_PATH --include="*.js" | grep -v node_modules | head -10
echo ""
echo "Total references: $(grep -r 'FROM "Role"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l)"
echo ""

echo "============================================"
echo "5. PAYMENTMODE TABLE REFERENCES"
echo "============================================"
echo ""
echo "Files referencing \"PaymentMode\" table (legacy):"
grep -rn 'FROM "PaymentMode"' $BACKEND_PATH --include="*.js" | grep -v node_modules | head -10
echo ""
echo "Total legacy PaymentMode references: $(grep -r 'FROM "PaymentMode"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l)"
echo ""
echo "Files referencing 'payment_modes' table (modern):"
grep -rn 'FROM payment_modes' $BACKEND_PATH --include="*.js" | grep -v node_modules | head -10
echo ""
echo "Total modern payment_modes references: $(grep -r 'FROM payment_modes' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l)"
echo ""

echo "============================================"
echo "6. PASSPORT TABLE REFERENCES"
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
echo "7. OTHER LEGACY TABLE REFERENCES"
echo "============================================"
echo ""
echo "Ticket table:"
grep -rn 'FROM "Ticket"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l
echo ""
echo "TicketResponse table:"
grep -rn 'FROM "TicketResponse"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l
echo ""
echo "VoucherBatch table:"
grep -rn 'FROM "VoucherBatch"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l
echo ""

echo "============================================"
echo "8. SUMMARY: LEGACY TABLE USAGE"
echo "============================================"
echo ""
printf "%-30s %10s %s\n" "TABLE" "REFERENCES" "MIGRATION STATUS"
echo "------------------------------------------------------------------------"
printf "%-30s %10d %s\n" "\"User\"" $(grep -r 'FROM "User"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) "ACTIVE - Keep for auth"
printf "%-30s %10d %s\n" "\"Role\"" $(grep -r 'FROM "Role"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) "ACTIVE - Keep for auth"
printf "%-30s %10d %s\n" "\"Quotation\" (legacy)" $(grep -r 'FROM "Quotation"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) "Check if can archive"
printf "%-30s %10d %s\n" "quotations (modern)" $(grep -r 'FROM quotations' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) "ACTIVE - Modern schema"
printf "%-30s %10d %s\n" "\"Invoice\" (legacy)" $(grep -r 'FROM "Invoice"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) "Check if can archive"
printf "%-30s %10d %s\n" "invoices (modern)" $(grep -r 'FROM invoices' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) "ACTIVE - Modern schema"
printf "%-30s %10d %s\n" "\"PaymentMode\" (legacy)" $(grep -r 'FROM "PaymentMode"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) "Check if can archive"
printf "%-30s %10d %s\n" "payment_modes (modern)" $(grep -r 'FROM payment_modes' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) "ACTIVE - Modern schema"
printf "%-30s %10d %s\n" "\"Passport\" (legacy)" $(grep -r 'FROM "Passport"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) "Check if can archive"
printf "%-30s %10d %s\n" "passports (modern)" $(grep -r 'FROM passports' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l) "ACTIVE - Modern schema"
echo ""

echo "============================================"
echo "9. VERDICT"
echo "============================================"
echo ""

QUOTATION_REFS=$(grep -r 'FROM "Quotation"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l)
INVOICE_REFS=$(grep -r 'FROM "Invoice"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l)
PASSPORT_REFS=$(grep -r 'FROM "Passport"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l)
PAYMENTMODE_REFS=$(grep -r 'FROM "PaymentMode"' $BACKEND_PATH --include="*.js" | grep -v node_modules | wc -l)

echo "Legacy table usage on PRODUCTION SERVER:"
echo ""

if [ "$QUOTATION_REFS" -gt 0 ]; then
    echo "⚠️  \"Quotation\" table: $QUOTATION_REFS references FOUND"
    echo "   Action: Check if migration is needed"
else
    echo "✅ \"Quotation\" table: 0 references"
    echo "   Action: Safe to archive (backend uses modern 'quotations')"
fi
echo ""

if [ "$INVOICE_REFS" -gt 0 ]; then
    echo "⚠️  \"Invoice\" table: $INVOICE_REFS references FOUND"
    echo "   Action: Check if migration is needed"
else
    echo "✅ \"Invoice\" table: 0 references"
    echo "   Action: Safe to archive (backend uses modern 'invoices')"
fi
echo ""

if [ "$PASSPORT_REFS" -gt 0 ]; then
    echo "⚠️  \"Passport\" table: $PASSPORT_REFS references FOUND"
    echo "   Action: Update backend to use modern 'passports' table first"
else
    echo "✅ \"Passport\" table: 0 references"
    echo "   Action: Safe to archive (backend uses modern 'passports')"
fi
echo ""

if [ "$PAYMENTMODE_REFS" -gt 0 ]; then
    echo "⚠️  \"PaymentMode\" table: $PAYMENTMODE_REFS references FOUND"
    echo "   Action: Check if migration is needed or keep as legacy"
else
    echo "✅ \"PaymentMode\" table: 0 references"
    echo "   Action: Safe to archive (backend uses modern 'payment_modes')"
fi
echo ""

echo "============================================"
echo "SUMMARY"
echo "============================================"
echo ""
echo "Tables that are SAFE to archive (0 backend references):"
SAFE_TO_ARCHIVE=0

if [ "$QUOTATION_REFS" -eq 0 ]; then
    echo "  - \"Quotation\""
    SAFE_TO_ARCHIVE=$((SAFE_TO_ARCHIVE + 1))
fi

if [ "$INVOICE_REFS" -eq 0 ]; then
    echo "  - \"Invoice\""
    SAFE_TO_ARCHIVE=$((SAFE_TO_ARCHIVE + 1))
fi

if [ "$PASSPORT_REFS" -eq 0 ]; then
    echo "  - \"Passport\""
    SAFE_TO_ARCHIVE=$((SAFE_TO_ARCHIVE + 1))
fi

if [ "$PAYMENTMODE_REFS" -eq 0 ]; then
    echo "  - \"PaymentMode\""
    SAFE_TO_ARCHIVE=$((SAFE_TO_ARCHIVE + 1))
fi

if [ "$SAFE_TO_ARCHIVE" -eq 0 ]; then
    echo "  None - all legacy tables are still in use"
else
    echo ""
    echo "Total: $SAFE_TO_ARCHIVE tables can be safely archived"
fi

echo ""
echo "Tables that MUST stay (authentication):"
echo "  - \"User\" (required for login)"
echo "  - \"Role\" (required for permissions)"
echo ""

echo "============================================"
echo "ANALYSIS COMPLETE"
echo "============================================"
echo ""
echo "Date: $(date)"
echo ""
