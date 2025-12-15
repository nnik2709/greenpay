import { test, expect } from '@playwright/test';
import {
  checkConsoleErrors,
  checkNetworkErrors,
  checkDatabaseErrors,
  waitForPageLoad,
  fillFormField,
  testData
} from '../utils/helpers';

/**
 * PHASE 1: Corporate Vouchers Tests
 * Tests bulk voucher generation for companies
 */

test.describe('Corporate Vouchers - Generation', () => {
  test('should create corporate voucher batch', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);
    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/app/payments/corporate-exit-pass');
    await waitForPageLoad(page);

    // Fill company details
    const companyName = testData.randomCompanyName();
    await fillFormField(page, 'input[name="company_name"]', companyName);

    // Set number of vouchers
    await fillFormField(page, 'input[name="total_vouchers"]', '3');

    // Discount (optional)
    await fillFormField(page, 'input[name="discount"]', '10');

    // Set validity
    const validUntil = testData.futureDate(60);
    await fillFormField(page, 'input[name="valid_until"]', validUntil);

    // Select payment mode
    await page.click('label:has-text("CASH")');

    // Set collected amount
    await page.fill('input[name="collected_amount"]', '150');

    // Generate vouchers
    await page.click('button:has-text("Generate")');

    // Wait for generation
    await expect(page.locator('text=/success|generated/i')).toBeVisible({ timeout: 15000 });

    // Should show voucher list
    await expect(page.locator('text=/voucher.*1|#1/i')).toBeVisible();
    await expect(page.locator('text=/voucher.*2|#2/i')).toBeVisible();
    await expect(page.locator('text=/voucher.*3|#3/i')).toBeVisible();

    // Verify voucher codes are displayed
    const voucherCodes = await page.locator('text=/VCH-|CORP-/').allTextContents();
    expect(voucherCodes.length).toBeGreaterThanOrEqual(3);

    console.log(`✓ Generated ${voucherCodes.length} corporate vouchers`);

    // Verify no errors
    consoleChecker.assertNoErrors();
    networkChecker.assertNoErrors();
    dbChecker.assertNoErrors();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/app/payments/corporate-exit-pass');
    await waitForPageLoad(page);

    // Try to submit without company name
    await page.click('button:has-text("Generate")');

    await page.waitForTimeout(1000);

    // Should show validation error or prevent submission
    const errorToast = page.locator('text=/required|company name/i');
    const stillOnForm = page.locator('text=Bulk Voucher Generation');

    await expect(errorToast.or(stillOnForm)).toBeVisible();
  });

  test('should calculate total amount correctly', async ({ page }) => {
    await page.goto('/app/payments/corporate-exit-pass');
    await waitForPageLoad(page);

    // Set quantity
    await page.fill('input[name="total_vouchers"]', '5');

    // Get total amount (5 * 50 = 250)
    const totalInput = page.locator('label:has-text("Total Amount")').locator('..').locator('input');
    const total = await totalInput.inputValue();

    expect(parseFloat(total)).toBe(250);
  });

  test('should apply discount correctly', async ({ page }) => {
    await page.goto('/app/payments/corporate-exit-pass');
    await waitForPageLoad(page);

    // Set quantity and discount
    await page.fill('input[name="total_vouchers"]', '10');
    await page.fill('input[name="discount"]', '20'); // 20% discount

    // Total: 10 * 50 = 500
    // After 20% discount: 400
    const afterDiscountInput = page.locator('label:has-text(/after discount/i)').locator('..').locator('input');
    const afterDiscount = await afterDiscountInput.inputValue();

    expect(parseFloat(afterDiscount)).toBe(400);
  });
});

test.describe('Corporate Vouchers - Print & Distribution', () => {
  test.beforeEach(async ({ page }) => {
    // Generate a test batch first
    await page.goto('/app/payments/corporate-exit-pass');
    await waitForPageLoad(page);

    await fillFormField(page, 'input[name="company_name"]', 'Test Corp');
    await fillFormField(page, 'input[name="total_vouchers"]', '2');
    await page.click('label:has-text("CASH")');
    await page.fill('input[name="valid_until"]', testData.futureDate(30));

    await page.click('button:has-text("Generate")');
    await expect(page.locator('text=/success/i')).toBeVisible({ timeout: 15000 });
  });

  test('should print individual voucher', async ({ page }) => {
    // Find and click print button on first voucher
    const printButton = page.locator('button:has-text("Print")').first();
    await printButton.click();

    // Print dialog should open
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });

    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('[EXPECTED TO FAIL] should bulk print all vouchers', async ({ page }) => {
    // THIS WILL FAIL - Bulk print not implemented (from gap analysis)

    const bulkPrintButton = page.locator('button:has-text("Print All")');
    await expect(bulkPrintButton).toBeVisible({ timeout: 2000 });

    await bulkPrintButton.click();

    // Should generate ZIP or combined PDF
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/voucher|batch/i);
  });

  test('[EXPECTED TO FAIL] should email vouchers to client', async ({ page }) => {
    // THIS WILL FAIL - Email distribution not implemented (from gap analysis)

    const emailButton = page.locator('button:has-text("Email")');
    await expect(emailButton).toBeVisible({ timeout: 2000 });

    await emailButton.click();

    // Email dialog should open
    await expect(page.locator('text=/email|send|recipient/i')).toBeVisible();

    await page.fill('input[type="email"]', 'client@testcorp.com');
    await page.click('button:has-text("Send")');

    // Should show success message
    await expect(page.locator('text=/sent|success/i')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Corporate Vouchers - History', () => {
  test('[EXPECTED TO FAIL] should display corporate voucher history', async ({ page }) => {
    // THIS WILL FAIL - History page not implemented (from gap analysis)

    await page.goto('/app/payments/corporate-batch-history');
    await waitForPageLoad(page);

    // Should show list of all corporate batches
    await expect(page.locator('table')).toBeVisible();

    // Should show batch information
    await expect(page.locator('text=/company|batch|vouchers/i')).toBeVisible();
  });

  test('[EXPECTED TO FAIL] should filter corporate vouchers by date', async ({ page }) => {
    // THIS WILL FAIL - History page not implemented

    await page.goto('/app/payments/corporate-batch-history');
    await waitForPageLoad(page);

    // Date filters
    await page.fill('input[type="date"]', testData.pastDate(30));
    await page.click('button:has-text("Filter")');

    await waitForPageLoad(page);
  });
});
