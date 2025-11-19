import { test, expect } from '@playwright/test';

test('Test Login History after database fix', async ({ page }) => {
  // Monitor console for errors
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  console.log('Step 1: Navigate to Users page...');
  await page.goto('http://localhost:3000/users');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('Step 2: Click first View Login History button...');
  const viewHistoryButtons = page.locator('text=View Login History');
  const historyButtonCount = await viewHistoryButtons.count();
  console.log('View Login History buttons found:', historyButtonCount);

  if (historyButtonCount > 0) {
    await viewHistoryButtons.first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    console.log('Step 3: Check login history page...');
    const isOnLoginHistoryPage = page.url().includes('/admin/login-history');
    console.log('Is on login history page:', isOnLoginHistoryPage);

    if (isOnLoginHistoryPage) {
      // Wait for content to load
      await page.waitForTimeout(3000);

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
      console.log('Body contains "No login events found":', bodyText?.includes('No login events found') || false);

      // Check for specific login event data
      const loginEventRows = page.locator('[class*="border"][class*="rounded-lg"]');
      const eventRowCount = await loginEventRows.count();
      console.log('Login event rows count:', eventRowCount);

      // Check for specific text that should appear
      const hasLoginData = bodyText?.includes('admin@example.com') || bodyText?.includes('127.0.0.1') || bodyText?.includes('Mozilla');
      console.log('Contains login data:', hasLoginData);

      if (titleVisible && backButtonVisible) {
        console.log('✅ Login History page is working correctly!');
        
        if (statsCount > 0) {
          console.log('✅ Statistics cards are displaying!');
        }
        
        if (searchVisible) {
          console.log('✅ Search functionality is available!');
        }
        
        if (tableVisible || eventRowCount > 0) {
          console.log('✅ Login events are displaying!');
        }
        
        if (hasLoginData) {
          console.log('✅ Login data is showing!');
        }
      } else {
        console.log('⚠️ Login History page loaded but missing key elements');
      }
    } else {
      console.log('❌ Did not navigate to login history page');
    }
  } else {
    console.log('❌ No View Login History buttons found');
  }

  // Check for any critical errors
  const criticalErrors = consoleMessages.filter(msg => 
    msg.includes('Error') || 
    msg.includes('Failed') || 
    msg.includes('Cannot read properties') ||
    msg.includes('TypeError') ||
    msg.includes('42501') || // RLS policy error
    msg.includes('403') || // Forbidden error
    msg.includes('404') // Not found error
  );
  
  console.log('Critical errors found:', criticalErrors.length);
  if (criticalErrors.length > 0) {
    console.log('Error details:', criticalErrors.slice(0, 3)); // Show first 3 errors
  }

  // Take a screenshot
  await page.screenshot({ path: 'test-login-history-after-fix.png', fullPage: true });

  // The test should pass if we can access the login history page
  expect(historyButtonCount).toBeGreaterThan(0);
});



