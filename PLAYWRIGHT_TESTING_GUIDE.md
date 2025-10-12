# Playwright Testing Guide - PNG Green Fees System

## Overview

This guide provides comprehensive documentation for running and maintaining the Playwright test suite for the PNG Green Fees System.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Test Structure](#test-structure)
4. [Running Tests](#running-tests)
5. [Test Configuration](#test-configuration)
6. [Writing Tests](#writing-tests)
7. [Test Data](#test-data)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)
10. [CI/CD Integration](#cicd-integration)

---

## Prerequisites

### Required Software

- **Node.js**: v18+ (LTS recommended)
- **npm**: v9+ (comes with Node.js)
- **Browser Support**: Chromium, Firefox, WebKit (auto-installed by Playwright)

### Environment Setup

1. **Supabase Project**: Active Supabase project with database schema deployed
2. **Environment Variables**: `.env` file with required credentials
3. **Test User**: At least one test user account created in the database

### Environment Variables

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Optional test configuration
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

---

## Installation

### 1. Install Dependencies

```bash
# Install all project dependencies including Playwright
npm install

# Install Playwright browsers
npx playwright install
```

### 2. Verify Installation

```bash
# Check Playwright installation
npx playwright --version

# Should output: Version 1.55.1
```

### 3. Create Auth Directory

```bash
# Create directory for authentication state
mkdir -p playwright/.auth
```

---

## Test Structure

### Directory Layout

```
tests/
├── auth.setup.ts                 # Authentication setup (runs first)
├── utils/
│   └── helpers.ts                # Reusable helper functions
├── fixtures/
│   └── test-data.ts              # Test data and fixtures
├── phase-1/                      # Core functionality tests
│   ├── 01-dashboard.spec.ts
│   ├── 02-individual-purchase.spec.ts
│   ├── 03-bulk-upload.spec.ts
│   ├── 04-corporate-vouchers.spec.ts
│   ├── 05-quotations.spec.ts
│   ├── 06-reports.spec.ts
│   └── 07-cash-reconciliation.spec.ts
├── phase-2/                      # Advanced features
│   ├── 07-user-management.spec.ts
│   └── 08-passport-edit.spec.ts
├── phase-3/                      # QR scanning
│   └── 09-qr-scanning.spec.ts
├── phase-4/                      # Admin features
│   └── 10-admin-settings.spec.ts
└── integration/                  # End-to-end tests
    ├── end-to-end-flow.spec.ts
    └── reports-advanced.spec.ts
```

### Test Categories

1. **Setup Tests** (`auth.setup.ts`): Authentication and session management
2. **Phase Tests** (`phase-*/`): Feature-specific test suites
3. **Integration Tests** (`integration/`): Cross-feature workflows
4. **Utility Tests**: Helper function and component tests

---

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in UI mode (interactive)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run specific test file
npx playwright test tests/phase-1/01-dashboard.spec.ts

# Run tests matching pattern
npx playwright test --grep "Cash Reconciliation"

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Environment-Specific Tests

```bash
# Test against local development server
npm run test:local

# Test against remote/production server
npm run test:remote
npm run test:production
```

### Test Reports

```bash
# View HTML test report
npm run test:report

# This opens the report in your default browser
```

### Debug Mode

```bash
# Run tests in debug mode
npx playwright test --debug

# Debug specific test
npx playwright test tests/phase-1/01-dashboard.spec.ts --debug

# Run with trace enabled
npx playwright test --trace on
```

---

## Test Configuration

### Playwright Config (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    { 
      name: 'chromium', 
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup']
    },
    // ... other browsers
  ],
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  }
});
```

### Key Configuration Options

- **testDir**: Root directory for tests
- **fullyParallel**: Run tests in parallel for speed
- **retries**: Retry failed tests (useful in CI)
- **workers**: Number of parallel workers
- **baseURL**: Base URL for all page navigations
- **trace**: When to collect execution traces
- **screenshot/video**: Capture on failure for debugging
- **actionTimeout**: Max time for single action
- **navigationTimeout**: Max time for page navigation

---

## Writing Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { waitForPageLoad, fillFormField } from '../utils/helpers';

test.describe('Feature Name', () => {
  test('should perform specific action', async ({ page }) => {
    // Arrange: Navigate and setup
    await page.goto('/path');
    await waitForPageLoad(page);
    
    // Act: Perform actions
    await fillFormField(page, 'input[name="field"]', 'value');
    await page.click('button:has-text("Submit")');
    
    // Assert: Verify results
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

### Using Helper Functions

```typescript
import {
  checkConsoleErrors,      // Monitor console errors
  checkNetworkErrors,       // Monitor network failures
  checkDatabaseErrors,      // Monitor database errors
  waitForPageLoad,          // Wait for page to fully load
  fillFormField,            // Fill form field reliably
  waitForToast,             // Wait for toast notifications
  testData,                 // Generate test data
  getTableRowCount,         // Count table rows
  selectDropdownOption,     // Select from dropdown
  uploadFile,               // Upload files
  retryAction               // Retry with backoff
} from '../utils/helpers';

// Example usage
test('example test', async ({ page }) => {
  const consoleChecker = await checkConsoleErrors(page);
  const networkChecker = await checkNetworkErrors(page);
  
  await page.goto('/page');
  await waitForPageLoad(page);
  
  // Your test code...
  
  // Verify no errors
  consoleChecker.assertNoErrors();
  networkChecker.assertNoErrors();
});
```

### Test Data Generation

```typescript
import { testData } from '../fixtures/test-data';

test('should create passport', async ({ page }) => {
  // Generate random data
  const passport = {
    number: testData.randomPassportNumber(),
    email: testData.randomEmail(),
    company: testData.randomCompanyName(),
    name: testData.randomName(),
    nationality: testData.randomNationality(),
    futureDate: testData.futureDate(365),
    pastDate: testData.pastDate(365)
  };
  
  // Use in test...
});
```

### Best Practices for Writing Tests

1. **Use Descriptive Test Names**: Clear, specific descriptions
2. **Follow AAA Pattern**: Arrange, Act, Assert
3. **Use Page Object Patterns**: For complex pages
4. **Keep Tests Independent**: No dependencies between tests
5. **Use Meaningful Selectors**: Prefer data-testid or semantic selectors
6. **Handle Async Operations**: Always await async operations
7. **Add Timeouts**: Don't rely on default timeouts
8. **Check for Errors**: Use error checker helpers
9. **Clean Up**: Remove test data after tests (when possible)
10. **Document Expected Failures**: Use `test.skip()` with comments

---

## Test Data

### Predefined Test Users

Located in `tests/fixtures/test-data.ts`:

```typescript
export const testUsers = {
  admin: {
    email: 'admin@greenfees.test',
    password: 'Admin@123',
    role: 'Flex_Admin'
  },
  counterAgent: {
    email: 'agent@greenfees.test',
    password: 'Agent@123',
    role: 'Counter_Agent'
  },
  financeManager: {
    email: 'finance@greenfees.test',
    password: 'Finance@123',
    role: 'Finance_Manager'
  }
};
```

### Creating Test Users

Use the SQL script in `create-test-users.sql` to create test users in your Supabase database.

### Test Data Generators

```typescript
testData.randomEmail()              // test-1234567890@example.com
testData.randomPassportNumber()     // TESTabc123de
testData.randomCompanyName()        // Test Company 1234567890
testData.randomName()               // { firstName: 'John', lastName: 'Smith' }
testData.randomNationality()        // Australian, American, British, etc.
testData.futureDate(30)             // Date 30 days from now
testData.pastDate(365)              // Date 365 days ago
```

---

## Troubleshooting

### Common Issues

#### 1. Authentication Fails

**Problem**: Tests fail because authentication setup didn't complete

**Solution**:
```bash
# Delete existing auth state and retry
rm -rf playwright/.auth
npx playwright test --project=setup

# Update credentials in tests/auth.setup.ts if needed
```

#### 2. Tests Timeout

**Problem**: Tests timeout waiting for elements

**Solution**:
- Increase timeout in `playwright.config.ts`
- Check if application is running
- Verify network connectivity
- Use `await page.waitForLoadState('networkidle')`

#### 3. Selector Not Found

**Problem**: `Error: locator.click: Timeout 30000ms exceeded`

**Solution**:
```typescript
// Use more flexible selectors
await page.click('button:has-text("Submit")').or(page.click('button[type="submit"]'));

// Wait for element to be visible first
await page.waitForSelector('button:has-text("Submit")', { state: 'visible' });
await page.click('button:has-text("Submit")');

// Use timeout option
await page.click('button:has-text("Submit")', { timeout: 60000 });
```

#### 4. Browser Not Installed

**Problem**: `browserType.launch: Executable doesn't exist`

**Solution**:
```bash
npx playwright install chromium
# or install all browsers
npx playwright install
```

#### 5. Database Connection Issues

**Problem**: Tests fail with Supabase connection errors

**Solution**:
- Verify `.env` file exists with correct credentials
- Check Supabase project is active
- Verify RLS policies allow test user access
- Check database schema is up to date

#### 6. Flaky Tests

**Problem**: Tests pass sometimes, fail other times

**Solution**:
```typescript
// Add explicit waits
await page.waitForTimeout(1000);

// Wait for network to settle
await page.waitForLoadState('networkidle');

// Use retry logic
import { retryAction } from '../utils/helpers';
await retryAction(async () => {
  await page.click('button');
}, 3);

// Use soft assertions for non-critical checks
await expect.soft(page.locator('text=Optional')).toBeVisible();
```

### Debug Techniques

#### 1. Visual Debugging

```bash
# Run in headed mode to see browser
npx playwright test --headed --slowmo=1000

# Run in UI mode for interactive debugging
npm run test:ui
```

#### 2. Screenshots and Videos

```typescript
// Take manual screenshot
await page.screenshot({ path: 'debug-screenshot.png' });

// Videos and screenshots on failure are automatic (configured in config)
```

#### 3. Console Logging

```typescript
// Log page content
console.log(await page.content());

// Log element text
console.log(await page.locator('h1').textContent());

// Log all console messages
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
```

#### 4. Trace Viewer

```bash
# Run with trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

---

## Best Practices

### 1. Test Organization

- Group related tests using `test.describe()`
- Use meaningful test names
- Keep tests focused (one assertion per test when possible)
- Use setup/teardown hooks appropriately

### 2. Selectors

**Priority order:**
1. `data-testid` attributes
2. ARIA roles and labels
3. Semantic HTML elements
4. Text content
5. CSS classes (last resort)

```typescript
// Good selectors
await page.locator('[data-testid="submit-button"]').click();
await page.getByRole('button', { name: 'Submit' }).click();
await page.locator('button:has-text("Submit")').click();

// Avoid (brittle)
await page.locator('.btn.btn-primary.btn-lg').click();
await page.locator('#button-123').click();
```

### 3. Waiting Strategies

```typescript
// Wait for navigation
await page.waitForURL('**/dashboard');

// Wait for network
await page.waitForLoadState('networkidle');

// Wait for specific request
await page.waitForResponse(response => 
  response.url().includes('api') && response.status() === 200
);

// Wait for element
await page.waitForSelector('text=Success', { state: 'visible' });
```

### 4. Error Handling

```typescript
// Use try-catch for optional actions
try {
  await page.click('button:has-text("Close")', { timeout: 2000 });
} catch {
  // Dialog may not have appeared, continue
}

// Use conditional logic
if (await page.locator('button').isVisible({ timeout: 1000 })) {
  await page.click('button');
}

// Use OR selector for alternatives
await page.locator('button:has-text("Submit")')
  .or(page.locator('button[type="submit"]'))
  .click();
```

### 5. Performance

- Run tests in parallel when possible
- Reuse authentication state
- Use `page.route()` to mock slow API calls
- Skip unnecessary waits
- Use `page.goto()` with `waitUntil: 'domcontentloaded'` for faster navigation

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Playwright Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - uses: actions/setup-node@v3
      with:
        node-version: 18
        
    - name: Install dependencies
      run: npm ci
      
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
      
    - name: Run Playwright tests
      run: npm test
      env:
        VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        
    - uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

### GitLab CI Example

```yaml
test:
  image: mcr.microsoft.com/playwright:v1.55.1-focal
  stage: test
  script:
    - npm ci
    - npx playwright install
    - npm test
  artifacts:
    when: always
    paths:
      - playwright-report/
    expire_in: 30 days
  variables:
    VITE_SUPABASE_URL: $SUPABASE_URL
    VITE_SUPABASE_ANON_KEY: $SUPABASE_ANON_KEY
```

---

## Test Coverage

### Current Test Coverage

#### Phase 1: Core Features
- ✅ Dashboard (100%)
- ✅ Individual Purchase (100%)
- ⚠️ Bulk Upload (75% - backend pending)
- ✅ Corporate Vouchers (100%)
- ⚠️ Quotations (70% - workflow pending)
- ⚠️ Reports (80% - real data pending)
- ✅ Cash Reconciliation (100%)

#### Phase 2: Advanced Features
- ⚠️ User Management (60%)
- ❌ Passport Editing (0% - not implemented)

#### Phase 3: QR Scanning
- ✅ QR Scanning (100%)

#### Phase 4: Admin Features
- ⚠️ Admin Settings (50%)

#### Integration Tests
- ✅ End-to-End Flows (100%)
- ✅ Reports Advanced (100%)

### Legend
- ✅ Fully tested
- ⚠️ Partially tested
- ❌ Not tested / Not implemented

---

## Maintenance

### Updating Tests

When application changes:

1. Update test fixtures if data model changes
2. Update selectors if UI changes
3. Update expected behavior if functionality changes
4. Add new tests for new features
5. Remove obsolete tests

### Regular Maintenance Tasks

- Review and update test data monthly
- Check for deprecated Playwright APIs
- Update browser versions
- Review flaky tests and fix
- Update documentation

---

## Resources

### Official Documentation

- [Playwright Documentation](https://playwright.dev)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices Guide](https://playwright.dev/docs/best-practices)

### Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Testing Best Practices](https://martinfowler.com/articles/practical-test-pyramid.html)

---

## Support

### Getting Help

1. Check this guide first
2. Review test examples in `tests/` directory
3. Check Playwright documentation
4. Review project README files
5. Contact development team

### Reporting Issues

When reporting test failures:

1. Include full error message
2. Include test file and line number
3. Include steps to reproduce
4. Include screenshots/videos if available
5. Include trace file if possible
6. Include environment details (OS, Node version, etc.)

---

## Appendix

### Keyboard Shortcuts (UI Mode)

- `Space`: Run/pause test
- `F5`: Reload
- `F12`: Open DevTools
- `Ctrl+L`: Clear
- `Ctrl+P`: Pick locator

### Useful Playwright Commands

```bash
# Generate test from recorded actions
npx playwright codegen http://localhost:3000

# Show installed browsers
npx playwright list-browsers

# Update Playwright
npm install -D @playwright/test@latest
npx playwright install

# Clear cache
rm -rf node_modules/.cache/playwright
```

---

## Conclusion

This testing guide provides a comprehensive foundation for working with the Playwright test suite. Keep tests updated, maintain high coverage, and always verify changes with tests before deployment.

**Happy Testing! 🎭**


