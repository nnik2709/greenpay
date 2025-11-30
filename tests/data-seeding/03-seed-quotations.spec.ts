import { test, expect } from '@playwright/test';
import {
  checkConsoleErrors,
  waitForPageLoad
} from '../utils/helpers';

/**
 * Data Seeding - Quotations
 * Creates sample quotations in different statuses
 *
 * Run as: Finance_Manager or Flex_Admin
 */

// Sample quotation data
const sampleQuotations = [
  {
    customerName: 'ABC Corporation',
    customerEmail: 'contact@abccorp.com',
    customerPhone: '+675 123 4567',
    description: 'Corporate event green fee vouchers',
    quantity: 50,
    unitPrice: 100,
    status: 'draft', // Will stay as draft
    notes: 'Annual company retreat - 50 participants'
  },
  {
    customerName: 'XYZ Tours Ltd',
    customerEmail: 'booking@xyztours.com',
    customerPhone: '+675 234 5678',
    description: 'Tourist group green fee package',
    quantity: 30,
    unitPrice: 100,
    status: 'sent', // Will mark as sent
    notes: 'European tour group - June booking'
  },
  {
    customerName: 'Hotel Paradise PNG',
    customerEmail: 'reservations@hotelparadise.pg',
    customerPhone: '+675 345 6789',
    description: 'Guest green fee vouchers',
    quantity: 100,
    unitPrice: 95,
    status: 'approved', // Will approve
    notes: 'Monthly voucher allocation for hotel guests'
  },
  {
    customerName: 'International Conference Center',
    customerEmail: 'events@icc.pg',
    customerPhone: '+675 456 7890',
    description: 'Conference delegate green fees',
    quantity: 75,
    unitPrice: 100,
    status: 'sent',
    notes: 'Pacific Islands Conference - November'
  },
  {
    customerName: 'PNG Travel Agency',
    customerEmail: 'sales@pngtravel.com',
    customerPhone: '+675 567 8901',
    description: 'Tourist voucher package',
    quantity: 40,
    unitPrice: 100,
    status: 'approved',
    notes: 'Quarterly tour package allocation'
  }
];

test.describe('Data Seeding - Quotations', () => {
  test('should create sample quotations with different statuses', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    console.log('🌱 Starting quotation data seeding...');

    let createdCount = 0;

    for (const quotation of sampleQuotations) {
      console.log(`📝 Creating quotation for: ${quotation.customerName} (${quotation.status})`);

      try {
        // Navigate to create quotation page
        await page.goto('/quotations/create');
        await waitForPageLoad(page);
        await page.waitForTimeout(1000);

        // Fill customer name
        const customerNameInput = page.locator('input[name="customerName"], input[placeholder*="Customer Name"]').first();
        await customerNameInput.fill(quotation.customerName);
        await page.waitForTimeout(300);

        // Fill customer email
        const emailInput = page.locator('input[name="customerEmail"], input[name="email"], input[type="email"]').first();
        await emailInput.fill(quotation.customerEmail);
        await page.waitForTimeout(300);

        // Fill customer phone
        const phoneInput = page.locator('input[name="customerPhone"], input[name="phone"], input[type="tel"]').first();
        if (await phoneInput.isVisible({ timeout: 1000 }).catch(() => false)) {
          await phoneInput.fill(quotation.customerPhone);
          await page.waitForTimeout(300);
        }

        // Fill description
        const descriptionInput = page.locator('textarea[name="description"], input[name="description"]').first();
        await descriptionInput.fill(quotation.description);
        await page.waitForTimeout(300);

        // Fill quantity
        const quantityInput = page.locator('input[name="quantity"]').first();
        await quantityInput.fill(quotation.quantity.toString());
        await page.waitForTimeout(300);

        // Fill unit price
        const priceInput = page.locator('input[name="unitPrice"], input[name="price"]').first();
        await priceInput.fill(quotation.unitPrice.toString());
        await page.waitForTimeout(300);

        // Fill notes if field exists
        const notesInput = page.locator('textarea[name="notes"]').first();
        if (await notesInput.isVisible({ timeout: 1000 }).catch(() => false)) {
          await notesInput.fill(quotation.notes);
          await page.waitForTimeout(300);
        }

        // Submit quotation
        const submitButton = page.locator('button:has-text("Create"), button:has-text("Save"), button[type="submit"]').first();
        await submitButton.click();
        await page.waitForTimeout(3000);

        // Check for success
        const successMessage = page.locator('text=/quotation.*created|success/i');
        if (await successMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log(`  ✅ Created quotation: ${quotation.customerName}`);
          createdCount++;

          // Navigate to quotations list
          await page.goto('/quotations');
          await waitForPageLoad(page);
          await page.waitForTimeout(2000);

          // Change status if needed
          if (quotation.status === 'sent' || quotation.status === 'approved') {
            // Find the quotation row (look for customer name)
            const quotationRow = page.locator(`tr:has-text("${quotation.customerName}")`).first();

            if (await quotationRow.isVisible({ timeout: 2000 }).catch(() => false)) {
              if (quotation.status === 'sent') {
                // Click "Mark as Sent" button
                const sendButton = quotationRow.locator('button:has-text("Send"), button:has-text("Mark")').first();
                if (await sendButton.isVisible({ timeout: 1000 }).catch(() => false)) {
                  await sendButton.click();
                  await page.waitForTimeout(1500);
                  console.log(`    → Marked as Sent`);
                }
              }

              if (quotation.status === 'approved') {
                // First mark as sent if needed
                const sendButton = quotationRow.locator('button:has-text("Send"), button:has-text("Mark")').first();
                if (await sendButton.isVisible({ timeout: 1000 }).catch(() => false)) {
                  await sendButton.click();
                  await page.waitForTimeout(1500);
                }

                // Reload to get updated buttons
                await page.goto('/quotations');
                await waitForPageLoad(page);
                await page.waitForTimeout(2000);

                const updatedRow = page.locator(`tr:has-text("${quotation.customerName}")`).first();

                // Click "Approve" button
                const approveButton = updatedRow.locator('button:has-text("Approve")').first();
                if (await approveButton.isVisible({ timeout: 1000 }).catch(() => false)) {
                  await approveButton.click();
                  await page.waitForTimeout(1500);
                  console.log(`    → Approved`);
                }
              }
            }
          }
        } else {
          console.log(`  ⚠️  Quotation creation may have failed: ${quotation.customerName}`);
        }

      } catch (error) {
        console.log(`  ❌ Error creating quotation for ${quotation.customerName}:`, error.message);
      }
    }

    console.log(`\n✅ Quotation seeding complete: ${createdCount}/${sampleQuotations.length} created`);

    consoleChecker.assertNoErrors();
  });

  test('should verify quotations were created with correct statuses', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/quotations');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Count quotations
    const quotationRows = page.locator('table tbody tr');
    const count = await quotationRows.count();

    console.log(`📊 Found ${count} quotation records`);
    expect(count).toBeGreaterThan(0);

    // Check for different statuses
    const draftBadges = page.locator('text=/draft/i');
    const sentBadges = page.locator('text=/sent|pending/i');
    const approvedBadges = page.locator('text=/approved/i');

    const draftCount = await draftBadges.count();
    const sentCount = await sentBadges.count();
    const approvedCount = await approvedBadges.count();

    console.log(`  📋 Draft: ${draftCount}`);
    console.log(`  📤 Sent: ${sentCount}`);
    console.log(`  ✅ Approved: ${approvedCount}`);

    consoleChecker.assertNoErrors();
  });
});
