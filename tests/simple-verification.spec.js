import { test, expect } from '@playwright/test';

test('Verify login page loads correctly', async ({ page }) => {
  // Monitor console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  console.log('Navigating to login page...');
  await page.goto('http://localhost:3000/login');
  
  console.log('Waiting for page to load...');
  await page.waitForLoadState('networkidle');
  
  console.log('Current URL:', page.url());
  console.log('Page title:', await page.title());
  
  // Check if we're on the login page
  expect(page.url()).toContain('/login');
  expect(await page.title()).toContain('PNG Green Fees');
  
  // Check for login form elements
  const emailInput = page.locator('input#email');
  const passwordInput = page.locator('input#password');
  const submitButton = page.locator('button[type="submit"]');
  
  // Wait for form elements to be visible
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await expect(passwordInput).toBeVisible({ timeout: 10000 });
  await expect(submitButton).toBeVisible({ timeout: 10000 });
  
  // Check for expected text content
  await expect(page.locator('text=PNG Green Fees')).toBeVisible();
  await expect(page.locator('text=Sign In')).toBeVisible();
  await expect(page.locator('text=Email Address')).toBeVisible();
  
  console.log('✅ Login page loaded successfully with all expected elements');
  
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
    !error.includes('UNSAFE_componentWillMount') // This is a warning, not critical
  );
  
  if (criticalErrors.length > 0) {
    console.log('❌ Critical console errors found:', criticalErrors);
  } else {
    console.log('✅ No critical console errors found');
  }
  
  expect(hookErrors.length).toBe(0);
  expect(criticalErrors.length).toBe(0);
});

test('Verify dashboard loads after login', async ({ page }) => {
  // Monitor console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  console.log('Navigating to login page...');
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  
  // Fill login form
  await page.fill('input#email', 'admin@example.com');
  await page.fill('input#password', 'admin123');
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  
  console.log('Current URL after login:', page.url());
  
  // Check for dashboard content
  await expect(page.locator('text=Dashboard')).toBeVisible();
  await expect(page.locator('text=Overall Revenue')).toBeVisible();
  
  console.log('✅ Dashboard loaded successfully after login');
  
  // Check for React hook errors
  const hookErrors = consoleErrors.filter(error => 
    error.includes('Invalid hook call') || 
    error.includes('useState') || 
    error.includes('useContext') ||
    error.includes('useEffect')
  );
  
  expect(hookErrors.length).toBe(0);
  console.log('✅ No React hook errors on dashboard');
});

test('Verify Users page loads without errors', async ({ page }) => {
  // Monitor console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Login first
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input#email', 'admin@example.com');
  await page.fill('input#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  
  // Navigate to Users page
  console.log('Navigating to Users page...');
  await page.goto('http://localhost:3000/users');
  await page.waitForLoadState('networkidle');
  
  console.log('Current URL:', page.url());
  
  // Check for Users page content
  await expect(page.locator('text=Users')).toBeVisible();
  
  console.log('✅ Users page loaded successfully');
  
  // Check for React hook errors
  const hookErrors = consoleErrors.filter(error => 
    error.includes('Invalid hook call') || 
    error.includes('useState') || 
    error.includes('useContext') ||
    error.includes('useEffect')
  );
  
  expect(hookErrors.length).toBe(0);
  console.log('✅ No React hook errors on Users page');
});



