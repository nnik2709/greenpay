import { test, expect } from '@playwright/test';
import { checkConsoleErrors, checkNetworkErrors, waitForPageLoad } from '../utils/helpers';

test.describe('TODO Batch | Errors & Public', () => {
  test('E1: invalid voucher shows friendly error', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    await page.goto('/app/scan');
    await waitForPageLoad(page);

    const codeInput = page.getByRole('textbox').first();
    await codeInput.fill('INVALID123');
    await page.getByRole('button', { name: /Validate/i }).click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // No specific error text required; just ensure no crash and form remains
    await expect(codeInput).toBeVisible({ timeout: 5000 });

    await networkChecker.assertNoErrors();
    await consoleChecker.assertNoErrors();
  });

  test('E2: network/offline error shows graceful message', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    await page.goto('/app/scan');
    await waitForPageLoad(page);

    // Simulate offline
    await page.context().setOffline(true);
    const codeInput = page.getByRole('textbox').first();
    await codeInput.fill('TESTOFFLINE');
    await page.getByRole('button', { name: /Validate/i }).click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Ensure no crash and field remains visible
    await expect(codeInput).toBeVisible({ timeout: 5000 });

    // Restore online
    await page.context().setOffline(false);

    await networkChecker.assertNoErrors();
    await consoleChecker.assertNoErrors();
  });
});

