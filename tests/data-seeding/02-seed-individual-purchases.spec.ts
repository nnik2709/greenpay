import { test, expect } from '@playwright/test';
import {
  checkConsoleErrors,
  waitForPageLoad
} from '../utils/helpers';

/**
 * Data Seeding - Individual Purchases & Vouchers
 * Creates sample individual purchases with vouchers
 *
 * Run as: Counter_Agent or Flex_Admin
 */

// Sample purchase data (using passports created in previous test)
const samplePurchases = [
  {
    passportNumber: 'P12345678',
    paymentMode: 'CASH',
    amount: 100,
    quantity: 1
  },
  {
    passportNumber: 'P87654321',
    paymentMode: 'CARD',
    amount: 200,
    quantity: 2
  },
  {
    passportNumber: 'P11223344',
    paymentMode: 'EFTPOS',
    amount: 150,
    quantity: 1
  },
  {
    passportNumber: 'P55667788',
    paymentMode: 'BANK_TRANSFER',
    amount: 300,
    quantity: 3
  },
  {
    passportNumber: 'P99887766',
    paymentMode: 'CASH',
    amount: 100,
    quantity: 1
  }
];

test.describe('Data Seeding - Individual Purchases', () => {
  test('should create sample individual purchases with vouchers', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    console.log('🌱 Starting individual purchase data seeding...');

    await page.goto('/passports/create');
    await waitForPageLoad(page);

    let createdCount = 0;

    for (const purchase of samplePurchases) {
      console.log(`📝 Creating purchase for passport: ${purchase.passportNumber}`);

      try {
        // Enter passport number
        const passportInput = page.locator('input[name="passportNumber"], input[placeholder*="Passport"]').first();
        await passportInput.fill(purchase.passportNumber);
        await page.waitForTimeout(1000);

        // Wait for passport lookup/autofill
        await page.waitForTimeout(2000);

        // Select payment mode
        const paymentModeSelect = page.locator('select[name="paymentMode"], select:has-text("Cash")').first();
        if (await paymentModeSelect.isVisible({ timeout: 2000 })) {
          await paymentModeSelect.selectOption(purchase.paymentMode);
          await page.waitForTimeout(500);
        }

        // Fill amount if visible
        const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
        if (await amountInput.isVisible({ timeout: 1000 }).catch(() => false)) {
          await amountInput.fill(purchase.amount.toString());
          await page.waitForTimeout(500);
        }

        // Fill quantity if visible
        const quantityInput = page.locator('input[name="quantity"]').first();
        if (await quantityInput.isVisible({ timeout: 1000 }).catch(() => false)) {
          await quantityInput.fill(purchase.quantity.toString());
          await page.waitForTimeout(500);
        }

        // Submit purchase
        const submitButton = page.locator('button:has-text("Purchase"), button:has-text("Submit"), button[type="submit"]').first();
        await submitButton.click();
        await page.waitForTimeout(3000);

        // Check for success
        const successIndicators = [
          page.locator('text=/purchase.*successful|voucher.*generated/i'),
          page.locator('button:has-text("Print Voucher")'),
          page.locator('button:has-text("🌿 Print Green Card")')
        ];

        let purchaseCreated = false;
        for (const indicator of successIndicators) {
          if (await indicator.isVisible({ timeout: 2000 }).catch(() => false)) {
            purchaseCreated = true;
            break;
          }
        }

        if (purchaseCreated) {
          console.log(`  ✅ Created purchase for: ${purchase.passportNumber} (${purchase.paymentMode})`);
          createdCount++;
        } else {
          console.log(`  ⚠️  Purchase may have failed: ${purchase.passportNumber}`);
        }

        // Return to form for next entry
        await page.goto('/passports/create');
        await waitForPageLoad(page);

      } catch (error) {
        console.log(`  ❌ Error creating purchase for ${purchase.passportNumber}:`, error.message);
      }
    }

    console.log(`\n✅ Individual purchase seeding complete: ${createdCount}/${samplePurchases.length} created`);

    consoleChecker.assertNoErrors();
  });

  test('should verify individual purchases were created', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/individual-purchase');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Count purchases in table
    const purchaseRows = page.locator('table tbody tr');
    const count = await purchaseRows.count();

    console.log(`📊 Found ${count} individual purchase records`);
    expect(count).toBeGreaterThan(0);

    consoleChecker.assertNoErrors();
  });

  test('should verify vouchers were generated', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/vouchers');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Count vouchers
    const voucherRows = page.locator('table tbody tr');
    const count = await voucherRows.count();

    console.log(`📊 Found ${count} voucher records`);
    expect(count).toBeGreaterThan(0);

    consoleChecker.assertNoErrors();
  });
});
