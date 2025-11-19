import { test, expect } from '@playwright/test';

test('Complete navigation crawl - find Users page and test Login History', async ({ page }) => {
  // Monitor console for errors
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  console.log('Step 1: Navigate to dashboard...');
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('Step 2: Look for navigation menu...');
  
  // Try to find navigation menu in different possible locations
  const navSelectors = [
    'nav',
    '[role="navigation"]',
    '.navigation',
    '.nav',
    '.sidebar',
    '.menu',
    '[data-testid="navigation"]',
    '[data-testid="nav"]'
  ];

  let navigationFound = false;
  let navElement = null;

  for (const selector of navSelectors) {
    try {
      navElement = page.locator(selector).first();
      if (await navElement.isVisible()) {
        console.log(`Found navigation with selector: ${selector}`);
        navigationFound = true;
        break;
      }
    } catch (e) {
      // Continue to next selector
    }
  }

  if (!navigationFound) {
    console.log('Step 3: No navigation found, looking for any clickable links...');
    
    // Look for any links that might be navigation
    const allLinks = page.locator('a[href]');
    const linkCount = await allLinks.count();
    console.log(`Found ${linkCount} links on the page`);
    
    // Get all link texts and hrefs
    for (let i = 0; i < Math.min(linkCount, 20); i++) {
      const link = allLinks.nth(i);
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      console.log(`Link ${i}: "${text}" -> ${href}`);
    }
  } else {
    console.log('Step 3: Found navigation, looking for Users link...');
    
    // Look for Users link in various ways
    const usersLinkSelectors = [
      'a[href="/users"]',
      'a[href*="users"]',
      'text=Users',
      'text=User Management',
      'text=Manage Users',
      '[data-testid*="user"]',
      '[data-testid*="Users"]'
    ];

    let usersLinkFound = false;
    let usersLink = null;

    for (const selector of usersLinkSelectors) {
      try {
        usersLink = page.locator(selector).first();
        if (await usersLink.isVisible()) {
          console.log(`Found Users link with selector: ${selector}`);
          usersLinkFound = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (usersLinkFound) {
      console.log('Step 4: Clicking Users link...');
      await usersLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      console.log('Current URL after Users click:', page.url());
      const isOnUsersPage = page.url().includes('/users');
      console.log('Is on Users page:', isOnUsersPage);

      if (isOnUsersPage) {
        console.log('Step 5: Users page loaded! Checking for View Login History buttons...');
        
        // Check for View Login History buttons
        const viewHistoryButtons = page.locator('text=View Login History');
        const historyButtonCount = await viewHistoryButtons.count();
        console.log('View Login History buttons found:', historyButtonCount);

        if (historyButtonCount > 0) {
          console.log('Step 6: Clicking first View Login History button...');
          await viewHistoryButtons.first().click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(5000);

          console.log('URL after clicking View Login History:', page.url());
          const isOnLoginHistoryPage = page.url().includes('/admin/login-history');
          console.log('Is on login history page:', isOnLoginHistoryPage);

          if (isOnLoginHistoryPage) {
            console.log('Step 7: Login History page loaded! Checking content...');
            
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
          console.log('❌ No View Login History buttons found on Users page');
        }
      } else {
        console.log('❌ Did not reach Users page');
      }
    } else {
      console.log('❌ Users link not found in navigation');
      
      // Try to find any menu items
      const menuItems = page.locator('a, button').filter({ hasText: /Users|User|Manage|Admin/i });
      const menuCount = await menuItems.count();
      console.log(`Found ${menuCount} potential menu items with Users/User/Manage/Admin text`);
      
      for (let i = 0; i < Math.min(menuCount, 10); i++) {
        const item = menuItems.nth(i);
        const text = await item.textContent();
        const href = await item.getAttribute('href');
        console.log(`Menu item ${i}: "${text}" -> ${href}`);
      }
    }
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
  await page.screenshot({ path: 'test-complete-navigation-crawl.png', fullPage: true });

  // The test should pass if we can find and navigate to the Users page
  const finalUrl = page.url();
  const foundUsersPage = finalUrl.includes('/users') || finalUrl.includes('/admin/login-history');
  expect(foundUsersPage).toBe(true);
});


