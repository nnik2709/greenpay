import { test, expect } from '@playwright/test';
import { waitForPageLoad, checkConsoleErrors, checkNetworkErrors } from '../utils/helpers';

/**
 * Comprehensive Menu Navigation Tests
 * Tests all menu items and sub-menu items across all roles
 */

test.describe('Menu Navigation - Complete Flow', () => {
  test('should display main navigation', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/');
    await waitForPageLoad(page);

    // Main navigation should be visible
    await expect(page.locator('[data-testid="main-navigation"]')).toBeVisible();

    consoleChecker.assertNoErrors();
  });

  test('should navigate to Dashboard', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    const dashboardLink = page.locator('[data-testid="nav-link-dashboard"]');
    if (await dashboardLink.isVisible({ timeout: 2000 })) {
      await dashboardLink.click();
      await waitForPageLoad(page);
      
      await expect(page).toHaveURL('/');
      await expect(page.locator('text=Dashboard')).toBeVisible();
    }
  });

  test('should open Passports submenu and navigate to all sub-items', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/');
    await waitForPageLoad(page);

    // Click Passports menu
    const passportsMenu = page.locator('[data-testid="nav-menu-passports"]');
    if (await passportsMenu.isVisible({ timeout: 2000 })) {
      await passportsMenu.click();
      await page.waitForTimeout(500);

      // Verify submenu is visible
      const submenu = page.locator('[data-testid="nav-submenu-passports"]');
      await expect(submenu).toBeVisible();

      // Test each submenu item
      const subItems = [
        { testId: 'nav-link-all-passports', url: '/passports', text: 'All Passports' },
        { testId: 'nav-link-individual-exit-pass', url: '/passports/create', text: 'Individual Exit Pass' },
        { testId: 'nav-link-bulk-upload', url: '/passports/bulk-upload', text: 'Bulk Upload' },
        { testId: 'nav-link-corporate-exit-pass', url: '/purchases/corporate-exit-pass', text: 'Corporate Exit Pass' },
        { testId: 'nav-link-scan-&-validate', url: '/scan', text: 'Scan' }
      ];

      for (const item of subItems) {
        await passportsMenu.click();
        await page.waitForTimeout(300);
        
        const link = page.locator(`[data-testid="${item.testId}"]`);
        if (await link.isVisible({ timeout: 1000 })) {
          await link.click();
          await waitForPageLoad(page);
          
          await expect(page).toHaveURL(new RegExp(item.url));
          console.log(`✓ Navigated to ${item.text}`);
          
          // Go back to dashboard
          await page.goto('/');
          await waitForPageLoad(page);
        }
      }
    }

    consoleChecker.assertNoErrors();
  });

  test('should open Reports submenu and navigate to all report types', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/');
    await waitForPageLoad(page);

    const reportsMenu = page.locator('[data-testid="nav-menu-reports"]');
    if (await reportsMenu.isVisible({ timeout: 2000 })) {
      await reportsMenu.click();
      await page.waitForTimeout(500);

      const reportTypes = [
        { testId: 'nav-link-reports-dashboard', url: '/reports', text: 'Reports Dashboard' },
        { testId: 'nav-link-passport-reports', url: '/reports/passports', text: 'Passport Reports' },
        { testId: 'nav-link-individual-purchase', url: '/reports/individual-purchase', text: 'Individual Purchase' },
        { testId: 'nav-link-corporate-vouchers', url: '/reports/corporate-vouchers', text: 'Corporate Vouchers' },
        { testId: 'nav-link-revenue-generated', url: '/reports/revenue-generated', text: 'Revenue' },
        { testId: 'nav-link-bulk-uploads', url: '/reports/bulk-passport-uploads', text: 'Bulk Uploads' },
        { testId: 'nav-link-quotations', url: '/reports/quotations', text: 'Quotations' }
      ];

      for (const report of reportTypes) {
        await reportsMenu.click();
        await page.waitForTimeout(300);
        
        const link = page.locator(`[data-testid="${report.testId}"]`);
        if (await link.isVisible({ timeout: 1000 })) {
          await link.click();
          await waitForPageLoad(page);
          
          await expect(page).toHaveURL(new RegExp(report.url));
          console.log(`✓ Navigated to ${report.text}`);
          
          await page.goto('/');
          await waitForPageLoad(page);
        }
      }
    }

    consoleChecker.assertNoErrors();
  });

  test('should open Admin submenu and navigate to admin pages', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    const adminMenu = page.locator('[data-testid="nav-menu-admin"]');
    if (await adminMenu.isVisible({ timeout: 2000 })) {
      await adminMenu.click();
      await page.waitForTimeout(500);

      const adminPages = [
        { testId: 'nav-link-payment-modes', url: '/admin/payment-modes', text: 'Payment Modes' },
        { testId: 'nav-link-email-templates', url: '/admin/email-templates', text: 'Email Templates' }
      ];

      for (const adminPage of adminPages) {
        await adminMenu.click();
        await page.waitForTimeout(300);
        
        const link = page.locator(`[data-testid="${adminPage.testId}"]`);
        if (await link.isVisible({ timeout: 1000 })) {
          await link.click();
          await waitForPageLoad(page);
          
          await expect(page).toHaveURL(new RegExp(adminPage.url));
          console.log(`✓ Navigated to ${adminPage.text}`);
          
          await page.goto('/');
          await waitForPageLoad(page);
        }
      }
    }
  });

  test('should navigate to Quotations', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    const quotationsLink = page.locator('[data-testid="nav-link-quotations"]');
    if (await quotationsLink.isVisible({ timeout: 2000 })) {
      await quotationsLink.click();
      await waitForPageLoad(page);
      
      await expect(page).toHaveURL('/quotations');
      await expect(page.locator('text=Quotation')).toBeVisible();
    }
  });

  test('should navigate to Users (if available)', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    const usersLink = page.locator('[data-testid="nav-link-users"]');
    if (await usersLink.isVisible({ timeout: 2000 })) {
      await usersLink.click();
      await waitForPageLoad(page);
      
      await expect(page).toHaveURL('/users');
      await expect(page.locator('text=/user/i')).toBeVisible();
    }
  });
});

test.describe('Menu Navigation - Accessibility', () => {
  test('should have keyboard navigation support', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Tab through navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to navigate with keyboard
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  });

  test('should show active menu state', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    const dashboardLink = page.locator('[data-testid="nav-link-dashboard"]');
    if (await dashboardLink.isVisible({ timeout: 2000 })) {
      // Dashboard link should have active styling
      const classes = await dashboardLink.getAttribute('class');
      expect(classes).toContain('font-semibold');
    }
  });
});

test.describe('Menu Navigation - Mobile View', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test('should display mobile menu button', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    const mobileMenuButton = page.locator('button:has-text("Menu")').or(
      page.locator('[aria-label*="menu"]')
    );
    
    await expect(mobileMenuButton.first()).toBeVisible();
  });

  test('should open mobile navigation menu', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    const menuButton = page.locator('button').filter({ hasText: /menu/i }).first();
    if (await menuButton.isVisible({ timeout: 2000 })) {
      await menuButton.click();
      await page.waitForTimeout(500);

      // Mobile menu should be visible
      const mobileNav = page.locator('[role="dialog"]').or(page.locator('.sheet-content'));
      await expect(mobileNav.first()).toBeVisible({ timeout: 3000 });
    }
  });
});









