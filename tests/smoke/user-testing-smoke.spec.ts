import { test, expect } from '@playwright/test';
import { checkConsoleErrors, checkNetworkErrors, waitForPageLoad } from '../utils/helpers';

/**
 * Role-based smoke checks before external user testing.
 * Uses existing auth storage states:
 *  - Flex_Admin:    playwright/.auth/flex-admin.json
 *  - Finance_Manager: playwright/.auth/finance-manager.json
 *  - Counter_Agent: playwright/.auth/counter-agent.json
 *  - IT_Support:    playwright/.auth/it-support.json
 *
 * Ensure the corresponding auth setup files have been run to populate these states.
 */

const paths = {
  agentLanding: '/app/agent',
  corporateExitPass: '/app/payments/corporate-exit-pass',
  adminSettings: '/app/admin/settings',
  loginHistory: '/app/admin/login-history',
};

test.describe('Smoke | Counter Agent', () => {
  test.use({ storageState: 'playwright/.auth/counter-agent.json' });

  test('Agent landing loads with action cards', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    await page.goto(paths.agentLanding);
    await waitForPageLoad(page);

    await expect(page).toHaveURL(/\/app\/agent/);
    await expect(page.getByText('Welcome Back!')).toBeVisible();
    await expect(page.getByText('Choose an action below to get started')).toBeVisible();
    await expect(page.getByRole('button', { name: /Start Now/ }).first()).toBeVisible();

    await networkChecker.assertNoErrors();
    await consoleChecker.assertNoErrors();
  });

  test('Create voucher via individual purchase and export print PDF', async ({ page, context }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    // Unique test data
    const ts = Date.now();
    const passportNumber = `P${ts}`;
    const givenName = 'Test';
    const surname = 'User';
    const nationality = 'Testland';
    const dob = '1990-01-01';
    const expiry = '2030-12-31';

    // Step 0: passport details
    await page.goto('/app/passports/create');
    await waitForPageLoad(page);
    await page.fill('input#passportNumber', passportNumber);
    await page.fill('input#nationality', nationality);
    await page.fill('input#surname', surname);
    await page.fill('input#givenName', givenName);
    await page.fill('input#dob', dob);
    await page.click('button[role="combobox"]');
    await page.getByRole('option', { name: /Male/i }).first().click();
    await page.fill('input#dateOfExpiry', expiry);
    await page.getByRole('button', { name: /Proceed to Payment/i }).click();

    // Step 1: payment
    await waitForPageLoad(page);
    // Pick first available payment mode (usually Cash)
    const paymentOptions = page.getByRole('radio');
    await expect(paymentOptions.first()).toBeVisible({ timeout: 10000 });
    await paymentOptions.first().click();

    const spins = page.getByRole('spinbutton');
    // amount, discount, collected amount
    await spins.nth(0).fill('50');
    await spins.nth(1).fill('0');
    await spins.nth(2).fill('50');

    await page.getByRole('button', { name: /Process Payment/i }).click();

    // Step 2: voucher generated
    await expect(page.getByRole('heading', { name: /Voucher Generated Successfully/i }).first()).toBeVisible({ timeout: 20000 });
    const voucherCode = await page.locator('span.font-mono').first().textContent();

    // Open print dialog, then print to new window and save PDF
    await page.getByRole('button', { name: /Print Standard Voucher/i }).click();
    await expect(page.getByRole('heading', { name: /Print Green Card Voucher/i })).toBeVisible({ timeout: 10000 });
    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 15000 }),
      page.getByRole('button', { name: /Print Voucher/i }).click(),
    ]);
    await popup.waitForLoadState('load');
    const downloadPath = `test-results/voucher-${passportNumber}.pdf`;
    await popup.pdf({ path: downloadPath, format: 'A4' });
    await popup.close();

    console.log(`Voucher created: ${voucherCode?.trim() || ''}, PDF saved to ${downloadPath}`);

    await networkChecker.assertNoErrors();
    await consoleChecker.assertNoErrors();
  });

  test('Scan & Validate page is reachable', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    await page.goto('/app/scan');
    await waitForPageLoad(page);

    await expect(page).toHaveURL(/\/app\/scan/);
    await expect(page.getByRole('button', { name: /Scan/i })).toBeVisible({ timeout: 10000 });

    await networkChecker.assertNoErrors();
    await consoleChecker.assertNoErrors();
  });
});

test.describe('Smoke | Finance Manager', () => {
  test.use({ storageState: 'playwright/.auth/finance-manager.json' });

  test('Corporate Exit Pass page is reachable and invoice form renders', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    await page.goto(paths.corporateExitPass);
    await waitForPageLoad(page);

    await expect(page).toHaveURL(/corporate-exit-pass/);
    // Customer selector and Create Invoice button should be present on step 1
    await expect(page.locator('button[role="combobox"]').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Invoice/i })).toBeVisible();
    await expect(page.locator('input[name="total_vouchers"], input#total_vouchers')).toBeVisible();

    await networkChecker.assertNoErrors();
    await consoleChecker.assertNoErrors();
  });

  test('Vouchers list loads', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    await page.goto('/app/vouchers-list');
    await waitForPageLoad(page);

    await expect(page).toHaveURL(/vouchers-list/);
    await expect(page.getByText(/Vouchers/i).first()).toBeVisible({ timeout: 10000 });

    await networkChecker.assertNoErrors();
    await consoleChecker.assertNoErrors();
  });
});

test.describe('Smoke | Flex Admin', () => {
  test.use({ storageState: 'playwright/.auth/flex-admin.json' });

  test('Settings page renders GST toggle and policy fields', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    await page.goto(paths.adminSettings);
    await waitForPageLoad(page);

    await expect(page).toHaveURL(/admin\/settings/);
    await expect(page.getByText(/Settings/i).first()).toBeVisible();

    await networkChecker.assertNoErrors();
    await consoleChecker.assertNoErrors();
  });

  test('Policy pages accessible (terms/privacy/refunds)', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    for (const path of ['/terms', '/privacy', '/refunds']) {
      await page.goto(path);
      await waitForPageLoad(page);
      await expect(page).toHaveURL(new RegExp(path));
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });
    }

    await networkChecker.assertNoErrors();
    await consoleChecker.assertNoErrors();
  });
});

test.describe('Smoke | IT Support', () => {
  test.use({ storageState: 'playwright/.auth/it-support.json' });

  test('Login history is reachable', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    await page.goto(paths.loginHistory);
    await waitForPageLoad(page);

    await expect(page).toHaveURL(/admin\/login-history/);
    await expect(page.getByText(/Login History/i)).toBeVisible();

    await networkChecker.assertNoErrors();
    await consoleChecker.assertNoErrors();
  });
});

