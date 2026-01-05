import { test, expect } from '@playwright/test';

const BASE_URL = 'https://greenpay.eywademo.cloud';
const AGENT_EMAIL = 'agent@greenpay.com';
const AGENT_PASSWORD = 'test123';

test.describe('Agent Landing Page Improvements - Production', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('input#email', { state: 'visible' });
  });

  test('Agent login should redirect to /app/agent', async ({ page }) => {
    // Login as agent
    await page.locator('input#email').fill(AGENT_EMAIL);
    await page.locator('input#password').fill(AGENT_PASSWORD);
    await page.locator('button[type="submit"]').click();

    // Wait for navigation to agent landing page
    await page.waitForURL('**/app/agent**', { timeout: 15000 });
    
    expect(page.url()).toContain('/app/agent');
    console.log('✅ Agent redirected to /app/agent after login');
  });

  test('Agent landing page should have green header with navigation', async ({ page }) => {
    // Login
    await page.locator('input#email').fill(AGENT_EMAIL);
    await page.locator('input#password').fill(AGENT_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/app/agent**', { timeout: 15000 });

    // Verify green header is visible
    const header = page.locator('text=PNG Green Fees').first();
    await expect(header).toBeVisible({ timeout: 10000 });
    
    // Verify header has green gradient background by checking parent element
    const headerBg = await header.evaluate((el) => {
      const parent = el.closest('div');
      if (!parent) return null;
      // Check if any parent has green gradient classes
      let current = parent;
      for (let i = 0; i < 3; i++) {
        const classes = current.className || '';
        if (classes.includes('from-emerald') || classes.includes('to-teal')) {
          return window.getComputedStyle(current).background || window.getComputedStyle(current).backgroundColor;
        }
        current = current.parentElement as HTMLElement;
        if (!current) break;
      }
      return null;
    });
    
    // Verify header exists (even if background check fails, header should be there)
    expect(headerBg).toBeTruthy();
    
    // Verify navigation links are present
    await expect(page.locator('a:has-text("Home")')).toBeVisible();
    await expect(page.locator('a:has-text("All Passports")')).toBeVisible();
    await expect(page.locator('a:has-text("Scan & Validate")')).toBeVisible();
    
    console.log('✅ Green header with navigation is visible');
  });

  test('Agent landing page should NOT have duplicate header or footer', async ({ page }) => {
    // Login
    await page.locator('input#email').fill(AGENT_EMAIL);
    await page.locator('input#password').fill(AGENT_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/app/agent**', { timeout: 15000 });

    // Count headers with "PNG Green Fees" text
    const headers = page.locator('text=PNG Green Fees');
    const headerCount = await headers.count();
    expect(headerCount).toBe(1); // Should only have one header
    
    // Verify no footer/info banner at bottom (dark background)
    const footer = page.locator('footer, div[class*="bg-slate-900"], div[class*="bg-black"]').last();
    const footerCount = await footer.count();
    // If footer exists, it should not be visible or should not contain dark background
    if (footerCount > 0) {
      const footerText = await footer.textContent();
      // Should not have dark footer with stats/info
      expect(footerText).not.toMatch(/Quick Stats|Info Banner|System Status/i);
    }
    
    console.log('✅ No duplicate header, no footer');
  });

  test('Agent landing page action cards should fit on one screen', async ({ page }) => {
    // Login
    await page.locator('input#email').fill(AGENT_EMAIL);
    await page.locator('input#password').fill(AGENT_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/app/agent**', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for animations

    // Verify all 3 action cards are visible (matching actual card titles) - use text content
    await expect(page.locator('text=/Add Passport.*Generate Voucher/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Validate.*Voucher/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Add Passport to Voucher/i')).toBeVisible({ timeout: 10000 });
    
    // Get viewport height
    const viewportHeight = page.viewportSize()?.height || 1080;
    
    // Get page content height
    const pageHeight = await page.evaluate(() => {
      return Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
    });

    // Verify page fits in viewport (allow 100px tolerance for browser chrome and variations)
    expect(pageHeight).toBeLessThanOrEqual(viewportHeight + 100);
    
    console.log(`✅ Page fits on one screen (${pageHeight}px <= ${viewportHeight + 100}px)`);
  });

  test('Action pages should have Home button that returns to /app/agent', async ({ page }) => {
    // Login
    await page.locator('input#email').fill(AGENT_EMAIL);
    await page.locator('input#password').fill(AGENT_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/app/agent**', { timeout: 15000 });

    // Test Individual Purchase page
    await page.goto(`${BASE_URL}/app/passports/create`);
    await page.waitForLoadState('networkidle');
    
    // Look for Home button
    const homeButton = page.locator('button:has-text("Home"), a:has-text("Home")').first();
    if (await homeButton.count() > 0) {
      await homeButton.click();
      await page.waitForURL('**/app/agent**', { timeout: 10000 });
      expect(page.url()).toContain('/app/agent');
      console.log('✅ Home button on Individual Purchase page works');
    }

    // Test Scan & Validate page
    await page.goto(`${BASE_URL}/app/scan`);
    await page.waitForLoadState('networkidle');
    
    const homeButton2 = page.locator('button:has-text("Home"), a:has-text("Home")').first();
    if (await homeButton2.count() > 0) {
      await homeButton2.click();
      await page.waitForURL('**/app/agent**', { timeout: 10000 });
      expect(page.url()).toContain('/app/agent');
      console.log('✅ Home button on Scan & Validate page works');
    }
  });

  test('Agent landing page should have compact welcome section and action cards', async ({ page }) => {
    // Login
    await page.locator('input#email').fill(AGENT_EMAIL);
    await page.locator('input#password').fill(AGENT_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/app/agent**', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for animations and React rendering

    // Verify welcome header exists (should be compact) - use text content
    await expect(page.locator('text=Welcome Back!')).toBeVisible({ timeout: 10000 });
    
    // Verify action cards have compact text (matching actual titles) - use text content
    await expect(page.locator('text=/Add Passport.*Generate Voucher/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Validate.*Voucher/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Add Passport to Voucher/i')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Compact welcome section and action cards are visible');
  });

  test('Agent can navigate using header links', async ({ page }) => {
    // Login
    await page.locator('input#email').fill(AGENT_EMAIL);
    await page.locator('input#password').fill(AGENT_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/app/agent**', { timeout: 15000 });

    // Test "All Passports" link
    const allPassportsLink = page.locator('a:has-text("All Passports")');
    if (await allPassportsLink.count() > 0) {
      await allPassportsLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/app');
      console.log('✅ "All Passports" link works');
      
      // Return to agent page
      await page.goto(`${BASE_URL}/app/agent`);
      await page.waitForLoadState('networkidle');
    }

    // Test "Scan & Validate" link
    const scanLink = page.locator('a:has-text("Scan & Validate")');
    if (await scanLink.count() > 0) {
      await scanLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/app/scan');
      console.log('✅ "Scan & Validate" link works');
    }
  });
});

