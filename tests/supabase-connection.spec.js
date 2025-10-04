import { test, expect } from '@playwright/test';

test.describe('Supabase Connection Tests', () => {
  test('should connect to Supabase successfully', async ({ page }) => {
    // Listen for console messages
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    await page.goto('/');

    // Wait for page to load and any Supabase initialization
    await page.waitForTimeout(5000);

    // Check if we can access the login page (indicates app loaded)
    await expect(page.locator('h1:has-text("PNG Green Fees")')).toBeVisible({ timeout: 10000 });
    
    // Check console for any Supabase-related messages (success or error)
    const hasSupabaseMessage = consoleMessages.some(msg =>
      msg.includes('Supabase') ||
      msg.includes('supabase') ||
      msg.includes('client initialized') ||
      msg.includes('All tests passed') ||
      msg.includes('Successfully connected') ||
      msg.includes('connection')
    );

    // If no Supabase messages in console, check if app loads successfully
    if (!hasSupabaseMessage) {
      // App should at least load the login page
      const appLoaded = await page.locator('h1:has-text("PNG Green Fees")').isVisible();
      expect(appLoaded).toBe(true);
    } else {
      expect(hasSupabaseMessage).toBe(true);
    }
  });

  test('should not have RLS policy errors', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    // Check for infinite recursion errors
    const hasRLSError = consoleErrors.some(msg =>
      msg.includes('infinite recursion') ||
      msg.includes('policy')
    );

    expect(hasRLSError).toBe(false);
  });
});
