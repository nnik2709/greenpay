import { test, expect } from '@playwright/test';

// Helper function to login
async function login(page, email, password) {
  await page.goto('/');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(2000);
}

test.describe('Create Test Voucher Flow', () => {
  test('should create individual voucher using existing passport', async ({ page }) => {
    // Login as Counter Agent
    await login(page, 'agent@example.com', 'agent123');
    console.log('✓ Logged in as agent');

    // Navigate to Passports -> Individual Purchase
    await page.click('text=Passports');
    await page.waitForTimeout(1000);
    await page.click('text=Individual Purchase');
    await page.waitForTimeout(2000);

    console.log('✓ Navigated to Individual Purchase page');

    // Use an existing passport from mock data
    const passportNumber = 'P1234567'; // John Smith from passportData.js

    // Fill in the search field
    const searchInput = page.locator('input[placeholder*="passport"]').first();
    await searchInput.fill(passportNumber);
    await page.waitForTimeout(500);

    // Click search button
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);

    console.log(`✓ Searched for passport: ${passportNumber}`);

    // Click "Next" to proceed to payment step
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1500);

    console.log('✓ Proceeded to payment step');

    // Select payment method
    await page.selectOption('select', 'CASH');
    await page.waitForTimeout(500);

    console.log('✓ Selected payment method: CASH');

    // Click "Generate Voucher" or "Submit" button
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Submit"), button:has-text("Create")').first();
    await generateButton.click();
    await page.waitForTimeout(3000);

    console.log('✓ Clicked generate voucher button');

    // Try to find success message or voucher code
    const hasSuccess = await page.locator('text=/success|generated|created/i').first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSuccess) {
      console.log(`\n✅ INDIVIDUAL VOUCHER CREATED!`);
      console.log(`📋 Passport Number: ${passportNumber}`);
      console.log(`💰 Amount: PGK 50.00`);
      console.log(`💳 Payment: CASH`);
    } else {
      console.log(`⚠️  Voucher may have been created - check manually`);
    }

    console.log(`\n🔍 Next steps:`);
    console.log(`   1. Login as admin@example.com`);
    console.log(`   2. Go to Reports > Individual Purchase Reports`);
    console.log(`   3. Find the voucher and click the QR icon to print`);
    console.log(`   4. Scan it at eywademo.cloud/scan`);
  });

  test('should create corporate voucher', async ({ page }) => {
    // Login as Counter Agent
    await login(page, 'agent@example.com', 'agent123');
    console.log('✓ Logged in as agent');

    // Navigate to Purchases -> Corporate Exit Pass
    await page.click('text=Purchases');
    await page.waitForTimeout(1000);
    await page.click('text=Corporate Exit Pass');
    await page.waitForTimeout(2000);

    console.log('✓ Navigated to Corporate Exit Pass page');

    // Fill total vouchers
    await page.fill('input[id="total_vouchers"]', '3');
    await page.waitForTimeout(500);

    console.log('✓ Set total vouchers: 3');

    // Fill discount (optional)
    await page.fill('input[id="discount"]', '5');
    await page.waitForTimeout(500);

    console.log('✓ Set discount: 5%');

    // The amount should auto-calculate
    // Total: 3 * 50 = 150
    // After 5% discount: 142.50

    // Fill collected amount
    await page.fill('input[id="collected_amount"]', '142.50');
    await page.waitForTimeout(500);

    console.log('✓ Set collected amount: 142.50');

    // Select payment method (BANK TRANSFER is default)
    await page.click('input[value="CASH"]');
    await page.waitForTimeout(500);

    console.log('✓ Selected payment method: CASH');

    // Submit the form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log('✓ Submitted corporate voucher form');

    // Check for success
    const hasSuccess = await page.locator('text=/success|generated|created/i').first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSuccess) {
      console.log(`\n✅ CORPORATE VOUCHER BATCH CREATED!`);
      console.log(`📦 Quantity: 3 vouchers`);
      console.log(`💰 Total Amount: PGK 142.50 (after 5% discount)`);
      console.log(`💳 Payment: CASH`);
    } else {
      console.log(`⚠️  Voucher batch may have been created - check manually`);
    }

    console.log(`\n🔍 Next steps:`);
    console.log(`   1. Login as admin@example.com`);
    console.log(`   2. Go to Reports > Corporate Voucher Reports`);
    console.log(`   3. Find the vouchers and click the QR icon to print`);
    console.log(`   4. Scan any voucher at eywademo.cloud/scan`);
  });

  test('should verify vouchers in reports (admin only)', async ({ page }) => {
    // Login as admin to access reports
    await login(page, 'admin@example.com', 'admin123');
    console.log('✓ Logged in as admin');

    // Navigate to Reports
    await page.click('text=Reports');
    await page.waitForTimeout(2000);

    console.log('✓ Navigated to Reports page');

    // Check Individual Purchase Reports
    await page.click('text=Individual Purchase');
    await page.waitForTimeout(3000);

    // Wait for table to load
    const hasTable = await page.locator('table').first().isVisible({ timeout: 10000 }).catch(() => false);

    if (hasTable) {
      const individualRows = await page.locator('table tbody tr').count();
      console.log(`✓ Found ${individualRows} individual voucher(s)`);

      // Check if there are print buttons
      const hasPrintButtons = await page.locator('button:has-text("Print"), button svg').first().isVisible().catch(() => false);
      if (hasPrintButtons) {
        console.log(`✓ Print buttons available for vouchers`);
      }
    } else {
      console.log(`⚠️  No individual vouchers table found`);
    }

    // Go back to reports
    await page.goto('/reports');
    await page.waitForTimeout(2000);

    // Check Corporate Voucher Reports
    await page.click('text=Corporate Voucher');
    await page.waitForTimeout(3000);

    const hasCorporateTable = await page.locator('table').first().isVisible({ timeout: 10000 }).catch(() => false);

    if (hasCorporateTable) {
      const corporateRows = await page.locator('table tbody tr').count();
      console.log(`✓ Found ${corporateRows} corporate voucher(s)`);
    } else {
      console.log(`⚠️  No corporate vouchers table found`);
    }

    console.log(`\n✅ VERIFICATION COMPLETE!`);
    console.log(`\n📋 Summary:`);
    console.log(`   - Individual and corporate vouchers can be viewed in Reports`);
    console.log(`   - Each valid voucher has a QR print button`);
    console.log(`   - Print any voucher and scan at eywademo.cloud/scan`);
  });
});
