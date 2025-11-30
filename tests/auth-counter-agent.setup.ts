import { test as setup } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const authFile = path.join(__dirname, '../playwright/.auth/counter-agent.json');

/**
 * Authentication Setup - Counter_Agent Role
 * Email: agent@greenpay.com
 * Password: test123
 */
setup('authenticate as Counter_Agent', async ({ page }) => {
  console.log('🔐 Authenticating as Counter_Agent (agent@greenpay.com)...');

  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('input#email', { state: 'visible' });

  await page.locator('input#email').fill('agent@greenpay.com');
  await page.locator('input#password').fill('test123');
  await page.waitForTimeout(500);

  await page.locator('input[type="password"]').press('Enter');
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    throw new Error('Counter_Agent login failed - still on login page');
  }

  await page.context().storageState({ path: authFile });
  console.log('✅ Counter_Agent authentication complete');
});
