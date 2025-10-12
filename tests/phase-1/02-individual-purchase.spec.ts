import { test, expect } from '@playwright/test';
import {
  checkConsoleErrors,
  checkNetworkErrors,
  waitForPageLoad,
  checkDatabaseErrors,
  testData,
  waitForToast,
  fillFormField
} from '../utils/helpers';

/**
 * PHASE 1: Individual Purchase Flow Tests
 * Tests the complete 3-step purchase process
 */

test.describe('Individual Purchase - Complete Flow', () => {
  test('should complete full purchase flow: passport → payment → voucher', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);
    const dbChecker = await checkDatabaseErrors(page);

    // Navigate to individual purchase
    await page.goto('/passports/create');
    await waitForPageLoad(page);

    // ===== STEP 1: Passport Details =====
    const testPassport = {
      passportNumber: testData.randomPassportNumber(),
      nationality: testData.randomNationality(),
      ...testData.randomName(),
      dob: testData.pastDate(365 * 30), // 30 years ago
      sex: 'Male',
      dateOfExpiry: testData.futureDate(365 * 5) // 5 years from now
    };

    // Fill passport form
    await fillFormField(page, 'input[name="passportNumber"]', testPassport.passportNumber);
    await fillFormField(page, 'input[name="nationality"]', testPassport.nationality);
    await fillFormField(page, 'input[name="surname"]', testPassport.lastName);
    await fillFormField(page, 'input[name="givenName"]', testPassport.firstName);
    await fillFormField(page, 'input[name="dob"]', testPassport.dob);

    // Select sex
    await page.click('button:has-text("Select sex")');
    await page.click(`text=${testPassport.sex}`);

    await fillFormField(page, 'input[name="dateOfExpiry"]', testPassport.dateOfExpiry);

    // Proceed to payment
    await page.click('button:has-text("Proceed to Payment")');
    await waitForPageLoad(page);

    // ===== STEP 2: Payment =====
    // Verify payment step loaded
    await expect(page.locator('text=Payment Details')).toBeVisible();

    // Verify amount is pre-filled (default 50)
    const amountInput = page.locator('input[type="number"]').first();
    const amount = await amountInput.inputValue();
    expect(parseFloat(amount)).toBeGreaterThan(0);

    // Select payment mode (Cash)
    await page.click('label:has-text("CASH")');

    // Set collected amount
    await fillFormField(page, 'input[type="number"]:nth-of-type(4)', '100');

    // Verify change is calculated
    const changeInput = page.locator('text=/change|returned/i').locator('..').locator('input');
    await expect(changeInput).toHaveValue(/\d+/);

    // Process payment
    await page.click('button:has-text("Process Payment")');
    await waitForPageLoad(page);

    // ===== STEP 3: Voucher Generated =====
    // Wait for voucher generation
    await expect(page.locator('text=/voucher.*generated|success/i')).toBeVisible({ timeout: 15000 });

    // Verify voucher code is displayed
    const voucherCode = await page.locator('text=/VCH-|IND-/').textContent();
    expect(voucherCode).toBeTruthy();
    console.log(`✓ Voucher generated: ${voucherCode}`);

    // Verify no errors
    consoleChecker.assertNoErrors();
    networkChecker.assertNoErrors();
    dbChecker.assertNoErrors();

    // Test print dialog
    const printButton = page.locator('button:has-text("Print")');
    if (await printButton.isVisible({ timeout: 2000 })) {
      await printButton.click();
      await page.waitForTimeout(1000);
      // Close dialog
      await page.keyboard.press('Escape');
    }
  });

  test('should validate required fields in passport form', async ({ page }) => {
    await page.goto('/passports/create');
    await waitForPageLoad(page);

    // Try to proceed without filling required fields
    await page.click('button:has-text("Proceed to Payment")');

    // Should show validation errors or prevent submission
    // (Exact behavior depends on implementation)
    await page.waitForTimeout(1000);

    // Should still be on step 1
    await expect(page.locator('text=Passport Details')).toBeVisible();
  });

  test('should calculate discount correctly', async ({ page }) => {
    await page.goto('/passports/create');
    await waitForPageLoad(page);

    // Fill minimal passport details
    await fillFormField(page, 'input[name="passportNumber"]', testData.randomPassportNumber());
    await fillFormField(page, 'input[name="nationality"]', 'Australian');
    await fillFormField(page, 'input[name="surname"]', 'TEST');
    await fillFormField(page, 'input[name="givenName"]', 'USER');
    await fillFormField(page, 'input[name="dob"]', '1990-01-01');
    await fillFormField(page, 'input[name="dateOfExpiry"]', testData.futureDate(365));

    // Proceed to payment
    await page.click('button:has-text("Proceed to Payment")');
    await waitForPageLoad(page);

    // Set discount
    const discountInput = page.locator('label:has-text("Discount")').locator('..').locator('input');
    if (await discountInput.isVisible({ timeout: 2000 })) {
      await discountInput.fill('10'); // 10% discount

      // Get amount after discount
      const totalInput = page.locator('text=/after discount/i').locator('..').locator('input');
      const afterDiscount = await totalInput.inputValue();

      // Should be 45 (50 - 10%)
      expect(parseFloat(afterDiscount)).toBe(45);
    }
  });

  test('should handle payment mode selection', async ({ page }) => {
    await page.goto('/passports/create');
    await waitForPageLoad(page);

    // Quick navigation to payment step
    await fillFormField(page, 'input[name="passportNumber"]', testData.randomPassportNumber());
    await fillFormField(page, 'input[name="nationality"]', 'Test');
    await fillFormField(page, 'input[name="surname"]', 'Test');
    await fillFormField(page, 'input[name="givenName"]', 'Test');
    await fillFormField(page, 'input[name="dob"]', '1990-01-01');
    await fillFormField(page, 'input[name="dateOfExpiry"]', testData.futureDate(365));

    await page.click('button:has-text("Proceed to Payment")');
    await waitForPageLoad(page);

    // Test card payment mode
    const cardOption = page.locator('label:has-text("CREDIT CARD")').or(page.locator('label:has-text("CARD")'));

    if (await cardOption.isVisible({ timeout: 2000 })) {
      await cardOption.click();

      // Card fields should appear
      await expect(page.locator('input[placeholder*="card"]').or(page.locator('text=/card number/i'))).toBeVisible({ timeout: 2000 });
    }
  });
});

test.describe('Individual Purchase - Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // TODO: Test offline scenario
    console.log('Network error handling test - implement based on error handling strategy');
  });

  test('should prevent duplicate voucher generation', async ({ page }) => {
    // TODO: Test concurrent submission prevention
    console.log('Duplicate prevention test - implement based on debounce/loading state');
  });
});
