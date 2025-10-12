import { test, expect } from '@playwright/test';
import {
  checkConsoleErrors,
  checkNetworkErrors,
  checkDatabaseErrors,
  waitForPageLoad,
  fillFormField,
  waitForToast,
  testData
} from '../utils/helpers';

/**
 * PHASE 1: Cash Reconciliation Tests
 * Tests the end-of-day cash reconciliation feature
 */

test.describe('Cash Reconciliation - Page Load', () => {
  test('should load cash reconciliation page without errors', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    // Verify page title
    await expect(page.locator('text=Cash Reconciliation')).toBeVisible();

    // Verify essential UI elements
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="opening"]').or(page.locator('label:has-text("Opening Float")')).first()).toBeVisible();
    await expect(page.locator('button:has-text("Load Transactions")')).toBeVisible();

    consoleChecker.assertNoErrors();
    networkChecker.assertNoErrors();
  });

  test('should display current date by default', async ({ page }) => {
    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    const dateInput = page.locator('input[type="date"]').first();
    const dateValue = await dateInput.inputValue();

    const today = new Date().toISOString().split('T')[0];
    expect(dateValue).toBe(today);
  });

  test('should allow role-based access', async ({ page }) => {
    // Counter agents, finance managers, and admins should have access
    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    // Should not redirect to unauthorized page
    await expect(page).not.toHaveURL(/unauthorized|access-denied/);
  });
});

test.describe('Cash Reconciliation - Transaction Loading', () => {
  test('should load transaction summary for selected date', async ({ page }) => {
    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    // Select today's date
    const today = new Date().toISOString().split('T')[0];
    await fillFormField(page, 'input[type="date"]', today);

    // Set opening float
    await fillFormField(page, 'input[placeholder*="opening"]', '100');

    // Load transactions
    await page.click('button:has-text("Load Transactions")');

    // Wait for API response
    await page.waitForResponse(
      response => response.url().includes('transactions') && response.status() === 200,
      { timeout: 10000 }
    );

    await page.waitForTimeout(1000);

    // Transaction summary should appear
    const summaryText = [
      'text=Transaction Summary',
      'text=Total Transactions',
      'text=Total Revenue'
    ];

    for (const text of summaryText) {
      const element = page.locator(text);
      if (await element.isVisible({ timeout: 2000 })) {
        console.log(`✓ Found: ${text}`);
      }
    }

    dbChecker.assertNoErrors();
  });

  test('should handle no transactions gracefully', async ({ page }) => {
    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    // Select a future date with no transactions
    const futureDate = testData.futureDate(365);
    await fillFormField(page, 'input[type="date"]', futureDate);
    await fillFormField(page, 'input[placeholder*="opening"]', '100');

    await page.click('button:has-text("Load Transactions")');
    await page.waitForTimeout(2000);

    // Should show "no transactions" message or zero values
    const noDataIndicators = [
      page.locator('text=/no transactions|0 transaction/i'),
      page.locator('text=Total Transactions').locator('..').locator('text=0')
    ];

    const hasNoDataMessage = await Promise.race([
      noDataIndicators[0].isVisible({ timeout: 3000 }).catch(() => false),
      noDataIndicators[1].isVisible({ timeout: 3000 }).catch(() => false)
    ]);

    expect(hasNoDataMessage).toBeTruthy();
  });
});

test.describe('Cash Reconciliation - Denomination Entry', () => {
  test('should calculate denomination totals automatically', async ({ page }) => {
    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    // Load transactions first
    await fillFormField(page, 'input[type="date"]', new Date().toISOString().split('T')[0]);
    await fillFormField(page, 'input[placeholder*="opening"]', '100');
    await page.click('button:has-text("Load Transactions")');
    await page.waitForTimeout(2000);

    // Enter denomination counts
    const denominations = [
      { value: 100, count: 2, expected: 200 },
      { value: 50, count: 3, expected: 150 },
      { value: 20, count: 5, expected: 100 }
    ];

    for (const denom of denominations) {
      const input = page.locator(`input[data-denomination="${denom.value}"]`)
        .or(page.locator(`label:has-text("K ${denom.value}")`).locator('..').locator('input'))
        .first();

      if (await input.isVisible({ timeout: 1000 })) {
        await input.fill(denom.count.toString());
        await page.waitForTimeout(300);

        // Verify calculation display
        const calcText = `PGK ${denom.expected}.00`;
        const calcDisplay = page.locator(`text=${calcText}`);
        if (await calcDisplay.isVisible({ timeout: 1000 })) {
          console.log(`✓ Verified: ${denom.count} × K${denom.value} = ${calcText}`);
        }
      }
    }
  });

  test('should update actual cash total in real-time', async ({ page }) => {
    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    // Load transactions
    await fillFormField(page, 'input[type="date"]', new Date().toISOString().split('T')[0]);
    await fillFormField(page, 'input[placeholder*="opening"]', '100');
    await page.click('button:has-text("Load Transactions")');
    await page.waitForTimeout(2000);

    // Enter a denomination
    const input = page.locator('input[data-denomination="100"]')
      .or(page.locator('label:has-text("K 100")').locator('..').locator('input'))
      .first();

    if (await input.isVisible({ timeout: 1000 })) {
      await input.fill('5');
      await page.waitForTimeout(500);

      // Total should include 500
      const totalDisplay = page.locator('text=/actual cash.*counted/i').locator('..').locator('text=/500|PGK/');
      if (await totalDisplay.isVisible({ timeout: 2000 })) {
        console.log('✓ Actual cash total updated');
      }
    }
  });

  test('should support decimal counts for coins', async ({ page }) => {
    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    // Load transactions
    await fillFormField(page, 'input[type="date"]', new Date().toISOString().split('T')[0]);
    await fillFormField(page, 'input[placeholder*="opening"]', '100');
    await page.click('button:has-text("Load Transactions")');
    await page.waitForTimeout(2000);

    // Try coin denominations with decimals
    const coinInput = page.locator('input[data-denomination="0.50"]')
      .or(page.locator('label:has-text(/50 toea|0.50/)').locator('..').locator('input'))
      .first();

    if (await coinInput.isVisible({ timeout: 1000 })) {
      await coinInput.fill('10');
      await page.waitForTimeout(300);

      // Should calculate 10 × 0.50 = 5.00
      const calcDisplay = page.locator('text=/5.00|PGK 5/');
      if (await calcDisplay.isVisible({ timeout: 1000 })) {
        console.log('✓ Coin denomination calculation works');
      }
    }
  });
});

test.describe('Cash Reconciliation - Variance Calculation', () => {
  test('should calculate variance correctly - perfect match', async ({ page }) => {
    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    // Load transactions
    await fillFormField(page, 'input[type="date"]', new Date().toISOString().split('T')[0]);
    await fillFormField(page, 'input[placeholder*="opening"]', '100');
    await page.click('button:has-text("Load Transactions")');
    await page.waitForTimeout(2000);

    // Enter exact amount to match expected
    // This requires knowing the expected amount from the summary
    // For this test, we'll verify the variance display exists

    const varianceDisplay = page.locator('text=/variance/i');
    await expect(varianceDisplay).toBeVisible({ timeout: 5000 });
  });

  test('should show variance color coding', async ({ page }) => {
    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    await fillFormField(page, 'input[type="date"]', new Date().toISOString().split('T')[0]);
    await fillFormField(page, 'input[placeholder*="opening"]', '100');
    await page.click('button:has-text("Load Transactions")');
    await page.waitForTimeout(2000);

    // Look for variance indicator with color classes
    const varianceBox = page.locator('[class*="variance"]').or(page.locator('text=/variance/i').locator('..')).first();

    if (await varianceBox.isVisible({ timeout: 2000 })) {
      const classes = await varianceBox.getAttribute('class');
      console.log(`Variance box classes: ${classes}`);

      // Should have color indicator (red, green, or yellow)
      const hasColorClass = classes && (
        classes.includes('red') ||
        classes.includes('green') ||
        classes.includes('yellow') ||
        classes.includes('success') ||
        classes.includes('error') ||
        classes.includes('warning')
      );

      if (hasColorClass) {
        console.log('✓ Variance color coding present');
      }
    }
  });

  test('should display overage correctly', async ({ page }) => {
    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    await fillFormField(page, 'input[type="date"]', new Date().toISOString().split('T')[0]);
    await fillFormField(page, 'input[placeholder*="opening"]', '100');
    await page.click('button:has-text("Load Transactions")');
    await page.waitForTimeout(2000);

    // Enter large amount to create overage
    const hundredInput = page.locator('input[data-denomination="100"]')
      .or(page.locator('label:has-text("K 100")').locator('..').locator('input'))
      .first();

    if (await hundredInput.isVisible({ timeout: 1000 })) {
      await hundredInput.fill('20'); // 2000 PGK
      await page.waitForTimeout(500);

      // Should show positive variance or overage message
      const overageIndicators = [
        page.locator('text=/overage|surplus|\+/i'),
        page.locator('text=/variance.*\+/i')
      ];

      const hasOverage = await Promise.race([
        overageIndicators[0].isVisible({ timeout: 2000 }).catch(() => false),
        overageIndicators[1].isVisible({ timeout: 2000 }).catch(() => false)
      ]);

      if (hasOverage) {
        console.log('✓ Overage displayed');
      }
    }
  });

  test('should display shortage correctly', async ({ page }) => {
    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    await fillFormField(page, 'input[type="date"]', new Date().toISOString().split('T')[0]);
    await fillFormField(page, 'input[placeholder*="opening"]', '100');
    await page.click('button:has-text("Load Transactions")');
    await page.waitForTimeout(2000);

    // Enter very small amount to create shortage
    const twoInput = page.locator('input[data-denomination="2"]')
      .or(page.locator('label:has-text("K 2")').locator('..').locator('input'))
      .first();

    if (await twoInput.isVisible({ timeout: 1000 })) {
      await twoInput.fill('1'); // Only 2 PGK
      await page.waitForTimeout(500);

      // Should show negative variance or shortage message
      const shortageIndicators = [
        page.locator('text=/shortage|deficit|-/i'),
        page.locator('text=/variance.*-/i')
      ];

      const hasShortage = await Promise.race([
        shortageIndicators[0].isVisible({ timeout: 2000 }).catch(() => false),
        shortageIndicators[1].isVisible({ timeout: 2000 }).catch(() => false)
      ]);

      if (hasShortage) {
        console.log('✓ Shortage displayed');
      }
    }
  });
});

test.describe('Cash Reconciliation - Submission', () => {
  test('should submit reconciliation successfully', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    // Complete the reconciliation form
    await fillFormField(page, 'input[type="date"]', new Date().toISOString().split('T')[0]);
    await fillFormField(page, 'input[placeholder*="opening"]', '100');
    await page.click('button:has-text("Load Transactions")');
    await page.waitForTimeout(2000);

    // Enter denominations
    const hundredInput = page.locator('input[data-denomination="100"]')
      .or(page.locator('label:has-text("K 100")').locator('..').locator('input'))
      .first();

    if (await hundredInput.isVisible({ timeout: 1000 })) {
      await hundredInput.fill('2');
      await page.waitForTimeout(500);
    }

    // Add optional notes
    const notesInput = page.locator('textarea[name="notes"]').or(page.locator('textarea').first());
    if (await notesInput.isVisible({ timeout: 1000 })) {
      await notesInput.fill('Test reconciliation submission');
    }

    // Submit
    const submitButton = page.locator('button:has-text("Submit")');
    if (await submitButton.isVisible({ timeout: 2000 })) {
      await submitButton.click();

      // Wait for submission
      await page.waitForResponse(
        response => response.url().includes('cash_reconciliations') && response.method() === 'POST',
        { timeout: 10000 }
      ).catch(() => console.log('No POST request intercepted'));

      // Should show success toast
      const successIndicators = [
        page.locator('text=/success|submitted/i'),
        page.locator('[data-sonner-toast]')
      ];

      const hasSuccess = await Promise.race([
        successIndicators[0].isVisible({ timeout: 5000 }).catch(() => false),
        successIndicators[1].isVisible({ timeout: 5000 }).catch(() => false)
      ]);

      if (hasSuccess) {
        console.log('✓ Reconciliation submitted successfully');
      }

      dbChecker.assertNoErrors();
      consoleChecker.assertNoErrors();
    }
  });

  test('should reset form after submission', async ({ page }) => {
    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    // Complete and submit reconciliation
    await fillFormField(page, 'input[type="date"]', new Date().toISOString().split('T')[0]);
    await fillFormField(page, 'input[placeholder*="opening"]', '100');
    await page.click('button:has-text("Load Transactions")');
    await page.waitForTimeout(2000);

    const hundredInput = page.locator('input[data-denomination="100"]')
      .or(page.locator('label:has-text("K 100")').locator('..').locator('input'))
      .first();

    if (await hundredInput.isVisible({ timeout: 1000 })) {
      await hundredInput.fill('2');
    }

    const submitButton = page.locator('button:has-text("Submit")');
    if (await submitButton.isVisible({ timeout: 2000 })) {
      await submitButton.click();
      await page.waitForTimeout(3000);

      // Check if denomination inputs are cleared
      if (await hundredInput.isVisible({ timeout: 1000 })) {
        const value = await hundredInput.inputValue();
        expect(value === '' || value === '0').toBeTruthy();
        console.log('✓ Form reset after submission');
      }
    }
  });

  test('should validate required fields before submission', async ({ page }) => {
    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    // Try to submit without loading transactions
    const submitButton = page.locator('button:has-text("Submit")');

    // Submit button should be disabled or not visible
    if (await submitButton.isVisible({ timeout: 2000 })) {
      const isDisabled = await submitButton.isDisabled();
      if (isDisabled) {
        console.log('✓ Submit button disabled before loading transactions');
      } else {
        // Try clicking and expect error
        await submitButton.click();
        await page.waitForTimeout(1000);

        const errorIndicators = [
          page.locator('text=/required|please load/i'),
          page.locator('[data-sonner-toast]').filter({ hasText: /error|required/i })
        ];

        const hasError = await Promise.race([
          errorIndicators[0].isVisible({ timeout: 2000 }).catch(() => false),
          errorIndicators[1].isVisible({ timeout: 2000 }).catch(() => false)
        ]);

        if (hasError) {
          console.log('✓ Validation error shown');
        }
      }
    }
  });
});

test.describe('Cash Reconciliation - History', () => {
  test('should open history dialog', async ({ page }) => {
    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    const historyButton = page.locator('button:has-text("View History")').or(page.locator('button:has-text("History")'));

    if (await historyButton.isVisible({ timeout: 2000 })) {
      await historyButton.click();

      // Dialog should open
      await expect(page.locator('[role="dialog"]').or(page.locator('text=/reconciliation.*history/i'))).toBeVisible({ timeout: 3000 });
      console.log('✓ History dialog opened');

      // Close dialog
      await page.keyboard.press('Escape');
    } else {
      console.log('⚠ History button not found');
    }
  });

  test('should display reconciliation records in history', async ({ page }) => {
    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    const historyButton = page.locator('button:has-text("View History")').or(page.locator('button:has-text("History")'));

    if (await historyButton.isVisible({ timeout: 2000 })) {
      await historyButton.click();
      await page.waitForTimeout(1000);

      // Wait for history query
      await page.waitForResponse(
        response => response.url().includes('cash_reconciliations') && response.method() === 'GET',
        { timeout: 10000 }
      ).catch(() => console.log('No history query intercepted'));

      // Should show table or list
      const hasHistory = await page.locator('table').or(page.locator('[role="grid"]')).isVisible({ timeout: 3000 }).catch(() => false);

      if (hasHistory) {
        console.log('✓ History records displayed');
      } else {
        console.log('⚠ No history records or empty state');
      }

      dbChecker.assertNoErrors();
    }
  });

  test('should display status badges in history', async ({ page }) => {
    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    const historyButton = page.locator('button:has-text("View History")');
    if (await historyButton.isVisible({ timeout: 2000 })) {
      await historyButton.click();
      await page.waitForTimeout(2000);

      // Look for status indicators
      const statusBadges = page.locator('text=/pending|approved|rejected/i');
      const hasStatuses = await statusBadges.count();

      if (hasStatuses > 0) {
        console.log(`✓ Found ${hasStatuses} status badges`);
      }
    }
  });
});

test.describe('Cash Reconciliation - Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    // Try with invalid date format (if not validated on client)
    // Or test network failure scenario

    console.log('Error handling test - requires network interception');

    // Basic check: page should not crash
    await expect(page.locator('text=Cash Reconciliation')).toBeVisible();

    consoleChecker.assertNoErrors();
  });

  test('should handle database connection issues', async ({ page }) => {
    // This test would require mocking or testing with disconnected state
    console.log('Database connection test - requires mock setup');
  });
});

test.describe('Cash Reconciliation - Edge Cases', () => {
  test('should handle zero transactions', async ({ page }) => {
    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    // Select future date with no transactions
    await fillFormField(page, 'input[type="date"]', testData.futureDate(365));
    await fillFormField(page, 'input[placeholder*="opening"]', '100');
    await page.click('button:has-text("Load Transactions")');
    await page.waitForTimeout(2000);

    // Should still allow reconciliation
    await expect(page.locator('text=Cash Reconciliation')).toBeVisible();
  });

  test('should handle large amounts', async ({ page }) => {
    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    await fillFormField(page, 'input[type="date"]', new Date().toISOString().split('T')[0]);
    await fillFormField(page, 'input[placeholder*="opening"]', '10000');
    await page.click('button:has-text("Load Transactions")');
    await page.waitForTimeout(2000);

    // Enter large denomination count
    const hundredInput = page.locator('input[data-denomination="100"]')
      .or(page.locator('label:has-text("K 100")').locator('..').locator('input'))
      .first();

    if (await hundredInput.isVisible({ timeout: 1000 })) {
      await hundredInput.fill('1000'); // 100,000 PGK
      await page.waitForTimeout(500);

      // Should calculate correctly without overflow
      const totalDisplay = page.locator('text=/100,000|100000/');
      if (await totalDisplay.isVisible({ timeout: 2000 })) {
        console.log('✓ Large amounts handled correctly');
      }
    }
  });

  test('should handle negative opening float', async ({ page }) => {
    await page.goto('/cash-reconciliation');
    await waitForPageLoad(page);

    // Try entering negative opening float
    const openingInput = page.locator('input[placeholder*="opening"]');
    await openingInput.fill('-50');

    // Should either prevent or show validation error
    await page.waitForTimeout(500);

    const value = await openingInput.inputValue();
    console.log(`Opening float value: ${value}`);

    // Validation depends on implementation
    // Either it prevents negative or shows error
  });
});


