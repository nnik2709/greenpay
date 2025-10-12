import { test, expect } from '@playwright/test';

test('Simple Settings Page Test', async ({ page }) => {
  // Login as admin
  await page.goto('/login');
  await page.fill('input#email', 'admin@example.com');
  await page.fill('input#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Navigate to settings
  await page.goto('/admin/settings');
  await page.waitForTimeout(5000);

  // Take screenshot
  await page.screenshot({ path: 'test-results/settings-page-debug.png', fullPage: true });

  // Check if page has any content
  const bodyText = await page.textContent('body');
  console.log('Body content length:', bodyText?.length || 0);
  console.log('Body preview:', bodyText?.substring(0, 500));

  // Check for any errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Basic check - page should have some content
  expect(bodyText?.length || 0).toBeGreaterThan(1000);
});

