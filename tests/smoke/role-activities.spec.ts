import { test, expect } from '@playwright/test';
import { checkConsoleErrors, checkNetworkErrors, waitForPageLoad } from '../utils/helpers';

// Paths used in smoke activities
const paths = {
  agentLanding: '/app/agent',
  individualPurchase: '/app/passports/create',
  scan: '/app/scan',
  vouchersList: '/app/vouchers-list',
  corporateExitPass: '/app/payments/corporate-exit-pass',
  paymentsList: '/app/payments',
  quotations: '/app/quotations',
  settings: '/app/admin/settings',
  paymentModes: '/app/admin/payment-modes',
  emailTemplates: '/app/admin/email-templates',
  users: '/app/admin/users',
  loginHistory: '/app/admin/login-history',
  terms: '/terms',
  privacy: '/privacy',
  refunds: '/refunds',
};

test.describe('Role Activities | Counter Agent', () => {
  test.use({ storageState: 'playwright/.auth/counter-agent.json' });

  test('Agent landing, individual purchase form, scan page', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    // Landing
    await page.goto(paths.agentLanding);
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/app\/agent/);
    await expect(page.getByText(/Welcome Back/i)).toBeVisible();

    // Individual purchase form visible
    await page.goto(paths.individualPurchase);
    await waitForPageLoad(page);
    await expect(page.getByRole('heading', { name: /Passport Details/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Proceed to Payment/i })).toBeVisible();

    // Scan page reachable
    await page.goto(paths.scan);
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/app\/scan/);

    await networkChecker.assertNoErrors();
    await consoleChecker.assertNoErrors();
  });
});

test.describe('Role Activities | Finance Manager', () => {
  test.use({ storageState: 'playwright/.auth/finance-manager.json' });

  test('Corporate exit pass, vouchers list, payments list, quotations', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    await page.goto(paths.corporateExitPass);
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/corporate-exit-pass/);
    await expect(page.locator('button[role="combobox"]').first()).toBeVisible();

    await page.goto(paths.vouchersList);
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/vouchers-list/);

    await page.goto(paths.paymentsList);
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/app\/payments/);

    await page.goto(paths.quotations);
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/app\/quotations/);

    await networkChecker.assertNoErrors();
    await consoleChecker.assertNoErrors();
  });
});

test.describe('Role Activities | Flex Admin', () => {
  test.use({ storageState: 'playwright/.auth/flex-admin.json' });

  test('Admin settings, payment modes, email templates, users', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    await page.goto(paths.settings);
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/admin\/settings/);

    await page.goto(paths.paymentModes);
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/payment-modes/);

    await page.goto(paths.emailTemplates);
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/email-templates/);

    await page.goto(paths.users);
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/admin\/users/);

    await networkChecker.assertNoErrors();
    await consoleChecker.assertNoErrors();
  });
});

test.describe('Role Activities | IT Support', () => {
  test.use({ storageState: 'playwright/.auth/it-support.json' });

  test('Login history reachable', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    await page.goto(paths.loginHistory);
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/login-history/);
    await expect(page.getByText(/Login History/i)).toBeVisible();

    await networkChecker.assertNoErrors();
    await consoleChecker.assertNoErrors();
  });
});

test.describe('Role Activities | Public', () => {
  test('Terms, Privacy, Refunds pages load unauthenticated', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    for (const url of [paths.terms, paths.privacy, paths.refunds]) {
      await page.goto(url);
      await waitForPageLoad(page);
      await expect(page).toHaveURL(new RegExp(url.replace('/', '\\/')));
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });
    }

    await networkChecker.assertNoErrors();
    await consoleChecker.assertNoErrors();
  });
});

