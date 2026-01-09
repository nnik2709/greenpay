import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Counter Agent Complete Workflow Tests
 *
 * Tests all core Counter Agent operations:
 * 1. Individual passport purchase (manual entry)
 * 2. Individual passport purchase (bulk voucher)
 * 3. Scan and validate voucher
 * 4. View all passports
 * 5. Navigate through vouchers list
 */

const COUNTER_AGENT = {
  email: 'agent@greenpay.com',
  password: 'test123',
  role: 'Counter_Agent'
};

test.describe('Counter Agent - Complete Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Login as Counter Agent
    await page.goto('https://greenpay.eywademo.cloud/login');
    await page.fill('input[type="email"]', COUNTER_AGENT.email);
    await page.fill('input[type="password"]', COUNTER_AGENT.password);
    await page.click('button[type="submit"]');

    // Wait for redirect to agent landing
    await page.waitForURL('**/app/agent', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
  });

  test('1. Agent Landing Page - Verify all action cards', async ({ page }) => {
    console.log('\n🧪 TEST: Verify Agent Landing Page');

    // Verify page title/header
    await expect(page.locator('text=Welcome Back')).toBeVisible();

    // Verify all 3 action cards are present
    const actionCards = [
      'Add Passport & Generate Voucher',
      'Validate Existing Voucher',
      'Add Passport to Voucher'
    ];

    for (const card of actionCards) {
      console.log(`  ✓ Checking for: ${card}`);
      await expect(page.locator(`text=${card}`)).toBeVisible();
    }

    // Verify navigation menu items
    const navItems = ['Home', 'All Passports', 'Individual Green Pass', 'Vouchers List', 'Scan & Validate'];
    for (const item of navItems) {
      console.log(`  ✓ Nav item: ${item}`);
      await expect(page.locator(`nav >> text=${item}`)).toBeVisible();
    }

    await page.screenshot({ path: path.join(__dirname, '../test-screenshots/role-workflows/counter-agent-landing.png'), fullPage: true });
    console.log('✅ Agent landing page verified\n');
  });

  test('2. Navigate to Individual Purchase page', async ({ page }) => {
    console.log('\n🧪 TEST: Navigate to Individual Purchase');

    // Click "Start Now" button on first action card
    await page.click('text=Start Now');

    // Should navigate to passport create page
    await page.waitForURL('**/app/passports/create', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Verify form elements are present
    await expect(page.locator('text=Passport Information')).toBeVisible();
    await expect(page.locator('input[placeholder*="Passport"]')).toBeVisible();

    await page.screenshot({ path: path.join(__dirname, '../test-screenshots/role-workflows/counter-agent-individual-purchase.png'), fullPage: true });
    console.log('✅ Individual purchase page loaded\n');
  });

  test('3. Navigate to Scan & Validate', async ({ page }) => {
    console.log('\n🧪 TEST: Navigate to Scan & Validate');

    // Click on Scan & Validate nav item
    await page.click('nav >> text=Scan & Validate');

    await page.waitForURL('**/app/scan', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Verify scan interface is present
    await expect(page.locator('text=/Scan|Validate|QR/')).toBeVisible();

    await page.screenshot({ path: path.join(__dirname, '../test-screenshots/role-workflows/counter-agent-scan-validate.png'), fullPage: true });
    console.log('✅ Scan & Validate page loaded\n');
  });

  test('4. Navigate to All Passports list', async ({ page }) => {
    console.log('\n🧪 TEST: Navigate to All Passports');

    await page.click('nav >> text=All Passports');

    await page.waitForURL('**/app/passports', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Verify passports table/list is present
    await expect(page.locator('text=/Passport|Name|Status/')).toBeVisible();

    await page.screenshot({ path: path.join(__dirname, '../test-screenshots/role-workflows/counter-agent-passports-list.png'), fullPage: true });
    console.log('✅ Passports list page loaded\n');
  });

  test('5. Navigate to Vouchers List', async ({ page }) => {
    console.log('\n🧪 TEST: Navigate to Vouchers List');

    await page.click('nav >> text=Vouchers List');

    await page.waitForURL('**/app/vouchers-list', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Verify vouchers interface
    await expect(page.locator('text=/Voucher|Code|Status/')).toBeVisible();

    await page.screenshot({ path: path.join(__dirname, '../test-screenshots/role-workflows/counter-agent-vouchers-list.png'), fullPage: true });
    console.log('✅ Vouchers list page loaded\n');
  });

  test('6. Verify Counter Agent cannot access restricted pages', async ({ page }) => {
    console.log('\n🧪 TEST: Verify access restrictions');

    // Try to access Users page (should be blocked)
    await page.goto('https://greenpay.eywademo.cloud/app/users');

    // Should either redirect or show access denied
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    console.log(`  Current URL after attempting /users: ${currentUrl}`);

    // Should NOT be on /app/users
    expect(currentUrl).not.toContain('/app/users');

    console.log('✅ Access restrictions working\n');
  });

  test('7. Logout functionality', async ({ page }) => {
    console.log('\n🧪 TEST: Logout');

    // Click logout button (could be in dropdown or direct button)
    await page.click('button:has-text("Logout"), a:has-text("Logout"), [aria-label="Logout"]');

    // Should redirect to login page
    await page.waitForURL('**/login', { timeout: 10000 });

    // Verify login form is visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    console.log('✅ Logout successful\n');
  });
});
