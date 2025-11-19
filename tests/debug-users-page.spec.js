import { test, expect } from '@playwright/test';

test('Debug Users page blank issue', async ({ page }) => {
  // Monitor all console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    console.log(`Browser console [${msg.type()}]:`, msg.text());
  });

  // Monitor network requests
  const requests = [];
  page.on('request', request => {
    requests.push(`${request.method()} ${request.url()}`);
  });

  // Monitor responses
  const responses = [];
  page.on('response', response => {
    responses.push(`${response.status()} ${response.url()}`);
  });

  console.log('Navigating to Users page...');
  await page.goto('http://localhost:3000/users');
  
  console.log('Waiting for page to load...');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000); // Wait 5 seconds for everything to load
  
  console.log('Current URL:', page.url());
  console.log('Page title:', await page.title());
  
  // Take a screenshot
  await page.screenshot({ path: 'debug-users-page.png', fullPage: true });
  
  // Check page content
  const bodyText = await page.textContent('body');
  console.log('Body text length:', bodyText?.length || 0);
  console.log('Body contains "Users":', bodyText?.includes('Users') || false);
  console.log('Body contains "PNG Green Fees":', bodyText?.includes('PNG Green Fees') || false);
  
  // Check for React root
  const reactRoot = page.locator('#root');
  const reactRootCount = await reactRoot.count();
  console.log('React root element count:', reactRootCount);
  
  if (reactRootCount > 0) {
    const reactRootText = await reactRoot.textContent();
    console.log('React root content length:', reactRootText?.length || 0);
    console.log('React root content preview:', reactRootText?.substring(0, 200) || 'Empty');
  }
  
  // Check for any error overlays
  const errorOverlay = page.locator('[data-vite-error-overlay]');
  const errorOverlayCount = await errorOverlay.count();
  console.log('Error overlay count:', errorOverlayCount);
  
  if (errorOverlayCount > 0) {
    const errorText = await errorOverlay.textContent();
    console.log('Error overlay content:', errorText);
  }
  
  // Check for loading indicators
  const loadingIndicators = page.locator('[class*="loading"], [class*="spinner"], [class*="loader"]');
  const loadingCount = await loadingIndicators.count();
  console.log('Loading indicators count:', loadingCount);
  
  // Check for navigation elements
  const navElements = page.locator('nav, [role="navigation"]');
  const navCount = await navElements.count();
  console.log('Navigation elements count:', navCount);
  
  // Check for main content
  const mainContent = page.locator('main, [role="main"], .main-content');
  const mainCount = await mainContent.count();
  console.log('Main content elements count:', mainCount);
  
  // Check for any visible text
  const allText = await page.evaluate(() => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let text = '';
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.trim()) {
        text += node.textContent.trim() + ' ';
      }
    }
    return text.trim();
  });
  
  console.log('All visible text on page:', allText);
  
  // Log network requests
  console.log('Network requests:', requests.slice(0, 10)); // First 10 requests
  console.log('Network responses:', responses.slice(0, 10)); // First 10 responses
  
  // Log console messages
  console.log('Console messages:', consoleMessages.slice(0, 20)); // First 20 messages
  
  // Check if page is completely blank
  const isBlank = !bodyText || bodyText.trim().length === 0;
  console.log('Page is blank:', isBlank);
  
  if (isBlank) {
    console.log('❌ Users page is completely blank');
  } else {
    console.log('✅ Users page has content');
  }
});



