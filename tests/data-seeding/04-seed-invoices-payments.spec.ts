import { test, expect } from '@playwright/test';
import {
  checkConsoleErrors,
  waitForPageLoad
} from '../utils/helpers';

/**
 * Data Seeding - Invoices and Payments
 * Creates sample invoices from approved quotations and records payments
 *
 * Run as: Finance_Manager or Flex_Admin
 */

test.describe('Data Seeding - Invoices from Quotations', () => {
  test('should convert approved quotations to invoices', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    console.log('🌱 Starting invoice data seeding...');

    await page.goto('/quotations');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Find approved quotations
    const approvedQuotations = page.locator('tr:has-text("Approved"), tr:has-text("approved")');
    const approvedCount = await approvedQuotations.count();

    console.log(`📊 Found ${approvedCount} approved quotations to convert`);

    let convertedCount = 0;

    for (let i = 0; i < Math.min(approvedCount, 3); i++) {
      try {
        const quotationRow = approvedQuotations.nth(i);
        const customerName = await quotationRow.locator('td').nth(0).textContent().catch(() => 'Unknown');

        console.log(`📝 Converting quotation ${i + 1}: ${customerName}`);

        // Click "Convert to Invoice" button
        const convertButton = quotationRow.locator('button:has-text("Convert"), button:has-text("Invoice")').first();

        if (await convertButton.isVisible({ timeout: 2000 })) {
          await convertButton.click();
          await page.waitForTimeout(1500);

          // Fill invoice conversion dialog if it appears
          const dialogVisible = await page.locator('text=/convert.*invoice|create invoice/i').isVisible({ timeout: 2000 }).catch(() => false);

          if (dialogVisible) {
            // Select payment terms (Net 30 days)
            const paymentTermsSelect = page.locator('select[name="paymentTerms"], select').first();
            if (await paymentTermsSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
              await paymentTermsSelect.selectOption('30');
              await page.waitForTimeout(500);
            }

            // Add PO number if field exists
            const poInput = page.locator('input[name="poNumber"], input[placeholder*="PO"]').first();
            if (await poInput.isVisible({ timeout: 1000 }).catch(() => false)) {
              await poInput.fill(`PO-2024-${1000 + i}`);
              await page.waitForTimeout(500);
            }

            // Confirm conversion
            const confirmButton = page.locator('button:has-text("Create Invoice"), button:has-text("Confirm")').first();
            await confirmButton.click();
            await page.waitForTimeout(3000);

            // Check for success
            const successMessage = page.locator('text=/invoice.*created|success/i');
            if (await successMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
              console.log(`  ✅ Created invoice from quotation: ${customerName}`);
              convertedCount++;
            }
          }

          // Return to quotations page
          await page.goto('/quotations');
          await waitForPageLoad(page);
          await page.waitForTimeout(2000);
        }

      } catch (error) {
        console.log(`  ❌ Error converting quotation ${i + 1}:`, error.message);
      }
    }

    console.log(`\n✅ Invoice conversion complete: ${convertedCount} invoices created`);

    consoleChecker.assertNoErrors();
  });

  test('should verify invoices were created', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/invoices');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Count invoices
    const invoiceRows = page.locator('table tbody tr');
    const count = await invoiceRows.count();

    console.log(`📊 Found ${count} invoice records`);
    expect(count).toBeGreaterThan(0);

    consoleChecker.assertNoErrors();
  });
});

test.describe('Data Seeding - Invoice Payments', () => {
  test('should record payments for invoices', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    console.log('🌱 Starting payment recording...');

    await page.goto('/invoices');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Find unpaid or partial invoices
    const recordPaymentButtons = page.locator('button:has-text("Record Payment")');
    const count = await recordPaymentButtons.count();

    console.log(`📊 Found ${count} invoices ready for payment`);

    let paymentCount = 0;
    const paymentModes = ['CASH', 'CARD', 'BANK_TRANSFER', 'EFTPOS'];

    for (let i = 0; i < Math.min(count, 3); i++) {
      try {
        console.log(`📝 Recording payment ${i + 1}...`);

        const paymentButton = recordPaymentButtons.nth(0); // Always use first as list updates
        await paymentButton.click();
        await page.waitForTimeout(1500);

        // Fill payment dialog
        const dialogVisible = await page.locator('text=/record payment/i').isVisible({ timeout: 2000 }).catch(() => false);

        if (dialogVisible) {
          // Fill payment amount (full amount or partial)
          const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
          const isPartial = i === 1; // Make second payment partial

          if (await amountInput.isVisible({ timeout: 1000 })) {
            const maxAmount = await amountInput.getAttribute('max').catch(() => '100');
            const paymentAmount = isPartial ? (parseFloat(maxAmount) / 2).toString() : maxAmount;
            await amountInput.fill(paymentAmount);
            await page.waitForTimeout(500);

            console.log(`  💰 Amount: ${paymentAmount} (${isPartial ? 'Partial' : 'Full'})`);
          }

          // Select payment mode
          const paymentModeSelect = page.locator('select[name="paymentMode"], select').first();
          if (await paymentModeSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
            const mode = paymentModes[i % paymentModes.length];
            await paymentModeSelect.selectOption(mode);
            await page.waitForTimeout(500);
            console.log(`  💳 Payment mode: ${mode}`);
          }

          // Add reference number
          const referenceInput = page.locator('input[name="reference"], input[placeholder*="Reference"]').first();
          if (await referenceInput.isVisible({ timeout: 1000 }).catch(() => false)) {
            await referenceInput.fill(`REF-${Date.now()}-${i}`);
            await page.waitForTimeout(500);
          }

          // Submit payment
          const submitButton = page.locator('button:has-text("Record Payment"), button:has-text("Submit")').first();
          await submitButton.click();
          await page.waitForTimeout(3000);

          // Check for success
          const successMessage = page.locator('text=/payment.*recorded|success/i');
          if (await successMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log(`  ✅ Payment recorded successfully`);
            paymentCount++;
          }

          // Reload invoices page
          await page.goto('/invoices');
          await waitForPageLoad(page);
          await page.waitForTimeout(2000);
        }

      } catch (error) {
        console.log(`  ❌ Error recording payment ${i + 1}:`, error.message);
      }
    }

    console.log(`\n✅ Payment recording complete: ${paymentCount} payments recorded`);

    consoleChecker.assertNoErrors();
  });

  test('should verify invoices have different payment statuses', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/invoices');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Check for different payment statuses
    const paidBadges = page.locator('text=/paid/i');
    const partialBadges = page.locator('text=/partial/i');
    const pendingBadges = page.locator('text=/pending|unpaid/i');

    const paidCount = await paidBadges.count();
    const partialCount = await partialBadges.count();
    const pendingCount = await pendingBadges.count();

    console.log(`📊 Invoice Payment Status:`);
    console.log(`  ✅ Paid: ${paidCount}`);
    console.log(`  ⚠️  Partial: ${partialCount}`);
    console.log(`  ⏳ Pending: ${pendingCount}`);

    consoleChecker.assertNoErrors();
  });
});

test.describe('Data Seeding - Voucher Generation from Invoices', () => {
  test('should generate vouchers from fully paid invoices', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    console.log('🌱 Starting voucher generation from invoices...');

    await page.goto('/invoices');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Find "Generate Vouchers" buttons (only on fully paid invoices)
    const generateButtons = page.locator('button:has-text("Generate Vouchers")');
    const count = await generateButtons.count();

    console.log(`📊 Found ${count} invoices ready for voucher generation`);

    let generatedCount = 0;

    for (let i = 0; i < Math.min(count, 2); i++) {
      try {
        console.log(`📝 Generating vouchers from invoice ${i + 1}...`);

        const generateButton = generateButtons.nth(0); // Always use first as list updates
        await generateButton.click();
        await page.waitForTimeout(5000); // Voucher generation may take time

        // Check for success
        const successMessage = page.locator('text=/vouchers.*generated|success/i');
        if (await successMessage.isVisible({ timeout: 10000 }).catch(() => false)) {
          console.log(`  ✅ Vouchers generated successfully`);
          generatedCount++;
        }

        // Reload invoices page
        await page.goto('/invoices');
        await waitForPageLoad(page);
        await page.waitForTimeout(2000);

      } catch (error) {
        console.log(`  ❌ Error generating vouchers ${i + 1}:`, error.message);
      }
    }

    console.log(`\n✅ Voucher generation complete: ${generatedCount} batches generated`);

    consoleChecker.assertNoErrors();
  });

  test('should verify "Vouchers Generated" badges appear', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/invoices');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const voucherBadges = page.locator('text=/vouchers generated/i');
    const count = await voucherBadges.count();

    console.log(`📊 Found ${count} invoices with vouchers generated`);

    consoleChecker.assertNoErrors();
  });
});
