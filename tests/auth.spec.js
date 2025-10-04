import { test, expect } from '@playwright/test';

const TEST_USERS = {
  admin: { email: 'admin@example.com', password: 'admin123', role: 'Flex_Admin' },
  finance: { email: 'finance@example.com', password: 'finance123', role: 'Finance_Manager' },
  agent: { email: 'agent@example.com', password: 'agent123', role: 'Counter_Agent' },
  support: { email: 'support@example.com', password: 'support123', role: 'IT_Support' },
};

test.describe('Authentication Tests', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PNG Green Fees/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should login as admin successfully', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[type="email"]', TEST_USERS.admin.email);
    await page.fill('input[type="password"]', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');

    // Wait for dashboard heading to appear
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 });
  });

  test('should login as finance manager', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[type="email"]', TEST_USERS.finance.email);
    await page.fill('input[type="password"]', TEST_USERS.finance.password);
    await page.click('button[type="submit"]');

    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 });
  });

  test('should login as counter agent', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[type="email"]', TEST_USERS.agent.email);
    await page.fill('input[type="password"]', TEST_USERS.agent.password);
    await page.click('button[type="submit"]');

    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 });
  });

  test('should login as IT support', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[type="email"]', TEST_USERS.support.email);
    await page.fill('input[type="password"]', TEST_USERS.support.password);
    await page.click('button[type="submit"]');

    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 });
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/failed|invalid|error/i').first()).toBeVisible({ timeout: 5000 });
  });
});
