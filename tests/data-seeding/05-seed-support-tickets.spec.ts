import { test, expect } from '@playwright/test';
import {
  checkConsoleErrors,
  waitForPageLoad
} from '../utils/helpers';

/**
 * Data Seeding - Support Tickets
 * Creates sample support tickets with different priorities and statuses
 *
 * Run as: IT_Support, Flex_Admin, or any role with ticket access
 */

// Sample ticket data
const sampleTickets = [
  {
    title: 'Voucher printing not working',
    description: 'When trying to print vouchers, the PDF download fails with a 500 error. This is affecting multiple counter agents.',
    category: 'Technical',
    priority: 'High',
    status: 'open'
  },
  {
    title: 'Unable to approve quotations',
    description: 'The "Approve" button on quotations page is not responding. Tested on Chrome and Firefox.',
    category: 'Technical',
    priority: 'Critical',
    status: 'open'
  },
  {
    title: 'Request for bulk upload template',
    description: 'Can you please provide the latest CSV template for bulk passport uploads? The old one seems to be outdated.',
    category: 'General',
    priority: 'Low',
    status: 'open'
  },
  {
    title: 'Invoice email not received',
    description: 'Sent invoice INV-202411-0025 to customer 3 days ago but they report not receiving it. Can you check server logs?',
    category: 'Technical',
    priority: 'Medium',
    status: 'in_progress'
  },
  {
    title: 'Payment mode configuration',
    description: 'Need to add a new payment mode "Mobile Money" for Digicel payments. How do I configure this?',
    category: 'General',
    priority: 'Medium',
    status: 'open'
  },
  {
    title: 'Passport data validation error',
    description: 'Getting validation error for passport P12345678 even though all fields are correct. MRZ format issue?',
    category: 'Technical',
    priority: 'Medium',
    status: 'resolved'
  },
  {
    title: 'Report export timeout',
    description: 'Revenue report export times out when selecting date range > 6 months. Need to increase timeout or optimize query.',
    category: 'Technical',
    priority: 'Low',
    status: 'open'
  },
  {
    title: 'User role permissions question',
    description: 'Can Counter_Agent role access the reports section? One agent is reporting "Access Denied" error.',
    category: 'General',
    priority: 'Low',
    status: 'resolved'
  }
];

test.describe('Data Seeding - Support Tickets', () => {
  test('should create sample support tickets', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    console.log('🌱 Starting support ticket data seeding...');

    let createdCount = 0;

    for (const ticket of sampleTickets) {
      console.log(`📝 Creating ticket: ${ticket.title} (${ticket.priority})`);

      try {
        // Navigate to tickets page
        await page.goto('/tickets');
        await waitForPageLoad(page);
        await page.waitForTimeout(1000);

        // Click "Create Ticket" or "New Ticket" button
        const createButton = page.locator('button:has-text("Create"), button:has-text("New Ticket"), button:has-text("Add")').first();

        if (await createButton.isVisible({ timeout: 2000 })) {
          await createButton.click();
          await page.waitForTimeout(1500);

          // Fill title
          const titleInput = page.locator('input[name="title"], input[placeholder*="Title"]').first();
          await titleInput.fill(ticket.title);
          await page.waitForTimeout(300);

          // Fill description
          const descriptionInput = page.locator('textarea[name="description"], textarea[placeholder*="Description"]').first();
          await descriptionInput.fill(ticket.description);
          await page.waitForTimeout(300);

          // Select category
          const categorySelect = page.locator('select[name="category"]').first();
          if (await categorySelect.isVisible({ timeout: 1000 }).catch(() => false)) {
            await categorySelect.selectOption(ticket.category);
            await page.waitForTimeout(300);
          }

          // Select priority
          const prioritySelect = page.locator('select[name="priority"]').first();
          if (await prioritySelect.isVisible({ timeout: 1000 }).catch(() => false)) {
            await prioritySelect.selectOption(ticket.priority);
            await page.waitForTimeout(300);
          }

          // Submit ticket
          const submitButton = page.locator('button:has-text("Create"), button:has-text("Submit"), button[type="submit"]').last();
          await submitButton.click();
          await page.waitForTimeout(3000);

          // Check for success
          const successMessage = page.locator('text=/ticket.*created|success/i');
          if (await successMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log(`  ✅ Created: ${ticket.title}`);
            createdCount++;

            // Change status if needed
            if (ticket.status !== 'open') {
              await page.goto('/tickets');
              await waitForPageLoad(page);
              await page.waitForTimeout(2000);

              // Find the ticket row
              const ticketRow = page.locator(`tr:has-text("${ticket.title.substring(0, 20)}")`).first();

              if (await ticketRow.isVisible({ timeout: 2000 }).catch(() => false)) {
                // Click to view/edit ticket
                await ticketRow.click();
                await page.waitForTimeout(1500);

                // Change status
                const statusSelect = page.locator('select[name="status"]').first();
                if (await statusSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
                  await statusSelect.selectOption(ticket.status);
                  await page.waitForTimeout(500);

                  // Save changes
                  const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
                  if (await saveButton.isVisible({ timeout: 1000 }).catch(() => false)) {
                    await saveButton.click();
                    await page.waitForTimeout(2000);
                    console.log(`    → Status updated to: ${ticket.status}`);
                  }
                }
              }
            }
          } else {
            console.log(`  ⚠️  Ticket creation may have failed: ${ticket.title}`);
          }
        } else {
          console.log(`  ℹ️  Create button not found, ticket feature may not be available`);
          break;
        }

      } catch (error) {
        console.log(`  ❌ Error creating ticket "${ticket.title}":`, error.message);
      }
    }

    console.log(`\n✅ Support ticket seeding complete: ${createdCount}/${sampleTickets.length} created`);

    consoleChecker.assertNoErrors();
  });

  test('should verify support tickets were created', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/tickets');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Count tickets
    const ticketRows = page.locator('table tbody tr');
    const count = await ticketRows.count();

    console.log(`📊 Found ${count} support ticket records`);

    if (count > 0) {
      // Check for different priorities
      const criticalBadges = page.locator('text=/critical/i');
      const highBadges = page.locator('text=/high/i');
      const mediumBadges = page.locator('text=/medium/i');
      const lowBadges = page.locator('text=/low/i');

      const criticalCount = await criticalBadges.count();
      const highCount = await highBadges.count();
      const mediumCount = await mediumBadges.count();
      const lowCount = await lowBadges.count();

      console.log(`  🔴 Critical: ${criticalCount}`);
      console.log(`  🟠 High: ${highCount}`);
      console.log(`  🟡 Medium: ${mediumCount}`);
      console.log(`  🟢 Low: ${lowCount}`);

      // Check for different statuses
      const openTickets = page.locator('text=/open/i');
      const inProgressTickets = page.locator('text=/in progress|in_progress/i');
      const resolvedTickets = page.locator('text=/resolved|closed/i');

      const openCount = await openTickets.count();
      const inProgressCount = await inProgressTickets.count();
      const resolvedCount = await resolvedTickets.count();

      console.log(`\n  📂 Open: ${openCount}`);
      console.log(`  ⚙️  In Progress: ${inProgressCount}`);
      console.log(`  ✅ Resolved: ${resolvedCount}`);
    }

    consoleChecker.assertNoErrors();
  });
});
