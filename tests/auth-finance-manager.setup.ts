import { test as setup } from '@playwright/test';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const authFile = fileURLToPath(new URL('../playwright/.auth/finance-manager.json', import.meta.url));

/**
 * Authentication Setup - Finance_Manager Role
 * Email: finance@greenpay.com
 * Password: test123
 */
setup('authenticate as Finance_Manager', async ({ page }) => {
  console.log('🔐 Authenticating as Finance_Manager (finance@greenpay.com)...');

  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('input#email', { state: 'visible' });

  await page.locator('input#email').fill('finance@greenpay.com');
  await page.locator('input#password').fill('test123');
  await page.waitForTimeout(500);

  await page.locator('input[type="password"]').press('Enter');
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    throw new Error('Finance_Manager login failed - still on login page');
  }

  await page.context().storageState({ path: authFile });
  console.log('✅ Finance_Manager authentication complete');
});
