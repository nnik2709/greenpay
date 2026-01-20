import { test, expect } from '@playwright/test';

/**
 * IT Support Complete Flow Tests
 * Based on: docs/user-guides/IT_SUPPORT_USER_GUIDE.md
 *
 * Test Coverage:
 * - Workflow A: User Account Management
 * - Workflow B: Support Ticket Management
 * - Workflow C: Technical Troubleshooting Scenarios
 * - Workflow D: Login History Monitoring
 * - Navigation Tests: All IT Support features
 */

// Test credentials - update to match your test environment
const IT_SUPPORT_EMAIL = 'support@greenpay.com';
const IT_SUPPORT_PASSWORD = 'test123';

// Sample data for testing
const SAMPLE_USER_TO_MANAGE = {
  email: 'supporttest@example.com',
  fullName: 'Support Test User',
  phone: '+675 7555 1234',
  role: 'Counter_Agent',
  password: 'support123'
};

const SAMPLE_TICKET = {
  title: 'User Cannot Login - Password Reset Needed',
  description: 'Counter agent Jane Doe reports she cannot log in. Password reset required.',
  priority: 'High',
  category: 'Account Access',
  assignedTo: 'IT_Support'
};

const SAMPLE_TROUBLESHOOTING_SCENARIO = {
  issue: 'MRZ Scanner Not Working',
  user: 'Counter Agent',
  steps: [
    'Check USB connection',
    'Verify scanner driver',
    'Test scanner with notepad',
    'Configure scanner settings'
  ]
};

// Extended timeout for complex support workflows
test.setTimeout(600000); // 10 minutes

test.describe('IT Support - User Guide Flows', () => {

  test.beforeEach(async ({ page }) => {
    // Login as IT Support
    await page.goto('/');
    await page.fill('input[type="email"]', IT_SUPPORT_EMAIL);
    await page.fill('input[type="password"]', IT_SUPPORT_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/app/**', { timeout: 10000 });
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/login-success-dashboard.png', fullPage: true });
  });

  // ============================================================================
  // WORKFLOW A: USER ACCOUNT MANAGEMENT
  // ============================================================================

  test('Workflow A: User Account Management - Complete Cycle', async ({ page }) => {

    // STEP 1: Navigate to Users page
    await page.click('a[href="/app/users"]');
    await page.waitForURL('**/app/users');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-a-01-users-list.png', fullPage: true });

    // STEP 2: Click "Add User" button
    await page.click('button:has-text("Add User"), button:has-text("Create User"), button:has-text("New User")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-a-02-create-user-dialog.png', fullPage: true });

    // STEP 3: Fill in user details
    await page.fill('input[name="email"], input[placeholder*="email" i]', SAMPLE_USER_TO_MANAGE.email);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-a-03-email-filled.png', fullPage: true });

    await page.fill('input[name="fullName"], input[name="full_name"], input[placeholder*="name" i]', SAMPLE_USER_TO_MANAGE.fullName);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-a-04-name-filled.png', fullPage: true });

    await page.fill('input[name="phone"], input[placeholder*="phone" i]', SAMPLE_USER_TO_MANAGE.phone);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-a-05-phone-filled.png', fullPage: true });

    // STEP 4: Select role
    await page.click('select[name="role"], [role="combobox"]:has-text("Role"), button:has-text("Select role")');
    await page.waitForTimeout(500);
    await page.click(`text="${SAMPLE_USER_TO_MANAGE.role}"`);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-a-06-role-selected.png', fullPage: true });

    // STEP 5: Set initial password
    await page.fill('input[name="password"], input[type="password"]', SAMPLE_USER_TO_MANAGE.password);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-a-07-password-set.png', fullPage: true });

    // STEP 6: Create user
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Save"), button:has-text("Add User")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-a-08-user-created.png', fullPage: true });

    // STEP 7: Verify user in list
    await page.waitForSelector(`text="${SAMPLE_USER_TO_MANAGE.email}"`);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-a-09-user-in-list.png', fullPage: true });

    // STEP 8: Reset user password (common support task)
    await page.click(`text="${SAMPLE_USER_TO_MANAGE.email}"`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-a-10-user-details.png', fullPage: true });

    await page.click('button:has-text("Reset Password"), button:has-text("Change Password")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-a-11-reset-password-dialog.png', fullPage: true });

    const newPassword = 'ResetPass123!';
    await page.fill('input[type="password"]', newPassword);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-a-12-new-password-entered.png', fullPage: true });

    await page.click('button:has-text("Reset"), button:has-text("Confirm"), button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-a-13-password-reset-complete.png', fullPage: true });

    // STEP 9: Unlock user account (simulate locked account scenario)
    await page.click(`text="${SAMPLE_USER_TO_MANAGE.email}"`);
    await page.waitForTimeout(1000);

    const unlockButton = page.locator('button:has-text("Unlock"), button:has-text("Enable")').first();
    if (await unlockButton.isVisible()) {
      await unlockButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-a-14-account-unlocked.png', fullPage: true });
    }

    // STEP 10: Deactivate user (end of lifecycle)
    await page.click(`text="${SAMPLE_USER_TO_MANAGE.email}"`);
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Deactivate"), button:has-text("Disable")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-a-15-deactivate-confirmation.png', fullPage: true });

    await page.click('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Deactivate")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-a-16-user-deactivated.png', fullPage: true });
  });

  // ============================================================================
  // WORKFLOW B: SUPPORT TICKET MANAGEMENT
  // ============================================================================

  test('Workflow B: Support Ticket Management', async ({ page }) => {

    // STEP 1: Navigate to Support Tickets
    await page.click('a[href="/app/tickets"], a:has-text("Tickets"), a:has-text("Support")');
    await page.waitForURL('**/tickets');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-b-01-tickets-list.png', fullPage: true });

    // STEP 2: View all open tickets
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-b-02-open-tickets.png', fullPage: true });

    // STEP 3: Create new ticket (on behalf of user)
    await page.click('button:has-text("New Ticket"), button:has-text("Create Ticket")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-b-03-create-ticket-dialog.png', fullPage: true });

    // STEP 4: Fill ticket details
    await page.fill('input[name="title"], input[placeholder*="title" i]', SAMPLE_TICKET.title);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-b-04-title-filled.png', fullPage: true });

    await page.fill('textarea[name="description"], textarea[placeholder*="description" i]', SAMPLE_TICKET.description);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-b-05-description-filled.png', fullPage: true });

    // STEP 5: Set priority
    await page.click('select[name="priority"], button:has-text("Priority")');
    await page.waitForTimeout(500);
    await page.click(`text="${SAMPLE_TICKET.priority}"`);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-b-06-priority-set.png', fullPage: true });

    // STEP 6: Set category
    await page.click('select[name="category"], button:has-text("Category")');
    await page.waitForTimeout(500);
    await page.click(`text="${SAMPLE_TICKET.category}"`);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-b-07-category-set.png', fullPage: true });

    // STEP 7: Create ticket
    await page.click('button[type="submit"]:has-text("Create"), button:has-text("Submit")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-b-08-ticket-created.png', fullPage: true });

    // STEP 8: View ticket details
    await page.click(`text="${SAMPLE_TICKET.title}"`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-b-09-ticket-details.png', fullPage: true });

    // STEP 9: Assign ticket to self
    await page.click('button:has-text("Assign"), button:has-text("Take")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-b-10-assign-dialog.png', fullPage: true });

    await page.click('text="IT_Support", text="Assign to me"');
    await page.click('button:has-text("Confirm"), button[type="submit"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-b-11-ticket-assigned.png', fullPage: true });

    // STEP 10: Add work notes
    await page.fill('textarea[name="notes"], textarea[placeholder*="note" i]',
      'Reset user password. Verified identity via phone. User can now log in.');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-b-12-work-notes-added.png', fullPage: true });

    // STEP 11: Update ticket status to In Progress
    await page.click('select[name="status"], button:has-text("Status")');
    await page.waitForTimeout(500);
    await page.click('text="In Progress"');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-b-13-status-in-progress.png', fullPage: true });

    await page.click('button:has-text("Update"), button[type="submit"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-b-14-ticket-updated.png', fullPage: true });

    // STEP 12: Resolve ticket
    await page.click('select[name="status"], button:has-text("Status")');
    await page.waitForTimeout(500);
    await page.click('text="Resolved"');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-b-15-resolve-ticket.png', fullPage: true });

    await page.fill('textarea[name="resolution"], textarea[placeholder*="resolution" i]',
      'Password reset completed successfully. User verified and logged in.');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-b-16-resolution-notes.png', fullPage: true });

    await page.click('button:has-text("Resolve"), button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-b-17-ticket-resolved.png', fullPage: true });
  });

  // ============================================================================
  // WORKFLOW C: TECHNICAL TROUBLESHOOTING SCENARIOS
  // ============================================================================

  test('Workflow C: Technical Troubleshooting - Login Issues', async ({ page }) => {

    // STEP 1: Navigate to Login History
    await page.click('a[href="/app/login-history"], a:has-text("Login History")');
    await page.waitForURL('**/login-history');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-c-01-login-history.png', fullPage: true });

    // STEP 2: View failed login attempts
    await page.click('button:has-text("Failed"), [role="tab"]:has-text("Failed")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-c-02-failed-logins.png', fullPage: true });

    // STEP 3: Filter by specific user
    await page.fill('input[placeholder*="search" i], input[placeholder*="filter" i]', 'counteragent');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-c-03-filtered-user-logins.png', fullPage: true });

    // STEP 4: View login details
    const firstLoginRow = page.locator('tr').nth(1);
    if (await firstLoginRow.isVisible()) {
      await firstLoginRow.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-c-04-login-details.png', fullPage: true });
    }

    // STEP 5: Check if account is locked
    await page.goto('/app/users');
    await page.waitForURL('**/users');
    await page.fill('input[placeholder*="search" i]', 'counteragent');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-c-05-check-account-status.png', fullPage: true });
  });

  test('Workflow C: Technical Troubleshooting - Email Not Sending', async ({ page }) => {

    // STEP 1: Check system logs
    await page.click('a[href="/app/system-logs"], a:has-text("Logs")');
    await page.waitForURL('**/logs', { timeout: 5000 }).catch(() => {});
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-c-06-system-logs.png', fullPage: true });

    // STEP 2: Filter logs for email errors
    const logFilter = page.locator('input[placeholder*="search" i], input[placeholder*="filter" i]').first();
    if (await logFilter.isVisible()) {
      await logFilter.fill('email');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-c-07-email-logs.png', fullPage: true });
    }

    // STEP 3: Review SMTP settings (view-only access)
    await page.click('a[href="/app/admin/settings"], a:has-text("Settings")');
    await page.waitForURL('**/settings').catch(() => {});
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-c-08-smtp-settings-view.png', fullPage: true });
  });

  test('Workflow C: Technical Troubleshooting - MRZ Scanner Issues', async ({ page }) => {

    // STEP 1: Navigate to Scanner Test page
    await page.click('a[href="/app/scanner-test"], a:has-text("Scanner")');
    await page.waitForURL('**/scanner-test').catch(() => {});
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-c-09-scanner-test-page.png', fullPage: true });

    // STEP 2: Test scanner configuration
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-c-10-scanner-config.png', fullPage: true });

    // STEP 3: Simulate scan test
    const scanInput = page.locator('input[data-scanner], input[placeholder*="scan" i]').first();
    if (await scanInput.isVisible()) {
      // Simulate MRZ scan (88 characters)
      const testMRZ = 'P<AUSSMITH<<JOHN<DOE<<<<<<<<<<<<<<<<<<<<<<<<N1234567<AUS8505155M2812319<<<<<<<<<<<<<<08';
      await scanInput.fill(testMRZ);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-c-11-scanner-test-result.png', fullPage: true });
    }
  });

  // ============================================================================
  // WORKFLOW D: LOGIN HISTORY MONITORING
  // ============================================================================

  test('Workflow D: Login History Monitoring and Reporting', async ({ page }) => {

    // STEP 1: Navigate to Login History
    await page.click('a[href="/app/login-history"]');
    await page.waitForURL('**/login-history');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-d-01-login-history-page.png', fullPage: true });

    // STEP 2: View all login attempts
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-d-02-all-logins.png', fullPage: true });

    // STEP 3: Filter by date range
    const dateFromField = page.locator('input[type="date"], input[name="dateFrom"]').first();
    if (await dateFromField.isVisible()) {
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      await dateFromField.fill(lastWeek.toISOString().split('T')[0]);
      await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-d-03-date-filtered.png', fullPage: true });
    }

    // STEP 4: Filter by role
    await page.click('select[name="role"], button:has-text("Role")');
    await page.waitForTimeout(500);
    await page.click('text="Counter_Agent"');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-d-04-role-filtered.png', fullPage: true });

    // STEP 5: View suspicious activity (multiple failed attempts)
    await page.click('button:has-text("Failed"), [role="tab"]:has-text("Failed")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-d-05-suspicious-activity.png', fullPage: true });

    // STEP 6: Export login history report
    await page.click('button:has-text("Export"), button:has-text("Download")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-d-06-export-options.png', fullPage: true });

    // STEP 7: Select export format (CSV)
    const csvOption = page.locator('text="CSV", button:has-text("CSV")').first();
    if (await csvOption.isVisible()) {
      await csvOption.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/workflow-d-07-report-exported.png', fullPage: true });
    }
  });

  // ============================================================================
  // NAVIGATION TESTS
  // ============================================================================

  test('Navigation: All IT Support Features', async ({ page }) => {

    // Dashboard
    await page.click('a[href="/app"], a:has-text("Dashboard"), a:has-text("Home")');
    await page.waitForURL('**/app/**');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/nav-01-dashboard.png', fullPage: true });

    // Users
    await page.click('a[href="/app/users"]');
    await page.waitForURL('**/users');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/nav-02-users.png', fullPage: true });

    // Support Tickets
    await page.click('a[href="/app/tickets"]');
    await page.waitForURL('**/tickets');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/nav-03-tickets.png', fullPage: true });

    // Login History
    await page.click('a[href="/app/login-history"]');
    await page.waitForURL('**/login-history');
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/nav-04-login-history.png', fullPage: true });

    // Scan & Validate
    await page.click('a[href="/app/scan-validate"]');
    await page.waitForURL('**/scan-validate').catch(() => {});
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/nav-05-scan-validate.png', fullPage: true });

    // Reports menu (view-only access)
    await page.click('text="Reports", button:has-text("Reports")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/nav-06-reports-menu.png', fullPage: true });

    // Invoices (view-only)
    await page.click('a[href="/app/invoices"]');
    await page.waitForURL('**/invoices').catch(() => {});
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/nav-07-invoices-view.png', fullPage: true });

    // Settings (view-only)
    await page.click('a[href="/app/admin/settings"]');
    await page.waitForURL('**/settings').catch(() => {});
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/nav-08-settings-view.png', fullPage: true });

    // User menu
    await page.click('[data-testid="user-menu"], button:has-text("Account"), button[aria-label*="user" i]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/nav-09-user-menu.png', fullPage: true });
  });

  test('Logout Flow', async ({ page }) => {

    // Open user menu
    await page.click('[data-testid="user-menu"], button:has-text("Account"), button[aria-label*="user" i]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/logout-01-user-menu-open.png', fullPage: true });

    // Click logout
    await page.click('text="Logout", text="Sign Out", button:has-text("Logout")');
    await page.waitForURL('**/login', { timeout: 5000 });
    await page.screenshot({ path: 'test-screenshots/user-guide-flows/it-support/logout-02-logged-out.png', fullPage: true });

    // Verify redirected to login page
    await expect(page).toHaveURL(/.*login.*/);
  });
});
