# GreenPay Testing Guide

## Overview

Comprehensive Playwright test automation suite for GreenPay application.

**Target Application**: https://greenpay.eywademo.cloud

## Quick Start

```bash
# Install dependencies
npm install @playwright/test dotenv
npx playwright install

# Run all tests
npx playwright test --config=playwright.config.production.ts

# Run smoke tests
npx playwright test tests/production/01-authentication.smoke.spec.ts

# View report
npx playwright show-report reports/html
```

## User Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Flex_Admin | flexadmin@greenpay.com | test123 | Full system |
| Finance_Manager | finance@greenpay.com | test123 | Financial ops |
| Counter_Agent | agent@greenpay.com | test123 | Passport ops |
| IT_Support | support@greenpay.com | support123 | Support & reports |

## Test Structure

```
tests/production/
├── auth-*.setup.ts          # Authentication for each role
├── pages/                   # Page Object Models
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   └── ...
├── test-data/
│   └── form-data.ts        # All test data
└── *.spec.ts               # Test files
```

## Email Testing

All test emails sent to: **nnik.area9@gmail.com**

Check console for email verification notices.

## Current Coverage

✅ **Authentication Tests** (Complete)
- Login/logout for all 4 roles
- Invalid credentials
- Session persistence

📋 **Planned**
- Navigation tests
- Form tests
- E2E workflows

## Next Steps

1. Create remaining page objects
2. Add navigation tests
3. Add form validation tests
4. Add end-to-end workflows

See README.md in tests/production/ for detailed documentation.
