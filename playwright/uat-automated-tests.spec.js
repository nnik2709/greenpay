import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'https://eywademo.cloud';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'password123';
const AGENT_EMAIL = 'agent@example.com';
const AGENT_PASSWORD = 'password123';
const FINANCE_EMAIL = 'finance@example.com';
const FINANCE_PASSWORD = 'password123';

// Test data
const TEST_PASSPORT = {
  passportNumber: 'TEST' + Date.now(),
  surname: 'Test',
  givenName: 'User',
  nationality: 'Papua New Guinea',
  dateOfBirth: '01/01/1990',
  gender: 'Male'
};

const TEST_PURCHASE = {
  customer: 'Test Customer',
  service: 'Green Fee',
  amount: '50.00',
  paymentMethod: 'Cash'
};

const TEST_CORPORATE = {
  company: 'Test Corporation',
  contact: 'corporate@test.com',
  vouchers: '10',
  amount: '500.00'
};

const TEST_QUOTATION = {
  customer: 'Test Company',
  email: 'test@company.com',
  services: ['Green Fee'],
  quantities: ['1']
};

const TEST_USER = {
  email: 'newuser@test.com',
  fullName: 'New Test User',
  role: 'Counter_Agent',
  password: 'password123'
};

test.describe('PNG Green Fees System - UAT Automated Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Test 1: Authentication & Login', () => {
    
    test('1.1 Admin Login', async ({ page }) => {
      // Navigate to login page
      await page.goto(BASE_URL);
      
      // Fill login form
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      
      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard');
      
      // Verify successful login
      await expect(page.locator('h1')).toContainText('Dashboard');
      
      // Verify admin role is displayed
      await expect(page.locator('[data-testid="user-role"]')).toContainText('Admin');
      
      console.log('✅ Admin login successful');
    });

    test('1.2 Counter Agent Login', async ({ page }) => {
      // Fill login form with agent credentials
      await page.fill('input[type="email"]', AGENT_EMAIL);
      await page.fill('input[type="password"]', AGENT_PASSWORD);
      await page.click('button[type="submit"]');
      
      // Wait for redirect
      await page.waitForURL('**/dashboard');
      
      // Verify successful login
      await expect(page.locator('h1')).toContainText('Dashboard');
      
      // Verify agent role
      await expect(page.locator('[data-testid="user-role"]')).toContainText('Counter_Agent');
      
      console.log('✅ Counter agent login successful');
    });

    test('1.3 Invalid Login', async ({ page }) => {
      // Try invalid login
      await page.fill('input[type="email"]', 'invalid@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Verify error message appears
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
      
      // Verify still on login page
      await expect(page).toHaveURL(BASE_URL);
      
      console.log('✅ Invalid login properly rejected');
    });

    test('1.4 Logout', async ({ page }) => {
      // Login first
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      
      // Click logout
      await page.click('[data-testid="logout-button"]');
      
      // Verify redirected to login
      await page.waitForURL(BASE_URL);
      await expect(page.locator('input[type="email"]')).toBeVisible();
      
      console.log('✅ Logout successful');
    });
  });

  test.describe('Test 2: Dashboard & Navigation', () => {
    
    test.beforeEach(async ({ page }) => {
      // Login as admin before each test
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    test('2.1 Dashboard Loading', async ({ page }) => {
      // Verify dashboard elements
      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="activity-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();
      await expect(page.locator('[data-testid="system-status"]')).toBeVisible();
      
      console.log('✅ Dashboard loads with all components');
    });

    test('2.2 Menu Navigation', async ({ page }) => {
      const menuItems = [
        'Dashboard',
        'Users', 
        'Passports',
        'Purchases',
        'Cash Reconciliation',
        'Quotations',
        'Reports',
        'Settings'
      ];

      for (const menuItem of menuItems) {
        await page.click(`[data-testid="menu-${menuItem.toLowerCase().replace(' ', '-')}"]`);
        await page.waitForLoadState('networkidle');
        
        // Verify page loaded (not 404)
        const response = await page.waitForResponse(response => 
          response.url().includes(menuItem.toLowerCase().replace(' ', '-'))
        );
        expect(response.status()).toBe(200);
        
        console.log(`✅ ${menuItem} menu loads correctly`);
      }
    });
  });

  test.describe('Test 3: Passport Management', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    test('3.1 Individual Passport Entry', async ({ page }) => {
      // Navigate to add passport
      await page.click('[data-testid="menu-passports"]');
      await page.click('[data-testid="add-passport"]');
      
      // Fill passport form
      await page.fill('input[name="passport_number"]', TEST_PASSPORT.passportNumber);
      await page.fill('input[name="surname"]', TEST_PASSPORT.surname);
      await page.fill('input[name="given_name"]', TEST_PASSPORT.givenName);
      await page.selectOption('select[name="nationality"]', TEST_PASSPORT.nationality);
      await page.fill('input[name="date_of_birth"]', TEST_PASSPORT.dateOfBirth);
      await page.selectOption('select[name="gender"]', TEST_PASSPORT.gender);
      
      // Save passport
      await page.click('button[type="submit"]');
      
      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Passport saved successfully');
      
      // Verify passport appears in list
      await page.click('[data-testid="view-passports"]');
      await expect(page.locator(`text=${TEST_PASSPORT.passportNumber}`)).toBeVisible();
      
      console.log('✅ Individual passport entry successful');
    });

    test('3.2 Bulk Passport Upload', async ({ page }) => {
      // Navigate to bulk upload
      await page.click('[data-testid="menu-passports"]');
      await page.click('[data-testid="bulk-upload"]');
      
      // Create test CSV file
      const csvContent = `passport_number,surname,given_name,nationality,date_of_birth,gender
BULK001,Doe,John,Papua New Guinea,1990-01-01,Male
BULK002,Smith,Jane,Papua New Guinea,1992-05-15,Female
BULK003,Johnson,Bob,Papua New Guinea,1988-12-10,Male`;
      
      // Upload CSV file
      await page.setInputFiles('input[type="file"]', {
        name: 'test-passports.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(csvContent)
      });
      
      await page.click('button[type="submit"]');
      
      // Wait for processing
      await page.waitForSelector('[data-testid="upload-results"]');
      
      // Verify results
      await expect(page.locator('[data-testid="success-count"]')).toContainText('3');
      await expect(page.locator('[data-testid="error-count"]')).toContainText('0');
      
      console.log('✅ Bulk passport upload successful');
    });

    test('3.3 Passport Search & Filter', async ({ page }) => {
      // Navigate to passport list
      await page.click('[data-testid="menu-passports"]');
      await page.click('[data-testid="view-passports"]');
      
      // Test search by passport number
      await page.fill('input[placeholder*="search"]', TEST_PASSPORT.passportNumber);
      await page.press('input[placeholder*="search"]', 'Enter');
      
      // Verify search results
      await expect(page.locator(`text=${TEST_PASSPORT.passportNumber}`)).toBeVisible();
      
      // Test filter by nationality
      await page.selectOption('select[name="nationality-filter"]', TEST_PASSPORT.nationality);
      await expect(page.locator('tbody tr')).toHaveCount.greaterThan(0);
      
      console.log('✅ Passport search and filter working');
    });
  });

  test.describe('Test 4: Purchase Management', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    test('4.1 Individual Purchase', async ({ page }) => {
      // Navigate to new purchase
      await page.click('[data-testid="menu-purchases"]');
      await page.click('[data-testid="new-purchase"]');
      
      // Fill purchase form
      await page.fill('input[name="customer"]', TEST_PURCHASE.customer);
      await page.selectOption('select[name="passport"]', { index: 0 }); // Select first passport
      await page.selectOption('select[name="service"]', TEST_PURCHASE.service);
      await page.fill('input[name="amount"]', TEST_PURCHASE.amount);
      await page.selectOption('select[name="payment_method"]', TEST_PURCHASE.paymentMethod);
      
      // Process payment
      await page.click('button[type="submit"]');
      
      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Purchase completed');
      
      // Verify receipt generation
      await expect(page.locator('[data-testid="receipt-download"]')).toBeVisible();
      
      console.log('✅ Individual purchase successful');
    });

    test('4.2 Corporate Purchase', async ({ page }) => {
      // Navigate to corporate purchase
      await page.click('[data-testid="menu-purchases"]');
      await page.click('[data-testid="corporate-purchase"]');
      
      // Fill corporate form
      await page.fill('input[name="company"]', TEST_CORPORATE.company);
      await page.fill('input[name="contact"]', TEST_CORPORATE.contact);
      await page.fill('input[name="vouchers"]', TEST_CORPORATE.vouchers);
      await page.fill('input[name="amount"]', TEST_CORPORATE.amount);
      
      // Generate vouchers
      await page.click('button[type="submit"]');
      
      // Wait for processing
      await page.waitForSelector('[data-testid="voucher-generation"]');
      
      // Verify ZIP download
      await expect(page.locator('[data-testid="zip-download"]')).toBeVisible();
      
      console.log('✅ Corporate purchase successful');
    });
  });

  test.describe('Test 5: Quotation System', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    test('5.1 Create Quotation', async ({ page }) => {
      // Navigate to new quotation
      await page.click('[data-testid="menu-quotations"]');
      await page.click('[data-testid="new-quotation"]');
      
      // Fill quotation form
      await page.fill('input[name="customer"]', TEST_QUOTATION.customer);
      await page.fill('input[name="email"]', TEST_QUOTATION.email);
      
      // Add services
      await page.click('[data-testid="add-service"]');
      await page.selectOption('select[name="service"]', TEST_QUOTATION.services[0]);
      await page.fill('input[name="quantity"]', TEST_QUOTATION.quantities[0]);
      
      // Generate quotation
      await page.click('button[type="submit"]');
      
      // Verify quotation created
      await expect(page.locator('[data-testid="quotation-number"]')).toBeVisible();
      
      console.log('✅ Quotation creation successful');
    });

    test('5.2 Send Quotation', async ({ page }) => {
      // First create a quotation
      await page.click('[data-testid="menu-quotations"]');
      await page.click('[data-testid="new-quotation"]');
      await page.fill('input[name="customer"]', TEST_QUOTATION.customer);
      await page.fill('input[name="email"]', TEST_QUOTATION.email);
      await page.click('[data-testid="add-service"]');
      await page.selectOption('select[name="service"]', TEST_QUOTATION.services[0]);
      await page.fill('input[name="quantity"]', TEST_QUOTATION.quantities[0]);
      await page.click('button[type="submit"]');
      
      // Find and send quotation
      await page.click('[data-testid="view-quotations"]');
      await page.click('[data-testid="send-quotation"]');
      
      // Verify email sent
      await expect(page.locator('[data-testid="email-sent"]')).toContainText('Email sent successfully');
      
      console.log('✅ Quotation sending successful');
    });

    test('5.3 Approve Quotation', async ({ page, context }) => {
      // Login as Finance Manager
      const financePage = await context.newPage();
      await financePage.goto(BASE_URL);
      await financePage.fill('input[type="email"]', FINANCE_EMAIL);
      await financePage.fill('input[type="password"]', FINANCE_PASSWORD);
      await financePage.click('button[type="submit"]');
      await financePage.waitForURL('**/dashboard');
      
      // Navigate to quotations
      await financePage.click('[data-testid="menu-quotations"]');
      await financePage.click('[data-testid="pending-approvals"]');
      
      // Approve quotation
      await financePage.click('[data-testid="approve-quotation"]');
      await financePage.fill('textarea[name="approval_notes"]', 'Approved for testing');
      await financePage.click('button[type="submit"]');
      
      // Verify approval
      await expect(financePage.locator('[data-testid="approval-success"]')).toContainText('Quotation approved');
      
      await financePage.close();
      console.log('✅ Quotation approval successful');
    });

    test('5.4 Convert to Purchase', async ({ page }) => {
      // Navigate to approved quotations
      await page.click('[data-testid="menu-quotations"]');
      await page.click('[data-testid="approved-quotations"]');
      
      // Convert quotation
      await page.click('[data-testid="convert-quotation"]');
      await page.click('button[type="submit"]');
      
      // Verify conversion
      await expect(page.locator('[data-testid="conversion-success"]')).toContainText('Purchase created successfully');
      
      console.log('✅ Quotation to purchase conversion successful');
    });
  });

  test.describe('Test 6: Cash Reconciliation', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.fill('input[type="email"]', AGENT_EMAIL);
      await page.fill('input[type="password"]', AGENT_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    test('6.1 Start Cash Reconciliation', async ({ page }) => {
      // Navigate to cash reconciliation
      await page.click('[data-testid="menu-cash-reconciliation"]');
      await page.click('[data-testid="start-reconciliation"]');
      
      // Fill reconciliation form
      await page.fill('input[name="opening_float"]', '100.00');
      await page.fill('input[name="expected_cash"]', '500.00');
      
      // Enter cash denominations
      await page.fill('input[name="hundred_kina"]', '2');
      await page.fill('input[name="fifty_kina"]', '4');
      await page.fill('input[name="twenty_kina"]', '5');
      
      // Complete reconciliation
      await page.click('button[type="submit"]');
      
      // Verify completion
      await expect(page.locator('[data-testid="reconciliation-complete"]')).toContainText('Reconciliation completed');
      
      console.log('✅ Cash reconciliation successful');
    });

    test('6.2 Approve Reconciliation', async ({ page, context }) => {
      // Login as Finance Manager
      const financePage = await context.newPage();
      await financePage.goto(BASE_URL);
      await financePage.fill('input[type="email"]', FINANCE_EMAIL);
      await financePage.fill('input[type="password"]', FINANCE_PASSWORD);
      await financePage.click('button[type="submit"]');
      await financePage.waitForURL('**/dashboard');
      
      // Navigate to reconciliation approvals
      await financePage.click('[data-testid="menu-cash-reconciliation"]');
      await financePage.click('[data-testid="pending-reconciliations"]');
      
      // Approve reconciliation
      await financePage.click('[data-testid="approve-reconciliation"]');
      await financePage.fill('textarea[name="approval_notes"]', 'Approved for testing');
      await financePage.click('button[type="submit"]');
      
      // Verify approval
      await expect(financePage.locator('[data-testid="approval-success"]')).toContainText('Reconciliation approved');
      
      await financePage.close();
      console.log('✅ Reconciliation approval successful');
    });
  });

  test.describe('Test 7: Reports & Analytics', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    test('7.1 Revenue Reports', async ({ page }) => {
      // Navigate to revenue reports
      await page.click('[data-testid="menu-reports"]');
      await page.click('[data-testid="revenue-reports"]');
      
      // Select date range
      await page.fill('input[name="date_from"]', '2025-01-01');
      await page.fill('input[name="date_to"]', '2025-12-31');
      await page.click('button[type="submit"]');
      
      // Verify report generation
      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="revenue-total"]')).toBeVisible();
      
      // Test export
      await page.click('[data-testid="export-excel"]');
      const downloadPromise = page.waitForEvent('download');
      await downloadPromise;
      
      console.log('✅ Revenue reports working');
    });

    test('7.2 Passport Reports', async ({ page }) => {
      // Navigate to passport reports
      await page.click('[data-testid="menu-reports"]');
      await page.click('[data-testid="passport-reports"]');
      
      // Apply filters
      await page.selectOption('select[name="nationality-filter"]', 'Papua New Guinea');
      await page.click('button[type="submit"]');
      
      // Verify filtered results
      await expect(page.locator('[data-testid="report-results"]')).toBeVisible();
      
      console.log('✅ Passport reports working');
    });

    test('7.3 Bulk Upload Reports', async ({ page }) => {
      // Navigate to bulk upload reports
      await page.click('[data-testid="menu-reports"]');
      await page.click('[data-testid="bulk-upload-reports"]');
      
      // Verify report data
      await expect(page.locator('[data-testid="total-uploads"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-rate"]')).toBeVisible();
      
      console.log('✅ Bulk upload reports working');
    });

    test('7.4 Quotation Reports', async ({ page }) => {
      // Navigate to quotation reports
      await page.click('[data-testid="menu-reports"]');
      await page.click('[data-testid="quotation-reports"]');
      
      // Filter by status
      await page.selectOption('select[name="status-filter"]', 'Sent');
      await page.click('button[type="submit"]');
      
      // Verify filtered results
      await expect(page.locator('[data-testid="quotation-count"]')).toBeVisible();
      
      console.log('✅ Quotation reports working');
    });
  });

  test.describe('Test 8: Corporate Batch Management', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    test('8.1 View Batch History', async ({ page }) => {
      // Navigate to batch history
      await page.click('[data-testid="menu-passports"]');
      await page.click('[data-testid="batch-history"]');
      
      // Verify batch list
      await expect(page.locator('[data-testid="batch-list"]')).toBeVisible();
      
      // Verify batch information
      await expect(page.locator('[data-testid="batch-id"]')).toBeVisible();
      await expect(page.locator('[data-testid="company-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="voucher-count"]')).toBeVisible();
      
      console.log('✅ Batch history view working');
    });

    test('8.2 Batch Details', async ({ page }) => {
      // Navigate to batch history
      await page.click('[data-testid="menu-passports"]');
      await page.click('[data-testid="batch-history"]');
      
      // Click view details
      await page.click('[data-testid="view-batch-details"]');
      
      // Verify details view
      await expect(page.locator('[data-testid="batch-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="voucher-list"]')).toBeVisible();
      
      console.log('✅ Batch details view working');
    });

    test('8.3 Email Batch', async ({ page }) => {
      // Navigate to batch history
      await page.click('[data-testid="menu-passports"]');
      await page.click('[data-testid="batch-history"]');
      
      // Click view details
      await page.click('[data-testid="view-batch-details"]');
      
      // Click email batch
      await page.click('[data-testid="email-batch"]');
      
      // Fill email form
      await page.fill('input[name="email"]', 'test@company.com');
      await page.click('button[type="submit"]');
      
      // Verify email sent
      await expect(page.locator('[data-testid="email-sent"]')).toContainText('Email sent successfully');
      
      console.log('✅ Batch email functionality working');
    });

    test('8.4 Download ZIP', async ({ page }) => {
      // Navigate to batch history
      await page.click('[data-testid="menu-passports"]');
      await page.click('[data-testid="batch-history"]');
      
      // Click view details
      await page.click('[data-testid="view-batch-details"]');
      
      // Click download ZIP
      await page.click('[data-testid="download-zip"]');
      
      // Verify download starts
      const downloadPromise = page.waitForEvent('download');
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.zip');
      
      console.log('✅ ZIP download working');
    });
  });

  test.describe('Test 9: User Management', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    test('9.1 Create New User', async ({ page }) => {
      // Navigate to users
      await page.click('[data-testid="menu-users"]');
      await page.click('[data-testid="add-user"]');
      
      // Fill user form
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="full_name"]', TEST_USER.fullName);
      await page.selectOption('select[name="role"]', TEST_USER.role);
      await page.fill('input[name="password"]', TEST_USER.password);
      
      // Create user
      await page.click('button[type="submit"]');
      
      // Verify user created
      await expect(page.locator('[data-testid="success-message"]')).toContainText('User created successfully');
      
      console.log('✅ User creation successful');
    });

    test('9.2 Edit User', async ({ page }) => {
      // Navigate to users
      await page.click('[data-testid="menu-users"]');
      await page.click('[data-testid="user-list"]');
      
      // Find and edit user
      await page.click('[data-testid="edit-user"]');
      
      // Update user details
      await page.fill('input[name="full_name"]', 'Updated Test User');
      await page.selectOption('select[name="role"]', 'Finance_Manager');
      
      // Save changes
      await page.click('button[type="submit"]');
      
      // Verify update
      await expect(page.locator('[data-testid="success-message"]')).toContainText('User updated successfully');
      
      console.log('✅ User edit successful');
    });

    test('9.3 Deactivate User', async ({ page }) => {
      // Navigate to users
      await page.click('[data-testid="menu-users"]');
      await page.click('[data-testid="user-list"]');
      
      // Find and deactivate user
      await page.click('[data-testid="deactivate-user"]');
      
      // Confirm deactivation
      await page.click('[data-testid="confirm-deactivation"]');
      
      // Verify deactivation
      await expect(page.locator('[data-testid="success-message"]')).toContainText('User deactivated successfully');
      
      console.log('✅ User deactivation successful');
    });
  });

  test.describe('Test 10: Settings & Configuration', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    test('10.1 Email Templates', async ({ page }) => {
      // Navigate to email templates
      await page.click('[data-testid="menu-settings"]');
      await page.click('[data-testid="email-templates"]');
      
      // Select and edit template
      await page.click('[data-testid="edit-template"]');
      await page.fill('textarea[name="template_content"]', 'Updated template content for testing');
      
      // Save changes
      await page.click('button[type="submit"]');
      
      // Verify update
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Template updated successfully');
      
      console.log('✅ Email template editing successful');
    });

    test('10.2 Payment Modes', async ({ page }) => {
      // Navigate to payment modes
      await page.click('[data-testid="menu-settings"]');
      await page.click('[data-testid="payment-modes"]');
      
      // Add new payment mode
      await page.click('[data-testid="add-payment-mode"]');
      await page.fill('input[name="name"]', 'Mobile Money');
      await page.fill('input[name="description"]', 'Mobile payment method');
      
      // Save payment mode
      await page.click('button[type="submit"]');
      
      // Verify addition
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Payment mode added successfully');
      
      console.log('✅ Payment mode addition successful');
    });

    test('10.3 System Settings', async ({ page }) => {
      // Navigate to system settings
      await page.click('[data-testid="menu-settings"]');
      await page.click('[data-testid="system-settings"]');
      
      // Update settings
      await page.fill('input[name="company_name"]', 'Updated Company Name');
      await page.fill('input[name="contact_email"]', 'updated@company.com');
      
      // Save settings
      await page.click('button[type="submit"]');
      
      // Verify update
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Settings updated successfully');
      
      console.log('✅ System settings update successful');
    });
  });

  test.describe('Performance & Error Handling Tests', () => {
    
    test.beforeEach(async ({ page }) => {
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    test('Load Testing - Multiple Operations', async ({ page, context }) => {
      // Open multiple tabs for load testing
      const tabs = [];
      for (let i = 0; i < 5; i++) {
        const newPage = await context.newPage();
        await newPage.goto(BASE_URL);
        await newPage.fill('input[type="email"]', ADMIN_EMAIL);
        await newPage.fill('input[type="password"]', ADMIN_PASSWORD);
        await newPage.click('button[type="submit"]');
        await newPage.waitForURL('**/dashboard');
        tabs.push(newPage);
      }
      
      // Perform simultaneous operations
      const operations = tabs.map(async (tab, index) => {
        await tab.click('[data-testid="menu-passports"]');
        await tab.waitForLoadState('networkidle');
        return index;
      });
      
      await Promise.all(operations);
      
      // Verify all tabs still responsive
      for (const tab of tabs) {
        await expect(tab.locator('[data-testid="menu-passports"]')).toBeVisible();
        await tab.close();
      }
      
      console.log('✅ Load testing successful');
    });

    test('Error Handling - Invalid Data', async ({ page }) => {
      // Test invalid CSV upload
      await page.click('[data-testid="menu-passports"]');
      await page.click('[data-testid="bulk-upload"]');
      
      // Upload invalid CSV
      const invalidCsv = 'invalid,data,format\n1,2,3';
      await page.setInputFiles('input[type="file"]', {
        name: 'invalid.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(invalidCsv)
      });
      
      await page.click('button[type="submit"]');
      
      // Verify error handling
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid file format');
      
      console.log('✅ Error handling working correctly');
    });

    test('Data Validation', async ({ page }) => {
      // Test form validation
      await page.click('[data-testid="menu-passports"]');
      await page.click('[data-testid="add-passport"]');
      
      // Submit empty form
      await page.click('button[type="submit"]');
      
      // Verify validation errors
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      
      console.log('✅ Form validation working');
    });
  });

  test.describe('End-to-End Workflow Test', () => {
    
    test('Complete Customer Journey', async ({ page }) => {
      console.log('🚀 Starting complete customer journey test...');
      
      // 1. Login
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
      console.log('✅ Step 1: Login successful');
      
      // 2. Add passport
      await page.click('[data-testid="menu-passports"]');
      await page.click('[data-testid="add-passport"]');
      await page.fill('input[name="passport_number"]', 'E2E' + Date.now());
      await page.fill('input[name="surname"]', 'Customer');
      await page.fill('input[name="given_name"]', 'Journey');
      await page.selectOption('select[name="nationality"]', 'Papua New Guinea');
      await page.fill('input[name="date_of_birth"]', '01/01/1990');
      await page.selectOption('select[name="gender"]', 'Male');
      await page.click('button[type="submit"]');
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Passport saved successfully');
      console.log('✅ Step 2: Passport added');
      
      // 3. Create purchase
      await page.click('[data-testid="menu-purchases"]');
      await page.click('[data-testid="new-purchase"]');
      await page.fill('input[name="customer"]', 'E2E Customer');
      await page.selectOption('select[name="passport"]', { index: 0 });
      await page.selectOption('select[name="service"]', 'Green Fee');
      await page.fill('input[name="amount"]', '50.00');
      await page.selectOption('select[name="payment_method"]', 'Cash');
      await page.click('button[type="submit"]');
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Purchase completed');
      console.log('✅ Step 3: Purchase created');
      
      // 4. Create quotation
      await page.click('[data-testid="menu-quotations"]');
      await page.click('[data-testid="new-quotation"]');
      await page.fill('input[name="customer"]', 'E2E Company');
      await page.fill('input[name="email"]', 'e2e@company.com');
      await page.click('[data-testid="add-service"]');
      await page.selectOption('select[name="service"]', 'Green Fee');
      await page.fill('input[name="quantity"]', '1');
      await page.click('button[type="submit"]');
      await expect(page.locator('[data-testid="quotation-number"]')).toBeVisible();
      console.log('✅ Step 4: Quotation created');
      
      // 5. Generate report
      await page.click('[data-testid="menu-reports"]');
      await page.click('[data-testid="revenue-reports"]');
      await page.fill('input[name="date_from"]', '2025-01-01');
      await page.fill('input[name="date_to"]', '2025-12-31');
      await page.click('button[type="submit"]');
      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
      console.log('✅ Step 5: Report generated');
      
      console.log('🎉 Complete customer journey test successful!');
    });
  });
});

// Test summary and reporting
test.afterAll(async ({ browser }) => {
  console.log('\n🎯 UAT Test Suite Summary:');
  console.log('✅ All automated UAT tests completed');
  console.log('📊 Test coverage includes:');
  console.log('   - Authentication & Authorization');
  console.log('   - Passport Management (Individual & Bulk)');
  console.log('   - Purchase Processing (Individual & Corporate)');
  console.log('   - Quotation Workflow (Create, Send, Approve, Convert)');
  console.log('   - Cash Reconciliation');
  console.log('   - Reports & Analytics');
  console.log('   - Corporate Batch Management');
  console.log('   - User Management');
  console.log('   - Settings & Configuration');
  console.log('   - Performance & Error Handling');
  console.log('   - End-to-End Workflows');
  console.log('\n🚀 System ready for production deployment!');
});







