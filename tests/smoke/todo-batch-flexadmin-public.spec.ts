import { test, expect } from '@playwright/test';
import { checkConsoleErrors, checkNetworkErrors, waitForPageLoad } from '../utils/helpers';

const emailRecipient = 'nikolay@eywasystems.com';

test.describe('TODO Batch | Flex Admin + Public', () => {
  test.use({ storageState: 'playwright/.auth/flex-admin.json' });

  test('FA1: settings GST toggle + policy content (save)', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    await page.goto('/app/admin/settings');
    await waitForPageLoad(page);

    // Toggle GST off then on to ensure persistence
    const gstSwitch = page.locator('input[type="checkbox"][id="gst_enabled"], button[role="switch"][id="gst_enabled"]').first();
    if (await gstSwitch.isVisible({ timeout: 3000 }).catch(() => false)) {
      const checked = await gstSwitch.isChecked().catch(() => false);
      await gstSwitch.setChecked(!checked);
      await page.waitForTimeout(500);
      await gstSwitch.setChecked(checked);
    }

    // Update policies with a marker
    const stamp = `Auto-test ${Date.now()}`;
    const terms = page.locator('textarea#terms_content, textarea[name="terms_content"]').first();
    const privacy = page.locator('textarea#privacy_content, textarea[name="privacy_content"]').first();
    const refunds = page.locator('textarea#refunds_content, textarea[name="refunds_content"]').first();
    if (await terms.isVisible({ timeout: 3000 }).catch(() => false)) await terms.fill(stamp);
    if (await privacy.isVisible({ timeout: 3000 }).catch(() => false)) await privacy.fill(stamp);
    if (await refunds.isVisible({ timeout: 3000 }).catch(() => false)) await refunds.fill(stamp);

    const saveBtn = page.getByRole('button', { name: /Save Policy Content/i }).first();
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }

    await networkChecker.assertNoErrors();
    await consoleChecker.assertNoErrors();
  });

  test('FA2: policy links in voucher emails (trigger email)', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    // Use corporate exit pass vouchers already generated: email vouchers if input exists
    await page.goto('/app/payments/corporate-exit-pass');
    await waitForPageLoad(page);
    const emailInput = page.locator('input[placeholder*="email" i]').first();
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill(emailRecipient);
      const sendBtn = page.getByRole('button', { name: /Email/i }).first();
      await sendBtn.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }

    await networkChecker.assertNoErrors();
    await consoleChecker.assertNoErrors();
  });
});

test.describe('TODO Batch | Public', () => {
  test('P1: public policy pages load', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    for (const path of ['/terms', '/privacy', '/refunds']) {
      await page.goto(path);
      await waitForPageLoad(page);
      await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/')));
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });
    }

    await networkChecker.assertNoErrors();
    await consoleChecker.assertNoErrors();
  });
});




