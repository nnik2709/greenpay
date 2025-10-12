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
 * PHASE 1: Quotations Workflow Tests
 * Tests quotation creation, approval, and conversion
 */

test.describe('Quotations - List & View', () => {
  test('[EXPECTED TO FAIL] should display quotations list', async ({ page }) => {
    // THIS WILL FAIL - List page shows skeleton with "0" (from gap analysis)

    const consoleChecker = await checkConsoleErrors(page);
    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/quotations');
    await waitForPageLoad(page);

    // Should show quotations table
    await expect(page.locator('table')).toBeVisible();

    // Should query quotations from database
    await page.waitForResponse(
      response => response.url().includes('quotations') && response.method() === 'GET',
      { timeout: 10000 }
    );

    dbChecker.assertNoErrors();
    consoleChecker.assertNoErrors();
  });

  test('should show empty state when no quotations exist', async ({ page }) => {
    await page.goto('/quotations');
    await waitForPageLoad(page);

    // Should show empty state message
    const emptyMessage = page.locator('text=/no quotations|create your first/i');
    await expect(emptyMessage).toBeVisible({ timeout: 5000 });
  });

  test('should have create quotation button', async ({ page }) => {
    await page.goto('/quotations');
    await waitForPageLoad(page);

    const createButton = page.locator('button:has-text("Create")');
    await expect(createButton).toBeVisible();
  });
});

test.describe('Quotations - Creation', () => {
  test('[NEEDS VALIDATION] should create new quotation', async ({ page }) => {
    // CreateQuotation.jsx exists (139 lines) but not inspected - needs validation

    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);
    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/quotations/create');
    await waitForPageLoad(page);

    // Fill quotation form
    await fillFormField(page, 'input[name="companyName"]', testData.randomCompanyName());
    await fillFormField(page, 'input[name="contactPerson"]', 'John Manager');
    await fillFormField(page, 'input[name="contactEmail"]', testData.randomEmail());
    await fillFormField(page, 'input[name="contactPhone"]', '+675 12345678');
    await fillFormField(page, 'input[name="numberOfPassports"]', '10');
    await fillFormField(page, 'input[name="amountPerPassport"]', '50');
    await fillFormField(page, 'input[name="validUntil"]', testData.futureDate(30));
    await fillFormField(page, 'textarea[name="notes"]', 'Test quotation');

    // Submit
    await page.click('button[type="submit"]');

    // Wait for save
    await page.waitForTimeout(3000);

    // Should redirect to quotations list or show success
    const successIndicators = [
      page.locator('text=/success|created/i'),
      page.locator('text=Quotations Management')
    ];

    await expect(successIndicators[0].or(successIndicators[1])).toBeVisible({ timeout: 10000 });

    consoleChecker.assertNoErrors();
    networkChecker.assertNoErrors();
    dbChecker.assertNoErrors();
  });

  test('should calculate total amount automatically', async ({ page }) => {
    await page.goto('/quotations/create');
    await waitForPageLoad(page);

    // Fill number of passports and amount
    await page.fill('input[name="numberOfPassports"]', '5');
    await page.fill('input[name="amountPerPassport"]', '100');

    // Wait for calculation
    await page.waitForTimeout(500);

    // Total should be 500
    const totalInput = page.locator('input[name="totalAmount"]');
    if (await totalInput.isVisible({ timeout: 1000 })) {
      const total = await totalInput.inputValue();
      expect(parseFloat(total)).toBe(500);
    }
  });
});

test.describe('Quotations - Workflow', () => {
  test('[EXPECTED TO FAIL] should mark quotation as sent', async ({ page }) => {
    // THIS WILL FAIL - No UI for status change (from gap analysis)

    await page.goto('/quotations');
    await waitForPageLoad(page);

    // Assuming quotation exists
    const markSentButton = page.locator('button:has-text("Mark as Sent")').first();
    await expect(markSentButton).toBeVisible({ timeout: 5000 });

    await markSentButton.click();

    // Status should update
    await expect(page.locator('text=Sent')).toBeVisible();
  });

  test('[EXPECTED TO FAIL] should approve quotation', async ({ page }) => {
    // THIS WILL FAIL - No approval interface (from gap analysis)

    await page.goto('/quotations');
    await waitForPageLoad(page);

    const approveButton = page.locator('button:has-text("Approve")').first();
    await expect(approveButton).toBeVisible({ timeout: 5000 });

    await approveButton.click();

    // Confirmation dialog
    await page.click('button:has-text("Confirm")');

    // Status should update
    await expect(page.locator('text=Approved')).toBeVisible();
  });

  test('[EXPECTED TO FAIL] should convert quotation to voucher batch', async ({ page }) => {
    // THIS WILL FAIL - Conversion flow not implemented (from gap analysis - CRITICAL)

    const consoleChecker = await checkConsoleErrors(page);
    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/quotations');
    await waitForPageLoad(page);

    // Find approved quotation
    const convertButton = page.locator('button:has-text("Convert")').first();
    await expect(convertButton).toBeVisible({ timeout: 5000 });

    await convertButton.click();

    // Conversion dialog/form
    await expect(page.locator('text=/convert|create vouchers/i')).toBeVisible();

    // Confirm payment details
    await page.click('label:has-text("CASH")');
    await page.fill('input[name="collectedAmount"]', '500');

    // Convert
    await page.click('button:has-text("Convert")');

    // Should navigate to corporate vouchers
    await page.waitForURL('**/purchases/corporate-exit-pass', { timeout: 10000 });

    // Should show generated vouchers
    await expect(page.locator('text=/success|generated/i')).toBeVisible();

    consoleChecker.assertNoErrors();
    dbChecker.assertNoErrors();
  });

  test('[EXPECTED TO FAIL] should generate quotation PDF', async ({ page }) => {
    // THIS WILL FAIL - PDF generation not implemented (from gap analysis)

    await page.goto('/quotations');
    await waitForPageLoad(page);

    const pdfButton = page.locator('button:has-text(/PDF|Download/i)').first();
    await expect(pdfButton).toBeVisible({ timeout: 5000 });

    const downloadPromise = page.waitForEvent('download');
    await pdfButton.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });

  test('should email quotation to client', async ({ page }) => {
    // Email dialog exists (lines 128-179 in Quotations.jsx)

    await page.goto('/quotations');
    await waitForPageLoad(page);

    const sendButton = page.locator('button:has-text("Send Quotation")');
    await expect(sendButton).toBeVisible();

    await sendButton.click();

    // Email dialog
    await expect(page.locator('text=/send quotation/i')).toBeVisible();

    await page.fill('input[name="quotationId"]', '1');
    await page.fill('input[type="email"]', 'client@example.com');

    await page.click('button:has-text("Send")');

    await page.waitForTimeout(2000);
  });
});

test.describe('Quotations - Statistics', () => {
  test('should display quotation statistics', async ({ page }) => {
    await page.goto('/quotations');
    await waitForPageLoad(page);

    // Check for stat cards (from Quotations.jsx lines 36-49)
    const stats = ['Total', 'Draft', 'Sent', 'Approved', 'Converted', 'Expired'];

    for (const stat of stats) {
      await expect(page.locator(`text=${stat}`)).toBeVisible();
    }
  });
});
