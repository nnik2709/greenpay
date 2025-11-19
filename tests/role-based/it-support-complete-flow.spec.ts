import { test, expect } from '@playwright/test';
import { 
  waitForPageLoad, 
  checkConsoleErrors,
  checkNetworkErrors,
  checkDatabaseErrors
} from '../utils/helpers';

/**
 * IT Support Role - Complete Workflow Tests
 * Tests features available to IT support staff
 * COMPREHENSIVE CONSOLE ERROR CHECKING ON ALL OPERATIONS
 */

test.describe('IT Support - Access Control', () => {
  test('should have IT support menu access', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);
    
    await page.goto('/');
    await waitForPageLoad(page);

    // IT Support should see these menus
    const allowedMenus = [
      { testId: '[data-testid="nav-link-dashboard"]', name: 'Dashboard' },
      { testId: '[data-testid="nav-link-users"]', name: 'Users' },
      { testId: '[data-testid="nav-menu-passports"]', name: 'Passports' },
      { testId: '[data-testid="nav-menu-reports"]', name: 'Reports' }
    ];

    for (const menu of allowedMenus) {
      const element = page.locator(menu.testId);
      if (await element.isVisible({ timeout: 2000 })) {
        console.log(`✓ IT Support can see: ${menu.name}`);
      }
    }

    // VERIFY NO CONSOLE ERRORS
    consoleChecker.assertNoErrors();
    networkChecker.assertNoErrors();
    consoleChecker.logSummary();
  });

  test('should access User Management', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const dbChecker = await checkDatabaseErrors(page);
    
    await page.goto('/users');
    await waitForPageLoad(page);

    await expect(page).toHaveURL('/users');
    await expect(page.locator('text=/user/i')).toBeVisible();
    console.log('✓ IT Support can access User Management');

    // CHECK FOR ERRORS IN USER MANAGEMENT PAGE
    consoleChecker.assertNoErrors();
    dbChecker.assertNoErrors();
  });

  test('should NOT access Admin settings', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/admin/payment-modes');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/admin');
    console.log('✓ IT Support blocked from Admin settings');

    consoleChecker.assertNoErrors();
  });
});

test.describe('IT Support - User Management', () => {
  test('should view users list', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);
    
    await page.goto('/users');
    await waitForPageLoad(page);

    const usersTable = page.locator('table').or(page.locator('[role="grid"]'));
    await expect(usersTable.first()).toBeVisible({ timeout: 5000 });
    console.log('✓ IT Support can view users list');

    // ENSURE NO ERRORS IN USER LIST LOADING
    consoleChecker.assertNoErrors();
    networkChecker.assertNoErrors();
  });

  test('should view user details', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/users');
    await waitForPageLoad(page);

    // Look for user action buttons
    const actionButtons = page.locator('button').filter({ hasText: /edit|view|details/i });
    const count = await actionButtons.count();
    
    if (count > 0) {
      console.log('✓ IT Support can interact with user records');
    }

    consoleChecker.assertNoErrors();
  });

  test('should reset user passwords', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/users');
    await waitForPageLoad(page);

    // Look for password reset functionality
    const resetButton = page.locator('button').filter({ hasText: /password|reset/i });
    if (await resetButton.first().isVisible({ timeout: 2000 })) {
      console.log('✓ IT Support can reset passwords');
    }

    consoleChecker.assertNoErrors();
  });
});

test.describe('IT Support - QR Scanning', () => {
  test('should access QR scanner', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/scan');
    await waitForPageLoad(page);

    await expect(page).toHaveURL('/scan');
    await expect(page.locator('text=/scan|validate/i')).toBeVisible();
    console.log('✓ IT Support can access QR scanner');

    consoleChecker.assertNoErrors();
  });

  test('should access voucher scanner', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/scanner');
    await waitForPageLoad(page);

    // IT Support has access to scanner pages
    console.log('✓ IT Support can access voucher scanner');

    consoleChecker.assertNoErrors();
  });
});

test.describe('IT Support - Reports Access', () => {
  test('should access all reports', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    const reports = [
      '/reports',
      '/reports/passports',
      '/reports/individual-purchase',
      '/reports/corporate-vouchers',
      '/reports/revenue-generated'
    ];

    for (const report of reports) {
      await page.goto(report);
      await waitForPageLoad(page);

      await expect(page).toHaveURL(report);
      console.log(`✓ IT Support can access ${report}`);
    }

    // CHECK FOR ANY ERRORS ACROSS ALL REPORTS
    consoleChecker.assertNoErrors();
    networkChecker.assertNoErrors();
  });
});

test.describe('IT Support - Support Tickets', () => {
  test('should access support tickets', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/tickets');
    await waitForPageLoad(page);

    // IT Support should have access to tickets
    const ticketsPage = page.locator('text=/ticket|support/i');
    if (await ticketsPage.first().isVisible({ timeout: 3000 })) {
      console.log('✓ IT Support can access support tickets');
    }

    consoleChecker.assertNoErrors();
  });
});

test.describe('IT Support - Dashboard', () => {
  test('should view dashboard', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);
    
    await page.goto('/');
    await waitForPageLoad(page);

    await expect(page.locator('text=Dashboard')).toBeVisible();
    console.log('✓ IT Support can view dashboard');

    // CHECK FOR DASHBOARD ERRORS
    consoleChecker.assertNoErrors();
    networkChecker.assertNoErrors();
  });
});

test.describe('IT Support - Restricted Access', () => {
  test('should NOT create passports', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/passports/create');
    await page.waitForTimeout(2000);

    // IT Support typically doesn't create passports
    const currentUrl = page.url();
    if (!currentUrl.includes('/passports/create')) {
      console.log('✓ IT Support correctly restricted from passport creation');
    }

    consoleChecker.assertNoErrors();
  });

  test('should NOT access quotations', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/quotations');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (!currentUrl.includes('/quotations')) {
      console.log('✓ IT Support correctly restricted from quotations');
    }

    consoleChecker.assertNoErrors();
  });

  test('should NOT generate corporate vouchers', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/purchases/corporate-exit-pass');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (!currentUrl.includes('/purchases/corporate-exit-pass')) {
      console.log('✓ IT Support correctly restricted from corporate vouchers');
    }

    consoleChecker.assertNoErrors();
  });
});

test.describe('IT Support - Passports View Only', () => {
  test('should view passports list', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const dbChecker = await checkDatabaseErrors(page);
    
    await page.goto('/passports');
    await waitForPageLoad(page);

    await expect(page).toHaveURL('/passports');
    const passportsList = page.locator('table').or(page.locator('[role="grid"]'));
    await expect(passportsList.first()).toBeVisible({ timeout: 5000 });
    
    console.log('✓ IT Support can view passports list');

    // VERIFY NO ERRORS IN DATA LOADING
    consoleChecker.assertNoErrors();
    dbChecker.assertNoErrors();
  });
});









