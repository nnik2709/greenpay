# Data Seeding Guide - PNG Green Fees System

## Overview

This guide explains how to use the automated data seeding test suite to populate your PNG Green Fees system with realistic sample data for testing and demonstration purposes.

## What Gets Created

The data seeding process creates a comprehensive dataset across all major system features:

### 📋 **5 Passport Records**
- Diverse international travelers
- Different nationalities: USA, GBR, CHN, IND, ESP
- Various ages and genders
- Realistic passport numbers and expiry dates

| Passport | Name | Nationality | Gender | DOB |
|----------|------|-------------|--------|-----|
| P12345678 | SMITH, JOHN MICHAEL | USA | M | 1985-03-15 |
| P87654321 | JONES, SARAH ELIZABETH | GBR | F | 1990-07-22 |
| P11223344 | CHEN, WEI | CHN | M | 1988-11-10 |
| P55667788 | KUMAR, PRIYA | IND | F | 1992-05-18 |
| P99887766 | GARCIA, CARLOS ANTONIO | ESP | M | 1987-09-25 |

### 🎫 **5 Individual Purchases with Vouchers**
- Linked to passport records
- Different payment modes: CASH, CARD, EFTPOS, BANK_TRANSFER
- Various quantities (1-3 vouchers per purchase)
- Generates corresponding voucher codes

### 💼 **5 Quotations (Mixed Statuses)**

| Customer | Description | Quantity | Price | Status |
|----------|-------------|----------|-------|--------|
| ABC Corporation | Corporate event green fees | 50 | $100 | **Draft** |
| XYZ Tours Ltd | Tourist group package | 30 | $100 | **Sent** |
| Hotel Paradise PNG | Guest vouchers | 100 | $95 | **Approved** |
| International Conference Center | Conference delegates | 75 | $100 | **Sent** |
| PNG Travel Agency | Tourist package | 40 | $100 | **Approved** |

### 🧾 **3 Invoices from Quotations**
- Converted from approved quotations
- Includes PO numbers
- Net 30 payment terms
- Ready for payment processing

### 💰 **3 Payment Records**
- Mix of full and partial payments
- Different payment modes: CASH, CARD, BANK_TRANSFER
- Payment references included
- Creates invoices with different statuses:
  - ✅ Fully Paid
  - ⚠️ Partially Paid
  - ⏳ Pending Payment

### 🎟️ **2 Voucher Batches from Paid Invoices**
- Generated from fully paid invoices
- Bulk voucher creation
- "Vouchers Generated" badges on invoices

### 🎫 **8 Support Tickets**

| Title | Category | Priority | Status |
|-------|----------|----------|--------|
| Voucher printing not working | Technical | 🔴 High | Open |
| Unable to approve quotations | Technical | 🔴 Critical | Open |
| Request for bulk upload template | General | 🟢 Low | Open |
| Invoice email not received | Technical | 🟡 Medium | In Progress |
| Payment mode configuration | General | 🟡 Medium | Open |
| Passport data validation error | Technical | 🟡 Medium | Resolved |
| Report export timeout | Technical | 🟢 Low | Open |
| User role permissions question | General | 🟢 Low | Resolved |

## How to Run Data Seeding

### Prerequisites

1. **Development server must be running:**
   ```bash
   npm run dev
   ```
   Server should be accessible at http://localhost:3000

2. **Test users must exist in database:**
   - flexadmin@greenpay.com (password: test123)
   - finance@greenpay.com (password: test123)
   - agent@greenpay.com (password: test123)
   - support@greenpay.com (password: support123)

3. **Playwright browsers installed:**
   ```bash
   npx playwright install chromium
   ```

### Quick Start

Run the automated seeding script:

```bash
./run-data-seeding.sh
```

This will:
1. Authenticate with appropriate roles
2. Create passports
3. Create individual purchases and vouchers
4. Create quotations in various statuses
5. Convert quotations to invoices
6. Record payments
7. Generate vouchers from paid invoices
8. Create support tickets

### Manual Seeding (Individual Tests)

You can run individual seeding tests if you only need specific data:

```bash
# Run specific seeding test
npx playwright test tests/data-seeding/01-seed-passports.spec.ts

# Run all seeding tests
npx playwright test tests/data-seeding --reporter=list
```

## Data Seeding Test Files

### 1. **01-seed-passports.spec.ts**
**Creates:** 5 passport records
**Runs as:** Counter_Agent or Flex_Admin
**Time:** ~30 seconds

```bash
npx playwright test tests/data-seeding/01-seed-passports.spec.ts
```

### 2. **02-seed-individual-purchases.spec.ts**
**Creates:** 5 individual purchases with vouchers
**Runs as:** Counter_Agent or Flex_Admin
**Depends on:** Passports from test 01
**Time:** ~45 seconds

```bash
npx playwright test tests/data-seeding/02-seed-individual-purchases.spec.ts
```

### 3. **03-seed-quotations.spec.ts**
**Creates:** 5 quotations with different statuses
**Runs as:** Finance_Manager or Flex_Admin
**Time:** ~60 seconds

```bash
npx playwright test tests/data-seeding/03-seed-quotations.spec.ts
```

### 4. **04-seed-invoices-payments.spec.ts**
**Creates:** 3 invoices, 3 payments, 2 voucher batches
**Runs as:** Finance_Manager or Flex_Admin
**Depends on:** Approved quotations from test 03
**Time:** ~90 seconds

```bash
npx playwright test tests/data-seeding/04-seed-invoices-payments.spec.ts
```

### 5. **05-seed-support-tickets.spec.ts**
**Creates:** 8 support tickets
**Runs as:** IT_Support or Flex_Admin
**Time:** ~60 seconds

```bash
npx playwright test tests/data-seeding/05-seed-support-tickets.spec.ts
```

## Verification

After seeding, verify the data was created:

### Check via Web UI

Visit these pages to see the seeded data:

- **Passports:** http://localhost:3000/passports
- **Individual Purchases:** http://localhost:3000/individual-purchase
- **Vouchers:** http://localhost:3000/vouchers
- **Quotations:** http://localhost:3000/quotations
- **Invoices:** http://localhost:3000/invoices
- **Support Tickets:** http://localhost:3000/tickets

### Check via Feature Tests

Run the feature tests to verify everything works:

```bash
# Run all new feature tests
npx playwright test tests/new-features --reporter=list

# Run specific feature tests
npx playwright test tests/new-features/quotation-pdf-download.spec.ts
npx playwright test tests/new-features/invoice-workflow.spec.ts
npx playwright test tests/new-features/passport-green-card-receipt.spec.ts
```

## What Each Test Validates

### Passport Seeding ✅
- Form field mapping is correct
- Passport data validation works
- Records are created in database
- Passports appear in listings

### Individual Purchase Seeding ✅
- Passport lookup works
- Payment mode selection works
- Voucher generation triggers
- Print buttons appear
- Green Card receipt option available

### Quotation Seeding ✅
- Customer data entry works
- Pricing calculations work
- Status workflow (draft → sent → approved)
- Status badges display correctly
- Quotation listing displays data

### Invoice & Payment Seeding ✅
- Quotation-to-invoice conversion works
- Invoice number generation works
- Payment recording works
- Payment status updates (pending → partial → paid)
- Voucher generation from invoices works
- "Vouchers Generated" badges appear

### Support Ticket Seeding ✅
- Ticket creation works
- Priority assignment works
- Category assignment works
- Status workflow works
- Ticket listing displays correctly

## Customization

You can modify the sample data in each test file:

### Example: Add More Passports

Edit `tests/data-seeding/01-seed-passports.spec.ts`:

```typescript
const samplePassports = [
  // ... existing passports
  {
    passportNumber: 'P12121212',
    surname: 'YOUR_SURNAME',
    givenName: 'YOUR_NAME',
    nationality: 'AUS',
    dob: '1995-06-15',
    gender: 'F',
    expiryDate: '2032-01-01'
  }
];
```

### Example: Add More Quotations

Edit `tests/data-seeding/03-seed-quotations.spec.ts`:

```typescript
const sampleQuotations = [
  // ... existing quotations
  {
    customerName: 'Your Company Name',
    customerEmail: 'your@email.com',
    customerPhone: '+675 XXX XXXX',
    description: 'Your service description',
    quantity: 25,
    unitPrice: 100,
    status: 'draft',
    notes: 'Your notes here'
  }
];
```

## Troubleshooting

### Data Already Exists

If you run the seeding script multiple times, some records may fail to create because they already exist (e.g., duplicate passport numbers). This is expected and safe - the script will log warnings but continue.

### Authentication Failures

If authentication fails:
1. Verify test users exist in database
2. Check passwords match the credentials in auth setup files
3. Ensure development server is running
4. Clear browser cache/storage: `rm -rf playwright/.auth/*`

### Form Field Not Found

If a test reports "element not found":
1. Check the page structure matches expectations
2. Update the locator in the test file
3. Increase wait timeouts if page loads slowly

### Tests Timing Out

If tests timeout:
1. Increase timeout in test file
2. Check network connectivity
3. Verify server is responsive

## Best Practices

### 1. Run Seeding on Fresh Database
For cleanest results, run seeding on a fresh/empty database.

### 2. Run Tests Sequentially
The seeding script runs tests in order because later tests depend on earlier data (e.g., purchases depend on passports).

### 3. Review Logs
Check the console output for warnings about data that may have failed to create.

### 4. Verify After Seeding
Always visit the web UI to visually confirm data was created correctly.

### 5. Re-run as Needed
You can safely re-run seeding tests. Existing data will be skipped, new data will be added.

## Integration with Feature Tests

After seeding data, all feature tests should pass because they now have data to work with:

```bash
# These tests now have data
npx playwright test tests/new-features/quotation-pdf-download.spec.ts
# ✅ Download PDF buttons will have quotations to download

npx playwright test tests/new-features/invoice-workflow.spec.ts
# ✅ Invoices exist for testing workflow

npx playwright test tests/new-features/passport-green-card-receipt.spec.ts
# ✅ Vouchers exist for Green Card printing
```

## Cleanup

To remove seeded data and start fresh:

1. **Via Database:** Truncate tables (if you have database access)
2. **Via UI:** Manually delete records from each page
3. **Via API:** Use API endpoints to delete records (if implemented)

## Summary

The data seeding system provides:
- ✅ Automated population of realistic sample data
- ✅ Coverage of all major system features
- ✅ Data for testing complete workflows
- ✅ Demonstration-ready dataset
- ✅ Easy customization and extension

**Total Setup Time:** ~5 minutes
**Data Created:** 30+ records across 7 feature areas
**Manual Work Saved:** Hours of data entry

Run `./run-data-seeding.sh` to get started!
