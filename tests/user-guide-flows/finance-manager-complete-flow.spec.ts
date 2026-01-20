import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Finance Manager Complete User Flow Tests
 * Based on: docs/user-guides/FINANCE_MANAGER_USER_GUIDE.md
 *
 * Tests all workflows described in the Finance Manager user guide with screenshots at each step.
 */

const SCREENSHOT_DIR = 'test-screenshots/user-guide-flows/finance-manager';

// Sample test data
const SAMPLE_CUSTOMER = {
  companyName: 'ABC Corporation Ltd',
  contactPerson: 'Jane Smith',
  email: 'jane.smith@abccorp.com',
  phone: '+675 325 7890',
  address: 'Level 3, Downtown Building, Port Moresby',
  taxId: 'TIN-12345678'
};

const SAMPLE_QUOTATION = {
  title: 'Green Fees for 50 Employees',
  description: 'Green Fee Exit Pass',
  quantity: 50,
  unitPrice: 50.00,
  discount: 5, // 5% bulk discount
  notes: 'Payment terms: NET 30 days. Quotation valid for 30 days from issue date.'
};

test.describe('Finance Manager User Guide Flows', () => {

  test.beforeEach(async ({ page }) => {
    // Login as Finance Manager
    await page.goto('/login');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-login-page.png'), fullPage: true });

    await page.fill('input[type="email"]', 'finance@greenpay.com');
    await page.fill('input[type="password"]', 'test123');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-login-filled.png'), fullPage: true });

    await page.click('button[type="submit"]');
    await page.waitForURL('/app/dashboard');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-dashboard.png'), fullPage: true });
  });

  test('Workflow A: Corporate Quotation to Vouchers - Full Process', async ({ page }) => {
    test.setTimeout(600000); // 10 minutes for complete workflow

    // STEP 1: Create Quotation
    await test.step('Navigate to Create Quotation', async () => {
      await page.click('text=Quotations');
      await page.waitForTimeout(500);
      await page.click('a[href="/app/quotations"]');
      await page.waitForURL('/app/quotations');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-01-quotations-list.png'), fullPage: true });

      await page.click('button:has-text("Create Quotation")');
      await page.waitForURL('/app/quotations/create');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-02-create-quotation-page.png'), fullPage: true });
    });

    await test.step('Enter customer information', async () => {
      // Try to select existing customer or create new
      const customerSelect = page.locator('select[name="customer"]');
      if (await customerSelect.isVisible()) {
        // Check if we can add new customer
        const addCustomerButton = page.locator('button:has-text("Add Customer")');
        if (await addCustomerButton.isVisible()) {
          await addCustomerButton.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-03-add-customer-dialog.png'), fullPage: true });

          await page.fill('input[name="companyName"]', SAMPLE_CUSTOMER.companyName);
          await page.fill('input[name="contactPerson"]', SAMPLE_CUSTOMER.contactPerson);
          await page.fill('input[name="email"]', SAMPLE_CUSTOMER.email);
          await page.fill('input[name="phone"]', SAMPLE_CUSTOMER.phone);
          await page.fill('textarea[name="address"]', SAMPLE_CUSTOMER.address);
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-04-customer-details-filled.png'), fullPage: true });

          await page.click('button:has-text("Save Customer")');
          await page.waitForTimeout(1000);
        }
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-05-customer-selected.png'), fullPage: true });
    });

    await test.step('Enter quotation details', async () => {
      await page.fill('input[name="title"]', SAMPLE_QUOTATION.title);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-06-quotation-title.png'), fullPage: true });

      // Set valid until date (30 days from now)
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);
      const validUntilStr = validUntil.toISOString().split('T')[0];
      await page.fill('input[name="validUntil"]', validUntilStr);

      await page.fill('textarea[name="notes"]', SAMPLE_QUOTATION.notes);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-07-quotation-details-filled.png'), fullPage: true });
    });

    await test.step('Add line items', async () => {
      await page.click('button:has-text("Add Line Item")');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-08-add-line-item-clicked.png'), fullPage: true });

      await page.fill('input[name="description"]', SAMPLE_QUOTATION.description);
      await page.fill('input[name="quantity"]', SAMPLE_QUOTATION.quantity.toString());
      await page.fill('input[name="unitPrice"]', SAMPLE_QUOTATION.unitPrice.toString());
      await page.fill('input[name="discount"]', SAMPLE_QUOTATION.discount.toString());
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-09-line-item-filled.png'), fullPage: true });

      // Scroll to see totals
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-10-quotation-totals.png'), fullPage: true });
    });

    await test.step('Save and send quotation', async () => {
      await page.click('button:has-text("Save and Email")');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-11-quotation-sent.png'), fullPage: true });
    });

    // STEP 2: Convert to Invoice (simulating customer acceptance)
    await test.step('Convert quotation to invoice', async () => {
      // Navigate back to quotations list
      await page.click('a[href="/app/quotations"]');
      await page.waitForURL('/app/quotations');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-12-quotations-list-with-new.png'), fullPage: true });

      // Find the quotation we just created
      const quotationRow = page.locator(`text=${SAMPLE_QUOTATION.title}`).first();
      if (await quotationRow.isVisible()) {
        await quotationRow.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-13-quotation-details-view.png'), fullPage: true });

        // Convert to invoice
        const convertButton = page.locator('button:has-text("Convert to Invoice")');
        if (await convertButton.isVisible()) {
          await convertButton.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-14-convert-confirmation.png'), fullPage: true });

          await page.click('button:has-text("Confirm")');
          await page.waitForTimeout(2000);
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-15-invoice-generated.png'), fullPage: true });
        }
      }
    });

    // STEP 3: Record Payment
    await test.step('Record payment received', async () => {
      // Navigate to invoices
      await page.click('text=Tax Invoices');
      await page.waitForURL('/app/invoices');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-16-invoices-list.png'), fullPage: true });

      // Find our invoice
      const invoiceRow = page.locator(`text=${SAMPLE_CUSTOMER.companyName}`).first();
      if (await invoiceRow.isVisible()) {
        await invoiceRow.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-17-invoice-details.png'), fullPage: true });

        // Record payment
        const recordPaymentButton = page.locator('button:has-text("Record Payment")');
        if (await recordPaymentButton.isVisible()) {
          await recordPaymentButton.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-18-record-payment-dialog.png'), fullPage: true });

          // Enter payment details
          const totalAmount = SAMPLE_QUOTATION.quantity * SAMPLE_QUOTATION.unitPrice * (1 - SAMPLE_QUOTATION.discount / 100);
          await page.fill('input[name="amount"]', totalAmount.toFixed(2));
          await page.selectOption('select[name="paymentMethod"]', 'Bank Transfer');
          await page.fill('input[name="referenceNumber"]', 'TXN-20260111-001');
          await page.fill('textarea[name="notes"]', 'Payment received via bank transfer');
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-19-payment-details-filled.png'), fullPage: true });

          await page.click('button:has-text("Save Payment")');
          await page.waitForTimeout(2000);
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-20-payment-recorded.png'), fullPage: true });
        }
      }
    });

    // STEP 4: Generate Corporate Vouchers
    await test.step('Generate corporate voucher batch', async () => {
      await page.click('text=Corporate Exit Pass');
      await page.waitForURL('/app/payments/corporate-exit-pass');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-21-corporate-exit-pass-page.png'), fullPage: true });

      // Select customer
      await page.selectOption('select[name="customer"]', { label: SAMPLE_CUSTOMER.companyName });
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-22-customer-selected.png'), fullPage: true });

      // Enter quantity
      await page.fill('input[name="quantity"]', SAMPLE_QUOTATION.quantity.toString());
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-23-quantity-entered.png'), fullPage: true });

      // Generate vouchers
      await page.click('button:has-text("Generate Vouchers")');
      await page.waitForTimeout(3000); // Wait for batch generation
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-24-vouchers-generated.png'), fullPage: true });

      // Download options
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-a-25-download-options.png'), fullPage: true });
    });
  });

  test('Workflow B: Monthly Financial Reporting', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes

    // STEP 1: Revenue Report
    await test.step('Generate Revenue Generated Report', async () => {
      await page.click('text=Reports');
      await page.waitForTimeout(500);
      await page.click('a[href="/app/reports/revenue-generated"]');
      await page.waitForURL('/app/reports/revenue-generated');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-b-01-revenue-report-page.png'), fullPage: true });

      // Set date range for last month
      const lastMonthStart = new Date();
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      lastMonthStart.setDate(1);
      const lastMonthEnd = new Date(lastMonthStart);
      lastMonthEnd.setMonth(lastMonthEnd.getMonth() + 1);
      lastMonthEnd.setDate(0);

      const startDateInput = page.locator('input[name="startDate"]');
      const endDateInput = page.locator('input[name="endDate"]');

      if (await startDateInput.isVisible()) {
        await startDateInput.fill(lastMonthStart.toISOString().split('T')[0]);
        await endDateInput.fill(lastMonthEnd.toISOString().split('T')[0]);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-b-02-date-range-set.png'), fullPage: true });

        await page.click('button:has-text("Generate Report")');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-b-03-revenue-report-generated.png'), fullPage: true });
      }

      // Scroll to see charts
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-b-04-revenue-charts.png'), fullPage: true });

      // Export report
      const exportButton = page.locator('button:has-text("Export")');
      if (await exportButton.isVisible()) {
        await exportButton.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-b-05-export-options.png'), fullPage: true });
      }
    });

    // STEP 2: Corporate Voucher Report
    await test.step('Generate Corporate Voucher Report', async () => {
      await page.click('a[href="/app/reports/corporate-vouchers"]');
      await page.waitForURL('/app/reports/corporate-vouchers');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-b-06-corporate-vouchers-report.png'), fullPage: true });

      // Apply filters
      const statusFilter = page.locator('select[name="status"]');
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption('all');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-b-07-filters-applied.png'), fullPage: true });
      }

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-b-08-corporate-report-details.png'), fullPage: true });
    });

    // STEP 3: Individual Purchase Report
    await test.step('Generate Individual Purchase Report', async () => {
      await page.click('a[href="/app/reports/individual-purchase"]');
      await page.waitForURL('/app/reports/individual-purchase');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-b-09-individual-purchase-report.png'), fullPage: true });

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-b-10-individual-report-charts.png'), fullPage: true });
    });
  });

  test('Workflow C: Review and Approve Cash Reconciliations', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes

    // STEP 1: Access Cash Reconciliation Reports
    await test.step('Navigate to Cash Reconciliation', async () => {
      await page.click('text=Reports');
      await page.waitForTimeout(500);
      await page.click('a[href="/app/reports/cash-reconciliation"]');
      await page.waitForURL('/app/reports/cash-reconciliation');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-c-01-cash-reconciliation-page.png'), fullPage: true });
    });

    // STEP 2: Filter pending reconciliations
    await test.step('View pending reconciliations', async () => {
      const statusFilter = page.locator('select[name="status"]');
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption('pending');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-c-02-pending-reconciliations.png'), fullPage: true });
      }
    });

    // STEP 3: Review reconciliation details
    await test.step('Review reconciliation details', async () => {
      const firstReconciliation = page.locator('table tbody tr').first();
      if (await firstReconciliation.isVisible()) {
        await firstReconciliation.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-c-03-reconciliation-details.png'), fullPage: true });

        // Scroll to see denomination breakdown
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-c-04-denomination-breakdown.png'), fullPage: true });
      }
    });

    // STEP 4: Approve or reject
    await test.step('Approve reconciliation', async () => {
      const approveButton = page.locator('button:has-text("Approve")');
      if (await approveButton.isVisible()) {
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-c-05-approval-buttons.png'), fullPage: true });

        await approveButton.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-c-06-approval-confirmation.png'), fullPage: true });

        // Add manager notes
        const notesField = page.locator('textarea[name="managerNotes"]');
        if (await notesField.isVisible()) {
          await notesField.fill('Approved. Variance within acceptable range.');
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-c-07-manager-notes.png'), fullPage: true });

          await page.click('button:has-text("Confirm Approval")');
          await page.waitForTimeout(2000);
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'workflow-c-08-reconciliation-approved.png'), fullPage: true });
        }
      }
    });
  });

  test('Navigation: View Payments', async ({ page }) => {
    await test.step('View all payments', async () => {
      await page.click('a[href="/app/payments"]');
      await page.waitForURL('/app/payments');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'nav-01-payments-page.png'), fullPage: true });

      // Apply filters
      const paymentMethodFilter = page.locator('select[name="paymentMethod"]');
      if (await paymentMethodFilter.isVisible()) {
        await paymentMethodFilter.selectOption('Cash');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'nav-02-payments-filtered.png'), fullPage: true });
      }

      // View transaction details
      const firstTransaction = page.locator('table tbody tr').first();
      if (await firstTransaction.isVisible()) {
        await firstTransaction.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'nav-03-transaction-details.png'), fullPage: true });
      }
    });
  });

  test('Navigation: Customer Management', async ({ page }) => {
    await test.step('View and manage customers', async () => {
      await page.click('text=Admin');
      await page.waitForTimeout(500);
      await page.click('a[href="/app/admin/customers"]');
      await page.waitForURL('/app/admin/customers');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'nav-04-customers-page.png'), fullPage: true });

      // View customer details
      const firstCustomer = page.locator('table tbody tr').first();
      if (await firstCustomer.isVisible()) {
        await firstCustomer.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'nav-05-customer-details.png'), fullPage: true });

        // View customer history
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'nav-06-customer-history.png'), fullPage: true });
      }
    });
  });

  test('Navigation: Vouchers List', async ({ page }) => {
    await test.step('View vouchers list with filters', async () => {
      await page.click('a[href="/app/vouchers-list"]');
      await page.waitForURL('/app/vouchers-list');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'nav-07-vouchers-list.png'), fullPage: true });

      // Filter by type
      const typeFilter = page.locator('select[name="type"]');
      if (await typeFilter.isVisible()) {
        await typeFilter.selectOption('corporate');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'nav-08-corporate-vouchers-filtered.png'), fullPage: true });
      }

      // View voucher details
      const firstVoucher = page.locator('table tbody tr').first();
      if (await firstVoucher.isVisible()) {
        await firstVoucher.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'nav-09-voucher-details.png'), fullPage: true });
      }
    });
  });
});
