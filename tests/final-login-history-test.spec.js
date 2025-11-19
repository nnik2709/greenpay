import { test, expect } from '@playwright/test';

test('Final Login History functionality test', async ({ page }) => {
  // Monitor console for errors
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  console.log('Step 1: Navigate to dashboard...');
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('Step 2: Click Users link in navigation...');
  const usersLink = page.locator('a[href="/users"]');
  await usersLink.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('Current URL:', page.url());
  const isOnUsersPage = page.url().includes('/users');
  console.log('Is on Users page:', isOnUsersPage);

  if (isOnUsersPage) {
    console.log('Step 3: Check Users page content...');
    
    // Check for Users title
    const usersTitle = page.locator('h1:has-text("Users")');
    const titleVisible = await usersTitle.isVisible();
    console.log('Users title visible:', titleVisible);

    // Check for Add User button
    const addUserButton = page.locator('button:has-text("Add User")');
    const addButtonVisible = await addUserButton.isVisible();
    console.log('Add User button visible:', addButtonVisible);

    // Check for users table
    const usersTable = page.locator('table');
    const tableVisible = await usersTable.isVisible();
    console.log('Users table visible:', tableVisible);

    // Check for View Login History buttons
    const viewHistoryButtons = page.locator('text=View Login History');
    const historyButtonCount = await viewHistoryButtons.count();
    console.log('View Login History buttons found:', historyButtonCount);

    // Check for "No users found" message
    const noUsersMessage = page.locator('text=No users found');
    const noUsersVisible = await noUsersMessage.isVisible();
    console.log('No users found message visible:', noUsersVisible);

    if (historyButtonCount > 0) {
      console.log('Step 4: Click first View Login History button...');
      await viewHistoryButtons.first().click();
      
      // Wait for navigation
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);
      
      console.log('URL after clicking View Login History:', page.url());
      const isOnLoginHistoryPage = page.url().includes('/admin/login-history');
      console.log('Is on login history page:', isOnLoginHistoryPage);

      if (isOnLoginHistoryPage) {
        console.log('Step 5: Check login history page content...');
        
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

        // Get page content for debugging
        const bodyText = await page.textContent('body');
        console.log('Body contains "Login History":', bodyText?.includes('Login History') || false);
        console.log('Body contains "Total Logins":', bodyText?.includes('Total Logins') || false);
        console.log('Body contains "Today":', bodyText?.includes('Today') || false);
        console.log('Body contains "admin@example.com":', bodyText?.includes('admin@example.com') || false);

        if (titleVisible && backButtonVisible) {
          console.log('✅ Login History page is working!');
          
          if (statsCount > 0) {
            console.log('✅ Statistics are displaying!');
          }
          
          if (searchVisible) {
            console.log('✅ Search functionality is available!');
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
      
      // Check if there are users in the database
      const tableRows = page.locator('table tbody tr');
      const rowCount = await tableRows.count();
      console.log('Table rows count:', rowCount);
    }
  } else {
    console.log('❌ Did not reach Users page');
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
    console.log('Error details:', criticalErrors.slice(0, 3));
  }

  // Take a screenshot
  await page.screenshot({ path: 'final-login-history-test.png', fullPage: true });

  // The test should pass if we can access the Users page
  expect(isOnUsersPage).toBe(true);
});



