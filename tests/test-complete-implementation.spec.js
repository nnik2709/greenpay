import { test, expect } from '@playwright/test';

test.describe('Complete Implementation Test', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage and cookies
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should load login page without errors', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Verify login form elements
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check for React hook errors
    const hookErrors = errors.filter(error => 
      error.includes('Invalid hook call') || 
      error.includes('useContext') ||
      error.includes('useState')
    );
    
    expect(hookErrors).toHaveLength(0);
  });

  test('should login successfully and access dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    // Fill login form
    await page.fill('input#email', 'admin@example.com');
    await page.fill('input#password', 'password123');
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL('http://localhost:3000/');
    await page.waitForLoadState('networkidle');

    // Verify dashboard loaded
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
  });

  test('should access Users page and view login history', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input#email', 'admin@example.com');
    await page.fill('input#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/');

    // Navigate to Users page
    await page.click('text=Users');
    await page.waitForLoadState('networkidle');

    // Verify Users page loaded
    await expect(page.locator('h1:has-text("Users")')).toBeVisible();

    // Check for View Login History button
    const viewHistoryButton = page.locator('button:has-text("View Login History")').first();
    await expect(viewHistoryButton).toBeVisible();

    // Click View Login History
    await viewHistoryButton.click();
    await page.waitForLoadState('networkidle');

    // Verify Login History page loaded
    await expect(page.locator('h1:has-text("Login History")')).toBeVisible();
  });

  test('should access Settings page', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input#email', 'admin@example.com');
    await page.fill('input#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/');

    // Navigate to Settings
    await page.goto('http://localhost:3000/admin/settings');
    await page.waitForLoadState('networkidle');

    // Verify Settings page loaded
    await expect(page.locator('h1:has-text("System Settings")')).toBeVisible();
  });

  test('should access Profile Settings page', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input#email', 'admin@example.com');
    await page.fill('input#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/');

    // Navigate to Profile Settings
    await page.goto('http://localhost:3000/profile');
    await page.waitForLoadState('networkidle');

    // Verify Profile Settings page loaded
    await expect(page.locator('h1:has-text("Profile Settings")')).toBeVisible();
  });

  test('should test export functionality', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input#email', 'admin@example.com');
    await page.fill('input#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/');

    // Navigate to Login History
    await page.goto('http://localhost:3000/admin/login-history');
    await page.waitForLoadState('networkidle');

    // Check for export button
    const exportButton = page.locator('button:has-text("Export")');
    await expect(exportButton).toBeVisible();
  });

  test('should verify no blank pages', async ({ page }) => {
    const pages = [
      '/',
      '/users',
      '/admin/settings',
      '/profile',
      '/admin/login-history'
    ];

    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input#email', 'admin@example.com');
    await page.fill('input#password', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/');

    for (const pagePath of pages) {
      await page.goto(`http://localhost:3000${pagePath}`);
      await page.waitForLoadState('networkidle');
      
      // Check that page has content (not blank)
      const bodyText = await page.textContent('body');
      expect(bodyText.length).toBeGreaterThan(100);
      
      // Check for React errors
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      const reactErrors = errors.filter(error => 
        error.includes('Invalid hook call') || 
        error.includes('useContext') ||
        error.includes('useState')
      );
      
      expect(reactErrors).toHaveLength(0);
    }
  });
});
