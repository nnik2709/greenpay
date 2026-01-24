import { test as setup } from '@playwright/test';

const authFile = new URL('../playwright/.auth/flex-admin.json', import.meta.url).pathname;

setup('authenticate as Flex_Admin', async ({ page }) => {
  console.log('🔐 Authenticating as Flex_Admin (flexadmin@greenpay.com)...');

  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('input#email', { state: 'visible' });

  await page.locator('input#email').fill('flexadmin@greenpay.com');
  await page.locator('input#password').fill('test123');
  await page.waitForTimeout(500);

  await page.locator('input[type="password"]').press('Enter');
  await page.waitForTimeout(3000);

  if (page.url().includes('/login')) {
    throw new Error('Flex_Admin login failed - still on login page');
  }

  await page.context().storageState({ path: authFile });
  console.log('✅ Flex_Admin authentication complete');
});




