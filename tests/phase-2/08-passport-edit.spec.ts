import { test, expect } from '@playwright/test';
import {
  checkConsoleErrors,
  checkNetworkErrors,
  waitForPageLoad,
  testData,
  fillFormField
} from '../utils/helpers';

/**
 * PHASE 2: Passport Editing Tests
 * Tests passport modification functionality
 */

test.describe('Passport Editing', () => {
  test('[EXPECTED TO FAIL] should edit existing passport', async ({ page }) => {
    // NOT IMPLEMENTED (from gap analysis - HIGH priority)

    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    await page.goto('/passports');
    await waitForPageLoad(page);

    // Find edit button on first passport
    const editButton = page.locator('button:has-text("Edit")').first();
    await expect(editButton).toBeVisible({ timeout: 5000 });

    await editButton.click();

    // Edit form should load
    await expect(page.locator('text=Edit Passport')).toBeVisible();

    // Modify fields
    await fillFormField(page, 'input[name="surname"]', 'UPDATED');

    // Save
    await page.click('button:has-text("Save")');

    // Should show success
    await expect(page.locator('text=/success|updated/i')).toBeVisible({ timeout: 5000 });

    consoleChecker.assertNoErrors();
    networkChecker.assertNoErrors();
  });

  test('[EXPECTED TO FAIL] should prevent editing of critical fields', async ({ page }) => {
    // When implemented, passport number should be readonly

    await page.goto('/passports');
    await waitForPageLoad(page);

    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible({ timeout: 2000 })) {
      await editButton.click();

      // Passport number should be readonly
      const passportInput = page.locator('input[name="passportNumber"]');
      await expect(passportInput).toHaveAttribute('readonly', '');
    }
  });
});
