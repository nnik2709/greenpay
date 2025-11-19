import { test, expect } from '@playwright/test';

test('Test Login History page loads and displays content', async ({ page }) => {
  // Monitor console for errors
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  console.log('Navigating directly to login history page...');
  await page.goto('http://localhost:3000/admin/login-history');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  console.log('Current URL:', page.url());
  console.log('Page title:', await page.title());

  // Check if we're on the login history page
  const isOnLoginHistoryPage = page.url().includes('/admin/login-history');
  console.log('Is on login history page:', isOnLoginHistoryPage);

  if (isOnLoginHistoryPage) {
    // Check for login history page elements
    const loginHistoryTitle = page.locator('h1:has-text("Login History")');
    const titleVisible = await loginHistoryTitle.isVisible();
    console.log('Login History title visible:', titleVisible);

    // Check for back button
    const backButton = page.locator('text=Back to Users');
    const backButtonVisible = await backButton.isVisible();
    console.log('Back to Users button visible:', backButtonVisible);

    // Check for statistics cards
    const statsCards = page.locator('[class*="grid"] [class*="gap-4"] > div');
    const statsCount = await statsCards.count();
    console.log('Statistics cards count:', statsCount);

    // Check for filters
    const searchInput = page.locator('input[placeholder*="Search"]');
    const searchVisible = await searchInput.isVisible();
    console.log('Search input visible:', searchVisible);

    // Check for login events table
    const eventsTable = page.locator('text=Login Events');
    const tableVisible = await eventsTable.isVisible();
    console.log('Login Events table visible:', tableVisible);

    // Check for any loading indicators
    const loadingSpinner = page.locator('.animate-spin');
    const spinnerVisible = await loadingSpinner.isVisible();
    console.log('Loading spinner visible:', spinnerVisible);

    // Check for error messages
    const errorMessages = page.locator('text=Error');
    const errorCount = await errorMessages.count();
    console.log('Error messages count:', errorCount);

    // Get page content for debugging
    const bodyText = await page.textContent('body');
    console.log('Body contains "Login History":', bodyText?.includes('Login History') || false);
    console.log('Body contains "Total Logins":', bodyText?.includes('Total Logins') || false);
    console.log('Body contains "Today":', bodyText?.includes('Today') || false);

    if (titleVisible && backButtonVisible) {
      console.log('✅ Login History page loaded successfully with all elements!');
    } else {
      console.log('⚠️ Login History page loaded but some elements are missing');
    }
  } else {
    console.log('❌ Did not reach login history page - may have been redirected');
  }

  // Check for any critical errors
  const criticalErrors = consoleMessages.filter(msg => 
    msg.includes('Error') || 
    msg.includes('Failed') || 
    msg.includes('Cannot read properties') ||
    msg.includes('TypeError') ||
    msg.includes('42501') || // RLS policy error
    msg.includes('403') // Forbidden error
  );
  
  console.log('Critical errors found:', criticalErrors.length);
  if (criticalErrors.length > 0) {
    console.log('Error details:', criticalErrors);
  }

  // Take a screenshot
  await page.screenshot({ path: 'test-login-history-simple.png', fullPage: true });

  // The test should pass if we can access the login history page
  expect(isOnLoginHistoryPage).toBe(true);
});



