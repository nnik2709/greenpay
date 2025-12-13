# Test Data Seeding Instructions

## Quick Commands (Copy & Paste)

### Option 1: Direct SQL (Recommended)

```bash
# Copy SQL file to server
scp seed-test-data.sql root@72.61.208.79:/tmp/

# Connect to server and run SQL
ssh root@72.61.208.79

# On the server, run:
cd /tmp
PGPASSWORD=greenpay2024 psql -h localhost -U greenpay_user -d greenpay_db -f seed-test-data.sql
exit
```

### Option 2: One-liner (if SSH keys are set up)

```bash
ssh root@72.61.208.79 "cd /tmp && PGPASSWORD=greenpay2024 psql -h localhost -U greenpay_user -d greenpay_db" < seed-test-data.sql
```

---

## What Will Be Created

### 📘 Passports (10 total)
- P1234567 - Smith, John (USA)
- P2345678 - Johnson, Sarah (AUS)
- P3456789 - Williams, David (GBR)
- P4567890 - Brown, Emma (CAN)
- P5678901 - Jones, Michael (NZL)
- P6789012 - Garcia, Maria (DEU)
- P7890123 - Martinez, Carlos (FRA)
- P8901234 - Anderson, Lisa (JPN)
- P9012345 - Taylor, Robert (CHN)
- P0123456 - Thomas, Jennifer (IND)

### 🎫 Individual Purchase Vouchers (5 total)
1. **VP-2025-XXXXXX** (P1234567) - Status: active, Payment: Cash
2. **VP-2025-XXXXXX** (P2345678) - Status: active, Payment: EFTPOS
3. **VP-2025-XXXXXX** (P3456789) - Status: active, Payment: Credit Card
4. **VP-2025-XXXXXX** (P4567890) - Status: used, Payment: Cash
5. **VP-2025-XXXXXX** (P5678901) - Status: expired, Payment: EFTPOS

### 📄 Invoices (2 total)
1. **INV-2025-XXXXX** - Amount: 6,875.00 PGK, Status: unpaid
2. **INV-2025-XXXXX** - Amount: 550.00 PGK, Status: paid (with payment record)

### 📋 Quotations
- Updates existing quotations:
  - 1 quotation → approved (linked to invoice)
  - 1 quotation → sent

---

## After Seeding

Run tests to verify:

```bash
npx playwright test tests/new-features --project=chromium --reporter=list
```

**Expected Results:**
- Pass rate should increase from 37% to 80-90%
- Voucher tests will pass
- Invoice tests will pass
- Public registration tests will still need voucher codes (manual step)

---

## Verify Data Was Created

### On Server:

```bash
ssh root@72.61.208.79

# Connect to database
PGPASSWORD=greenpay2024 psql -h localhost -U greenpay_user -d greenpay_db

# Check data
SELECT COUNT(*) FROM "Passport";
SELECT COUNT(*) FROM "IndividualPurchase";
SELECT status, COUNT(*) FROM "IndividualPurchase" GROUP BY status;
SELECT COUNT(*) FROM "Invoice";
SELECT "paymentStatus", COUNT(*) FROM "Invoice" GROUP BY "paymentStatus";

\q
exit
```

---

## Troubleshooting

### If SQL fails with "user ID not found"

The script assumes:
- User ID 3 = agent@greenpay.com (Counter_Agent)
- User ID 2 = finance@greenpay.com (Finance_Manager)

Check actual user IDs:
```sql
SELECT id, email, role FROM "User";
```

Then update the SQL script if needed.

### If columns don't exist

The script uses camelCase column names. If you get "column does not exist" errors, check your schema:
```sql
\d "Passport"
\d "IndividualPurchase"
\d "Invoice"
```

---

## Clean Up Test Data (Optional)

To remove all test data:

```sql
DELETE FROM "IndividualPurchase" WHERE "voucherCode" LIKE 'VP-2025-%';
DELETE FROM "Invoice" WHERE "invoiceNumber" LIKE 'INV-2025-%';
DELETE FROM "Passport" WHERE "passportNo" IN ('P1234567', 'P2345678', 'P3456789', 'P4567890', 'P5678901', 'P6789012', 'P7890123', 'P8901234', 'P9012345', 'P0123456');
```

---

## Files Created

- ✅ `seed-test-data.sql` - Main SQL seeding script
- ✅ `seed-remote-test-data.sh` - Shell script to run remotely
- ✅ `seed-test-data.cjs` - Node.js alternative (requires local DB)
- ✅ `SEED_DATA_INSTRUCTIONS.md` - This file
