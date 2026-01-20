import { test, expect } from '@playwright/test';

/**
 * Flex Admin Complete Flow Tests
 * Based on: docs/user-guides/FLEX_ADMIN_USER_GUIDE.md
 *
 * Test Coverage:
 * - Workflow A: User Management (Create, Edit, Reset Password, Deactivate)
 * - Workflow B: System Settings Configuration
 * - Workflow C: Payment Modes Configuration
 * - Workflow D: Email Templates Management
 * - Navigation Tests: All admin features
 */

// Test credentials - update to match your test environment
const FLEX_ADMIN_EMAIL = 'flexadmin@greenpay.com';
const FLEX_ADMIN_PASSWORD = 'test123';

// Sample data for testing
const SAMPLE_NEW_USER = {
  email: 'newuser@example.com',
  fullName: 'Test User',
  phone: '+675 7123 4567',
  role: 'Counter_Agent',
  password: 'TempPass123!'
};

const SAMPLE_PAYMENT_MODE = {
  name: 'Test Payment Mode',
  description: 'Test payment method for automated testing',
  enabled: true
};

const SAMPLE_EMAIL_TEMPLATE = {
  name: 'Test Template',
  subject: 'Test Email Subject',
  body: 'This is a test email template body.'
};

// Extended timeout for complex admin workflows
test.setTimeout(600000); // 10 minutes

test.describe('Flex Admin - User Guide Flows', () => {

  test.beforeEach(async ({ page }) => {
    // Login as Flex Admin
    await page.goto('/');
    await page.fill('input[type="email"]', FLEX_ADMIN_EMAIL);
    await page.fill('input[type="password"]', FLEX_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/app/admin', { timeout: 10000 });
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/login-success-dashboard.png', fullPage: true });
  });

  // ============================================================================
  // WORKFLOW A: USER MANAGEMENT
  // ============================================================================

  test('Workflow A: User Management - Complete Cycle', async ({ page }) => {

    // STEP 1: Navigate to Users page
    await page.click('a[href="/app/users"]');
    await page.waitForURL('**/app/users');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-a-01-users-list.png', fullPage: true });

    // STEP 2: Click "Add User" button
    await page.click('button:has-text("Add User"), button:has-text("Create User"), button:has-text("New User")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-a-02-add-user-dialog.png', fullPage: true });

    // STEP 3: Fill in new user details
    await page.fill('input[name="email"], input[placeholder*="email" i]', SAMPLE_NEW_USER.email);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-a-03-email-filled.png', fullPage: true });

    await page.fill('input[name="fullName"], input[name="full_name"], input[placeholder*="name" i]', SAMPLE_NEW_USER.fullName);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-a-04-name-filled.png', fullPage: true });

    await page.fill('input[name="phone"], input[placeholder*="phone" i]', SAMPLE_NEW_USER.phone);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-a-05-phone-filled.png', fullPage: true });

    // STEP 4: Select role
    await page.click('select[name="role"], [role="combobox"]:has-text("Role"), button:has-text("Select role")');
    await page.waitForTimeout(500);
    await page.click(`text="${SAMPLE_NEW_USER.role}"`);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-a-06-role-selected.png', fullPage: true });

    // STEP 5: Set initial password
    await page.fill('input[name="password"], input[type="password"]', SAMPLE_NEW_USER.password);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-a-07-password-set.png', fullPage: true });

    // STEP 6: Review all fields before creating
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-a-08-all-fields-filled.png', fullPage: true });

    // STEP 7: Create user
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save"), button:has-text("Add User")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-a-09-user-created.png', fullPage: true });

    // STEP 8: Verify user appears in list
    await page.waitForSelector(`text="${SAMPLE_NEW_USER.email}"`);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-a-10-user-in-list.png', fullPage: true });

    // STEP 9: Edit user - click on user email
    await page.click(`text="${SAMPLE_NEW_USER.email}"`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-a-11-edit-user-dialog.png', fullPage: true });

    // STEP 10: Modify user details
    const updatedName = 'Updated Test User';
    await page.fill('input[name="fullName"], input[name="full_name"]', updatedName);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-a-12-name-updated.png', fullPage: true });

    // STEP 11: Save changes
    await page.click('button[type="submit"]:has-text("Update"), button:has-text("Save")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-a-13-user-updated.png', fullPage: true });

    // STEP 12: Reset user password
    await page.click(`text="${SAMPLE_NEW_USER.email}"`);
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Reset Password"), button:has-text("Change Password")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-a-14-reset-password-dialog.png', fullPage: true });

    // STEP 13: Enter new password
    const newPassword = 'NewPass123!';
    await page.fill('input[type="password"]', newPassword);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-a-15-new-password-entered.png', fullPage: true });

    // STEP 14: Confirm password reset
    await page.click('button:has-text("Reset"), button:has-text("Confirm"), button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-a-16-password-reset.png', fullPage: true });

    // STEP 15: View user activity
    await page.click(`text="${SAMPLE_NEW_USER.email}"`);
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Activity"), a:has-text("Activity"), [role="tab"]:has-text("Activity")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-a-17-user-activity.png', fullPage: true });

    // STEP 16: Close activity view
    await page.click('button:has-text("Close"), button[aria-label="Close"]');
    await page.waitForTimeout(500);

    // STEP 17: Deactivate user
    await page.click(`text="${SAMPLE_NEW_USER.email}"`);
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Deactivate"), button:has-text("Disable")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-a-18-deactivate-confirmation.png', fullPage: true });

    // STEP 18: Confirm deactivation
    await page.click('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Deactivate")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-a-19-user-deactivated.png', fullPage: true });
  });

  // ============================================================================
  // WORKFLOW B: SYSTEM SETTINGS CONFIGURATION
  // ============================================================================

  test('Workflow B: System Settings Configuration', async ({ page }) => {

    // STEP 1: Navigate to Settings
    await page.click('a[href="/app/admin/settings"], a:has-text("Settings")');
    await page.waitForURL('**/settings');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-b-01-settings-page.png', fullPage: true });

    // STEP 2: Review General Settings section
    await page.click('text="General Settings", [role="tab"]:has-text("General")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-b-02-general-settings.png', fullPage: true });

    // STEP 3: Review Email/SMTP Settings
    await page.click('text="Email", text="SMTP", [role="tab"]:has-text("Email")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-b-03-email-settings.png', fullPage: true });

    // STEP 4: Review Security Settings
    await page.click('text="Security", [role="tab"]:has-text("Security")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-b-04-security-settings.png', fullPage: true });

    // STEP 5: Review Payment Gateway Settings
    await page.click('text="Payment", text="Gateway", [role="tab"]:has-text("Payment")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-b-05-payment-gateway-settings.png', fullPage: true });

    // STEP 6: Review Backup Settings
    await page.click('text="Backup", [role="tab"]:has-text("Backup")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-b-06-backup-settings.png', fullPage: true });

    // STEP 7: Review API Settings
    await page.click('text="API", [role="tab"]:has-text("API")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-b-07-api-settings.png', fullPage: true });

    // STEP 8: Make a test configuration change (e.g., update system name)
    await page.click('[role="tab"]:has-text("General")');
    await page.waitForTimeout(500);
    const systemNameField = page.locator('input[name="systemName"], input[placeholder*="System Name" i]').first();
    if (await systemNameField.isVisible()) {
      await systemNameField.fill('PNG Green Fees System - Test');
      await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-b-08-config-modified.png', fullPage: true });

      // STEP 9: Save configuration
      await page.click('button:has-text("Save"), button[type="submit"]');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-b-09-config-saved.png', fullPage: true });
    }
  });

  // ============================================================================
  // WORKFLOW C: PAYMENT MODES CONFIGURATION
  // ============================================================================

  test('Workflow C: Payment Modes Configuration', async ({ page }) => {

    // STEP 1: Navigate to Payment Modes
    await page.click('a[href="/app/admin/payment-modes"], a:has-text("Payment Modes")');
    await page.waitForURL('**/payment-modes');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-c-01-payment-modes-list.png', fullPage: true });

    // STEP 2: View existing payment modes
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-c-02-existing-modes.png', fullPage: true });

    // STEP 3: Click "Add Payment Mode"
    const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-c-03-add-payment-mode-dialog.png', fullPage: true });

      // STEP 4: Fill payment mode details
      await page.fill('input[name="name"], input[placeholder*="name" i]', SAMPLE_PAYMENT_MODE.name);
      await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-c-04-name-filled.png', fullPage: true });

      await page.fill('input[name="description"], textarea[name="description"]', SAMPLE_PAYMENT_MODE.description);
      await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-c-05-description-filled.png', fullPage: true });

      // STEP 5: Enable payment mode
      const enabledCheckbox = page.locator('input[type="checkbox"][name="enabled"], [role="switch"]').first();
      if (await enabledCheckbox.isVisible()) {
        await enabledCheckbox.check();
        await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-c-06-enabled-checked.png', fullPage: true });
      }

      // STEP 6: Save payment mode
      await page.click('button:has-text("Save"), button:has-text("Create"), button[type="submit"]');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-c-07-payment-mode-created.png', fullPage: true });
    }

    // STEP 7: View all payment modes including new one
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-c-08-all-payment-modes.png', fullPage: true });
  });

  // ============================================================================
  // WORKFLOW D: EMAIL TEMPLATES MANAGEMENT
  // ============================================================================

  test('Workflow D: Email Templates Management', async ({ page }) => {

    // STEP 1: Navigate to Email Templates
    await page.click('a[href="/app/admin/email-templates"], a:has-text("Email Templates")');
    await page.waitForURL('**/email-templates');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-d-01-email-templates-list.png', fullPage: true });

    // STEP 2: View existing templates
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-d-02-existing-templates.png', fullPage: true });

    // STEP 3: Click on a template to edit (e.g., voucher email)
    const voucherTemplate = page.locator('text="Voucher", text="voucher"').first();
    if (await voucherTemplate.isVisible()) {
      await voucherTemplate.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-d-03-edit-template.png', fullPage: true });

      // STEP 4: Review template structure
      await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-d-04-template-structure.png', fullPage: true });

      // STEP 5: View template variables/placeholders
      await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-d-05-template-variables.png', fullPage: true });

      // STEP 6: Make a small change (e.g., update subject)
      const subjectField = page.locator('input[name="subject"]').first();
      if (await subjectField.isVisible()) {
        const currentSubject = await subjectField.inputValue();
        await subjectField.fill(`${currentSubject} - Updated`);
        await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-d-06-subject-updated.png', fullPage: true });

        // STEP 7: Save template
        await page.click('button:has-text("Save"), button[type="submit"]');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-d-07-template-saved.png', fullPage: true });

        // STEP 8: Revert change
        await subjectField.fill(currentSubject);
        await page.click('button:has-text("Save"), button[type="submit"]');
        await page.waitForTimeout(1000);
      }
    }

    // STEP 9: View all templates list
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/workflow-d-08-templates-list-final.png', fullPage: true });
  });

  // ============================================================================
  // NAVIGATION TESTS
  // ============================================================================

  test('Navigation: All Admin Features', async ({ page }) => {

    // Dashboard
    await page.click('a[href="/app/admin"], a:has-text("Dashboard")');
    await page.waitForURL('**/app/admin');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/nav-01-dashboard.png', fullPage: true });

    // Users
    await page.click('a[href="/app/users"]');
    await page.waitForURL('**/users');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/nav-02-users.png', fullPage: true });

    // All Passports
    await page.click('a[href="/app/passports"]');
    await page.waitForURL('**/passports');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/nav-03-passports.png', fullPage: true });

    // Quotations
    await page.click('a[href="/app/quotations"]');
    await page.waitForURL('**/quotations');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/nav-04-quotations.png', fullPage: true });

    // Invoices
    await page.click('a[href="/app/invoices"]');
    await page.waitForURL('**/invoices');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/nav-05-invoices.png', fullPage: true });

    // Customers
    await page.click('a[href="/app/customers"]');
    await page.waitForURL('**/customers');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/nav-06-customers.png', fullPage: true });

    // Reports menu
    await page.click('text="Reports", button:has-text("Reports")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/nav-07-reports-menu.png', fullPage: true });

    // Settings
    await page.click('a[href="/app/admin/settings"]');
    await page.waitForURL('**/settings');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/nav-08-settings.png', fullPage: true });

    // User menu
    await page.click('[data-testid="user-menu"], button:has-text("Account"), button[aria-label*="user" i]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/nav-09-user-menu.png', fullPage: true });
  });

  test('Logout Flow', async ({ page }) => {

    // Open user menu
    await page.click('[data-testid="user-menu"], button:has-text("Account"), button[aria-label*="user" i]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/logout-01-user-menu-open.png', fullPage: true });

    // Click logout
    await page.click('text="Logout", text="Sign Out", button:has-text("Logout")');
    await page.waitForURL('**/login', { timeout: 5000 });
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/flex-admin/logout-02-logged-out.png', fullPage: true });

    // Verify redirected to login page
    await expect(page).toHaveURL(/.*login.*/);
  });
});
