import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

/**
 * Authentication Setup
 * Runs once before all tests to authenticate and save session
 */
setup('authenticate', async ({ page }) => {
  // Monitor console errors
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    console.log(`Browser console [${msg.type()}]:`, text);
  });

  // Navigate to login page
  await page.goto('/login');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Wait for login form to be fully loaded
  await page.waitForSelector('input#email', { state: 'visible' });
  await page.waitForSelector('input#password', { state: 'visible' });
  await page.waitForSelector('button[type="submit"]', { state: 'visible' });
  
  // Fill in login credentials using field IDs (more reliable)
  // Using credentials from test accounts (flexadmin@greenpay.com)
  await page.locator('input#email').clear();
  await page.locator('input#email').fill('flexadmin@greenpay.com');
  await page.waitForTimeout(500);

  await page.locator('input#password').clear();
  await page.locator('input#password').fill('test123');
  await page.waitForTimeout(500);
  
  // Verify fields are filled correctly
  const emailValue = await page.locator('input#email').inputValue();
  const passwordValue = await page.locator('input#password').inputValue();
  console.log(`Email filled: ${emailValue}`);
  console.log(`Password filled: ${passwordValue.length} characters`);

  console.log('Filled in credentials, submitting form...');

  // Try pressing Enter to submit the form (more reliable than clicking)
  await Promise.all([
    page.waitForResponse(response => response.url().includes('auth') || response.url().includes('sign'), { timeout: 10000 }).catch(e => console.log('No auth response:', e.message)),
    page.locator('input[type="password"]').press('Enter')
  ]);

  // Wait for any auth processing and navigation
  await page.waitForTimeout(5000);
  
  console.log('Waiting for navigation or error...');

  // Check if we're still on login page (error case)
  const currentUrl = page.url();
  console.log('Current URL after login:', currentUrl);
  
  if (currentUrl.includes('/login')) {
    // Check for error messages
    const errorMessage = page.locator('text=/invalid|error|incorrect|failed|Login Failed/i');
    if (await errorMessage.isVisible({ timeout: 1000 }).catch(() => false)) {
      const errorText = await errorMessage.textContent();
      console.log('❌ Login error:', errorText);
      throw new Error(`Login failed with error: ${errorText}`);
    }
    throw new Error('Still on login page - authentication may have failed silently');
  }

  // Verify we're logged in by checking for dashboard elements or navigation
  const loggedInIndicators = [
    page.locator('text=Dashboard'),
    page.locator('text=Overall Revenue'),
    page.locator('text=Individual Purchase'),
    page.locator('[href="/dashboard"]'),
    page.locator('nav'), // Main navigation should be visible when logged in
  ];

  let foundIndicator = false;
  for (const indicator of loggedInIndicators) {
    if (await indicator.isVisible({ timeout: 2000 }).catch(() => false)) {
      foundIndicator = true;
      console.log('✓ Found logged-in indicator:', await indicator.textContent().catch(() => 'navigation element'));
      break;
    }
  }

  if (!foundIndicator) {
    throw new Error('Could not verify successful login - no dashboard elements found');
  }

  // Save signed-in state
  await page.context().storageState({ path: authFile });

  console.log('✓ Authentication setup complete');
});
