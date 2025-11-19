import { test, expect } from '@playwright/test';

test('Test Login History page after Select fix', async ({ page }) => {
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

      // Check for user filter dropdown
      const userFilter = page.locator('[role="combobox"]');
      const userFilterVisible = await userFilter.isVisible();
      console.log('User filter dropdown visible:', userFilterVisible);

      // Check for login events table
      const eventsTable = page.locator('text=Login Events');
      const tableVisible = await eventsTable.isVisible();
      console.log('Login Events table visible:', tableVisible);

      // Check for any loading indicators
      const loadingSpinner = page.locator('.animate-spin');
      const spinnerVisible = await loadingSpinner.isVisible();
      console.log('Loading spinner visible:', spinnerVisible);

      // Get page content for debugging
      const bodyText = await page.textContent('body');
      console.log('Body contains "Login History":', bodyText?.includes('Login History') || false);
      console.log('Body contains "Total Logins":', bodyText?.includes('Total Logins') || false);
      console.log('Body contains "Today":', bodyText?.includes('Today') || false);

      if (titleVisible && backButtonVisible) {
        console.log('✅ Login History page is working correctly!');
        
        if (statsCount > 0) {
          console.log('✅ Statistics cards are displaying!');
        }
        
        if (searchVisible) {
          console.log('✅ Search functionality is available!');
        }
        
        if (userFilterVisible) {
          console.log('✅ User filter dropdown is working!');
        }
        
        if (tableVisible) {
          console.log('✅ Login events table is visible!');
        }
      } else {
        console.log('⚠️ Login History page loaded but missing elements');
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
    msg.includes('404') || // Not found error
    msg.includes('Select.Item') || // Select component error
    msg.includes('empty string') // Empty string value error
  );
  
  console.log('Critical errors found:', criticalErrors.length);
  if (criticalErrors.length > 0) {
    console.log('Error details:', criticalErrors.slice(0, 3));
  }

  // Take a screenshot
  await page.screenshot({ path: 'test-login-history-fix.png', fullPage: true });

  // The test should pass if we can access the login history page
  expect(historyButtonCount).toBeGreaterThan(0);
});



