import { test, expect } from '@playwright/test';

test('Debug Users page specifically', async ({ page }) => {
  // Monitor all console messages
  const allMessages: Array<{type: string, text: string}> = [];
  const errors: string[] = [];
  
  page.on('console', msg => {
    const text = msg.text();
    allMessages.push({type: msg.type(), text});
    if (msg.type() === 'error' && !text.includes('UNSAFE_componentWillMount')) {
      errors.push(text);
    }
  });

  page.on('pageerror', error => {
    errors.push(`Page error: ${error.message}`);
  });

  // Login
  await page.goto('/login');
  await page.fill('input#email', 'admin@example.com');
  await page.fill('input#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Go to users page
  await page.goto('/users');
  await page.waitForTimeout(5000); // Wait longer for data to load

  // Check if loading state is stuck
  const isLoading = await page.locator('text=Loading...').count() > 0;
  const hasUsers = await page.locator('[data-testid="user-card"], .user-card, tr').count() > 0;
  const hasError = await page.locator('text=Error, text=Failed to load').count() > 0;

  // Get page content
  const bodyText = await page.textContent('body');
  
  console.log('\n=== USERS PAGE DEBUG ===');
  console.log('Is Loading:', isLoading);
  console.log('Has Users:', hasUsers);
  console.log('Has Error:', hasError);
  console.log('Body length:', bodyText?.length || 0);
  console.log('Console Errors:', errors.length);
  
  if (errors.length > 0) {
    console.log('Errors:');
    errors.forEach(err => console.log('  -', err));
  }

  // Log all console messages
  console.log('\nAll Console Messages:');
  allMessages.forEach(msg => {
    if (msg.type === 'log' || msg.type === 'error') {
      console.log(`[${msg.type}] ${msg.text}`);
    }
  });

  // Check for specific elements
  const hasMainContent = await page.locator('main, .main-content, #root > div').count() > 0;
  const hasReactRoot = await page.locator('#root').count() > 0;
  
  console.log('Has Main Content:', hasMainContent);
  console.log('Has React Root:', hasReactRoot);

  // Take screenshot
  await page.screenshot({ path: 'test-results/users-page-debug-detailed.png', fullPage: true });

  // Check if the issue is with the component itself
  const componentHTML = await page.innerHTML('#root');
  console.log('Root HTML length:', componentHTML.length);
  console.log('Root HTML preview:', componentHTML.substring(0, 500));

  // Try to interact with the page
  await page.click('body'); // Click to ensure focus
  await page.waitForTimeout(1000);

  // Final check
  const finalContent = await page.textContent('body');
  console.log('Final content length:', finalContent?.length || 0);
});

