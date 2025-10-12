import { test } from '@playwright/test';

test('cash reconciliation page screenshot', async ({ page }) => {
  // Go directly to the page
  await page.goto('http://localhost:3000/cash-reconciliation', { waitUntil: 'domcontentloaded', timeout: 10000 });

  // Wait a bit
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ path: 'cash-recon-test.png', fullPage: true });

  // Log page title
  const title = await page.title();
  console.log('Page title:', title);

  // Log body text
  const body = await page.locator('body').textContent();
  console.log('Page text (first 500 chars):', body.substring(0, 500));

  // Check for errors in console
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
});
