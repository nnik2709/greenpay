# Playwright Tests - Quick Start Guide

## Prerequisites Checklist

- [ ] Node.js v18+ installed
- [ ] npm installed
- [ ] `.env` file with Supabase credentials
- [ ] Test users created in database
- [ ] Development server can run

## Installation (First Time Only)

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npx playwright install

# 3. Verify installation
npx playwright --version
# Should show: Version 1.55.1
```

## Quick Commands

### Run All Tests
```bash
npm test
```

### Run Tests Interactively (Recommended)
```bash
npm run test:ui
```

### Run Tests with Browser Visible
```bash
npm run test:headed
```

### Run Specific Test File
```bash
# Cash Reconciliation
npx playwright test tests/phase-1/07-cash-reconciliation.spec.ts

# Dashboard
npx playwright test tests/phase-1/01-dashboard.spec.ts

# Integration tests
npx playwright test tests/integration/end-to-end-flow.spec.ts
```

### Run Specific Test by Name
```bash
npx playwright test --grep "Cash Reconciliation"
npx playwright test --grep "should submit reconciliation"
```

### Debug a Test
```bash
npx playwright test --debug tests/phase-1/07-cash-reconciliation.spec.ts
```

### View Test Report
```bash
npm run test:report
```

## Test Structure

```
tests/
├── phase-1/              # Core features (dashboard, purchases, reports, etc.)
├── phase-2/              # Advanced features (user management, passport edit)
├── phase-3/              # QR scanning
├── phase-4/              # Admin settings
└── integration/          # End-to-end flows
```

## Test Statistics

- **Total Tests**: 893 (across all browsers)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Execution Time**: ~15-20 minutes (single browser)

## Common Issues

### "No tests found"
```bash
# Check if tests are listed
npx playwright test --list
```

### "Browser not installed"
```bash
npx playwright install chromium
```

### "Authentication failed"
```bash
# Update credentials in tests/auth.setup.ts
# Or delete auth state and retry
rm -rf playwright/.auth
```

### "Timeout errors"
```bash
# Run with more time
npx playwright test --timeout=60000
```

## Environment Setup

### Required .env Variables
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Test Users (create in Supabase)
- `admin@greenfees.test` / `Admin@123`
- `agent@greenfees.test` / `Agent@123`
- `finance@greenfees.test` / `Finance@123`

## Next Steps

1. ✅ Install dependencies
2. ✅ Set up `.env` file
3. ✅ Create test users
4. 🔄 Run `npm run test:ui` to start testing
5. 📖 Read `PLAYWRIGHT_TESTING_GUIDE.md` for detailed documentation

## Need Help?

- 📖 Full Guide: `PLAYWRIGHT_TESTING_GUIDE.md`
- 📊 Implementation Summary: `PLAYWRIGHT_IMPLEMENTATION_SUMMARY.md`
- 🌐 Playwright Docs: https://playwright.dev
- 🎭 Run `npx playwright codegen http://localhost:3000` to generate tests

## Key Test Files

### New Tests (Recently Added)
- ✨ `tests/phase-1/07-cash-reconciliation.spec.ts` - Cash reconciliation tests
- ✨ `tests/integration/end-to-end-flow.spec.ts` - E2E workflows
- ✨ `tests/integration/reports-advanced.spec.ts` - Advanced reports testing

### Existing Tests
- `tests/phase-1/01-dashboard.spec.ts` - Dashboard tests
- `tests/phase-1/02-individual-purchase.spec.ts` - Purchase flow
- `tests/phase-1/04-corporate-vouchers.spec.ts` - Corporate vouchers
- And many more...

## Success Indicators

When tests are working correctly, you'll see:
- ✅ Green checkmarks in test results
- ✅ "All tests passed" message
- ✅ HTML report generated
- ✅ No console errors in output

## Quick Test Run (30 seconds)

```bash
# Test just the dashboard (fast)
npx playwright test tests/phase-1/01-dashboard.spec.ts --project=chromium
```

---

**Ready to test? Run:** `npm run test:ui`


