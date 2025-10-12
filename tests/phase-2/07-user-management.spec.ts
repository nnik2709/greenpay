import { test, expect } from '@playwright/test';
import {
  checkConsoleErrors,
  checkNetworkErrors,
  checkDatabaseErrors,
  waitForPageLoad,
  testData
} from '../utils/helpers';

/**
 * PHASE 2: User Management Tests
 * Tests user CRUD operations
 */

test.describe('User Management - List & View', () => {
  test('should display users list', async ({ page }) => {
    const consoleChecker = await checkConsoleErrors(page);
    const dbChecker = await checkDatabaseErrors(page);

    await page.goto('/users');
    await waitForPageLoad(page);

    // Should show users table
    await expect(page.locator('text=/user|manage/i')).toBeVisible();

    dbChecker.assertNoErrors();
    consoleChecker.assertNoErrors();
  });

  test('should have create user button', async ({ page }) => {
    await page.goto('/users');
    await waitForPageLoad(page);

    const createButton = page.locator('button:has-text("Create")');
    await expect(createButton).toBeVisible();
  });
});

test.describe('User Management - CRUD Operations', () => {
  test('[NEEDS VALIDATION] should create new user', async ({ page }) => {
    // Basic form exists (line 80) but unclear if functional

    const consoleChecker = await checkConsoleErrors(page);

    await page.goto('/users');
    await page.click('button:has-text("Create")');

    // Fill user form
    await page.fill('input[name="email"]', testData.randomEmail());
    await page.fill('input[name="password"]', 'Test@123456');

    // Select role
    await page.click('text=Select Role');
    await page.click('text=Counter_Agent');

    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    consoleChecker.assertNoErrors();
  });

  test('[PARTIAL] should edit user', async ({ page }) => {
    // Only email/role editable (line 92)

    await page.goto('/users');
    await waitForPageLoad(page);

    // Find edit button
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible({ timeout: 2000 })) {
      await editButton.click();

      // Should show edit form
      await expect(page.locator('input[name="email"]')).toBeVisible();
    }
  });

  test('[EXPECTED TO FAIL] should delete user', async ({ page }) => {
    // NOT IMPLEMENTED (from gap analysis)

    await page.goto('/users');
    await waitForPageLoad(page);

    const deleteButton = page.locator('button:has-text("Delete")').first();
    await expect(deleteButton).toBeVisible({ timeout: 5000 });

    await deleteButton.click();

    // Confirmation dialog
    await page.click('button:has-text("Confirm")');

    // User should be removed
    await page.waitForTimeout(1000);
  });

  test('should toggle user active status', async ({ page }) => {
    // Deactivate function exists (line 107)

    await page.goto('/users');
    await waitForPageLoad(page);

    const toggleButton = page.locator('button:has-text(/activate|deactivate/i)').first();
    if (await toggleButton.isVisible({ timeout: 2000 })) {
      await toggleButton.click();

      await page.waitForTimeout(1000);

      // Status should change
      console.log('✓ User status toggled');
    }
  });
});

test.describe('User Management - Login History', () => {
  test('[EXPECTED TO FAIL] should display login history', async ({ page }) => {
    // NOT IMPLEMENTED - shows "In Progress" toast (from gap analysis)

    await page.goto('/users');
    await waitForPageLoad(page);

    const historyButton = page.locator('button:has-text("Login History")').first();
    await expect(historyButton).toBeVisible({ timeout: 5000 });

    await historyButton.click();

    // Should show history dialog/page
    await expect(page.locator('text=/login.*history|session.*log/i')).toBeVisible();

    // Should show login records
    await expect(page.locator('table')).toBeVisible();
  });
});
