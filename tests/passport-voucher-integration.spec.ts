import { test, expect } from '@playwright/test';

/**
 * Passport-Voucher Integration Tests
 *
 * Tests the new feature that allows customers to optionally include
 * passport details when purchasing vouchers online.
 *
 * Test Coverage:
 * 1. Purchase WITH passport data → Voucher ready immediately
 * 2. Purchase WITHOUT passport data → Requires registration (legacy flow)
 * 3. Voucher validation for passport-linked vouchers
 * 4. Backward compatibility with existing flows
 */

test.describe('Passport-Voucher Integration', () => {

  test.describe('Public Voucher Purchase - WITH Passport Data', () => {

    test('should show passport fields when checkbox is checked', async ({ page }) => {
      await page.goto('/buy-voucher');

      // Wait for page to load
      await expect(page.locator('h1')).toContainText('PNG Green Fees');

      // Passport fields should be hidden initially
      await expect(page.locator('input[name="passportNumber"]')).not.toBeVisible();
      await expect(page.locator('input[name="surname"]')).not.toBeVisible();
      await expect(page.locator('input[name="givenName"]')).not.toBeVisible();

      // Click the "Include passport details now" checkbox
      const checkbox = page.locator('input[type="checkbox"]#includePassport');
      await checkbox.click();

      // Passport fields should now be visible
      await expect(page.locator('input#passportNumber')).toBeVisible();
      await expect(page.locator('input#surname')).toBeVisible();
      await expect(page.locator('input#givenName')).toBeVisible();
      await expect(page.locator('input#dateOfBirth')).toBeVisible();
      await expect(page.locator('input#nationality')).toBeVisible();

      // Verify quantity is locked to 1
      const quantityInput = page.locator('input#quantity');
      await expect(quantityInput).toBeDisabled();
      await expect(quantityInput).toHaveValue('1');
    });

    test('should validate passport fields when checkbox is checked', async ({ page }) => {
      await page.goto('/buy-voucher');

      // Fill contact info
      await page.fill('input#email', 'test@example.com');
      await page.fill('input#phone', '70012345');

      // Check passport checkbox
      await page.locator('input[type="checkbox"]#includePassport').click();

      // Try to submit without passport details
      await page.click('button[type="submit"]');

      // Should show validation error
      await expect(page.getByText(/Incomplete Passport Details/i)).toBeVisible();
    });

    test('should create payment session with passport data', async ({ page }) => {
      await page.goto('/buy-voucher');

      // Fill contact info
      await page.fill('input#email', 'playwright-test@example.com');
      await page.fill('input#phone', '70012345');

      // Check passport checkbox
      await page.locator('input[type="checkbox"]#includePassport').click();

      // Fill passport details
      await page.fill('input#passportNumber', 'PW123456');
      await page.fill('input#surname', 'TESTER');
      await page.fill('input#givenName', 'PLAYWRIGHT');
      await page.fill('input#dateOfBirth', '1990-01-15');
      await page.fill('input#nationality', 'Papua New Guinea');

      // Intercept API call
      const apiCall = page.waitForRequest(request =>
        request.url().includes('/api/public-purchases/create-payment-session') &&
        request.method() === 'POST'
      );

      // Submit form
      await page.click('button[type="submit"]');

      // Verify API request includes passport data
      const request = await apiCall;
      const postData = request.postDataJSON();

      expect(postData.passportData).toBeDefined();
      expect(postData.passportData.passportNumber).toBe('PW123456');
      expect(postData.passportData.surname).toBe('TESTER');
      expect(postData.passportData.givenName).toBe('PLAYWRIGHT');
      expect(postData.passportData.dateOfBirth).toBe('1990-01-15');
      expect(postData.passportData.nationality).toBe('Papua New Guinea');
      expect(postData.passportData.sex).toBe('Male');
    });

    test('should show different flow message when passport is included', async ({ page }) => {
      await page.goto('/buy-voucher');

      // Initial message (without passport)
      await expect(page.getByText(/Register passport details using voucher code/i)).toBeVisible();

      // Check passport checkbox
      await page.locator('input[type="checkbox"]#includePassport').click();

      // Message should change
      await expect(page.getByText(/Voucher ready to scan at airport - no registration needed/i)).toBeVisible();
    });
  });

  test.describe('Public Voucher Purchase - WITHOUT Passport Data (Legacy)', () => {

    test('should allow purchase without passport data', async ({ page }) => {
      await page.goto('/buy-voucher');

      // Fill only contact info
      await page.fill('input#email', 'legacy-test@example.com');
      await page.fill('input#phone', '70098765');

      // Do NOT check passport checkbox
      const checkbox = page.locator('input[type="checkbox"]#includePassport');
      await expect(checkbox).not.toBeChecked();

      // Passport fields should not be visible
      await expect(page.locator('input#passportNumber')).not.toBeVisible();

      // Intercept API call
      const apiCall = page.waitForRequest(request =>
        request.url().includes('/api/public-purchases/create-payment-session') &&
        request.method() === 'POST'
      );

      // Submit form
      await page.click('button[type="submit"]');

      // Verify API request does NOT include passport data
      const request = await apiCall;
      const postData = request.postDataJSON();

      expect(postData.passportData).toBeNull();
    });

    test('should allow multiple vouchers when passport not included', async ({ page }) => {
      await page.goto('/buy-voucher');

      // Quantity input should be enabled
      const quantityInput = page.locator('input#quantity');
      await expect(quantityInput).toBeEnabled();

      // Change quantity
      await quantityInput.fill('5');
      await expect(quantityInput).toHaveValue('5');

      // Total should update
      await expect(page.getByText(/PGK 250.00/i)).toBeVisible();
    });
  });

  test.describe('API Backend Integration', () => {

    test('should accept passportData parameter in API', async ({ request }) => {
      const response = await request.post('/api/public-purchases/create-payment-session', {
        data: {
          customerEmail: 'api-test@example.com',
          customerPhone: '+6757001111',
          quantity: 1,
          amount: 50,
          currency: 'PGK',
          deliveryMethod: 'Email',
          returnUrl: 'https://greenpay.eywademo.cloud/purchase/callback',
          cancelUrl: 'https://greenpay.eywademo.cloud/buy-voucher',
          passportData: {
            passportNumber: 'API123456',
            surname: 'APITEST',
            givenName: 'PLAYWRIGHT',
            dateOfBirth: '1985-05-20',
            nationality: 'Papua New Guinea',
            sex: 'Female'
          }
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.sessionId).toBeDefined();
      expect(data.data.paymentUrl).toBeDefined();
      expect(data.data.gateway).toBeDefined();
    });

    test('should accept null passportData (backward compatibility)', async ({ request }) => {
      const response = await request.post('/api/public-purchases/create-payment-session', {
        data: {
          customerEmail: 'legacy-api-test@example.com',
          customerPhone: '+6757002222',
          quantity: 2,
          amount: 100,
          currency: 'PGK',
          deliveryMethod: 'Email',
          returnUrl: 'https://greenpay.eywademo.cloud/purchase/callback',
          cancelUrl: 'https://greenpay.eywademo.cloud/buy-voucher',
          passportData: null // Legacy flow
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.sessionId).toBeDefined();
    });

    test('should work without passportData field (backward compatibility)', async ({ request }) => {
      const response = await request.post('/api/public-purchases/create-payment-session', {
        data: {
          customerEmail: 'old-api-test@example.com',
          customerPhone: '+6757003333',
          quantity: 1,
          amount: 50,
          currency: 'PGK',
          deliveryMethod: 'Email',
          returnUrl: 'https://greenpay.eywademo.cloud/purchase/callback',
          cancelUrl: 'https://greenpay.eywademo.cloud/buy-voucher'
          // No passportData field at all
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      expect(data.success).toBe(true);
    });
  });

  test.describe('Form Validation', () => {

    test('should require passport number when checkbox checked', async ({ page }) => {
      await page.goto('/buy-voucher');

      await page.fill('input#email', 'validation-test@example.com');
      await page.locator('input[type="checkbox"]#includePassport').click();

      // Fill only surname and given name, skip passport number
      await page.fill('input#surname', 'VALIDATOR');
      await page.fill('input#givenName', 'TEST');

      await page.click('button[type="submit"]');

      // Should show validation error
      await expect(page.getByText(/Incomplete Passport Details/i)).toBeVisible();
    });

    test('should require surname when checkbox checked', async ({ page }) => {
      await page.goto('/buy-voucher');

      await page.fill('input#email', 'validation-test2@example.com');
      await page.locator('input[type="checkbox"]#includePassport').click();

      // Fill passport number and given name, skip surname
      await page.fill('input#passportNumber', 'VAL123456');
      await page.fill('input#givenName', 'TEST');

      await page.click('button[type="submit"]');

      await expect(page.getByText(/Incomplete Passport Details/i)).toBeVisible();
    });

    test('should require given name when checkbox checked', async ({ page }) => {
      await page.goto('/buy-voucher');

      await page.fill('input#email', 'validation-test3@example.com');
      await page.locator('input[type="checkbox"]#includePassport').click();

      // Fill passport number and surname, skip given name
      await page.fill('input#passportNumber', 'VAL789012');
      await page.fill('input#surname', 'VALIDATOR');

      await page.click('button[type="submit"]');

      await expect(page.getByText(/Incomplete Passport Details/i)).toBeVisible();
    });

    test('should validate passport number length', async ({ page }) => {
      await page.goto('/buy-voucher');

      await page.fill('input#email', 'validation-test4@example.com');
      await page.locator('input[type="checkbox"]#includePassport').click();

      // Fill with too short passport number
      await page.fill('input#passportNumber', 'ABC');
      await page.fill('input#surname', 'VALIDATOR');
      await page.fill('input#givenName', 'TEST');

      await page.click('button[type="submit"]');

      await expect(page.getByText(/Passport number seems too short/i)).toBeVisible();
    });

    test('should convert passport number to uppercase', async ({ page }) => {
      await page.goto('/buy-voucher');

      await page.locator('input[type="checkbox"]#includePassport').click();

      // Type lowercase
      await page.fill('input#passportNumber', 'abc123');

      // Should be converted to uppercase
      await expect(page.locator('input#passportNumber')).toHaveValue('ABC123');
    });

    test('should convert surname to uppercase', async ({ page }) => {
      await page.goto('/buy-voucher');

      await page.locator('input[type="checkbox"]#includePassport').click();

      await page.fill('input#surname', 'smith');
      await expect(page.locator('input#surname')).toHaveValue('SMITH');
    });

    test('should convert given name to uppercase', async ({ page }) => {
      await page.goto('/buy-voucher');

      await page.locator('input[type="checkbox"]#includePassport').click();

      await page.fill('input#givenName', 'john michael');
      await expect(page.locator('input#givenName')).toHaveValue('JOHN MICHAEL');
    });
  });

  test.describe('UI/UX Behavior', () => {

    test('should disable quantity when passport checkbox is checked', async ({ page }) => {
      await page.goto('/buy-voucher');

      const quantityInput = page.locator('input#quantity');

      // Initially enabled
      await expect(quantityInput).toBeEnabled();

      // Check passport checkbox
      await page.locator('input[type="checkbox"]#includePassport').click();

      // Should be disabled
      await expect(quantityInput).toBeDisabled();
      await expect(quantityInput).toHaveValue('1');
    });

    test('should reset quantity to 1 when passport checkbox is checked', async ({ page }) => {
      await page.goto('/buy-voucher');

      const quantityInput = page.locator('input#quantity');

      // Set quantity to 5
      await quantityInput.fill('5');
      await expect(quantityInput).toHaveValue('5');

      // Check passport checkbox
      await page.locator('input[type="checkbox"]#includePassport').click();

      // Should reset to 1
      await expect(quantityInput).toHaveValue('1');
    });

    test('should show benefits message when passport fields are visible', async ({ page }) => {
      await page.goto('/buy-voucher');

      // Check passport checkbox
      await page.locator('input[type="checkbox"]#includePassport').click();

      // Should show benefits
      await expect(page.getByText(/No registration step required/i)).toBeVisible();
      await expect(page.getByText(/Voucher ready to scan immediately/i)).toBeVisible();
      await expect(page.getByText(/Faster airport processing/i)).toBeVisible();
    });

    test('should update help text when passport is included', async ({ page }) => {
      await page.goto('/buy-voucher');

      const quantityInput = page.locator('input#quantity');

      // Initial help text
      await expect(page.getByText(/Each voucher is for one traveler/i)).toBeVisible();

      // Check passport checkbox
      await page.locator('input[type="checkbox"]#includePassport').click();

      // Help text should change
      await expect(page.getByText(/One voucher per passport/i)).toBeVisible();
    });

    test('should persist form data in localStorage', async ({ page }) => {
      await page.goto('/buy-voucher');

      // Fill form
      await page.fill('input#email', 'persist-test@example.com');
      await page.fill('input#phone', '70011111');
      await page.locator('input[type="checkbox"]#includePassport').click();
      await page.fill('input#passportNumber', 'PERSIST123');

      // Reload page
      await page.reload();

      // Data should be restored (auto-save feature)
      await expect(page.locator('input#email')).toHaveValue('persist-test@example.com');
      await expect(page.locator('input#phone')).toHaveValue('70011111');
    });
  });

  test.describe('Accessibility', () => {

    test('should have proper labels for passport fields', async ({ page }) => {
      await page.goto('/buy-voucher');

      await page.locator('input[type="checkbox"]#includePassport').click();

      // Check for proper label associations
      await expect(page.locator('label[for="passportNumber"]')).toBeVisible();
      await expect(page.locator('label[for="surname"]')).toBeVisible();
      await expect(page.locator('label[for="givenName"]')).toBeVisible();
      await expect(page.locator('label[for="dateOfBirth"]')).toBeVisible();
      await expect(page.locator('label[for="nationality"]')).toBeVisible();
      await expect(page.locator('label[for="sex"]')).toBeVisible();
    });

    test('should mark required fields with asterisk', async ({ page }) => {
      await page.goto('/buy-voucher');

      await page.locator('input[type="checkbox"]#includePassport').click();

      // Check for required indicators
      const passportLabel = page.locator('label[for="passportNumber"]');
      await expect(passportLabel).toContainText('*');

      const surnameLabel = page.locator('label[for="surname"]');
      await expect(surnameLabel).toContainText('*');

      const givenNameLabel = page.locator('label[for="givenName"]');
      await expect(givenNameLabel).toContainText('*');
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/buy-voucher');

      // Focus on checkbox
      await page.locator('input[type="checkbox"]#includePassport').focus();

      // Press Space to check
      await page.keyboard.press('Space');

      // Passport fields should be visible
      await expect(page.locator('input#passportNumber')).toBeVisible();

      // Tab through fields
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.id);
      expect(focused).toBeTruthy();
    });
  });

  test.describe('Network Error Handling', () => {

    test('should show network error when offline', async ({ page }) => {
      await page.goto('/buy-voucher');

      // Simulate offline
      await page.context().setOffline(true);

      await page.fill('input#email', 'offline-test@example.com');
      await page.click('button[type="submit"]');

      // Should show offline message
      await expect(page.getByText(/No Internet Connection/i)).toBeVisible();

      // Re-enable network
      await page.context().setOffline(false);
    });
  });
});
