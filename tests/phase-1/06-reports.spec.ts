import { test, expect } from '@playwright/test';
import {
  checkConsoleErrors,
  checkNetworkErrors,
  checkDatabaseErrors,
  waitForPageLoad
} from '../utils/helpers';

/**
 * PHASE 1: Reports Tests
 * Tests all 6 report pages
 */

test.describe('Reports - Landing Page', () => {
  test('should display reports dashboard', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/reports');
    await waitForPageLoad(page);

    // Should show title
    await expect(page.locator('text=Reporting Dashboard')).toBeVisible();

    // Should show all 6 report cards
    const reportTypes = [
      'Passport Reports',
      'Individual Purchase',
      'Corporate Vouchers',
      'Revenue Generated',
      'Bulk Uploads',
      'Quotations Reports'
    ];

    for (const reportType of reportTypes) {
      await expect(page.locator(`text=${reportType}`)).toBeVisible();
    }

    consoleChecker.assertNoErrors();
  });

  test('should navigate to each report page', async ({ page }) => {
    await page.goto('/reports');
    await waitForPageLoad(page);

    const reportLinks = [
      { text: 'Passport Reports', url: '/reports/passports' },
      { text: 'Individual Purchase', url: '/reports/individual-purchase' },
      { text: 'Corporate Vouchers', url: '/reports/corporate-vouchers' },
      { text: 'Revenue Generated', url: '/reports/revenue-generated' },
      { text: 'Bulk Uploads', url: '/reports/bulk-passport-uploads' },
      { text: 'Quotations Reports', url: '/reports/quotations' }
    ];

    for (const report of reportLinks) {
      await page.goto('/reports');
      await page.click(`text=${report.text}`);
      await expect(page).toHaveURL(report.url);
    }
  });
});

test.describe('Reports - Passport Report', () => {
  test('[EXPECTED TO FAIL] should display passport data', async ({ page }) => {
    // THIS WILL FAIL - Shows mock data only (from gap analysis)

    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    // Should query real data from database
    await page.waitForResponse(
      response => response.url().includes('passports') && response.method() === 'GET',
      { timeout: 10000 }
    );

    // Should show data table
    await expect(page.locator('table')).toBeVisible();

    // Should have data rows (not just mock 2 rows)
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);

    dbChecker.assertNoErrors();
  });

  test('should have date filters', async ({ page }) => {
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    // Date range filters
    await expect(page.locator('input[type="date"]')).toHaveCount(2);
  });

  test('should export to CSV', async ({ page }) => {
    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    const exportButton = page.locator('button:has-text("Export CSV")');
    await expect(exportButton).toBeVisible();

    // Note: Actual download test would require setting up Edge Function
  });
});

test.describe('Reports - Individual Purchase Report', () => {
  test('[EXPECTED TO FAIL] should display individual purchase data', async ({ page }) => {
    // File exists but not inspected - likely similar to passport report

    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/reports/individual-purchase');
    await waitForPageLoad(page);

    await page.waitForResponse(
      response => response.url().includes('individual_purchases'),
      { timeout: 10000 }
    );

    await expect(page.locator('table').or(page.locator('[role="grid"]'))).toBeVisible();

    dbChecker.assertNoErrors();
  });
});

test.describe('Reports - Corporate Voucher Report', () => {
  test('[EXPECTED TO FAIL] should display corporate voucher data', async ({ page }) => {
    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/reports/corporate-vouchers');
    await waitForPageLoad(page);

    await page.waitForResponse(
      response => response.url().includes('corporate_vouchers'),
      { timeout: 10000 }
    );

    await expect(page.locator('table').or(page.locator('[role="grid"]'))).toBeVisible();

    dbChecker.assertNoErrors();
  });
});

test.describe('Reports - Revenue Report', () => {
  test('[EXPECTED TO FAIL] should display revenue analysis', async ({ page }) => {
    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/reports/revenue-generated');
    await waitForPageLoad(page);

    // Should show revenue charts/tables
    await expect(page.locator('text=/revenue|total|amount/i')).toBeVisible();

    dbChecker.assertNoErrors();
  });
});

test.describe('Reports - Bulk Upload Report', () => {
  test('[EXPECTED TO FAIL] should display bulk upload history', async ({ page }) => {
    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/reports/bulk-passport-uploads');
    await waitForPageLoad(page);

    await page.waitForResponse(
      response => response.url().includes('bulk_uploads'),
      { timeout: 10000 }
    );

    dbChecker.assertNoErrors();
  });
});

test.describe('Reports - Quotation Report', () => {
  test('[EXPECTED TO FAIL] should display quotation pipeline analysis', async ({ page }) => {
    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/reports/quotations');
    await waitForPageLoad(page);

    // Should show quotation stats and pipeline
    await expect(page.locator('text=/quotation|pipeline|status/i')).toBeVisible();

    dbChecker.assertNoErrors();
  });
});

test.describe('Reports - Export Functions', () => {
  test('[EXPECTED TO FAIL] should export report to PDF', async ({ page }) => {
    // PDF export not implemented (from gap analysis)

    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    const pdfButton = page.locator('button:has-text(/PDF/i)');
    await expect(pdfButton).toBeVisible({ timeout: 5000 });

    const downloadPromise = page.waitForEvent('download');
    await pdfButton.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('[EXPECTED TO FAIL] should export report to Excel', async ({ page }) => {
    // Excel export not implemented (from gap analysis)

    await page.goto('/reports/passports');
    await waitForPageLoad(page);

    const excelButton = page.locator('button:has-text(/Excel|XLSX/i)');
    await expect(excelButton).toBeVisible({ timeout: 5000 });

    const downloadPromise = page.waitForEvent('download');
    await excelButton.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.xlsx?$/);
  });
});
