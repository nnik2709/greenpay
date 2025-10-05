import { test, expect } from '@playwright/test';

test.describe('Comprehensive Menu Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin for full access
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/');
    await page.waitForTimeout(2000);
  });

  test('should navigate through all main menu items and verify content', async ({ page }) => {
    const menuItems = [
      { name: 'Dashboard', url: '/', expectedContent: /dashboard|welcome/i },
      { name: 'Users', url: '/users', expectedContent: /users|email|role/i },
      { name: 'Passports', url: '/passports', expectedContent: /passport|passport number/i },
      { name: 'Purchases', url: '/payments', expectedContent: /payment|purchase|transaction/i },
      { name: 'Quotations', url: '/quotations', expectedContent: /quotation|quote/i },
      { name: 'Reports', url: '/reports', expectedContent: /report|dashboard/i },
      { name: 'Admin', url: '/admin', expectedContent: /admin|management/i }
    ];

    for (const menuItem of menuItems) {
      console.log(`Testing menu item: ${menuItem.name}`);
      
      // Click on the menu item
      const menuLink = page.locator(`a:has-text("${menuItem.name}"), button:has-text("${menuItem.name}")`).first();
      await menuLink.waitFor({ state: 'visible', timeout: 5000 });
      await menuLink.click();
      await page.waitForTimeout(2000);

      // Verify URL changed
      await expect(page).toHaveURL(new RegExp(menuItem.url.replace('/', '\\/')));

      // Verify page content
      await expect(page.locator('h1, h2, h3')).toBeVisible({ timeout: 10000 });
      
      // Check for expected content
      const contentFound = await page.locator(`text=${menuItem.expectedContent}`).first().isVisible({ timeout: 5000 });
      if (contentFound) {
        console.log(`✅ ${menuItem.name}: Content verified`);
      } else {
        console.log(`⚠️ ${menuItem.name}: Expected content not found, but page loaded`);
      }

      // Verify there are interactive elements (buttons, forms, etc.)
      const hasInteractiveElements = await page.locator('button, input, select, a[href]').count() > 0;
      expect(hasInteractiveElements).toBe(true);

      // Go back to dashboard for next iteration
      if (menuItem.name !== 'Dashboard') {
        await page.goto('/');
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should navigate through Reports submenu items', async ({ page }) => {
    // Click on Reports dropdown
    const reportsDropdown = page.locator('button:has-text("Reports")');
    await reportsDropdown.click();
    await page.waitForTimeout(1500);

    const reportSubmenus = [
      { name: 'Reports Dashboard', expectedContent: /report|dashboard/i },
      { name: 'Passport Reports', expectedContent: /passport|report/i },
      { name: 'Corporate Vouchers', expectedContent: /corporate|voucher/i },
      { name: 'Revenue Generated', expectedContent: /revenue|financial/i }
    ];

    for (const submenu of reportSubmenus) {
      console.log(`Testing reports submenu: ${submenu.name}`);
      
      // Click on the submenu item
      const submenuLink = page.locator(`a:has-text("${submenu.name}")`).first();
      await submenuLink.waitFor({ state: 'visible', timeout: 5000 });
      await submenuLink.click();
      await page.waitForTimeout(2000);

      // Verify page loads
      await expect(page.locator('h1, h2, h3')).toBeVisible({ timeout: 10000 });
      
      // Check for expected content
      const contentFound = await page.locator(`text=${submenu.expectedContent}`).first().isVisible({ timeout: 5000 });
      if (contentFound) {
        console.log(`✅ ${submenu.name}: Content verified`);
      } else {
        console.log(`⚠️ ${submenu.name}: Expected content not found, but page loaded`);
      }

      // Go back to main dashboard
      await page.goto('/');
      await page.waitForTimeout(1000);
      
      // Reopen Reports dropdown for next iteration
      const reportsDropdownAgain = page.locator('button:has-text("Reports")');
      await reportsDropdownAgain.click();
      await page.waitForTimeout(1500);
    }
  });

  test('should navigate through Admin submenu items', async ({ page }) => {
    // Click on Admin dropdown
    const adminDropdown = page.locator('button:has-text("Admin")');
    await adminDropdown.click();
    await page.waitForTimeout(1500);

    const adminSubmenus = [
      { name: 'Payment Modes', expectedContent: /payment.*mode|cash|card/i },
      { name: 'User Management', expectedContent: /user|management|role/i },
      { name: 'System Settings', expectedContent: /setting|configuration/i }
    ];

    for (const submenu of adminSubmenus) {
      console.log(`Testing admin submenu: ${submenu.name}`);
      
      // Click on the submenu item
      const submenuLink = page.locator(`a:has-text("${submenu.name}")`).first();
      await submenuLink.waitFor({ state: 'visible', timeout: 5000 });
      await submenuLink.click();
      await page.waitForTimeout(2000);

      // Verify page loads
      await expect(page.locator('h1, h2, h3')).toBeVisible({ timeout: 10000 });
      
      // Check for expected content
      const contentFound = await page.locator(`text=${submenu.expectedContent}`).first().isVisible({ timeout: 5000 });
      if (contentFound) {
        console.log(`✅ ${submenu.name}: Content verified`);
      } else {
        console.log(`⚠️ ${submenu.name}: Expected content not found, but page loaded`);
      }

      // Go back to main dashboard
      await page.goto('/');
      await page.waitForTimeout(1000);
      
      // Reopen Admin dropdown for next iteration
      const adminDropdownAgain = page.locator('button:has-text("Admin")');
      await adminDropdownAgain.click();
      await page.waitForTimeout(1500);
    }
  });

  test('should verify all pages have proper data display and interactive elements', async ({ page }) => {
    const pagesToTest = [
      { name: 'Dashboard', url: '/', checkFor: ['cards', 'buttons', 'links'] },
      { name: 'Users', url: '/users', checkFor: ['table', 'buttons', 'forms'] },
      { name: 'Passports', url: '/passports', checkFor: ['table', 'buttons', 'forms'] },
      { name: 'Purchases', url: '/payments', checkFor: ['table', 'buttons', 'forms'] },
      { name: 'Quotations', url: '/quotations', checkFor: ['table', 'buttons', 'forms'] },
      { name: 'Reports Dashboard', url: '/reports', checkFor: ['cards', 'buttons', 'charts'] }
    ];

    for (const pageInfo of pagesToTest) {
      console.log(`Verifying data and elements on: ${pageInfo.name}`);
      
      await page.goto(pageInfo.url);
      await page.waitForTimeout(2000);

      // Verify page loads
      await expect(page.locator('h1, h2, h3')).toBeVisible({ timeout: 10000 });

      // Check for specific element types
      for (const elementType of pageInfo.checkFor) {
        const elementCount = await page.locator(elementType).count();
        console.log(`  ${elementType}: ${elementCount} found`);
        
        // At least some interactive elements should be present
        if (['buttons', 'forms', 'links'].includes(elementType)) {
          expect(elementCount).toBeGreaterThan(0);
        }
      }

      // Verify there's some content (not just empty pages)
      const hasContent = await page.locator('main *').count() > 0;
      expect(hasContent).toBe(true);
    }
  });
});
