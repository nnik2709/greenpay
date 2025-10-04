# 🧪 PNG Green Fees Testing Guide

This guide explains how to run comprehensive tests for the PNG Green Fees application, including menu navigation, form submissions, and data verification.

## 📋 Test Categories

### 1. **Smoke Tests** (`test:smoke`)
- **Purpose**: Quick verification of basic functionality
- **Duration**: ~30 seconds
- **Tests**: Authentication, basic sample data display
- **Use Case**: Quick health check before deployment

### 2. **Regression Tests** (`test:regression`)
- **Purpose**: Full verification of existing functionality
- **Duration**: ~2 minutes
- **Tests**: All core functionality without data creation
- **Use Case**: Verify nothing broke after changes

### 3. **Navigation Tests** (`test:navigation`)
- **Purpose**: Comprehensive menu and UI navigation testing
- **Duration**: ~3 minutes
- **Tests**: All menu items, submenus, and page navigation
- **Use Case**: Verify all UI elements are accessible and functional

### 4. **Data Creation Tests** (`test:data-creation`)
- **Purpose**: Form submission and database population
- **Duration**: ~5 minutes
- **Tests**: Creates sample data by filling and submitting forms
- **Use Case**: Populate database with test data for development/testing

### 5. **Data Verification Tests** (`test:data-verification`)
- **Purpose**: Comprehensive data and UI verification
- **Duration**: ~4 minutes
- **Tests**: Verifies data display, tables, charts, and interactive elements
- **Use Case**: Ensure all data is properly displayed and functional

### 6. **Comprehensive Tests** (`test:comprehensive`)
- **Purpose**: Complete test suite covering all functionality
- **Duration**: ~10 minutes
- **Tests**: All tests except data creation
- **Use Case**: Full application validation

## 🚀 Running Tests

### Quick Commands

```bash
# Local environment tests
npm run test:smoke                    # Quick smoke tests
npm run test:regression               # Full regression tests
npm run test:navigation               # Menu navigation tests
npm run test:data-creation            # Form submission tests (adds data to DB)
npm run test:data-verification        # Data verification tests
npm run test:comprehensive            # All tests

# Production environment tests
npm run test:smoke:prod               # Quick smoke tests on production
npm run test:regression:prod          # Full regression tests on production
npm run test:navigation:prod          # Menu navigation tests on production
npm run test:data-verification:prod   # Data verification tests on production
npm run test:comprehensive:prod       # All tests on production
```

### Advanced Usage

```bash
# Using the test script directly
node test-scripts.js <configuration> [environment]

# Examples
node test-scripts.js smoke local
node test-scripts.js dataCreation production
node test-scripts.js comprehensive local
```

### Available Configurations

| Configuration | Description | Duration | Environment |
|---------------|-------------|----------|-------------|
| `smoke` | Quick basic functionality | 30s | local/production |
| `regression` | Full existing functionality | 2m | local/production |
| `navigation` | Menu and UI navigation | 3m | local/production |
| `dataCreation` | Form submission (adds data) | 5m | local only |
| `dataVerification` | Data and UI verification | 4m | local/production |
| `comprehensive` | All tests except data creation | 10m | local/production |

## 📊 Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

The report includes:
- ✅ Pass/fail status for each test
- 📸 Screenshots of failures
- 🎥 Videos of test execution
- 📝 Detailed error messages
- 🔍 Test execution timeline

## 🎯 Test Scenarios Covered

### Authentication Tests
- ✅ Login with different user roles (admin, finance manager, counter agent, IT support)
- ✅ Invalid credential rejection
- ✅ Session management

### Menu Navigation Tests
- ✅ All main menu items (Dashboard, Users, Passports, Payments, Quotations, Reports, Admin)
- ✅ Reports submenu (Reports Dashboard, Passport Reports, Corporate Vouchers, Revenue Generated)
- ✅ Admin submenu (Payment Modes, User Management, System Settings)
- ✅ Page content verification for each menu item

### Data Display Tests
- ✅ Table structure and content verification
- ✅ Report cards and data visualization
- ✅ Interactive elements (buttons, forms, dropdowns)
- ✅ Data persistence across page refreshes

### Form Submission Tests
- ✅ Passport creation forms
- ✅ Payment entry forms
- ✅ Quotation creation forms
- ✅ User management forms
- ✅ Form validation testing
- ✅ Success/failure verification

### Data Verification Tests
- ✅ Dashboard components and data
- ✅ Table headers and data rows
- ✅ Report charts and visualizations
- ✅ Button and interactive element functionality
- ✅ Data consistency across navigation

## 🔧 Test Configuration

### Environment Variables

```bash
# Local testing
PLAYWRIGHT_BASE_URL=http://localhost:3002

# Production testing
PLAYWRIGHT_BASE_URL=https://eywademo.cloud
```

### Test Data

The data creation tests will add sample data to your database:
- **Passports**: Test passport entries with unique numbers
- **Payments**: Sample payment transactions
- **Quotations**: Test quotation entries
- **Users**: Additional test user accounts

⚠️ **Note**: Data creation tests should only be run in development environments to avoid polluting production data.

## 🐛 Debugging Failed Tests

### Common Issues

1. **Test Timeouts**: Increase timeout in test configuration
2. **Element Not Found**: Check if UI has changed or elements are not visible
3. **Navigation Issues**: Verify menu structure and routing
4. **Data Not Loading**: Check Supabase connection and data availability

### Debug Commands

```bash
# Run tests with detailed output
npx playwright test --debug

# Run specific test file
npx playwright test tests/auth.spec.js

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests with UI mode
npx playwright test --ui
```

### Viewing Test Results

```bash
# Open HTML report
npx playwright show-report

# View test results directory
ls -la test-results/

# Check specific test failure
cat test-results/[test-name]/error-context.md
```

## 📈 Continuous Integration

### GitHub Actions Example

```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:regression:prod
```

## 🎯 Best Practices

1. **Run smoke tests** before every deployment
2. **Run regression tests** after code changes
3. **Run data creation tests** only in development
4. **Run comprehensive tests** before major releases
5. **Check test reports** for any failures
6. **Update tests** when UI changes

## 📞 Support

If you encounter issues with the test suite:

1. Check the HTML report for detailed error information
2. Verify your environment variables are set correctly
3. Ensure the application is running on the correct port
4. Check that all dependencies are installed (`npm install`)

For additional help, refer to the [Playwright documentation](https://playwright.dev/docs/intro).
