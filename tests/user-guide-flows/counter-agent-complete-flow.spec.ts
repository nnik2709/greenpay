import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Counter Agent Complete User Flow Tests
 * Based on: docs/user-guides/COUNTER_AGENT_USER_GUIDE.md
 *
 * Tests all workflows described in the Counter Agent user guide with screenshots at each step.
 */

const SCREENSHOT_DIR = 'test-screenshots/user-guide-flows/counter-agent';

// Sample test data matching user guide examples
const SAMPLE_PASSPORT = {
  passportNumber: 'N1234567',
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  nationality: 'Australian',
  dateOfBirth: '1985-05-15',
  gender: 'Male',
  expiryDate: '2028-12-31',
  email: 'john.doe@example.com',
  phone: '+675 7234 5678'
};

const OPENING_FLOAT = 100.00;

test.describe('Counter Agent User Guide Flows', () => {

  test.beforeEach(async ({ page }) => {
    // Login as Counter Agent
    await page.goto('/login');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-login-page.png'), fullPage: true });

    await page.fill('input[type="email"]', 'agent@greenpay.com');
    await page.fill('input[type="password"]', 'test123');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-login-filled.png'), fullPage: true });

    await page.click('button[type="submit"]');
    await page.waitForURL('/app/agent');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-agent-landing-page.png'), fullPage: true });
  });

  test('Workflow A: Standard Walk-In Customer (Individual Purchase)', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes

    // STEP 1: Navigate to Individual Green Pass
    await test.step('Navigate to Individual Green Pass page', async () => {
      await page.click('a[href="/app/passports/create"]');
      await page.waitForURL('/app/passports/create');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-01-individual-purchase-page.png'), fullPage: true });
    });

    // STEP 2: Scan passport (simulate MRZ scanner by filling form)
    await test.step('Scan passport with MRZ scanner (simulated)', async () => {
      // Simulate MRZ scanner populating fields
      await page.fill('input[name="passportNumber"]', SAMPLE_PASSPORT.passportNumber);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-02-passport-number-entered.png'), fullPage: true });

      await page.fill('input[name="firstName"]', SAMPLE_PASSPORT.firstName);
      await page.fill('input[name="lastName"]', SAMPLE_PASSPORT.lastName);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-03-name-entered.png'), fullPage: true });

      await page.selectOption('select[name="nationality"]', SAMPLE_PASSPORT.nationality);
      await page.fill('input[name="dateOfBirth"]', SAMPLE_PASSPORT.dateOfBirth);
      await page.selectOption('select[name="gender"]', SAMPLE_PASSPORT.gender);
      await page.fill('input[name="expiryDate"]', SAMPLE_PASSPORT.expiryDate);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-04-all-passport-fields-filled.png'), fullPage: true });

      // Optional: Enter customer email
      await page.fill('input[name="email"]', SAMPLE_PASSPORT.email);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-05-email-entered.png'), fullPage: true });
    });

    // STEP 3: Process payment
    await test.step('Select payment method and process payment', async () => {
      // Verify amount displayed
      await expect(page.locator('text=PGK 50.00')).toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-06-amount-displayed.png'), fullPage: true });

      // Select Cash payment
      await page.click('button:has-text("Cash")');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-07-cash-selected.png'), fullPage: true });

      // Click Process Payment
      await page.click('button:has-text("Process Payment")');
      await page.waitForTimeout(2000); // Wait for processing
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-08-payment-processing.png'), fullPage: true });
    });

    // STEP 4: Voucher generated
    await test.step('Verify voucher generation', async () => {
      // Wait for voucher to be generated
      await expect(page.locator('text=/[A-Z0-9]{8}/')).toBeVisible({ timeout: 10000 });
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-09-voucher-generated.png'), fullPage: true });

      // Verify voucher details
      await expect(page.locator(`text=${SAMPLE_PASSPORT.passportNumber}`)).toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-10-voucher-details.png'), fullPage: true });
    });

    // STEP 5: Print voucher
    await test.step('Print voucher (verify print dialog would open)', async () => {
      // Click Print Voucher button
      const printButton = page.locator('button:has-text("Print Voucher")');
      await expect(printButton).toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-11-print-button-visible.png'), fullPage: true });

      // Note: Actual print dialog can't be tested in automated tests
      // We verify the button is clickable and would trigger print
      await expect(printButton).toBeEnabled();
    });

    // STEP 6: Email voucher
    await test.step('Email voucher to customer', async () => {
      await page.click('button:has-text("Email Voucher")');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-12-email-dialog-opened.png'), fullPage: true });

      // Verify email field is auto-focused and pre-filled
      const emailInput = page.locator('input[type="email"]').last();
      await expect(emailInput).toBeFocused();
      await expect(emailInput).toHaveValue(SAMPLE_PASSPORT.email);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-13-email-field-focused.png'), fullPage: true });

      // Click Send Email
      await page.click('button:has-text("Send Email")');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-14-email-sent.png'), fullPage: true });

      // Close email dialog
      await page.keyboard.press('Escape');
    });

    // STEP 7: Process new payment
    await test.step('Process new payment for next customer', async () => {
      const newPaymentButton = page.locator('button:has-text("Process New Payment")');
      if (await newPaymentButton.isVisible()) {
        await newPaymentButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-15-ready-for-next-customer.png'), fullPage: true });
      }
    });
  });

  test('Workflow B: Validate Existing Voucher', async ({ page }) => {
    test.setTimeout(120000);

    // STEP 1: Navigate to Scan & Validate
    await test.step('Navigate to Scan & Validate page', async () => {
      await page.click('a[href="/app/scan"]');
      await page.waitForURL('/app/scan');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-b-01-scan-validate-page.png'), fullPage: true });
    });

    // STEP 2: Scan voucher barcode (simulate)
    await test.step('Scan voucher barcode', async () => {
      const testVoucherCode = 'ABC12345'; // Sample voucher code from user guide

      await page.fill('input[name="voucherCode"]', testVoucherCode);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-b-02-voucher-code-entered.png'), fullPage: true });

      await page.click('button:has-text("Validate")');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-b-03-validation-result.png'), fullPage: true });
    });

    // STEP 3: Review validation results
    await test.step('Review validation results', async () => {
      // Check for validation status indicator
      const hasValid = await page.locator('text=/Valid|Active/i').isVisible();
      const hasInvalid = await page.locator('text=/Invalid|Expired|Used/i').isVisible();

      if (hasValid || hasInvalid) {
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-b-04-validation-status-shown.png'), fullPage: true });
      }
    });
  });

  test('Workflow C: Add Passport to Corporate Voucher', async ({ page }) => {
    test.setTimeout(180000);

    // Navigate to voucher registration page
    await test.step('Navigate to voucher registration', async () => {
      await page.goto('/voucher-registration');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-c-01-voucher-registration-page.png'), fullPage: true });
    });

    // STEP 1: Scan voucher barcode
    await test.step('Scan voucher barcode', async () => {
      const corporateVoucherCode = 'CORP1234';

      await page.fill('input[name="voucherCode"]', corporateVoucherCode);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-c-02-voucher-code-entered.png'), fullPage: true });

      await page.click('button:has-text("Find Voucher")');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-c-03-voucher-found.png'), fullPage: true });
    });

    // STEP 2: Scan passport
    await test.step('Scan passport with MRZ scanner', async () => {
      await page.fill('input[name="passportNumber"]', SAMPLE_PASSPORT.passportNumber);
      await page.fill('input[name="firstName"]', SAMPLE_PASSPORT.firstName);
      await page.fill('input[name="lastName"]', SAMPLE_PASSPORT.lastName);
      await page.selectOption('select[name="nationality"]', SAMPLE_PASSPORT.nationality);
      await page.fill('input[name="dateOfBirth"]', SAMPLE_PASSPORT.dateOfBirth);
      await page.selectOption('select[name="gender"]', SAMPLE_PASSPORT.gender);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-c-04-passport-details-entered.png'), fullPage: true });
    });

    // STEP 3: Register passport
    await test.step('Register passport to voucher', async () => {
      await page.click('button:has-text("Register Passport")');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-c-05-registration-complete.png'), fullPage: true });
    });
  });

  test('Workflow D: End of Shift Cash Reconciliation', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes

    // STEP 1: Navigate to Cash Reconciliation
    await test.step('Navigate to Cash Reconciliation', async () => {
      await page.click('a[href="/app/reports/cash-reconciliation"]');
      await page.waitForURL('/app/reports/cash-reconciliation');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-d-01-cash-reconciliation-page.png'), fullPage: true });
    });

    // STEP 2: Select date and opening float
    await test.step('Enter date and opening float', async () => {
      // Date is pre-selected to today
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-d-02-date-selected.png'), fullPage: true });

      // Enter opening float
      await page.fill('input[name="openingFloat"]', OPENING_FLOAT.toString());
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-d-03-opening-float-entered.png'), fullPage: true });

      // Load transactions
      await page.click('button:has-text("Load Transactions")');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-d-04-transactions-loaded.png'), fullPage: true });
    });

    // STEP 3: Review transaction summary
    await test.step('Review transaction summary', async () => {
      // Check for transaction metrics
      const hasSummary = await page.locator('text=/Total Transactions|Total Revenue|Cash/i').isVisible();
      if (hasSummary) {
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-d-05-transaction-summary.png'), fullPage: true });
      }
    });

    // STEP 4: Count cash denominations
    await test.step('Enter cash denomination counts', async () => {
      // Enter sample denomination counts
      const denominations = {
        hundred: 2,   // 2 x K100 = K200
        fifty: 3,     // 3 x K50 = K150
        twenty: 5,    // 5 x K20 = K100
        ten: 4,       // 4 x K10 = K40
        five: 6,      // 6 x K5 = K30
        two: 5,       // 5 x K2 = K10
        one: 8,       // 8 x K1 = K8
        fiftyCents: 4,   // 4 x 0.50 = K2
        twentyCents: 5,  // 5 x 0.20 = K1
        tenCents: 10,    // 10 x 0.10 = K1
        fiveCents: 20    // 20 x 0.05 = K1
      };
      // Total: K543

      for (const [denom, count] of Object.entries(denominations)) {
        const input = page.locator(`input[name="${denom}"]`);
        if (await input.isVisible()) {
          await input.fill(count.toString());
        }
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-d-06-denominations-entered.png'), fullPage: true });

      // Scroll to see calculation
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-d-07-denomination-totals.png'), fullPage: true });
    });

    // STEP 5: Add notes for variance
    await test.step('Add reconciliation notes', async () => {
      const notesField = page.locator('textarea[name="notes"]');
      if (await notesField.isVisible()) {
        await notesField.fill('All cash counted and verified. Small overage due to customer rounding up payment.');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-d-08-notes-added.png'), fullPage: true });
      }
    });

    // STEP 6: Review reconciliation summary
    await test.step('Review reconciliation summary', async () => {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-d-09-reconciliation-summary.png'), fullPage: true });
    });

    // STEP 7: Submit reconciliation
    await test.step('Submit reconciliation', async () => {
      const submitButton = page.locator('button:has-text("Submit Reconciliation")');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-d-10-reconciliation-submitted.png'), fullPage: true });
      }
    });

    // STEP 8: View history
    await test.step('View reconciliation history', async () => {
      const historyButton = page.locator('button:has-text("View History")');
      if (await historyButton.isVisible()) {
        await historyButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-d-11-reconciliation-history.png'), fullPage: true });
      }
    });
  });

  test('Navigation: All Passports View', async ({ page }) => {
    await test.step('View all processed passports', async () => {
      await page.click('a[href="/app/passports"]');
      await page.waitForURL('/app/passports');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'nav-01-all-passports-page.png'), fullPage: true });

      // Test search functionality
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill(SAMPLE_PASSPORT.passportNumber);
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'nav-02-passport-search.png'), fullPage: true });
      }
    });
  });

  test('Navigation: Vouchers List View', async ({ page }) => {
    await test.step('View all vouchers', async () => {
      await page.click('a[href="/app/vouchers-list"]');
      await page.waitForURL('/app/vouchers-list');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'nav-03-vouchers-list-page.png'), fullPage: true });

      // Test filters
      const statusFilter = page.locator('select[name="status"]');
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption('active');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'nav-04-vouchers-filtered.png'), fullPage: true });
      }
    });
  });

  test('User Menu: Change Password', async ({ page }) => {
    await test.step('Access password change dialog', async () => {
      // Click user menu
      await page.click('button[class*="rounded-full"]');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'menu-01-user-menu-opened.png'), fullPage: true });

      // Click Change Password
      await page.click('text=Change Password');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'menu-02-password-change-dialog.png'), fullPage: true });
    });
  });

  test('Logout Flow', async ({ page }) => {
    await test.step('Logout from system', async () => {
      // Click user menu
      await page.click('button[class*="rounded-full"]');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'logout-01-user-menu.png'), fullPage: true });

      // Click Logout
      await page.click('text=Log out');
      await page.waitForURL('/login');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'logout-02-logged-out.png'), fullPage: true });
    });
  });
});
