# GreenPay Playwright Test Suite

Comprehensive test automation for GreenPay application at https://greenpay.eywademo.cloud

## Test Structure

```
tests/production/
├── auth-*.setup.ts          # Authentication setup for each role
├── pages/                   # Page Object Models
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   └── ...
├── test-data/
│   └── form-data.ts        # All test data
├── *.spec.ts               # Test files
└── README.md
```

## User Roles

- **Flex_Admin**: Full system access
- **Finance_Manager**: Quotations, invoices, reports
- **Counter_Agent**: Passport operations
- **IT_Support**: Support tickets, reports

## Running Tests

```bash
# All tests
npx playwright test --config=playwright.config.production.ts

# Specific role
npx playwright test --project=flex-admin

# Specific test file
npx playwright test tests/production/01-authentication.smoke.spec.ts

# With UI
npx playwright test --ui --config=playwright.config.production.ts

# Generate report
npx playwright show-report reports/html
```

## Test Coverage

### Phase 1: Authentication (✅ Complete)
- Login/logout for all 4 roles
- Invalid credentials handling
- Session persistence

### Phase 2: Navigation (In Progress)
- Role-based menu access
- Protected routes
- Breadcrumb navigation

### Phase 3: Forms (Planned)
- Passport creation
- Quotation creation
- Invoice management
- Bulk upload

### Phase 4: Smoke Tests (Planned)
- Critical path testing
- End-to-end workflows

## Email Testing

When tests trigger emails, they use: `nnik.area9@gmail.com`
Check console output for email verification notices.

## Notes

- Tests run sequentially (workers=1) to avoid conflicts
- Screenshots/videos captured on failure
- All tests use production environment
