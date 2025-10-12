import { test, expect } from '@playwright/test';

test.describe('Debug Revenue Reports', () => {
  test('should load revenue reports page and check for errors', async ({ page }) => {
    // Navigate to revenue reports page
    await page.goto('/reports/revenue-generated');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'revenue-reports-debug.png', fullPage: true });
    
    // Check if page title is visible
    const title = page.locator('h1:has-text("Revenue Generated Reports")');
    await expect(title).toBeVisible();
    
    // Check for any error messages
    const errorElements = page.locator('[class*="error"], [class*="Error"]');
    const errorCount = await errorElements.count();
    console.log(`Found ${errorCount} error elements`);
    
    // Check console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Wait a bit to capture console messages
    await page.waitForTimeout(2000);
    
    console.log('Console messages:', consoleMessages);
    
    // Check if loading indicator is gone
    const loadingIndicator = page.locator('text=Loading revenue data...');
    const isLoading = await loadingIndicator.isVisible();
    console.log(`Loading indicator visible: ${isLoading}`);
    
    // Check stats cards
    const statsCards = page.locator('.bg-slate-50');
    const statsCount = await statsCards.count();
    console.log(`Found ${statsCount} stats cards`);
    
    // Check if any stats show non-zero values
    const totalRecords = page.locator('text=Total Records').locator('..').locator('.text-2xl');
    const recordsValue = await totalRecords.textContent();
    console.log(`Total Records value: ${recordsValue}`);
  });
});

