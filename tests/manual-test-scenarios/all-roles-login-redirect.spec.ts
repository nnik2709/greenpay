import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Test all 4 user role login flows and verify correct redirects
 *
 * This test verifies:
 * 1. Each role can log in successfully
 * 2. Each role is redirected to the correct landing page
 * 3. Landing pages render content correctly (no blank pages)
 * 4. Role-specific navigation elements are present
 */

const TEST_USERS = [
  {
    role: 'Counter_Agent',
    email: 'agent@greenpay.com',
    password: 'test123',
    expectedUrl: '**/app/agent',
    expectedPageTitle: 'Welcome Back!',
    expectedContent: 'Individual Purchase', // Button text on agent landing
    screenshotPrefix: 'counter-agent',
  },
  {
    role: 'Flex_Admin',
    email: 'flexadmin@greenpay.com',
    password: 'test123',
    expectedUrl: '**/app/dashboard',
    expectedPageTitle: /Dashboard|Revenue/i, // Dashboard may have different titles
    expectedContent: /Total|Revenue|Transactions/i,
    screenshotPrefix: 'flex-admin',
  },
  {
    role: 'Finance_Manager',
    email: 'finance@greenpay.com',
    password: 'test123',
    expectedUrl: '**/app/dashboard',
    expectedPageTitle: /Dashboard|Revenue/i,
    expectedContent: /Total|Revenue|Transactions/i,
    screenshotPrefix: 'finance-manager',
  },
  {
    role: 'IT_Support',
    email: 'support@greenpay.com',
    password: 'support123', // Note: Different password
    expectedUrl: '**/app/dashboard',
    expectedPageTitle: /Dashboard|Revenue/i,
    expectedContent: /Total|Revenue|Transactions/i,
    screenshotPrefix: 'it-support',
  },
];

test.describe('All User Roles - Login & Redirect Verification', () => {

  for (const userConfig of TEST_USERS) {
    test(`${userConfig.role}: Login → Redirect → Landing Page Content`, async ({ page }) => {
      const screenshotsDir = path.join(
        __dirname,
        '../../test-screenshots/manual-tests/role-verification',
        userConfig.screenshotPrefix
      );

      console.log(`\n🧪 Testing Role: ${userConfig.role}`);
      console.log(`📧 Email: ${userConfig.email}`);
      console.log(`🎯 Expected URL: ${userConfig.expectedUrl}`);

      // STEP 1: Navigate to login page
      console.log('\n📍 Step 1: Navigate to login page');
      await page.goto('https://greenpay.eywademo.cloud/login');
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: path.join(screenshotsDir, '01-login-page.png'),
        fullPage: true
      });
      console.log('✅ Login page loaded');

      // STEP 2: Fill in credentials
      console.log(`\n📍 Step 2: Fill in credentials for ${userConfig.role}`);
      await page.fill('input[type="email"]', userConfig.email);
      await page.fill('input[type="password"]', userConfig.password);
      await page.screenshot({
        path: path.join(screenshotsDir, '02-credentials-filled.png'),
        fullPage: true
      });

      // STEP 3: Submit login
      console.log('\n📍 Step 3: Submit login');
      await page.click('button[type="submit"]');

      // Wait for redirect to complete
      console.log('⏳ Waiting for redirect...');
      await page.waitForURL(userConfig.expectedUrl, { timeout: 15000 });
      await page.waitForLoadState('networkidle');

      console.log(`✅ Redirected to: ${page.url()}`);

      // STEP 4: Capture landing page screenshot
      console.log('\n📍 Step 4: Capture landing page');
      await page.screenshot({
        path: path.join(screenshotsDir, '03-landing-page.png'),
        fullPage: true
      });

      // STEP 5: Verify page content is rendered (not blank)
      console.log('\n📍 Step 5: Verify page content rendered');

      // Wait for expected content to appear
      try {
        const contentLocator = typeof userConfig.expectedContent === 'string'
          ? page.locator(`text=${userConfig.expectedContent}`).first()
          : page.locator(`:text-matches("${userConfig.expectedContent.source}", "${userConfig.expectedContent.flags}")`).first();

        await contentLocator.waitFor({ state: 'visible', timeout: 10000 });
        console.log(`✅ Found expected content: "${userConfig.expectedContent}"`);
      } catch (error) {
        console.log(`⚠️  Expected content not found: "${userConfig.expectedContent}"`);
        console.log('📄 Page HTML snippet:');
        const bodyText = await page.locator('body').textContent();
        console.log(bodyText?.substring(0, 500));

        // Take error screenshot
        await page.screenshot({
          path: path.join(screenshotsDir, '04-content-missing-ERROR.png'),
          fullPage: true
        });

        throw new Error(`Expected content "${userConfig.expectedContent}" not found on ${userConfig.role} landing page`);
      }

      // STEP 6: Verify no console errors
      console.log('\n📍 Step 6: Check for console errors');
      const consoleLogs: string[] = [];
      const consoleErrors: string[] = [];

      page.on('console', msg => {
        const text = msg.text();
        if (msg.type() === 'error' && !text.includes('favicon')) { // Ignore favicon errors
          consoleErrors.push(text);
        }
        consoleLogs.push(`[${msg.type()}] ${text}`);
      });

      // Wait for any delayed console logs
      await page.waitForTimeout(2000);

      if (consoleErrors.length > 0) {
        console.log('⚠️  Console Errors Found:', consoleErrors);
      } else {
        console.log('✅ No console errors detected');
      }

      // STEP 7: Verify role-specific navigation
      console.log('\n📍 Step 7: Verify navigation elements');

      // Check if logout button exists (should be present for all roles)
      const logoutBtn = page.locator('button:has-text("Logout"), a:has-text("Logout")');
      await expect(logoutBtn).toBeVisible({ timeout: 5000 });
      console.log('✅ Logout button visible');

      // Capture final state
      await page.screenshot({
        path: path.join(screenshotsDir, '05-verified-state.png'),
        fullPage: true
      });

      // FINAL ASSERTIONS
      console.log('\n🎯 VERIFICATION RESULTS:');
      console.log(`   ✅ Login successful: true`);
      console.log(`   ✅ Redirected to correct URL: ${page.url()}`);
      console.log(`   ✅ Content rendered: true`);
      console.log(`   ✅ Console errors: ${consoleErrors.length}`);

      // Assert no blocking console errors
      expect(consoleErrors.length, `${userConfig.role} should have no console errors`).toBe(0);

      console.log(`\n✅ ${userConfig.role} TEST PASSED\n`);
    });
  }

  // Additional test: Verify redirect logic for all roles
  test('Verify RoleBasedRedirect component redirects correctly', async ({ page }) => {
    console.log('\n🧪 Testing Direct Access to /app (RoleBasedRedirect)');

    // Test with Counter_Agent
    const agent = TEST_USERS.find(u => u.role === 'Counter_Agent')!;

    // Login first
    await page.goto('https://greenpay.eywademo.cloud/login');
    await page.fill('input[type="email"]', agent.email);
    await page.fill('input[type="password"]', agent.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Now navigate directly to /app (should trigger RoleBasedRedirect)
    console.log('📍 Navigating directly to /app...');
    await page.goto('https://greenpay.eywademo.cloud/app');

    // Should redirect to /app/agent
    await page.waitForURL('**/app/agent', { timeout: 10000 });
    console.log(`✅ Correctly redirected from /app to ${page.url()}`);

    expect(page.url()).toContain('/app/agent');
  });
});
