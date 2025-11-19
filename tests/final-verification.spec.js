import { test, expect } from '@playwright/test';

test('Verify application is working correctly - React hooks fixed', async ({ page }) => {
  // Monitor console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  console.log('Testing application functionality...');
  
  // Navigate to the app
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait 2 seconds for full page load
  
  console.log('Current URL:', page.url());
  console.log('Page title:', await page.title());
  
  // Check if we're on dashboard (user is already logged in)
  expect(page.url()).toContain('/dashboard');
  expect(await page.title()).toContain('PNG Green Fees');
  
  // Wait for dashboard content to load
  await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 10000 });
  await page.waitForSelector('h3:has-text("Overall Revenue")', { timeout: 10000 });
  
  // Check for dashboard content (use more specific selector)
  await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  await expect(page.locator('h3:has-text("Overall Revenue")').first()).toBeVisible();
  
  console.log('✅ Dashboard loaded successfully');
  
  // Test Users page
  console.log('Testing Users page...');
  await page.goto('http://localhost:3000/users');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait for page to fully load
  
  await page.waitForSelector('text=Users', { timeout: 10000 });
  await expect(page.locator('text=Users')).toBeVisible();
  console.log('✅ Users page loaded successfully');
  
  // Test Passports page
  console.log('Testing Passports page...');
  await page.goto('http://localhost:3000/passports');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait for page to fully load
  
  await page.waitForSelector('text=Passports', { timeout: 10000 });
  await expect(page.locator('text=Passports')).toBeVisible();
  console.log('✅ Passports page loaded successfully');
  
  // Test Reports page
  console.log('Testing Reports page...');
  await page.goto('http://localhost:3000/reports');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait for page to fully load
  
  await page.waitForSelector('text=Reports', { timeout: 10000 });
  await expect(page.locator('text=Reports')).toBeVisible();
  console.log('✅ Reports page loaded successfully');
  
  // Check for React hook errors specifically
  const hookErrors = consoleErrors.filter(error => 
    error.includes('Invalid hook call') || 
    error.includes('useState') || 
    error.includes('useContext') ||
    error.includes('useEffect')
  );
  
  if (hookErrors.length > 0) {
    console.log('❌ React hook errors found:', hookErrors);
  } else {
    console.log('✅ No React hook errors found');
  }
  
  // Filter out non-critical errors
  const criticalErrors = consoleErrors.filter(error => 
    !error.includes('404') && 
    !error.includes('favicon') && 
    !error.includes('Failed to load resource') &&
    !error.includes('UNSAFE_componentWillMount') && // This is a warning, not critical
    !error.includes('autocomplete') // This is just a suggestion
  );
  
  if (criticalErrors.length > 0) {
    console.log('❌ Critical console errors found:', criticalErrors);
  } else {
    console.log('✅ No critical console errors found');
  }
  
  // Assertions
  expect(hookErrors.length).toBe(0);
  expect(criticalErrors.length).toBe(0);
  
  console.log('🎉 All tests passed! Application is working correctly.');
});

test('Verify login functionality works when user is not authenticated', async ({ page }) => {
  // Clear any existing session and storage
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  console.log('Testing login functionality...');
  
  // Navigate to login page
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000); // Wait longer for page to fully load
  
  console.log('Current URL:', page.url());
  
  // Check if we're redirected to dashboard (user might still be logged in)
  if (page.url().includes('/dashboard')) {
    console.log('User is still logged in, testing logout first...');
    // Try to find and click logout button
    const logoutButton = page.locator('text=Logout, text=Sign Out, [data-testid="logout"]').first();
    if (await logoutButton.isVisible({ timeout: 2000 })) {
      await logoutButton.click();
      await page.waitForTimeout(2000);
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
    }
  }
  
  console.log('Current URL after logout attempt:', page.url());
  
  // Should be on login page now
  expect(page.url()).toContain('/login');
  
  // Wait for login form elements to be visible
  await page.waitForSelector('input#email', { timeout: 10000 });
  await page.waitForSelector('input#password', { timeout: 10000 });
  await page.waitForSelector('button[type="submit"]', { timeout: 10000 });
  
  // Check for login form elements
  await expect(page.locator('input#email')).toBeVisible();
  await expect(page.locator('input#password')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
  
  // Check for expected text content
  await expect(page.locator('text=PNG Green Fees')).toBeVisible();
  await expect(page.locator('text=Sign In')).toBeVisible();
  await expect(page.locator('text=Email Address')).toBeVisible();
  
  console.log('✅ Login page loaded correctly with all form elements');
  
  // Test login functionality
  await page.fill('input#email', 'admin@example.com');
  await page.fill('input#password', 'admin123');
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  await page.waitForTimeout(2000); // Wait for dashboard to fully load
  
  console.log('✅ Login successful - redirected to dashboard');
  
  // Wait for dashboard elements to load
  await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 10000 });
  await page.waitForSelector('h3:has-text("Overall Revenue")', { timeout: 10000 });
  
  // Verify we're on dashboard
  await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  await expect(page.locator('h3:has-text("Overall Revenue")').first()).toBeVisible();
  
  console.log('✅ Dashboard loaded after successful login');
});
