import { test, expect } from '@playwright/test';

test('Debug login page', async ({ page }) => {
  // Monitor console errors
  page.on('console', msg => {
    console.log(`Browser console [${msg.type()}]:`, msg.text());
  });

  console.log('Navigating to login page...');
  await page.goto('http://localhost:3000/login');
  
  console.log('Waiting for page to load...');
  await page.waitForLoadState('networkidle');
  
  console.log('Current URL:', page.url());
  console.log('Page title:', await page.title());
  
  // Take a screenshot
  await page.screenshot({ path: 'debug-login-page.png' });
  
  // Check if login form exists
  const emailInput = page.locator('input#email');
  const passwordInput = page.locator('input#password');
  const submitButton = page.locator('button[type="submit"]');
  
  console.log('Email input count:', await emailInput.count());
  console.log('Password input count:', await passwordInput.count());
  console.log('Submit button count:', await submitButton.count());
  
  // Check for any error messages
  const errorMessages = page.locator('text=/error|Error|ERROR/');
  const errorCount = await errorMessages.count();
  console.log('Error messages found:', errorCount);
  
  if (errorCount > 0) {
    for (let i = 0; i < errorCount; i++) {
      console.log(`Error ${i + 1}:`, await errorMessages.nth(i).textContent());
    }
  }
  
  // Check page content
  const bodyText = await page.textContent('body');
  console.log('Page contains "PNG Green Fees":', bodyText?.includes('PNG Green Fees'));
  console.log('Page contains "Sign In":', bodyText?.includes('Sign In'));
  console.log('Page contains "Email Address":', bodyText?.includes('Email Address'));
  
  // If form exists, try to fill it
  if (await emailInput.count() > 0) {
    console.log('Form found, attempting to fill...');
    await emailInput.fill('admin@example.com');
    await passwordInput.fill('admin123');
    
    console.log('Form filled, taking screenshot...');
    await page.screenshot({ path: 'debug-login-filled.png' });
    
    console.log('Submitting form...');
    await submitButton.click();
    
    console.log('Waiting for navigation...');
    await page.waitForTimeout(3000);
    
    console.log('URL after submit:', page.url());
    await page.screenshot({ path: 'debug-login-after-submit.png' });
  } else {
    console.log('Login form not found!');
  }
});