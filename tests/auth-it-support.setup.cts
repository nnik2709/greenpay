import { test as setup } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, '../playwright/.auth/it-support.json');

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

  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    throw new Error('IT_Support login failed - still on login page');
  }

  await page.context().storageState({ path: authFile });
  console.log('✅ IT_Support authentication complete');
});




