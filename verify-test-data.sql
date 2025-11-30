-- Verify Test Data Was Created Successfully

\echo '========================================='
\echo 'Test Data Verification'
\echo '========================================='
\echo ''

\echo '📘 PASSPORTS:'
SELECT COUNT(*) as total_passports FROM "Passport";
SELECT "passportNo", surname, "givenName", nationality FROM "Passport" WHERE "passportNo" LIKE 'P%' ORDER BY id DESC LIMIT 10;

\echo ''
\echo '🎫 INDIVIDUAL PURCHASES / VOUCHERS:'
SELECT COUNT(*) as total_vouchers FROM "IndividualPurchase";
SELECT status, COUNT(*) as count FROM "IndividualPurchase" GROUP BY status ORDER BY status;
SELECT "voucherCode", status, amount, "validFrom", "validUntil" FROM "IndividualPurchase" ORDER BY id DESC LIMIT 5;

\echo ''
\echo '📄 INVOICES:'
SELECT COUNT(*) as total_invoices FROM "Invoice";
SELECT "invoiceNumber", "totalAmount", "paidAmount", "paymentStatus", "vouchersGenerated" FROM "Invoice" ORDER BY id DESC;

\echo ''
\echo '📋 QUOTATIONS:'
SELECT COUNT(*) as total_quotations FROM "Quotation";
SELECT status, COUNT(*) as count FROM "Quotation" GROUP BY status ORDER BY status;

\echo ''
\echo '========================================='
\echo 'Summary:'
\echo '========================================='
SELECT
  (SELECT COUNT(*) FROM "Passport") as passports,
  (SELECT COUNT(*) FROM "IndividualPurchase") as vouchers,
  (SELECT COUNT(*) FROM "Invoice") as invoices,
  (SELECT COUNT(*) FROM "Quotation") as quotations;
