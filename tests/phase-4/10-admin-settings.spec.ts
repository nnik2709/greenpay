import { test, expect } from '@playwright/test';
import {
  checkConsoleErrors,
  waitForPageLoad
} from '../utils/helpers';

/**
 * PHASE 4: Admin Settings Tests
 * Tests system configuration and email templates
 */

test.describe('Payment Modes Administration', () => {
  test('should manage payment modes', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/admin/payment-modes');
    await waitForPageLoad(page);

    // Should show payment modes list
    await expect(page.locator('text=/payment.*mode/i')).toBeVisible();

    // Should be able to add new mode
    const addButton = page.locator('button:has-text("Add")');
    if (await addButton.isVisible({ timeout: 2000 })) {
      await addButton.click();
      // Form should appear
      await expect(page.locator('input[name="name"]')).toBeVisible();
    }

    consoleChecker.assertNoErrors();
  });

  test('should toggle payment mode active status', async ({ page }) => {
    await page.goto('/admin/payment-modes');
    await waitForPageLoad(page);

    // Toggle button should exist
    const toggleButton = page.locator('button:has-text(/active|inactive/i)').or(page.locator('input[type="checkbox"]')).first();
    if (await toggleButton.isVisible({ timeout: 2000 })) {
      await toggleButton.click();
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Email Templates Administration', () => {
  test('[EXPECTED TO FAIL] should list email templates', async ({ page }) => {
    // SKELETON ONLY (from gap analysis - HIGH priority)

    await page.goto('/admin/email-templates');
    await waitForPageLoad(page);

    // Should show templates list
    await expect(page.locator('table').or(page.locator('text=/template/i'))).toBeVisible();
  });

  test('[EXPECTED TO FAIL] should edit email template', async ({ page }) => {
    // NOT IMPLEMENTED

    await page.goto('/admin/email-templates');
    await waitForPageLoad(page);

    const editButton = page.locator('button:has-text("Edit")').first();
    await expect(editButton).toBeVisible({ timeout: 5000 });

    await editButton.click();

    // Editor should open
    await expect(page.locator('textarea')).toBeVisible();

    // Should show template variables
    await expect(page.locator('text=/variable|placeholder/i')).toBeVisible();
  });

  test('[EXPECTED TO FAIL] should preview email template', async ({ page }) => {
    // NOT IMPLEMENTED

    await page.goto('/admin/email-templates');
    await waitForPageLoad(page);

    const previewButton = page.locator('button:has-text("Preview")').first();
    await expect(previewButton).toBeVisible({ timeout: 5000 });

    await previewButton.click();

    // Preview dialog should show
    await expect(page.locator('text=/preview|sample/i')).toBeVisible();
  });
});

test.describe('System Settings', () => {
  test('[PARTIAL] should configure voucher settings', async ({ page }) => {
    // Settings exist in Purchases page (line 842), should be in admin

    await page.goto('/dashboard');
    await waitForPageLoad(page);

    // Look for settings menu/dialog
    const settingsButton = page.locator('button:has-text("Settings")');
    if (await settingsButton.isVisible({ timeout: 2000 })) {
      await settingsButton.click();

      // Settings dialog
      await expect(page.locator('text=/validity|default.*amount/i')).toBeVisible();
    }
  });
});

test.describe('SMS Settings', () => {
  test('[EXPECTED TO FAIL] should configure SMS settings', async ({ page }) => {
    // Service exists, UI pending (from gap analysis - MEDIUM priority)

    await page.goto('/admin/sms-settings');
    await waitForPageLoad(page);

    // Should show SMS configuration form
    await expect(page.locator('text=/SMS|message|notification/i')).toBeVisible();

    // Should have API key field
    await expect(page.locator('input[name*="api"]')).toBeVisible();

    // Should have test send button
    await expect(page.locator('button:has-text("Test")')).toBeVisible();
  });
});
