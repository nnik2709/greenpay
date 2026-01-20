# User Guide Flow Tests

Comprehensive automated tests based on the user guides in `docs/user-guides/`. These tests verify all workflows described in the user documentation and capture screenshots at each step.

---

## Test Files

### ✅ Counter Agent Tests
**File**: `counter-agent-complete-flow.spec.ts`

**Based on**: `docs/user-guides/COUNTER_AGENT_USER_GUIDE.md`

**Test Coverage**:
- Workflow A: Standard Walk-In Customer (Individual Purchase)
  - Navigate to Individual Green Pass
  - Scan passport with MRZ scanner (simulated)
  - Select payment method (Cash)
  - Process payment
  - Verify voucher generation
  - Print voucher
  - Email voucher to customer
  - Process new payment

- Workflow B: Validate Existing Voucher
  - Navigate to Scan & Validate
  - Scan voucher barcode
  - Review validation results

- Workflow C: Add Passport to Corporate Voucher
  - Navigate to voucher registration
  - Scan voucher barcode
  - Scan passport
  - Register passport to voucher

- Workflow D: End of Shift Cash Reconciliation
  - Navigate to Cash Reconciliation
  - Enter date and opening float
  - Load transactions
  - Enter cash denomination counts
  - Add reconciliation notes
  - Review summary
  - Submit reconciliation

- Navigation Tests:
  - All Passports view
  - Vouchers List view
  - User menu (Change Password)
  - Logout flow

**Screenshots**: ~50+ screenshots captured in `test-screenshots/user-guide-flows/counter-agent/`

---

### ✅ Finance Manager Tests
**File**: `finance-manager-complete-flow.spec.ts`

**Based on**: `docs/user-guides/FINANCE_MANAGER_USER_GUIDE.md`

**Test Coverage**:
- Workflow A: Corporate Quotation to Vouchers (Full Process)
  - Create new quotation
  - Enter customer information
  - Add line items with pricing
  - Save and send quotation
  - Convert quotation to invoice
  - Record payment received
  - Generate corporate voucher batch
  - Download voucher batch

- Workflow B: Monthly Financial Reporting
  - Generate Revenue Generated Report
  - Generate Corporate Voucher Report
  - Generate Individual Purchase Report
  - Apply filters and date ranges
  - Export reports

- Workflow C: Review and Approve Cash Reconciliations
  - View pending reconciliations
  - Review reconciliation details
  - Check denomination breakdown
  - Approve reconciliation with notes

- Navigation Tests:
  - View all payments
  - Customer management
  - Vouchers list with filters

**Screenshots**: ~40+ screenshots captured in `test-screenshots/user-guide-flows/finance-manager/`

---

### ✅ Flex Admin Tests
**File**: `flex-admin-complete-flow.spec.ts`

**Based on**: `docs/user-guides/FLEX_ADMIN_USER_GUIDE.md`

**Test Coverage**:
- Workflow A: User Management - Complete Cycle
  - Navigate to Users page
  - Create new user with all details
  - Edit user information
  - Reset user password
  - View user activity log
  - Deactivate user account

- Workflow B: System Settings Configuration
  - Navigate through all settings tabs
  - Review General, Email/SMTP, Security, Payment Gateway, Backup, API settings
  - Make configuration changes
  - Save settings

- Workflow C: Payment Modes Configuration
  - View existing payment modes
  - Add new payment mode
  - Configure payment mode details
  - Enable/disable payment modes

- Workflow D: Email Templates Management
  - View all email templates
  - Edit existing templates
  - Review template variables
  - Update and save templates

- Navigation Tests:
  - Dashboard, Users, Passports, Quotations, Invoices, Customers
  - Reports menu, Settings
  - User menu, Logout flow

**Screenshots**: ~40+ screenshots captured in `test-screenshots/user-guide-flows/flex-admin/`

---

### ✅ IT Support Tests
**File**: `it-support-complete-flow.spec.ts`

**Based on**: `docs/user-guides/IT_SUPPORT_USER_GUIDE.md`

**Test Coverage**:
- Workflow A: User Account Management - Complete Cycle
  - Create new user account
  - Reset user password (common support task)
  - Unlock user account
  - Deactivate user

- Workflow B: Support Ticket Management
  - View all open tickets
  - Create new ticket on behalf of user
  - Fill ticket details (title, description, priority, category)
  - Assign ticket to self
  - Add work notes
  - Update ticket status to In Progress
  - Resolve ticket with resolution notes

- Workflow C: Technical Troubleshooting Scenarios
  - Login Issues: View login history, check failed logins, filter by user
  - Email Not Sending: Check system logs, review SMTP settings
  - MRZ Scanner Issues: Test scanner configuration, simulate scan test

- Workflow D: Login History Monitoring and Reporting
  - View all login attempts
  - Filter by date range and role
  - View suspicious activity (failed attempts)
  - Export login history report (CSV)

- Navigation Tests:
  - Dashboard, Users, Support Tickets, Login History
  - Scan & Validate, Reports menu, Invoices (view-only)
  - Settings (view-only), User menu, Logout flow

**Screenshots**: ~50+ screenshots captured in `test-screenshots/user-guide-flows/it-support/`

---

## Running the Tests

### Run All User Guide Tests

```bash
# Run all user guide flow tests with custom config
npx playwright test --config=playwright.config.user-guides.ts --headed

# Run headless (faster)
npx playwright test --config=playwright.config.user-guides.ts
```

### Run Specific Role Tests

```bash
# Counter Agent only
npx playwright test --config=playwright.config.user-guides.ts counter-agent-complete-flow.spec.ts --headed

# Finance Manager only
npx playwright test --config=playwright.config.user-guides.ts finance-manager-complete-flow.spec.ts --headed

# Flex Admin only
npx playwright test --config=playwright.config.user-guides.ts flex-admin-complete-flow.spec.ts --headed

# IT Support only
npx playwright test --config=playwright.config.user-guides.ts it-support-complete-flow.spec.ts --headed
```

### Run with Screenshots

Screenshots are automatically captured at each step. They are saved to:
- `test-screenshots/user-guide-flows/counter-agent/`
- `test-screenshots/user-guide-flows/finance-manager/`
- `test-screenshots/user-guide-flows/flex-admin/` (when created)
- `test-screenshots/user-guide-flows/it-support/` (when created)

### Create Screenshot Directories

```bash
mkdir -p test-screenshots/user-guide-flows/{counter-agent,finance-manager,flex-admin,it-support}
```

---

## Test Data

### Sample Passport Data
```typescript
{
  passportNumber: 'N1234567',
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  nationality: 'Australian',
  dateOfBirth: '1985-05-15',
  gender: 'Male',
  expiryDate: '2028-12-31',
  email: 'john.doe@example.com',
  phone: '+675 7234 5678'
}
```

### Sample Corporate Customer
```typescript
{
  companyName: 'ABC Corporation Ltd',
  contactPerson: 'Jane Smith',
  email: 'jane.smith@abccorp.com',
  phone: '+675 325 7890',
  address: 'Level 3, Downtown Building, Port Moresby',
  taxId: 'TIN-12345678'
}
```

### Sample Quotation
```typescript
{
  title: 'Green Fees for 50 Employees',
  description: 'Green Fee Exit Pass',
  quantity: 50,
  unitPrice: 50.00,
  discount: 5, // 5% bulk discount
  notes: 'Payment terms: NET 30 days'
}
```

### Cash Reconciliation Denominations
```typescript
{
  hundred: 2,        // K200
  fifty: 3,          // K150
  twenty: 5,         // K100
  ten: 4,            // K40
  five: 6,           // K30
  two: 5,            // K10
  one: 8,            // K8
  fiftyCents: 4,     // K2
  twentyCents: 5,    // K1
  tenCents: 10,      // K1
  fiveCents: 20      // K1
}
// Total: K543
```

---

## Authentication

### Test Credentials

**Counter Agent**:
- Email: `counteragent@example.com`
- Password: `password123`

**Finance Manager**:
- Email: `financemanager@example.com`
- Password: `password123`

**Flex Admin**:
- Email: `flexadmin@example.com`
- Password: `password123`

**IT Support**:
- Email: `itsupport@example.com`
- Password: `password123`

> **Note**: Update these credentials in test files to match your actual test user accounts.

---

## Configuration

### Playwright Config
Tests use the default Playwright configuration from `playwright.config.ts`.

### Custom Config for User Guide Tests (Optional)

Create `playwright.config.user-guides.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/user-guide-flows',
  fullyParallel: false, // Run sequentially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // One test at a time
  reporter: [
    ['html', { outputFolder: 'test-screenshots/user-guide-flows/report' }],
    ['list']
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    screenshot: 'on', // Always capture screenshots
    trace: 'on-first-retry',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

Run with custom config:
```bash
npx playwright test --config=playwright.config.user-guides.ts
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: User Guide Flow Tests

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday at 2 AM
  workflow_dispatch:

jobs:
  user-guide-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run User Guide Tests
        run: npx playwright test tests/user-guide-flows/

      - name: Upload Screenshots
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: user-guide-screenshots
          path: test-screenshots/user-guide-flows/
          retention-days: 30
```

---

## Test Maintenance

### When to Update Tests

Update these tests when:
1. **User guide is updated** - Sync test steps with documentation changes
2. **UI changes** - Update selectors if component structure changes
3. **New features added** - Add new test scenarios
4. **Workflows change** - Modify test steps to match new processes

### Keeping Tests in Sync with Documentation

1. **Review user guides quarterly** - Ensure documentation is current
2. **Run tests after each release** - Verify all workflows still work
3. **Update screenshots** - Refresh screenshots if UI design changes
4. **Test with real data** - Periodically test with production-like data

---

## Troubleshooting

### Tests Failing

1. **Check authentication** - Ensure test user accounts exist
2. **Check base URL** - Verify `PLAYWRIGHT_BASE_URL` is correct
3. **Check selectors** - UI may have changed, update selectors
4. **Check test data** - Ensure sample data is valid

### Screenshots Not Saving

1. **Create directories**:
   ```bash
   mkdir -p test-screenshots/user-guide-flows/{counter-agent,finance-manager,flex-admin,it-support}
   ```

2. **Check permissions** - Ensure write access to screenshot directory

3. **Check disk space** - Screenshots require storage space

### Timeouts

Some workflows are long (10+ minutes):
- Counter Agent: Cash reconciliation workflow
- Finance Manager: Complete quotation-to-vouchers workflow

Increase timeout if needed:
```typescript
test.setTimeout(600000); // 10 minutes
```

---

## Benefits of User Guide Flow Tests

1. **Documentation Validation** - Ensures user guides are accurate and current
2. **Regression Prevention** - Catches breaking changes in documented workflows
3. **Onboarding Aid** - Screenshots serve as visual training material
4. **Quality Assurance** - Verifies complete end-to-end user experiences
5. **Change Detection** - Highlights when UI/UX changes affect documented processes

---

## Future Enhancements

### Planned Additions

- [ ] Flex Admin complete workflow tests
- [ ] IT Support complete workflow tests
- [ ] Multi-role interaction tests (e.g., Agent submits, Finance approves)
- [ ] Performance benchmarking for each workflow
- [ ] Accessibility testing in user flows
- [ ] Mobile responsive testing
- [ ] Screenshot comparison (visual regression)
- [ ] Auto-generate documentation from screenshots

### Video Recording

Enable video recording for complete workflow demonstrations:

```typescript
use: {
  video: 'on' // Record all tests
}
```

Videos saved to `test-results/` directory.

---

## Contact

For questions or issues with these tests:
- Review user guides: `docs/user-guides/`
- Check test output: `test-screenshots/user-guide-flows/`
- Consult Playwright docs: https://playwright.dev/

---

**Last Updated**: January 2026
**Test Coverage**: 4/4 roles complete (Counter Agent, Finance Manager, Flex Admin, IT Support)
**Total Tests**: 23 test scenarios
**Expected Runtime**: ~40-60 minutes for all tests
