import { test, expect } from '@playwright/test';

test.describe('Supabase Connection Tests', () => {
  test('should connect to Supabase successfully', async ({ page }) => {
    // Listen for console messages
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    await page.goto('/');

    // Wait for Supabase connection test to run
    await page.waitForTimeout(3000);

    // Check console for success messages
    const hasSuccessMessage = consoleMessages.some(msg =>
      msg.includes('Supabase client initialized') ||
      msg.includes('All tests passed') ||
      msg.includes('Successfully connected')
    );

    expect(hasSuccessMessage).toBe(true);
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
