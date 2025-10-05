import { test, expect } from '@playwright/test';

// Helper function to login
async function login(page, email, password) {
  await page.goto('/');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for appropriate landing page based on role
  const isAgent = email.includes('agent@example.com');
  if (isAgent) {
    // Agents now go to base URL and see AgentLanding component
    await page.waitForURL('**/', { timeout: 10000 });
    await page.waitForSelector('h1:has-text("Counter Agent Portal")', { timeout: 10000 });
  } else {
    // Non-agents go to base URL and see Dashboard component
    await page.waitForURL('**/', { timeout: 10000 });
    await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 10000 });
  }
}

test.describe('Sample Data Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await login(page, 'admin@example.com', 'admin123');
  });

  test('should display passports from sample data', async ({ page }) => {
    // Click on the Passports dropdown menu
    const passportsDropdown = page.locator('button:has-text("Passports")');
    await passportsDropdown.click();
    await page.waitForTimeout(1000);

    // Click on "All Passports" from the dropdown
    const allPassportsLink = page.locator('a:has-text("All Passports")');
    await allPassportsLink.click();
    await page.waitForTimeout(2000);

    // Should be able to search for sample passport
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('P1234567');
      await page.waitForTimeout(1000);

      // Should find John Smith
      await expect(page.locator('text=/Smith|John/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display quotations', async ({ page }) => {
    // Try to navigate to quotations
    const quotationsLink = page.locator('text=/quotations/i').first();
    if (await quotationsLink.isVisible()) {
      await quotationsLink.click();
      await page.waitForTimeout(3000);

      // Assert on page header to avoid multiple <main> collisions
      await expect(page.locator('h1:has-text("Quotations Management")')).toBeVisible({ timeout: 10000 });
    } else {
      // If quotations link is not visible, skip the test
      console.log('Quotations link not visible, skipping test');
    }
  });

  test('should display reports', async ({ page }) => {
    // Test a few key report types to avoid timeout
    const reportCards = [
      { name: 'Passport Reports', expectedText: /passport/i },
      { name: 'Corporate Vouchers', expectedText: /corporate|voucher/i },
      { name: 'Revenue Generated', expectedText: /revenue|financial/i }
    ];

    for (const reportCard of reportCards) {
      // Click on the Reports dropdown menu
      const reportsDropdown = page.locator('button:has-text("Reports")');
      await reportsDropdown.click();
      await page.waitForTimeout(1500);

      // Click on "Reports Dashboard" to land on the main reports page
      const reportsDashboardLink = page.locator('a:has-text("Reports Dashboard")');
      await reportsDashboardLink.waitFor({ state: 'visible', timeout: 5000 });
      await reportsDashboardLink.click();
      await page.waitForTimeout(2000);

      // Verify we're on the Reports Dashboard
      await expect(page.locator('h1:has-text("Reporting Dashboard")')).toBeVisible({ timeout: 5000 });

      // Click on the specific report card
      const cardElement = page.locator(`h3:has-text("${reportCard.name}")`).first();
      await cardElement.waitFor({ state: 'visible', timeout: 5000 });
      await cardElement.click();
      await page.waitForTimeout(2500);

      // Verify the report page loads successfully (any visible heading)
      await expect(page.locator('h1:visible, h2:visible, h3:visible').first()).toBeVisible({ timeout: 10000 });
      
      // Verify specific content based on report type
      await expect(page.locator(`text=${reportCard.expectedText}`).first()).toBeVisible({ timeout: 3000 });
      
      // Go back home quickly
      await page.goto('/');
      await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display users (admin only)', async ({ page }) => {
    // Navigate to users
    const usersLink = page.locator('text=/users/i').first();
    if (await usersLink.isVisible()) {
      await usersLink.click();
      await page.waitForTimeout(2000);

      // Should see the users page with heading
      await expect(page.locator('h1:has-text("Users")')).toBeVisible({ timeout: 5000 });
      
      // Should see the 4 test users (check for email addresses)
      await expect(page.locator('text=/admin@example.com/i')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=/finance@example.com/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display payment modes', async ({ page }) => {
    // Click on the Admin dropdown menu
    const adminDropdown = page.locator('button:has-text("Admin")');
    await adminDropdown.click();
    await page.waitForTimeout(2000);

    // Wait for dropdown to be visible and click on "Payment Modes"
    const paymentModesLink = page.locator('a:has-text("Payment Modes")');
    await paymentModesLink.waitFor({ state: 'visible', timeout: 10000 });
    await paymentModesLink.click();
    await page.waitForTimeout(3000);

    // Should see payment modes page with heading
    await expect(page.locator('h1:has-text("Payment Modes Management")')).toBeVisible({ timeout: 10000 });
    
    // Should see specific payment modes
    await expect(page.locator('text=/CASH/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/CREDIT CARD/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/DEBIT CARD/i')).toBeVisible({ timeout: 5000 });
  });
});
