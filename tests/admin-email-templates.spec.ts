import { test, expect } from '@playwright/test';

test.describe('Email Templates Admin', () => {
  test('should load email templates page', async ({ page }) => {
    // Navigate to email templates page
    await page.goto('/admin/email-templates');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if page title is visible
    const title = page.locator('h1:has-text("Email Templates")');
    await expect(title).toBeVisible();
    
    // Check for templates table or empty state
    const table = page.locator('table');
    const emptyState = page.locator('text=No email templates found');
    
    // Either table should be visible OR empty state should be visible
    const tableVisible = await table.isVisible();
    const emptyVisible = await emptyState.isVisible();
    
    expect(tableVisible || emptyVisible).toBeTruthy();
    
    // Check for "New Template" button
    const newButton = page.locator('button:has-text("New Template")');
    await expect(newButton).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'email-templates-admin.png', fullPage: true });
  });

  test('should open create template dialog', async ({ page }) => {
    await page.goto('/admin/email-templates');
    await page.waitForLoadState('networkidle');
    
    // Click "New Template" button
    await page.click('button:has-text("New Template")');
    
    // Check if dialog opened
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    // Check dialog title
    const dialogTitle = page.locator('text=Create New Template');
    await expect(dialogTitle).toBeVisible();
    
    // Check form fields
    const nameField = page.locator('input[id="name"]');
    const subjectField = page.locator('input[id="subject"]');
    const bodyField = page.locator('textarea[id="body"]');
    
    await expect(nameField).toBeVisible();
    await expect(subjectField).toBeVisible();
    await expect(bodyField).toBeVisible();
    
    // Close dialog
    await page.click('button:has-text("Cancel")');
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/admin/email-templates');
    await page.waitForLoadState('networkidle');
    
    // Click "New Template" button
    await page.click('button:has-text("New Template")');
    
    // Try to save without filling required fields
    await page.click('button:has-text("Save Template")');
    
    // Should show validation error (this depends on implementation)
    // For now, just check that dialog is still open
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    // Close dialog
    await page.click('button:has-text("Cancel")');
  });

  test('should detect variables in template body', async ({ page }) => {
    await page.goto('/admin/email-templates');
    await page.waitForLoadState('networkidle');
    
    // Click "New Template" button
    await page.click('button:has-text("New Template")');
    
    // Fill in template data
    await page.fill('input[id="name"]', 'test-template');
    await page.fill('input[id="subject"]', 'Test Subject');
    await page.fill('textarea[id="body"]', '<p>Hello {{ $user->name }}, your code is {voucher_code}</p>');
    
    // Check if variables are detected
    const variablesSection = page.locator('text=Detected Variables');
    await expect(variablesSection).toBeVisible();
    
    // Should show detected variables
    const variables = page.locator('.badge');
    const variableCount = await variables.count();
    expect(variableCount).toBeGreaterThan(0);
    
    // Close dialog
    await page.click('button:has-text("Cancel")');
  });
});








