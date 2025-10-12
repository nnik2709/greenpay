import { test, expect } from '@playwright/test';
import { checkConsoleErrors, checkNetworkErrors, waitForPageLoad, checkDatabaseErrors } from '../utils/helpers';

/**
 * PHASE 1: Dashboard Tests
 * Validates dashboard functionality with real data
 */

test.describe('Dashboard - Basic Functionality', () => {
  test('should load dashboard without errors', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);
    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/dashboard');
    await waitForPageLoad(page);

    // Verify dashboard title (use heading to be specific)
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    // Check for revenue cards (use h3 headings to be specific)
    await expect(page.locator('h3:has-text("Overall Revenue")')).toBeVisible();
    await expect(page.locator('h3:has-text("Today\'s Revenue")')).toBeVisible();

    // Verify no errors
    consoleChecker.assertNoErrors();
    networkChecker.assertNoErrors();
    dbChecker.assertNoErrors();
  });

  test('should display all 6 stat cards', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageLoad(page);

    const expectedCards = [
      'Overall Revenue',
      "Today's Revenue",
      'Card Payments',
      'Cash Payments',
      'Total Individual Purchases',
      'Total Corporate Purchases'
    ];

    for (const cardTitle of expectedCards) {
      await expect(page.locator(`h3:has-text("${cardTitle}")`)).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display charts', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageLoad(page);

    // Check for chart containers (Recharts library)
    const charts = page.locator('.recharts-wrapper');
    const chartCount = await charts.count();

    // Should have at least 4 charts (Individual, Corporate, Overall, Nationality)
    expect(chartCount).toBeGreaterThanOrEqual(4);
  });

  test('should filter data by date range', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/dashboard');
    await waitForPageLoad(page);

    // Set date range
    const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = new Date().toISOString().split('T')[0];

    await page.fill('input[type="date"]', fromDate);
    await page.fill('input[type="date"]:nth-of-type(2)', toDate);

    // Click filter button
    const filterButton = page.locator('button:has-text("Filter")');
    if (await filterButton.isVisible({ timeout: 2000 })) {
      await filterButton.click();
      await waitForPageLoad(page);
    }

    // Verify charts updated (no errors thrown)
    consoleChecker.assertNoErrors();
  });

  test('should load transaction data from database', async ({ page }) => {
    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/dashboard');

    // Wait for transactions query
    await page.waitForResponse(
      response => response.url().includes('transactions') && response.status() === 200,
      { timeout: 10000 }
    );

    await waitForPageLoad(page);

    dbChecker.assertNoErrors();
  });
});
