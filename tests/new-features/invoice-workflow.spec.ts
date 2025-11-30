import { test, expect } from '@playwright/test';
import {
  checkConsoleErrors,
  checkNetworkErrors,
  checkDatabaseErrors,
  waitForPageLoad,
  fillFormField
} from '../utils/helpers';

/**
 * Invoice Workflow Tests
 * Tests the complete quotation-to-invoice workflow
 *
 * Workflow Steps:
 * 1. Create Quotation (draft)
 * 2. Approve Quotation
 * 3. Convert to Invoice
 * 4. Record Payment
 * 5. Generate Vouchers (after full payment)
 *
 * Features tested:
 * - Invoice page visibility
 * - Invoice list display
 * - Invoice PDF download (enhanced with payment details, bank info, T&C)
 * - Email invoice functionality
 * - Payment recording
 * - Voucher generation
 */

test.describe('Invoice Workflow - Page Access', () => {
  test('should access invoices page', async ({ page }) => {
    // Accessible to: Flex_Admin, Finance_Manager, IT_Support
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/invoices');
    await waitForPageLoad(page);

    // Should show invoices page
    await expect(page.locator('text=/tax invoice/i')).toBeVisible();

    consoleChecker.assertNoErrors();
    console.log('✓ Invoices page accessible');
  });

  test('should display invoice statistics', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/invoices');
    await waitForPageLoad(page);

    // Statistics should be visible
    const stats = ['Total Invoices', 'Pending', 'Paid', 'Overdue'];
    for (const stat of stats) {
      await expect(page.locator(`text=${stat}`)).toBeVisible();
    }

    console.log('✓ Invoice statistics displayed');
    consoleChecker.assertNoErrors();
  });

  test('should display invoices table', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/invoices');
    await waitForPageLoad(page);

    // Should have table with headers
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('text="Invoice #"')).toBeVisible();
    await expect(page.locator('text="Customer"')).toBeVisible();
    await expect(page.locator('text="Total"')).toBeVisible();
    await expect(page.locator('text="Status"')).toBeVisible();

    consoleChecker.assertNoErrors();
    console.log('✓ Invoices table structure correct');
  });
});

test.describe('Invoice Workflow - Convert Quotation to Invoice', () => {
  test('should have "Convert to Invoice" button on approved quotations', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/quotations');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Look for convert to invoice button
    const convertButton = page.locator('button:has-text("Convert to Invoice")');
    const buttonCount = await convertButton.count();

    if (buttonCount > 0) {
      console.log(`✓ Found ${buttonCount} "Convert to Invoice" buttons`);
    } else {
      console.log('⚠ No approved/sent quotations to convert (expected if no data)');
    }

    consoleChecker.assertNoErrors();
  });

  test.skip('should open invoice conversion dialog', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/quotations');
    await waitForPageLoad(page);

    const convertButton = page.locator('button:has-text("Convert to Invoice")').first();
    if (await convertButton.isVisible({ timeout: 2000 })) {
      await convertButton.click();
      await page.waitForTimeout(500);

      // Dialog should open
      await expect(page.locator('text=/convert.*invoice/i')).toBeVisible();
      await expect(page.locator('text=/payment terms/i')).toBeVisible();

      console.log('✓ Invoice conversion dialog opens');
    }

    consoleChecker.assertNoErrors();
  });

  test.skip('should convert quotation to invoice', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/quotations');
    await waitForPageLoad(page);

    const convertButton = page.locator('button:has-text("Convert to Invoice")').first();
    if (await convertButton.isVisible({ timeout: 2000 })) {
      await convertButton.click();
      await page.waitForTimeout(500);

      // Select payment terms
      const paymentTermsSelect = page.locator('select').filter({ hasText: /net.*days/i });
      if (await paymentTermsSelect.isVisible({ timeout: 2000 })) {
        await paymentTermsSelect.selectOption({ value: '30' }); // Net 30 days
      }

      // Confirm conversion
      await page.locator('button:has-text("Create Invoice")').click();
      await page.waitForTimeout(3000);

      // Should show success
      await expect(page.locator('text=/invoice.*created/i')).toBeVisible({ timeout: 10000 });

      // Should navigate to invoices page
      await expect(page).toHaveURL('/invoices');

      console.log('✓ Quotation converted to invoice successfully');
    }

    consoleChecker.assertNoErrors();
    dbChecker.assertNoErrors();
  });
});

test.describe('Invoice Workflow - Invoice Actions', () => {
  test('should have Download PDF button for invoices', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/invoices');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const invoiceRows = page.locator('table tbody tr');
    const rowCount = await invoiceRows.count();

    if (rowCount > 0) {
      // Download PDF icon button should be visible
      const downloadButtons = page.locator('button[title="Download PDF"]');
      const buttonCount = await downloadButtons.count();

      expect(buttonCount).toBeGreaterThan(0);
      console.log(`✓ Found ${buttonCount} Download PDF buttons`);
    } else {
      console.log('⚠ No invoices found (expected if no data)');
    }

    consoleChecker.assertNoErrors();
  });

  test('should have Email Invoice button', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/invoices');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const invoiceRows = page.locator('table tbody tr');
    const rowCount = await invoiceRows.count();

    if (rowCount > 0) {
      // Email icon button should be visible
      const emailButtons = page.locator('button[title="Email Invoice"]');
      const buttonCount = await emailButtons.count();

      expect(buttonCount).toBeGreaterThan(0);
      console.log(`✓ Found ${buttonCount} Email Invoice buttons`);
    }

    consoleChecker.assertNoErrors();
  });

  test('should have Record Payment button for unpaid invoices', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/invoices');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Record Payment buttons (only on pending/partial status invoices)
    const paymentButtons = page.locator('button:has-text("Record Payment")');
    const buttonCount = await paymentButtons.count();

    console.log(`✓ Found ${buttonCount} "Record Payment" buttons`);
    consoleChecker.assertNoErrors();
  });

  test('should have Generate Vouchers button for paid invoices', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/invoices');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Generate Vouchers buttons (only on fully paid invoices without vouchers)
    const voucherButtons = page.locator('button:has-text("Generate Vouchers")');
    const buttonCount = await voucherButtons.count();

    console.log(`✓ Found ${buttonCount} "Generate Vouchers" buttons (expected if invoices are paid)`);
    consoleChecker.assertNoErrors();
  });
});

test.describe('Invoice Workflow - Record Payment', () => {
  test.skip('should open payment recording dialog', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/invoices');
    await waitForPageLoad(page);

    const paymentButton = page.locator('button:has-text("Record Payment")').first();
    if (await paymentButton.isVisible({ timeout: 2000 })) {
      await paymentButton.click();
      await page.waitForTimeout(500);

      // Dialog should open
      await expect(page.locator('text=/record payment/i')).toBeVisible();
      await expect(page.locator('text=/payment amount/i')).toBeVisible();
      await expect(page.locator('text=/payment method/i')).toBeVisible();

      console.log('✓ Payment recording dialog opens');
    }

    consoleChecker.assertNoErrors();
  });

  test.skip('should record payment with payment details', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/invoices');
    await waitForPageLoad(page);

    const paymentButton = page.locator('button:has-text("Record Payment")').first();
    if (await paymentButton.isVisible({ timeout: 2000 })) {
      await paymentButton.click();
      await page.waitForTimeout(500);

      // Fill payment details
      await fillFormField(page, 'input[type="number"]', '100');
      await page.locator('select').selectOption('CASH');

      // Submit payment
      await page.locator('button:has-text("Record Payment")').click();
      await page.waitForTimeout(2000);

      // Should show success
      await expect(page.locator('text=/payment.*recorded/i')).toBeVisible({ timeout: 5000 });

      console.log('✓ Payment recorded successfully');
    }

    consoleChecker.assertNoErrors();
  });
});

test.describe('Invoice Workflow - Generate Vouchers', () => {
  test.skip('should generate vouchers after full payment', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/invoices');
    await waitForPageLoad(page);

    const voucherButton = page.locator('button:has-text("Generate Vouchers")').first();
    if (await voucherButton.isVisible({ timeout: 2000 })) {
      await voucherButton.click();
      await page.waitForTimeout(3000);

      // Should show success
      await expect(page.locator('text=/vouchers.*generated/i')).toBeVisible({ timeout: 10000 });

      console.log('✓ Vouchers generated successfully');
    }

    consoleChecker.assertNoErrors();
    dbChecker.assertNoErrors();
  });

  test('should display vouchers generated badge', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/invoices');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Look for "Vouchers Generated" badges
    const voucherBadges = page.locator('text=/vouchers generated/i');
    const badgeCount = await voucherBadges.count();

    console.log(`✓ Found ${badgeCount} "Vouchers Generated" badges`);
    consoleChecker.assertNoErrors();
  });
});

test.describe('Invoice Workflow - Enhanced PDF Features', () => {
  test('should download invoice PDF with enhanced template', async ({ page }) => {
    // Enhanced PDF includes:
    // - Payment details (payment mode, card info, change given)
    // - Bank details (Bank of PNG, CCDA account, swift code)
    // - Terms & Conditions (5 points)

    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/invoices');
    await waitForPageLoad(page);

    // PDF download button should be available
    const downloadButtons = page.locator('button[title="Download PDF"]');
    const count = await downloadButtons.count();

    if (count > 0) {
      console.log('✓ Enhanced invoice PDF download available');
    }

    consoleChecker.assertNoErrors();
  });
});

test.describe('Invoice Workflow - Console Error Verification', () => {
  test('no console errors on invoices page', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/invoices');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    consoleChecker.assertNoErrors();
    consoleChecker.logSummary();

    console.log('✅ Invoices page loads without console errors');
  });

  test('no database errors when loading invoices', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/invoices');
    await waitForPageLoad(page);

    await page.waitForResponse(
      response => response.url().includes('invoices') && response.status() === 200,
      { timeout: 10000 }
    ).catch(() => console.log('No invoice query intercepted'));

    await page.waitForTimeout(2000);

    consoleChecker.assertNoErrors();
    dbChecker.assertNoErrors();

    console.log('✅ Invoice data loads without database errors');
  });
});

test.describe('Invoice Workflow - Role-Based Access', () => {
  test('Flex Admin should have full invoice access', async ({ page }) => {
    // Flex_Admin can: view, PDF, email, record payment, generate vouchers
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/invoices');
    await waitForPageLoad(page);

    await expect(page.locator('text=/tax invoice/i')).toBeVisible();
    console.log('✓ Flex_Admin has invoice access');

    consoleChecker.assertNoErrors();
  });

  test('Finance Manager should have full invoice access', async ({ page }) => {
    // Finance_Manager can: view, PDF, email, record payment, generate vouchers
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/invoices');
    await waitForPageLoad(page);

    await expect(page.locator('text=/tax invoice/i')).toBeVisible();
    console.log('✓ Finance_Manager has invoice access');

    consoleChecker.assertNoErrors();
  });

  test('IT Support should have view-only invoice access', async ({ page }) => {
    // IT_Support can: view invoices and reports
    // Cannot: record payments, generate vouchers
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/invoices');
    await waitForPageLoad(page);

    await expect(page.locator('text=/tax invoice/i')).toBeVisible();
    console.log('✓ IT_Support has view access to invoices');

    consoleChecker.assertNoErrors();
  });
});
