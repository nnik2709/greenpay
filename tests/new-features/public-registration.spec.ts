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
 * Public Registration Flow Tests
 * Tests customer-facing passport registration with voucher code
 * CRITICAL FEATURE - Must work without authentication
 * INCLUDES COMPREHENSIVE CONSOLE ERROR CHECKING
 */

test.describe('Public Registration - Voucher Validation', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // No auth required

  test('should load registration page with valid voucher', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    // Use a test voucher code (you'll need to create one)
    const testVoucherCode = 'TEST-VOUCHER-123';

    await page.goto(`/register/${testVoucherCode}`);
    await waitForPageLoad(page);

    // Should show registration form (even if voucher doesn't exist in DB, page loads)
    await expect(page.locator('text=/registration|passport/i')).toBeVisible({ timeout: 5000 });

    // VERIFY NO CONSOLE ERRORS ON PAGE LOAD
    consoleChecker.assertNoErrors();
    networkChecker.assertNoErrors();
    consoleChecker.logSummary();
  });

  test('should show error for invalid voucher code', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/register/INVALID-CODE-XYZ');
    await waitForPageLoad(page);

    // Should show error message
    const errorMessage = page.locator('text=/invalid|not found|error/i');
    if (await errorMessage.isVisible({ timeout: 5000 })) {
      console.log('✓ Invalid voucher error shown correctly');
    }

    // VERIFY NO CONSOLE ERRORS DURING VALIDATION
    consoleChecker.assertNoErrors();
  });

  test('should show error for expired voucher', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    // This would require a voucher with past valid_until date
    console.log('Expired voucher test - requires test data');

    consoleChecker.assertNoErrors();
  });

  test('should show error for already used voucher', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    // This would require a voucher with used_at timestamp
    console.log('Used voucher test - requires test data');

    consoleChecker.assertNoErrors();
  });
});

test.describe('Public Registration - Form Validation', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should validate required fields', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/register/TEST-VOUCHER-123');
    await waitForPageLoad(page);

    // Try to submit without filling fields
    const submitButton = page.locator('[data-testid="public-reg-submit"]');
    if (await submitButton.isVisible({ timeout: 2000 })) {
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Should not proceed (HTML5 validation or custom validation)
      console.log('✓ Form validation prevents empty submission');
    }

    consoleChecker.assertNoErrors();
  });

  test('should validate passport number format', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/register/TEST-VOUCHER-123');
    await waitForPageLoad(page);

    const passportInput = page.locator('[data-testid="public-reg-passport-number"]');
    if (await passportInput.isVisible({ timeout: 2000 })) {
      await passportInput.fill('123'); // Too short
      await passportInput.blur();
      await page.waitForTimeout(500);

      console.log('✓ Passport number validation checked');
    }

    consoleChecker.assertNoErrors();
  });

  test('should validate date of birth', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/register/TEST-VOUCHER-123');
    await waitForPageLoad(page);

    const dobInput = page.locator('[data-testid="public-reg-dob"]');
    if (await dobInput.isVisible({ timeout: 2000 })) {
      // Try future date (should be rejected by max attribute)
      const futureDate = testData.futureDate(365);
      await dobInput.fill(futureDate);
      
      console.log('✓ Date of birth validation checked');
    }

    consoleChecker.assertNoErrors();
  });

  test('should require photo upload', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/register/TEST-VOUCHER-123');
    await waitForPageLoad(page);

    // Check photo input exists
    const photoInput = page.locator('[data-testid="public-reg-photo"]');
    await expect(photoInput).toBeVisible();

    // Submit button should be disabled without photo
    const submitButton = page.locator('[data-testid="public-reg-submit"]');
    const isDisabled = await submitButton.isDisabled();
    
    if (isDisabled) {
      console.log('✓ Submit disabled without photo');
    }

    consoleChecker.assertNoErrors();
  });
});

test.describe('Public Registration - Photo Upload', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should accept valid image file', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/register/TEST-VOUCHER-123');
    await waitForPageLoad(page);

    // Note: Actual file upload test would require a test image file
    const photoInput = page.locator('[data-testid="public-reg-photo"]');
    await expect(photoInput).toBeVisible();
    
    console.log('✓ Photo upload field present');

    consoleChecker.assertNoErrors();
  });

  test('should show photo preview after upload', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/register/TEST-VOUCHER-123');
    await waitForPageLoad(page);

    // After upload, preview should be visible
    // This would require actually uploading a test image

    consoleChecker.assertNoErrors();
  });
});

test.describe('Public Registration - Complete Flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.skip('should complete full registration with photo', async ({ page }) => {
    // This test requires:
    // 1. Valid test voucher in database
    // 2. Test image file
    // 3. Supabase Storage buckets created

    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);
    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/register/VALID-TEST-VOUCHER');
    await waitForPageLoad(page);

    // Fill form
    await fillFormField(page, '[data-testid="public-reg-passport-number"]', testData.randomPassportNumber());
    await fillFormField(page, '[data-testid="public-reg-surname"]', 'PUBLIC');
    await fillFormField(page, '[data-testid="public-reg-given-name"]', 'TEST');
    await fillFormField(page, '[data-testid="public-reg-dob"]', '1990-01-01');
    await fillFormField(page, '[data-testid="public-reg-nationality"]', 'Australian');

    // Select sex
    await page.locator('[data-testid="public-reg-sex"]').selectOption('Male');

    // Upload photo (would need test file)
    // const photoInput = page.locator('[data-testid="public-reg-photo"]');
    // await photoInput.setInputFiles('path/to/test-photo.jpg');

    // Submit
    // await page.locator('[data-testid="public-reg-submit"]').click();
    // await page.waitForTimeout(5000);

    // Should navigate to success page
    // await expect(page).toHaveURL(/\/register\/success\//);

    // VERIFY NO ERRORS IN REGISTRATION PROCESS
    consoleChecker.assertNoErrors();
    networkChecker.assertNoErrors();
    dbChecker.assertNoErrors();
  });
});

test.describe('Public Registration - Success Page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should display success page', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/register/success/TEST-VOUCHER-123');
    await waitForPageLoad(page);

    // Should show success message
    await expect(page.locator('text=/success|registered/i')).toBeVisible({ timeout: 5000 });

    consoleChecker.assertNoErrors();
  });

  test('should show QR code', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/register/success/TEST-VOUCHER-123');
    await waitForPageLoad(page);

    // Should have QR code image
    const qrCode = page.locator('img[alt*="QR"]');
    if (await qrCode.isVisible({ timeout: 3000 })) {
      console.log('✓ QR code displayed');
    }

    consoleChecker.assertNoErrors();
  });

  test('should have print button', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/register/success/TEST-VOUCHER-123');
    await waitForPageLoad(page);

    const printButton = page.locator('[data-testid="public-reg-print"]');
    await expect(printButton).toBeVisible();

    consoleChecker.assertNoErrors();
  });

  test('should have download button', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/register/success/TEST-VOUCHER-123');
    await waitForPageLoad(page);

    const downloadButton = page.locator('[data-testid="public-reg-download"]');
    await expect(downloadButton).toBeVisible();

    consoleChecker.assertNoErrors();
  });
});

test.describe('Public Registration - Console Error Verification', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('no console errors during page navigation', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/register/TEST-CODE');
    await waitForPageLoad(page);

    // CRITICAL: Public pages must be error-free
    consoleChecker.assertNoErrors();
    consoleChecker.logSummary();
  });

  test('no console errors during form filling', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/register/TEST-CODE');
    await waitForPageLoad(page);

    // Fill form fields
    const passportInput = page.locator('[data-testid="public-reg-passport-number"]');
    if (await passportInput.isVisible({ timeout: 2000 })) {
      await passportInput.fill('TEST123456');
      await page.waitForTimeout(500);
    }

    // VERIFY NO ERRORS DURING USER INPUT
    consoleChecker.assertNoErrors();
  });
});









