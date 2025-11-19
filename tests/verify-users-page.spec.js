import { test, expect } from '@playwright/test';

test('Verify Users page loads and shows data', async ({ page }) => {
  // Monitor console for errors
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  console.log('Navigating to Users page...');
  await page.goto('http://localhost:3000/users');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('Current URL:', page.url());
  console.log('Page title:', await page.title());

  // Check if we're on the Users page
  const usersTitle = page.locator('h1:has-text("Users")');
  const titleVisible = await usersTitle.isVisible();
  console.log('Users title visible:', titleVisible);

  // Check for loading spinner
  const loadingSpinner = page.locator('.animate-spin');
  const spinnerVisible = await loadingSpinner.isVisible();
  console.log('Loading spinner visible:', spinnerVisible);

  // Check for users table
  const usersTable = page.locator('table');
  const tableVisible = await usersTable.isVisible();
  console.log('Users table visible:', tableVisible);

  // Check for "Add User" button
  const addUserButton = page.locator('button:has-text("Add User")');
  const addButtonVisible = await addUserButton.isVisible();
  console.log('Add User button visible:', addButtonVisible);

  // Check for "View Login History" buttons
  const viewHistoryButtons = page.locator('text=View Login History');
  const historyButtonCount = await viewHistoryButtons.count();
  console.log('View Login History buttons count:', historyButtonCount);

  // Check for "No users found" message
  const noUsersMessage = page.locator('text=No users found');
  const noUsersVisible = await noUsersMessage.isVisible();
  console.log('No users found message visible:', noUsersVisible);

  // Check for any error messages
  const errorMessages = page.locator('text=Error');
  const errorCount = await errorMessages.count();
  console.log('Error messages count:', errorCount);

  // Get page content for debugging
  const bodyText = await page.textContent('body');
  console.log('Body contains "Users":', bodyText?.includes('Users') || false);
  console.log('Body contains "Add User":', bodyText?.includes('Add User') || false);
  console.log('Body contains "View Login History":', bodyText?.includes('View Login History') || false);

  // Check console for errors
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
  await page.screenshot({ path: 'verify-users-page.png', fullPage: true });

  // The test should pass if we can see the Users page elements
  expect(titleVisible).toBe(true);
  expect(addButtonVisible).toBe(true);
});



