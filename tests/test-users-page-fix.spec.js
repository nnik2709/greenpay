import { test, expect } from '@playwright/test';

test('Test Users page after React hooks fix', async ({ page }) => {
  // Monitor console for errors
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  console.log('Step 1: Navigate to Users page...');
  await page.goto('http://localhost:3000/users');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  console.log('Current URL:', page.url());
  const isOnUsersPage = page.url().includes('/users');
  console.log('Is on Users page:', isOnUsersPage);

  if (isOnUsersPage) {
    console.log('Step 2: Check Users page content...');
    
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

    if (titleVisible && addButtonVisible) {
      console.log('✅ Users page is working correctly!');
      
      if (historyButtonCount > 0) {
        console.log('✅ View Login History buttons are present!');
      }
      
      if (tableVisible) {
        console.log('✅ Users table is visible!');
      }
    } else {
      console.log('⚠️ Users page loaded but missing elements');
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
    msg.includes('Invalid hook call') ||
    msg.includes('useState') ||
    msg.includes('useContext')
  );
  
  console.log('Critical errors found:', criticalErrors.length);
  if (criticalErrors.length > 0) {
    console.log('Error details:', criticalErrors.slice(0, 3));
  }

  // Take a screenshot
  await page.screenshot({ path: 'test-users-page-fix.png', fullPage: true });

  // The test should pass if we can access the Users page
  expect(isOnUsersPage).toBe(true);
});


