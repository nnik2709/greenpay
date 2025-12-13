import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { USERS } from './test-data/form-data';

/**
 * Authentication Smoke Tests
 * Tests login/logout for all 4 user roles
 */

test.describe('Authentication Tests', () => {

  test('Flex_Admin can login successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.login(
      USERS.Flex_Admin.username,
      USERS.Flex_Admin.password
    );

    await loginPage.verifyLoginSuccess();

    // Verify we're on a protected route
    expect(page.url()).toContain('/app/');

    console.log('✅ Flex_Admin login successful');
  });

  test('Finance_Manager can login successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.login(
      USERS.Finance_Manager.username,
      USERS.Finance_Manager.password
    );

    await loginPage.verifyLoginSuccess();
    expect(page.url()).toContain('/app/');

    console.log('✅ Finance_Manager login successful');
  });

  test('Counter_Agent can login successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.login(
      USERS.Counter_Agent.username,
      USERS.Counter_Agent.password
    );

    await loginPage.verifyLoginSuccess();
    expect(page.url()).toContain('/app/');

    console.log('✅ Counter_Agent login successful');
  });

  test('IT_Support can login successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.login(
      USERS.IT_Support.username,
      USERS.IT_Support.password
    );

    await loginPage.verifyLoginSuccess();
    expect(page.url()).toContain('/app/');

    console.log('✅ IT_Support login successful');
  });

  test('Invalid credentials show error message', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.loginWithInvalidCredentials(
      'invalid@example.com',
      'wrongpassword'
    );

    await loginPage.verifyLoginError();

    console.log('✅ Invalid credentials handled correctly');
  });

  test('Empty email shows validation error', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigate();
    await loginPage.fillField(loginPage.passwordInput, 'somepassword');
    await loginPage.clickElement(loginPage.loginButton);

    // Should not redirect
    expect(page.url()).toContain('/login');

    console.log('✅ Empty email validation working');
  });

  test('Empty password shows validation error', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigate();
    await loginPage.fillField(loginPage.emailInput, 'test@example.com');
    await loginPage.clickElement(loginPage.loginButton);

    // Should not redirect
    expect(page.url()).toContain('/login');

    console.log('✅ Empty password validation working');
  });
});

test.describe('Session Persistence', () => {

  test('User remains logged in after page reload', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Login
    await loginPage.login(
      USERS.Flex_Admin.username,
      USERS.Flex_Admin.password
    );

    await loginPage.verifyLoginSuccess();

    // Reload page
    await page.reload();
    await loginPage.waitForPageReady();

    // Should still be logged in
    expect(page.url()).toContain('/app/');

    console.log('✅ Session persists after reload');
  });

  test('User can navigate between pages while logged in', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.login(
      USERS.Flex_Admin.username,
      USERS.Flex_Admin.password
    );

    await loginPage.verifyLoginSuccess();

    // Navigate to different pages
    const pages = ['/app/dashboard', '/app/passports', '/app/users'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await loginPage.waitForPageReady();

      // Should still be authenticated
      expect(page.url()).toContain('/app/');
    }

    console.log('✅ Navigation between pages works while logged in');
  });
});
