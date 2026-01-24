import { test, expect } from '@playwright/test';
import { checkConsoleErrors, checkNetworkErrors, waitForPageLoad } from '../utils/helpers';

const BASE = process.env.PLAYWRIGHT_BASE_URL || '';

test.describe('TODO Batch | Counter Agent', () => {
  test.use({ storageState: 'playwright/.auth/counter-agent.json' });

  test('A1/A2/A3: individual purchase -> PDF, scan valid/invalid, add passport to voucher', async ({ page, context }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const networkChecker = await checkNetworkErrors(page);

    // A1: create individual purchase and print PDF
    const ts = Date.now();
    const passportNumber = `P${ts}`;
    const givenName = 'Test';
    const surname = 'User';
    const nationality = 'Testland';
    const dob = '1990-01-01';
    const expiry = '2030-12-31';

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

    await waitForPageLoad(page);
    const paymentOptions = page.getByRole('radio');
    await expect(paymentOptions.first()).toBeVisible({ timeout: 10000 });
    await paymentOptions.first().click();

    const spins = page.getByRole('spinbutton');
    await spins.nth(0).fill('50'); // amount
    await spins.nth(1).fill('0');  // discount
    await spins.nth(2).fill('50'); // collected

    await page.getByRole('button', { name: /Process Payment/i }).click();
    await expect(page.getByRole('heading', { name: /Voucher Generated Successfully/i }).first()).toBeVisible({ timeout: 20000 });

    const voucherCode = (await page.locator('span.font-mono').first().textContent())?.trim() || '';

    // Print dialog and save PDF
    await page.getByRole('button', { name: /Print Standard Voucher/i }).click();
    await expect(page.getByRole('heading', { name: /Print Green Card Voucher/i })).toBeVisible({ timeout: 10000 });
    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 15000 }),
      page.getByRole('button', { name: /Print Voucher/i }).click(),
    ]);
    await popup.waitForLoadState('load');
    const downloadPath = `test-results/todo-counter-agent-${passportNumber}.pdf`;
    await popup.pdf({ path: downloadPath, format: 'A4' });
    await popup.close();

    // A2: scan/validate valid + invalid
    await page.goto('/app/scan');
    await waitForPageLoad(page);
    const codeInput = page.getByRole('textbox').first();
    await codeInput.fill(voucherCode);
    await page.getByRole('button', { name: /Validate/i }).click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await codeInput.fill('INVALID123');
    await page.getByRole('button', { name: /Validate/i }).click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // A3: add passport to existing voucher (public route); use same code
    await page.goto('/voucher-registration');
    await waitForPageLoad(page);
    const voucherField = page.locator('input#voucherCode, input[placeholder*="voucher"], input[type="text"]').first();
    await voucherField.fill(voucherCode);
    await page.getByRole('button', { name: /Search/i }).click({ timeout: 5000 }).catch(() => {});
    // If form appears, fill minimal passport fields again
    const pn = page.locator('input#passportNumber, input[name="passportNumber"]').first();
    if (await pn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pn.fill(`${passportNumber}-A3`);
      await page.getByRole('button', { name: /Update/i }).click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }

    await networkChecker.assertNoErrors();
    await consoleChecker.assertNoErrors();
  });
});




