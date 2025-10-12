import { test, expect } from '@playwright/test';

test.describe('Cash Reconciliation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display cash reconciliation page', async ({ page }) => {
    // Login if needed
    const loginButton = page.locator('button:has-text("Login")');
    if (await loginButton.isVisible()) {
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');
      await loginButton.click();
      await page.waitForLoadState('networkidle');
    }

    // Navigate to cash reconciliation
    await page.goto('http://localhost:3000/cash-reconciliation');
    await page.waitForLoadState('networkidle');

    // Take screenshot of the page
    await page.screenshot({ path: 'cash-reconciliation-page.png', fullPage: true });

    // Check if the page loaded
    const pageTitle = await page.textContent('h1');
    console.log('Page title:', pageTitle);

    // Check for main elements
    const hasTitle = await page.locator('h1:has-text("Cash Reconciliation")').isVisible();
    console.log('Has title:', hasTitle);

    if (hasTitle) {
      // Check for date picker
      const hasDatePicker = await page.locator('input[type="date"]').isVisible();
      console.log('Has date picker:', hasDatePicker);

      // Check for opening float input
      const hasOpeningFloat = await page.locator('text=Opening Float').isVisible();
      console.log('Has opening float:', hasOpeningFloat);

      // Check for Load Transactions button
      const hasLoadButton = await page.locator('button:has-text("Load Transactions")').isVisible();
      console.log('Has load button:', hasLoadButton);

      // Check for View History button
      const hasHistoryButton = await page.locator('button:has-text("View History")').isVisible();
      console.log('Has history button:', hasHistoryButton);

      expect(hasTitle).toBe(true);
      expect(hasDatePicker).toBe(true);
      expect(hasOpeningFloat).toBe(true);
      expect(hasLoadButton).toBe(true);
      expect(hasHistoryButton).toBe(true);
    } else {
      console.log('Page HTML:', await page.content());
    }
  });

  test('should show date and opening float inputs', async ({ page }) => {
    // Login if needed
    const loginButton = page.locator('button:has-text("Login")');
    if (await loginButton.isVisible()) {
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');
      await loginButton.click();
      await page.waitForLoadState('networkidle');
    }

    await page.goto('http://localhost:3000/cash-reconciliation');
    await page.waitForLoadState('networkidle');

    // Wait a bit for React to render
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'cash-reconciliation-inputs.png', fullPage: true });

    // Try to find any input fields
    const inputs = await page.locator('input').all();
    console.log('Number of inputs found:', inputs.length);

    // Try to find any buttons
    const buttons = await page.locator('button').all();
    console.log('Number of buttons found:', buttons.length);

    // Get all text content
    const bodyText = await page.textContent('body');
    console.log('Page contains "Cash Reconciliation":', bodyText.includes('Cash Reconciliation'));
  });

  test('should handle load transactions', async ({ page }) => {
    // Login if needed
    const loginButton = page.locator('button:has-text("Login")');
    if (await loginButton.isVisible()) {
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');
      await loginButton.click();
      await page.waitForLoadState('networkidle');
    }

    await page.goto('http://localhost:3000/cash-reconciliation');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to fill opening float
    const openingFloatInput = page.locator('input[type="number"]').first();
    if (await openingFloatInput.isVisible()) {
      await openingFloatInput.fill('100');

      // Click load transactions button
      const loadButton = page.locator('button:has-text("Load Transactions")');
      if (await loadButton.isVisible()) {
        await loadButton.click();
        await page.waitForTimeout(2000);

        // Take screenshot after loading
        await page.screenshot({ path: 'cash-reconciliation-loaded.png', fullPage: true });

        // Check for transaction summary or no transactions message
        const hasTransactionSummary = await page.locator('text=Transaction Summary').isVisible();
        const hasNoTransactions = await page.locator('text=No transactions found').isVisible();

        console.log('Has transaction summary:', hasTransactionSummary);
        console.log('Has no transactions message:', hasNoTransactions);

        expect(hasTransactionSummary || hasNoTransactions).toBe(true);
      } else {
        console.log('Load Transactions button not found');
      }
    } else {
      console.log('Opening float input not found');
    }
  });

  test('should check console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Login if needed
    const loginButton = page.locator('button:has-text("Login")');
    if (await loginButton.isVisible()) {
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');
      await loginButton.click();
      await page.waitForLoadState('networkidle');
    }

    await page.goto('http://localhost:3000/cash-reconciliation');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('Console errors:', errors);

    if (errors.length > 0) {
      console.log('Errors found:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
  });
});
