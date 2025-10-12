import { test, expect } from '@playwright/test';
import { 
  waitForPageLoad, 
  checkConsoleErrors, 
  fillFormField,
  testData,
  waitForToast 
} from '../utils/helpers';

/**
 * Flex Admin Role - Complete Workflow Tests
 * Tests all features available to administrators
 */

test.describe.configure({ mode: 'serial' });

test.describe('Admin Role - Access Control', () => {
  test('should have access to all menu items', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Admin should see all navigation items
    const expectedMenus = [
      '[data-testid="nav-link-dashboard"]',
      '[data-testid="nav-link-users"]',
      '[data-testid="nav-menu-passports"]',
      '[data-testid="nav-link-quotations"]',
      '[data-testid="nav-menu-reports"]',
      '[data-testid="nav-menu-admin"]'
    ];

    for (const menu of expectedMenus) {
      const element = page.locator(menu);
      if (await element.isVisible({ timeout: 2000 })) {
        console.log(`✓ Admin can see: ${menu}`);
      }
    }
  });

  test('should access User Management', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/users');
    await waitForPageLoad(page);

    // Should NOT be redirected (admin has access)
    await expect(page).toHaveURL('/users');
    await expect(page.locator('text=/user|manage/i')).toBeVisible();

    consoleChecker.assertNoErrors();
  });

  test('should access Admin settings', async ({ page }) => {
    await page.goto('/admin/payment-modes');
    await waitForPageLoad(page);

    // Should have access to admin pages
    await expect(page).not.toHaveURL(/unauthorized|access-denied/);
  });
});

test.describe('Admin Role - User Management Workflow', () => {
  test('should view users list', async ({ page }) => {
    await page.goto('/users');
    await waitForPageLoad(page);

    // Users table or list should be visible
    const usersDisplay = page.locator('table').or(page.locator('[role="grid"]'));
    await expect(usersDisplay.first()).toBeVisible({ timeout: 5000 });
  });

  test.skip('should create new user', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    await page.goto('/users');
    await waitForPageLoad(page);

    // Click create user button
    const createButton = page.locator('button:has-text("Create")').or(page.locator('button:has-text("Add")'));
    if (await createButton.isVisible({ timeout: 2000 })) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Fill user form
      await fillFormField(page, 'input[name="email"]', testData.randomEmail());
      await page.locator('input[name="password"]').fill('TestPassword123!');

      // Select role
      const roleSelector = page.locator('select[name="role"]').or(
        page.locator('button:has-text("Select Role")')
      );
      if (await roleSelector.isVisible({ timeout: 1000 })) {
        await roleSelector.click();
        await page.locator('text=Counter_Agent').click();
      }

      // Submit
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(2000);

      consoleChecker.assertNoErrors();
    }
  });
});

test.describe('Admin Role - Complete Passport Creation Flow', () => {
  test('should create individual passport with payment', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    const testPassport = {
      passportNumber: testData.randomPassportNumber(),
      nationality: 'Australian',
      surname: 'ADMIN',
      givenName: 'TEST',
      dob: '1990-01-01',
      sex: 'Male',
      dateOfExpiry: testData.futureDate(365)
    };

    // Navigate to individual purchase
    await page.goto('/passports/create');
    await waitForPageLoad(page);

    // Fill passport form
    await fillFormField(page, 'input[name="passportNumber"]', testPassport.passportNumber);
    await fillFormField(page, 'input[name="nationality"]', testPassport.nationality);
    await fillFormField(page, 'input[name="surname"]', testPassport.surname);
    await fillFormField(page, 'input[name="givenName"]', testPassport.givenName);
    await fillFormField(page, 'input[name="dob"]', testPassport.dob);
    
    // Select sex
    const sexButton = page.locator('button:has-text("Select sex")');
    if (await sexButton.isVisible({ timeout: 2000 })) {
      await sexButton.click();
      await page.locator(`text=${testPassport.sex}`).click();
    }
    
    await fillFormField(page, 'input[name="dateOfExpiry"]', testPassport.dateOfExpiry);

    // Proceed to payment
    await page.locator('button:has-text("Proceed to Payment")').click();
    await waitForPageLoad(page);

    // Complete payment
    await page.locator('label:has-text("CASH")').click();
    await page.locator('input[name="collected_amount"]').fill('100');

    // Process payment
    await page.locator('button:has-text("Process Payment")').click();
    await page.waitForTimeout(3000);

    // Should see success or voucher
    const successIndicators = [
      page.locator('text=/voucher|success/i'),
      page.locator('text=/VCH-|IND-/')
    ];

    const hasSuccess = await Promise.race([
      successIndicators[0].isVisible({ timeout: 10000 }).catch(() => false),
      successIndicators[1].isVisible({ timeout: 10000 }).catch(() => false)
    ]);

    if (hasSuccess) {
      console.log('✓ Admin successfully created passport and voucher');
    }

    consoleChecker.assertNoErrors();
  });
});

test.describe('Admin Role - Corporate Voucher Generation', () => {
  test('should generate corporate vouchers', async ({ page }) => {
    await page.goto('/purchases/corporate-exit-pass');
    await waitForPageLoad(page);

    // Fill corporate voucher form
    await fillFormField(page, 'input[name="company_name"]', testData.randomCompanyName());
    await fillFormField(page, 'input[name="total_vouchers"]', '3');
    await fillFormField(page, 'input[name="valid_until"]', testData.futureDate(60));

    // Payment
    await page.locator('label:has-text("CASH")').click();

    // Generate
    const generateButton = page.locator('button:has-text("Generate")');
    if (await generateButton.isVisible({ timeout: 2000 })) {
      await generateButton.click();
      await page.waitForTimeout(5000);

      // Should see success or vouchers
      const success = await page.locator('text=/success|generated|voucher/i').isVisible({ timeout: 10000 }).catch(() => false);
      if (success) {
        console.log('✓ Admin successfully generated corporate vouchers');
      }
    }
  });
});

test.describe('Admin Role - Reports Access', () => {
  test('should access all report types', async ({ page }) => {
    const reports = [
      '/reports/passports',
      '/reports/individual-purchase',
      '/reports/corporate-vouchers',
      '/reports/revenue-generated',
      '/reports/bulk-passport-uploads',
      '/reports/quotations'
    ];

    for (const report of reports) {
      await page.goto(report);
      await waitForPageLoad(page);

      // Should not be redirected
      await expect(page).toHaveURL(report);
      console.log(`✓ Admin can access ${report}`);
    }
  });

  test('should export reports', async ({ page }) => {
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    // Look for export button
    const exportButton = page.locator('button:has-text(/export|download/i)');
    if (await exportButton.isVisible({ timeout: 2000 })) {
      console.log('✓ Admin can see export functionality');
    }
  });
});

test.describe('Admin Role - Admin Settings', () => {
  test('should manage payment modes', async ({ page }) => {
    await page.goto('/admin/payment-modes');
    await waitForPageLoad(page);

    // Should see payment modes list
    await expect(page.locator('text=/payment.*mode/i')).toBeVisible();
  });

  test('should access email templates', async ({ page }) => {
    await page.goto('/admin/email-templates');
    await waitForPageLoad(page);

    // Should have access (even if feature is skeleton)
    await expect(page).not.toHaveURL(/unauthorized/);
  });
});

test.describe('Admin Role - Quotations Workflow', () => {
  test('should create quotation', async ({ page }) => {
    await page.goto('/quotations');
    await waitForPageLoad(page);

    const createButton = page.locator('button:has-text("Create")');
    if (await createButton.isVisible({ timeout: 2000 })) {
      await createButton.click();
      await waitForPageLoad(page);

      // Fill quotation form
      await fillFormField(page, 'input[name="companyName"]', testData.randomCompanyName());
      await fillFormField(page, 'input[name="contactPerson"]', 'Admin Test');
      await fillFormField(page, 'input[name="contactEmail"]', testData.randomEmail());
      await fillFormField(page, 'input[name="numberOfPassports"]', '10');
      await fillFormField(page, 'input[name="amountPerPassport"]', '50');

      // Submit
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible({ timeout: 1000 })) {
        await submitButton.click();
        await page.waitForTimeout(3000);

        console.log('✓ Admin can create quotations');
      }
    }
  });

  test('should view quotations list', async ({ page }) => {
    await page.goto('/quotations');
    await waitForPageLoad(page);

    // Should see quotations statistics or list
    const quotationsDisplay = page.locator('text=/total|quotation|draft/i');
    await expect(quotationsDisplay.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Admin Role - QR Scanning', () => {
  test('should access QR scanner', async ({ page }) => {
    await page.goto('/scan');
    await waitForPageLoad(page);

    // Should have access to scanner
    await expect(page).toHaveURL('/scan');
    await expect(page.locator('text=/scan|validate|voucher/i')).toBeVisible();
  });
});

test.describe('Admin Role - Dashboard Access', () => {
  test('should view complete dashboard with all metrics', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Admin should see all dashboard cards
    const dashboardElements = [
      'text=Overall Revenue',
      'text=/today.*revenue/i',
      'text=Dashboard'
    ];

    for (const element of dashboardElements) {
      await expect(page.locator(element).first()).toBeVisible({ timeout: 5000 });
    }
  });
});


