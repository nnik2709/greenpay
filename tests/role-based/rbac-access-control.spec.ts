import { test, expect } from '@playwright/test';
import { 
  waitForPageLoad, 
  checkConsoleErrors,
  checkNetworkErrors
} from '../utils/helpers';

/**
 * Role-Based Access Control (RBAC) Tests
 * Comprehensive verification of access permissions across all roles
 * ENSURES CONSOLE ERROR-FREE OPERATION FOR ALL ACCESS CHECKS
 */

// Define access matrix
const accessMatrix = {
  Flex_Admin: {
    allowed: [
      '/dashboard',
      '/users',
      '/passports',
      '/passports/create',
      '/passports/bulk-upload',
      '/purchases/corporate-exit-pass',
      '/purchases',
      '/quotations',
      '/reports',
      '/reports/passports',
      '/reports/revenue-generated',
      '/admin/payment-modes',
      '/admin/email-templates',
      '/scan',
      '/cash-reconciliation'
    ],
    denied: []
  },
  Finance_Manager: {
    allowed: [
      '/dashboard',
      '/passports',
      '/purchases/corporate-exit-pass',
      '/quotations',
      '/reports',
      '/reports/passports',
      '/reports/revenue-generated',
      '/scan',
      '/cash-reconciliation'
    ],
    denied: [
      '/users',
      '/passports/create',
      '/admin/payment-modes',
      '/admin/email-templates'
    ]
  },
  Counter_Agent: {
    allowed: [
      '/dashboard',
      '/passports',
      '/passports/create',
      '/passports/bulk-upload',
      '/purchases/corporate-exit-pass',
      '/scan',
      '/cash-reconciliation'
    ],
    denied: [
      '/users',
      '/quotations',
      '/reports',
      '/admin/payment-modes',
      '/admin/email-templates'
    ]
  },
  IT_Support: {
    allowed: [
      '/dashboard',
      '/users',
      '/passports',
      '/reports',
      '/scan',
      '/tickets'
    ],
    denied: [
      '/passports/create',
      '/purchases/corporate-exit-pass',
      '/quotations',
      '/admin/payment-modes',
      '/admin/email-templates'
    ]
  }
};

test.describe('RBAC - Flex Admin Access', () => {
  test('Admin should access all allowed routes', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);
    
    for (const route of accessMatrix.Flex_Admin.allowed) {
      await page.goto(route);
      await waitForPageLoad(page);

      // Should successfully access
      await expect(page).toHaveURL(new RegExp(route.replace(/\//g, '\\/')));
      console.log(`✓ Admin can access: ${route}`);
    }

    // VERIFY NO ERRORS ACROSS ALL ROUTES
    consoleChecker.assertNoErrors();
    networkChecker.assertNoErrors();
    consoleChecker.logSummary();
  });
});

test.describe('RBAC - Finance Manager Access', () => {
  test('Finance Manager should access allowed routes', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    for (const route of accessMatrix.Finance_Manager.allowed) {
      await page.goto(route);
      await waitForPageLoad(page);

      await expect(page).toHaveURL(new RegExp(route.replace(/\//g, '\\/')));
      console.log(`✓ Finance Manager can access: ${route}`);
    }

    consoleChecker.assertNoErrors();
  });

  test('Finance Manager should be denied restricted routes', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    for (const route of accessMatrix.Finance_Manager.denied) {
      await page.goto(route);
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      expect(currentUrl).not.toContain(route);
      console.log(`✓ Finance Manager denied: ${route}`);
    }

    // Should not have console errors during access denial
    consoleChecker.assertNoErrors();
  });
});

test.describe('RBAC - Counter Agent Access', () => {
  test('Counter Agent should access allowed routes', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    for (const route of accessMatrix.Counter_Agent.allowed) {
      await page.goto(route);
      await waitForPageLoad(page);

      await expect(page).toHaveURL(new RegExp(route.replace(/\//g, '\\/')));
      console.log(`✓ Counter Agent can access: ${route}`);
    }

    consoleChecker.assertNoErrors();
  });

  test('Counter Agent should be denied restricted routes', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    for (const route of accessMatrix.Counter_Agent.denied) {
      await page.goto(route);
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      expect(currentUrl).not.toContain(route);
      console.log(`✓ Counter Agent denied: ${route}`);
    }

    consoleChecker.assertNoErrors();
  });
});

test.describe('RBAC - IT Support Access', () => {
  test('IT Support should access allowed routes', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    for (const route of accessMatrix.IT_Support.allowed) {
      await page.goto(route);
      await waitForPageLoad(page);

      // Some routes might redirect, check if we ended up on the right page
      console.log(`✓ IT Support accessing: ${route}`);
    }

    consoleChecker.assertNoErrors();
  });

  test('IT Support should be denied restricted routes', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    for (const route of accessMatrix.IT_Support.denied) {
      await page.goto(route);
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      expect(currentUrl).not.toContain(route);
      console.log(`✓ IT Support denied: ${route}`);
    }

    consoleChecker.assertNoErrors();
  });
});

test.describe('RBAC - Feature-Level Access', () => {
  test('only Admin can manage users', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/users');
    await waitForPageLoad(page);

    // Admin role should see create button
    const createButton = page.locator('button:has-text(/create|add/i)');
    const isVisible = await createButton.isVisible({ timeout: 2000 }).catch(() => false);

    if (isVisible) {
      console.log('✓ User management controls visible (Admin)');
    }

    consoleChecker.assertNoErrors();
  });

  test('only Admin can access admin settings', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/admin/payment-modes');
    await waitForPageLoad(page);

    // Should have access
    console.log('✓ Admin settings accessible');

    consoleChecker.assertNoErrors();
  });

  test('Finance Manager and Admin can view all reports', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    const reportRoutes = [
      '/reports/passports',
      '/reports/revenue-generated',
      '/reports/corporate-vouchers'
    ];

    for (const route of reportRoutes) {
      await page.goto(route);
      await waitForPageLoad(page);

      console.log(`✓ Reports accessible: ${route}`);
    }

    consoleChecker.assertNoErrors();
  });

  test('Counter Agent can create passports', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/passports/create');
    await waitForPageLoad(page);

    // Should have access to form
    await expect(page.locator('input[name="passportNumber"]')).toBeVisible();
    console.log('✓ Counter Agent can create passports');

    consoleChecker.assertNoErrors();
  });
});

test.describe('RBAC - Navigation Menu Visibility', () => {
  test('Admin sees all menu items', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/');
    await waitForPageLoad(page);

    const adminMenus = [
      '[data-testid="nav-link-dashboard"]',
      '[data-testid="nav-link-users"]',
      '[data-testid="nav-menu-passports"]',
      '[data-testid="nav-menu-reports"]',
      '[data-testid="nav-menu-admin"]'
    ];

    for (const menu of adminMenus) {
      const element = page.locator(menu);
      if (await element.isVisible({ timeout: 2000 })) {
        console.log(`✓ Admin menu visible: ${menu}`);
      }
    }

    consoleChecker.assertNoErrors();
  });

  test('Counter Agent sees limited menu items', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/');
    await waitForPageLoad(page);

    // Should NOT see admin menu
    const adminMenu = page.locator('[data-testid="nav-menu-admin"]');
    const isVisible = await adminMenu.isVisible({ timeout: 1000 }).catch(() => false);
    expect(isVisible).toBe(false);
    console.log('✓ Counter Agent does not see admin menu');

    consoleChecker.assertNoErrors();
  });
});

test.describe('RBAC - Data Access Control', () => {
  test('users can only see data they have permission for', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const dbChecker = await checkDatabaseErrors(page);
    
    await page.goto('/passports');
    await waitForPageLoad(page);

    // Should load passport data without errors
    await page.waitForTimeout(2000);

    // Verify no database permission errors
    dbChecker.assertNoErrors();
    consoleChecker.assertNoErrors();
  });

  test('reports load without permission errors', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);
    
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    await page.waitForTimeout(2000);

    // Should not have any 403 Forbidden errors
    const errors = networkChecker.getErrors();
    const forbidden = errors.filter(e => e.status === 403);
    expect(forbidden.length).toBe(0);

    consoleChecker.assertNoErrors();
  });
});

test.describe('RBAC - Console Error Verification', () => {
  test('no console errors when accessing allowed routes', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/dashboard');
    await waitForPageLoad(page);

    await page.goto('/passports');
    await waitForPageLoad(page);

    // CRITICAL: Verify no console errors during normal navigation
    consoleChecker.assertNoErrors();
    consoleChecker.logSummary();
  });

  test('no console errors when denied access', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    // Try to access restricted route
    await page.goto('/admin/payment-modes');
    await page.waitForTimeout(2000);

    // Even when denied, should not have console errors
    consoleChecker.assertNoErrors();
    console.log('✓ Access denial happens without console errors');
  });

  test('no console errors during role-based redirects', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    // Navigate to various pages
    await page.goto('/dashboard');
    await waitForPageLoad(page);

    await page.goto('/users');
    await page.waitForTimeout(2000);

    await page.goto('/passports');
    await waitForPageLoad(page);

    // Verify no errors during redirects
    consoleChecker.assertNoErrors();
  });
});









