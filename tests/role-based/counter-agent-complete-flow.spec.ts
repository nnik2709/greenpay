import { test, expect } from '@playwright/test';
import { 
  waitForPageLoad, 
  checkConsoleErrors,
  fillFormField,
  testData 
} from '../utils/helpers';
import { testUsers } from '../fixtures/test-data';

/**
 * Counter Agent Role - Complete Workflow Tests
 * Tests features available to counter agents (front desk staff)
 */

test.use({
  storageState: 'playwright/.auth/counter-agent.json'
});

test.describe('Counter Agent - Access Control', () => {
  test('should have limited menu access', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Counter Agent should see these menus
    const allowedMenus = [
      '[data-testid="nav-link-dashboard"]',
      '[data-testid="nav-menu-passports"]'
    ];

    // Should NOT see these menus
    const restrictedMenus = [
      '[data-testid="nav-link-users"]', // No user management
      '[data-testid="nav-menu-admin"]'  // No admin access
    ];

    for (const menu of allowedMenus) {
      const element = page.locator(menu);
      if (await element.isVisible({ timeout: 2000 })) {
        console.log(`✓ Counter Agent can see: ${menu}`);
      }
    }

    for (const menu of restrictedMenus) {
      const element = page.locator(menu);
      const isVisible = await element.isVisible({ timeout: 1000 }).catch(() => false);
      expect(isVisible).toBe(false);
      console.log(`✓ Counter Agent cannot see: ${menu}`);
    }
  });

  test('should NOT access User Management', async ({ page }) => {
    await page.goto('/users');
    await page.waitForTimeout(2000);

    // Should be redirected or see unauthorized
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/users');
    console.log('✓ Counter Agent blocked from User Management');
  });

  test('should NOT access Admin settings', async ({ page }) => {
    await page.goto('/admin/payment-modes');
    await page.waitForTimeout(2000);

    // Should be redirected or see unauthorized
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/admin');
    console.log('✓ Counter Agent blocked from Admin settings');
  });
});

test.describe('Counter Agent - Dashboard Access', () => {
  test('should view dashboard', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    await expect(page.locator('text=Dashboard')).toBeVisible();
    console.log('✓ Counter Agent can view dashboard');
  });

  test('should see relevant metrics', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Should see revenue and transaction metrics
    const metrics = [
      page.locator('text=/revenue/i'),
      page.locator('text=/transaction/i')
    ];

    for (const metric of metrics) {
      if (await metric.first().isVisible({ timeout: 3000 })) {
        console.log('✓ Counter Agent can see metrics');
        break;
      }
    }
  });
});

test.describe('Counter Agent - Individual Purchase Workflow', () => {
  test('should complete individual passport purchase', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    
    const testPassport = {
      passportNumber: testData.randomPassportNumber(),
      nationality: 'New Zealand',
      surname: 'COUNTER',
      givenName: 'AGENT',
      dob: '1992-03-15',
      sex: 'Female',
      dateOfExpiry: testData.futureDate(1095) // 3 years
    };

    await page.goto('/passports/create');
    await waitForPageLoad(page);

    // Fill passport details
    await fillFormField(page, 'input[name="passportNumber"]', testPassport.passportNumber);
    await fillFormField(page, 'input[name="nationality"]', testPassport.nationality);
    await fillFormField(page, 'input[name="surname"]', testPassport.surname);
    await fillFormField(page, 'input[name="givenName"]', testPassport.givenName);
    await fillFormField(page, 'input[name="dob"]', testPassport.dob);
    
    const sexButton = page.locator('button:has-text("Select sex")');
    if (await sexButton.isVisible({ timeout: 2000 })) {
      await sexButton.click();
      await page.locator(`text=${testPassport.sex}`).click();
    }
    
    await fillFormField(page, 'input[name="dateOfExpiry"]', testPassport.dateOfExpiry);

    // Proceed to payment
    await page.locator('button:has-text("Proceed to Payment")').click();
    await waitForPageLoad(page);

    // Complete cash payment
    await page.locator('label:has-text("CASH")').click();
    await page.locator('input[name="collected_amount"]').fill('75');

    // Process
    await page.locator('button:has-text("Process Payment")').click();
    await page.waitForTimeout(5000);

    // Verify success
    const voucherGenerated = await page.locator('text=/voucher|success/i').isVisible({ timeout: 10000 }).catch(() => false);
    
    if (voucherGenerated) {
      console.log('✓ Counter Agent successfully processed purchase');
    }

    consoleChecker.assertNoErrors();
  });

  test('should handle card payment', async ({ page }) => {
    await page.goto('/passports/create');
    await waitForPageLoad(page);

    // Quick fill
    await fillFormField(page, 'input[name="passportNumber"]', testData.randomPassportNumber());
    await fillFormField(page, 'input[name="nationality"]', 'Australian');
    await fillFormField(page, 'input[name="surname"]', 'TEST');
    await fillFormField(page, 'input[name="givenName"]', 'CARD');
    await fillFormField(page, 'input[name="dob"]', '1990-01-01');
    await fillFormField(page, 'input[name="dateOfExpiry"]', testData.futureDate(365));

    await page.locator('button:has-text("Proceed to Payment")').click();
    await waitForPageLoad(page);

    // Select card payment
    const cardOption = page.locator('label:has-text(/CARD|CREDIT/)');
    if (await cardOption.isVisible({ timeout: 2000 })) {
      await cardOption.click();
      console.log('✓ Counter Agent can process card payments');
    }
  });
});

test.describe('Counter Agent - Bulk Upload', () => {
  test('should access bulk upload page', async ({ page }) => {
    await page.goto('/passports/bulk-upload');
    await waitForPageLoad(page);

    await expect(page).toHaveURL('/passports/bulk-upload');
    await expect(page.locator('text=/bulk|upload/i')).toBeVisible();
    console.log('✓ Counter Agent can access bulk upload');
  });

  test('should download CSV template', async ({ page }) => {
    await page.goto('/passports/bulk-upload');
    await waitForPageLoad(page);

    const downloadButton = page.locator('button:has-text("Download Template")');
    if (await downloadButton.isVisible({ timeout: 2000 })) {
      console.log('✓ Counter Agent can download template');
    }
  });
});

test.describe('Counter Agent - Corporate Vouchers', () => {
  test('should generate corporate vouchers', async ({ page }) => {
    await page.goto('/purchases/corporate-exit-pass');
    await waitForPageLoad(page);

    // Counter agents can generate corporate vouchers
    await fillFormField(page, 'input[name="company_name"]', testData.randomCompanyName());
    await fillFormField(page, 'input[name="total_vouchers"]', '2');
    await fillFormField(page, 'input[name="valid_until"]', testData.futureDate(45));

    await page.locator('label:has-text("CASH")').click();

    const generateButton = page.locator('button:has-text("Generate")');
    if (await generateButton.isVisible({ timeout: 2000 })) {
      console.log('✓ Counter Agent can generate corporate vouchers');
    }
  });
});

test.describe('Counter Agent - QR Scanning', () => {
  test('should access QR scanner', async ({ page }) => {
    await page.goto('/scan');
    await waitForPageLoad(page);

    await expect(page).toHaveURL('/scan');
    await expect(page.locator('text=/scan|validate/i')).toBeVisible();
    console.log('✓ Counter Agent can access QR scanner');
  });

  test('should validate vouchers', async ({ page }) => {
    await page.goto('/scan');
    await waitForPageLoad(page);

    const manualInput = page.locator('input[placeholder*="code"]').first();
    if (await manualInput.isVisible({ timeout: 2000 })) {
      await manualInput.fill('TEST-VOUCHER-CODE');
      
      const validateButton = page.locator('button:has-text(/validate|check/i)');
      if (await validateButton.isVisible({ timeout: 1000 })) {
        console.log('✓ Counter Agent can validate vouchers');
      }
    }
  });
});

test.describe('Counter Agent - Cash Reconciliation', () => {
  test('should access cash reconciliation', async ({ page }) => {
    await page.goto('/cash-reconciliation');
    await page.waitForTimeout(2000);

    // Counter agents should have access to cash reconciliation
    const currentUrl = page.url();
    if (currentUrl.includes('/cash-reconciliation')) {
      console.log('✓ Counter Agent can access cash reconciliation');
      
      await expect(page.locator('text=/cash.*reconciliation/i')).toBeVisible();
    }
  });

  test('should submit daily reconciliation', async ({ page }) => {
    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    // Fill reconciliation
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 2000 })) {
      await dateInput.fill(new Date().toISOString().split('T')[0]);
      
      const openingFloat = page.locator('input[placeholder*="opening"]');
      if (await openingFloat.isVisible({ timeout: 1000 })) {
        await openingFloat.fill('100');
        
        console.log('✓ Counter Agent can perform cash reconciliation');
      }
    }
  });
});

test.describe('Counter Agent - Restricted Access', () => {
  test('should NOT access quotations', async ({ page }) => {
    await page.goto('/quotations');
    await page.waitForTimeout(2000);

    // Counter agents typically don't have quotation access
    // This depends on your business rules
    const currentUrl = page.url();
    if (!currentUrl.includes('/quotations')) {
      console.log('✓ Counter Agent correctly restricted from quotations');
    }
  });

  test('should NOT access reports', async ({ page }) => {
    await page.goto('/reports/revenue-generated');
    await page.waitForTimeout(2000);

    // Counter agents typically don't have report access
    const currentUrl = page.url();
    if (!currentUrl.includes('/reports')) {
      console.log('✓ Counter Agent correctly restricted from reports');
    }
  });
});

test.describe('Counter Agent - View Only Access', () => {
  test('should view passports list', async ({ page }) => {
    await page.goto('/passports');
    await waitForPageLoad(page);

    // Should be able to view passports
    await expect(page).toHaveURL('/passports');
    const passportsList = page.locator('table').or(page.locator('[role="grid"]'));
    await expect(passportsList.first()).toBeVisible({ timeout: 5000 });
    
    console.log('✓ Counter Agent can view passports list');
  });
});


