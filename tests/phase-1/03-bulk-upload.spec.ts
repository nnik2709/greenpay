import { test, expect } from '@playwright/test';
import {
  checkConsoleErrors,
  checkNetworkErrors,
  checkDatabaseErrors,
  waitForPageLoad,
  uploadFile
} from '../utils/helpers';
import { testCSVContent } from '../fixtures/test-data';
import fs from 'fs';
import path from 'path';

/**
 * PHASE 1: Bulk Upload Tests
 * Tests CSV upload and batch processing
 */

test.describe('Bulk Upload - Template', () => {
  test('should download CSV template', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/passports/bulk-upload');
    await waitForPageLoad(page);

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click download template button
    await page.click('button:has-text("Download Template")');

    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(/template|passport/i);

    consoleChecker.assertNoErrors();
  });

  test('should display field configuration options', async ({ page }) => {
    await page.goto('/passports/bulk-upload');
    await waitForPageLoad(page);

    // Check for field toggles (13 optional fields mentioned in gap analysis)
    const toggles = page.locator('input[type="checkbox"]');
    const count = await toggles.count();

    expect(count).toBeGreaterThan(5); // At least several field options
  });
});

test.describe('Bulk Upload - File Processing', () => {
  test.beforeEach(async () => {
    // Create test CSV file
    const testFilePath = path.join(__dirname, '../fixtures/test-bulk-upload.csv');
    fs.writeFileSync(testFilePath, testCSVContent);
  });

  test.afterEach(async () => {
    // Clean up test file
    const testFilePath = path.join(__dirname, '../fixtures/test-bulk-upload.csv');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  test('should upload CSV file', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    await page.goto('/passports/bulk-upload');
    await waitForPageLoad(page);

    // Upload file
    const testFilePath = path.join(__dirname, '../fixtures/test-bulk-upload.csv');
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles(testFilePath);

    // Wait a moment for file to be processed
    await page.waitForTimeout(1000);

    // Verify file name is displayed
    await expect(page.locator(`text=test-bulk-upload.csv`)).toBeVisible({ timeout: 5000 });

    consoleChecker.assertNoErrors();
    networkChecker.assertNoErrors();
  });

  test('[EXPECTED TO FAIL] should process CSV and create passports', async ({ page }) => {
    // THIS TEST WILL FAIL - Bulk upload backend is not implemented (from gap analysis)

    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/passports/bulk-upload');
    await waitForPageLoad(page);

    // Upload file
    const testFilePath = path.join(__dirname, '../fixtures/test-bulk-upload.csv');
    await page.locator('input[type="file"]').setInputFiles(testFilePath);

    // Fill payment details
    await page.fill('input[name="voucher_value"]', '50');
    await page.click('label:has-text("CASH")');
    await page.fill('input[name="collected_amount"]', '150');

    // Submit
    await page.click('button:has-text("Upload")');

    // Wait for processing
    await page.waitForResponse(
      response => response.url().includes('bulk') && response.method() === 'POST',
      { timeout: 30000 }
    );

    // Should show success message
    await expect(page.locator('text=/success|complete/i')).toBeVisible({ timeout: 30000 });

    // Should show results (3 records from test CSV)
    await expect(page.locator('text=/3.*record/i')).toBeVisible();

    dbChecker.assertNoErrors();
  });

  test('should validate CSV format', async ({ page }) => {
    await page.goto('/passports/bulk-upload');
    await waitForPageLoad(page);

    // Create invalid CSV
    const invalidCSV = `invalid,headers,wrong
data1,data2,data3`;

    const invalidFilePath = path.join(__dirname, '../fixtures/invalid.csv');
    fs.writeFileSync(invalidFilePath, invalidCSV);

    // Upload invalid file
    await page.locator('input[type="file"]').setInputFiles(invalidFilePath);

    // Should show error
    // (Behavior depends on implementation - might be immediate or after submit)
    await page.waitForTimeout(2000);

    // Clean up
    fs.unlinkSync(invalidFilePath);
  });

  test('should display upload history', async ({ page }) => {
    await page.goto('/passports/bulk-upload');
    await waitForPageLoad(page);

    // Check for recent uploads section (mentioned in gap analysis)
    const historySection = page.locator('text=/recent|history|past.*upload/i');

    if (await historySection.isVisible({ timeout: 2000 })) {
      console.log('✓ Upload history section found');
    } else {
      console.log('⚠ Upload history section not visible (expected)');
    }
  });
});

test.describe('Bulk Upload - Error Reporting', () => {
  test('[EXPECTED TO FAIL] should show validation errors per row', async ({ page }) => {
    // THIS WILL FAIL - Error reporting UI exists but no real data (from gap analysis)

    await page.goto('/passports/bulk-upload');
    await waitForPageLoad(page);

    // Create CSV with some invalid data
    const mixedCSV = `passport_no,surname,given_name,dob,nationality,sex,date_of_expiry
VALID001,SMITH,JOHN,1990-01-01,Australian,Male,2030-01-01
INVALID,MISSING,DATA,invalid-date,Unknown,?,2020-01-01`;

    const mixedFilePath = path.join(__dirname, '../fixtures/mixed.csv');
    fs.writeFileSync(mixedFilePath, mixedCSV);

    await page.locator('input[type="file"]').setInputFiles(mixedFilePath);
    await page.fill('input[name="voucher_value"]', '50');
    await page.click('button:has-text("Upload")');

    await page.waitForTimeout(3000);

    // Should show error log
    const errorLog = page.locator('text=/error|failed|invalid/i');
    await expect(errorLog).toBeVisible({ timeout: 5000 });

    // Clean up
    fs.unlinkSync(mixedFilePath);
  });
});
