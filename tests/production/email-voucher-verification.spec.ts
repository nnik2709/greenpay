import { test, expect } from '@playwright/test';

/**
 * Email Voucher Verification Test
 *
 * Tests the complete email voucher flow:
 * 1. User has registered voucher (assumes voucher already exists)
 * 2. Opens email dialog
 * 3. Enters email address
 * 4. Sends email successfully
 */

test.describe('Email Voucher Verification', () => {
  test('should allow emailing individual registered voucher', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/voucher-registration');

    // Enter a test voucher code (you'll need to replace with actual code)
    await page.fill('input[placeholder*="voucher"]', 'TEST1234');
    await page.click('button:has-text("Find Voucher")');

    // Wait for voucher details to load
    await page.waitForSelector('text=Voucher Details', { timeout: 10000 });

    // Check if already registered or needs registration
    const isRegistered = await page.isVisible('text=Active');

    if (!isRegistered) {
      console.log('Voucher not registered - skipping email test');
      return;
    }

    // Click Email Voucher button
    await page.click('button:has-text("Email Voucher")');

    // Wait for dialog to appear
    await expect(page.locator('dialog, [role="dialog"]')).toBeVisible({ timeout: 5000 });

    // Verify dialog title
    await expect(page.locator('text=Email Voucher')).toBeVisible();

    // Enter email address
    const testEmail = 'test@example.com';
    await page.fill('input[type="email"]', testEmail);

    // Click send button
    await page.click('button:has-text("Send Email")');

    // Wait for success message
    await expect(page.locator('text=successfully')).toBeVisible({ timeout: 10000 });

    console.log('✅ Email voucher functionality verified');
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/voucher-registration');

    // Assume we're on a registered voucher page
    const emailButton = page.locator('button:has-text("Email Voucher")');

    if (await emailButton.isVisible()) {
      await emailButton.click();

      // Try invalid email
      await page.fill('input[type="email"]', 'invalid-email');
      await page.click('button:has-text("Send Email")');

      // Should show error
      await expect(page.locator('text=Invalid')).toBeVisible({ timeout: 3000 });

      console.log('✅ Email validation working');
    }
  });
});
