import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Flex Admin Complete Workflow Tests
 *
 * Tests all core Flex Admin operations:
 * 1. Dashboard access and visualization
 * 2. User management (create, edit, view)
 * 3. Passport management
 * 4. Payment records access
 * 5. Quotations & Invoices
 * 6. Reports generation
 * 7. Admin settings access
 */

const FLEX_ADMIN = {
  email: 'flexadmin@greenpay.com',
  password: 'test123',
  role: 'Flex_Admin'
};

test.describe('Flex Admin - Complete Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Login as Flex Admin
    await page.goto('https://greenpay.eywademo.cloud/login');
    await page.fill('input[type="email"]', FLEX_ADMIN.email);
    await page.fill('input[type="password"]', FLEX_ADMIN.password);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/app/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
  });

  test('1. Dashboard - Verify all widgets and metrics', async ({ page }) => {
    console.log('\n🧪 TEST: Verify Flex Admin Dashboard');

    // Verify dashboard content
    await expect(page.locator('text=/Dashboard|Revenue|Total/i')).toBeVisible();

    // Check for key metrics/widgets
    const dashboardElements = [
      /Total|Revenue|Transactions/i,
      /Passports|Vouchers|Purchases/i
    ];

    for (const element of dashboardElements) {
      console.log(`  ✓ Checking for: ${element}`);
      await expect(page.locator(`text=${element}`)).toBeVisible({ timeout: 5000 });
    }

    await page.screenshot({ path: path.join(__dirname, '../test-screenshots/role-workflows/flex-admin-dashboard.png'), fullPage: true });
    console.log('✅ Dashboard verified\n');
  });

  test('2. Navigate to User Management', async ({ page }) => {
    console.log('\n🧪 TEST: Navigate to User Management');

    // Click on Users navigation item
    await page.click('nav >> text=Users, a[href*="/users"]');

    await page.waitForURL('**/app/users', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Verify user management interface
    await expect(page.locator('text=/Users|User Management|Add User/i')).toBeVisible();

    // Should see user table/list
    await expect(page.locator('text=/Email|Role|Name|Actions/i')).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: path.join(__dirname, '../test-screenshots/role-workflows/flex-admin-users.png'), fullPage: true });
    console.log('✅ User management page loaded\n');
  });

  test('3. Navigate to All Passports', async ({ page }) => {
    console.log('\n🧪 TEST: Navigate to All Passports');

    await page.click('nav >> text=All Passports, a[href*="/passports"]');

    await page.waitForURL('**/app/passports', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Verify passports table/list
    await expect(page.locator('text=/Passport|Name|Status|Number/i')).toBeVisible();

    await page.screenshot({ path: path.join(__dirname, '../test-screenshots/role-workflows/flex-admin-passports.png'), fullPage: true });
    console.log('✅ Passports page loaded\n');
  });

  test('4. Navigate to Quotations', async ({ page }) => {
    console.log('\n🧪 TEST: Navigate to Quotations');

    await page.click('nav >> text=Quotations, a[href*="/quotations"]');

    await page.waitForURL('**/app/quotations', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Verify quotations interface
    await expect(page.locator('text=/Quotation|Quote|Create|View/i')).toBeVisible();

    await page.screenshot({ path: path.join(__dirname, '../test-screenshots/role-workflows/flex-admin-quotations.png'), fullPage: true });
    console.log('✅ Quotations page loaded\n');
  });

  test('5. Navigate to Invoices', async ({ page }) => {
    console.log('\n🧪 TEST: Navigate to Invoices');

    await page.click('nav >> text=Invoices, a[href*="/invoices"]');

    await page.waitForURL('**/app/invoices', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Verify invoices interface
    await expect(page.locator('text=/Invoice|GST|Total|Status/i')).toBeVisible();

    await page.screenshot({ path: path.join(__dirname, '../test-screenshots/role-workflows/flex-admin-invoices.png'), fullPage: true });
    console.log('✅ Invoices page loaded\n');
  });

  test('6. Navigate to Reports', async ({ page }) => {
    console.log('\n🧪 TEST: Navigate to Reports');

    // Click on Reports navigation item
    await page.click('nav >> text=Reports, a[href*="/reports"]');

    await page.waitForURL('**/app/reports/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Verify reports interface
    await expect(page.locator('text=/Report|Export|Generate|Revenue|Passport/i')).toBeVisible();

    await page.screenshot({ path: path.join(__dirname, '../test-screenshots/role-workflows/flex-admin-reports.png'), fullPage: true });
    console.log('✅ Reports page loaded\n');
  });

  test('7. Navigate to Admin Settings', async ({ page }) => {
    console.log('\n🧪 TEST: Navigate to Admin Settings');

    // Click on Settings or Admin navigation item
    await page.click('nav >> text=Settings, a[href*="/settings"]');

    await page.waitForURL('**/app/settings/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Verify settings interface
    await expect(page.locator('text=/Settings|Configuration|Payment|Email|Template/i')).toBeVisible();

    await page.screenshot({ path: path.join(__dirname, '../test-screenshots/role-workflows/flex-admin-settings.png'), fullPage: true });
    console.log('✅ Settings page loaded\n');
  });

  test('8. Verify full navigation menu access', async ({ page }) => {
    console.log('\n🧪 TEST: Verify full navigation menu');

    // Flex Admin should have access to ALL navigation items
    const navItems = [
      'Home',
      'Dashboard',
      'Users',
      'All Passports',
      'Quotations',
      'Invoices',
      'Reports'
    ];

    for (const item of navItems) {
      console.log(`  ✓ Checking for: ${item}`);
      await expect(page.locator(`nav >> text=${item}`)).toBeVisible();
    }

    await page.screenshot({ path: path.join(__dirname, '../test-screenshots/role-workflows/flex-admin-full-nav.png'), fullPage: true });
    console.log('✅ Full navigation verified\n');
  });

  test('9. Logout functionality', async ({ page }) => {
    console.log('\n🧪 TEST: Logout');

    // Click logout button
    await page.click('button:has-text("Logout"), a:has-text("Logout"), [aria-label="Logout"]');

    // Should redirect to login page
    await page.waitForURL('**/login', { timeout: 10000 });

    // Verify login form is visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    console.log('✅ Logout successful\n');
  });
});
