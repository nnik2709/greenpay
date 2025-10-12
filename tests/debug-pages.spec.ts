import { test, expect } from '@playwright/test';

test.describe('Debug Pages', () => {
  test('check Users page for errors', async ({ page }) => {
    const consoleMessages: string[] = [];
    const errors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        errors.push(text);
      }
    });

    page.on('pageerror', error => {
      errors.push(`Page error: ${error.message}`);
    });

    // Login first
    await page.goto('/login');
    await page.fill('input#email', 'admin@example.com');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to Users page
    await page.goto('/users');
    await page.waitForTimeout(3000);

    // Log all messages
    console.log('\n=== USERS PAGE CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => console.log(msg));
    
    if (errors.length > 0) {
      console.log('\n=== ERRORS FOUND ===');
      errors.forEach(err => console.log(err));
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/users-page-debug.png', fullPage: true });
  });

  test('check Passports page for errors', async ({ page }) => {
    const consoleMessages: string[] = [];
    const errors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        errors.push(text);
      }
    });

    page.on('pageerror', error => {
      errors.push(`Page error: ${error.message}`);
    });

    // Login first
    await page.goto('/login');
    await page.fill('input#email', 'admin@example.com');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to Passports page
    await page.goto('/passports');
    await page.waitForTimeout(3000);

    // Log all messages
    console.log('\n=== PASSPORTS PAGE CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => console.log(msg));
    
    if (errors.length > 0) {
      console.log('\n=== ERRORS FOUND ===');
      errors.forEach(err => console.log(err));
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/passports-page-debug.png', fullPage: true });
  });

  test('check Dashboard page', async ({ page }) => {
    const consoleMessages: string[] = [];
    const errors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        errors.push(text);
      }
    });

    page.on('pageerror', error => {
      errors.push(`Page error: ${error.message}`);
    });

    // Login first
    await page.goto('/login');
    await page.fill('input#email', 'admin@example.com');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Should be on dashboard
    console.log('\n=== DASHBOARD PAGE CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => console.log(msg));
    
    if (errors.length > 0) {
      console.log('\n=== ERRORS FOUND ===');
      errors.forEach(err => console.log(err));
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/dashboard-debug.png', fullPage: true });
  });
});


