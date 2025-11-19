import { test, expect } from '@playwright/test';

test('Check user role and access to Users page', async ({ page }) => {
  // Monitor console for errors
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  console.log('Navigating to dashboard...');
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('Current URL:', page.url());

  // Check if we can see the Users link in navigation
  const usersLink = page.locator('a[href="/users"]');
  const usersLinkVisible = await usersLink.isVisible();
  console.log('Users link in navigation visible:', usersLinkVisible);

  if (usersLinkVisible) {
    console.log('Clicking Users link...');
    await usersLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('URL after clicking Users:', page.url());
    
    // Check if we're on the Users page or redirected
    const isOnUsersPage = page.url().includes('/users');
    console.log('Is on Users page:', isOnUsersPage);
    
    if (isOnUsersPage) {
      const usersTitle = page.locator('h1:has-text("Users")');
      const titleVisible = await usersTitle.isVisible();
      console.log('Users title visible:', titleVisible);
      
      const addUserButton = page.locator('button:has-text("Add User")');
      const addButtonVisible = await addUserButton.isVisible();
      console.log('Add User button visible:', addButtonVisible);
    }
  } else {
    console.log('Users link not found in navigation - user may not have required role');
  }

  // Check for any role-related errors
  const roleErrors = consoleMessages.filter(msg => 
    msg.includes('role') || 
    msg.includes('permission') || 
    msg.includes('access denied')
  );
  
  console.log('Role-related errors:', roleErrors.length);
  if (roleErrors.length > 0) {
    console.log('Role error details:', roleErrors);
  }

  // Take a screenshot
  await page.screenshot({ path: 'check-user-role.png', fullPage: true });
});



