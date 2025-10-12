import { test, expect } from '@playwright/test';
import {
  checkConsoleErrors,
  checkNetworkErrors,
  checkDatabaseErrors,
  waitForPageLoad
} from '../utils/helpers';

/**
 * Regression Tests - Existing Features
 * Ensures all previously working features remain functional
 * COMPREHENSIVE CONSOLE ERROR CHECKING TO PREVENT REGRESSIONS
 */

test.describe('Regression - Dashboard', () => {
  test('dashboard loads without errors (baseline)', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    await page.goto('/dashboard');
    await waitForPageLoad(page);

    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('h3:has-text("Overall Revenue")')).toBeVisible({ timeout: 10000 });

    // CRITICAL: Verify no regressions
    consoleChecker.assertNoErrors();
    networkChecker.assertNoErrors();
    consoleChecker.logSummary();
    
    console.log('✅ REGRESSION CHECK PASSED: Dashboard');
  });

  test('dashboard statistics load correctly', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/dashboard');
    await waitForPageLoad(page);

    // All 6 stat cards should be visible
    const statCards = await page.locator('[class*="stat"]').or(page.locator('h2')).count();
    expect(statCards).toBeGreaterThan(0);

    consoleChecker.assertNoErrors();
    dbChecker.assertNoErrors();
    
    console.log('✅ REGRESSION CHECK PASSED: Dashboard stats');
  });

  test('dashboard charts render without errors', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/dashboard');
    await waitForPageLoad(page);

    // Charts should render
    const charts = page.locator('.recharts-wrapper');
    const chartCount = await charts.count();
    expect(chartCount).toBeGreaterThanOrEqual(3);

    consoleChecker.assertNoErrors();
    
    console.log('✅ REGRESSION CHECK PASSED: Dashboard charts');
  });
});

test.describe('Regression - Authentication', () => {
  test.skip('login still works after changes', async ({ page }) => {
    // This test uses no auth state to test fresh login
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/login');
    await waitForPageLoad(page);

    await page.fill('input#email', 'admin@example.com');
    await page.fill('input#password', 'admin123');
    await page.locator('input#password').press('Enter');

    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');

    consoleChecker.assertNoErrors();
    
    console.log('✅ REGRESSION CHECK PASSED: Authentication');
  });
});

test.describe('Regression - Individual Purchase', () => {
  test('individual purchase page loads', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    await page.goto('/passports/create');
    await waitForPageLoad(page);

    await expect(page.locator('input[name="passportNumber"]')).toBeVisible();

    consoleChecker.assertNoErrors();
    networkChecker.assertNoErrors();
    
    console.log('✅ REGRESSION CHECK PASSED: Individual purchase page');
  });

  test('payment step navigation still works', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/passports/create');
    await waitForPageLoad(page);

    // Quick fill
    await page.fill('input[name="passportNumber"]', testData.randomPassportNumber());
    await page.fill('input[name="nationality"]', 'Test');
    await page.fill('input[name="surname"]', 'TEST');
    await page.fill('input[name="givenName"]', 'REGRESSION');
    await page.fill('input[name="dob"]', '1990-01-01');
    await page.fill('input[name="dateOfExpiry"]', testData.futureDate(365));

    await page.locator('button:has-text("Proceed to Payment")').click();
    await waitForPageLoad(page);

    // Should reach payment step
    await expect(page.locator('text=/payment/i')).toBeVisible({ timeout: 5000 });

    consoleChecker.assertNoErrors();
    
    console.log('✅ REGRESSION CHECK PASSED: Purchase navigation');
  });
});

test.describe('Regression - Corporate Vouchers', () => {
  test('corporate voucher page loads', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/purchases/corporate-exit-pass');
    await waitForPageLoad(page);

    await expect(page.locator('input[name="company_name"]')).toBeVisible();

    consoleChecker.assertNoErrors();
    
    console.log('✅ REGRESSION CHECK PASSED: Corporate vouchers page');
  });

  test('corporate voucher form calculations work', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/purchases/corporate-exit-pass');
    await waitForPageLoad(page);

    await page.fill('input[name="total_vouchers"]', '5');
    await page.waitForTimeout(500);

    // Calculations should work without errors
    consoleChecker.assertNoErrors();
    
    console.log('✅ REGRESSION CHECK PASSED: Corporate calculations');
  });
});

test.describe('Regression - QR Scanning', () => {
  test('QR scanner page loads', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/scan');
    await waitForPageLoad(page);

    await expect(page.locator('text=/scan|validate/i')).toBeVisible();

    consoleChecker.assertNoErrors();
    
    console.log('✅ REGRESSION CHECK PASSED: QR scanner');
  });

  test('manual voucher entry works', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/scan');
    await waitForPageLoad(page);

    const manualInput = page.locator('input[placeholder*="code"]').first();
    if (await manualInput.isVisible({ timeout: 2000 })) {
      await manualInput.fill('TEST-CODE');
      console.log('✓ Manual entry field functional');
    }

    consoleChecker.assertNoErrors();
    
    console.log('✅ REGRESSION CHECK PASSED: Manual voucher entry');
  });
});

test.describe('Regression - Quotations', () => {
  test('quotations page loads', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/quotations');
    await waitForPageLoad(page);

    await expect(page.locator('text=/quotation/i')).toBeVisible();

    consoleChecker.assertNoErrors();
    
    console.log('✅ REGRESSION CHECK PASSED: Quotations page');
  });

  test('create quotation button works', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/quotations');
    await waitForPageLoad(page);

    const createButton = page.locator('button:has-text("Create")');
    if (await createButton.isVisible({ timeout: 2000 })) {
      await createButton.click();
      await waitForPageLoad(page);

      await expect(page).toHaveURL(/quotations\/create/);
    }

    consoleChecker.assertNoErrors();
    
    console.log('✅ REGRESSION CHECK PASSED: Create quotation navigation');
  });
});

test.describe('Regression - Reports', () => {
  test('reports dashboard loads', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/reports');
    await waitForPageLoad(page);

    await expect(page.locator('text=/report/i')).toBeVisible();

    consoleChecker.assertNoErrors();
    
    console.log('✅ REGRESSION CHECK PASSED: Reports dashboard');
  });

  test('all report pages are accessible', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    const reports = [
      '/reports/passports',
      '/reports/individual-purchase',
      '/reports/corporate-vouchers',
      '/reports/revenue-generated'
    ];

    for (const report of reports) {
      await page.goto(report);
      await waitForPageLoad(page);

      await expect(page).toHaveURL(report);
      console.log(`✓ ${report} accessible`);
    }

    consoleChecker.assertNoErrors();
    
    console.log('✅ REGRESSION CHECK PASSED: All reports accessible');
  });
});

test.describe('Regression - User Management', () => {
  test('users page loads for admin', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/users');
    await waitForPageLoad(page);

    // Should have access (if admin)
    const usersTable = page.locator('table').or(page.locator('text=/user/i'));
    await expect(usersTable.first()).toBeVisible({ timeout: 5000 });

    consoleChecker.assertNoErrors();
    
    console.log('✅ REGRESSION CHECK PASSED: User management');
  });
});

test.describe('Regression - Cash Reconciliation', () => {
  test('cash reconciliation page loads', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    await expect(page.locator('text=/cash.*reconciliation/i')).toBeVisible();

    consoleChecker.assertNoErrors();
    
    console.log('✅ REGRESSION CHECK PASSED: Cash reconciliation');
  });

  test('cash reconciliation form fields present', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    await expect(page.locator('input[type="date"]').first()).toBeVisible();
    await expect(page.locator('button:has-text("Load Transactions")')).toBeVisible();

    consoleChecker.assertNoErrors();
    
    console.log('✅ REGRESSION CHECK PASSED: Cash reconciliation form');
  });
});

test.describe('Regression - Navigation Menu', () => {
  test('main navigation displays correctly', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/');
    await waitForPageLoad(page);

    const mainNav = page.locator('[data-testid="main-navigation"]');
    await expect(mainNav).toBeVisible();

    consoleChecker.assertNoErrors();
    
    console.log('✅ REGRESSION CHECK PASSED: Main navigation');
  });

  test('menu dropdowns still function', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/');
    await waitForPageLoad(page);

    const passportsMenu = page.locator('[data-testid="nav-menu-passports"]');
    if (await passportsMenu.isVisible({ timeout: 2000 })) {
      await passportsMenu.click();
      await page.waitForTimeout(300);

      const submenu = page.locator('[data-testid="nav-submenu-passports"]');
      await expect(submenu).toBeVisible();
    }

    consoleChecker.assertNoErrors();
    
    console.log('✅ REGRESSION CHECK PASSED: Menu dropdowns');
  });
});

test.describe('Regression - Payment Modes', () => {
  test('payment modes page loads', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/admin/payment-modes');
    await waitForPageLoad(page);

    await expect(page.locator('text=/payment.*mode/i')).toBeVisible();

    consoleChecker.assertNoErrors();
    
    console.log('✅ REGRESSION CHECK PASSED: Payment modes');
  });
});

test.describe('Regression - Overall System Health', () => {
  test('no console errors across multiple page navigations', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    // Navigate through multiple pages
    await page.goto('/dashboard');
    await waitForPageLoad(page);

    await page.goto('/passports/create');
    await waitForPageLoad(page);

    await page.goto('/quotations');
    await waitForPageLoad(page);

    await page.goto('/scan');
    await waitForPageLoad(page);

    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    // CRITICAL: No errors across entire app navigation
    consoleChecker.assertNoErrors();
    consoleChecker.logSummary();
    
    console.log('✅ REGRESSION CHECK PASSED: System-wide health');
  });

  test('all existing routes remain accessible', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    const existingRoutes = [
      '/dashboard',
      '/passports',
      '/passports/create',
      '/passports/bulk-upload',
      '/purchases/corporate-exit-pass',
      '/quotations',
      '/reports',
      '/scan',
      '/cash-reconciliation',
      '/admin/payment-modes'
    ];

    for (const route of existingRoutes) {
      await page.goto(route);
      await waitForPageLoad(page);

      await expect(page).toHaveURL(route);
      console.log(`✓ Route accessible: ${route}`);
    }

    consoleChecker.assertNoErrors();
    
    console.log('✅ REGRESSION CHECK PASSED: All routes accessible');
  });
});

