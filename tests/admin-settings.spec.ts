import { test, expect } from '@playwright/test';

test.describe('Admin Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input#email', 'admin@example.com');
    await page.fill('input#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  });

  test('should load Settings page from Admin menu', async ({ page }) => {
    // Navigate to settings via Admin menu
    await page.goto('/admin/settings');
    await page.waitForTimeout(2000);

    // Check if page loads
    const hasContent = await page.locator('text=System Settings').count() > 0;
    expect(hasContent).toBe(true);

    // Check for key elements
    await expect(page.locator('h1:has-text("System Settings")')).toBeVisible();
    await expect(page.locator('text=System Configuration')).toBeVisible();
    await expect(page.locator('text=Voucher Settings')).toBeVisible();
    await expect(page.locator('text=System Status')).toBeVisible();

    // Check for form elements
    await expect(page.locator('input[id="company_name"]')).toBeVisible();
    await expect(page.locator('input[id="voucher_validity_days"]')).toBeVisible();
    await expect(page.locator('input[id="default_amount"]')).toBeVisible();

    // Check for buttons
    await expect(page.locator('button:has-text("Save Settings")')).toBeVisible();
    await expect(page.locator('button:has-text("Reset to Defaults")')).toBeVisible();
  });

  test('should update settings successfully', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.waitForTimeout(2000);

    // Update company name
    await page.fill('input[id="company_name"]', 'Test Company Name');
    
    // Update voucher validity
    await page.fill('input[id="voucher_validity_days"]', '45');
    
    // Save settings
    await page.click('button:has-text("Save Settings")');
    
    // Check for success message
    await expect(page.locator('text=Settings Saved!')).toBeVisible();
  });

  test('should reset settings to defaults', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.waitForTimeout(2000);

    // Change some values
    await page.fill('input[id="company_name"]', 'Changed Name');
    await page.fill('input[id="voucher_validity_days"]', '90');
    
    // Reset to defaults
    await page.click('button:has-text("Reset to Defaults")');
    
    // Check for reset message
    await expect(page.locator('text=Settings have been reset')).toBeVisible();
    
    // Verify values are reset
    const companyName = await page.inputValue('input[id="company_name"]');
    const validityDays = await page.inputValue('input[id="voucher_validity_days"]');
    
    expect(companyName).toBe('PNG Green Fees System');
    expect(validityDays).toBe('30');
  });

  test('should show system status', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.waitForTimeout(2000);

    // Check system status section
    await expect(page.locator('text=System Status')).toBeVisible();
    await expect(page.locator('text=Database')).toBeVisible();
    await expect(page.locator('text=Storage')).toBeVisible();
    await expect(page.locator('text=Edge Functions')).toBeVisible();
    
    // Should have status indicators
    const statusIndicators = await page.locator('.text-green-600, .text-red-600').count();
    expect(statusIndicators).toBeGreaterThan(0);
  });
});








