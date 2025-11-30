# Test Errors Summary & Solutions

## Main Issue: Authentication Setup Conflict

### Problem
The tests are failing because there are **two authentication setup systems**:

1. **Old Setup** (`tests/auth.setup.ts`) - Uses `admin@example.com` which doesn't exist ❌
2. **New Role-Based Setups** (`tests/auth-*.setup.ts`) - Use correct test accounts ✅

When Playwright runs, it tries to use the old setup file by default, which fails with "Invalid credentials".

## Errors Found

### 1. Authentication Failures (Most Common)
```
Error: Still on login page - authentication may have failed silently
Error: Invalid credentials
```

**Cause:** Old `auth.setup.ts` tries to login with `admin@example.com` which doesn't exist

**Solution:** Use the new role-specific auth files instead

### 2. Page Access Denied
```
Error: expect(locator).toBeVisible() failed
Locator: text=/quotation/i
Expected: visible
Received: <element(s) not found>
```

**Cause:** Tests are redirected to login page because authentication failed

**Solution:** Fix authentication first

### 3. Missing Data Warnings (Expected)
```
⚠ No quotations found to test PDF download
⚠ No approved quotations to convert
⚠ No invoices found
```

**Cause:** Database is empty (no sample data)

**Solution:** Run data seeding tests first

## Solutions

### Option 1: Update Playwright Config (Recommended)

Update `playwright.config.ts` to disable the old auth setup:

```typescript
projects: [
  // OLD - Comment this out
  // {
  //   name: 'setup',
  //   testMatch: /.*\.setup\.ts/,
  // },

  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      // Don't use old auth state
      // storageState: 'playwright/.auth/user.json',
    },
    // Don't depend on old setup
    // dependencies: ['setup'],
  },
  // ... other projects
]
```

### Option 2: Fix Old Auth Setup File

Update `tests/auth.setup.ts` to use correct credentials:

```typescript
// Change from:
await page.locator('input#email').fill('admin@example.com');
await page.locator('input#password').fill('admin123');

// To:
await page.locator('input#email').fill('flexadmin@greenpay.com');
await page.locator('input#password').fill('test123');
```

### Option 3: Run Tests with Specific Auth (Easiest)

Run tests with the correct role-specific authentication:

```bash
# First, authenticate as the role you need
npx playwright test tests/auth-flex-admin.setup.ts

# Then run your tests
npx playwright test tests/new-features --reporter=list
```

## Step-by-Step Fix Guide

### Step 1: Fix Authentication

**Choose ONE of these approaches:**

#### A. Quick Fix - Update Old Auth File
```bash
# Edit tests/auth.setup.ts
# Change line 38 from:
  await page.locator('input#email').fill('admin@example.com');
# To:
  await page.locator('input#email').fill('flexadmin@greenpay.com');
```

#### B. Better Fix - Use Role-Specific Auth
```bash
# Run individual role auth setups before tests
npx playwright test tests/auth-flex-admin.setup.ts
npx playwright test tests/auth-finance-manager.setup.ts
npx playwright test tests/auth-counter-agent.setup.ts
npx playwright test tests/auth-it-support.setup.ts
```

### Step 2: Seed Sample Data

Run data seeding to create test data:

```bash
./run-data-seeding.sh
```

Or run individual seeding tests:

```bash
npx playwright test tests/data-seeding/01-seed-passports.spec.ts
npx playwright test tests/data-seeding/02-seed-individual-purchases.spec.ts
npx playwright test tests/data-seeding/03-seed-quotations.spec.ts
npx playwright test tests/data-seeding/04-seed-invoices-payments.spec.ts
npx playwright test tests/data-seeding/05-seed-support-tickets.spec.ts
```

### Step 3: Run Feature Tests

After fixing auth and seeding data:

```bash
# Run all tests
npx playwright test tests/new-features --reporter=list

# Or run specific tests
npx playwright test tests/new-features/quotation-pdf-download.spec.ts
npx playwright test tests/new-features/invoice-workflow.spec.ts
```

## Test Results Analysis

Based on the error artifacts, here's what failed:

### ❌ Failed Tests (Authentication Issues)
- Role-Based Access tests (can't access pages without login)
- Page navigation tests (redirected to login)
- Button visibility tests (can't see buttons on login page)

### ✅ Passed Tests (Independent of Auth)
- Component rendering tests
- Console error checks
- Tests that run on accessible pages

### ⚠️ Skipped Tests (Missing Data)
- Tests marked with `test.skip()` (expected)
- Tests that require data (will pass after seeding)

## Quick Test Commands

### Test Individual Features (After Auth Fix)

```bash
# Quotation PDF Download
npx playwright test tests/new-features/quotation-pdf-download.spec.ts \
  --reporter=list

# Invoice Workflow
npx playwright test tests/new-features/invoice-workflow.spec.ts \
  --reporter=list

# Passport Green Card
npx playwright test tests/new-features/passport-green-card-receipt.spec.ts \
  --reporter=list

# Role-Based Access
npx playwright test tests/new-features/role-based-access.spec.ts \
  --reporter=list
```

### Run Data Seeding

```bash
# All seeding tests
./run-data-seeding.sh

# Individual seeding tests
npx playwright test tests/data-seeding/01-seed-passports.spec.ts
npx playwright test tests/data-seeding/02-seed-individual-purchases.spec.ts
npx playwright test tests/data-seeding/03-seed-quotations.spec.ts
```

## Expected Test Behavior

### Before Data Seeding
- ✅ Component rendering tests pass
- ✅ Console error tests pass
- ⚠️ Button visibility tests show "No data found" (expected)
- ⚠️ Feature workflow tests skip (expected)

### After Data Seeding
- ✅ All component tests pass
- ✅ Button visibility tests pass (buttons appear with data)
- ✅ Feature workflow tests can run
- ✅ Role-based access tests pass

## Common Error Patterns

### Error: "Invalid credentials"
**Meaning:** Wrong email/password in auth setup
**Fix:** Use correct test account credentials

### Error: "Still on login page"
**Meaning:** Login failed, didn't navigate away
**Fix:** Check network connectivity, verify credentials

### Error: "expect(locator).toBeVisible() failed"
**Meaning:** Element not found (usually redirected to login)
**Fix:** Fix authentication first

### Warning: "No X found to test"
**Meaning:** Database is empty
**Fix:** Run data seeding tests

### Info: "test.skip()"
**Meaning:** Test intentionally skipped (requires data)
**Fix:** This is expected behavior

## Recommended Testing Workflow

```bash
# 1. Fix authentication (choose one method above)
npx playwright test tests/auth-flex-admin.setup.ts

# 2. Seed data
./run-data-seeding.sh

# 3. Run feature tests
npx playwright test tests/new-features --reporter=html

# 4. View results
npx playwright show-report
```

## Summary

**Main Issue:** Old authentication setup using wrong credentials
**Quick Fix:** Use new role-specific auth files
**Complete Fix:** Update `auth.setup.ts` or `playwright.config.ts`
**Data Issue:** Run data seeding tests to populate database

Once authentication is fixed and data is seeded, all tests should pass!

## Next Steps

1. ✅ Choose and apply ONE of the auth fix options above
2. ✅ Run data seeding script
3. ✅ Run feature tests
4. ✅ Review HTML report for any remaining issues

The test infrastructure is solid - we just need to use the correct authentication method!
