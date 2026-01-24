import { test as setup } from '@playwright/test';

const authFile = new URL('../playwright/.auth/it-support.json', import.meta.url).pathname;

setup('authenticate as IT_Support', async ({ page }) => {
  console.log('🔐 Authenticating as IT_Support (support@greenpay.com)...');

  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('input#email', { state: 'visible' });

  await page.locator('input#email').fill('support@greenpay.com');
  await page.locator('input#password').fill('support123');
  await page.waitForTimeout(500);

  await page.locator('input[type="password"]').press('Enter');
  await page.waitForTimeout(3000);

  if (page.url().includes('/login')) {
    throw new Error('IT_Support login failed - still on login page');
  }

  await page.context().storageState({ path: authFile });
  console.log('✅ IT_Support authentication complete');
});




