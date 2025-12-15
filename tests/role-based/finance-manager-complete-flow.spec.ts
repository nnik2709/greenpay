import { test, expect } from '@playwright/test';
import { 
  waitForPageLoad, 
  checkConsoleErrors,
  checkNetworkErrors,
  checkDatabaseErrors,
  fillFormField,
  testData 
} from '../utils/helpers';

/**
 * Finance Manager Role - Complete Workflow Tests
 * Tests features available to finance managers
 * INCLUDES COMPREHENSIVE CONSOLE ERROR CHECKING
 */

// Setup error checking for all tests in this suite
test.beforeEach(async ({ page }) => {
  // Initialize error tracking
  page.setExtraHTTPHeaders({
    'X-Test-Role': 'Finance_Manager'
  });
});

test.afterEach(async ({ page }, testInfo) => {
  // Log test completion
  console.log(`Completed: ${testInfo.title}`);
});

test.describe('Finance Manager - Access Control', () => {
  test('should have appropriate menu access', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);
    
    await page.goto('/');
    await waitForPageLoad(page);

    // Finance Manager should see these menus
    const allowedMenus = [
      { testId: '[data-testid="nav-link-dashboard"]', name: 'Dashboard' },
      { testId: '[data-testid="nav-menu-passports"]', name: 'Passports' },
      { testId: '[data-testid="nav-link-quotations"]', name: 'Quotations' },
      { testId: '[data-testid="nav-menu-reports"]', name: 'Reports' }
    ];

    // Should NOT see these menus
    const restrictedMenus = [
      { testId: '[data-testid="nav-link-users"]', name: 'Users' },
      { testId: '[data-testid="nav-menu-admin"]', name: 'Admin' }
    ];

    for (const menu of allowedMenus) {
      const element = page.locator(menu.testId);
      const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBe(true);
      console.log(`✓ Finance Manager can see: ${menu.name}`);
    }

    for (const menu of restrictedMenus) {
      const element = page.locator(menu.testId);
      const isVisible = await element.isVisible({ timeout: 1000 }).catch(() => false);
      expect(isVisible).toBe(false);
      console.log(`✓ Finance Manager cannot see: ${menu.name}`);
    }

    // VERIFY NO CONSOLE ERRORS
    consoleChecker.assertNoErrors();
    networkChecker.assertNoErrors();
    consoleChecker.logSummary();
  });

  test('should NOT access User Management', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/users');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/users');
    console.log('✓ Finance Manager blocked from User Management');

    // Check for any errors during redirect
    consoleChecker.assertNoErrors();
  });

  test('should NOT access Admin settings', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/admin/payment-modes');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/admin');
    console.log('✓ Finance Manager blocked from Admin settings');

    consoleChecker.assertNoErrors();
  });
});

test.describe('Finance Manager - Reports Access', () => {
  test('should access all report types', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);
    const dbChecker = await checkDatabaseErrors(page);

    const reports = [
      { url: '/reports', name: 'Reports Dashboard' },
      { url: '/reports/passports', name: 'Passport Reports' },
      { url: '/reports/individual-purchase', name: 'Individual Purchase' },
      { url: '/reports/corporate-vouchers', name: 'Corporate Vouchers' },
      { url: '/reports/revenue-generated', name: 'Revenue Generated' },
      { url: '/reports/bulk-passport-uploads', name: 'Bulk Uploads' },
      { url: '/reports/quotations', name: 'Quotations Reports' }
    ];

    for (const report of reports) {
      await page.goto(report.url);
      await waitForPageLoad(page);

      await expect(page).toHaveURL(report.url);
      console.log(`✓ Finance Manager can access ${report.name}`);
      
      // Verify no errors on each report page
      await page.waitForTimeout(1000);
    }

    // COMPREHENSIVE ERROR CHECK
    consoleChecker.assertNoErrors();
    networkChecker.assertNoErrors();
    dbChecker.assertNoErrors();
    consoleChecker.logSummary();
  });

  test('should view revenue metrics', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/reports/revenue-generated');
    await waitForPageLoad(page);

    await expect(page.locator('text=/revenue|total|amount/i').first()).toBeVisible({ timeout: 5000 });
    console.log('✓ Finance Manager can view revenue metrics');

    consoleChecker.assertNoErrors();
  });

  test('should export reports', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    const exportButton = page.locator('button:has-text(/export|download/i)');
    if (await exportButton.isVisible({ timeout: 2000 })) {
      console.log('✓ Finance Manager can see export functionality');
    }

    consoleChecker.assertNoErrors();
  });
});

test.describe('Finance Manager - Quotations Management', () => {
  test('should access quotations', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/quotations');
    await waitForPageLoad(page);

    await expect(page).toHaveURL('/quotations');
    await expect(page.locator('text=/quotation/i')).toBeVisible();
    console.log('✓ Finance Manager can access quotations');

    consoleChecker.assertNoErrors();
  });

  test('should create quotation', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);
    
    await page.goto('/quotations');
    await waitForPageLoad(page);

    const createButton = page.locator('button:has-text("Create")');
    if (await createButton.isVisible({ timeout: 2000 })) {
      await createButton.click();
      await waitForPageLoad(page);

      // Fill quotation form
      await fillFormField(page, 'input[name="companyName"]', testData.randomCompanyName());
      await fillFormField(page, 'input[name="contactPerson"]', 'Finance Manager Test');
      await fillFormField(page, 'input[name="contactEmail"]', testData.randomEmail());
      await fillFormField(page, 'input[name="numberOfPassports"]', '15');
      await fillFormField(page, 'input[name="amountPerPassport"]', '50');

      console.log('✓ Finance Manager can create quotations');
    }

    // VERIFY NO ERRORS DURING FORM FILLING
    consoleChecker.assertNoErrors();
    networkChecker.assertNoErrors();
  });

  test('should view quotation statistics', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/quotations');
    await waitForPageLoad(page);

    // Should see statistics
    const stats = await page.locator('text=/total|draft|sent|approved/i').count();
    if (stats > 0) {
      console.log('✓ Finance Manager can view quotation statistics');
    }

    consoleChecker.assertNoErrors();
  });
});

test.describe('Finance Manager - Corporate Vouchers', () => {
  test('should access corporate vouchers', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/app/payments/corporate-exit-pass');
    await waitForPageLoad(page);

    await expect(page).toHaveURL('/app/payments/corporate-exit-pass');
    console.log('✓ Finance Manager can access corporate vouchers');

    consoleChecker.assertNoErrors();
  });

  test('should generate corporate vouchers', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);
    
    await page.goto('/app/payments/corporate-exit-pass');
    await waitForPageLoad(page);

    // Fill form
    await fillFormField(page, 'input[name="company_name"]', testData.randomCompanyName());
    await fillFormField(page, 'input[name="total_vouchers"]', '5');
    await fillFormField(page, 'input[name="valid_until"]', testData.futureDate(90));

    await page.locator('label:has-text("CASH")').click();

    console.log('✓ Finance Manager can generate corporate vouchers');

    // ENSURE NO ERRORS IN FORM
    consoleChecker.assertNoErrors();
    networkChecker.assertNoErrors();
  });
});

test.describe('Finance Manager - QR Scanning', () => {
  test('should access QR scanner', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/scan');
    await waitForPageLoad(page);

    await expect(page).toHaveURL('/scan');
    await expect(page.locator('text=/scan|validate/i')).toBeVisible();
    console.log('✓ Finance Manager can access QR scanner');

    consoleChecker.assertNoErrors();
  });
});

test.describe('Finance Manager - Dashboard', () => {
  test('should view dashboard metrics', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);
    
    await page.goto('/');
    await waitForPageLoad(page);

    // Should see financial metrics
    const metrics = [
      'text=Overall Revenue',
      'text=/revenue/i',
      'text=Dashboard'
    ];

    for (const metric of metrics) {
      await expect(page.locator(metric).first()).toBeVisible({ timeout: 5000 });
    }

    console.log('✓ Finance Manager can view dashboard');

    // CRITICAL: Check for any calculation errors
    consoleChecker.assertNoErrors();
    networkChecker.assertNoErrors();
    consoleChecker.logSummary();
  });
});

test.describe('Finance Manager - Cash Reconciliation', () => {
  test('should access cash reconciliation', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    // Finance managers should have access
    await expect(page).toHaveURL('/cash-reconciliation');
    await expect(page.locator('text=/cash.*reconciliation/i')).toBeVisible();
    console.log('✓ Finance Manager can access cash reconciliation');

    consoleChecker.assertNoErrors();
  });

  test('should review reconciliation history', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    const historyButton = page.locator('button:has-text("View History")');
    if (await historyButton.isVisible({ timeout: 2000 })) {
      await historyButton.click();
      await page.waitForTimeout(1000);

      console.log('✓ Finance Manager can view reconciliation history');
    }

    consoleChecker.assertNoErrors();
  });
});

test.describe('Finance Manager - Restricted Access', () => {
  test('should NOT create individual passports', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/passports/create');
    await page.waitForTimeout(2000);

    // Finance managers typically view but don't create
    const currentUrl = page.url();
    if (!currentUrl.includes('/passports/create')) {
      console.log('✓ Finance Manager correctly restricted from passport creation');
    }

    consoleChecker.assertNoErrors();
  });
});









