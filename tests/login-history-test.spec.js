import { test, expect } from '@playwright/test';

test('Test Login History functionality', async ({ page }) => {
  // Monitor console for errors
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  console.log('Navigating to Users page...');
  await page.goto('http://localhost:3000/users');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('Looking for View Login History button...');
  
  // Check if we can find the "View Login History" button
  const viewHistoryButton = page.locator('text=View Login History').first();
  const buttonCount = await viewHistoryButton.count();
  
  console.log(`Found ${buttonCount} "View Login History" buttons`);
  
  if (buttonCount > 0) {
    console.log('Clicking View Login History button...');
    await viewHistoryButton.click();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('Current URL after click:', page.url());
    
    // Check if we're on the login history page
    const isOnLoginHistoryPage = page.url().includes('/admin/login-history');
    console.log('Is on login history page:', isOnLoginHistoryPage);
    
    if (isOnLoginHistoryPage) {
      // Check for login history page elements
      const pageTitle = page.locator('h1:has-text("Login History")');
      const titleVisible = await pageTitle.isVisible();
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
      
      console.log('✅ Login History page loaded successfully!');
    } else {
      console.log('❌ Did not navigate to login history page');
    }
  } else {
    console.log('❌ No "View Login History" buttons found');
  }
  
  // Check for any critical errors
  const criticalErrors = consoleMessages.filter(msg => 
    msg.includes('Error') || 
    msg.includes('Failed') || 
    msg.includes('Cannot read properties')
  );
  
  console.log('Critical errors found:', criticalErrors.length);
  if (criticalErrors.length > 0) {
    console.log('Error details:', criticalErrors);
  }
  
  // Take a screenshot
  await page.screenshot({ path: 'login-history-test.png', fullPage: true });
});



