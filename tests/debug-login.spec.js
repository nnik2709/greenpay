import { test, expect } from '@playwright/test';

test('debug login process', async ({ page }) => {
  // Capture console messages
  const consoleMessages = [];
  const consoleErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  // Go to login page
  await page.goto('/');

  // Fill in credentials
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'admin123');

  // Click sign in
  await page.click('button[type="submit"]');

  // Wait a bit for any errors
  await page.waitForTimeout(5000);

  // Print all console messages
  console.log('\n=== Console Messages ===');
  consoleMessages.forEach(msg => console.log(msg));

  console.log('\n=== Console Errors ===');
  consoleErrors.forEach(msg => console.log(msg));

  // Check current URL
  console.log('\n=== Current URL ===');
  console.log(page.url());

  // Check for error toast
  const errorToast = await page.locator('text=/failed|error|invalid/i').isVisible().catch(() => false);
  console.log('\n=== Error Toast Visible ===');
  console.log(errorToast);

  // Take screenshot
  await page.screenshot({ path: 'debug-login.png', fullPage: true });
  console.log('\n=== Screenshot saved to debug-login.png ===');
});
