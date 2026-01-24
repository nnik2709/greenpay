import { test as setup } from '@playwright/test';

const authFile = new URL('../playwright/.auth/counter-agent.json', import.meta.url).pathname;

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

  if (page.url().includes('/login')) {
    throw new Error('Counter_Agent login failed - still on login page');
  }

  await page.context().storageState({ path: authFile });
  console.log('✅ Counter_Agent authentication complete');
});




