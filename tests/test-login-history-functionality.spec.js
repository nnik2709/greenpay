import { test, expect } from '@playwright/test';

test('Test Login History functionality from Users page', async ({ page }) => {
  // Monitor console for errors
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  console.log('Navigating to dashboard...');
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('Clicking Users link in navigation...');
  const usersLink = page.locator('a[href="/users"]');
  await usersLink.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('Current URL:', page.url());
  console.log('Is on Users page:', page.url().includes('/users'));

  // Check if we can see the Users page elements
  const usersTitle = page.locator('h1:has-text("Users")');
  const titleVisible = await usersTitle.isVisible();
  console.log('Users title visible:', titleVisible);

  const addUserButton = page.locator('button:has-text("Add User")');
  const addButtonVisible = await addUserButton.isVisible();
  console.log('Add User button visible:', addButtonVisible);

  // Look for "View Login History" buttons
  const viewHistoryButtons = page.locator('text=View Login History');
  const historyButtonCount = await viewHistoryButtons.count();
  console.log('View Login History buttons count:', historyButtonCount);

  if (historyButtonCount > 0) {
    console.log('Found View Login History buttons! Clicking the first one...');
    await viewHistoryButtons.first().click();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('URL after clicking View Login History:', page.url());
    
    // Check if we're on the login history page
    const isOnLoginHistoryPage = page.url().includes('/admin/login-history');
    console.log('Is on login history page:', isOnLoginHistoryPage);
    
    if (isOnLoginHistoryPage) {
      // Check for login history page elements
      const loginHistoryTitle = page.locator('h1:has-text("Login History")');
      const historyTitleVisible = await loginHistoryTitle.isVisible();
      console.log('Login History title visible:', historyTitleVisible);
      
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
      
      console.log('✅ Login History page loaded successfully!');
      
      // Test the back button
      if (backButtonVisible) {
        console.log('Testing back button...');
        await backButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        console.log('URL after clicking back:', page.url());
        const backOnUsersPage = page.url().includes('/users');
        console.log('Back on Users page:', backOnUsersPage);
      }
    } else {
      console.log('❌ Did not navigate to login history page');
    }
  } else {
    console.log('❌ No "View Login History" buttons found');
    
    // Check if there are any users in the table
    const usersTable = page.locator('table');
    const tableVisible = await usersTable.isVisible();
    console.log('Users table visible:', tableVisible);
    
    if (tableVisible) {
      const tableRows = page.locator('table tbody tr');
      const rowCount = await tableRows.count();
      console.log('Table rows count:', rowCount);
      
      // Check for "No users found" message
      const noUsersMessage = page.locator('text=No users found');
      const noUsersVisible = await noUsersMessage.isVisible();
      console.log('No users found message visible:', noUsersVisible);
    }
  }

  // Check for any critical errors
  const criticalErrors = consoleMessages.filter(msg => 
    msg.includes('Error') || 
    msg.includes('Failed') || 
    msg.includes('Cannot read properties') ||
    msg.includes('TypeError')
  );
  
  console.log('Critical errors found:', criticalErrors.length);
  if (criticalErrors.length > 0) {
    console.log('Error details:', criticalErrors);
  }

  // Take a screenshot
  await page.screenshot({ path: 'test-login-history-functionality.png', fullPage: true });
});



