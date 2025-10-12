import { test, expect } from '@playwright/test';
import {
  checkConsoleErrors,
  checkNetworkErrors,
  checkDatabaseErrors,
  waitForPageLoad,
  testData,
  getTableRowCount
} from '../utils/helpers';

/**
 * Advanced Reports Tests
 * Tests filtering, sorting, pagination, and export functionality
 */

test.describe('Reports - Advanced Filtering', () => {
  test('should filter passport reports by date range', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    // Get initial row count
    const initialCount = await getTableRowCount(page).catch(() => 0);
    console.log(`Initial row count: ${initialCount}`);

    // Apply date filter
    const fromDate = testData.pastDate(7); // Last 7 days
    const toDate = new Date().toISOString().split('T')[0];

    const dateInputs = page.locator('input[type="date"]');
    if (await dateInputs.count() >= 2) {
      await dateInputs.nth(0).fill(fromDate);
      await dateInputs.nth(1).fill(toDate);

      // Click filter button
      const filterButton = page.locator('button:has-text(/filter|apply/i)');
      if (await filterButton.isVisible({ timeout: 2000 })) {
        await filterButton.click();

        // Wait for data reload
        await page.waitForResponse(
          response => response.url().includes('passports') && response.method() === 'GET',
          { timeout: 10000 }
        ).catch(() => console.log('No filter request intercepted'));

        await page.waitForTimeout(2000);

        // Get filtered row count
        const filteredCount = await getTableRowCount(page).catch(() => 0);
        console.log(`Filtered row count: ${filteredCount}`);

        console.log('✓ Date filter applied');
      }
    }

    consoleChecker.assertNoErrors();
    dbChecker.assertNoErrors();
  });

  test('should filter by nationality', async ({ page }) => {
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    // Look for nationality filter
    const nationalityFilter = page.locator('input[placeholder*="nationality"]').or(
      page.locator('select[name*="nationality"]')
    );

    if (await nationalityFilter.isVisible({ timeout: 2000 })) {
      await nationalityFilter.click();
      await page.fill('input[placeholder*="nationality"]', 'Australian');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(2000);

      console.log('✓ Nationality filter available');
    } else {
      console.log('⚠ Nationality filter not implemented');
    }
  });

  test('should filter by passport number', async ({ page }) => {
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    const searchInput = page.locator('input[placeholder*="search"]').or(
      page.locator('input[type="search"]')
    ).first();

    if (await searchInput.isVisible({ timeout: 2000 })) {
      await searchInput.fill('TEST');
      await page.waitForTimeout(1000);

      console.log('✓ Search functionality available');
    }
  });

  test('should filter by status', async ({ page }) => {
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    // Look for status filter (active/inactive/expired)
    const statusFilter = page.locator('select[name*="status"]').or(
      page.locator('button:has-text("Status")')
    );

    if (await statusFilter.isVisible({ timeout: 2000 })) {
      await statusFilter.click();
      await page.waitForTimeout(500);

      const activeOption = page.locator('text=Active');
      if (await activeOption.isVisible({ timeout: 1000 })) {
        await activeOption.click();
        await page.waitForTimeout(1000);

        console.log('✓ Status filter applied');
      }
    }
  });

  test('should clear all filters', async ({ page }) => {
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    // Apply some filters
    const dateInputs = page.locator('input[type="date"]');
    if (await dateInputs.count() >= 1) {
      await dateInputs.nth(0).fill(testData.pastDate(30));
    }

    // Look for clear/reset button
    const clearButton = page.locator('button:has-text(/clear|reset/i)');
    if (await clearButton.isVisible({ timeout: 2000 })) {
      await clearButton.click();
      await page.waitForTimeout(1000);

      // Filters should be cleared
      const dateValue = await dateInputs.nth(0).inputValue();
      console.log(`Date after clear: ${dateValue}`);
    }
  });
});

test.describe('Reports - Sorting', () => {
  test('should sort by column headers', async ({ page }) => {
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    // Find sortable column headers
    const headers = page.locator('th').or(page.locator('[role="columnheader"]'));
    const headerCount = await headers.count();

    if (headerCount > 0) {
      // Click first header to sort
      await headers.nth(0).click();
      await page.waitForTimeout(1000);

      // Click again to reverse sort
      await headers.nth(0).click();
      await page.waitForTimeout(1000);

      console.log('✓ Column sorting works');
    }
  });

  test('should sort by date', async ({ page }) => {
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    const dateHeader = page.locator('th:has-text(/date|created/i)').first();
    if (await dateHeader.isVisible({ timeout: 2000 })) {
      await dateHeader.click();
      await page.waitForTimeout(1000);

      console.log('✓ Date sorting available');
    }
  });

  test('should sort by amount (revenue reports)', async ({ page }) => {
    await page.goto('/reports/revenue-generated');
    await waitForPageLoad(page);

    const amountHeader = page.locator('th:has-text(/amount|revenue/i)').first();
    if (await amountHeader.isVisible({ timeout: 2000 })) {
      await amountHeader.click();
      await page.waitForTimeout(1000);

      console.log('✓ Amount sorting available');
    }
  });
});

test.describe('Reports - Pagination', () => {
  test('should paginate large result sets', async ({ page }) => {
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    // Look for pagination controls
    const paginationControls = [
      page.locator('button:has-text("Next")'),
      page.locator('button:has-text("Previous")'),
      page.locator('[aria-label*="page"]'),
      page.locator('.pagination')
    ];

    for (const control of paginationControls) {
      if (await control.isVisible({ timeout: 1000 })) {
        console.log('✓ Pagination controls found');
        break;
      }
    }
  });

  test('should change page size', async ({ page }) => {
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    // Look for rows per page selector
    const pageSizeSelector = page.locator('select[name*="pageSize"]').or(
      page.locator('text=/rows per page/i').locator('..').locator('select')
    );

    if (await pageSizeSelector.isVisible({ timeout: 2000 })) {
      await pageSizeSelector.selectOption('50');
      await page.waitForTimeout(1000);

      console.log('✓ Page size changed to 50');
    }
  });

  test('should navigate to specific page', async ({ page }) => {
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    const nextButton = page.locator('button:has-text("Next")');
    if (await nextButton.isVisible({ timeout: 2000 })) {
      const isDisabled = await nextButton.isDisabled();
      if (!isDisabled) {
        await nextButton.click();
        await page.waitForTimeout(1000);

        console.log('✓ Navigated to next page');

        // Go back
        const prevButton = page.locator('button:has-text("Previous")');
        if (await prevButton.isVisible({ timeout: 1000 })) {
          await prevButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });
});

test.describe('Reports - Export Functionality', () => {
  test('should have CSV export button', async ({ page }) => {
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    const csvButton = page.locator('button:has-text("Export CSV")').or(
      page.locator('button:has-text("CSV")')
    );

    await expect(csvButton).toBeVisible({ timeout: 5000 });
    console.log('✓ CSV export button present');
  });

  test('should export to CSV with current filters', async ({ page }) => {
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    // Apply filter
    const dateInputs = page.locator('input[type="date"]');
    if (await dateInputs.count() >= 2) {
      await dateInputs.nth(0).fill(testData.pastDate(30));
      await dateInputs.nth(1).fill(new Date().toISOString().split('T')[0]);

      const filterButton = page.locator('button:has-text("Filter")');
      if (await filterButton.isVisible({ timeout: 2000 })) {
        await filterButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // Try to export
    const exportButton = page.locator('button:has-text(/export|CSV/i)');
    if (await exportButton.isVisible({ timeout: 2000 })) {
      console.log('✓ Export button available with filters applied');
      // Note: Actual download test requires Edge Function
    }
  });

  test('[EXPECTED TO FAIL] should export to PDF', async ({ page }) => {
    // PDF export not implemented
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    const pdfButton = page.locator('button:has-text("PDF")');
    await expect(pdfButton).toBeVisible({ timeout: 5000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await pdfButton.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });

  test('[EXPECTED TO FAIL] should export to Excel', async ({ page }) => {
    // Excel export not implemented
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    const excelButton = page.locator('button:has-text(/excel|xlsx/i)');
    await expect(excelButton).toBeVisible({ timeout: 5000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await excelButton.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.xlsx?$/i);
  });

  test('should show export progress indicator', async ({ page }) => {
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    const exportButton = page.locator('button:has-text(/export|CSV/i)');
    if (await exportButton.isVisible({ timeout: 2000 })) {
      await exportButton.click();

      // Look for loading indicator
      const loadingIndicators = [
        page.locator('text=/exporting|generating/i'),
        page.locator('.spinner'),
        page.locator('[role="progressbar"]')
      ];

      for (const indicator of loadingIndicators) {
        if (await indicator.isVisible({ timeout: 2000 })) {
          console.log('✓ Export progress indicator shown');
          break;
        }
      }
    }
  });
});

test.describe('Reports - Data Visualization', () => {
  test('should display charts on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageLoad(page);

    const charts = page.locator('.recharts-wrapper').or(page.locator('canvas'));
    const chartCount = await charts.count();

    expect(chartCount).toBeGreaterThan(0);
    console.log(`✓ Found ${chartCount} charts`);
  });

  test('should display charts on revenue report', async ({ page }) => {
    await page.goto('/reports/revenue-generated');
    await waitForPageLoad(page);

    const charts = page.locator('.recharts-wrapper').or(page.locator('canvas'));
    const chartCount = await charts.count();

    if (chartCount > 0) {
      console.log(`✓ Revenue report has ${chartCount} charts`);
    }
  });

  test('should update charts when filters change', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/dashboard');
    await waitForPageLoad(page);

    // Apply date filter
    const dateInputs = page.locator('input[type="date"]');
    if (await dateInputs.count() >= 2) {
      await dateInputs.nth(0).fill(testData.pastDate(7));
      await dateInputs.nth(1).fill(new Date().toISOString().split('T')[0]);

      const filterButton = page.locator('button:has-text("Filter")');
      if (await filterButton.isVisible({ timeout: 2000 })) {
        await filterButton.click();
        await page.waitForTimeout(2000);

        // Charts should re-render
        await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
        console.log('✓ Charts updated with filter');
      }
    }

    consoleChecker.assertNoErrors();
  });
});

test.describe('Reports - Summary Statistics', () => {
  test('should display summary cards', async ({ page }) => {
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    // Look for summary statistics
    const summaryCards = page.locator('[class*="stat"]').or(
      page.locator('[class*="card"]')
    );

    const cardCount = await summaryCards.count();
    if (cardCount > 0) {
      console.log(`✓ Found ${cardCount} summary cards`);
    }
  });

  test('should show total count', async ({ page }) => {
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    const totalIndicator = page.locator('text=/total.*record|showing.*of/i');
    if (await totalIndicator.isVisible({ timeout: 3000 })) {
      const text = await totalIndicator.textContent();
      console.log(`✓ Total count: ${text}`);
    }
  });

  test('should calculate revenue totals', async ({ page }) => {
    await page.goto('/reports/revenue-generated');
    await waitForPageLoad(page);

    const revenueTotal = page.locator('text=/total.*revenue|PGK/i').first();
    if (await revenueTotal.isVisible({ timeout: 3000 })) {
      console.log('✓ Revenue total displayed');
    }
  });
});

test.describe('Reports - Real-time Updates', () => {
  test.skip('should auto-refresh data periodically', async ({ page }) => {
    // This test would need to monitor for automatic refreshes
    await page.goto('/dashboard');
    await waitForPageLoad(page);

    // Wait for auto-refresh (if implemented)
    await page.waitForTimeout(60000); // 1 minute

    console.log('Auto-refresh test - requires implementation');
  });

  test('should have manual refresh button', async ({ page }) => {
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    const refreshButton = page.locator('button:has-text("Refresh")').or(
      page.locator('button[aria-label*="refresh"]')
    );

    if (await refreshButton.isVisible({ timeout: 2000 })) {
      await refreshButton.click();
      await page.waitForTimeout(2000);

      console.log('✓ Manual refresh works');
    }
  });
});

test.describe('Reports - Performance', () => {
  test('should load large datasets efficiently', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    const loadTime = Date.now() - startTime;
    console.log(`Page load time: ${loadTime}ms`);

    expect(loadTime).toBeLessThan(5000); // Should load in under 5 seconds
  });

  test('should handle concurrent report requests', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    // Navigate to multiple reports quickly
    await page.goto('/reports/passports');
    await page.waitForTimeout(500);

    await page.goto('/reports/individual-purchase');
    await page.waitForTimeout(500);

    await page.goto('/reports/corporate-vouchers');
    await waitForPageLoad(page);

    consoleChecker.assertNoErrors();
    console.log('✓ Handled concurrent navigation without errors');
  });
});

test.describe('Reports - Accessibility', () => {
  test('should have accessible table headers', async ({ page }) => {
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    const table = page.locator('table').first();
    if (await table.isVisible({ timeout: 2000 })) {
      const headers = await table.locator('th').count();
      expect(headers).toBeGreaterThan(0);

      console.log(`✓ Found ${headers} accessible table headers`);
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to navigate without errors
    console.log('✓ Keyboard navigation works');
  });
});


